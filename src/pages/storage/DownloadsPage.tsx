
import React, { useState } from 'react';
import { Download, FileText, Star, Trash } from 'lucide-react';

export const DownloadsPage = () => {
  const [downloadedItems, setDownloadedItems] = useState([
    { id: 1, name: 'Machine Learning Notes.pdf', type: 'PDF', size: '3.7 MB', date: '2023-10-17' },
    { id: 2, name: 'Network Security.pptx', type: 'PowerPoint', size: '5.2 MB', date: '2023-10-12' },
    { id: 3, name: 'Programming Fundamentals.zip', type: 'Archive', size: '12.8 MB', date: '2023-10-05' },
    { id: 4, name: 'Calculus Reference.pdf', type: 'PDF', size: '1.9 MB', date: '2023-09-20' },
  ]);

  const [starredIds, setStarredIds] = useState<number[]>([]);

  const toggleStar = (id: number) => {
    if (starredIds.includes(id)) {
      setStarredIds(starredIds.filter(itemId => itemId !== id));
    } else {
      setStarredIds([...starredIds, id]);
    }
  };

  const removeFromDownloads = (id: number) => {
    setDownloadedItems(downloadedItems.filter(item => item.id !== id));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
          <Download className="mr-2 text-indigo-500" size={24} />
          Downloads
        </h1>
      </div>

      {downloadedItems.length === 0 ? (
        <div className="text-center py-10">
          <Download className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No downloaded items</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You haven't downloaded any items yet.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {downloadedItems.map((item) => (
              <li key={item.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{item.name}</p>
                      <p className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>{item.type}</span>
                        <span className="mx-1">•</span>
                        <span>{item.size}</span>
                        <span className="mx-1">•</span>
                        <span>{item.date}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => toggleStar(item.id)}
                      className={`p-1 ${starredIds.includes(item.id) ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'} hover:text-yellow-500`}
                    >
                      <Star size={18} fill={starredIds.includes(item.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={() => removeFromDownloads(item.id)}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
