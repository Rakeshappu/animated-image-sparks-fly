import React from 'react';
import { motion } from 'framer-motion';

export const ResourceCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 w-full">
      <div className="animate-pulse flex flex-col space-y-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <div className="animate-pulse flex flex-col sm:flex-row items-center sm:items-start">
        <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full mb-4 sm:mb-0 sm:mr-6"></div>
        <div className="space-y-3 w-full">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
          <div className="flex flex-wrap justify-center sm:justify-start mt-2 space-x-2">
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-40"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => {
  return (
    <div className="animate-pulse border-b border-gray-200 dark:border-gray-700 py-3">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array(columns).fill(0).map((_, i) => (
          <div key={i} className="h-5 bg-gray-300 dark:bg-gray-600 rounded mx-2"></div>
        ))}
      </div>
    </div>
  );
};

export const FeedItemSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
      <div className="animate-pulse flex space-x-4">
        <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          </div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export const NotificationSkeleton = () => {
  return (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
      <div className="animate-pulse flex justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        </div>
        <div className="h-2 w-2 bg-gray-300 dark:bg-gray-600 rounded-full ml-2 mt-1"></div>
      </div>
    </div>
  );
};

// General purpose loading spinner with animation
export const LoadingSpinner = ({ size = 'medium', message = '' }: { size?: 'small' | 'medium' | 'large', message?: string }) => {
  let dimensions;
  switch (size) {
    case 'small':
      dimensions = 'h-5 w-5';
      break;
    case 'large':
      dimensions = 'h-12 w-12';
      break;
    default:
      dimensions = 'h-8 w-8';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`border-t-2 border-indigo-500 border-r-2 border-r-transparent rounded-full ${dimensions}`}
      ></motion.div>
      {message && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>}
    </div>
  );
};

// Fancy 3D cube loading animation
export const CubeLoader = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="scene">
        <div className="cube-wrapper">
          <div className="cube">
            <div className="cube-faces">
              <div className="cube-face shadow-md border border-indigo-300 dark:border-indigo-700 bg-indigo-100 dark:bg-indigo-900/50"></div>
              <div className="cube-face shadow-md border border-indigo-300 dark:border-indigo-700 bg-indigo-200 dark:bg-indigo-800/50"></div>
              <div className="cube-face shadow-md border border-indigo-300 dark:border-indigo-700 bg-indigo-300 dark:bg-indigo-700/50"></div>
              <div className="cube-face shadow-md border border-indigo-300 dark:border-indigo-700 bg-indigo-400 dark:bg-indigo-600/50"></div>
              <div className="cube-face shadow-md border border-indigo-300 dark:border-indigo-700 bg-indigo-500 dark:bg-indigo-500/50"></div>
              <div className="cube-face shadow-md border border-indigo-300 dark:border-indigo-700 bg-indigo-600 dark:bg-indigo-400/50"></div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .scene {
          width: 80px;
          height: 80px;
          perspective: 1000px;
        }
        .cube-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: rotate 8s infinite linear;
        }
        .cube {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: cube-rotate 8s infinite ease-in-out;
        }
        .cube-faces {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          animation: cube-pulse 3s infinite ease-in-out;
        }
        .cube-face {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 4px;
        }
        .cube-face:nth-child(1) {
          transform: translateZ(40px);
        }
        .cube-face:nth-child(2) {
          transform: rotateY(180deg) translateZ(40px);
        }
        .cube-face:nth-child(3) {
          transform: rotateY(90deg) translateZ(40px);
        }
        .cube-face:nth-child(4) {
          transform: rotateY(-90deg) translateZ(40px);
        }
        .cube-face:nth-child(5) {
          transform: rotateX(90deg) translateZ(40px);
        }
        .cube-face:nth-child(6) {
          transform: rotateX(-90deg) translateZ(40px);
        }
        @keyframes rotate {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        @keyframes cube-rotate {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotateY(90deg);
          }
          50% {
            transform: rotateY(180deg);
          }
          75% {
            transform: rotateY(270deg);
          }
        }
        @keyframes cube-pulse {
          0%, 100% {
            transform: scale3d(0.95, 0.95, 0.95);
          }
          50% {
            transform: scale3d(1.05, 1.05, 1.05);
          }
        }
      `}</style>
    </div>
  );
};

// Wave loading animation
export const WaveLoader = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="flex space-x-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-12 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-full"
            animate={{
              height: ["30%", "100%", "30%"]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Full page loader with overlay
export const FullPageLoader = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl flex flex-col items-center"
      >
        <CubeLoader />
        <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">{message}</p>
      </motion.div>
    </motion.div>
  );
};