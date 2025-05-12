
import { useEffect, useState } from 'react';
import { Award, Calendar, BookOpen } from 'lucide-react';
import { User } from '../../types/index';
import { useAuth } from '../../contexts/AuthContext';
import { activityService } from '../../services/activity.service';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileSkeleton } from '../ui/LoadingSkeletons';
import api from '../../services/api';

interface UserBannerProps {
  user?: User;
}

export const UserBanner = ({ user }: UserBannerProps) => {
  const { user: authUser } = useAuth();
  const [activitiesToday, setActivitiesToday] = useState<number>(0);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [lastProfileUpdate, setLastProfileUpdate] = useState<number>(Date.now());
  
  // Use the authenticated user from context if not passed as prop
  const displayUser = user || authUser;

  // Update avatar URL when display user changes or last profile update changes
  useEffect(() => {
    if (displayUser) {
      const url = getAvatarUrl();
      setAvatarUrl(url);
    }
  }, [displayUser, lastProfileUpdate]);
  
  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        console.log('UserBanner received profile update event:', customEvent.detail);
        
        // Force refresh avatar by updating timestamp
        setLastProfileUpdate(Date.now());
        
        if (customEvent.detail.avatar) {
          // Clean the URL from any existing timestamps
          let cleanAvatarUrl = customEvent.detail.avatar;
          if (cleanAvatarUrl.includes('?t=')) {
            cleanAvatarUrl = cleanAvatarUrl.split('?t=')[0];
          }
          
          // Add a new timestamp
          setAvatarUrl(cleanAvatarUrl + '?t=' + Date.now());
        }
      }
    };
    
    // Add event listener
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    // Clean up
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Fetch activities count for today and user streak
  useEffect(() => {
    const fetchUserActivityStats = async () => {
      try {
        setIsLoading(true);
        if (displayUser?._id) {
          // Fetch activity stats from the API
          try {
            const response = await api.get('/api/user/activity/stats');
            
            if (response.data && response.data.success) {
              // Get streak from API response
              if (response.data.streak !== undefined) {
                setUserStreak(response.data.streak);
              }
              
              // Count today's activities
              if (Array.isArray(response.data.activities)) {
                // Filter for today's activities
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const todayActivities = response.data.activities.filter((activity: any) => {
                  const activityDate = new Date(activity.timestamp);
                  return activityDate >= today;
                });
                
                setActivitiesToday(todayActivities.length);
                
                // Trigger animation if we have activities
                if (todayActivities.length > 0) {
                  setTimeout(() => setShowAnimation(true), 500);
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch user activity stats:', error);
            // Fallback to getting just activities
            try {
              const activities = await activityService.getRecentActivities(100);
              
              // Check if activities is an array before proceeding
              if (Array.isArray(activities)) {
                // Filter for today's activities
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const todayActivities = activities.filter((activity: any) => {
                  const activityDate = new Date(activity.timestamp);
                  return activityDate >= today;
                });
                
                setActivitiesToday(todayActivities.length);
                
                // Trigger animation if we have activities
                if (todayActivities.length > 0) {
                  setTimeout(() => setShowAnimation(true), 500);
                }
              }
            } catch (error) {
              console.error('Failed to fetch today activities:', error);
              setActivitiesToday(0);
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserActivityStats();
    
    // Refresh user streak every 5 minutes
    const intervalId = setInterval(fetchUserActivityStats, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [displayUser]);
  
  if (isLoading) {
    return <ProfileSkeleton />;
  }
  
  if (!displayUser) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-lg p-6 mb-8 animate-pulse"
      >
        <div className="h-16 bg-indigo-700/50 rounded-lg"></div>
      </motion.div>
    );
  }
  
  function getAvatarUrl() {
    const timestamp = Date.now(); // Always use current timestamp to bust cache
    
    if (!displayUser) return `https://ui-avatars.com/api/?name=User&background=random&t=${timestamp}`;
    
    if (displayUser.avatar && displayUser.avatar !== "") {
      // Check if avatar already has a timestamp
      if (displayUser.avatar.includes('?t=')) {
        // Replace existing timestamp with new one
        return `${displayUser.avatar.split('?t=')[0]}?t=${timestamp}`;
      }
      
      // Add timestamp to bust cache
      return `${displayUser.avatar}?t=${timestamp}`;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUser.fullName || "User")}&background=random&t=${timestamp}`;
  }

  const displayName = displayUser?.fullName || displayUser?.email?.split('@')[0] || "User";
  // Use displayUser.streak if available, otherwise fall back to our state variable
  const streakCount = displayUser?.streak !== undefined ? displayUser.streak : userStreak;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-lg p-6 mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
              src={avatarUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full border-2 border-white object-cover z-10 relative"
              key={`avatar-${lastProfileUpdate}`} // Force re-render when profile updates
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
              }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -inset-1 bg-white rounded-full blur-sm z-0"
            />
          </motion.div>
          <div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-2xl font-bold"
            >
              Welcome back, {displayName}!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-indigo-200"
            >
              {displayUser?.semester ? `${displayUser.semester}th Semester • ` : ''}{displayUser?.department || ''}
            </motion.p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <motion.div 
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-300" />
              <AnimatePresence mode="wait">
                <motion.span 
                  key={streakCount}
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={showAnimation && streakCount > 1 ? 
                    { scale: [1, 1.5, 1], color: ["#fff", "#fde047", "#fff"], opacity: 1, y: 0 } : 
                    { opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  {streakCount || 0}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="text-sm text-indigo-200">Day Streak</p>
          </motion.div>
          <motion.div 
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            {/* <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-300" />
              <AnimatePresence mode="wait">
                <motion.span 
                  key={activitiesToday}
                  className="text-2xl font-bold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={showAnimation && activitiesToday > 0 ? 
                    { scale: [1, 1.5, 1], color: ["#fff", "#86efac", "#fff"], opacity: 1, y: 0 } : 
                    { opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                >
                  {activitiesToday}
                </motion.span>
              </AnimatePresence>
            </div> */}
            {/* <p className="text-sm text-indigo-200">Activities Today</p> */}
          </motion.div>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "2px" }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="w-full mt-5 rounded-full overflow-hidden"
      >
        <div className="h-full w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 animate-shimmer" />
      </motion.div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-shimmer {
          background-size: 1000px 100%;
          animation: shimmer 8s infinite linear;
        }
      `}</style>
    </motion.div>
  );
};
