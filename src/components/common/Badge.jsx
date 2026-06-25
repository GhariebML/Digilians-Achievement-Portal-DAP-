import React from 'react';

export default function Badge({ status }) {
  const getBadgeStyle = (st) => {
    switch (st) {
      case 'Winner':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', border: '1px solid #22C55E' };
      case 'Finalist':
      case 'Top 20':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#2563EB', border: '1px solid #2563EB' };
      case 'Top 50':
      case 'Top 100':
      case 'Shortlisted':
        return { bg: 'rgba(6, 182, 212, 0.15)', color: '#06B6D4', border: '1px solid #06B6D4' };
      case 'Under Review':
      case 'MVP Completed':
      case 'Proposal Submitted':
      case 'Idea Submitted':
      case 'Team Formed':
      case 'Registered':
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid #F59E0B' };
      case 'Rejected':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid #EF4444' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748B', border: '1px solid #64748B' };
    }
  };

  const style = getBadgeStyle(status);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      backgroundColor: style.bg,
      color: style.color,
      border: style.border,
      boxShadow: 'var(--shadow-sm)',
      whiteSpace: 'nowrap'
    }}>
      {status || 'Pending'}
    </span>
  );
}
