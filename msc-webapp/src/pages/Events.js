import React from 'react';

const Events = () => {
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

      {/* Events List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-navy mb-8 text-center">
            All Events
          </h2>
          <p className="text-center text-text mb-4">
            Events will be loaded from the API with filtering options...
          </p>
        </div>
      </section>
    </div>
  );
};

export default Events;
