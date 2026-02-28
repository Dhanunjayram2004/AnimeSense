import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthContext.jsx';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import BottomNav from '@/components/BottomNav.jsx';

// Pages
import HomePage from '@/components/pages/HomePage.jsx';
import LoginPage from '@/components/pages/LoginPage.jsx';
import SignupPage from '@/components/pages/SignupPage.jsx';
import ArtistProfile from '@/components/pages/ArtistProfile.jsx';
import UserDashboard from '@/components/pages/UserDashboard.jsx';
import ReferenceLibrary from '@/components/pages/ReferenceLibrary.jsx';
import CommunityFeed from '@/components/pages/CommunityFeed.jsx';
import ArtworkDetail from '@/components/pages/ArtworkDetail.jsx';
import DrawingCanvas from '@/components/pages/DrawingCanvas.jsx';
import { Toaster } from '@/components/ui/toaster.jsx';

function AppShell() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <AppInner />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

function AppInner() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let sub;
    let cancelled = false;

    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor?.isNativePlatform?.()) return;
        const { App: CapApp } = await import('@capacitor/app');

        if (cancelled) return;

        sub = CapApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack && window.history.length > 1 && location.pathname !== '/') {
            navigate(-1);
          } else {
            // Swallow back button instead of closing the app
          }
        });
      } catch {
        // Ignore if Capacitor runtime is not available (web build)
      }
    })();

    return () => {
      cancelled = true;
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    };
  }, [location.pathname, navigate]);

  return (
    <>
      <Routes>
        {/* Explore / Feed as landing page */}
        <Route path="/" element={<CommunityFeed />} />

        {/* Auth / profile-related */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Public content */}
        <Route path="/artist/:id" element={<ArtistProfile />} />
        <Route path="/artwork/:id" element={<ArtworkDetail />} />

        {/* Protected workspace + library + dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/references"
          element={
            <ProtectedRoute>
              <ReferenceLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/canvas"
          element={
            <ProtectedRoute>
              <DrawingCanvas />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Persistent mobile bottom navigation */}
      <BottomNav />
    </>
  );
}

export default AppShell;