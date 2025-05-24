
import api from './api';
import { generateText } from './openai.service';
import serperService from './serper.service';

export interface UserPreference {
  subjects: string[];
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timePreference: 'short' | 'medium' | 'long';
  contentTypes: string[];
}

export interface RecommendationContext {
  currentCourse?: string;
  recentActivities: any[];
  studyHistory: any[];
  timeOfDay: string;
  semester: number;
  department: string;
}

export interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'resource' | 'study_path' | 'trending' | 'ai_suggested';
  confidence: number;
  reasoning: string;
  resource?: any;
  url?: string;
  thumbnailUrl?: string;
  estimatedTime?: string;
  difficulty?: string;
  tags: string[];
  popularity: number;
  aiGenerated: boolean;
}

class RecommendationService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async getPersonalizedRecommendations(context: RecommendationContext): Promise<SmartRecommendation[]> {
    try {
      const cacheKey = `recommendations:${context.semester}:${context.department}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Get multiple types of recommendations
      const [
        trendingResources,
        aiSuggestions,
        peerRecommendations,
        studyPathSuggestions
      ] = await Promise.all([
        this.getTrendingResources(context),
        this.getAIGeneratedSuggestions(context),
        this.getPeerBasedRecommendations(context),
        this.getStudyPathSuggestions(context)
      ]);

      // Combine and rank all recommendations
      const allRecommendations = [
        ...trendingResources,
        ...aiSuggestions,
        ...peerRecommendations,
        ...studyPathSuggestions
      ];

      // Apply ML-like scoring and ranking
      const rankedRecommendations = this.rankRecommendations(allRecommendations, context);
      
      this.setCache(cacheKey, rankedRecommendations);
      return rankedRecommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  private async getTrendingResources(context: RecommendationContext): Promise<SmartRecommendation[]> {
    try {
      const response = await api.get(`/api/resources/trending?semester=${context.semester}&department=${context.department}`);
      const trendingResources = response.data.resources || [];

      return trendingResources.map((resource: any) => ({
        id: `trending-${resource._id}`,
        title: resource.title,
        description: resource.description || 'Popular resource among your peers',
        type: 'trending' as const,
        confidence: 0.8,
        reasoning: `This resource is trending among ${context.department} students in semester ${context.semester}`,
        resource,
        estimatedTime: this.estimateReadingTime(resource),
        difficulty: this.inferDifficulty(resource),
        tags: resource.tags || [resource.subject],
        popularity: resource.stats?.views || 0,
        aiGenerated: false
      }));
    } catch (error) {
      console.error('Error fetching trending resources:', error);
      return [];
    }
  }

  private async getAIGeneratedSuggestions(context: RecommendationContext): Promise<SmartRecommendation[]> {
    try {
      // Create AI prompt based on user context
      const prompt = this.buildAIPrompt(context);
      const aiResponse = await generateText(prompt);

      if (!aiResponse.success) return [];

      // Parse AI response and create suggestions
      const suggestions = await this.parseAIRecommendations(aiResponse.text, context);
      
      // Enhance suggestions with external resources
      const enhancedSuggestions = await Promise.all(
        suggestions.map(async (suggestion) => {
          const externalResources = await this.findExternalResources(suggestion.title);
          return {
            ...suggestion,
            ...externalResources
          };
        })
      );

      return enhancedSuggestions;
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return [];
    }
  }

  private async getPeerBasedRecommendations(context: RecommendationContext): Promise<SmartRecommendation[]> {
    try {
      const response = await api.get(`/api/recommendations/peer-based?semester=${context.semester}&department=${context.department}`);
      const peerData = response.data;

      return peerData.recommendations?.map((rec: any) => ({
        id: `peer-${rec.resourceId}`,
        title: rec.title,
        description: `Recommended by students with similar interests`,
        type: 'trending' as const,
        confidence: rec.similarity || 0.7,
        reasoning: `Students with similar study patterns found this helpful`,
        resource: rec.resource,
        tags: rec.tags || [],
        popularity: rec.peerCount || 0,
        aiGenerated: false
      })) || [];
    } catch (error) {
      console.error('Error fetching peer recommendations:', error);
      return [];
    }
  }

  private async getStudyPathSuggestions(context: RecommendationContext): Promise<SmartRecommendation[]> {
    try {
      // Generate study path based on current progress and goals
      const studyPath = await this.generateStudyPath(context);
      
      return studyPath.map((item, index) => ({
        id: `study-path-${index}`,
        title: item.title,
        description: item.description,
        type: 'study_path' as const,
        confidence: item.confidence,
        reasoning: item.reasoning,
        estimatedTime: item.estimatedTime,
        difficulty: item.difficulty,
        tags: item.tags,
        popularity: 0,
        aiGenerated: true
      }));
    } catch (error) {
      console.error('Error generating study path:', error);
      return [];
    }
  }

  private buildAIPrompt(context: RecommendationContext): string {
    return `
      As an AI tutor, suggest 3-5 personalized learning resources for a ${context.department} student in semester ${context.semester}.
      
      Context:
      - Recent activities: ${context.recentActivities.map(a => a.type).join(', ')}
      - Time of day: ${context.timeOfDay}
      - Current focus: ${context.currentCourse || 'General studies'}
      
      Please suggest resources that are:
      1. Relevant to their current semester and department
      2. Matched to their recent learning patterns
      3. Varied in type (videos, documents, interactive content)
      4. Progressively challenging
      
      Format each suggestion as:
      Title: [Resource Title]
      Description: [Why this is recommended]
      Type: [video/document/interactive]
      Difficulty: [beginner/intermediate/advanced]
      Estimated Time: [reading/viewing time]
      Reasoning: [Specific reason for recommendation]
    `;
  }

  private async parseAIRecommendations(aiText: string, context: RecommendationContext): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = [];
    const sections = aiText.split('Title:').filter(section => section.trim());

    for (let i = 0; i < sections.length && i < 5; i++) {
      const section = sections[i];
      const lines = section.split('\n').map(line => line.trim()).filter(line => line);
      
      const title = lines[0]?.replace(/^\[|\]$/g, '') || `AI Suggestion ${i + 1}`;
      const description = this.extractField(section, 'Description') || 'AI-generated learning suggestion';
      const type = this.extractField(section, 'Type') || 'document';
      const difficulty = this.extractField(section, 'Difficulty') || 'intermediate';
      const estimatedTime = this.extractField(section, 'Estimated Time') || '10-15 minutes';
      const reasoning = this.extractField(section, 'Reasoning') || 'AI recommendation based on your learning profile';

      recommendations.push({
        id: `ai-${Date.now()}-${i}`,
        title,
        description,
        type: 'ai_suggested',
        confidence: 0.75,
        reasoning,
        estimatedTime,
        difficulty,
        tags: [context.department.toLowerCase(), `semester-${context.semester}`],
        popularity: 0,
        aiGenerated: true
      });
    }

    return recommendations;
  }

  private extractField(text: string, fieldName: string): string | null {
    const regex = new RegExp(`${fieldName}:\\s*\\[?([^\\]\\n]+)\\]?`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  private async findExternalResources(query: string): Promise<Partial<SmartRecommendation>> {
    try {
      const searchResults = await serperService.getEducationalResources(query);
      const topResult = searchResults.organic?.[0];

      if (topResult) {
        return {
          url: topResult.link,
          thumbnailUrl: topResult.thumbnail || topResult.imageUrl,
        };
      }
    } catch (error) {
      console.error('Error finding external resources:', error);
    }
    return {};
  }

  private async generateStudyPath(context: RecommendationContext): Promise<any[]> {
    // Simple study path generation based on context
    const studyItems = [];
    
    if (context.recentActivities.length < 3) {
      studyItems.push({
        title: "Getting Started with Your Course Materials",
        description: "Begin with fundamental concepts in your current semester",
        confidence: 0.9,
        reasoning: "Building strong foundations is crucial for academic success",
        estimatedTime: "30-45 minutes",
        difficulty: "beginner",
        tags: ["foundation", context.department.toLowerCase()]
      });
    }

    studyItems.push({
      title: "Practice Problems and Exercises",
      description: "Reinforce your learning with hands-on practice",
      confidence: 0.8,
      reasoning: "Active practice helps consolidate theoretical knowledge",
      estimatedTime: "45-60 minutes",
      difficulty: "intermediate",
      tags: ["practice", "exercises"]
    });

    return studyItems;
  }

  private rankRecommendations(recommendations: SmartRecommendation[], context: RecommendationContext): SmartRecommendation[] {
    return recommendations
      .map(rec => ({
        ...rec,
        score: this.calculateRecommendationScore(rec, context)
      }))
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, 8); // Return top 8 recommendations
  }

  private calculateRecommendationScore(rec: SmartRecommendation, context: RecommendationContext): number {
    let score = rec.confidence * 100;
    
    // Boost trending content
    if (rec.type === 'trending') score += 20;
    
    // Boost AI suggestions
    if (rec.aiGenerated) score += 15;
    
    // Boost based on popularity
    score += Math.log(rec.popularity + 1) * 5;
    
    // Time-based boost
    if (context.timeOfDay === 'morning' && rec.difficulty === 'advanced') score += 10;
    if (context.timeOfDay === 'evening' && rec.estimatedTime === 'short') score += 10;
    
    return score;
  }

  private estimateReadingTime(resource: any): string {
    const wordCount = (resource.description?.length || 0) + (resource.title?.length || 0);
    const minutes = Math.max(5, Math.ceil(wordCount / 200));
    return `${minutes} minutes`;
  }

  private inferDifficulty(resource: any): string {
    const title = resource.title?.toLowerCase() || '';
    if (title.includes('intro') || title.includes('basic') || title.includes('beginner')) return 'beginner';
    if (title.includes('advanced') || title.includes('expert') || title.includes('complex')) return 'advanced';
    return 'intermediate';
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async recordRecommendationFeedback(recommendationId: string, feedback: 'like' | 'dislike' | 'helpful' | 'not_helpful'): Promise<void> {
    try {
      await api.post('/api/recommendations/feedback', {
        recommendationId,
        feedback,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error recording feedback:', error);
    }
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
