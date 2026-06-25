import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthController } from '../api/controllers/authController';
import { CompetitionController } from '../api/controllers/competitionController';
import { ActivityLogController } from '../api/controllers/activityLogController';
import { SupabaseService } from '../services/supabaseService';

const DapContext = createContext();

export function DapProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dap_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeView, setActiveView] = useState(() => {
    const saved = localStorage.getItem('dap_current_user');
    if (saved) {
      const u = JSON.parse(saved);
      return u.role === 'admin' ? 'admin-dashboard' : 'student-dashboard';
    }
    return 'home'; // landing page / login
  });

  const [theme, setTheme] = useState('light');
  const [toast, setToast] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Storage configuration state
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem('dap_cloud_credentials');
    return saved ? JSON.parse(saved) : {
      mode: 'local',
      googleSheetsUrl: '',
      supabaseUrl: '',
      supabaseKey: '',
      isFallbackMode: true
    };
  });

  // Active data state based on user role
  const [competitions, setCompetitions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Initialize Supabase if credentials exist
  useEffect(() => {
    if (credentials.mode === 'supabase' && credentials.supabaseUrl && credentials.supabaseKey) {
      const success = SupabaseService.initialize(credentials.supabaseUrl, credentials.supabaseKey);
      setCredentials(prev => ({ ...prev, isFallbackMode: !success }));
    } else {
      setCredentials(prev => ({ ...prev, isFallbackMode: true }));
    }
  }, [credentials.mode, credentials.supabaseUrl, credentials.supabaseKey]);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch active tenant data based on currentUser
  const refreshData = useCallback(async () => {
    if (!currentUser) {
      setCompetitions([]);
      setLogs([]);
      setStudents([]);
      return;
    }

    setLoading(true);
    try {
      if (currentUser.role === 'admin') {
        const allComps = await CompetitionController.getAllSubmissions();
        const allLogs = await ActivityLogController.getAllLogs();
        const allStds = await AuthController.getAllStudents();
        setCompetitions(allComps);
        setLogs(allLogs);
        setStudents(allStds);
      } else {
        const studentComps = await CompetitionController.getStudentSubmissions(currentUser.id);
        const studentLogs = await ActivityLogController.getStudentLogs(currentUser.id);
        setCompetitions(studentComps);
        setLogs(studentLogs);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
      showToast("Error loading active records: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    refreshData();
  }, [currentUser, refreshData]);

  // Authentication Handlers
  const handleLogin = useCallback(async (email, password) => {
    try {
      const res = await AuthController.login({ email, password });
      setCurrentUser(res.user);
      localStorage.setItem('dap_current_user', JSON.stringify(res.user));
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      setActiveView(res.user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  }, [showToast]);

  const handleRegister = useCallback(async (name, email, password) => {
    try {
      const res = await AuthController.registerStudent({ name, email, password });
      setCurrentUser(res.user);
      localStorage.setItem('dap_current_user', JSON.stringify(res.user));
      showToast(`Account created successfully! Welcome, ${res.user.name}`, 'success');
      setActiveView('student-dashboard');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  }, [showToast]);

  const handleLogout = useCallback(async () => {
    await AuthController.logout();
    setCurrentUser(null);
    localStorage.removeItem('dap_current_user');
    showToast('You have been securely logged out.', 'info');
    setActiveView('home');
  }, [showToast]);

  // Competition CRUD Handlers
  const handleCreateRecord = useCallback(async (formData) => {
    if (!currentUser) throw new Error("Must be logged in to create a submission.");
    try {
      const saved = await CompetitionController.createSubmission(formData, currentUser.id, currentUser.name);
      showToast('Competition record successfully submitted!', 'success');
      await refreshData();
      return saved;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [currentUser, refreshData, showToast]);

  const handleUpdateRecord = useCallback(async (competitionId, updateData) => {
    if (!currentUser) throw new Error("Must be logged in to update a submission.");
    try {
      const updated = await CompetitionController.updateSubmission(competitionId, updateData, currentUser.id, currentUser.name);
      showToast('Submission updated successfully!', 'success');
      await refreshData();
      return updated;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [currentUser, refreshData, showToast]);

  const handleDeleteRecord = useCallback(async (competitionId) => {
    if (!currentUser) throw new Error("Must be logged in to delete a submission.");
    try {
      await CompetitionController.deleteSubmission(competitionId, currentUser.id, currentUser.name);
      showToast('Submission deleted permanently.', 'success');
      await refreshData();
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [currentUser, refreshData, showToast]);

  const handleUpdateCredentials = useCallback((mode, sheetsUrl, supabaseUrl, supabaseKey) => {
    const updated = { mode, googleSheetsUrl: sheetsUrl, supabaseUrl, supabaseKey, isFallbackMode: true };
    localStorage.setItem('dap_cloud_credentials', JSON.stringify(updated));
    setCredentials(updated);
    showToast(`Master storage backend switched to ${mode.toUpperCase()}`, 'success');
  }, [showToast]);

  const value = {
    currentUser,
    activeView,
    setActiveView,
    selectedSubmission,
    setSelectedSubmission,
    theme,
    setTheme,
    toast,
    showToast,
    credentials,
    competitions,
    logs,
    students,
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
    handleCreateRecord,
    handleUpdateRecord,
    handleDeleteRecord,
    handleUpdateCredentials,
    refreshData
  };

  return <DapContext.Provider value={value}>{children}</DapContext.Provider>;
}

export function useDap() {
  const context = useContext(DapContext);
  if (!context) throw new Error('useDap must be used within a DapProvider');
  return context;
}
