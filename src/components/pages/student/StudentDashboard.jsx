import React, { useState, useMemo } from 'react';
import { useDap } from '../../../context/DapContext';
import { CompetitionController } from '../../../api/controllers/competitionController';
import { 
  User, Trophy, Calendar, PlusCircle, ExternalLink, Edit3, Trash2, 
  ShieldCheck, Clock, Award, Users, Search, Filter, ArrowUpDown, 
  Grid, List, AlertCircle, ChevronDown, ChevronUp, Link as LinkIcon, Paperclip 
} from 'lucide-react';

export function StudentDashboard() {
  const { currentUser, competitions, handleDeleteRecord, setSelectedSubmission, setActiveView } = useDap();

  // Filtering, search, sorting and view-mode states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [expandedTeamId, setExpandedTeamId] = useState(null); // tracking team collapsible in card view
  const [expandedRowId, setExpandedRowId] = useState(null); // tracking collapsible row in list view

  const handleOpenAdd = () => {
    setSelectedSubmission(null);
    setActiveView('competition-form');
  };

  const handleOpenEdit = (comp) => {
    setSelectedSubmission(comp);
    setActiveView('competition-form');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Winner':
      case 'MVP Completed':
        return (
          <span className="saas-status saas-status--success">
            <span className="status-dot status-dot--pulse" style={{ backgroundColor: 'var(--success)' }}></span>
            {status}
          </span>
        );
      case 'Finalist':
      case 'Shortlisted':
      case 'Under Review':
        return (
          <span className="saas-status saas-status--warning">
            <span className="status-dot status-dot--pulse" style={{ backgroundColor: 'var(--warning)' }}></span>
            {status}
          </span>
        );
      case 'Rejected':
        return (
          <span className="saas-status saas-status--danger">
            <span className="status-dot" style={{ backgroundColor: 'var(--danger)' }}></span>
            {status}
          </span>
        );
      default:
        return (
          <span className="saas-status saas-status--active">
            <span className="status-dot" style={{ backgroundColor: 'var(--primary)' }}></span>
            {status}
          </span>
        );
    }
  };

  // Extract unique categories for filter options
  const uniqueCategories = useMemo(() => {
    const cats = new Set(competitions.map(c => c.category).filter(Boolean));
    return Array.from(cats);
  }, [competitions]);

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = competitions.length;
    const wins = competitions.filter(c => ['Winner', 'MVP Completed'].includes(c.status)).length;
    const pending = competitions.filter(c => ['Submitted', 'Under Review'].includes(c.status)).length;
    const teamCollabs = competitions.filter(c => Array.isArray(c.team_members) && c.team_members.length > 0).length;

    return { total, wins, pending, teamCollabs };
  }, [competitions]);

  // Filtered & Sorted Submissions
  const filteredSubmissions = useMemo(() => {
    let res = [...competitions];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      res = res.filter(c => 
        c.competition_name.toLowerCase().includes(term) ||
        (c.project_name && c.project_name.toLowerCase().includes(term)) ||
        (c.organization && c.organization.toLowerCase().includes(term))
      );
    }
    
    if (statusFilter !== 'ALL') {
      res = res.filter(c => c.status === statusFilter);
    }
    
    if (categoryFilter !== 'ALL') {
      res = res.filter(c => c.category === categoryFilter);
    }
    
    res.sort((a, b) => {
      if (sortBy === 'date-desc') {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'date-asc') {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateA - dateB;
      }
      if (sortBy === 'name-asc') {
        return a.competition_name.localeCompare(b.competition_name);
      }
      return 0;
    });
    
    return res;
  }, [competitions, searchTerm, statusFilter, categoryFilter, sortBy]);

  if (!currentUser) return null;

  return (
    <div className="saas-container" style={{ padding: '2.5rem 0' }}>
      
      {/* 1. Header Banner */}
      <div className="saas-card" style={{ padding: '2.25rem 2.5rem', marginBottom: '2.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#ffffff', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="user-avatar-initials" style={{ width: '76px', height: '76px', fontSize: '2.25rem', border: '3px solid rgba(255,255,255,0.1)' }}>
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'S'}
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(99, 102, 241, 0.25)', color: '#a5b4fc', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <ShieldCheck size={13} /> Student Innovator Profile
              </div>
              <h1 style={{ fontSize: '2.15rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
                Welcome back, {currentUser.name}
              </h1>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span><strong>Email:</strong> {currentUser.email}</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span><strong>Joined:</strong> {new Date(currentUser.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
            </div>
          </div>
          <button onClick={handleOpenAdd} className="saas-button saas-button--primary" style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem' }}>
            <PlusCircle size={18} /> Add Competition Achievement
          </button>
        </div>
      </div>

      {/* 2. Interactive Statistics Rows */}
      <div className="stats-grid">
        <div 
          onClick={() => setStatusFilter('ALL')} 
          className={`stat-card stat-card--clickable ${statusFilter === 'ALL' ? 'stat-card--active' : ''}`}
          title="Show all submissions"
        >
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--blue">
            <Award size={24} />
          </div>
          <div>
            <h4 className="stat-card__value">{stats.total}</h4>
            <p className="stat-card__label">Total Submissions</p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Click to view all</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'Winner' ? 'ALL' : 'Winner')} 
          className={`stat-card stat-card--clickable ${statusFilter === 'Winner' ? 'stat-card--active' : ''}`}
          title="Filter by Winner status"
        >
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--gold">
            <Trophy size={24} />
          </div>
          <div>
            <h4 className="stat-card__value">{stats.wins}</h4>
            <p className="stat-card__label">Prizes & Wins</p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Click to filter</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter(statusFilter === 'Under Review' ? 'ALL' : 'Under Review')} 
          className={`stat-card stat-card--clickable ${statusFilter === 'Under Review' ? 'stat-card--active' : ''}`}
          title="Filter by Under Review status"
        >
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--emerald">
            <Clock size={24} />
          </div>
          <div>
            <h4 className="stat-card__value">{stats.pending}</h4>
            <p className="stat-card__label">Under Review</p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Click to filter</span>
          </div>
        </div>

        <div 
          onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); setSearchTerm(''); }} 
          className="stat-card stat-card--clickable"
          title="Reset all filters"
        >
          <div className="stat-card__icon-wrapper stat-card__icon-wrapper--purple">
            <Users size={24} />
          </div>
          <div>
            <h4 className="stat-card__value">{stats.teamCollabs}</h4>
            <p className="stat-card__label">Team Collaborations</p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Click to reset filters</span>
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="saas-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '380px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="saas-input" 
              style={{ paddingLeft: '2.5rem', paddingRight: searchTerm ? '2.5rem' : '1rem' }} 
              placeholder="Search your records..." 
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 0.25rem' }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Filters & Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            
            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} color="var(--text-muted)" />
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)} 
                className="saas-input" 
                style={{ padding: '0.45rem 1.8rem 0.45rem 0.75rem', width: 'auto', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="ALL">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
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

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ArrowUpDown size={15} color="var(--text-muted)" />
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)} 
                className="saas-input" 
                style={{ padding: '0.45rem 1.8rem 0.45rem 0.75rem', width: 'auto', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Alphabetical</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="view-toggle-bar">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`view-toggle-button ${viewMode === 'grid' ? 'view-toggle-button--active' : ''}`}
                title="Grid Cards Layout"
              >
                <Grid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`view-toggle-button ${viewMode === 'list' ? 'view-toggle-button--active' : ''}`}
                title="Compact List Table"
              >
                <List size={16} />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Content Displays */}
      {filteredSubmissions.length === 0 ? (
        
        /* Elegant Empty State */
        <div className="saas-card" style={{ padding: '5.5rem 2rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
          <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Award size={36} />
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {competitions.length === 0 ? 'No Achievements Logged Yet' : 'No Submissions Match Filters'}
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 2rem auto', fontSize: '0.925rem', lineHeight: 1.5 }}>
            {competitions.length === 0 
              ? "Start building your verified academic and innovation portfolio. Register your first Hackathon, Ideathon, or project contest to begin."
              : "Try refining your search terms or reset the filters to see your submitted competitions."
            }
          </p>
          {competitions.length === 0 ? (
            <button onClick={handleOpenAdd} className="saas-button saas-button--primary" style={{ padding: '0.75rem 1.75rem' }}>
              <PlusCircle size={18} /> Submit Your First Contest
            </button>
          ) : (
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); }} 
              className="saas-button saas-button--secondary"
            >
              Reset All Filters
            </button>
          )}
        </div>

      ) : viewMode === 'grid' ? (
        
        /* Grid Display View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '2rem' }}>
          {filteredSubmissions.map(comp => {
            const membersList = Array.isArray(comp.team_members) ? comp.team_members : [];
            const isTeamExpanded = expandedTeamId === comp.id;

            return (
              <div key={comp.id} className="saas-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem' }}>
                <div>
                  
                  {/* Card Badge Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    {getStatusBadge(comp.status)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-surface-hover)', padding: '0.3rem 0.75rem', borderRadius: '999px', border: '1px solid var(--border-color)' }}>
                      {comp.category}
                    </span>
                  </div>

                  {/* Contest Info */}
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0', lineHeight: 1.35, letterSpacing: '-0.015em' }}>
                    {comp.competition_name}
                  </h3>

                  {comp.organization && (
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span>Organized by:</span> <span style={{ opacity: 0.9 }}>{comp.organization}</span>
                    </div>
                  )}

                  {/* Project Highlight Box */}
                  {comp.project_name && (
                    <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.04)', borderLeft: '3.5px solid var(--primary)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.15rem', letterSpacing: '0.05em' }}>Project Solution</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{comp.project_name}</div>
                    </div>
                  )}

                  {/* Description text */}
                  {comp.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {comp.description}
                    </p>
                  )}

                  {/* Team Accordion Trigger */}
                  <div style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={15} color="var(--primary)" /> 
                        <span>Leader: {comp.leader_name || currentUser.name}</span>
                      </span>
                    </div>
                    
                    {membersList.length > 0 ? (
                      <>
                        <button 
                          onClick={() => setExpandedTeamId(isTeamExpanded ? null : comp.id)}
                          style={{ 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            background: 'transparent', 
                            border: 'none', 
                            borderTop: '1px solid var(--border-color)', 
                            marginTop: '0.65rem', 
                            paddingTop: '0.65rem', 
                            color: 'var(--text-muted)', 
                            fontSize: '0.8rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={14} /> Team Roster ({membersList.length})</span>
                          {isTeamExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        
                        {isTeamExpanded && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.65rem', animation: 'fadeIn 0.25s ease' }}>
                            {membersList.map((m, i) => (
                              <div key={i} style={{ fontSize: '0.775rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '0.35rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span><strong>{m.name}</strong> <span style={{ opacity: 0.85 }}>({m.role || 'Member'})</span></span>
                                <span style={{ fontSize: '0.725rem', opacity: 0.8 }}>{m.track}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.65rem', paddingTop: '0.65rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        Individual submission
                      </div>
                    )}
                  </div>

                  {/* Admin Notes */}
                  {comp.notes && (
                    <div style={{ padding: '0.75rem 1rem', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                      <strong>Reviewer Feedback:</strong> {comp.notes}
                    </div>
                  )}
                </div>

                {/* Footer and Actions */}
                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} /> {comp.date || comp.deadline}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} /> Edited {new Date(comp.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <a href={comp.verification_link || comp.competition_link || '#'} target="_blank" rel="noopener noreferrer" className="saas-button saas-button--outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}>
                        Proof <ExternalLink size={13} />
                      </a>
                      {comp.proof_file_path && (
                        <a href={CompetitionController.getProofFileUrl(comp.proof_file_path)} target="_blank" rel="noopener noreferrer" className="saas-button saas-button--outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem', color: 'var(--success)', borderColor: 'rgba(34,197,94,0.3)' }} title="View uploaded certificate">
                          Certificate <Paperclip size={13} />
                        </a>
                      )}
                      {comp.demo_link && (
                        <a href={comp.demo_link} target="_blank" rel="noopener noreferrer" className="saas-button saas-button--outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem', color: 'var(--primary)', borderColor: 'rgba(99,102,241,0.3)' }}>
                          Demo <LinkIcon size={13} />
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => handleOpenEdit(comp)} className="saas-button saas-button--secondary" style={{ padding: '0.45rem', borderRadius: '4px' }} title="Edit Submission Details">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => handleDeleteRecord(comp.id)} className="saas-button saas-button--danger" style={{ padding: '0.45rem', borderRadius: '4px' }} title="Remove Submission">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* Table/List Display View */
        <div className="saas-table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Competition Details</th>
                <th>Project Solution</th>
                <th>Category</th>
                <th>Submission Date</th>
                <th>Status</th>
                <th>Attachments</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(comp => {
                const isRowExpanded = expandedRowId === comp.id;
                const membersList = Array.isArray(comp.team_members) ? comp.team_members : [];

                return (
                  <React.Fragment key={comp.id}>
                    <tr>
                      <td>
                        {membersList.length > 0 ? (
                          <button 
                            onClick={() => setExpandedRowId(isRowExpanded ? null : comp.id)} 
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          >
                            {isRowExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        ) : null}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{comp.competition_name}</div>
                        {comp.organization && <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{comp.organization}</div>}
                      </td>
                      <td>
                        {comp.project_name ? (
                          <span style={{ fontWeight: 600 }}>{comp.project_name}</span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No project logged</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{comp.category}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{comp.date || comp.deadline}</td>
                      <td>{getStatusBadge(comp.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <a href={comp.verification_link || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                            Proof <ExternalLink size={12} />
                          </a>
                          {comp.proof_file_path && (
                            <a href={CompetitionController.getProofFileUrl(comp.proof_file_path)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, textDecoration: 'none' }} title="View uploaded certificate">
                              Certificate <Paperclip size={12} />
                            </a>
                          )}
                          {comp.demo_link && (
                            <a href={comp.demo_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                              Demo <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button onClick={() => handleOpenEdit(comp)} className="saas-button saas-button--secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => handleDeleteRecord(comp.id)} className="saas-button saas-button--danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Collapsible team details row */}
                    {isRowExpanded && membersList.length > 0 && (
                      <tr className="collapsible-row">
                        <td colSpan="8">
                          <div style={{ padding: '1rem 1.5rem', borderLeft: '3px solid var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                              <Users size={14} /> Team Structure ({membersList.length} members + Leader)
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.775rem' }}>
                                👑 <strong>{comp.leader_name || currentUser.name}</strong> (Leader) — {comp.leader_track || 'General'}
                              </div>
                              {membersList.map((m, idx) => (
                                <div key={idx} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.775rem' }}>
                                  👤 <strong>{m.name}</strong> ({m.role || 'Member'}) — {m.track}
                                </div>
                              ))}
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
  );
}
