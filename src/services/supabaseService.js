import { createClient } from '@supabase/supabase-js';

export class SupabaseService {
  static client = null;
  static isFallbackMode = true;

  static initialize(url, key) {
    if (url && key && url.startsWith('http')) {
      try {
        this.client = createClient(url, key);
        this.isFallbackMode = false;
        console.log("Supabase client initialized successfully.");
        return true;
      } catch (err) {
        console.error("Failed to initialize Supabase client, falling back to secure local cache.", err);
        this.isFallbackMode = true;
      }
    } else {
      this.isFallbackMode = true;
    }
    return false;
  }

  // ==========================================
  // AUTHENTICATION WRAPPERS
  // ==========================================
  static async registerStudent({ name, email, password }) {
    if (!this.isFallbackMode && this.client) {
      const { data: authData, error: authError } = await this.client.auth.signUp({
        email,
        password,
        options: { data: { name, role: 'student' } }
      });
      if (authError) throw authError;

      const { data: userData, error: userError } = await this.client
        .from('users')
        .insert([{ auth_id: authData.user.id, name, email, role: 'student' }])
        .select()
        .single();
      if (userError) throw userError;

      // Log registration
      await this.logActivity({ userId: userData.id, action: 'User Registration', details: `${name} registered a new student account.` });
      return { user: userData, session: authData.session };
    } else {
      // Local fallback simulation
      const users = JSON.parse(localStorage.getItem('dap_users') || '[]');
      if (users.some(u => u.email === email)) {
        throw new Error('User with this email already exists.');
      }
      const newUser = {
        id: crypto.randomUUID(),
        auth_id: crypto.randomUUID(),
        name,
        email,
        password, // stored for simulation only
        role: 'student',
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem('dap_users', JSON.stringify(users));

      // Log registration
      const logs = JSON.parse(localStorage.getItem('dap_activity_logs') || '[]');
      logs.push({
        id: crypto.randomUUID(),
        user_id: newUser.id,
        action: 'User Registration',
        details: `${name} registered a new student account.`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('dap_activity_logs', JSON.stringify(logs));

      return { user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, created_at: newUser.created_at }, session: { access_token: 'mock-jwt-token-student' } };
    }
  }

  static async login({ email, password }) {
    if (!this.isFallbackMode && this.client) {
      const { data: authData, error: authError } = await this.client.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: userData, error: userError } = await this.client
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();
      if (userError) throw userError;

      await this.logActivity({ userId: userData.id, action: 'User Login', details: `${userData.name} logged in.` });
      return { user: userData, session: authData.session };
    } else {
      // Local fallback simulation
      // Check if admin login
      if (email === 'admin@digilians.gov.eg' && password === 'Admin123!') {
        const adminUser = { id: 'admin-master-id', name: 'Executive Admin', email: 'admin@digilians.gov.eg', role: 'admin', created_at: new Date().toISOString() };
        // Log admin login
        const logs = JSON.parse(localStorage.getItem('dap_activity_logs') || '[]');
        logs.push({
          id: crypto.randomUUID(),
          user_id: adminUser.id,
          action: 'Admin Login',
          details: `Executive Admin logged into the management dashboard.`,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('dap_activity_logs', JSON.stringify(logs));
        return { user: adminUser, session: { access_token: 'mock-jwt-token-admin' } };
      }

      const users = JSON.parse(localStorage.getItem('dap_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error('Invalid email or password. (For admin access, use admin@digilians.gov.eg / Admin123!)');
      }

      // Log student login
      const logs = JSON.parse(localStorage.getItem('dap_activity_logs') || '[]');
      logs.push({
        id: crypto.randomUUID(),
        user_id: user.id,
        action: 'User Login',
        details: `${user.name} logged in.`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('dap_activity_logs', JSON.stringify(logs));

      return { user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at }, session: { access_token: 'mock-jwt-token-student' } };
    }
  }

  static async logout() {
    if (!this.isFallbackMode && this.client) {
      await this.client.auth.signOut();
    }
    return true;
  }

  static async getAllStudents() {
    if (!this.isFallbackMode && this.client) {
      const { data, error } = await this.client.from('users').select('*').eq('role', 'student');
      if (error) throw error;
      return data;
    } else {
      const users = JSON.parse(localStorage.getItem('dap_users') || '[]');
      return users.filter(u => u.role === 'student').map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at }));
    }
  }

  // ==========================================
  // COMPETITIONS CRUD WRAPPERS
  // ==========================================
  static async getStudentSubmissions(userId) {
    if (!this.isFallbackMode && this.client) {
      const { data, error } = await this.client.from('competitions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const comps = JSON.parse(localStorage.getItem('dap_competitions') || '[]');
      return comps.filter(c => c.user_id === userId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  static async getAllSubmissions() {
    if (!this.isFallbackMode && this.client) {
      const { data, error } = await this.client.from('competitions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const comps = JSON.parse(localStorage.getItem('dap_competitions') || '[]');
      return comps.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  static async createSubmission(competitionData, userId, userName) {
    if (!this.isFallbackMode && this.client) {
      const record = { ...competitionData, user_id: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const { data, error } = await this.client.from('competitions').insert([record]).select().single();
      if (error) throw error;
      
      await this.logActivity({ userId, action: 'New Submission', details: `${userName} submitted a new competition: ${competitionData.competition_name}` });
      return data;
    } else {
      const comps = JSON.parse(localStorage.getItem('dap_competitions') || '[]');
      const newRecord = {
        id: crypto.randomUUID(),
        user_id: userId,
        ...competitionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      comps.push(newRecord);
      localStorage.setItem('dap_competitions', JSON.stringify(comps));

      // Log creation
      const logs = JSON.parse(localStorage.getItem('dap_activity_logs') || '[]');
      logs.push({
        id: crypto.randomUUID(),
        user_id: userId,
        action: 'New Submission',
        details: `${userName} submitted a new competition: ${competitionData.competition_name}`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('dap_activity_logs', JSON.stringify(logs));

      return newRecord;
    }
  }

  static async updateSubmission(competitionId, updateData, userId, userName) {
    if (!this.isFallbackMode && this.client) {
      const { data, error } = await this.client.from('competitions')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', competitionId)
        .select()
        .single();
      if (error) throw error;

      await this.logActivity({ userId, action: 'Submission Update', details: `${userName} updated ${data.competition_name} status to ${updateData.status}` });
      return data;
    } else {
      const comps = JSON.parse(localStorage.getItem('dap_competitions') || '[]');
      const index = comps.findIndex(c => c.id === competitionId);
      if (index === -1) throw new Error('Competition record not found.');
      
      const compName = comps[index].competition_name;
      comps[index] = { ...comps[index], ...updateData, updated_at: new Date().toISOString() };
      localStorage.setItem('dap_competitions', JSON.stringify(comps));

      // Log update
      const logs = JSON.parse(localStorage.getItem('dap_activity_logs') || '[]');
      logs.push({
        id: crypto.randomUUID(),
        user_id: userId,
        action: 'Submission Update',
        details: `${userName} updated ${compName} status to ${updateData.status}`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('dap_activity_logs', JSON.stringify(logs));

      return comps[index];
    }
  }

  static async deleteSubmission(competitionId, userId, userName) {
    if (!this.isFallbackMode && this.client) {
      const { data: comp, error: fetchErr } = await this.client.from('competitions').select('competition_name').eq('id', competitionId).single();
      const { error } = await this.client.from('competitions').delete().eq('id', competitionId);
      if (error) throw error;

      await this.logActivity({ userId, action: 'Submission Delete', details: `${userName} deleted competition: ${comp?.competition_name || competitionId}` });
      return true;
    } else {
      let comps = JSON.parse(localStorage.getItem('dap_competitions') || '[]');
      const target = comps.find(c => c.id === competitionId);
      if (!target) throw new Error('Competition not found.');

      comps = comps.filter(c => c.id !== competitionId);
      localStorage.setItem('dap_competitions', JSON.stringify(comps));

      // Log delete
      const logs = JSON.parse(localStorage.getItem('dap_activity_logs') || '[]');
      logs.push({
        id: crypto.randomUUID(),
        user_id: userId,
        action: 'Submission Delete',
        details: `${userName} deleted competition: ${target.competition_name}`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('dap_activity_logs', JSON.stringify(logs));

      return true;
    }
  }

  // ==========================================
  // ACTIVITY LOGS WRAPPERS
  // ==========================================
  static async logActivity({ userId, action, details }) {
    if (!this.isFallbackMode && this.client) {
      const { error } = await this.client.from('activity_logs').insert([{ user_id: userId, action, details }]);
      if (error) console.error("Error logging activity to Supabase:", error);
    }
  }

  static async getStudentLogs(userId) {
    if (!this.isFallbackMode && this.client) {
      const { data, error } = await this.client.from('activity_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const logs = JSON.parse(localStorage.getItem('dap_activity_logs') || '[]');
      return logs.filter(l => l.user_id === userId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }

  static async getAllLogs() {
    if (!this.isFallbackMode && this.client) {
      const { data, error } = await this.client.from('activity_logs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } else {
      const logs = JSON.parse(localStorage.getItem('dap_activity_logs') || '[]');
      return logs.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }
}
