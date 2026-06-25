import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--primary)',
      color: '#F8FAFC',
      padding: '48px 0 24px 0',
      marginTop: '64px',
      borderTop: '1px solid var(--border-color)'
    }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '48px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Digilians</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', padding: '2px 6px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '4px' }}>DAP PORTAL</span>
          </div>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '16px' }}>
            A centralized platform for Digilians students to submit, track, and manage their participation in competitions, hackathons, challenges, startup programs, and innovation contests.
          </p>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            https://lms.digilians.gov.eg/
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#FFFFFF' }}>Digilians Tracks</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>AI & Machine Learning</li>
            <li>Data Science & Analytics</li>
            <li>FinTech & Blockchain</li>
            <li>Cybersecurity & Defense</li>
            <li>Full Stack Web Development</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#FFFFFF' }}>Platform Features</h4>
          <ul style={{ listStyle: 'none', padding: 0, fontSize: '14px', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Master Google Sheets Live Synchronization</li>
            <li>Supabase Cloud Storage Backed</li>
            <li>Automated Executive PDF Reports</li>
            <li>Advanced Charts & Team Performance Stats</li>
            <li>Dynamic Student Badges & Timeline</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#FFFFFF' }}>Contact & Helpdesk</h4>
          <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '12px' }}>
            Need support uploading proof links or editing active submissions?
          </p>
          <a href="mailto:support@digilians.gov.eg" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '600' }}>support@digilians.gov.eg</a>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px', borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
        <span>© 2026 Digilians Innovation Hub. All rights reserved.</span>
        <span>Version 1.0 (High-Performance SPA)</span>
      </div>
    </footer>
  );
}
