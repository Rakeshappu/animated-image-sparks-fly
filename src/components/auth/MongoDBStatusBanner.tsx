
import React from 'react';
import { Database } from 'lucide-react';

interface MongoDBStatusProps {
  status: {
    connected: boolean;
    message?: string;
    serverInfo?: any;
  } | null;
}

export const MongoDBStatusBanner: React.FC<MongoDBStatusProps> = ({ status }) => {
  const [expanded, setExpanded] = React.useState(false);
  
  if (!status) return null;
  
  return (
    <div className={`fixed top-4 right-4 p-4 ${status.connected ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'} border-l-4 rounded z-50 max-w-md transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Database className={`h-5 w-5 ${status.connected ? 'text-green-600' : 'text-yellow-600'} mr-2`} />
          <p className="font-medium">
            MongoDB {status.connected ? 'Connected' : 'Connection Issue'}
          </p>
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="ml-3 text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {expanded ? 'Less info' : 'More info'}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-2 text-sm">
          <p className={status.connected ? 'text-green-700' : 'text-yellow-700'}>
            {status.message || (status.connected ? 'Connected to MongoDB database' : 'Failed to connect to MongoDB')}
          </p>
          
          {status.connected && status.serverInfo && (
            <div className="mt-1 text-xs bg-white p-2 rounded border border-gray-200">
              <p>Host: {status.serverInfo.host}</p>
              <p>Database: {status.serverInfo.name}</p>
              <p>Models: {status.serverInfo.models?.join(', ') || 'None'}</p>
            </div>
          )}
          
          {!status.connected && (
            <p className="mt-1 text-xs text-yellow-700">
              Using fallback authentication. Data won't be saved to the database.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
