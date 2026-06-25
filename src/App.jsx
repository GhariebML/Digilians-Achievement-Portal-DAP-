import React, { Suspense } from 'react';
import { DapProvider, useDap } from './context/DapContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Lazy loaded views
const Home = React.lazy(() => import('./components/pages/Home').then(m => ({ default: m.Home })));
const Login = React.lazy(() => import('./components/auth/Login').then(m => ({ default: m.Login })));
const StudentDashboard = React.lazy(() => import('./components/pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const AdminDashboard = React.lazy(() => import('./components/pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CompetitionFormPage = React.lazy(() => import('./components/pages/student/CompetitionFormPage').then(m => ({ default: m.CompetitionFormPage })));

function MainContent() {
  const { activeView, toast } = useDap();

  return (
    <>
      <Navbar />
      
      {/* Active Toast Notification */}
      {toast && (
        <div className={`saas-toast saas-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      <main className="saas-main">
        <Suspense fallback={<div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading module...</div>}>
          {activeView === 'home' && <Home />}
          {activeView === 'login' && <Login />}
          {activeView === 'student-dashboard' && <StudentDashboard />}
          {activeView === 'admin-dashboard' && <AdminDashboard />}
          {activeView === 'competition-form' && <CompetitionFormPage />}
        </Suspense>
      </main>

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <DapProvider>
      <MainContent />
    </DapProvider>
  );
}
