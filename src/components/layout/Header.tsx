import { Search, Bell, LogOut, Settings, UserCircle, SunMoon, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { generateText } from '../../services/openai.service';
import { toast } from 'react-hot-toast';
import { Notification } from '../../types/auth';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationSkeleton } from '../ui/LoadingSkeletons';

export const Header = () => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (user) {
      setAvatarUrl(getAvatar());
    }
  }, [user]);
  
  useEffect(() => {
    const handleProfileUpdate = () => {
      setLastUpdate(Date.now());
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await api.get('/api/user/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markAsRead = async (notificationId?: string) => {
    try {
      const payload = notificationId 
        ? { notificationIds: [notificationId] } 
        : { markAll: true };
      
      await api.put('/api/user/notifications', payload);
      
      if (notificationId) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        );
      } else {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.resourceId) {
      markAsRead(notification._id);
      navigate(`/resources/${notification.resourceId}`);
    }
    
    setShowNotifications(false);
  };
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowResults(true);
    setAiSummary(null);
    setRelatedQuestions([]);
    
    try {
      const result = await generateText(`Find the best educational resources, research papers, and learning materials about: ${searchQuery}. Include details about each resource including title, source, and a brief description of what can be learned.`);
      
      if (result.success) {
        setAiSummary(result.text);
        
        if (result.relatedQuestions && result.relatedQuestions.length > 0) {
          setRelatedQuestions(result.relatedQuestions);
        }
        
        const structuredResults = [
          { 
            title: `${searchQuery} - Comprehensive Guide`, 
            source: 'Academic Resource Hub', 
            snippet: `Learn everything about ${searchQuery} from experts in the field.`,
            url: `https://example.com/resources/${searchQuery.toLowerCase().replace(/\s+/g, '-')}`
          },
          { 
            title: `Understanding ${searchQuery}`, 
            source: 'Educational Portal', 
            snippet: 'A step-by-step explanation with examples and practice exercises.',
            url: `https://example.com/learn/${searchQuery.toLowerCase().replace(/\s+/g, '-')}`
          },
          { 
            title: `${searchQuery} Advanced Concepts`, 
            source: 'Scientific Journal', 
            snippet: 'Cutting-edge research and developments in this field.',
            url: `https://example.com/journal/${searchQuery.toLowerCase().replace(/\s+/g, '-')}`
          },
          { 
            title: `${searchQuery} for Beginners`, 
            source: 'Learning Platform', 
            snippet: 'Start your journey to mastering this subject with simple explanations.',
            url: `https://example.com/beginners/${searchQuery.toLowerCase().replace(/\s+/g, '-')}`
          }
        ];
        
        setSearchResults(structuredResults);
        
        const searchEvent = new CustomEvent('globalSearch', { 
          detail: { 
            query: searchQuery,
            results: structuredResults,
            aiSummary: result.text,
            relatedQuestions: result.relatedQuestions || []
          } 
        });
        document.dispatchEvent(searchEvent);
        
        toast.success('Search completed successfully!');
      } else {
        toast.error('Search failed. Using fallback results.');
        setSearchResults([{ 
          title: `${searchQuery} - Search Results`, 
          source: 'Search Engine', 
          snippet: 'Sorry, we could not process your search request properly. Please try again later.',
          url: '#'
        }]);
      }
      
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
      setSearchResults([{ title: 'Search failed', source: 'Error', snippet: 'Please try again later.' }]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const getAvatar = () => {
    if (!user) return null;
    
    if (user.avatar) {
      return `${user.avatar}?t=${lastUpdate}`;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=random&t=${lastUpdate}`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        duration: 0.3,
        staggerChildren: 0.05
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: {
        duration: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-3xl mx-auto" ref={searchRef}>
              <form onSubmit={handleSearch}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  {isSearching ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader className="h-5 w-5 text-indigo-500" />
                    </motion.div>
                  ) : (
                    <Search className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search the web for educational resources..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                />
              </form>
              
              <AnimatePresence>
                {showResults && (searchResults.length > 0 || isSearching) && (
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={menuVariants}
                    className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5"
                  >
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Web Search Results for "{searchQuery}"
                      </p>
                    </div>
                    
                    {aiSummary && (
                      <motion.div 
                        variants={itemVariants}
                        className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {aiSummary}
                        </p>
                      </motion.div>
                    )}
                    
                    <motion.ul 
                      variants={itemVariants}
                      className="max-h-96 overflow-y-auto"
                    >
                      {searchResults.map((result, index) => (
                        <motion.li 
                          key={index}
                          variants={itemVariants}
                          whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            setShowResults(false);
                            if (result.url) {
                              window.open(result.url, '_blank');
                            } else {
                              navigate('/dashboard');
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center mr-3">
                              <span className="text-indigo-600 dark:text-indigo-300 text-xs font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{result.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{result.source}</p>
                              <p className="text-xs mt-1 text-gray-700 dark:text-gray-300">{result.snippet}</p>
                            </div>
                          </div>
                        </motion.li>
                      ))}
                      
                      {relatedQuestions.length > 0 && (
                        <motion.li 
                          variants={itemVariants}
                          className="px-4 py-3 border-t border-gray-200 dark:border-gray-700"
                        >
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Related Questions
                          </p>
                          <ul className="space-y-2">
                            {relatedQuestions.map((question, index) => (
                              <motion.li 
                                key={index}
                                variants={itemVariants}
                                whileHover={{ x: 5 }}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                onClick={() => {
                                  setSearchQuery(question);
                                  setShowResults(false);
                                  setTimeout(() => {
                                    handleSearch(new Event('submit') as any);
                                  }, 100);
                                }}
                              >
                                {question}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.li>
                      )}
                      
                      {isSearching && (
                        <motion.li 
                          variants={itemVariants}
                          className="px-4 py-3"
                        >
                          <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-4 py-1">
                              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      )}
                    </motion.ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 ml-4">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleDarkMode} 
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
            >
              <SunMoon className="h-6 w-6" />
            </motion.button>
            
            <div className="relative" ref={notificationsRef}>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    fetchNotifications();
                  }
                }}
                className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 relative"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </motion.button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={menuVariants}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 max-h-96 overflow-y-auto"
                  >
                    <motion.div
                      variants={itemVariants} 
                      className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
                    >
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => markAsRead()}
                          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                        >
                          Mark all as read
                        </button>
                      )}
                    </motion.div>
                    
                    {notificationsLoading ? (
                      <div className="space-y-1">
                        {[1, 2, 3].map((i) => (
                          <NotificationSkeleton key={i} />
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <motion.div
                        variants={itemVariants}
                        className="px-4 py-6 text-center"
                      >
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No notifications yet
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          New notifications will appear here
                        </p>
                      </motion.div>
                    ) : (
                      notifications.map((notification, index) => (
                        <motion.div 
                          key={notification._id || index}
                          variants={itemVariants}
                          whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                            !notification.read ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                          }`}
                        >
                          <div className="flex justify-between">
                            <p className={`text-sm ${!notification.read ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-2 h-2 w-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"
                              ></motion.span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative" ref={profileMenuRef}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <motion.div
                  whileHover={{ rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-indigo-100 dark:ring-indigo-900"
                >
                  <img 
                    src={getAvatar()}
                    alt={user?.fullName || "User"}
                    className="w-full h-full object-cover"
                    key={`avatar-${lastUpdate}`}
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=random`;
                    }}
                  />
                </motion.div>
                <span className="hidden md:inline text-sm font-medium dark:text-gray-200">
                  {user?.fullName || 'User'}
                </span>
              </motion.button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={menuVariants}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50"
                  >
                    <motion.div variants={itemVariants}>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <UserCircle className="mr-3 h-5 w-5 text-gray-400" />
                        Profile
                      </Link>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings className="mr-3 h-5 w-5 text-gray-400" />
                        Settings
                      </Link>
                    </motion.div>
                    <motion.div 
                      variants={itemVariants}
                      className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1"
                    >
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                        Sign out
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
