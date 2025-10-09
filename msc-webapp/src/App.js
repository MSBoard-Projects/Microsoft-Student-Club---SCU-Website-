import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Landing from './pages/Landing';
import Team from './pages/Team';
import Events from './pages/Events';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import MemberManagement from './pages/MemberManagement';
import EventManagement from './pages/EventManagement';
import SiteContentManagement from './pages/SiteContentManagement';
import AdminUserManagement from './pages/AdminUserManagement';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App flex flex-col min-h-screen">
          <Navbar />
          
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/team" element={<Team />} />
              <Route path="/events" element={<Events />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Protected Admin Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/members"
                element={
                  <PrivateRoute>
                    <MemberManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <PrivateRoute>
                    <EventManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/content"
                element={
                  <PrivateRoute>
                    <SiteContentManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <PrivateRoute>
                    <AdminUserManagement />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
          
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

