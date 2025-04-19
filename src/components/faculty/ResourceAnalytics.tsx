
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, ThumbsUp, MessageSquare } from 'lucide-react';
import api from '../../services/api';
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
  const [realDailyViews, setRealDailyViews] = useState<Array<{ date: string; count: number }>>(analytics.dailyViews || []);

  useEffect(() => {
    if (resourceId) {
      fetchDetailedAnalytics();
    }
  }, [resourceId]);

  // Format daily views data for chart display
  useEffect(() => {
    if (detailedAnalytics && detailedAnalytics.dailyViews) {
      setRealDailyViews(detailedAnalytics.dailyViews);
    } else if (analytics.dailyViews) {
      setRealDailyViews(analytics.dailyViews);
    }
  }, [detailedAnalytics, analytics.dailyViews]);

  const fetchDetailedAnalytics = async () => {
    if (!resourceId) return;
    
    setIsLoadingLikes(true);
    setIsLoadingComments(true);
    
    try {
      // Fetch analytics data including likes and comments
      const response = await api.get(`/api/resources/${resourceId}/analytics`);
      
      if (response.data) {
        setDetailedAnalytics(response.data);
        
        // Set likes data
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
        
        // Set comments data
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

  // Fallback: Fetch likes and comments if detailed analytics fail
  useEffect(() => {
    if (!detailedAnalytics && resourceId) {
      // Fetch like data
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

      // Fetch comment data
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Analytics for "{resourceTitle}"</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Views" value={detailedAnalytics?.views || analytics.views} icon="👁️" />
        <StatCard title="Likes" value={detailedAnalytics?.likes || analytics.likes} icon="👍" />
        <StatCard title="Comments" value={detailedAnalytics?.comments || analytics.comments} icon="💬" />
        <StatCard title="Downloads" value={detailedAnalytics?.downloads || analytics.downloads} icon="📥" />
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Daily Views</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={realDailyViews}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }} 
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
              formatter={(value) => [`${value} views`, 'Views']}
            />
            <Bar dataKey="count" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Who Liked This Resource Section */}
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
      
      {/* Comments Section */}
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
