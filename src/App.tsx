import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import ProfileSetup from './components/ProfileSetup';
import CategorySelection from './components/CategorySelection';
import CountrySelection from './components/CountrySelection';
import ChatRoom from './components/ChatRoom';
import ProfileDashboard from './components/ProfileDashboard';
import ConsultantDashboard from './components/ConsultantDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return !currentUser ? <>{children}</> : <Navigate to="/setup" />;
};

const ConsultantRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser && currentUser.userType === 'consultant' ? <>{children}</> : <Navigate to="/categories" />;
};

function AppContent() {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<'study' | 'travel' | 'visa' | null>(null);

  // Check if user needs profile setup (skip for consultants and guests)
  const needsProfileSetup = currentUser && 
    currentUser.userType !== 'consultant' && 
    !currentUser.isGuest &&
    (!currentUser.displayName || !currentUser.reasonForJoining);

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/setup" 
            element={
              <ProtectedRoute>
                {needsProfileSetup ? (
                  <ProfileSetup onComplete={() => window.location.reload()} />
                ) : (
                  <Navigate to="/categories" />
                )}
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/categories" 
            element={
              <ProtectedRoute>
                {needsProfileSetup ? (
                  <Navigate to="/setup" />
                ) : selectedCategory ? (
                  <CountrySelection 
                    category={selectedCategory} 
                    onBack={() => setSelectedCategory(null)} 
                  />
                ) : (
                  <CategorySelection onCategorySelect={setSelectedCategory} />
                )}
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/chat/:countryCode/:category" 
            element={
              <ProtectedRoute>
                <ChatRoom />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfileDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/consultant-dashboard" 
            element={
              <ConsultantRoute>
                <ConsultantDashboard />
              </ConsultantRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;