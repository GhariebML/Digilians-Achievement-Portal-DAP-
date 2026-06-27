import React, { useState, useEffect } from 'react';
import { useDap } from '../../../context/DapContext';
import { CompetitionController } from '../../../api/controllers/competitionController';
import { Trophy, Building, Calendar, Link as LinkIcon, User, Users, PlusCircle, Trash2, CheckCircle2, AlertCircle, ArrowLeft, FileText, Briefcase, Phone, Mail, Award, Upload, Paperclip, Loader2 } from 'lucide-react';

export function CompetitionFormPage() {
  const { currentUser, selectedSubmission, handleCreateRecord, handleUpdateRecord, setActiveView } = useDap();

  const [formData, setFormData] = useState({
    competition_name: '',
    organization: '',
    date: new Date().toISOString().split('T')[0],
    category: 'AI & Machine Learning',
    status: 'Submitted',
    project_name: '',
    description: '',
    verification_link: '',
    demo_link: '',
    notes: '',
    proof_file_path: '',
    // Team Leader Info
    leader_name: currentUser ? currentUser.name : '',
    leader_email: currentUser ? currentUser.email : '',
    leader_phone: '',
    leader_track: 'Applied AI and Data Analytics',
    leader_role: 'Team Leader / Architect',
    // Team Members List
    team_members: []
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [error, setError] = useState('');

  const trackOptions = [
    'Applied AI and Data Analytics',
    'Cyber Security',
    'Data Science',
    'Software based AI'
  ];

  const categoryOptions = [
    'AI & Machine Learning',
    'Financial Technology',
    'Cybersecurity',
    'Aerospace & Space Tech',
    'CleanTech & Sustainability',
    'Healthcare & MedTech',
    'Web3 & Blockchain',
    'EdTech',
    'Smart Cities & IoT',
    'Open Innovation Hackathon'
  ];

  useEffect(() => {
    if (selectedSubmission) {
      setFormData({
        competition_name: selectedSubmission.competition_name || '',
        organization: selectedSubmission.organization || '',
        date: selectedSubmission.date || selectedSubmission.deadline || new Date().toISOString().split('T')[0],
        category: selectedSubmission.category || 'AI & Machine Learning',
        status: selectedSubmission.status || 'Submitted',
        project_name: selectedSubmission.project_name || '',
        description: selectedSubmission.description || '',
        verification_link: selectedSubmission.verification_link || selectedSubmission.competition_link || '',
        demo_link: selectedSubmission.demo_link || '',
        notes: selectedSubmission.notes || '',
        proof_file_path: selectedSubmission.proof_file_path || '',
        // Leader
        leader_name: selectedSubmission.leader_name || (currentUser ? currentUser.name : ''),
        leader_email: selectedSubmission.leader_email || (currentUser ? currentUser.email : ''),
        leader_phone: selectedSubmission.leader_phone || '',
        leader_track: selectedSubmission.leader_track || 'AI & Machine Learning',
        leader_role: selectedSubmission.leader_role || 'Team Leader / Architect',
        // Members
        team_members: Array.isArray(selectedSubmission.team_members) ? selectedSubmission.team_members : []
      });
    }
  }, [selectedSubmission, currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    setError('');
    setUploadSuccess('');

    try {
      const path = await CompetitionController.uploadProofFile(file, currentUser?.id || 'guest-user');
      setFormData(prev => ({ ...prev, proof_file_path: path }));
      setUploadSuccess(`Successfully attached: ${file.name}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddMember = () => {
    setFormData({
      ...formData,
      team_members: [
        ...formData.team_members,
        { name: '', email: '', phone: '', track: 'Applied AI and Data Analytics', role: 'Developer' }
      ]
    });
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...formData.team_members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setFormData({ ...formData, team_members: updatedMembers });
  };

  const handleRemoveMember = (index) => {
    const updatedMembers = formData.team_members.filter((_, i) => i !== index);
    setFormData({ ...formData, team_members: updatedMembers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (selectedSubmission && selectedSubmission.id) {
        await handleUpdateRecord(selectedSubmission.id, formData);
      } else {
        await handleCreateRecord(formData);
      }
      setActiveView('student-dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="saas-container" style={{ padding: '3rem 0', maxWidth: '960px' }}>
      {/* Back navigation */}
      <button 
        onClick={() => setActiveView('student-dashboard')} 
        className="saas-button saas-button--secondary" 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: '0.5rem 1rem' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Title Banner */}
      <div className="saas-card" style={{ padding: '2.5rem', marginBottom: '2.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #1e293b 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.15)', color: 'var(--accent)', borderRadius: 'var(--radius-md)' }}>
            <Trophy size={36} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.025em' }}>
              {selectedSubmission ? 'Edit Competition Record' : 'Submit New Competition & Project'}
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
              Document your achievement, project specifications, team leader credentials, and dynamic team member roster.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* SECTION 1: COMPETITION & PROJECT DETAILS */}
        <div className="saas-card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <Trophy size={22} color="var(--secondary)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Core Competition & Project Details</h2>
            <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginLeft: 'auto' }}>Step 1 of 3</span>
          </div>

          <div className="responsive-grid-2">
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Competition / Hackathon Name *</label>
              <div style={{ position: 'relative' }}>
                <Trophy size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="competition_name" value={formData.competition_name} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="e.g. Digilians AI Innovation Challenge 2026" required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Host Organization / Organizer</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="organization" value={formData.organization} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="e.g. Ministry of Communications & IT" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Event / Submission Date *</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Competition Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="saas-input">
                {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Current Status</label>
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Project / Solution Name</label>
              <input type="text" name="project_name" value={formData.project_name} onChange={handleChange} className="saas-input" placeholder="e.g. DeepHealth Diagnostics AI" />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Project Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="saas-input" style={{ minHeight: '100px' }} placeholder="Provide a detailed overview of the technical architecture, problem statement, and proposed solution..." />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Verification Proof Link (Official Certificate / Hackathon Site / News) *</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="url" name="verification_link" value={formData.verification_link} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="https://..." required />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>GitHub Repository / Live Demo Link (Optional)</label>
              <div style={{ position: 'relative' }}>
                <LinkIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="url" name="demo_link" value={formData.demo_link} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="https://github.com/..." />
              </div>
            </div>

            {/* Proof File Dropzone / Upload Section */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Upload Official Proof / Certificate (PDF, PNG, JPG - Max 5MB)</label>
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem 1.5rem', textAlign: 'center', background: 'var(--bg-surface)', transition: 'border-color 0.2s ease', cursor: 'pointer', position: 'relative' }}>
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                  title="Click to select proof file"
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  {uploading ? (
                    <>
                      <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>Uploading file securely to Supabase Storage...</span>
                    </>
                  ) : formData.proof_file_path ? (
                    <>
                      <div style={{ padding: '0.75rem', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', borderRadius: '50%' }}>
                        <Paperclip size={28} />
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>Proof File Attached Successfully!</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formData.proof_file_path}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Click or drag a new file to replace</span>
                    </>
                  ) : (
                    <>
                      <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--primary)', borderRadius: '50%' }}>
                        <Upload size={28} />
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Click to upload or drag & drop</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Securely stores in `competition-proofs` bucket (Max 5MB)</span>
                    </>
                  )}
                </div>
              </div>
              {uploadSuccess && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} /> {uploadSuccess}
                </div>
              )}
            </div>


            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Additional Notes & Judging Feedback</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="saas-input" style={{ minHeight: '80px' }} placeholder="Mention specific awards received, panel comments, or future milestones..." />
            </div>
          </div>
        </div>

        {/* SECTION 2: TEAM LEADER INFORMATION */}
        <div className="saas-card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <User size={22} color="var(--secondary)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Team Leader Information</h2>
            <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginLeft: 'auto' }}>Step 2 of 3</span>
          </div>

          <div className="responsive-grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Leader Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="leader_name" value={formData.leader_name} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="Ahmed Mahmoud" required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Leader Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" name="leader_email" value={formData.leader_email} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="ahmed@student.digilians.gov.eg" required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Leader Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="tel" name="leader_phone" value={formData.leader_phone} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="+20 100 123 4567" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Role in Team</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" name="leader_role" value={formData.leader_role} onChange={handleChange} className="saas-input" style={{ paddingLeft: '2.75rem' }} placeholder="Team Leader / AI Architect" />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Academic Specialization / Track</label>
              <select name="leader_track" value={formData.leader_track} onChange={handleChange} className="saas-input">
                {trackOptions.map(track => <option key={track} value={track}>{track}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: TEAM MEMBERS LIST */}
        <div className="saas-card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={22} color="var(--secondary)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Team Members Roster</h2>
              <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginLeft: '1rem' }}>Step 3 of 3</span>
            </div>
            <button 
              type="button" 
              onClick={handleAddMember} 
              className="saas-button saas-button--primary" 
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <PlusCircle size={18} /> Add Team Member
            </button>
          </div>

          {formData.team_members.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
              <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>No additional team members</h3>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem' }}>If you competed as a group, add your team members here to credit their contributions.</p>
              <button 
                type="button" 
                onClick={handleAddMember} 
                className="saas-button saas-button--secondary" 
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <PlusCircle size={16} /> Add First Member
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {formData.team_members.map((member, index) => (
                <div key={index} style={{ padding: '2rem', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Team Member #{index + 1}
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveMember(index)} 
                      className="saas-button saas-button--secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Remove Member"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>

                  <div className="responsive-grid-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Member Name *</label>
                      <input 
                        type="text" 
                        value={member.name} 
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)} 
                        className="saas-input" 
                        placeholder="Sarah Ahmed" 
                        required 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email Address *</label>
                      <input 
                        type="email" 
                        value={member.email} 
                        onChange={(e) => handleMemberChange(index, 'email', e.target.value)} 
                        className="saas-input" 
                        placeholder="sarah@student.digilians.gov.eg" 
                        required 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Phone Number</label>
                      <input 
                        type="tel" 
                        value={member.phone} 
                        onChange={(e) => handleMemberChange(index, 'phone', e.target.value)} 
                        className="saas-input" 
                        placeholder="+20 100 987 6543" 
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Role in Team</label>
                      <input 
                        type="text" 
                        value={member.role} 
                        onChange={(e) => handleMemberChange(index, 'role', e.target.value)} 
                        className="saas-input" 
                        placeholder="Frontend Developer / Designer" 
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Academic Specialization / Track</label>
                      <select 
                        value={member.track} 
                        onChange={(e) => handleMemberChange(index, 'track', e.target.value)} 
                        className="saas-input"
                      >
                        {trackOptions.map(track => <option key={track} value={track}>{track}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBMIT ACTION BAR */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
          <button 
            type="button" 
            onClick={() => setActiveView('student-dashboard')} 
            className="saas-button saas-button--secondary" 
            style={{ padding: '1rem 2rem', fontSize: '1rem' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="saas-button saas-button--primary" 
            style={{ padding: '1rem 3rem', fontSize: '1rem', fontWeight: 800 }}
          >
            {loading ? 'Processing...' : (selectedSubmission ? 'Save Updates & Log Action' : 'Submit Competition Record')}
          </button>
        </div>

      </form>
    </div>
  );
}
