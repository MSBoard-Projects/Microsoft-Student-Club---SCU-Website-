import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaCalendarAlt, FaFileAlt, FaUsersCog, FaSignOutAlt, FaCheckCircle } from 'react-icons/fa';
import PageTransition from '../components/PageTransition';

const AdminDashboard = () => {
  const { user, logout, isSuperAdmin, canManageContent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#203a6c] to-[#0078d4] text-white py-8 shadow-lg">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="animate-fadeIn">
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-sm opacity-90">
                Welcome back, <span className="font-semibold">{user?.email}</span>
                <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                  {user?.role}
                </span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transform hover:scale-105 transition-all duration-200"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Management Tools</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Members Management */}
            {canManageContent() && (
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 card-hover animate-fadeIn">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-[#0078d4] to-[#50e6ff] text-white p-4 rounded-full">
                    <FaUsers className="text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-navy">Members</h2>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Manage team members, add new members, and update member information.
                </p>
                <button 
                  onClick={() => navigate('/admin/members')}
                  className="bg-[#0078d4] hover:bg-[#0061b3] text-white px-6 py-3 rounded-lg w-full font-semibold shadow-md transform hover:scale-105 transition-all duration-200"
                >
                  Manage Members
                </button>
              </div>
            )}

            {/* Events Management */}
            {canManageContent() && (
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 card-hover animate-fadeIn animate-delay-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-full">
                    <FaCalendarAlt className="text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-navy">Events</h2>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Create, update, and manage club events and activities.
                </p>
                <button 
                  onClick={() => navigate('/admin/events')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg w-full font-semibold shadow-md transform hover:scale-105 transition-all duration-200"
                >
                  Manage Events
                </button>
              </div>
            )}

            {/* Site Content Management */}
            {canManageContent() && (
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 card-hover animate-fadeIn animate-delay-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-full">
                    <FaFileAlt className="text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-navy">Site Content</h2>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Edit site content like vision, mission, and other text sections.
                </p>
                <button 
                  onClick={() => navigate('/admin/content')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg w-full font-semibold shadow-md transform hover:scale-105 transition-all duration-200"
                >
                  Manage Content
                </button>
              </div>
            )}

            {/* User Management (SuperAdmin Only) */}
            {isSuperAdmin() && (
              <div className="bg-gradient-to-br from-[#50e6ff] to-[#0078d4] text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 card-hover animate-fadeIn animate-delay-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                    <FaUsersCog className="text-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold">Admin Users</h2>
                </div>
                <p className="mb-6 leading-relaxed opacity-95">
                  Manage admin users and their permissions (SuperAdmin only).
                </p>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="bg-white text-[#0078d4] px-6 py-3 rounded-lg w-full font-bold shadow-md transform hover:scale-105 transition-all duration-200 hover:bg-gray-50"
                >
                  Manage Users
                </button>
              </div>
            )}
          </div>

          {/* Role Information */}
          <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg animate-fadeIn animate-delay-400">
            <h3 className="text-2xl font-bold text-navy mb-6 flex items-center gap-3">
              <FaCheckCircle className="text-green-500" />
              Your Permissions
            </h3>
            <ul className="space-y-3 text-gray-700">
              {canManageContent() && (
                <>
                  <li className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500" />
                    Manage Members (Create, Update, Delete)
                  </li>
                  <li className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500" />
                    Manage Events (Create, Update, Delete)
                  </li>
                  <li className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500" />
                    Manage Site Content (Create, Update, Delete)
                  </li>
                  <li className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500" />
                    Upload Images to Azure Blob Storage
                  </li>
                </>
              )}
              {isSuperAdmin() && (
                <li className="flex items-center gap-3 text-[#0078d4] font-semibold">
                  <FaCheckCircle className="text-[#50e6ff]" />
                  Manage Admin Users (SuperAdmin Exclusive)
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AdminDashboard;
