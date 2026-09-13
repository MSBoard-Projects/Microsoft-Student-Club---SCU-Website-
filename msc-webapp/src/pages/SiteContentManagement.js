import React, { useState, useEffect } from 'react';
import { siteContentApi } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FormInput from '../components/FormInput';
import FormTextarea from '../components/FormTextarea';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { CollectionToolbar, CollectionPagination, COLLECTION_PAGE_SIZE } from '../components/CollectionControls';

/**
 * Site Content Management Page (Admin CRUD interface)
 * Allows admins to manage editable text content (vision, mission, etc.)
 */
const SiteContentManagement = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [saveError, setSaveError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
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
      setPage(1);
    } catch (err) {
      console.error('Failed to fetch site content:', err);
      setError('Failed to load site content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const query = search.trim().toLowerCase();
  const filteredContents = contents.filter(content =>
    [content.contentKey, content.contentValue].some(value => value?.toLowerCase().includes(query))
  );
  const visibleContents = filteredContents.slice((page - 1) * COLLECTION_PAGE_SIZE, page * COLLECTION_PAGE_SIZE);

  // Open create modal
  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      contentKey: '',
      contentValue: ''
    });
    setFormErrors({});
    setSaveError('');
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
    setSaveError('');
    setCurrentContent(content);
    setShowModal(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (content) => {
    setDeleteError('');
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
    if (submitting) return;
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setSaveError('');
    
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
      setSaveError(err.response?.data?.message || 'Failed to save content. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!contentToDelete || deleting) return;
    
    setDeleting(true);
    setDeleteError('');
    
    try {
      await siteContentApi.delete(contentToDelete.contentKey);
      
      // Refresh content list
      await fetchContents();
      
      // Close modal
      setShowDeleteModal(false);
      setContentToDelete(null);
    } catch (err) {
      console.error('Failed to delete content:', err);
      setDeleteError(err.response?.data?.message || 'Failed to delete content. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="collection-page">
      <div>
        {/* Header */}
        <div className="collection-heading">
          <h1>Site Content Management</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchContents} />
          </div>
        )}

        {/* Actions Bar */}
        <CollectionToolbar label="content" search={search} onSearch={value => { setSearch(value); setPage(1); }}
          onRefresh={fetchContents} loading={loading} onCreate={handleCreate} createLabel="Add Content" />

        {/* Content List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading content..." />
          </div>
        ) : error && contents.length === 0 ? null : filteredContents.length === 0 ? (
          <div className="collection-empty">
            <h2>{contents.length === 0 ? 'No site content yet' : 'No matching content'}</h2>
            {search && <button type="button" onClick={() => { setSearch(''); setPage(1); }}>Clear filters</button>}
          </div>
        ) : (
          <div className="collection-list">
            {visibleContents.map(content => (
              <Card key={content.id}>
                <div className="collection-list-row">
                  <div className="collection-list-copy">
                    <h3 className="text-lg font-semibold text-text mb-2">
                      {content.contentKey}
                    </h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {content.contentValue}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="collection-row-actions">
                    <button type="button" className="collection-icon" onClick={() => handleEdit(content)} aria-label={`Edit ${content.contentKey}`} title={`Edit ${content.contentKey}`}><FiEdit2 aria-hidden="true" /></button>
                    <button type="button" className="collection-icon collection-danger" onClick={() => handleDeleteClick(content)} aria-label={`Delete ${content.contentKey}`} title={`Delete ${content.contentKey}`}><FiTrash2 aria-hidden="true" /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredContents.length > 0 && <CollectionPagination label="content entries" page={page} total={filteredContents.length} onPage={setPage} />}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalMode === 'create' ? 'Add New Content' : 'Edit Content'}
          size="lg"
          busy={submitting}
        >
          <form onSubmit={handleSubmit} aria-busy={submitting}>
            {saveError && <div role="alert" className="collection-form-error">{saveError}</div>}
            <fieldset disabled={submitting} className="space-y-4">
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
            </fieldset>

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
          busy={deleting}
        >
          {deleteError && <div role="alert" className="collection-form-error">{deleteError}</div>}
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
