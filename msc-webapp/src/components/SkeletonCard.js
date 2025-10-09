import React from 'react';

const SkeletonCard = ({ type = 'member' }) => {
  if (type === 'member') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        {/* Image skeleton */}
        <div className="h-64 bg-gray-300 rounded-lg mb-4"></div>
        
        {/* Name skeleton */}
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        
        {/* Position skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        
        {/* Contact info skeletons */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (type === 'event') {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
        {/* Image skeleton */}
        <div className="h-48 bg-gray-300"></div>
        
        <div className="p-6">
          {/* Title skeleton */}
          <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
          
          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
          
          {/* Meta info skeleton */}
          <div className="flex gap-2">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  // Default content card
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
