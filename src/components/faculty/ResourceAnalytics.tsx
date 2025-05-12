
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { User, ThumbsUp, MessageSquare } from 'lucide-react';
import api from '../../services/api.ts';
import { toast } from 'react-hot-toast';

interface ResourceAnalyticsProps {
  analytics: {
    views: number;
    likes: number;
    comments: number;
    downloads: number;
    lastViewed: string;
    dailyViews: Array<{ date: string; count: number }>;
    studentFeedback?: Array<{ rating: number; count: number }>;
  };
  resourceTitle: string;
  resourceId?: string;
}

interface LikeData {
  userId: string;
  userName: string;
  userEmail: string;
  usn?: string;
  department?: string;
  timestamp: string;
}

interface CommentData {
  content: string;
  author: {
    _id: string;
    fullName: string;
    email: string;
    usn?: string;
    department?: string;
  };
  createdAt: string;
}

export const ResourceAnalyticsView = ({ analytics, resourceTitle, resourceId }: ResourceAnalyticsProps) => {
  const [likeData, setLikeData] = useState<LikeData[]>([]);
  const [commentData, setCommentData] = useState<CommentData[]>([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null);
  const [realDailyViews, setRealDailyViews] = useState<Array<{ date: string; count: number }>>([]);
  
  // Define engagement chart data (replacing Activity Over Past Week)
  const engagementData = [
    { name: 'Views', value: detailedAnalytics?.views || analytics.views || 0, color: '#4F46E5' },
    { name: 'Likes', value: detailedAnalytics?.likes || analytics.likes || 0, color: '#EF4444' },
    { name: 'Comments', value: detailedAnalytics?.comments || analytics.comments || 0, color: '#10B981' },
    { name: 'Downloads', value: detailedAnalytics?.downloads || analytics.downloads || 0, color: '#F59E0B' },
  ];

  useEffect(() => {
    if (resourceId) {
      fetchDetailedAnalytics();
    }
  }, [resourceId]);

  useEffect(() => {
    let viewsData: Array<{ date: string; count: number }> = [];
    
    if (detailedAnalytics && detailedAnalytics.dailyViews && detailedAnalytics.dailyViews.length > 0) {
      viewsData = [...detailedAnalytics.dailyViews];
    } else if (analytics.dailyViews && analytics.dailyViews.length > 0) {
      viewsData = [...analytics.dailyViews];
    }
    
    // Get the current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    
    // Check if today's date already exists in the data
    const hasToday = viewsData.some(item => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);
      const itemDateString = itemDate.toISOString().split('T')[0];
      return itemDateString === todayString;
    });
    
    // Add today's date if it doesn't exist
    if (!hasToday) {
      viewsData.push({
        date: todayString,
        count: 0
      });
    }
    
    // Sort the dates in ascending order
    viewsData.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Only show the last 7 days
    if (viewsData.length > 7) {
      viewsData = viewsData.slice(-7);
    }
    
    setRealDailyViews(viewsData);
  }, [detailedAnalytics, analytics.dailyViews]);

  const fetchDetailedAnalytics = async () => {
    if (!resourceId) return;
    
    setIsLoadingLikes(true);
    setIsLoadingComments(true);
    
    try {
      const response = await api.get(`/api/resources/${resourceId}/analytics`);
      
      if (response.data) {
        setDetailedAnalytics(response.data);
        
        if (response.data.likedBy && Array.isArray(response.data.likedBy)) {
          setLikeData(response.data.likedBy.map((user: any) => ({
            userId: user._id,
            userName: user.fullName,
            userEmail: user.email,
            usn: user.usn,
            department: user.department,
            timestamp: user.likedAt || new Date().toISOString()
          })));
        }
        
        if (response.data.commentDetails && Array.isArray(response.data.commentDetails)) {
          setCommentData(response.data.commentDetails);
        }
      }
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoadingLikes(false);
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (!detailedAnalytics && resourceId) {
      const fetchLikeData = async () => {
        setIsLoadingLikes(true);
        try {
          const response = await api.get(`/api/resources/${resourceId}/like-status`);
          if (response.data && response.data.likedBy) {
            setLikeData(response.data.likedBy);
          }
        } catch (error) {
          console.error('Error fetching like data:', error);
        } finally {
          setIsLoadingLikes(false);
        }
      };

      const fetchCommentData = async () => {
        setIsLoadingComments(true);
        try {
          const response = await api.get(`/api/resources/${resourceId}/comments`);
          if (response.data && response.data.comments) {
            setCommentData(response.data.comments);
          }
        } catch (error) {
          console.error('Error fetching comment data:', error);
        } finally {
          setIsLoadingComments(false);
        }
      };

      fetchLikeData();
      fetchCommentData();
    }
  }, [resourceId, detailedAnalytics]);

  // Format date for x-axis properly
  const formatDateForXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()+1}/${date.getMonth() + 1}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Analytics for "{resourceTitle}"</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Views" value={detailedAnalytics?.views || analytics.views} icon="👁️" />
        <StatCard title="Likes" value={detailedAnalytics?.likes || analytics.likes} icon="👍" />
        <StatCard title="Comments" value={detailedAnalytics?.comments || analytics.comments} icon="💬" />
        <StatCard title="Downloads" value={detailedAnalytics?.downloads || analytics.downloads} icon="📥" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Views</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={realDailyViews}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDateForXAxis}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(dateStr) => `Date: ${new Date(dateStr).toLocaleDateString()}`}
                formatter={(value) => [`${value} views`, 'Views']}
              />
              <Bar dataKey="count" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Overall Engagement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={engagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {engagementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <ThumbsUp className="h-5 w-5 text-green-600 mr-2" />
          Who Liked This Resource
        </h3>
        {isLoadingLikes ? (
          <p className="text-gray-500">Loading like data...</p>
        ) : likeData.length > 0 ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {likeData.map((like, index) => (
                <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md bg-white">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{like.userName}</p>
                    <p className="text-sm text-gray-500">{like.userEmail}</p>
                    {like.usn && <p className="text-sm text-gray-500">USN: {like.usn}</p>}
                    {like.department && <p className="text-sm text-gray-500">Dept: {like.department}</p>}
                    <p className="text-xs text-gray-400">
                      {new Date(like.timestamp).toLocaleDateString()} at {new Date(like.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No likes yet.</p>
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
          Comments
        </h3>
        {isLoadingComments ? (
          <p className="text-gray-500">Loading comments...</p>
        ) : commentData.length > 0 ? (
          <div className="space-y-4">
            {commentData.map((comment, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start mb-2">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{comment.author.fullName}</p>
                    <p className="text-sm text-gray-500">{comment.author.email}</p>
                    {comment.author.usn && <p className="text-sm text-gray-500">USN: {comment.author.usn}</p>}
                    {comment.author.department && <p className="text-sm text-gray-500">Dept: {comment.author.department}</p>}
                    <p className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="ml-12 mt-2 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No comments yet.</p>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string; value: number; icon: string }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-semibold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
};
