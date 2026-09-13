import React, { useState, useEffect } from 'react';
import { eventsApi } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FormInput from '../components/FormInput';
import FormTextarea from '../components/FormTextarea';
import ImageUpload from '../components/ImageUpload';
import { CollectionToolbar, CollectionPagination, COLLECTION_PAGE_SIZE } from '../components/CollectionControls';

/**
 * Event Management Page (Admin CRUD interface)
 * Allows admins to create, view, edit, and delete events
 */
const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, upcoming, featured
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    imageUrl: '',
    isUpcoming: true,
    isFeatured: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch all events
  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await eventsApi.getAll();
      setEvents(data);
      setPage(1);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter events
  const query = search.trim().toLowerCase();
  const filteredEvents = events.filter(event =>
    (filterType === 'all' || (filterType === 'upcoming' ? event.isUpcoming : event.isFeatured)) &&
    [event.title, event.description, event.location].some(value => value?.toLowerCase().includes(query))
  );
  const visibleEvents = filteredEvents.slice((page - 1) * COLLECTION_PAGE_SIZE, page * COLLECTION_PAGE_SIZE);
  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setPage(1);
  };

  // Open create modal
  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      location: '',
      imageUrl: '',
      isUpcoming: true,
      isFeatured: false
    });
    setFormErrors({});
    setCurrentEvent(null);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (event) => {
    setModalMode('edit');
    // Format date for input (YYYY-MM-DD)
    const formattedDate = event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '';
    setFormData({
      title: event.title,
      description: event.description || '',
      eventDate: formattedDate,
      location: event.location || '',
      imageUrl: event.imageUrl || '',
      isUpcoming: event.isUpcoming,
      isFeatured: event.isFeatured
    });
    setFormErrors({});
    setCurrentEvent(event);
    setShowModal(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Event title is required';
    }
    
    if (!formData.eventDate) {
      errors.eventDate = 'Event date is required';
    }
    
    if (!formData.imageUrl) {
      errors.imageUrl = 'Event image is required';
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
      // Format date to ISO string
      const submitData = {
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString()
      };

      if (modalMode === 'create') {
        await eventsApi.create(submitData);
      } else {
        await eventsApi.update(currentEvent.id, submitData);
      }
      
      // Refresh events list
      await fetchEvents();
      
      // Close modal
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save event:', err);
      setError(err.response?.data?.message || 'Failed to save event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!eventToDelete) return;
    
    setDeleting(true);
    setError('');
    
    try {
      await eventsApi.delete(eventToDelete.id);
      
      // Refresh events list
      await fetchEvents();
      
      // Close modal
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError(err.response?.data?.message || 'Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Image upload handler
  const handleImageUpload = (blobUrl) => {
    setFormData(prev => ({ ...prev, imageUrl: blobUrl }));
    if (formErrors.imageUrl) {
      setFormErrors(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="collection-page">
      <div>
        {/* Header */}
        <div className="collection-heading">
          <h1>Event Management</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchEvents} />
          </div>
        )}

        {/* Actions Bar */}
        <CollectionToolbar
          label="events" search={search} onSearch={value => { setSearch(value); setPage(1); }}
          filter={filterType} onFilter={value => { setFilterType(value); setPage(1); }}
          options={[{ value: 'all', label: 'All Events' }, { value: 'upcoming', label: 'Upcoming Events' }, { value: 'featured', label: 'Featured Events' }]}
          onRefresh={fetchEvents} loading={loading} onCreate={handleCreate} createLabel="Add Event"
        />

        {/* Events List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading events..." />
          </div>
        ) : error && events.length === 0 ? null : filteredEvents.length === 0 ? (
          <div className="collection-empty">
            <h2>{events.length === 0 ? 'No events yet' : 'No matching events'}</h2>
            {(search || filterType !== 'all') && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        ) : (
          <div className="collection-grid">
            {visibleEvents.map(event => (
              <Card key={event.id}>
                {/* Event Image */}
                {event.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </div>
                )}
                
                {/* Event Info */}
                <div className="mb-2 flex items-center space-x-2">
                  {event.isFeatured && (
                    <span className="px-2 py-1 bg-accent text-navy text-xs font-semibold rounded">
                      FEATURED
                    </span>
                  )}
                  {event.isUpcoming && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      UPCOMING
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-text mb-2">{event.title}</h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {event.description}
                </p>
                
                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <p>📅 {formatDate(event.eventDate)}</p>
                  {event.location && <p>📍 {event.location}</p>}
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2 mt-4">
                  <Button 
                    onClick={() => handleEdit(event)} 
                    variant="secondary" 
                    size="sm"
                    fullWidth
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteClick(event)} 
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

        {!loading && filteredEvents.length > 0 && (
          <CollectionPagination label="events" page={page} total={filteredEvents.length} onPage={setPage} />
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={modalMode === 'create' ? 'Add New Event' : 'Edit Event'}
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Title */}
              <FormInput
                label="Event Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={formErrors.title}
                required
              />

              {/* Description */}
              <FormTextarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />

              {/* Event Date */}
              <FormInput
                label="Event Date"
                name="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={handleInputChange}
                error={formErrors.eventDate}
                required
              />

              {/* Location */}
              <FormInput
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />

              {/* Image Upload */}
              <ImageUpload
                containerName="event-images"
                currentImageUrl={formData.imageUrl}
                label="Event Image *"
                onUploadComplete={handleImageUpload}
                onUploadError={(err) => setFormErrors(prev => ({ ...prev, imageUrl: err }))}
              />
              {formErrors.imageUrl && (
                <p className="text-sm text-red-600 mt-1">{formErrors.imageUrl}</p>
              )}

              {/* Toggles */}
              <div className="space-y-3">
                {/* Is Upcoming */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isUpcoming"
                    name="isUpcoming"
                    checked={formData.isUpcoming}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isUpcoming" className="ml-2 block text-sm text-text">
                    Mark as Upcoming Event
                  </label>
                </div>

                {/* Is Featured */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isFeatured" className="ml-2 block text-sm text-text">
                    Mark as Featured Event
                  </label>
                </div>
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
                {submitting ? 'Saving...' : (modalMode === 'create' ? 'Create Event' : 'Save Changes')}
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
              Are you sure you want to delete <strong>{eventToDelete?.title}</strong>? 
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
              {deleting ? 'Deleting...' : 'Delete Event'}
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default EventManagement;
