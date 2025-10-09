import React from 'react';

const Landing = () => {
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
            Upcoming Events
          </h3>
          <p className="text-center text-text mb-8">
            Events will be loaded from the API...
          </p>
        </div>
      </section>

      {/* Team Preview Section */}
      <section className="py-16 bg-background-light">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-bold text-navy mb-8 text-center">
            Meet Our Team
          </h3>
          <p className="text-center text-text mb-8">
            Team members will be loaded from the API...
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
