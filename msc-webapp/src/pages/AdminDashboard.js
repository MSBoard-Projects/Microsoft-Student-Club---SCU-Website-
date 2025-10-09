import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout, isSuperAdmin, canManageContent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <div className="bg-navy text-text-light py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm mt-1">
              Welcome, {user?.email} ({user?.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Members Management */}
          {canManageContent() && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-navy mb-4">Members</h2>
              <p className="text-text mb-4">
                Manage team members, add new members, and update member information.
              </p>
              <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md w-full">
                Manage Members
              </button>
            </div>
          )}

          {/* Events Management */}
          {canManageContent() && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-navy mb-4">Events</h2>
              <p className="text-text mb-4">
                Create, update, and manage club events and activities.
              </p>
              <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md w-full">
                Manage Events
              </button>
            </div>
          )}

          {/* Site Content Management */}
          {canManageContent() && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-navy mb-4">Site Content</h2>
              <p className="text-text mb-4">
                Edit site content like vision, mission, and other text sections.
              </p>
              <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md w-full">
                Manage Content
              </button>
            </div>
          )}

          {/* User Management (SuperAdmin Only) */}
          {isSuperAdmin() && (
            <div className="bg-white p-6 rounded-lg shadow-md border-2 border-accent">
              <h2 className="text-2xl font-bold text-navy mb-4">Admin Users</h2>
              <p className="text-text mb-4">
                Manage admin users and their permissions (SuperAdmin only).
              </p>
              <button className="bg-accent hover:bg-primary text-navy hover:text-white px-4 py-2 rounded-md w-full font-semibold">
                Manage Users
              </button>
            </div>
          )}
        </div>

        {/* Role Information */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-navy mb-4">Your Permissions</h3>
          <ul className="list-disc list-inside text-text space-y-2">
            {canManageContent() && (
              <>
                <li>✓ Manage Members (Create, Update, Delete)</li>
                <li>✓ Manage Events (Create, Update, Delete)</li>
                <li>✓ Manage Site Content (Create, Update, Delete)</li>
                <li>✓ Upload Images to Azure Blob Storage</li>
              </>
            )}
            {isSuperAdmin() && (
              <li className="text-accent font-semibold">
                ✓ Manage Admin Users (SuperAdmin Exclusive)
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
