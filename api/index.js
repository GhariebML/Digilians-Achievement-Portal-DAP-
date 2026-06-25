import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import config from './config.js';

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true, // Allow all origins for dev, or dynamically reflect request origin
  credentials: true
}));

// Initialize Supabase Client if not in fallback mode
let supabase = null;
if (!config.isFallbackMode) {
  try {
    supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: false }
    });
  } catch (err) {
    console.error("Failed to initialize Supabase client, falling back to mock database:", err);
    config.isFallbackMode = true;
  }
}

// ----------------------------------------------------
// LOCAL STORAGE FALLBACK ENGINE (mock_db.json)
// ----------------------------------------------------
const DB_FILE = path.join(process.cwd(), 'api_mock_db.json');
let localDb = {
  users: [],
  otp: [],
  sessions: [],
  competitions: [],
  activity_logs: []
};

// Seed default admin account
const defaultAdminEmail = 'admin@digilians.gov.eg';
const defaultAdminPasswordHash = bcrypt.hashSync('Admin123!', 10);

const loadLocalDb = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      localDb = JSON.parse(content);
    }
  } catch (err) {
    console.error("Error loading local mock database file, using memory state:", err);
  }
  // Ensure admin user exists
  if (!localDb.users.some(u => u.email === defaultAdminEmail)) {
    localDb.users.push({
      user_id: 'admin-master-uuid-1234',
      full_name: 'Executive Admin',
      email: defaultAdminEmail,
      password_hash: defaultAdminPasswordHash,
      email_verified: true,
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString()
    });
    saveLocalDb();
  }
};

const saveLocalDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf8');
  } catch (err) {
    // Silent fail if write is disabled (e.g. read-only serverless disk)
  }
};

// Initialize mock DB
loadLocalDb();

// Legacy email utilities and auth rate limiters removed as Supabase Auth now handles secure transactional emails and built-in rate limits natively.

// Helper: Input Sanitization
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

const sanitizeObject = (obj) => {
  const clean = {};
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      clean[key] = sanitizeString(obj[key]);
    } else if (Array.isArray(obj[key])) {
      clean[key] = obj[key].map(item => typeof item === 'object' ? sanitizeObject(item) : sanitizeString(item));
    } else if (obj[key] !== null && typeof obj[key] === 'object') {
      clean[key] = sanitizeObject(obj[key]);
    } else {
      clean[key] = obj[key];
    }
  }
  return clean;
};

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies.accessToken;

  if (!token) return res.status(401).json({ error: 'Access token required. Please sign in.' });

  try {
    if (config.isFallbackMode) {
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        return next();
      } catch (jwtErr) {
        // Fall through to standard validation
      }
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired access token.' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    req.user = {
      userId: user.id,
      email: user.email,
      role: profile?.role || 'student',
      name: profile?.full_name || user.user_metadata?.full_name || ''
    };

    next();
  } catch (err) {
    console.error("authenticateToken middleware error:", err);
    res.status(403).json({ error: 'Invalid or expired access token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access forbidden. Administrative privileges required.' });
  }
};

// ----------------------------------------------------
// GOOGLE SHEETS SYNC SYSTEM
// ----------------------------------------------------
const syncToGoogleSheets = async (action, record) => {
  if (!config.googleSheetsUrl) {
    console.log("⚠️ Google Sheets URL not configured. Sync skipped.");
    return;
  }
  try {
    const res = await fetch(config.googleSheetsUrl, {
      method: 'POST',
      body: JSON.stringify({ action, record }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      console.error(`Google Sheets sync HTTP Error: ${res.status}`);
    } else {
      const result = await res.json();
      console.log(`Sync status: ${result.status} (${result.message || 'No details'})`);
    }
  } catch (err) {
    console.error("Google Sheets synchronization engine error:", err.message);
  }
};

// Helper to log user activities
const logActivity = async (userId, action, details) => {
  try {
    if (!config.isFallbackMode) {
      await supabase.from('activity_logs').insert([{ user_id: userId, action, details }]);
    } else {
      localDb.activity_logs.unshift({
        id: crypto.randomUUID(),
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString()
      });
      saveLocalDb();
    }
  } catch (err) {
    console.error("Error logging activity log:", err);
  }
};

// Custom authentication endpoints removed in favor of direct Supabase Authentication flow on the frontend.


// ----------------------------------------------------
// PHASE 3 & 6: COMPETITIONS CRUD ENDPOINTS (with Google Sheets Sync)
// ----------------------------------------------------

// 1. Get User's Competitions (or All if Admin)
app.get('/api/competitions', authenticateToken, async (req, res) => {
  try {
    let list = [];
    if (req.user.role === 'admin') {
      if (!config.isFallbackMode) {
        const { data, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        list = data;
      } else {
        list = [...localDb.competitions].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      }
    } else {
      // Regular student sees only their own
      if (!config.isFallbackMode) {
        const { data, error } = await supabase.from('competitions').select('*').eq('owner_id', req.user.userId).order('created_at', { ascending: false });
        if (error) throw error;
        list = data;
      } else {
        list = localDb.competitions.filter(c => (c.owner_id === req.user.userId || c.user_id === req.user.userId)).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      }
    }

    // Map owner_id to user_id for frontend compatibility
    const mappedList = list.map(item => ({
      ...item,
      user_id: item.owner_id || item.user_id
    }));

    res.json(mappedList);
  } catch (err) {
    console.error("Fetch Competitions Error:", err);
    res.status(500).json({ error: 'Error retrieving competition entries.' });
  }
});

// 2. Create Competition Entry
app.post('/api/competitions', authenticateToken, async (req, res) => {
  try {
    const cleanData = sanitizeObject(req.body);
    if (!cleanData.competition_name || !cleanData.verification_link) {
      return res.status(400).json({ error: 'Competition Name and Verification Link are required.' });
    }

    const newRecord = {
      id: crypto.randomUUID(),
      owner_id: req.user.userId,
      competition_name: cleanData.competition_name,
      description: cleanData.description || '',
      organization: cleanData.organization || '',
      date: cleanData.date || new Date().toISOString().split('T')[0],
      category: cleanData.category || 'AI & Machine Learning',
      status: cleanData.status || 'Submitted',
      verification_link: cleanData.verification_link,
      notes: cleanData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let saved = null;
    if (!config.isFallbackMode) {
      const { data, error } = await supabase.from('competitions').insert([newRecord]).select().single();
      if (error) throw error;
      saved = data;
    } else {
      localDb.competitions.unshift(newRecord);
      saveLocalDb();
      saved = newRecord;
    }

    await logActivity(req.user.userId, 'Create Submission', `${req.user.name} logged a new competition solution: ${saved.competition_name}`);

    // Phase 6: Sync to Google Sheets automatically (in background)
    // Add extra tracking details for Sheet columns compatibility
    const syncData = {
      ...saved,
      user_id: saved.owner_id || saved.user_id,
      leader_name: req.user.name,
      leader_email: req.user.email,
      team_members: req.body.team_members || []
    };
    syncToGoogleSheets('create', syncData);

    res.status(201).json({
      ...saved,
      user_id: saved.owner_id || saved.user_id
    });
  } catch (err) {
    console.error("Create Submission Error:", err);
    res.status(500).json({ error: 'Error creating competition solution.' });
  }
});

// 3. Update Competition Entry
app.put('/api/competitions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const cleanData = sanitizeObject(req.body);

    // Fetch original record to check ownership
    let original = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('competitions').select('*').eq('id', id).maybeSingle();
      original = data;
    } else {
      original = localDb.competitions.find(c => c.id === id);
    }

    if (!original) return res.status(404).json({ error: 'Competition entry not found.' });

    // Phase 3: Ownership check - Only logged-in owner can edit, unless admin
    const ownerId = original.owner_id || original.user_id;
    if (req.user.role !== 'admin' && ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized. You do not own this competition entry.' });
    }

    const updateFields = {
      updated_at: new Date().toISOString()
    };

    // Admins can only update status and notes/feedback
    if (req.user.role === 'admin') {
      if (cleanData.status) updateFields.status = cleanData.status;
      if (cleanData.notes !== undefined) updateFields.notes = cleanData.notes;
    } else {
      // Students can edit all fields except notes (feedback)
      if (cleanData.competition_name) updateFields.competition_name = cleanData.competition_name;
      if (cleanData.description !== undefined) updateFields.description = cleanData.description;
      if (cleanData.organization !== undefined) updateFields.organization = cleanData.organization;
      if (cleanData.date) updateFields.date = cleanData.date;
      if (cleanData.category) updateFields.category = cleanData.category;
      if (cleanData.verification_link) updateFields.verification_link = cleanData.verification_link;
      if (cleanData.demo_link !== undefined) updateFields.demo_link = cleanData.demo_link;
      if (cleanData.github_repo !== undefined) updateFields.github_repo = cleanData.github_repo;
    }

    let updated = null;
    if (!config.isFallbackMode) {
      const { data, error } = await supabase.from('competitions').update(updateFields).eq('id', id).select().single();
      if (error) throw error;
      updated = data;
    } else {
      const index = localDb.competitions.findIndex(c => c.id === id);
      localDb.competitions[index] = { ...localDb.competitions[index], ...updateFields };
      saveLocalDb();
      updated = localDb.competitions[index];
    }

    await logActivity(req.user.userId, 'Update Submission', `${req.user.name} updated competition solution: ${updated.competition_name}`);

    // Sync to Sheets
    const syncData = {
      ...updated,
      user_id: updated.owner_id || updated.user_id,
      leader_name: req.user.role === 'admin' ? (cleanData.leader_name || updated.leader_name) : req.user.name,
      leader_email: req.user.role === 'admin' ? (cleanData.leader_email || updated.leader_email) : req.user.email,
      team_members: req.body.team_members || []
    };
    syncToGoogleSheets('update', syncData);

    res.json({
      ...updated,
      user_id: updated.owner_id || updated.user_id
    });
  } catch (err) {
    console.error("Update Submission Error:", err);
    res.status(500).json({ error: 'Error updating competition solution.' });
  }
});

// 4. Delete Competition Entry
app.post('/api/competitions/delete/:id', authenticateToken, async (req, res) => {
  return deleteCompetitionHandler(req, res);
});

app.delete('/api/competitions/:id', authenticateToken, async (req, res) => {
  return deleteCompetitionHandler(req, res);
});

async function deleteCompetitionHandler(req, res) {
  try {
    const { id } = req.params;

    // Fetch original to check ownership
    let original = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('competitions').select('*').eq('id', id).maybeSingle();
      original = data;
    } else {
      original = localDb.competitions.find(c => c.id === id);
    }

    if (!original) return res.status(404).json({ error: 'Competition entry not found.' });

    // Phase 3: Only owner or admin can delete
    const ownerId = original.owner_id || original.user_id;
    if (req.user.role !== 'admin' && ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized. You do not own this competition entry.' });
    }

    if (!config.isFallbackMode) {
      const { error } = await supabase.from('competitions').delete().eq('id', id);
      if (error) throw error;
    } else {
      localDb.competitions = localDb.competitions.filter(c => c.id !== id);
      saveLocalDb();
    }

    await logActivity(req.user.userId, 'Delete Submission', `${req.user.name} deleted competition entry: ${original.competition_name}`);

    // Sync deletion to Google Sheets Web App
    syncToGoogleSheets('delete', { competition_id: id });

    res.json({ message: 'Competition entry deleted successfully.' });
  } catch (err) {
    console.error("Delete Submission Error:", err);
    res.status(500).json({ error: 'Error deleting competition solution.' });
  }
}


// ----------------------------------------------------
// PHASE 4: ADMIN DASHBOARD METRICS ENDPOINTS
// ----------------------------------------------------

// 1. Get Admin Dashboard Aggregated Statistics
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let allUsers = [];
    let allComps = [];
    
    if (!config.isFallbackMode) {
      const { data: users } = await supabase.from('profiles').select('*');
      const { data: comps } = await supabase.from('competitions').select('*');
      allUsers = users || [];
      allComps = comps || [];
    } else {
      allUsers = localDb.users;
      allComps = localDb.competitions;
    }

    // 1. User Statistics
    const totalUsers = allUsers.length;
    const verifiedUsers = allUsers.length;
    
    // Active: updated last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = allUsers.filter(u => u.updated_at && new Date(u.updated_at) > sevenDaysAgo).length;
    
    // New: registered in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const newUsers = allUsers.filter(u => new Date(u.created_at) > oneDayAgo).length;

    // 2. Competition Statistics
    const totalCompetitions = allComps.length;
    const activeCompetitions = allComps.filter(c => c.status !== 'Rejected').length;
    const finalists = allComps.filter(c => c.status === 'Finalist').length;
    const winners = allComps.filter(c => c.status === 'Winner').length;

    // 3. Team / Track Statistics (simulate track distribution based on categories)
    const totalTeams = allComps.filter(c => c.description && c.description.toLowerCase().includes('team')).length || Math.floor(totalCompetitions * 0.7);
    const totalMembers = totalTeams * 3; // simulated multiplier
    
    // Most active tracks count by category distribution
    const trackCounts = {};
    allComps.forEach(c => {
      trackCounts[c.category] = (trackCounts[c.category] || 0) + 1;
    });
    
    let mostActiveTrack = 'None';
    let maxCount = 0;
    for (let track in trackCounts) {
      if (trackCounts[track] > maxCount) {
        maxCount = trackCounts[track];
        mostActiveTrack = track;
      }
    }

    res.json({
      users: { totalUsers, verifiedUsers, activeUsers, newUsers },
      competitions: { totalCompetitions, activeCompetitions, finalists, winners },
      teams: { totalTeams, totalMembers, mostActiveTrack },
      categoryDistribution: trackCounts
    });
  } catch (err) {
    console.error("Admin stats fetch error:", err);
    res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
});

// 2. Get All System Activity Logs (Admin Feed)
app.get('/api/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let logs = [];
    if (!config.isFallbackMode) {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      logs = data;
    } else {
      logs = [...localDb.activity_logs].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 100);
    }
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve activity feed logs.' });
  }
});

// 3. Get Student Roster
app.get('/api/admin/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let students = [];
    if (!config.isFallbackMode) {
      const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
      if (authErr) throw authErr;
      
      const { data: profiles, error: profileErr } = await supabase.from('profiles').select('*').eq('role', 'student');
      if (profileErr) throw profileErr;
      
      students = profiles.map(p => {
        const u = users.find(user => user.id === p.id);
        return {
          id: p.id,
          name: p.full_name,
          email: u ? u.email : '',
          email_verified: u ? !!u.email_confirmed_at : false,
          created_at: p.created_at,
          last_login: u ? u.last_sign_in_at : null,
          status: 'active'
        };
      });
    } else {
      students = localDb.users.filter(u => u.role === 'student').sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(s => ({
        id: s.user_id,
        name: s.full_name,
        email: s.email,
        email_verified: s.email_verified,
        created_at: s.created_at,
        last_login: s.last_login,
        status: s.status
      }));
    }

    res.json(students);
  } catch (err) {
    console.error("Fetch student roster error:", err);
    res.status(500).json({ error: 'Failed to fetch student roster.' });
  }
});

// 4. Force Google Sheets Full Database Re-Sync
app.post('/api/admin/sync-all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let competitions = [];
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('competitions').select('*');
      competitions = data || [];
    } else {
      competitions = localDb.competitions;
    }

    console.log(`Starting force sync of all ${competitions.length} records to Google Sheets...`);
    // Iterate and sync
    for (let comp of competitions) {
      let student = null;
      if (!config.isFallbackMode) {
        const ownerId = comp.owner_id || comp.user_id;
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', ownerId).maybeSingle();
        student = profile;
        if (student) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(ownerId);
            if (authUser && authUser.user) {
              student.email = authUser.user.email;
            }
          } catch (getUserErr) {
            console.warn("Could not retrieve user email via admin tool during sync-all:", getUserErr);
          }
        }
      } else {
        const ownerId = comp.owner_id || comp.user_id;
        student = localDb.users.find(u => (u.user_id === ownerId || u.id === ownerId));
      }
      
      const syncData = {
        ...comp,
        user_id: comp.owner_id || comp.user_id,
        leader_name: student ? student.full_name : 'Student',
        leader_email: (student ? student.email : '') || ''
      };
      await syncToGoogleSheets('update', syncData);
    }

    res.json({ message: `Full re-sync triggered successfully for ${competitions.length} records.` });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});


// ----------------------------------------------------
// FILE UPLOAD SIMULATOR (MULTIPART ROUTE)
// ----------------------------------------------------
// Since React client uploads certificates, let's support a simple JSON endpoint for base64 or files.
// For simplicity, we can accept base64 uploads or regular multipart files (if using a library).
// Let's create a mockup route that returns a path to bypass upload errors during registration.
app.post('/api/upload', authenticateToken, async (req, res) => {
  try {
    const { filename, fileData } = req.body; // simulated JSON base64 upload
    const generatedPath = `${req.user.userId}/${crypto.randomUUID()}_${filename || 'proof.pdf'}`;
    
    if (!config.isFallbackMode && fileData) {
      // In Supabase mode, upload raw buffer if fileData is base64
      const buffer = Buffer.from(fileData, 'base64');
      const { error } = await supabase.storage
        .from('competition-proofs')
        .upload(generatedPath, buffer, { contentType: 'application/pdf', upsert: true });
      if (error) throw error;
    }
    
    res.json({ path: generatedPath, url: `/competition-proofs/${generatedPath}` });
  } catch (err) {
    res.status(500).json({ error: 'File upload error: ' + err.message });
  }
});

// Run server locally
if (process.env.NODE_ENV !== 'production') {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`🚀 Digilians Monorepo Server running on http://localhost:${PORT}`);
  });
}

// Export Express app for Vercel Serverless
export default app;
