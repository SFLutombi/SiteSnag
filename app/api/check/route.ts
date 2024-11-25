import { NextResponse } from 'next/server';
import { checkDomainAvailability } from '@/utils/domainChecker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { domains } = await request.json();

    if (!domains || !Array.isArray(domains)) {
      return NextResponse.json({ error: 'Domains array is required' }, { status: 400 });
    }

    const results = await checkDomainAvailability(domains);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Domain availability check error:', error);
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
