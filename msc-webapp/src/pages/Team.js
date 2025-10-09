import React from 'react';

const Team = () => {
  return (
    <div className="min-h-screen bg-background-white">
      {/* Header */}
      <section className="bg-navy text-text-light py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Our Team</h1>
          <p className="text-xl">
            Meet the dedicated members driving innovation at MSC-SCU
          </p>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* High Board */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-navy mb-6 text-center">
              High Board
            </h2>
            <p className="text-center text-text mb-4">
              High Board members will be loaded from the API...
            </p>
          </div>

          {/* Board Members */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-navy mb-6 text-center">
              Board Members
            </h2>
            <p className="text-center text-text mb-4">
              Board members will be loaded from the API...
            </p>
          </div>

          {/* Golden Members */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-navy mb-6 text-center">
              Golden Members
            </h2>
            <p className="text-center text-text mb-4">
              Golden members will be loaded from the API...
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Team;
