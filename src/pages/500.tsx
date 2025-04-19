
import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ServerErrorPage() {
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
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">Server Error</h2>
          <p className="mt-3 text-gray-600">
            Sorry, something went wrong on our end. Please try again later.
          </p>
        </div>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Retry
          </button>
          
          <Link
            to="/"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Home
          </Link>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>If the problem persists, please contact support.</p>
        </div>
      </motion.div>
    </div>
  );
}
