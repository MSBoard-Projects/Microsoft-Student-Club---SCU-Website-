import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/public/PublicHeader';
import Footer from './components/public/PublicFooter';
import SiteFrame from './components/public/SiteFrame';
import { PublicThemeProvider } from './components/public/ThemeProvider';
import { ShowcaseProvider, PublicContentGate } from './context/ShowcaseContext';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/AdminLayout';

// Pages
import Landing from './pages/ClubLanding';
import MembersPage, { LeadershipPage, MemberProfile } from './pages/MemberDirectory';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';
import GoldenMembers from './pages/GoldenMembers';
import RatingManagement from './pages/RatingManagement';
import Sponsors from './pages/Sponsors';
import Events, { EventPage, GalleryPage } from './components/public/EventCollection';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ContentManagement from './pages/ContentManagement';
import SiteContentManagement from './pages/SiteContentManagement';
import AdminUserManagement from './pages/AdminUserManagement';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PublicThemeProvider>
        <ShowcaseProvider>
        <SiteFrame>
          <Navbar />
          
          <main className="flex-grow" id="public-main">
            <PublicContentGate>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/team" element={<Navigate to="/members" replace />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/members/:id" element={<MemberProfile />} />
              <Route path="/leadership" element={<LeadershipPage />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/golden-members" element={<GoldenMembers />} />
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="members" element={<ContentManagement kind="members" />} />
                <Route path="events" element={<ContentManagement kind="events" />} />
                <Route path="achievements" element={<ContentManagement kind="achievements" />} />
                <Route path="statistics" element={<ContentManagement kind="statistics" />} />
                <Route path="ratings" element={<RatingManagement />} />
                <Route path="sponsors" element={<ContentManagement kind="sponsors" />} />
                <Route path="content" element={<SiteContentManagement />} />
                <Route path="users" element={<AdminUserManagement />} />
                <Route path="*" element={<NotFound destination="/admin/dashboard" actionLabel="Return to overview" />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </PublicContentGate>
          </main>
          
          <Footer />
          
          {/* Toast Notifications Container */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </SiteFrame>
        </ShowcaseProvider>
        </PublicThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

