import React from 'react';

export default function Footer() {
  return (
    <footer className="premium-footer">
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '48px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px', color: '#FFFFFF' }}>Digilians</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', padding: '2px 6px', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '4px' }}>DAP PORTAL</span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#94A3B8', marginBottom: '16px' }}>
            A centralized platform for Digilians students to submit, track, and manage their participation in competitions, hackathons, challenges, startup programs, and innovation contests.
          </p>
          <div style={{ fontSize: '13px' }}>
            <a href="https://lms.digilians.gov.eg/" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ color: 'var(--accent)' }}>
              lms.digilians.gov.eg
            </a>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px', color: '#FFFFFF' }}>Digilians Tracks</h4>
          <ul style={{ padding: 0, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li className="footer-list-item">AI & Machine Learning</li>
            <li className="footer-list-item">Data Science & Analytics</li>
            <li className="footer-list-item">FinTech & Blockchain</li>
            <li className="footer-list-item">Cybersecurity & Defense</li>
            <li className="footer-list-item">Full Stack Web Development</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px', color: '#FFFFFF' }}>Platform Features</h4>
          <ul style={{ padding: 0, fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li className="footer-list-item">Master Google Sheets Live Sync</li>
            <li className="footer-list-item">Supabase Cloud Storage Backed</li>
            <li className="footer-list-item">Automated Executive PDF Reports</li>
            <li className="footer-list-item">Advanced Charts & Team Performance Stats</li>
            <li className="footer-list-item">Dynamic Student Badges & Timeline</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px', color: '#FFFFFF' }}>Contact & Helpdesk</h4>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#94A3B8', marginBottom: '16px' }}>
            Need support uploading proof links or editing active submissions?
          </p>
          <a href="mailto:support@digilians.gov.eg" className="footer-link" style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '600' }}>
            support@digilians.gov.eg
          </a>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', flexWrap: 'wrap', gap: '16px' }}>
        <span>© 2026 Digilians Innovation Hub. All rights reserved.</span>
        <span>Designed & Developed by <span style={{ color: 'var(--accent)', fontWeight: '600' }}>Mohamed Gharieb</span></span>
        <span>Version 1.0 (High-Performance SPA)</span>
      </div>
    </footer>
  );
}
