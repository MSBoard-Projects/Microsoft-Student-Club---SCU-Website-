import React, { useState, useEffect } from 'react';
import { membersApi } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import ImageUpload from '../components/ImageUpload';

/**
 * Member Management Page (Admin CRUD interface)
 * Allows admins to create, view, edit, and delete team members
 */
const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [memberTypes, setMemberTypes] = useState([
    { value: 1, label: 'High Board' },
    { value: 2, label: 'Board' },
    { value: 3, label: 'Golden Member' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentMember, setCurrentMember] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    positionTitle: '',
    memberTypeId: 1,
    email: '',
    phoneNumber: '',
    imageUrl: '',
    certificateUrl: '',
    displayOrder: 0
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, []);

  // Fetch all members
  const fetchMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await membersApi.getAll();
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError('Failed to load members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter members by type
  const filteredMembers = filterType === 'all' 
    ? members 
    : members.filter(m => m.memberTypeId === parseInt(filterType));

  // Open create modal
  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      fullName: '',
      positionTitle: '',
      memberTypeId: 1,
      email: '',
      phoneNumber: '',
      imageUrl: '',
      certificateUrl: '',
      displayOrder: 0
    });
    setFormErrors({});
    setCurrentMember(null);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (member) => {
    setModalMode('edit');
    setFormData({
      fullName: member.fullName,
      positionTitle: member.positionTitle,
      memberTypeId: member.memberTypeId,
      email: member.email || '',
      phoneNumber: member.phoneNumber || '',
      imageUrl: member.imageUrl || '',
      certificateUrl: member.certificateUrl || '',
      displayOrder: member.displayOrder
    });
    setFormErrors({});
    setCurrentMember(member);
    setShowModal(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
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
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!formData.positionTitle.trim()) {
      errors.positionTitle = 'Position title is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.imageUrl) {
      errors.imageUrl = 'Member image is required';
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
        await membersApi.create(formData);
      } else {
        await membersApi.update(currentMember.id, formData);
      }
      
      // Refresh members list
      await fetchMembers();
      
      // Close modal
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save member:', err);
      setError(err.response?.data?.message || 'Failed to save member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!memberToDelete) return;
    
    setDeleting(true);
    setError('');
    
    try {
      await membersApi.delete(memberToDelete.id);
      
      // Refresh members list
      await fetchMembers();
      
      // Close modal
      setShowDeleteModal(false);
      setMemberToDelete(null);
    } catch (err) {
      console.error('Failed to delete member:', err);
      setError(err.response?.data?.message || 'Failed to delete member. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Image upload handlers
  const handleImageUpload = (blobUrl) => {
    setFormData(prev => ({ ...prev, imageUrl: blobUrl }));
    if (formErrors.imageUrl) {
      setFormErrors(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleCertificateUpload = (blobUrl) => {
    setFormData(prev => ({ ...prev, certificateUrl: blobUrl }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Member Management</h1>
          <p className="text-gray-600 mt-2">Manage team members, positions, and information</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchMembers} />
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-text">Filter by Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Members</option>
              {memberTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <Button onClick={handleCreate} variant="primary">
            + Add Member
          </Button>
        </div>

        {/* Members List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading members..." />
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">No members found.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map(member => (
              <Card key={member.id}>
                {/* Member Image */}
                {member.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={member.imageUrl} 
                      alt={member.fullName}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </div>
                )}
                
                {/* Member Info */}
                <h3 className="text-lg font-semibold text-text mb-1">{member.fullName}</h3>
                <p className="text-sm text-gray-600 mb-2">{member.positionTitle}</p>
                <p className="text-xs text-gray-500 mb-1">
                  {memberTypes.find(t => t.value === member.memberTypeId)?.label}
                </p>
                
                {member.email && (
                  <p className="text-xs text-gray-500 mb-1">📧 {member.email}</p>
                )}
                
                {member.phoneNumber && (
                  <p className="text-xs text-gray-500 mb-3">📱 {member.phoneNumber}</p>
                )}
                
                {member.certificateUrl && (
                  <a 
                    href={member.certificateUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mb-3 inline-block"
                  >
                    View Certificate
                  </a>
                )}
                
                {/* Actions */}
                <div className="flex space-x-2 mt-4">
                  <Button 
                    onClick={() => handleEdit(member)} 
                    variant="secondary" 
                    size="sm"
                    fullWidth
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteClick(member)} 
                    variant="danger" 
                    size="sm"
                    fullWidth
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalMode === 'create' ? 'Add New Member' : 'Edit Member'}
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Full Name */}
              <FormInput
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                error={formErrors.fullName}
                required
              />

              {/* Position Title */}
              <FormInput
                label="Position Title"
                name="positionTitle"
                value={formData.positionTitle}
                onChange={handleInputChange}
                error={formErrors.positionTitle}
                required
              />

              {/* Member Type */}
              <FormSelect
                label="Member Type"
                name="memberTypeId"
                value={formData.memberTypeId}
                onChange={handleInputChange}
                options={memberTypes}
                required
              />

              {/* Email */}
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={formErrors.email}
              />

              {/* Phone Number */}
              <FormInput
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />

              {/* Display Order */}
              <FormInput
                label="Display Order"
                name="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={handleInputChange}
                helperText="Lower numbers appear first"
              />

              {/* Member Image Upload */}
              <ImageUpload
                containerName="member-images"
                currentImageUrl={formData.imageUrl}
                label="Member Photo *"
                onUploadComplete={handleImageUpload}
                onUploadError={(err) => setFormErrors(prev => ({ ...prev, imageUrl: err }))}
              />
              {formErrors.imageUrl && (
                <p className="text-sm text-red-600 mt-1">{formErrors.imageUrl}</p>
              )}

              {/* Certificate Upload */}
              <ImageUpload
                containerName="certificates"
                currentImageUrl={formData.certificateUrl}
                label="Certificate (Optional)"
                onUploadComplete={handleCertificateUpload}
              />
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
                {submitting ? 'Saving...' : (modalMode === 'create' ? 'Create Member' : 'Save Changes')}
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
              Are you sure you want to delete <strong>{memberToDelete?.fullName}</strong>? 
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
              {deleting ? 'Deleting...' : 'Delete Member'}
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default MemberManagement;
