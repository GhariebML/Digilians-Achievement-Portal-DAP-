import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
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

// ----------------------------------------------------
// EMAIL TEMPLATES & MOCK EMAIL SENDER
// ----------------------------------------------------
const sendMockEmail = (email, subject, htmlContent) => {
  console.log("==========================================");
  console.log(`✉️ SIMULATED EMAIL SENT TO: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log("==========================================");
  // Log message detail in server console
};

const generateOtpEmailHtml = (fullName, otpCode) => {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 30px; border-radius: 6px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Digilians Achievement Portal</h2>
        <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">Secure Registration Verification</p>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px; margin-top: 0;">Hello <strong>${fullName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">Welcome to the Digilians Competition Tracker. To activate your account and verify your identity, please enter the secure 6-digit verification code below on the signup page:</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #3b82f6; font-family: monospace;">${otpCode}</span>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">This OTP code is valid for <strong>10 minutes</strong>. Do not share this code.</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #64748b;">If you did not initiate this request, you can safely ignore this email.</p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; 2026 Digilians Inc. All rights reserved.
      </div>
    </div>
  `;
};

const generateResetEmailHtml = (fullName, otpCode) => {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 30px; border-radius: 6px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Digilians Achievement Portal</h2>
        <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">Password Recovery Request</p>
      </div>
      <div style="padding: 30px 20px;">
        <p style="font-size: 16px; margin-top: 0;">Hello <strong>${fullName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #475569;">We received a request to reset your password. Use the following 6-digit verification code to complete the recovery process:</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #ef4444; font-family: monospace;">${otpCode}</span>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">This OTP code is valid for <strong>10 minutes</strong>. Do not share this code.</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #64748b;">If you did not request a password reset, please secure your account immediately.</p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        &copy; 2026 Digilians Inc. All rights reserved.
      </div>
    </div>
  `;
};

// ----------------------------------------------------
// SECURITY MITIGATIONS: RATE LIMITERS
// ----------------------------------------------------
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit signup/login/OTP calls to 20 per window
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100, // General limit
  message: { error: 'Rate limit exceeded. Please wait before retrying.' }
});

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
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies.accessToken;

  if (!token) return res.status(401).json({ error: 'Access token required. Please sign in.' });

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired access token.' });
    req.user = user;
    next();
  });
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

// ----------------------------------------------------
// PHASE 2 & 5: AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

// 1. Sign Up Route
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields (Name, Email, Password, Confirm Password) are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanName = sanitizeString(name);
    const cleanEmail = sanitizeString(email).toLowerCase();

    // Check if user already exists
    let existingUser = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      existingUser = data;
    } else {
      existingUser = localDb.users.find(u => u.email === cleanEmail);
    }

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Create User
    const newUser = {
      user_id: userId,
      full_name: cleanName,
      email: cleanEmail,
      password_hash: passwordHash,
      email_verified: false,
      role: 'student',
      status: 'active',
      created_at: new Date().toISOString()
    };

    if (!config.isFallbackMode) {
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) throw error;
    } else {
      localDb.users.push(newUser);
      saveLocalDb();
    }

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const newOtp = {
      otp_id: crypto.randomUUID(),
      user_id: userId,
      otp_code: otpCode,
      expires_at: expiresAt,
      attempts: 0,
      created_at: new Date().toISOString()
    };

    if (!config.isFallbackMode) {
      const { error } = await supabase.from('otp').insert([newOtp]);
      if (error) throw error;
    } else {
      localDb.otp.push(newOtp);
      saveLocalDb();
    }

    // Send simulated email
    sendMockEmail(cleanEmail, 'Verify Your Digilians Account', generateOtpEmailHtml(cleanName, otpCode));

    res.status(201).json({ 
      message: 'Registration successful. Verification OTP sent to your email.',
      email: cleanEmail,
      // For testing convenience locally, return OTP in response body
      otpCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: 'Server registration error: ' + err.message });
  }
});

// 2. Verify OTP Route
app.post('/api/auth/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ error: 'Email and OTP verification code are required.' });
    }

    const cleanEmail = email.toLowerCase();
    
    // Fetch User
    let user = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      user = data;
    } else {
      user = localDb.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(400).json({ error: 'User account not found.' });
    }

    // Fetch OTP record
    let otpRecord = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('otp').select('*').eq('user_id', user.user_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      otpRecord = data;
    } else {
      const records = localDb.otp.filter(o => o.user_id === user.user_id);
      otpRecord = records.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
    }

    if (!otpRecord) {
      return res.status(400).json({ error: 'No OTP request found for this account.' });
    }

    // Expiry check
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'OTP code has expired. Please request a new code.' });
    }

    // Limit attempts (max 3)
    if (otpRecord.attempts >= 3) {
      return res.status(400).json({ error: 'Maximum verification attempts exceeded. Please generate a new code.' });
    }

    // Attempt incrementing
    const newAttempts = otpRecord.attempts + 1;
    if (!config.isFallbackMode) {
      await supabase.from('otp').update({ attempts: newAttempts }).eq('otp_id', otpRecord.otp_id);
    } else {
      otpRecord.attempts = newAttempts;
      saveLocalDb();
    }

    // Code match validation
    if (otpRecord.otp_code !== otpCode.trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Mark verified
    if (!config.isFallbackMode) {
      await supabase.from('users').update({ email_verified: true }).eq('user_id', user.user_id);
    } else {
      user.email_verified = true;
      saveLocalDb();
    }

    // Delete verification OTP
    if (!config.isFallbackMode) {
      await supabase.from('otp').delete().eq('otp_id', otpRecord.otp_id);
    } else {
      localDb.otp = localDb.otp.filter(o => o.otp_id !== otpRecord.otp_id);
      saveLocalDb();
    }

    // Create session & JWT
    const accessToken = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role, name: user.full_name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
      { userId: user.user_id },
      config.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    // Save session in sessions table
    const device = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
    
    const newSession = {
      session_id: crypto.randomUUID(),
      user_id: user.user_id,
      device,
      ip_address: ipAddress,
      login_time: new Date().toISOString()
    };

    if (!config.isFallbackMode) {
      await supabase.from('sessions').insert([newSession]);
      await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('user_id', user.user_id);
    } else {
      localDb.sessions.push(newSession);
      user.last_login = new Date().toISOString();
      saveLocalDb();
    }

    await logActivity(user.user_id, 'Account Verification', `${user.full_name} completed email verification and activated account.`);

    // Set refresh token in HTTP-only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Account verified and active.',
      accessToken,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        email_verified: true,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: 'Server OTP verification error: ' + err.message });
  }
});

// 3. Resend OTP Route
app.post('/api/auth/resend-otp', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const cleanEmail = email.toLowerCase();
    
    // Fetch User
    let user = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      user = data;
    } else {
      user = localDb.users.find(u => u.email === cleanEmail);
    }

    if (!user) return res.status(400).json({ error: 'No user account found with this email.' });

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const newOtp = {
      otp_id: crypto.randomUUID(),
      user_id: user.user_id,
      otp_code: otpCode,
      expires_at: expiresAt,
      attempts: 0,
      created_at: new Date().toISOString()
    };

    if (!config.isFallbackMode) {
      // Clear old OTPs first
      await supabase.from('otp').delete().eq('user_id', user.user_id);
      await supabase.from('otp').insert([newOtp]);
    } else {
      localDb.otp = localDb.otp.filter(o => o.user_id !== user.user_id);
      localDb.otp.push(newOtp);
      saveLocalDb();
    }

    // Email
    sendMockEmail(cleanEmail, 'Verify Your Digilians Account (New Code)', generateOtpEmailHtml(user.full_name, otpCode));

    res.json({ 
      message: 'A new 6-digit OTP code has been sent to your email.',
      otpCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({ error: 'Server OTP generation error: ' + err.message });
  }
});

// 4. Log In Route
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase();

    // Fetch User
    let user = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      user = data;
    } else {
      user = localDb.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Check status
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact administrator.' });
    }

    // Check password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // OTP Verification check
    if (!user.email_verified) {
      // Trigger new OTP automatically
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const newOtp = {
        otp_id: crypto.randomUUID(),
        user_id: user.user_id,
        otp_code: otpCode,
        expires_at: expiresAt,
        attempts: 0,
        created_at: new Date().toISOString()
      };
      if (!config.isFallbackMode) {
        await supabase.from('otp').delete().eq('user_id', user.user_id);
        await supabase.from('otp').insert([newOtp]);
      } else {
        localDb.otp = localDb.otp.filter(o => o.user_id !== user.user_id);
        localDb.otp.push(newOtp);
        saveLocalDb();
      }
      sendMockEmail(cleanEmail, 'Verify Your Digilians Account', generateOtpEmailHtml(user.full_name, otpCode));

      return res.status(401).json({ 
        error: 'Email verification required. Code sent to email.',
        unverified: true,
        email: cleanEmail,
        otpCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined
      });
    }

    // Sign Access & Refresh Tokens
    const accessToken = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role, name: user.full_name },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
      { userId: user.user_id },
      config.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    // Save session
    const device = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    const newSession = {
      session_id: crypto.randomUUID(),
      user_id: user.user_id,
      device,
      ip_address: ipAddress,
      login_time: new Date().toISOString()
    };

    if (!config.isFallbackMode) {
      await supabase.from('sessions').insert([newSession]);
      await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('user_id', user.user_id);
    } else {
      localDb.sessions.push(newSession);
      user.last_login = new Date().toISOString();
      saveLocalDb();
    }

    await logActivity(user.user_id, 'User Login', `${user.full_name} logged in from device: ${device}`);

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        email_verified: true,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: 'Server authentication error: ' + err.message });
  }
});

// 5. Token Refresh Route
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required.' });

    jwt.verify(refreshToken, config.jwtRefreshSecret, async (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid or expired refresh token. Please sign in again.' });

      // Fetch User
      let user = null;
      if (!config.isFallbackMode) {
        const { data } = await supabase.from('users').select('*').eq('user_id', decoded.userId).maybeSingle();
        user = data;
      } else {
        user = localDb.users.find(u => u.user_id === decoded.userId);
      }

      if (!user || user.status === 'suspended') {
        return res.status(403).json({ error: 'User account disabled or not found.' });
      }

      // Sign new Access Token
      const accessToken = jwt.sign(
        { userId: user.user_id, email: user.email, role: user.role, name: user.full_name },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      res.json({ accessToken });
    });
  } catch (err) {
    res.status(500).json({ error: 'Server token refresh error.' });
  }
});

// 6. Log Out Route
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Delete session from sessions table
    if (!config.isFallbackMode) {
      await supabase.from('sessions').delete().eq('user_id', req.user.userId);
    } else {
      localDb.sessions = localDb.sessions.filter(s => s.user_id !== req.user.userId);
      saveLocalDb();
    }

    await logActivity(req.user.userId, 'User Logout', `${req.user.name} logged out.`);

    res.clearCookie('refreshToken');
    res.json({ message: 'Securely logged out.' });
  } catch (err) {
    res.status(500).json({ error: 'Server logout error.' });
  }
});

// 7. Get Current User ("Me") Route
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    let user = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('users').select('*').eq('user_id', req.user.userId).maybeSingle();
      user = data;
    } else {
      user = localDb.users.find(u => u.user_id === req.user.userId);
    }

    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        created_at: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving user profile.' });
  }
});

// 8. Forgot Password Route
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });

    const cleanEmail = email.toLowerCase();

    // Fetch User
    let user = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      user = data;
    } else {
      user = localDb.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      // Security practice: Don't explicitly reveal if email exists, return generic success
      return res.json({ message: 'If this email exists in our system, an OTP code has been sent.' });
    }

    // Generate secure reset OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

    const newOtp = {
      otp_id: crypto.randomUUID(),
      user_id: user.user_id,
      otp_code: otpCode,
      expires_at: expiresAt,
      attempts: 0,
      created_at: new Date().toISOString()
    };

    if (!config.isFallbackMode) {
      await supabase.from('otp').delete().eq('user_id', user.user_id);
      await supabase.from('otp').insert([newOtp]);
    } else {
      localDb.otp = localDb.otp.filter(o => o.user_id !== user.user_id);
      localDb.otp.push(newOtp);
      saveLocalDb();
    }

    sendMockEmail(cleanEmail, 'Reset Your Digilians Password', generateResetEmailHtml(user.full_name, otpCode));

    res.json({
      message: 'If this email exists in our system, an OTP code has been sent.',
      // For local testing convenience
      otpCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    });
  } catch (err) {
    console.error("Forgot Password error:", err);
    res.status(500).json({ error: 'Password recovery error.' });
  }
});

// 9. Reset Password Route (Verify & Reset)
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ error: 'All fields (Email, OTP Code, New Password) are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase();

    // Fetch User
    let user = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      user = data;
    } else {
      user = localDb.users.find(u => u.email === cleanEmail);
    }

    if (!user) return res.status(400).json({ error: 'Reset request is invalid.' });

    // Fetch OTP record
    let otpRecord = null;
    if (!config.isFallbackMode) {
      const { data } = await supabase.from('otp').select('*').eq('user_id', user.user_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      otpRecord = data;
    } else {
      const records = localDb.otp.filter(o => o.user_id === user.user_id);
      otpRecord = records.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
    }

    if (!otpRecord) return res.status(400).json({ error: 'Invalid or missing OTP code.' });

    // Expiry check
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'OTP code has expired.' });
    }

    // Attempts validation
    if (otpRecord.attempts >= 3) {
      return res.status(400).json({ error: 'Max attempts exceeded.' });
    }

    // Code match
    if (otpRecord.otp_code !== otpCode.trim()) {
      const newAttempts = otpRecord.attempts + 1;
      if (!config.isFallbackMode) {
        await supabase.from('otp').update({ attempts: newAttempts }).eq('otp_id', otpRecord.otp_id);
      } else {
        otpRecord.attempts = newAttempts;
        saveLocalDb();
      }
      return res.status(400).json({ error: 'Invalid OTP code.' });
    }

    // Hash New Password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Save Password
    if (!config.isFallbackMode) {
      await supabase.from('users').update({ password_hash: passwordHash, email_verified: true }).eq('user_id', user.user_id);
      await supabase.from('otp').delete().eq('otp_id', otpRecord.otp_id);
    } else {
      user.password_hash = passwordHash;
      user.email_verified = true;
      localDb.otp = localDb.otp.filter(o => o.otp_id !== otpRecord.otp_id);
      saveLocalDb();
    }

    await logActivity(user.user_id, 'Password Reset', `${user.full_name} completed password recovery and updated password.`);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: 'Error resetting password.' });
  }
});


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
        const { data, error } = await supabase.from('competitions').select('*').eq('user_id', req.user.userId).order('created_at', { ascending: false });
        if (error) throw error;
        list = data;
      } else {
        list = localDb.competitions.filter(c => c.user_id === req.user.userId).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      }
    }

    res.json(list);
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
      user_id: req.user.userId,
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
      leader_name: req.user.name,
      leader_email: req.user.email,
      team_members: req.body.team_members || [] // Maintain team lists if passed
    };
    syncToGoogleSheets('create', syncData);

    res.status(201).json(saved);
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
    if (req.user.role !== 'admin' && original.user_id !== req.user.userId) {
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
      leader_name: req.user.role === 'admin' ? (cleanData.leader_name || updated.leader_name) : req.user.name,
      leader_email: req.user.role === 'admin' ? (cleanData.leader_email || updated.leader_email) : req.user.email,
      team_members: req.body.team_members || []
    };
    syncToGoogleSheets('update', syncData);

    res.json(updated);
  } catch (err) {
    console.error("Update Submission Error:", err);
    res.status(500).json({ error: 'Error updating competition solution.' });
  }
});

// 4. Delete Competition Entry
app.post('/api/competitions/delete/:id', authenticateToken, async (req, res) => {
  // Use POST route with URL params or standard DELETE, let's allow both.
  // Many client proxies / CORS blocks DELETE, so supporting POST /delete/:id is highly robust!
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
    if (req.user.role !== 'admin' && original.user_id !== req.user.userId) {
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
      const { data: users } = await supabase.from('users').select('*');
      const { data: comps } = await supabase.from('competitions').select('*');
      allUsers = users || [];
      allComps = comps || [];
    } else {
      allUsers = localDb.users;
      allComps = localDb.competitions;
    }

    // 1. User Statistics
    const totalUsers = allUsers.length;
    const verifiedUsers = allUsers.filter(u => u.email_verified).length;
    
    // Active: logged in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = allUsers.filter(u => u.last_login && new Date(u.last_login) > sevenDaysAgo).length;
    
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
      const { data, error } = await supabase.from('users').select('*').eq('role', 'student').order('created_at', { ascending: false });
      if (error) throw error;
      students = data;
    } else {
      students = localDb.users.filter(u => u.role === 'student').sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    // Map secure fields only
    const cleanList = students.map(s => ({
      id: s.user_id,
      name: s.full_name,
      email: s.email,
      email_verified: s.email_verified,
      created_at: s.created_at,
      last_login: s.last_login,
      status: s.status
    }));

    res.json(cleanList);
  } catch (err) {
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
      // Fetch associated student profile for names/emails
      let student = null;
      if (!config.isFallbackMode) {
        const { data } = await supabase.from('users').select('*').eq('user_id', comp.user_id).maybeSingle();
        student = data;
      } else {
        student = localDb.users.find(u => u.user_id === comp.user_id);
      }
      
      const syncData = {
        ...comp,
        leader_name: student ? student.full_name : 'Student',
        leader_email: student ? student.email : ''
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
