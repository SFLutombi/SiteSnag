import { NextResponse } from 'next/server';
import axios from 'axios';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

interface DomainResponse {
  domains: string[];
}

const generatePrompt = (query: string, similarTo?: string) => {
  const basePrompt = `Act as a domain name generator. Generate 5 domain names for a ${query}${similarTo ? ` that are similar to "${similarTo}"` : ''}.

Rules for domain names:
1. Must be related to ${query}
2. Maximum 15 characters
3. Only use letters, numbers, and hyphens
4. No spaces or special characters
5. No extensions (like .com)

Format your response as a simple list of domain names, one per line. For example:
techflow
devhub
codespace
webcraft
appforge`;

  return basePrompt;
};

const parseMistralResponse = (response: string): string[] => {
  console.log('Raw Mistral response:', response); // Debug log
  
  const domains = response
    .split('\n')
    .map(line => line.trim())
    // Remove numbering and periods
    .map(line => line.replace(/^\d+\.\s*/, ''))
    // Convert to lowercase
    .map(name => name.toLowerCase())
    // Remove any remaining dots
    .map(name => name.replace(/\./g, ''))
    // Filter out empty lines and invalid characters
    .filter(name => name && /^[a-z0-9-]+$/.test(name))
    // Ensure length constraints
    .filter(name => name.length <= 15 && name.length >= 3);
  
  console.log('Parsed domains:', domains); // Debug log
  return domains;
};

export async function POST(request: Request) {
  try {
    console.log('Received domain generation request'); // Debug log
    
    const body = await request.json();
    console.log('Request body:', body); // Debug log
    
    const { query, count = 5 } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.log('Invalid query:', query); // Debug log
      return NextResponse.json(
        { error: 'Valid query is required' },
        { status: 400 }
      );
    }

    if (!MISTRAL_API_KEY) {
      console.error('Missing MISTRAL_API_KEY'); // Debug log
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    console.log('Calling Mistral API for query:', query.trim()); // Debug log
    
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-tiny',
        messages: [
          {
            role: 'user',
            content: generatePrompt(query.trim())
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Mistral API response:', JSON.stringify(response.data, null, 2)); // Debug log
    
    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('Invalid response format from Mistral API:', response.data);
      return NextResponse.json(
        { error: 'Invalid response from AI service' },
        { status: 500 }
      );
    }

    const suggestions = parseMistralResponse(response.data.choices[0].message.content);
    
    if (!suggestions || suggestions.length === 0) {
      console.log('No valid suggestions generated'); // Debug log
      const fallbackDomain = `${query.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')}-site`;
      return NextResponse.json({ domains: [fallbackDomain] });
    }

    const domains = suggestions.slice(0, count);
    console.log('Final domain suggestions:', domains); // Debug log

    return NextResponse.json({ domains });
  } catch (error: any) {
    console.error('Error in domain generation:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return NextResponse.json(
      { error: error.response?.data?.message || error.message || 'Failed to generate domains' },
      { status: error.response?.status || 500 }
    );
  }
}
