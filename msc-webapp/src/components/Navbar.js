import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Don't show navbar on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="bg-navy text-text-light shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">MSC</span>
            <span className="text-sm">Suez Canal University</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`hover:text-accent transition-colors ${
                isActive('/') ? 'text-accent font-semibold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              to="/team"
              className={`hover:text-accent transition-colors ${
                isActive('/team') ? 'text-accent font-semibold' : ''
              }`}
            >
              Team
            </Link>
            <Link
              to="/events"
              className={`hover:text-accent transition-colors ${
                isActive('/events') ? 'text-accent font-semibold' : ''
              }`}
            >
              Events
            </Link>
            <Link
              to="/admin/login"
              className="hover:text-accent transition-colors"
            >
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-text-light hover:text-accent">
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
