import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    return 'home';
  });

  const [theme, setTheme] = useState('light');
  const [toast, setToast] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Active data state based on user role
  const [competitions, setCompetitions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    // Keep it displayed long enough for reading OTP codes in dev mode
    setTimeout(() => setToast(null), 6000);
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Attempt session restoration on startup
  useEffect(() => {
    const restore = async () => {
      const user = await SupabaseService.restoreSession();
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('dap_current_user', JSON.stringify(user));
        setActiveView(user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
        showToast(`Logged in automatically. Welcome back!`, 'success');
      }
    };
    restore();
  }, [showToast]);

  // Fetch active tenant data based on currentUser
  const refreshData = useCallback(async () => {
    if (!currentUser) {
      setCompetitions([]);
      setLogs([]);
      setStudents([]);
      setAdminStats(null);
      return;
    }

    setLoading(true);
    try {
      if (currentUser.role === 'admin') {
        const allComps = await SupabaseService.getAllSubmissions();
        const allLogs = await SupabaseService.getAllLogs();
        const allStds = await SupabaseService.getAllStudents();
        const stats = await SupabaseService.getAdminStats();
        setCompetitions(allComps);
        setLogs(allLogs);
        setStudents(allStds);
        setAdminStats(stats);
      } else {
        const studentComps = await SupabaseService.getStudentSubmissions(currentUser.id);
        const studentLogs = await SupabaseService.getStudentLogs(currentUser.id);
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
      const res = await SupabaseService.login({ email, password });
      
      if (res.unverified) {
        setVerificationEmail(email);
        showToast('Email verification required. Please enter the code sent to your email.', 'warning');
        if (res.otpCode) {
          showToast(`[DEV MODE] OTP Code is: ${res.otpCode}`, 'info');
        }
        return { success: true, needsVerification: true };
      }

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

  const handleRegister = useCallback(async (name, email, password, confirmPassword) => {
    try {
      const res = await SupabaseService.registerStudent({ name, email, password, confirmPassword });
      setVerificationEmail(email);
      showToast('Registration successful! OTP verification code sent.', 'success');
      if (res.otpCode) {
        showToast(`[DEV MODE] OTP Code is: ${res.otpCode}`, 'info');
      }
      return { success: true, needsVerification: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  }, [showToast]);

  const handleVerifyOtp = useCallback(async (email, otpCode) => {
    try {
      const res = await SupabaseService.verifyOtp({ email, otpCode });
      setCurrentUser(res.user);
      localStorage.setItem('dap_current_user', JSON.stringify(res.user));
      setVerificationEmail('');
      showToast(`Email verified successfully! Welcome, ${res.user.name}`, 'success');
      setActiveView('student-dashboard');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  }, [showToast]);

  const handleResendOtp = useCallback(async (email) => {
    try {
      const res = await SupabaseService.resendOtp({ email });
      showToast('Verification code resent successfully.', 'success');
      if (res.otpCode) {
        showToast(`[DEV MODE] OTP Code is: ${res.otpCode}`, 'info');
      }
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  }, [showToast]);

  const handleLogout = useCallback(async () => {
    await SupabaseService.logout();
    setCurrentUser(null);
    localStorage.removeItem('dap_current_user');
    showToast('You have been securely logged out.', 'info');
    setActiveView('home');
  }, [showToast]);

  const handleForgotPassword = useCallback(async (email) => {
    try {
      const res = await SupabaseService.forgotPassword({ email });
      showToast('Password recovery code sent to your email.', 'success');
      if (res.otpCode) {
        showToast(`[DEV MODE] Recovery OTP is: ${res.otpCode}`, 'info');
      }
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  }, [showToast]);

  const handleResetPassword = useCallback(async (email, otpCode, newPassword) => {
    try {
      await SupabaseService.resetPassword({ email, otpCode, newPassword });
      showToast('Password reset successfully. You can now log in.', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'error');
      return { success: false, error: err.message };
    }
  }, [showToast]);

  // Competition CRUD Handlers
  const handleCreateRecord = useCallback(async (formData) => {
    if (!currentUser) throw new Error("Must be logged in to create a submission.");
    try {
      const saved = await SupabaseService.createSubmission(formData, currentUser.id, currentUser.name);
      showToast('Competition record successfully submitted and synced!', 'success');
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
      const updated = await SupabaseService.updateSubmission(competitionId, updateData, currentUser.id, currentUser.name);
      showToast('Submission updated successfully and synced!', 'success');
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
      await SupabaseService.deleteSubmission(competitionId, currentUser.id, currentUser.name);
      showToast('Submission deleted permanently and sync updated.', 'success');
      await refreshData();
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [currentUser, refreshData, showToast]);

  const handleForceReSyncAll = useCallback(async () => {
    try {
      await SupabaseService.forceReSyncAll();
      showToast('Master synchronization with Google Sheets complete.', 'success');
      await refreshData();
    } catch (err) {
      showToast('Sync error: ' + err.message, 'error');
    }
  }, [refreshData, showToast]);

  const value = {
    currentUser,
    setCurrentUser,
    activeView,
    setActiveView,
    selectedSubmission,
    setSelectedSubmission,
    theme,
    setTheme,
    toast,
    showToast,
    competitions,
    logs,
    students,
    adminStats,
    loading,
    verificationEmail,
    setVerificationEmail,
    handleLogin,
    handleRegister,
    handleVerifyOtp,
    handleResendOtp,
    handleForgotPassword,
    handleResetPassword,
    handleLogout,
    handleCreateRecord,
    handleUpdateRecord,
    handleDeleteRecord,
    handleForceReSyncAll,
    refreshData
  };

  return <DapContext.Provider value={value}>{children}</DapContext.Provider>;
}

export function useDap() {
  const context = useContext(DapContext);
  if (!context) throw new Error('useDap must be used within a DapProvider');
  return context;
}

