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
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { CollectionToolbar, CollectionPagination, COLLECTION_PAGE_SIZE } from '../components/CollectionControls';

/**
 * Admin User Management Page (SuperAdmin only)
 * Allows SuperAdmins to create, view, edit, and delete admin users
 */
const AdminUserManagement = () => {
  const { user, isSuperAdmin } = useAuth();
  const canManageUsers = isSuperAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const [saveError, setSaveError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
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
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  // Fetch all admin users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminUsersApi.getAll();
      setUsers(data);
      setPage(1);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      setError('Failed to load admin users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const superAdminCount = users.filter(adminUser => adminUser.role === 'SuperAdmin').length;
  const editingLastSuperAdmin = modalMode === 'edit' && currentUser?.role === 'SuperAdmin' && superAdminCount === 1;
  const query = search.trim().toLowerCase();
  const filteredUsers = users.filter(adminUser =>
    (filterRole === 'all' || adminUser.role === filterRole) &&
    [adminUser.email, roleOptions.find(option => option.value === adminUser.role)?.label].some(value => value?.toLowerCase().includes(query))
  );
  const visibleUsers = filteredUsers.slice((page - 1) * COLLECTION_PAGE_SIZE, page * COLLECTION_PAGE_SIZE);
  const closeEditor = () => {
    setShowModal(false);
    setFormData(previous => ({ ...previous, password: '' }));
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
    setSaveError('');
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
    setSaveError('');
    setCurrentUser(adminUser);
    setShowModal(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (adminUser) => {
    // Check if trying to delete last SuperAdmin
    if (adminUser.role === 'SuperAdmin' && superAdminCount === 1) {
      setError('Cannot delete the last Super Admin account.');
      return;
    }

    // Check if trying to delete self
    if (adminUser.id === user?.id) {
      setError('Cannot delete your own account.');
      return;
    }

    setDeleteError('');
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Invalid email format';
    }
    
    // Password required only for create mode or if user entered something in edit mode
    if (modalMode === 'create' && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 12) {
      errors.password = 'Password must be at least 12 characters';
    } else if (formData.password && (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[^a-zA-Z0-9]/.test(formData.password))) {
      errors.password = 'Include uppercase, lowercase, a number, and a symbol.';
    }

    if (!roleOptions.some(option => option.value === formData.role)) {
      errors.role = 'Select a valid role.';
    } else if (editingLastSuperAdmin && formData.role !== 'SuperAdmin') {
      errors.role = 'Cannot change the role of the last Super Admin.';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !canManageUsers) return;
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setSaveError('');
    
    try {
      if (modalMode === 'create') {
        await adminUsersApi.create({ ...formData, email: formData.email.trim() });
      } else {
        // For update, only send password if it was changed
        const updateData = {
          email: formData.email.trim(),
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
      closeEditor();
    } catch (err) {
      console.error('Failed to save admin user:', err);
      const errors = err.response?.data?.errors;
      const details = typeof errors === 'string' ? errors : Object.values(errors || {}).flat().filter(value => typeof value === 'string').join(' ');
      setSaveError(err.response?.data?.message || details || 'Failed to save admin user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!userToDelete || deleting || !canManageUsers) return;
    
    setDeleting(true);
    setDeleteError('');
    
    try {
      await adminUsersApi.delete(userToDelete.id);
      
      // Refresh users list
      await fetchUsers();
      
      // Close modal
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Failed to delete admin user:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete admin user. Please try again.');
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
  if (!canManageUsers) {
    return (
      <div className="collection-page">
            <div className="collection-empty">
              <h1 className="text-2xl font-bold text-text mb-4">Access Denied</h1>
              <p className="text-gray-600">
                You do not have permission to access this page. Only Super Admins can manage admin users.
              </p>
            </div>
      </div>
    );
  }

  return (
    <div className="collection-page">
      <div>
        {/* Header */}
        <div className="collection-heading">
          <h1>Admin User Management</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchUsers} />
          </div>
        )}

        {/* Actions Bar */}
        <CollectionToolbar label="admin users" search={search} onSearch={value => { setSearch(value); setPage(1); }}
          filter={filterRole} onFilter={value => { setFilterRole(value); setPage(1); }}
          options={[{ value: 'all', label: 'All roles' }, ...roleOptions]}
          onRefresh={fetchUsers} loading={loading} onCreate={handleCreate} createLabel="Add Admin User" />

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading admin users..." />
          </div>
        ) : error && users.length === 0 ? null : filteredUsers.length === 0 ? (
          <div className="collection-empty">
            <h2>{users.length === 0 ? 'No admin users yet' : 'No matching admin users'}</h2>
            {(search || filterRole !== 'all') && <button type="button" onClick={() => { setSearch(''); setFilterRole('all'); setPage(1); }}>Clear filters</button>}
          </div>
        ) : (
          <div className="collection-list">
            {visibleUsers.map(adminUser => (
              <Card key={adminUser.id}>
                <div className="collection-list-row">
                  <div className="collection-list-copy">
                    <div className="collection-list-title">
                      <h3>
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
                  <div className="collection-row-actions">
                    <button type="button" className="collection-icon" onClick={() => handleEdit(adminUser)} aria-label={`Edit ${adminUser.email}`} title={`Edit ${adminUser.email}`}><FiEdit2 aria-hidden="true" /></button>
                    <button type="button" className="collection-icon collection-danger" onClick={() => handleDeleteClick(adminUser)}
                      aria-label={`Delete ${adminUser.email}`}
                      title={adminUser.id === user?.id ? 'Cannot delete your own account' : adminUser.role === 'SuperAdmin' && superAdminCount === 1 ? 'Cannot delete the last Super Admin' : `Delete ${adminUser.email}`}
                      disabled={adminUser.id === user?.id || (adminUser.role === 'SuperAdmin' && superAdminCount === 1)}><FiTrash2 aria-hidden="true" /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredUsers.length > 0 && <CollectionPagination label="admin users" page={page} total={filteredUsers.length} onPage={setPage} />}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={closeEditor}
          title={modalMode === 'create' ? 'Add New Admin User' : 'Edit Admin User'}
          size="md"
          busy={submitting}
        >
          <form onSubmit={handleSubmit} aria-busy={submitting}>
            {saveError && <div role="alert" className="collection-form-error">{saveError}</div>}
            <fieldset disabled={submitting} className="space-y-4">
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
                helperText="At least 12 characters, including uppercase, lowercase, a digit, and a symbol"
              />

              {/* Role */}
              <FormSelect
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                options={roleOptions}
                error={formErrors.role}
                disabled={editingLastSuperAdmin}
                helperText={editingLastSuperAdmin ? 'The last Super Admin must retain this role.' : ''}
                required
              />

              {/* Permission Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-900">
                  <strong>{formData.role === 'SuperAdmin' ? 'Super Admin' : 'Content Editor'}:</strong> {getPermissionDescription(formData.role)}
                </p>
              </div>
            </fieldset>

            {/* Modal Footer with Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                onClick={closeEditor}
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
          busy={deleting}
        >
          {deleteError && <div role="alert" className="collection-form-error">{deleteError}</div>}
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
