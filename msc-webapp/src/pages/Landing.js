import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, membersApi } from '../services/api';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';
import SkeletonCard from '../components/SkeletonCard';
import PageTransition from '../components/PageTransition';
import { FaRocket, FaLightbulb, FaUsers, FaArrowRight, FaCalendar, FaMapMarkerAlt } from 'react-icons/fa';

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
    <PageTransition>
      <div className="min-h-screen bg-background-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#203a6c] via-[#0078d4] to-[#50e6ff] text-white py-24 overflow-hidden">
          {/* Animated background shapes */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-6xl md:text-7xl font-bold mb-4 animate-fadeIn">
              Microsoft Student Club
            </h1>
            <h2 className="text-2xl md:text-3xl mb-6 animate-fadeIn animate-delay-100">
              Suez Canal University
            </h2>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 animate-fadeIn animate-delay-200">
              Empowering students through technology, innovation, and community
            </p>
            <Link 
              to="/events" 
              className="inline-flex items-center gap-2 bg-white text-[#0078d4] px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#50e6ff] hover:text-[#203a6c] transform hover:scale-105 transition-all duration-300 shadow-lg animate-fadeIn animate-delay-300"
            >
              Explore Our Events
              <FaArrowRight />
            </Link>
          </div>
        </section>

        {/* Vision/Mission Section */}
        <section className="py-20 bg-background-light">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 animate-slideInLeft card-hover">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-[#0078d4] text-white p-4 rounded-full">
                    <FaRocket className="text-3xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-navy">Our Vision</h3>
                </div>
                <p className="text-lg text-text leading-relaxed">
                  To be the leading student community fostering innovation and technical excellence
                  at Suez Canal University.
                </p>
              </div>
              <div className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 animate-slideInRight card-hover">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-[#50e6ff] text-[#203a6c] p-4 rounded-full">
                    <FaLightbulb className="text-3xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-navy">Our Mission</h3>
                </div>
                <p className="text-lg text-text leading-relaxed">
                  Empowering students with cutting-edge technology skills through hands-on workshops,
                  collaborative projects, and industry connections.
                </p>
              </div>
            </div>
          </div>
        </section>

      {/* Featured Events Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl md:text-5xl font-bold text-navy mb-12 text-center animate-fadeIn">
            Featured Events
          </h3>
          
          {eventsError && (
            <div className="mb-6">
              <ErrorMessage message={eventsError} onRetry={fetchEvents} />
            </div>
          )}

          {loadingEvents ? (
            <div className="grid md:grid-cols-3 gap-8">
              <SkeletonCard type="event" />
              <SkeletonCard type="event" />
              <SkeletonCard type="event" />
            </div>
          ) : featuredEvents.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">No featured events at the moment.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredEvents.map((event, index) => (
                <div key={event.id} className={`animate-fadeIn animate-delay-${index * 100}`}>
                  <Card className="card-hover h-full">
                    {event.imageUrl && (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-56 object-cover rounded-xl mb-4 transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    <span className="px-3 py-1 bg-gradient-to-r from-[#0078d4] to-[#50e6ff] text-white text-xs font-bold rounded-full inline-block mb-3 shadow-md">
                      ⭐ FEATURED
                    </span>
                    <h4 className="text-2xl font-bold text-navy mb-3 hover:text-[#0078d4] transition-colors">{event.title}</h4>
                    <p className="text-base text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-[#0078d4]" />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-[#0078d4]" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 bg-background-light">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl md:text-5xl font-bold text-navy mb-12 text-center">
            Upcoming Events
          </h3>

          {loadingEvents ? (
            <div className="grid md:grid-cols-3 gap-8">
              <SkeletonCard type="event" />
              <SkeletonCard type="event" />
              <SkeletonCard type="event" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">No upcoming events at the moment.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {upcomingEvents.map((event, index) => (
                <div key={event.id} className={`animate-fadeIn animate-delay-${index * 100}`}>
                  <Card className="card-hover h-full">
                    {event.imageUrl && (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-56 object-cover rounded-xl mb-4 transition-transform duration-300 hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full inline-block mb-3 shadow-sm">
                      🎯 UPCOMING
                    </span>
                    <h4 className="text-2xl font-bold text-navy mb-3 hover:text-[#0078d4] transition-colors">{event.title}</h4>
                    <p className="text-base text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-[#0078d4]" />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-[#0078d4]" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-12">
            <FaUsers className="text-4xl text-[#0078d4]" />
            <h3 className="text-4xl md:text-5xl font-bold text-navy text-center">
              Meet Our Golden Members
            </h3>
          </div>

          {membersError && (
            <div className="mb-6">
              <ErrorMessage message={membersError} onRetry={fetchMembers} />
            </div>
          )}

          {loadingMembers ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-8">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} type="member" />
              ))}
            </div>
          ) : goldenMembers.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">No team members to display.</p>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-8">
              {goldenMembers.map((member, index) => (
                <div key={member.id} className={`text-center group animate-fadeIn animate-delay-${Math.min(index * 100, 400)}`}>
                  {member.imageUrl ? (
                    <img 
                      src={member.imageUrl} 
                      alt={member.fullName}
                      className="w-36 h-36 rounded-full mx-auto mb-4 object-cover border-4 border-[#50e6ff] shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:border-[#0078d4]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-full mx-auto mb-4 bg-gradient-to-br from-[#0078d4] to-[#50e6ff] flex items-center justify-center text-white text-3xl font-bold border-4 border-[#50e6ff] shadow-lg transition-all duration-300 group-hover:scale-110">
                      {member.fullName.charAt(0)}
                    </div>
                  )}
                  <h4 className="text-base font-bold text-navy group-hover:text-[#0078d4] transition-colors">{member.fullName}</h4>
                  <p className="text-sm text-gray-600">{member.positionTitle}</p>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link 
              to="/team" 
              className="inline-flex items-center gap-2 bg-[#0078d4] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#203a6c] transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              View Full Team
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
    </PageTransition>
  );
};

export default Landing;
