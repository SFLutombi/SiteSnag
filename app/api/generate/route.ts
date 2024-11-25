import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY || '');

export async function POST(request: Request) {
  try {
    const { description, excludeDomains = [] } = await request.json();
    console.log('Received request:', { description, excludeCount: excludeDomains.length });

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_AI_KEY) {
      console.error('GOOGLE_AI_KEY is not set');
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    console.log('Initializing Gemini model...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const excludeList = excludeDomains.map((d: string) => d.replace('.com', '')).join(', ');
    const prompt = `Generate 15 creative and brandable domain names for: ${description}
${excludeList ? `\nDO NOT include these domains: ${excludeList}` : ''}

Requirements:
- Between 4-15 characters
- Only letters, numbers, and hyphens allowed (no spaces or special characters)
- No adult content or offensive terms
- Must be unique and not in the exclude list
- Return ONLY the domain names, one per line
- DO NOT include any explanations or bullet points
- DO NOT include the .com extension`;

    console.log('Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Raw response from Gemini:', text);

    // Clean and validate domain names
    const domainNames = text
      .split('\n')
      .map(name => {
        // Remove bullet points, dashes, and spaces from start and end
        const cleaned = name.trim().toLowerCase().replace(/^[-•*\s]+/, '');
        console.log('Processing domain:', cleaned);
        return cleaned;
      })
      .filter(name => {
        if (name.length === 0) {
          console.log('Filtering out empty name');
          return false;
        }
        
        // Basic validation - allow letters, numbers, and hyphens
        const isValid = name.length >= 4 && name.length <= 15 && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name);
        const isExcluded = excludeDomains.includes(name + '.com');
        
        if (!isValid) {
          console.log(`Invalid domain: ${name} (length: ${name.length}, pattern: ${/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)})`);
        }
        if (isExcluded) {
          console.log(`Excluded domain: ${name}`);
        }
        
        return isValid && !isExcluded;
      })
      .map(name => name + '.com');

    console.log('Final domain suggestions:', domainNames);

    if (domainNames.length === 0) {
      return NextResponse.json({ error: 'No valid domains generated' }, { status: 400 });
    }

    return NextResponse.json({ suggestions: domainNames });

  } catch (error) {
    console.error('Domain generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate domain suggestions' },
      { status: 500 }
    );
  }
}
