import React, { useState, useEffect } from 'react';
import { eventsApi, membersApi } from '../services/api';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Landing = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [goldenMembers, setGoldenMembers] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [membersError, setMembersError] = useState('');

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch members on mount
  useEffect(() => {
    fetchMembers();
  }, []);

  // Fetch featured and upcoming events
  const fetchEvents = async () => {
    setLoadingEvents(true);
    setEventsError('');
    try {
      const [featured, upcoming] = await Promise.all([
        eventsApi.getFeatured(),
        eventsApi.getUpcoming()
      ]);
      setFeaturedEvents(featured.slice(0, 3)); // Show max 3 featured
      setUpcomingEvents(upcoming.slice(0, 3)); // Show max 3 upcoming
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setEventsError('Failed to load events.');
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch golden members
  const fetchMembers = async () => {
    setLoadingMembers(true);
    setMembersError('');
    try {
      const members = await membersApi.getByType('Golden Member');
      setGoldenMembers(members.slice(0, 6)); // Show max 6 members
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setMembersError('Failed to load team members.');
    } finally {
      setLoadingMembers(false);
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
    <div className="min-h-screen bg-background-white">
      {/* Hero Section */}
      <section className="bg-navy text-text-light py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Microsoft Student Club
          </h1>
          <h2 className="text-2xl mb-8">Suez Canal University</h2>
          <p className="text-xl max-w-2xl mx-auto">
            Empowering students through technology, innovation, and community
          </p>
        </div>
      </section>

      {/* Vision/Mission Section */}
      <section className="py-16 bg-background-light">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-3xl font-bold text-navy mb-4">Our Vision</h3>
              <p className="text-text">
                To be the leading student community fostering innovation and technical excellence
                at Suez Canal University.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-3xl font-bold text-navy mb-4">Our Mission</h3>
              <p className="text-text">
                Empowering students with cutting-edge technology skills through hands-on workshops,
                collaborative projects, and industry connections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-bold text-navy mb-8 text-center">
            Featured Events
          </h3>
          
          {eventsError && (
            <div className="mb-6">
              <ErrorMessage message={eventsError} onRetry={fetchEvents} />
            </div>
          )}

          {loadingEvents ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading events..." />
            </div>
          ) : featuredEvents.length === 0 ? (
            <p className="text-center text-gray-500">No featured events at the moment.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredEvents.map(event => (
                <Card key={event.id}>
                  {event.imageUrl && (
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <span className="px-2 py-1 bg-accent text-navy text-xs font-semibold rounded inline-block mb-2">
                    FEATURED
                  </span>
                  <h4 className="text-xl font-bold text-navy mb-2">{event.title}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-3">{event.description}</p>
                  <p className="text-xs text-gray-500">📅 {formatDate(event.eventDate)}</p>
                  {event.location && <p className="text-xs text-gray-500">📍 {event.location}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 bg-background-light">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-bold text-navy mb-8 text-center">
            Upcoming Events
          </h3>

          {loadingEvents ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading upcoming events..." />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-center text-gray-500">No upcoming events at the moment.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <Card key={event.id}>
                  {event.imageUrl && (
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded inline-block mb-2">
                    UPCOMING
                  </span>
                  <h4 className="text-xl font-bold text-navy mb-2">{event.title}</h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-3">{event.description}</p>
                  <p className="text-xs text-gray-500">📅 {formatDate(event.eventDate)}</p>
                  {event.location && <p className="text-xs text-gray-500">📍 {event.location}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team Preview Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-bold text-navy mb-8 text-center">
            Meet Our Golden Members
          </h3>

          {membersError && (
            <div className="mb-6">
              <ErrorMessage message={membersError} onRetry={fetchMembers} />
            </div>
          )}

          {loadingMembers ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading team members..." />
            </div>
          ) : goldenMembers.length === 0 ? (
            <p className="text-center text-gray-500">No team members to display.</p>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
              {goldenMembers.map(member => (
                <div key={member.id} className="text-center">
                  {member.imageUrl && (
                    <img 
                      src={member.imageUrl} 
                      alt={member.fullName}
                      className="w-32 h-32 rounded-full mx-auto mb-3 object-cover border-4 border-accent"
                    />
                  )}
                  <h4 className="text-sm font-bold text-navy">{member.fullName}</h4>
                  <p className="text-xs text-gray-600">{member.positionTitle}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;
