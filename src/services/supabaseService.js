import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Listen to auth state changes to keep token updated dynamically
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    SupabaseService.setToken(session.access_token);
  } else {
    SupabaseService.setToken(null);
  }
});

export class SupabaseService {
  static token = null;

  static setToken(newToken) {
    this.token = newToken;
    if (newToken) {
      localStorage.setItem('dap_access_token', newToken);
    } else {
      localStorage.removeItem('dap_access_token');
    }
  }

  static getToken() {
    return this.token || localStorage.getItem('dap_access_token');
  }

  static initialize(url, key) {
    console.log("Supabase Client initialized on frontend.");
    return true;
  }

  // ==========================================
  // AUTHENTICATION GATEWAY
  // ==========================================
  static async registerStudent({ name, email, password, confirmPassword }) {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }

    let authData = null;
    let authError = null;

    try {
      const res = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'student'
          }
        }
      });
      authData = res.data;
      authError = res.error;
    } catch (e) {
      authError = e;
    }

    // If Supabase throws a 500 error because the email provider failed to send the email,
    // the user is often still successfully created in the database!
    // Since "Confirm email" is disabled, we can just try to log them in directly to bypass the crash.
    if (authError) {
      const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      // If login succeeds, it means the account was created despite the 500 error!
      if (loginData && loginData.session) {
        return {
          message: 'Registration successful.',
          email,
          user: loginData.user,
          session: loginData.session
        };
      }
      
      // If login also fails, throw the original error
      throw new Error(authError.message || 'Error during registration');
    }

    return {
      message: 'Registration successful.',
      email,
      user: authData?.user,
      session: authData?.session
    };
  }

  static async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabaseClient.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup'
    });

    if (error) {
      throw new Error(error.message);
    }

    const sessionUser = data.user;
    if (!sessionUser) {
      throw new Error('Verification succeeded but no session was established.');
    }

    // Retrieve full profile from profiles table
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .maybeSingle();

    const userData = {
      id: sessionUser.id,
      name: profile?.full_name || sessionUser.user_metadata?.full_name || '',
      email: sessionUser.email,
      role: profile?.role || 'student',
      email_verified: true,
      created_at: sessionUser.created_at
    };

    if (data.session) {
      this.setToken(data.session.access_token);
    }

    return {
      message: 'Account verified and active.',
      accessToken: data.session?.access_token,
      user: userData
    };
  }

  static async resendOtp({ email }) {
    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      message: 'A new OTP code has been sent to your email.'
    };
  }

  static async login({ email, password }) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const errMsg = error.message.toLowerCase();
      if (errMsg.includes('email not confirmed') || errMsg.includes('confirm your email')) {
        // Trigger verification resend automatically
        try {
          await supabaseClient.auth.resend({ type: 'signup', email });
        } catch (resendErr) {
          console.warn("Auto-resend of signup confirmation code failed:", resendErr);
        }
        return {
          unverified: true,
          email
        };
      }
      throw new Error(error.message);
    }

    const sessionUser = data.user;
    if (!sessionUser) {
      throw new Error('Sign in succeeded but no user was returned.');
    }

    // Fetch profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .maybeSingle();

    const userData = {
      id: sessionUser.id,
      name: profile?.full_name || sessionUser.user_metadata?.full_name || '',
      email: sessionUser.email,
      role: profile?.role || 'student',
      email_verified: true,
      created_at: sessionUser.created_at
    };

    if (data.session) {
      this.setToken(data.session.access_token);
    }

    return {
      message: 'Login successful.',
      accessToken: data.session?.access_token,
      user: userData
    };
  }

  static async restoreSession() {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error || !session) return null;

      const sessionUser = session.user;
      if (!sessionUser) return null;

      // Fetch profile
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      const userData = {
        id: sessionUser.id,
        name: profile?.full_name || sessionUser.user_metadata?.full_name || '',
        email: sessionUser.email,
        role: profile?.role || 'student',
        email_verified: true,
        created_at: sessionUser.created_at
      };

      this.setToken(session.access_token);
      return userData;
    } catch (err) {
      console.warn("Session restoration failed:", err);
      return null;
    }
  }

  static async logout() {
    try {
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error("Logout request error:", err);
    }
    this.setToken(null);
    return true;
  }

  static async forgotPassword({ email }) {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      message: 'If this email exists in our system, an OTP code has been sent.'
    };
  }

  static async resetPassword({ email, otpCode, newPassword }) {
    // 1. Verify OTP code for recovery type
    const { error: verifyError } = await supabaseClient.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'recovery'
    });

    if (verifyError) {
      throw new Error(verifyError.message);
    }

    // 2. Perform the update password operation
    const { error: updateError } = await supabaseClient.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      message: 'Password reset successfully. You can now log in.'
    };
  }

  static async getAllStudents() {
    const res = await fetch('/api/admin/students', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch student roster.');
    }
    return data;
  }

  // ==========================================
  // COMPETITIONS CRUD WRAPPERS
  // ==========================================
  static async getStudentSubmissions(userId) {
    const res = await fetch('/api/competitions', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to retrieve your submissions.');
    }
    return data;
  }

  static async getAllSubmissions() {
    const res = await fetch('/api/competitions', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to retrieve all submissions.');
    }
    return data;
  }

  static async createSubmission(competitionData, userId, userName) {
    const res = await fetch('/api/competitions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(competitionData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create competition submission.');
    }
    return data;
  }

  static async updateSubmission(competitionId, updateData, userId, userName) {
    const res = await fetch(`/api/competitions/${competitionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      },
      body: JSON.stringify(updateData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update competition submission.');
    }
    return data;
  }

  static async deleteSubmission(competitionId, userId, userName) {
    const res = await fetch(`/api/competitions/${competitionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete competition submission.');
    }
    return true;
  }

  // ==========================================
  // ACTIVITY LOGS & AUDIT WRAPPERS
  // ==========================================
  static async logActivity({ userId, action, details }) {
    // Handled automatically server-side on CRUD endpoints. Stub left for backwards compatibility.
    return true;
  }

  static async getStudentLogs(userId) {
    const res = await fetch('/api/logs', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to retrieve activity logs.');
    }
    return data;
  }

  static async getAllLogs() {
    const res = await fetch('/api/admin/logs', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to retrieve system activity logs.');
    }
    return data;
  }

  static async getAdminStats() {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch administrative console statistics.');
    }
    return data;
  }

  static async forceReSyncAll() {
    const res = await fetch('/api/admin/sync-all', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.getToken()}` }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to execute re-sync operation.');
    }
    return data;
  }

  // ==========================================
  // FILE UPLOAD AND BLOB WRAPPERS
  // ==========================================
  static async uploadCompetitionProof(file, userId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.getToken()}`
            },
            body: JSON.stringify({ filename: file.name, fileData: base64Data })
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'File upload failed');
          }
          const data = await res.json();
          resolve(data.path);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  static getCompetitionProofUrl(path) {
    if (!path) return null;
    return `https://pmqqtxekwniywihzkkio.supabase.co/storage/v1/object/public/competition-proofs/${path}`;
  }
}
