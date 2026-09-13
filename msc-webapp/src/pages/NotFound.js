import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiMap } from 'react-icons/fi';

const NotFound = ({ destination = '/', actionLabel = 'Return home' }) => (
  <section className="max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center" aria-labelledby="not-found-title">
    <FiMap aria-hidden="true" className="w-12 h-12 mx-auto mb-6 text-primary" />
    <p className="text-sm font-semibold text-gray-500 mb-3">404</p>
    <h1 id="not-found-title" className="text-3xl font-bold text-navy mb-8">Page not found</h1>
    <Link to={destination} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-white px-5 py-3 font-semibold hover:bg-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
      <FiArrowLeft aria-hidden="true" />{actionLabel}
    </Link>
  </section>
);

export default NotFound;