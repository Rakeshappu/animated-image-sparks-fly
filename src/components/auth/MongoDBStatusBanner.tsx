
import React, { useEffect, useState } from 'react';
import { Database, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';

interface MongoDBStatusProps {
  status: {
    connected: boolean;
    message?: string;
    serverInfo?: any;
    state?: string;
    host?: string;
    database?: string;
    error?: string;
  } | null;
  onRefresh?: () => void;
}

export const MongoDBStatusBanner: React.FC<MongoDBStatusProps> = ({ status, onRefresh }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);
  
  // Check if the banner was dismissed in the last hour
  useEffect(() => {
    const storedTime = localStorage.getItem('mongodb_banner_dismissed_until');
    if (storedTime) {
      const dismissedTime = parseInt(storedTime, 10);
      if (dismissedTime > Date.now()) {
        setDismissedUntil(dismissedTime);
      } else {
        localStorage.removeItem('mongodb_banner_dismissed_until');
      }
    }
  }, []);

  // Allow user to dismiss the banner for an hour
  const dismissBanner = () => {
    const dismissUntil = Date.now() + (60 * 60 * 1000); // 1 hour
    localStorage.setItem('mongodb_banner_dismissed_until', dismissUntil.toString());
    setDismissedUntil(dismissUntil);
  };
  
  // If dismissed or no status, don't show
  if (dismissedUntil || !status) return null;

  // Handle refresh button click
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // If no refresh callback provided, refresh the page
      window.location.reload();
    }
  };
  
  return (
    <div className={`fixed top-4 right-4 p-4 ${status.connected ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'} border-l-4 rounded z-50 max-w-md shadow-md transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {status.connected ? 
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" /> : 
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          }
          <p className="font-medium">
            MongoDB {status.connected ? 'Connected' : 'Connection Issue'}
          </p>
        </div>
        <div className="flex items-center">
          <button 
            onClick={handleRefresh}
            className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none p-1"
            title="Refresh connection status"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="ml-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {expanded ? 'Less info' : 'More info'}
          </button>
          <button
            onClick={dismissBanner}
            className="ml-2 text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
            title="Dismiss for 1 hour"
          >
            ×
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-2 text-sm">
          <p className={status.connected ? 'text-green-700' : 'text-yellow-700'}>
            {status.message || (status.connected ? 'Connected to MongoDB database' : 'Failed to connect to MongoDB')}
          </p>
          
          {status.connected && status.serverInfo && (
            <div className="mt-1 text-xs bg-white p-2 rounded border border-gray-200">
              <p>Host: {status.serverInfo.host || status.host || 'Unknown'}</p>
              <p>Database: {status.serverInfo.name || status.database || 'Unknown'}</p>
              <p>State: {status.state || 'Unknown'}</p>
              {status.serverInfo.models && <p>Models: {status.serverInfo.models?.join(', ') || 'None'}</p>}
            </div>
          )}
          
          {!status.connected && (
            <>
              <p className="mt-1 text-xs text-yellow-700">
                Using fallback authentication. Data won't be saved to the database.
              </p>
              {status.error && (
                <div className="mt-1 text-xs bg-white p-2 rounded border border-red-100">
                  <p className="font-medium">Error details:</p>
                  <p className="text-red-600 break-words">{status.error}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
