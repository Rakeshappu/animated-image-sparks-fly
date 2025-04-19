
import axios from 'axios';

// Using Serper API instead of OpenAI
const SERPER_API_KEY = '8e57e25e479bec6ec5fae266f0106eb8d22fa1e2';

export const generateText = async (prompt: string) => {
  try {
    console.log('Generating text with Serper AI for prompt:', prompt);
    
    const response = await axios.post(
      '/api/auth/openai',
      { prompt },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return {
      success: true,
      text: response.data.text,
      relatedQuestions: response.data.relatedQuestions || [],
      results: response.data.results || []
    };
  } catch (error) {
    console.error('Error generating text with Serper AI:', error);
    return {
      success: false,
      text: 'Failed to generate text. Please try again later.',
      error
    };
  }
};

export const searchWithSerper = async (query: string) => {
  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      {
        q: query,
        gl: 'us',
        hl: 'en',
        autocorrect: true
      },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      results: response.data
    };
  } catch (error) {
    console.error('Error searching with Serper:', error);
    return {
      success: false,
      error
    };
  }
};

export default {
  generateText,
  searchWithSerper
};
