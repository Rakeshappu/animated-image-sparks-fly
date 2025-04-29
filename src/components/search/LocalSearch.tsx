
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LocalSearchProps {
  resources: any[];
  onSearchResults: (results: any[]) => void;
  placeholder?: string;
}

export const LocalSearch = ({ resources, onSearchResults, placeholder = "Search resources..." }: LocalSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const performSearch = () => {
      const term = searchTerm.toLowerCase().trim();
      
      if (!term) {
        onSearchResults(resources);
        return;
      }

      const filtered = resources.filter(resource => {
        // For students, only show resources from their semester
        if (user?.role === 'student' && user.semester) {
          if (resource.semester !== user.semester) {
            return false;
          }
        }

        // Search in title, description, subject
        return (
          resource.title?.toLowerCase().includes(term) ||
          resource.description?.toLowerCase().includes(term) ||
          resource.subject?.toLowerCase().includes(term)
        );
      });

      onSearchResults(filtered);
    };

    performSearch();
  }, [searchTerm, resources, user]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};
