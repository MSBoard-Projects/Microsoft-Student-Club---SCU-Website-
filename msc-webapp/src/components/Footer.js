import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();

  // Don't show footer on admin pages
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-navy text-text-light py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Microsoft Student Club</h3>
            <p className="text-sm">
              Suez Canal University's premier technology and innovation community.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-accent transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/team" className="hover:text-accent transition-colors">
                  Team
                </a>
              </li>
              <li>
                <a href="/events" className="hover:text-accent transition-colors">
                  Events
                </a>
              </li>
            </ul>
          </div>

          {/* Contact/Social */}
          <div>
            <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
            <p className="text-sm mb-2">Follow us on social media</p>
            <div className="flex space-x-4">
              {/* Social media icons placeholder */}
              <a href="#" className="hover:text-accent transition-colors">
                Facebook
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                LinkedIn
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
          <p>
            © {new Date().getFullYear()} Microsoft Student Club - Suez Canal University. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
