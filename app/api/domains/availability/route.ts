import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    // Use WHOIS API to check domain availability
    const whoisApiKey = process.env.WHOIS_API_KEY;
    if (!whoisApiKey) {
      throw new Error('WHOIS API key not configured');
    }

    const whoisResponse = await axios.get(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${whoisApiKey}&domainName=${domain}&outputFormat=JSON`
    );

    // Check if domain exists in WHOIS database
    const available = !whoisResponse.data.WhoisRecord?.domainName;

    return NextResponse.json({
      available,
      domain
    });
  } catch (error: any) {
    console.error('Error checking domain availability:', error);
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
