import React from 'react';

export default function Logo() {
  return (
    <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.2s ease' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(37, 99, 235, 0.25)', borderRadius: '10px' }}>
        <svg width="42" height="42" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="#0F172A"/>
          {/* Network Nodes & D contour */}
          <path d="M12 10H20C25.5228 10 30 14.4772 30 20C30 25.5228 25.5228 30 20 30H12V10Z" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="10" r="2.5" fill="#06B6D4"/>
          <circle cx="20" cy="10" r="2.5" fill="#06B6D4"/>
          <circle cx="27" cy="13" r="2.5" fill="#06B6D4"/>
          <circle cx="30" cy="20" r="2.5" fill="#06B6D4"/>
          <circle cx="27" cy="27" r="2.5" fill="#06B6D4"/>
          <circle cx="20" cy="30" r="2.5" fill="#06B6D4"/>
          <circle cx="12" cy="30" r="2.5" fill="#06B6D4"/>
          <path d="M12 20H18" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="18" cy="20" r="2" fill="#22C55E"/>
          {/* Rocket Icon at center */}
          <path d="M22 15L25 12M22 15C21.5 15.5 20.5 16.5 20 18C19.5 19.5 19 23 19 23L16 20L19 17C19 17 22.5 16.5 24 16C25.5 15.5 26.5 14.5 27 14L22 15Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="gradient-text-primary" style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', lineHeight: '1.2' }}>Digilians</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '1px', lineHeight: '1' }}>ACHIEVEMENT PORTAL</span>
      </div>
    </div>
  );
}
