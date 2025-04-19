
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const SERPER_API_KEY = '8e57e25e479bec6ec5fae266f0106eb8d22fa1e2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use Serper API to get search results
    const searchResponse = await axios.post(
      'https://google.serper.dev/search',
      {
        q: prompt,
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

    // Process search results to create a formatted response
    const organicResults = searchResponse.data.organic || [];
    
    // Format results to include real links
    const formattedResults = organicResults.slice(0, 5).map((result: any) => {
      return {
        title: result.title,
        link: result.link,
        snippet: result.snippet
      };
    });

    // Create enhanced, more readable summary text from the top results
    let summaryText = `Here's what I found about "${prompt}":\n\n`;
    
    // Add the top 3 results with better formatting
    formattedResults.slice(0, 3).forEach((result: any, index: number) => {
      summaryText += `${index + 1}. **${result.title}**\n${result.snippet}\n\n`;
    });
    
    // Add a summary paragraph
    const topSnippets = formattedResults.slice(0, 3).map((r: any) => r.snippet).join(' ');
    summaryText += `Summary: ${topSnippets.substring(0, 300)}...\n\n`;
    
    // Add "How to use this information" section
    summaryText += `How you can use this: The information above can help you understand more about ${prompt.split(' ').slice(0, 3).join(' ')}...\n\n`;
    
    // End with a call to action
    summaryText += `Click on any result below to learn more.`;

    // Generate related questions
    const relatedQuestions = searchResponse.data.relatedSearches?.map((item: any) => item.query) || [];

    return res.status(200).json({
      text: summaryText,
      results: formattedResults,
      relatedQuestions: relatedQuestions.slice(0, 5)
    });
  } catch (error: any) {
    console.error('Error with Serper AI:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to generate text',
      details: error.message
    });
  }
}
