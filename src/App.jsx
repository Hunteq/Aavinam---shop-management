import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Financials from './pages/Financials';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Stock from './pages/Stock';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Login from './components/Login';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" />;
  
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/stock" element={
            <ProtectedRoute>
              <Stock />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute adminOnly={true}>
              <Reports />
            </ProtectedRoute>
          } />
          
          <Route path="/financials" element={
            <ProtectedRoute adminOnly={true}>
              <Financials />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <PWAInstallPrompt />
      </AuthProvider>
    </Router>
  );
}

export default App;
