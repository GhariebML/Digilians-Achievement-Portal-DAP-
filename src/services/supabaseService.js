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
    // Client-side initialization returns true now as connection state is managed securely on backend API
    console.log("Supabase Service initialized via Backend API Gateway.");
    return true;
  }

  // ==========================================
  // AUTHENTICATION GATEWAY
  // ==========================================
  static async registerStudent({ name, email, password, confirmPassword }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword: confirmPassword || password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register student account.');
    }
    return data;
  }

  static async verifyOtp({ email, otpCode }) {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'OTP verification failed.');
    }
    // Set token on successful verification
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    return data;
  }

  static async resendOtp({ email }) {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend verification code.');
    }
    return data;
  }

  static async login({ email, password }) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.unverified) {
        // Return structured unverified state so frontend can switch to OTP entry screen
        return data;
      }
      throw new Error(data.error || 'Invalid email or password.');
    }
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    return data;
  }

  static async restoreSession() {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.accessToken) {
        this.setToken(data.accessToken);
        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${data.accessToken}` }
        });
        if (meRes.ok) {
          const profile = await meRes.json();
          return profile.user;
        }
      }
      return null;
    } catch (err) {
      console.warn("Session restoration failed:", err);
      return null;
    }
  }

  static async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });
    } catch (err) {
      console.error("Logout request error:", err);
    }
    this.setToken(null);
    return true;
  }

  static async forgotPassword({ email }) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit password recovery request.');
    }
    return data;
  }

  static async resetPassword({ email, otpCode, newPassword }) {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode, newPassword })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password.');
    }
    return data;
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
