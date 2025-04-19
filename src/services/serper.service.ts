
import api from './api';

interface SerperSearchOptions {
  q: string;
  gl?: string;
  hl?: string;
  num?: number;
  page?: number;
  type?: 'search' | 'news' | 'places' | 'images' | 'shopping';
}

class SerperService {
  private readonly API_KEY = '8e57e25e479bec6ec5fae266f0106eb8d22fa1e2'; // Normally this would be in an environment variable
  private readonly BASE_URL = 'https://google.serper.dev';
  
  /**
   * Search for resources using Serper.dev API
   */
  async search(options: SerperSearchOptions) {
    try {
      const response = await fetch(`${this.BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: options.q,
          gl: options.gl || 'us',
          hl: options.hl || 'en',
          num: options.num || 10,
          page: options.page || 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`Search error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Serper search error:', error);
      throw error;
    }
  }
  
  /**
   * Get educational resources related to a specific topic
   */
  async getEducationalResources(query: string) {
    try {
      // Add education-related keywords to the query
      const enhancedQuery = `${query} educational resources study materials`;
      
      const results = await this.search({
        q: enhancedQuery,
        num: 15
      });
      
      // Save search to history
      try {
        await api.post('/api/user/search-history', {
          query: query,
          source: 'serper',
          results: results.organic ? results.organic.length : 0
        });
      } catch (error) {
        console.warn('Failed to save search history:', error);
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching educational resources:', error);
      throw error;
    }
  }
  
  /**
   * Get placement-related resources
   */
  async getPlacementResources(query: string) {
    try {
      const enhancedQuery = `${query} placement preparation interview questions`;
      
      const results = await this.search({
        q: enhancedQuery,
        num: 15
      });
      
      // Extract the most relevant results
      return results;
    } catch (error) {
      console.error('Error fetching placement resources:', error);
      throw error;
    }
  }
}

export const serperService = new SerperService();
export default serperService;
