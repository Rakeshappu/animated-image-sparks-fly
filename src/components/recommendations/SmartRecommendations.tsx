
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  ExternalLink,
  Sparkles,
  Target,
  Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { recommendationService, SmartRecommendation, RecommendationContext } from '../../services/recommendation.service';
import { activityService } from '../../services/activity.service';

interface SmartRecommendationsProps {
  className?: string;
  maxRecommendations?: number;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ 
  className = "", 
  maxRecommendations = 6 
}) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user, selectedCategory]);

  const loadRecommendations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Build recommendation context
      const recentActivities = await activityService.getWeeklyActivities();
      const context: RecommendationContext = {
        recentActivities,
        studyHistory: [],
        timeOfDay: getTimeOfDay(),
        semester: user.semester || 1,
        department: user.department || 'CSE'
      };

      const recs = await recommendationService.getPersonalizedRecommendations(context);
      
      // Filter by category if selected
      const filteredRecs = selectedCategory === 'all' 
        ? recs 
        : recs.filter(rec => rec.type === selectedCategory);
      
      setRecommendations(filteredRecs.slice(0, maxRecommendations));
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const handleFeedback = async (recommendationId: string, feedback: 'like' | 'dislike') => {
    try {
      await recommendationService.recordRecommendationFeedback(recommendationId, feedback);
      setFeedbackGiven(prev => new Set([...prev, recommendationId]));
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trending': return <TrendingUp className="h-4 w-4" />;
      case 'ai_suggested': return <Brain className="h-4 w-4" />;
      case 'study_path': return <Target className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trending': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'ai_suggested': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'study_path': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) return null;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Smart Recommendations
          </h2>
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
            AI-Powered
          </span>
        </div>
        
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All', icon: BookOpen },
            { key: 'trending', label: 'Trending', icon: TrendingUp },
            { key: 'ai_suggested', label: 'AI', icon: Brain },
            { key: 'study_path', label: 'Path', icon: Target }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No recommendations yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start exploring resources to get personalized recommendations!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium border ${getTypeColor(rec.type)}`}>
                    {getTypeIcon(rec.type)}
                    <span className="capitalize">{rec.type.replace('_', ' ')}</span>
                  </div>
                  
                  {rec.aiGenerated && (
                    <div className="flex items-center space-x-1 text-purple-600">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">AI</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {rec.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                    {rec.description}
                  </p>
                  
                  {rec.reasoning && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        💡 {rec.reasoning}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {rec.estimatedTime && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{rec.estimatedTime}</span>
                    </div>
                  )}
                  
                  {rec.difficulty && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(rec.difficulty)}`}>
                      {rec.difficulty}
                    </span>
                  )}
                  
                  {rec.popularity > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      <span>{rec.popularity}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {rec.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {rec.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {!feedbackGiven.has(rec.id) ? (
                      <>
                        <button
                          onClick={() => handleFeedback(rec.id, 'like')}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Helpful"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleFeedback(rec.id, 'dislike')}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Not helpful"
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-1 text-green-600">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-xs">Thanks!</span>
                      </div>
                    )}
                  </div>
                  
                  {rec.url && (
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      <span>Explore</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Confidence indicator */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Relevance</span>
                    <div className="flex items-center space-x-1">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${
                            i < Math.round(rec.confidence * 5) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">
                        {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SmartRecommendations;
