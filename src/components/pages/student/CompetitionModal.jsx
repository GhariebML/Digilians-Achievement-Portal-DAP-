import React, { useState, useEffect } from 'react';
import { useDap } from '../../../context/DapContext';
import { X, Trophy, Calendar, Building, Link as LinkIcon, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export function CompetitionModal({ isOpen, onClose, existingData }) {
  const { handleCreateRecord, handleUpdateRecord } = useDap();
  
  const [formData, setFormData] = useState({
    competition_name: '',
    description: '',
    organization: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Innovation Contest',
    verification_link: '',
    notes: '',
    status: 'Submitted'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingData) {
      setFormData({
        competition_name: existingData.competition_name || '',
        description: existingData.description || '',
        organization: existingData.organization || '',
        date: existingData.date || existingData.deadline || new Date().toISOString().split('T')[0],
        category: existingData.category || 'Innovation Contest',
        verification_link: existingData.verification_link || existingData.competition_link || '',
        notes: existingData.notes || '',
        status: existingData.status || 'Submitted'
      });
    } else {
      setFormData({
        competition_name: '',
        description: '',
        organization: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Innovation Contest',
        verification_link: '',
        notes: '',
        status: 'Submitted'
      });
    }
  }, [existingData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (existingData && existingData.id) {
        await handleUpdateRecord(existingData.id, formData);
      } else {
        await handleCreateRecord(formData);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saas-modal-backdrop" onClick={onClose}>
      <div className="saas-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
              <Trophy size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {existingData ? 'Update Submission' : 'Submit New Competition'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {existingData ? 'Record updates will create an immutable history event.' : 'Log your participation, hackathon, or startup program.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Competition / Hackathon Name *</label>
              <div style={{ position: 'relative' }}>
                <Trophy size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="competition_name" value={formData.competition_name} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="Digilians AI Innovation Challenge" required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Host Organization</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="organization" value={formData.organization} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="Ministry of Communications & IT" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Submission / Event Date *</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="saas-input">
                <option value="Hackathon">Hackathon</option>
                <option value="Innovation Contest">Innovation Contest</option>
                <option value="Startup Accelerator">Startup Accelerator</option>
                <option value="AI Challenge">AI Challenge</option>
                <option value="Global Olympiad">Global Olympiad</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="saas-input">
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Finalist">Finalist</option>
                <option value="Winner">Winner</option>
                <option value="MVP Completed">MVP Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Verification Proof Link (Cert / Repository / News) *</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="url" name="verification_link" value={formData.verification_link} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="https://github.com/..." required />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="saas-input" style={{ minHeight: '80px' }} placeholder="Brief overview of your project or solution..." />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Additional Notes & Member Details</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="saas-input" style={{ minHeight: '60px' }} placeholder="List team members, special awards, or key takeaways..." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="saas-button saas-button--secondary" style={{ padding: '0.75rem 1.5rem' }}>Cancel</button>
            <button type="submit" disabled={loading} className="saas-button saas-button--primary" style={{ padding: '0.75rem 2rem' }}>
              {loading ? 'Saving...' : (existingData ? 'Save Changes & Log' : 'Submit Competition')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
