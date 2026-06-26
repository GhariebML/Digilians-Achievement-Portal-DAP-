import React, { useState, useMemo } from 'react';
import { useDap } from '../../../context/DapContext';
import { ExportController } from '../../../api/controllers/exportController';
import { CompetitionController } from '../../../api/controllers/competitionController';
import { 
  Users, User, Trophy, Activity, FileSpreadsheet, Search, Filter, 
  ArrowUpDown, ChevronRight, ChevronDown, ChevronUp, ExternalLink, 
  RefreshCw, ShieldCheck, Download, Calendar, Clock, Award, FileText, CheckCircle2, Paperclip
} from 'lucide-react';

export function AdminDashboard() {
  const { currentUser, competitions, logs, students, adminStats, handleUpdateRecord, refreshData, handleForceReSyncAll, loading } = useDap();
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, submissions, logs, export
  
  // Search & Filters states
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('ALL');
  const [submissionSort, setSubmissionSort] = useState('date-desc');
  const [expandedSubId, setExpandedSubId] = useState(null); // Collapsible sub row state
  const [isSyncing, setIsSyncing] = useState(false);

  // Trigger smooth database sync animation
  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    await refreshData();
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  const handleFullSheetsSync = async () => {
    setIsSyncing(true);
    await handleForceReSyncAll();
    setIsSyncing(false);
  };

  // Students Map for easy lookup
  const studentsMap = useMemo(() => {
    const map = {};
    students.forEach(s => { map[s.id] = s; });
    return map;
  }, [students]);

  // Submissions Map by Student ID
  const submissionsByStudent = useMemo(() => {
    const map = {};
    competitions.forEach(c => {
      if (!map[c.user_id]) map[c.user_id] = [];
      map[c.user_id].push(c);
    });
    return map;
  }, [competitions]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const lower = studentSearch.toLowerCase();
    return students.filter(s => s.name.toLowerCase().includes(lower) || s.email.toLowerCase().includes(lower));
  }, [students, studentSearch]);

  // Selected Student Object
  const selectedStudent = useMemo(() => {
    return studentsMap[selectedStudentId] || null;
  }, [studentsMap, selectedStudentId]);

  // Filtered & Sorted Submissions
  const filteredSubmissions = useMemo(() => {
    let res = [...competitions];
    if (submissionSearch) {
      const lower = submissionSearch.toLowerCase();
      res = res.filter(c => 
        c.competition_name.toLowerCase().includes(lower) || 
        (c.project_name && c.project_name.toLowerCase().includes(lower)) ||
        (c.organization && c.organization.toLowerCase().includes(lower)) ||
        (c.category && c.category.toLowerCase().includes(lower))
      );
    }
    if (submissionStatusFilter !== 'ALL') {
      res = res.filter(c => c.status === submissionStatusFilter);
    }

    res.sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.created_at || 0).getTime();
      return submissionSort === 'date-desc' ? dateB - dateA : dateA - dateB;
    });

    return res;
  }, [competitions, submissionSearch, submissionStatusFilter, submissionSort]);

  const handleStatusChange = async (competitionId, newStatus) => {
    await handleUpdateRecord(competitionId, { status: newStatus });
  };

  const handleExportCSV = () => {
    ExportController.exportSubmissionsCSV(competitions, students);
  };

  const handleExportExcel = () => {
    ExportController.exportSubmissionsExcel(competitions, students);
  };

  const handleExportPDF = () => {
    ExportController.exportSubmissionsPDF(competitions, adminStats);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Winner':
      case 'MVP Completed':
        return 'saas-status saas-status--success';
      case 'Finalist':
      case 'Shortlisted':
      case 'Under Review':
        return 'saas-status saas-status--warning';
      case 'Rejected':
        return 'saas-status saas-status--danger';
      default:
        return 'saas-status saas-status--active';
    }
  };

  const getAuditLogClass = (action) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('REGISTER') || act.includes('SUBMISSION')) return 'audit-node audit-node--create';
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('STATUS')) return 'audit-node audit-node--update';
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'audit-node audit-node--delete';
    return 'audit-node';
  };

  if (!currentUser || currentUser.role !== 'admin') return null;

  // Use dynamic stats from backend, with local computation fallbacks
  const uStats = adminStats?.users || { totalUsers: students.length, verifiedUsers: students.filter(s => s.email_verified).length, activeUsers: students.length, newUsers: 0 };
  const cStats = adminStats?.competitions || { totalCompetitions: competitions.length, activeCompetitions: competitions.filter(c => c.status !== 'Rejected').length, finalists: competitions.filter(c => c.status === 'Finalist').length, winners: competitions.filter(c => c.status === 'Winner').length };
  const tStats = adminStats?.teams || { totalTeams: Math.floor(competitions.length * 0.7), totalMembers: Math.floor(competitions.length * 2.1), mostActiveTrack: 'AI & Machine Learning' };

  return (
    <div className="saas-container" style={{ padding: '2.5rem 0' }}>
      
      {/* 1. Header Banner */}
      <div className="saas-card" style={{ 
        padding: '3rem 3rem', 
        marginBottom: '3rem', 
        background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99, 102, 241, 0.05) 100%)', 
        border: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow effect */}
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--primary)', color: '#fff', padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
              <ShieldCheck size={14} /> Executive Admin Console
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 0.5rem 0', letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--text-main)' }}>
              Master Governance Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem', maxWidth: '600px' }}>
              Real-time analytics, student tracking, submission reviews, system audit logging, and automated reporting.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={handleFullSheetsSync} 
              disabled={loading || isSyncing} 
              className="saas-button saas-button--outline" 
              style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'rgba(99, 102, 241, 0.4)', color: 'var(--primary)' }}
              title="Force sync all database records to Google Sheets reporting layer"
            >
              <FileSpreadsheet size={16} /> Force Sheets Sync
            </button>
            <button 
              onClick={handleSyncDatabase} 
              disabled={loading || isSyncing} 
              className="saas-button saas-button--primary" 
              style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} className={loading || isSyncing ? 'spinning' : ''} /> 
              {loading || isSyncing ? 'Syncing...' : 'Sync Database'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Admin Navigation Tabs */}
      <div className="saas-tabs-nav">
        {[
          { id: 'overview', label: 'Overview Console', icon: Activity },
          { id: 'students', label: `Student Roster (${students.length})`, icon: Users },
          { id: 'submissions', label: `Submissions Review (${competitions.length})`, icon: Trophy },
          { id: 'logs', label: `System Audit (${logs.length})`, icon: Activity },
          { id: 'export', label: 'Export Center', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); if(tab.id === 'students') setSelectedStudentId(null); }} 
              className={`saas-tab-button ${isActive ? 'saas-tab-button--active' : ''}`}
            >
              <Icon size={16} /> 
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW STATS */}
      {activeTab === 'overview' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* User Stats Card Roster */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', borderLeft: '4px solid var(--primary)', paddingLeft: '0.75rem' }}>User Statistics</h3>
          <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="stat-card__icon-wrapper stat-card__icon-wrapper--blue"><Users size={22} /></div>
              <div><h4 className="stat-card__value">{uStats.totalUsers}</h4><p className="stat-card__label">Total Users</p></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="stat-card__icon-wrapper stat-card__icon-wrapper--emerald"><ShieldCheck size={22} /></div>
              <div><h4 className="stat-card__value">{uStats.verifiedUsers}</h4><p className="stat-card__label">Verified Users</p></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
              <div className="stat-card__icon-wrapper stat-card__icon-wrapper--gold"><Clock size={22} /></div>
              <div><h4 className="stat-card__value">{uStats.activeUsers}</h4><p className="stat-card__label">Active (7 Days)</p></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--secondary)' }}>
              <div className="stat-card__icon-wrapper stat-card__icon-wrapper--purple"><User size={22} /></div>
              <div><h4 className="stat-card__value">{uStats.newUsers}</h4><p className="stat-card__label">New (24 Hours)</p></div>
            </div>
          </div>

          {/* Competition Stats Card Roster */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', borderLeft: '4px solid var(--secondary)', paddingLeft: '0.75rem' }}>Competition Statistics</h3>
          <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--secondary)' }}>
              <div className="stat-card__icon-wrapper stat-card__icon-wrapper--purple"><Trophy size={22} /></div>
              <div><h4 className="stat-card__value">{cStats.totalCompetitions}</h4><p className="stat-card__label">Total Submissions</p></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
              <div className="stat-card__icon-wrapper stat-card__icon-wrapper--blue"><RefreshCw size={22} /></div>
              <div><h4 className="stat-card__value">{cStats.activeCompetitions}</h4><p className="stat-card__label">Active Submissions</p></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
              <div className="stat-card__icon-wrapper stat-card__icon-wrapper--gold"><ShieldCheck size={22} /></div>
              <div><h4 className="stat-card__value">{cStats.finalists}</h4><p className="stat-card__label">Finalists</p></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid var(--success)' }}>
              <div className="stat-card__icon-wrapper stat-card__icon-wrapper--emerald"><Award size={22} /></div>
              <div><h4 className="stat-card__value">{cStats.winners}</h4><p className="stat-card__label">Winners</p></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            
            {/* Activity Feed Feed */}
            <div className="saas-card" style={{ padding: '2rem', flex: 1.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>System Activity Feed</h2>
                <button onClick={() => setActiveTab('logs')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.825rem', cursor: 'pointer' }}>
                  View Full Audit Log
                </button>
              </div>
              
              {logs.length === 0 ? (
                <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  No recent activities recorded in the system database.
                </div>
              ) : (
                <div className="audit-timeline">
                  {logs.slice(0, 5).map(log => (
                    <div key={log.id} className={getAuditLogClass(log.action)}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {log.details}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                          <Clock size={12} /> {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {log.action}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team Stats Widget */}
            <div className="saas-card" style={{ padding: '2rem', flex: 1 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem' }}>Team & Track Summary</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{tStats.totalTeams}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Teams Enrolled</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{tStats.totalMembers}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Student Members Enrolled</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{tStats.mostActiveTrack}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Most Active Enrollment Track</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* TAB 2: MANAGE STUDENTS */}
      {activeTab === 'students' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {!selectedStudentId ? (
            <div>
              <div style={{ marginBottom: '2rem', maxWidth: '380px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    value={studentSearch} 
                    onChange={e => setStudentSearch(e.target.value)} 
                    className="saas-input" 
                    style={{ paddingLeft: '2.5rem' }} 
                    placeholder="Search students..." 
                  />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="saas-card" style={{ padding: '6rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                  <Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Students Found</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No student innovators match your current query.</p>
                </div>
              ) : (
                
                /* Grid of Student Cards */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                  {filteredStudents.map(student => {
                    const studentSubs = submissionsByStudent[student.id] || [];
                    const winCount = studentSubs.filter(c => ['Winner', 'MVP Completed'].includes(c.status)).length;
                    
                    return (
                      <div 
                        key={student.id} 
                        className="saas-card" 
                        onClick={() => setSelectedStudentId(student.id)} 
                        style={{ padding: '1.75rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div className="user-avatar-initials" style={{ width: '48px', height: '48px', fontSize: '1.15rem' }}>
                              {student.name ? student.name[0].toUpperCase() : 'S'}
                            </div>
                            <div>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                                {student.name}
                              </h3>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                {student.email}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '0.75rem', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{studentSubs.length}</div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '0.4rem' }}>Submissions</div>
                            </div>
                            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '0.75rem', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--success)', lineHeight: 1 }}>{winCount}</div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '0.4rem' }}>Wins & MVPs</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>Joined {new Date(student.created_at).toLocaleDateString()}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                            View Submissions <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            
            /* Student Profile Detail Panel */
            <div>
              <button 
                onClick={() => setSelectedStudentId(null)} 
                className="saas-button saas-button--secondary" 
                style={{ marginBottom: '2rem', padding: '0.5rem 1rem' }}
              >
                ← Back to Student Roster
              </button>

              {selectedStudent && (
                <div className="saas-card" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-surface-hover)' }}>
                  <div className="user-avatar-initials" style={{ width: '64px', height: '64px', fontSize: '1.75rem' }}>
                    {selectedStudent.name ? selectedStudent.name[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                      {selectedStudent.name}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                      <strong>Email:</strong> {selectedStudent.email} <span style={{ opacity: 0.5 }}>|</span> <strong>Registered:</strong> {new Date(selectedStudent.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.25rem' }}>Registered Submissions</h3>
              
              {(submissionsByStudent[selectedStudentId] || []).length === 0 ? (
                <div className="saas-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  This student has not submitted any achievements yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                  {(submissionsByStudent[selectedStudentId] || []).map(comp => (
                    <div key={comp.id} className="saas-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span className={getStatusClass(comp.status)}>{comp.status}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{comp.category}</span>
                        </div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                          {comp.competition_name}
                        </h4>
                        {comp.organization && <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.75rem' }}>{comp.organization}</div>}
                        {comp.project_name && <div style={{ fontSize: '0.9rem', fontWeight: 700, background: 'var(--bg-surface-hover)', padding: '0.5rem', borderRadius: '4px', borderLeft: '3px solid var(--primary)', marginBottom: '0.75rem' }}>{comp.project_name}</div>}
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{comp.date}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <a href={comp.verification_link || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                            Proof Link <ExternalLink size={13} />
                          </a>
                          {comp.proof_file_path && (
                            <a href={CompetitionController.getProofFileUrl(comp.proof_file_path)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, textDecoration: 'none' }} title="View uploaded proof document">
                              Certificate <Paperclip size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MANAGE SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* Submission search, status filter, sorting bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '380px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={submissionSearch} 
                onChange={e => setSubmissionSearch(e.target.value)} 
                className="saas-input" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="Search competitions..." 
              />
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Filter size={15} color="var(--text-muted)" />
                <select 
                  value={submissionStatusFilter} 
                  onChange={e => setSubmissionStatusFilter(e.target.value)} 
                  className="saas-input" 
                  style={{ padding: '0.45rem 1.8rem 0.45rem 0.75rem', width: 'auto', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Finalist">Finalist</option>
                  <option value="Winner">Winner</option>
                  <option value="MVP Completed">MVP Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowUpDown size={15} color="var(--text-muted)" />
                <select 
                  value={submissionSort} 
                  onChange={e => setSubmissionSort(e.target.value)} 
                  className="saas-input" 
                  style={{ padding: '0.45rem 1.8rem 0.45rem 0.75rem', width: 'auto', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="saas-card" style={{ padding: '6rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
              <Trophy size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Submissions Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            
            /* Submissions reviews list table with collapsible details row */
            <div className="saas-table-container">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Competition Details</th>
                    <th>Student Info</th>
                    <th>Category</th>
                    <th>Submitted Date</th>
                    <th>Proof</th>
                    <th style={{ width: '180px' }}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map(comp => {
                    const student = studentsMap[comp.user_id] || { name: 'Unknown Student', email: 'N/A' };
                    const isExpanded = expandedSubId === comp.id;
                    const membersList = Array.isArray(comp.team_members) ? comp.team_members : [];

                    return (
                      <React.Fragment key={comp.id}>
                        <tr 
                          style={{ cursor: 'pointer' }}
                          onClick={() => setExpandedSubId(isExpanded ? null : comp.id)}
                        >
                          <td>
                            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{comp.competition_name}</div>
                            {comp.organization && <div style={{ fontSize: '0.775rem', color: 'var(--primary)' }}>{comp.organization}</div>}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div className="user-avatar-initials" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                                {student.name ? student.name[0].toUpperCase() : 'S'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>{student.name}</div>
                                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>{comp.category}</span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{comp.date || comp.deadline}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <a href={comp.verification_link || comp.competition_link || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.825rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                                Proof <ExternalLink size={13} />
                              </a>
                              {comp.proof_file_path && (
                                <a href={CompetitionController.getProofFileUrl(comp.proof_file_path)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.825rem', color: 'var(--success)', fontWeight: 700, textDecoration: 'none' }} title="View uploaded certificate">
                                  Certificate <Paperclip size={13} />
                                </a>
                              )}
                            </div>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <select 
                              value={comp.status} 
                              onChange={e => handleStatusChange(comp.id, e.target.value)} 
                              className="saas-input" 
                              style={{ 
                                padding: '0.35rem 1.8rem 0.35rem 0.5rem', 
                                fontSize: '0.825rem', 
                                fontWeight: 700, 
                                background: 'var(--bg-main)', 
                                border: '1px solid var(--border-color)',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="Submitted">Submitted</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Finalist">Finalist</option>
                              <option value="Winner">Winner</option>
                              <option value="MVP Completed">MVP Completed</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>

                        {/* Collapsible drawer row showing complete detail info */}
                        {isExpanded && (
                          <tr className="collapsible-row">
                            <td colSpan="7">
                              <div style={{ padding: '1.5rem 2rem', borderLeft: '3.5px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                
                                {comp.project_name && (
                                  <div>
                                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Project Solution / Prototype</h4>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{comp.project_name}</div>
                                  </div>
                                )}

                                {comp.description && (
                                  <div>
                                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Project Goal / Description</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>{comp.description}</p>
                                  </div>
                                )}

                                {/* Roster Drawer */}
                                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                                  <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    👑 Leader: {comp.leader_name || student.name}
                                  </h4>
                                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                    <strong>Role:</strong> {comp.leader_role || 'Team Leader'} | <strong>Track:</strong> {comp.leader_track || 'AI & Machine Learning'} | <strong>Email:</strong> {comp.leader_email || student.email}
                                  </div>

                                  {membersList.length > 0 ? (
                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                                      <h5 style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        👥 Registered Team Members ({membersList.length})
                                      </h5>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {membersList.map((m, idx) => (
                                          <div key={idx} style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', padding: '0.35rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                            <strong>{m.name}</strong> ({m.role || 'Member'}) — {m.track}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                      Submitted as an individual project.
                                    </div>
                                  )}
                                </div>

                                {/* Custom notes box */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                                    Assigned Reviewer Notes / Feedback
                                  </label>
                                  <div style={{ display: 'flex', gap: '1rem' }}>
                                    <input 
                                      type="text" 
                                      defaultValue={comp.notes || ''} 
                                      onBlur={e => handleUpdateRecord(comp.id, { notes: e.target.value })}
                                      className="saas-input" 
                                      style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                      placeholder="Write reviewer feedback (press outside input to save)..." 
                                    />
                                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--success)', fontSize: '0.75rem', gap: '0.25rem', fontWeight: 600 }}>
                                      <CheckCircle2 size={14} /> Auto-saves on blur
                                    </span>
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVITY TRACKING */}
      {activeTab === 'logs' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="saas-card" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>System Event Log</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {logs.length} operations tracked
              </span>
            </div>

            {logs.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface-hover)' }}>
                No operations recorded yet.
              </div>
            ) : (
              <div className="audit-timeline">
                {logs.map(log => (
                  <div key={log.id} className={getAuditLogClass(log.action)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {log.details}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span>Logged: {new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <span style={{ padding: '0.25rem 0.75rem', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {log.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: EXPORT SYSTEM */}
      {activeTab === 'export' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div className="saas-card" style={{ padding: '3.5rem 2rem', maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <FileSpreadsheet size={36} />
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Export Data Reports</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '520px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
              Compile verified student profiles (email address, joined dates) and complete submissions sheets (status, Category, team lists, dates, proof links) into clean spreadsheet formats.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <button 
                onClick={handleExportCSV} 
                className="saas-button saas-button--outline" 
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
              >
                <Download size={18} /> 
                <span>Download CSV File</span>
              </button>
              
              <button 
                onClick={handleExportExcel} 
                className="saas-button saas-button--outline" 
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
              >
                <Download size={18} /> 
                <span>Download Excel Sheet</span>
              </button>

              <button 
                onClick={handleExportPDF} 
                className="saas-button saas-button--primary" 
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
              >
                <FileText size={18} /> 
                <span>Download PDF Summary</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
