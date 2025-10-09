import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Don't show navbar on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="bg-navy text-text-light shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#0078d4] to-[#50e6ff] rounded-full flex items-center justify-center font-bold text-lg">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight">MSC</span>
              <span className="text-xs leading-tight">SCU</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`hover:text-accent transition-all duration-200 relative ${
                isActive('/') ? 'text-accent font-semibold' : ''
              }`}
            >
              Home
              {isActive('/') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"></span>
              )}
            </Link>
            <Link
              to="/team"
              className={`hover:text-accent transition-all duration-200 relative ${
                isActive('/team') ? 'text-accent font-semibold' : ''
              }`}
            >
              Team
              {isActive('/team') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"></span>
              )}
            </Link>
            <Link
              to="/events"
              className={`hover:text-accent transition-all duration-200 relative ${
                isActive('/events') ? 'text-accent font-semibold' : ''
              }`}
            >
              Events
              {isActive('/events') && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent"></span>
              )}
            </Link>
            <Link
              to="/admin/login"
              className="px-4 py-2 bg-[#0078d4] hover:bg-[#50e6ff] hover:text-navy rounded-full transition-all duration-200 font-semibold"
            >
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-text-light hover:text-accent transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <FaTimes className="h-6 w-6" />
            ) : (
              <FaBars className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 animate-fadeIn">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`hover:text-accent transition-colors py-2 ${
                  isActive('/') ? 'text-accent font-semibold' : ''
                }`}
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                to="/team"
                className={`hover:text-accent transition-colors py-2 ${
                  isActive('/team') ? 'text-accent font-semibold' : ''
                }`}
                onClick={closeMobileMenu}
              >
                Team
              </Link>
              <Link
                to="/events"
                className={`hover:text-accent transition-colors py-2 ${
                  isActive('/events') ? 'text-accent font-semibold' : ''
                }`}
                onClick={closeMobileMenu}
              >
                Events
              </Link>
              <Link
                to="/admin/login"
                className="text-center px-4 py-2 bg-[#0078d4] hover:bg-[#50e6ff] hover:text-navy rounded-full transition-all duration-200 font-semibold"
                onClick={closeMobileMenu}
              >
                Admin
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
