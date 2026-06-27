import React, { useState, useEffect } from 'react';
import { useDap } from '../../context/DapContext';
import { Shield, User, Key, Mail, Lock, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, Clock } from 'lucide-react';

export function Login() {
  const { 
    handleLogin, 
    handleRegister, 
    handleVerifyOtp, 
    handleResendOtp, 
    handleForgotPassword, 
    handleResetPassword,
    verificationEmail,
    setVerificationEmail
  } = useDap();

  // Mode states: 'login', 'register', 'forgot-password'
  const [authMode, setAuthMode] = useState('login'); 
  
  // Registration and Login fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // OTP Verification fields
  const [otpCode, setOtpCode] = useState('');
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(3);
  
  // Reset Password fields
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = verify OTP & reset

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Cooldown timer state for OTP resend buttons
  const [resendCooldown, setResendCooldown] = useState(0);

  // Manage timer countdown
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Auto-focus email field if redirected from verify-otp cancel
  useEffect(() => {
    setError('');
    setInfoMessage('');
    // Clear cooldown when switching screens/modes
    setResendCooldown(0);
  }, [authMode, verificationEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      if (authMode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        const res = await handleRegister(name, email, password, confirmPassword);
        if (res.success && res.needsVerification) {
          setAuthMode('login'); // OTP screen will trigger automatically via verificationEmail check
          setResendCooldown(60); // 60s cooldown initially
        }
      } else if (authMode === 'login') {
        const res = await handleLogin(email, password);
        if (res.success && res.needsVerification) {
          // Unverified state, redirect to verification view
          setResendCooldown(60); // 60s cooldown initially
        }
      } else if (authMode === 'forgot-password') {
        if (forgotStep === 1) {
          const res = await handleForgotPassword(email);
          if (res.success) {
            setForgotStep(2);
            setResendCooldown(60); // Start 60s cooldown for reset OTP
            setInfoMessage('A 6-digit password recovery code has been sent to your email.');
          }
        } else {
          if (newPassword !== confirmNewPassword) {
            throw new Error('New passwords do not match.');
          }
          const res = await handleResetPassword(email, resetOtp, newPassword);
          if (res.success) {
            setAuthMode('login');
            setForgotStep(1);
            setInfoMessage('Password reset successfully. Please log in.');
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await handleVerifyOtp(verificationEmail, otpCode);
      if (!res.success) {
        setOtpAttemptsLeft(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err.message);
      setOtpAttemptsLeft(prev => Math.max(0, prev - 1));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtpCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      const res = await handleResendOtp(verificationEmail);
      if (res.success) {
        setInfoMessage('Verification code resent successfully.');
        setOtpAttemptsLeft(3);
        setResendCooldown(60); // 60s cooldown
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendForgotCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    setInfoMessage('');
    try {
      const res = await handleForgotPassword(email);
      if (res.success) {
        setInfoMessage('A new recovery code has been sent successfully.');
        setResendCooldown(60); // 60s cooldown
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render Verification Screen
  if (verificationEmail) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-bg-blob auth-bg-blob-1"></div>
        <div className="auth-bg-blob auth-bg-blob-2"></div>
        
        <div className="auth-glass-card">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="auth-icon-wrapper">
              <Clock size={32} />
            </div>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
              Verify Your Account
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Enter the 6-digit verification code sent to <strong style={{ color: 'var(--text-main)' }}>{verificationEmail}</strong>.
            </p>
          </div>

          {error && (
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {infoMessage && (
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="auth-input-group">
              <label>6-Digit OTP Code</label>
              <div className="auth-input-wrapper">
                <Key size={18} />
                <input 
                  type="text" 
                  maxLength="6"
                  value={otpCode} 
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g,''))} 
                  className="auth-input" 
                  style={{ paddingLeft: '3.25rem', letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem', fontWeight: 800 }} 
                  placeholder="000000" 
                  required 
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem', textAlign: 'center' }}>
                Valid for 10 minutes. Attempts remaining: <strong>{otpAttemptsLeft}</strong>
              </span>
            </div>

            <button 
              type="submit" 
              disabled={loading || otpAttemptsLeft === 0} 
              className="saas-button auth-submit-btn" 
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP & Activate'} <CheckCircle2 size={18} />
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', fontSize: '0.875rem' }}>
            <button 
              onClick={handleResendOtpCode} 
              disabled={loading || resendCooldown > 0}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: (loading || resendCooldown > 0) ? 'var(--text-muted)' : 'var(--primary)', 
                fontWeight: 700, 
                cursor: (loading || resendCooldown > 0) ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.3rem' 
              }}
            >
              <RefreshCw size={14} className={resendCooldown > 0 ? 'animate-spin' : ''} /> 
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP Code'}
            </button>
            <button 
              onClick={() => setVerificationEmail('')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Login / Register / Forgot Password forms
  return (
    <div className="auth-page-wrapper">
      <div className="auth-bg-blob auth-bg-blob-1"></div>
      <div className="auth-bg-blob auth-bg-blob-2"></div>

      <div className="auth-glass-card">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="auth-icon-wrapper">
            {authMode === 'register' ? <User size={32} /> : <Shield size={32} />}
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>
            {authMode === 'register' && 'Create Student Account'}
            {authMode === 'login' && 'Secure Enterprise Portal'}
            {authMode === 'forgot-password' && 'Password Recovery'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {authMode === 'register' && 'Join the portal to submit hackathon outcomes and track recognition.'}
            {authMode === 'login' && 'Sign in to access your student profile or administrative workspace.'}
            {authMode === 'forgot-password' && 'Reset your password and regain secure access to the portal.'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {infoMessage && (
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Registration fields */}
          {authMode === 'register' && (
            <div className="auth-input-group">
              <label>Full Name</label>
              <div className="auth-input-wrapper">
                <User size={18} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="auth-input" placeholder="Ahmed Hassan" required />
              </div>
            </div>
          )}

          {/* Email field (all forms) */}
          {(authMode !== 'forgot-password' || forgotStep === 1) && (
            <div className="auth-input-group">
              <label>Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={18} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" placeholder={authMode === 'register' ? "student@digilians.gov.eg" : "name@digilians.gov.eg"} required />
              </div>
            </div>
          )}

          {/* Login Password fields */}
          {authMode === 'login' && (
            <div className="auth-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ marginBottom: 0 }}>Password</label>
                <button type="button" onClick={() => { setAuthMode('forgot-password'); setForgotStep(1); }} className="auth-link" style={{ fontSize: '0.8rem' }}>Forgot Password?</button>
              </div>
              <div className="auth-input-wrapper">
                <Lock size={18} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="auth-input" placeholder="••••••••" required />
              </div>
            </div>
          )}

          {/* Registration Password & Confirm fields */}
          {authMode === 'register' && (
            <>
              <div className="auth-input-group">
                <label>Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="auth-input" placeholder="••••••••" required />
                </div>
              </div>
              <div className="auth-input-group">
                <label>Confirm Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="auth-input" placeholder="••••••••" required />
                </div>
              </div>
            </>
          )}

          {/* Forgot Password Reset step fields */}
          {authMode === 'forgot-password' && forgotStep === 2 && (
            <>
              <div className="auth-input-group">
                <label>Recovery OTP Code</label>
                <div className="auth-input-wrapper">
                  <Key size={18} />
                  <input type="text" maxLength="6" value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g,''))} className="auth-input" style={{ paddingLeft: '3.25rem', letterSpacing: '0.25em', textAlign: 'center', fontWeight: 800 }} placeholder="000000" required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button 
                    type="button"
                    onClick={handleResendForgotCode} 
                    disabled={loading || resendCooldown > 0}
                    className="auth-link"
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: resendCooldown > 0 ? 'var(--text-muted)' : '' }}
                  >
                    <RefreshCw size={12} className={resendCooldown > 0 ? 'animate-spin' : ''} /> 
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Recovery Code'}
                  </button>
                </div>
              </div>
              <div className="auth-input-group">
                <label>New Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="auth-input" placeholder="••••••••" required />
                </div>
              </div>
              <div className="auth-input-group">
                <label>Confirm New Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} />
                  <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="auth-input" placeholder="••••••••" required />
                </div>
              </div>
            </>
          )}

          {/* Remember Me Option */}
          {authMode === 'login' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe} 
                onChange={e => setRememberMe(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                Remember Me (Persistent Session)
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="saas-button auth-submit-btn">
            {loading ? 'Processing...' : (
              authMode === 'register' ? 'Register Account' : 
              authMode === 'login' ? 'Secure Sign In' : 
              forgotStep === 1 ? 'Send Recovery Code' : 'Update Password'
            )} <ArrowRight size={18} />
          </button>
        </form>

        {/* Footer switcher links */}
        <div className="auth-footer-links">
          {authMode === 'login' && (
            <>New student innovator? <button onClick={() => setAuthMode('register')} className="auth-link">Create Student Account</button></>
          )}
          {authMode === 'register' && (
            <>Already have an account? <button onClick={() => setAuthMode('login')} className="auth-link">Sign In</button></>
          )}
          {authMode === 'forgot-password' && (
            <button onClick={() => setAuthMode('login')} className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><ArrowLeft size={14} /> Back to Sign In</button>
          )}
        </div>

      </div>
    </div>
  );
}

