
import React from 'react';

export const StarredPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Starred Resources</h1>
      <p className="text-gray-600">This is the faculty starred resources page where you can access your favorite resources.</p>
      
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <p className="text-gray-600">
          Starred resources feature is being developed. 
          You'll soon be able to mark resources as favorites for quick access.
        </p>
      </div>
    </div>
  );
};

export default StarredPage;
