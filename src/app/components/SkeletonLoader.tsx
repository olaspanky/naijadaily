// components/SkeletonLoader.tsx
import React from "react";

interface SkeletonLoaderProps {
  count?: number; // Number of skeleton cards to display
  darkMode?: boolean; // Support dark mode
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 6, darkMode = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${
            darkMode ? "bg-gray-300" : "bg-white"
          } rounded-lg shadow-md overflow-hidden animate-pulse`}
        >
          {/* Image placeholder */}
          <div className="w-full h-48 bg-gray-300 dark:bg-gray-200"></div>
          <div className="p-4">
            {/* Category placeholder */}
            <div className="h-4 w-20 bg-gray-300 dark:bg-gray-200 rounded mb-2"></div>
            {/* Title placeholder */}
            <div className="h-6 bg-gray-300 dark:bg-gray-200 rounded mb-2"></div>
            {/* Excerpt placeholder */}
            <div className="space-y-2 mb-3">
              <div className="h-4 bg-gray-300 dark:bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-200 rounded w-5/6"></div>
            </div>
            {/* Date and Read More placeholder */}
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-gray-300 dark:bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-300 dark:bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;