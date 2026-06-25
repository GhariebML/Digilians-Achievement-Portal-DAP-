import React from 'react';
import { useDap } from '../../context/DapContext';
import { Trophy, ShieldCheck, Award, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export function Home() {
  const { currentUser, setActiveView } = useDap();

  return (
    <div className="saas-container mesh-bg" style={{ padding: '5rem 0' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto 6rem auto', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1.25rem', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '2rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)' }}>
          <Zap size={16} /> Next-Generation Enterprise Achievement Portal
        </div>
        
        <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.035em', lineHeight: 1.15, marginBottom: '1.75rem' }}>
          Centralized Platform for <span className="gradient-text-primary">Digilians Innovators</span>
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '3rem', lineHeight: 1.65, maxWidth: '780px', margin: '0 auto 3rem auto' }}>
          Submit, track, and manage your participation in competitions, hackathons, challenges, startup accelerators, and innovation contests in a highly secure, multi-tenant workspace.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginBottom: '4rem' }}>
          {currentUser ? (
            <button onClick={() => setActiveView(currentUser.role === 'admin' ? 'admin-dashboard' : 'student-dashboard')} className="saas-button saas-button--primary" style={{ padding: '1.1rem 2.75rem', fontSize: '1.1rem' }}>
              Go to Dashboard <ArrowRight size={20} />
            </button>
          ) : (
            <button onClick={() => setActiveView('login')} className="saas-button saas-button--primary" style={{ padding: '1.1rem 2.75rem', fontSize: '1.1rem' }}>
              Get Started / Sign In <ArrowRight size={20} />
            </button>
          )}
        </div>

        {/* Floating Micro-Badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={18} color="var(--success)" /> Isolated Multi-Tenant SecOps
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={18} color="var(--success)" /> Dynamic Team Rosters & Tracks
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={18} color="var(--success)" /> One-Click Executive Reporting
          </span>
        </div>
      </div>

      {/* Feature Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem', marginBottom: '6rem' }}>
        <div className="saas-card" style={{ padding: '2.5rem' }}>
          <div style={{ padding: '1.1rem', background: 'rgba(37, 99, 235, 0.12)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', width: 'fit-content', marginBottom: '1.75rem', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
            <ShieldCheck size={28} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Strict Multi-Tenant Privacy</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Every student innovator receives an isolated personal account. Your competition entries, links, and updates remain entirely secure and private.
          </p>
        </div>

        <div className="saas-card" style={{ padding: '2.5rem' }}>
          <div style={{ padding: '1.1rem', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent)', borderRadius: 'var(--radius-md)', width: 'fit-content', marginBottom: '1.75rem', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <Trophy size={28} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Unlimited Competitions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Submit and track endless hackathons, AI challenges, and global Olympiads under a unified professional track record.
          </p>
        </div>

        <div className="saas-card" style={{ padding: '2.5rem' }}>
          <div style={{ padding: '1.1rem', background: 'rgba(34, 197, 94, 0.12)', color: 'var(--success)', borderRadius: 'var(--radius-md)', width: 'fit-content', marginBottom: '1.75rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <Award size={28} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>Executive Governance</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Advanced administration panel offering real-time audit logs, student roster search, status updating, and one-click CSV/Excel report generation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
