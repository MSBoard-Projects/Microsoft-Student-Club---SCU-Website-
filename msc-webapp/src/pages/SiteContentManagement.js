import React, { useState, useEffect } from 'react';
import { siteContentApi } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FormInput from '../components/FormInput';
import FormTextarea from '../components/FormTextarea';

/**
 * Site Content Management Page (Admin CRUD interface)
 * Allows admins to manage editable text content (vision, mission, etc.)
 */
const SiteContentManagement = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentContent, setCurrentContent] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    contentKey: '',
    contentValue: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contentToDelete, setContentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch site content on mount
  useEffect(() => {
    fetchContents();
  }, []);

  // Fetch all site content
  const fetchContents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await siteContentApi.getAll();
      setContents(data);
    } catch (err) {
      console.error('Failed to fetch site content:', err);
      setError('Failed to load site content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      contentKey: '',
      contentValue: ''
    });
    setFormErrors({});
    setCurrentContent(null);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (content) => {
    setModalMode('edit');
    setFormData({
      contentKey: content.contentKey,
      contentValue: content.contentValue
    });
    setFormErrors({});
    setCurrentContent(content);
    setShowModal(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (content) => {
    setContentToDelete(content);
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
    
    if (!formData.contentKey.trim()) {
      errors.contentKey = 'Content key is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.contentKey)) {
      errors.contentKey = 'Content key can only contain letters, numbers, underscores, and hyphens';
    }
    
    if (!formData.contentValue.trim()) {
      errors.contentValue = 'Content value is required';
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
        await siteContentApi.create(formData);
      } else {
        // For update, we use the contentKey as identifier
        await siteContentApi.update(currentContent.contentKey, {
          contentValue: formData.contentValue
        });
      }
      
      // Refresh content list
      await fetchContents();
      
      // Close modal
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save content:', err);
      setError(err.response?.data?.message || 'Failed to save content. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!contentToDelete) return;
    
    setDeleting(true);
    setError('');
    
    try {
      await siteContentApi.delete(contentToDelete.contentKey);
      
      // Refresh content list
      await fetchContents();
      
      // Close modal
      setShowDeleteModal(false);
      setContentToDelete(null);
    } catch (err) {
      console.error('Failed to delete content:', err);
      setError(err.response?.data?.message || 'Failed to delete content. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Site Content Management</h1>
          <p className="text-gray-600 mt-2">Manage editable text sections (Vision, Mission, etc.)</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchContents} />
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex justify-end">
          <Button onClick={handleCreate} variant="primary">
            + Add Content
          </Button>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading content..." />
          </div>
        ) : contents.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">No site content found.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {contents.map(content => (
              <Card key={content.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text mb-2">
                      {content.contentKey}
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {content.contentValue}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2 ml-4">
                    <Button 
                      onClick={() => handleEdit(content)} 
                      variant="secondary" 
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button 
                      onClick={() => handleDeleteClick(content)} 
                      variant="danger" 
                      size="sm"
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
          title={modalMode === 'create' ? 'Add New Content' : 'Edit Content'}
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Content Key (disabled in edit mode) */}
              <FormInput
                label="Content Key"
                name="contentKey"
                value={formData.contentKey}
                onChange={handleInputChange}
                error={formErrors.contentKey}
                disabled={modalMode === 'edit'}
                required
                helperText="Unique identifier (e.g., 'vision', 'mission', 'about-us'). Only letters, numbers, underscores, and hyphens allowed."
              />

              {/* Content Value */}
              <FormTextarea
                label="Content Value"
                name="contentValue"
                value={formData.contentValue}
                onChange={handleInputChange}
                error={formErrors.contentValue}
                rows={6}
                required
                helperText="The text content that will be displayed on the website."
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
                {submitting ? 'Saving...' : (modalMode === 'create' ? 'Create Content' : 'Save Changes')}
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
              Are you sure you want to delete the content with key <strong>{contentToDelete?.contentKey}</strong>? 
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
              {deleting ? 'Deleting...' : 'Delete Content'}
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SiteContentManagement;
