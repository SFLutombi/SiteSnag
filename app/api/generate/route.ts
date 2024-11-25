import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);

export async function POST(req: Request) {
  try {
    const { description, excludeDomains, dislikedDomains } = await req.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    let prompt = `Generate unique and creative domain name suggestions for: "${description}". 
    Each domain name should be a .com domain and should be between 3-20 characters long.
    Only use letters, numbers, and hyphens. Do not use any special characters.
    Make names catchy, memorable, and relevant to the description.`;

    // Add context about disliked domains to avoid similar patterns
    if (dislikedDomains?.length > 0) {
      prompt += `\n\nAVOID generating names similar to these disliked domains: ${dislikedDomains.join(', ')}.
      Do not use similar word patterns, prefixes, or suffixes from these domains.`;
    }

    prompt += `\n\nFormat the response as a JSON array of strings, like this: ["domain1.com", "domain2.com"]
    Generate 10 domain suggestions.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      const suggestions = JSON.parse(text);
      
      // Filter out excluded domains and validate format
      const validSuggestions = suggestions
        .filter((domain: string) => 
          typeof domain === 'string' && 
          !excludeDomains?.includes(domain) &&
          /^[a-zA-Z0-9-]+\.com$/.test(domain) &&
          domain.length >= 3 &&
          domain.length <= 20
        )
        .slice(0, 10);

      return NextResponse.json({ suggestions: validSuggestions });
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating domains:', error);
    return NextResponse.json({ error: 'Failed to generate domains' }, { status: 500 });
  }
}
