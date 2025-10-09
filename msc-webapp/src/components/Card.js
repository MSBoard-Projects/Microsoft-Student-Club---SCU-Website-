import React from 'react';

/**
 * Reusable Card component for displaying content in a box
 */
const Card = ({ children, title, subtitle, className = '', padding = 'p-6' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md ${padding} ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-xl font-bold text-navy">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
