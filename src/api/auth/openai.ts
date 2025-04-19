
import { Request, Response } from 'express';
import axios from 'axios';

// This endpoint now serves as a proxy to Serper instead of OpenAI
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  const serperApiKey = '8e57e25e479bec6ec5fae266f0106eb8d22fa1e2';

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Call Serper API instead of OpenAI
    const response = await axios.post('https://google.serper.dev/search', {
      q: prompt,
      gl: 'us',
      hl: 'en',
      num: 10
    }, {
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json'
      }
    });
    
    // Process the search results
    const searchResults = response.data;
    
    // Extract organic results
    const organicResults = searchResults.organic || [];
    
    // Format results in a more readable way
    const formattedResults = organicResults.map((result: any) => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link,
      source: result.source || result.displayLink || 'Web'
    }));
    
    // Generate some related questions based on the results
    const relatedQuestions = generateRelatedQuestions(prompt, organicResults);
    
    // Create a formatted result
    const formattedText = formatResultsAsText(formattedResults, prompt);
    
    return res.status(200).json({ 
      result: formattedText,
      related_questions: relatedQuestions
    });
  } catch (error) {
    console.error('Error fetching from Serper:', error);
    
    // Return a more informative error
    return res.status(500).json({ 
      error: 'Failed to fetch response from Serper',
      message: error instanceof Error ? error.message : 'Unknown error',
      result: `Sorry, I couldn't process your search for: ${prompt}` 
    });
  }
}

// Format the results as readable text
function formatResultsAsText(results: any[], query: string): string {
  if (!results || results.length === 0) {
    return `No results found for your query: "${query}"`;
  }
  
  let text = `# Search Results for: ${query}\n\n`;
  
  results.slice(0, 5).forEach((result, index) => {
    text += `## ${index + 1}. ${result.title}\n`;
    text += `${result.snippet}\n\n`;
    text += `Source: ${result.source} - ${result.link}\n\n`;
  });
  
  text += "---\n\n";
  text += "These results were compiled from various sources across the web. For the most accurate information, consider visiting the source websites directly.";
  
  return text;
}

// Generate related questions
function generateRelatedQuestions(query: string, results: any[]): string[] {
  const questions = [
    `What are the best practices for ${query}?`,
    `How to learn more about ${query}?`,
    `What are the latest developments in ${query}?`
  ];
  
  // Add questions based on the results if available
  if (results.length > 0) {
    const keywords = extractKeywords(results);
    keywords.forEach(keyword => {
      if (keyword && keyword.length > 3) {
        questions.push(`How does ${keyword} relate to ${query}?`);
      }
    });
  }
  
  return questions.slice(0, 5); // Limit to 5 questions
}

// Extract keywords from search results
function extractKeywords(results: any[]): string[] {
  const keywords: string[] = [];
  
  results.slice(0, 3).forEach(result => {
    if (result.title) {
      const words = result.title.split(' ');
      if (words.length > 2) {
        keywords.push(words[1] + ' ' + words[2]);
      }
    }
  });
  
  return keywords;
}
