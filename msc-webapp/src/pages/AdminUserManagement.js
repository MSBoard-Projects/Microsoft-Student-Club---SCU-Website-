import React, { useState, useEffect } from 'react';
import { adminUsersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';

/**
 * Admin User Management Page (SuperAdmin only)
 * Allows SuperAdmins to create, view, edit, and delete admin users
 */
const AdminUserManagement = () => {
  const { user, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentUser, setCurrentUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'ContentEditor' // Default role
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Role options
  const roleOptions = [
    { value: 'ContentEditor', label: 'Content Editor' },
    { value: 'SuperAdmin', label: 'Super Admin' }
  ];

  // Fetch users on mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  // Fetch all admin users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminUsersApi.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      setError('Failed to load admin users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      email: '',
      password: '',
      role: 'ContentEditor'
    });
    setFormErrors({});
    setCurrentUser(null);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (adminUser) => {
    setModalMode('edit');
    setFormData({
      email: adminUser.email,
      password: '', // Don't populate password for security
      role: adminUser.role
    });
    setFormErrors({});
    setCurrentUser(adminUser);
    setShowModal(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (adminUser) => {
    // Check if trying to delete last SuperAdmin
    const superAdminCount = users.filter(u => u.role === 'SuperAdmin').length;
    if (adminUser.role === 'SuperAdmin' && superAdminCount === 1) {
      setError('Cannot delete the last Super Admin account.');
      return;
    }

    // Check if trying to delete self
    if (adminUser.id === user?.id) {
      setError('Cannot delete your own account.');
      return;
    }

    setUserToDelete(adminUser);
    setShowDeleteModal(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    // Password required only for create mode or if user entered something in edit mode
    if (modalMode === 'create' && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      if (modalMode === 'create') {
        await adminUsersApi.create(formData);
      } else {
        // For update, only send password if it was changed
        const updateData = {
          email: formData.email,
          role: formData.role
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await adminUsersApi.update(currentUser.id, updateData);
      }
      
      // Refresh users list
      await fetchUsers();
      
      // Close modal
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save admin user:', err);
      setError(err.response?.data?.message || 'Failed to save admin user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!userToDelete) return;
    
    setDeleting(true);
    setError('');
    
    try {
      await adminUsersApi.delete(userToDelete.id);
      
      // Refresh users list
      await fetchUsers();
      
      // Close modal
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Failed to delete admin user:', err);
      setError(err.response?.data?.message || 'Failed to delete admin user. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Permission descriptions
  const getPermissionDescription = (role) => {
    if (role === 'SuperAdmin') {
      return 'Full access: Manage all content + manage admin users';
    }
    return 'Limited access: Manage content only (Members, Events, Site Content)';
  };

  // Redirect if not SuperAdmin
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-text mb-4">Access Denied</h2>
              <p className="text-gray-600">
                You do not have permission to access this page. Only Super Admins can manage admin users.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Admin User Management</h1>
          <p className="text-gray-600 mt-2">Manage admin accounts and permissions (SuperAdmin only)</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchUsers} />
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex justify-end">
          <Button onClick={handleCreate} variant="primary">
            + Add Admin User
          </Button>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading admin users..." />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">No admin users found.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map(adminUser => (
              <Card key={adminUser.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-text">
                        {adminUser.email}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded ${
                        adminUser.role === 'SuperAdmin' 
                          ? 'bg-accent text-navy' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {adminUser.role === 'SuperAdmin' ? 'SUPER ADMIN' : 'CONTENT EDITOR'}
                      </span>
                      {adminUser.id === user?.id && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      {getPermissionDescription(adminUser.role)}
                    </p>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Created: {formatDate(adminUser.createdAt)}</p>
                      <p>Last Login: {formatDate(adminUser.lastLogin)}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2 ml-4">
                    <Button 
                      onClick={() => handleEdit(adminUser)} 
                      variant="secondary" 
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDeleteClick(adminUser)} 
                      variant="danger" 
                      size="sm"
                      disabled={adminUser.id === user?.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalMode === 'create' ? 'Add New Admin User' : 'Edit Admin User'}
          size="md"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={formErrors.email}
                required
              />

              {/* Password */}
              <FormInput
                label={modalMode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={formErrors.password}
                required={modalMode === 'create'}
                helperText="Minimum 6 characters"
              />

              {/* Role */}
              <FormSelect
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                options={roleOptions}
                required
              />

              {/* Permission Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-900">
                  <strong>{formData.role === 'SuperAdmin' ? 'Super Admin' : 'Content Editor'}:</strong> {getPermissionDescription(formData.role)}
                </p>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                onClick={() => setShowModal(false)}
                variant="ghost"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : (modalMode === 'create' ? 'Create User' : 'Save Changes')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirm Delete"
          size="sm"
        >
          <div className="mb-6">
            <p className="text-gray-700">
              Are you sure you want to delete the admin user <strong>{userToDelete?.email}</strong>? 
              This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              variant="ghost"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="danger"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminUserManagement;
