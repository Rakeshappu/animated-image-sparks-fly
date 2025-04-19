
import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Share2 className="h-10 w-10 text-indigo-600" />
            <span className="ml-2 text-3xl font-bold text-indigo-600">VersatileShare</span>
          </div>
          
          <div className="my-6 flex justify-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">Page Not Found</h2>
          <p className="mt-3 text-gray-600">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <Link
            to="/"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Home
          </Link>
          
          <Link
            to="/auth/login"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
