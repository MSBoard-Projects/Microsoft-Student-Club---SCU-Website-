import React, { useState, useEffect } from 'react';
import { eventsApi } from '../services/api';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, upcoming, past
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Apply filters when events, filterType, or searchTerm changes
  useEffect(() => {
    applyFilters();
  }, [events, filterType, searchTerm]);

  // Fetch all events
  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await eventsApi.getAll();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  const applyFilters = () => {
    let filtered = [...events];

    // Filter by type
    if (filterType === 'upcoming') {
      filtered = filtered.filter(e => e.isUpcoming);
    } else if (filterType === 'past') {
      filtered = filtered.filter(e => !e.isUpcoming);
    }

    // Search by title or description
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(search) || 
        (e.description && e.description.toLowerCase().includes(search))
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

    setFilteredEvents(filtered);
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
    <div className="min-h-screen bg-background-white">
      {/* Header */}
      <section className="bg-navy text-text-light py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Our Events</h1>
          <p className="text-xl">
            Explore our workshops, hackathons, and community gatherings
          </p>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 mt-6">
          <ErrorMessage message={error} onRetry={fetchEvents} />
        </div>
      )}

      {/* Events List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Filters and Search */}
          <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search events by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-text">Filter:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming Events</option>
                <option value="past">Past Events</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          {!loading && (
            <p className="text-sm text-gray-600 mb-6">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" text="Loading events..." />
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">
                {searchTerm ? `No events found matching "${searchTerm}"` : 'No events found.'}
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => (
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
                  
                  {/* Event Badges */}
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
                    {!event.isUpcoming && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded">
                        PAST EVENT
                      </span>
                    )}
                  </div>

                  {/* Event Info */}
                  <h3 className="text-xl font-bold text-navy mb-2">{event.title}</h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {event.description}
                  </p>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>📅 {formatDate(event.eventDate)}</p>
                    {event.location && <p>📍 {event.location}</p>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Events;

