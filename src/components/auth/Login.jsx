import React, { useState } from 'react';
import { useDap } from '../../context/DapContext';
import { Shield, User, Key, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export function Login() {
  const { handleLogin, handleRegister, setActiveView } = useDap();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let res;
    if (isRegister) {
      res = await handleRegister(name, email, password);
    } else {
      res = await handleLogin(email, password);
    }

    setLoading(false);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="saas-container" style={{ padding: '6rem 0', maxWidth: '480px', margin: '0 auto' }}>
      <div className="saas-card" style={{ padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
            {isRegister ? <User size={32} /> : <Shield size={32} />}
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {isRegister ? 'Create Student Account' : 'Secure Enterprise Portal'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isRegister 
              ? 'Join the platform to log your hackathons, manage proofs, and track status.' 
              : 'Sign in to access your isolated student profile or executive management console.'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="Ahmed Hassan" required />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder={isRegister ? "student@student.digilians.gov.eg" : "name@digilians.gov.eg"} required />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="saas-button saas-button--primary" style={{ padding: '0.875rem', width: '100%', marginTop: '0.5rem', fontSize: '1rem' }}>
            {loading ? 'Authenticating...' : (isRegister ? 'Register & Enter Dashboard' : 'Secure Sign In')} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2.5rem', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {isRegister ? (
            <>Already have an account? <button onClick={() => setIsRegister(false)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Sign In</button></>
          ) : (
            <>New student innovator? <button onClick={() => setIsRegister(true)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Create Student Account</button></>
          )}
        </div>

        {!isRegister && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>🔐 Executive Admin Demo Credentials:</div>
            <div><strong>Email:</strong> admin@digilians.gov.eg</div>
            <div><strong>Password:</strong> Admin123!</div>
          </div>
        )}
      </div>
    </div>
  );
}
