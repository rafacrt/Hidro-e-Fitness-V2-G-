import React, { useState, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import Login from './pages/Login';
import { User } from './types';

// Lazy Load Pages for better performance and loading states
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Students = React.lazy(() => import('./pages/Students'));
const ArchitectureDocs = React.lazy(() => import('./pages/ArchitectureDocs'));
const Classes = React.lazy(() => import('./pages/Classes'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Finance = React.lazy(() => import('./pages/Finance'));

// Loading Component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full text-slate-400">
    <Loader2 size={48} className="animate-spin text-primary-500 mb-4" />
    <p className="text-sm font-medium animate-pulse">Carregando...</p>
  </div>
);

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
  restrictedToDev?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, children, restrictedToDev = false }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (restrictedToDev && user.role !== 'DEV') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
        
        <Route path="/*" element={
          <ProtectedRoute user={user}>
            <Layout user={user!} onLogout={handleLogout}>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/classes" element={<Classes />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/finance" element={<Finance />} />
                  
                  {/* DEV ONLY ROUTES */}
                  <Route path="/users" element={
                    <ProtectedRoute user={user} restrictedToDev={true}>
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/architecture" element={
                    <ProtectedRoute user={user} restrictedToDev={true}>
                      <ArchitectureDocs />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;