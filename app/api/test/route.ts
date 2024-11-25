import { NextResponse } from 'next/server';
import { checkDomainAvailability } from '@/utils/domainChecker';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Test domains (mix of likely taken and possibly available)
  const domains = [
    'google',           // Definitely taken
    'microsoft',        // Definitely taken
    'ajk38dh3k2j',     // Likely available (random string)
    'testdomainxyz123', // Likely available
    'snagsight',        // Your domain to check
  ];

  try {
    const results = await checkDomainAvailability(domains);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error checking domains:', error);
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
