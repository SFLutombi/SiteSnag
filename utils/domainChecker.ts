'use server';

import axios from 'axios';
import whois from 'whois-json';

// RDAP endpoint for .com domains (Verisign)
const RDAP_ENDPOINT = 'https://rdap.verisign.com/com/v1/domain/';

// Domainr API endpoint
const DOMAINR_ENDPOINT = 'https://domainr.p.rapidapi.com';

// Domainr API key
const DOMAINR_API_KEY = process.env.DOMAINR_API_KEY;

// Rate limit tracking
interface RateLimit {
  limit: number;
  used: number;
  resetTime: number;
}

const RATE_LIMITS: Record<string, RateLimit> = {
  RDAP: { limit: 1000, used: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 }, // 1000 per day
  WHOIS: { limit: 500, used: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 }, // 500 per day
  DOMAINR: { limit: 100, used: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 } // 100 per day
};

interface DomainCheckResult {
  domain: string;
  available: boolean;
  error?: string;
  source?: string;
}

// Cache implementation
const cache = new Map<string, { result: DomainCheckResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function canUseService(service: keyof typeof RATE_LIMITS): boolean {
  const now = Date.now();
  const limit = RATE_LIMITS[service];

  // Reset counter if we're past the reset time
  if (now > limit.resetTime) {
    limit.used = 0;
    limit.resetTime = now + 24 * 60 * 60 * 1000; // Reset every 24 hours
  }

  return limit.used < limit.limit;
}

function incrementServiceUsage(service: keyof typeof RATE_LIMITS) {
  RATE_LIMITS[service].used++;
}

async function checkDomainRDAP(domain: string): Promise<DomainCheckResult> {
  try {
    const response = await axios.get(`${RDAP_ENDPOINT}${domain}`, {
      validateStatus: status => status < 500, // Accept 404 responses
      timeout: 5000
    });

    // RDAP returns 404 for available domains
    const available = response.status === 404;

    return {
      domain,
      available,
      source: 'RDAP'
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        domain,
        available: true,
        source: 'RDAP'
      };
    }
    throw error;
  }
}

async function checkDomainWhois(domain: string): Promise<DomainCheckResult> {
  try {
    const result = await whois(domain);
    
    // Common patterns that indicate domain availability
    const availabilityIndicators = [
      !result.domainName,                    // No domain name found
      result.status?.includes('AVAILABLE'),   // Status explicitly says available
      result.status?.includes('No match'),    // No match found
      !result.registrar,                     // No registrar info
      result.text?.toLowerCase().includes('no match'), // Raw text indicates no match
      result.text?.toLowerCase().includes('not found'), // Raw text indicates not found
    ];

    // Domain is available if any availability indicator is true
    const available = availabilityIndicators.some(indicator => indicator);

    return {
      domain,
      available,
      source: 'WHOIS'
    };
  } catch (error) {
    // Special handling for WHOIS errors that typically indicate availability
    if (error instanceof Error && 
       (error.message.includes('No match') || 
        error.message.includes('Not found'))) {
      return {
        domain,
        available: true,
        source: 'WHOIS'
      };
    }
    throw error;
  }
}

async function checkDomainDomainr(domain: string): Promise<DomainCheckResult> {
  try {
    if (!DOMAINR_API_KEY) {
      throw new Error('DOMAINR_API_KEY not configured');
    }

    const response = await axios.get(`${DOMAINR_ENDPOINT}/v2/status`, {
      params: {
        domain: domain
      },
      headers: {
        'X-RapidAPI-Key': DOMAINR_API_KEY,
        'X-RapidAPI-Host': 'domainr.p.rapidapi.com'
      },
      timeout: 5000
    });

    const data = response.data;
    
    if (!data.status || !Array.isArray(data.status)) {
      throw new Error('Invalid response from Domainr API');
    }

    // Parse Domainr status
    const status = data.status[0].status;
    const available = status.includes('inactive') || status.includes('unknown');

    return {
      domain,
      available,
      source: 'Domainr'
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Domainr API Error:', error.response?.data || error.message);
    }
    throw error;
  }
}

export async function cleanup() {
  // No cleanup needed for API-based implementation
}

export async function checkDomainAvailability(domains: string[]): Promise<DomainCheckResult[]> {
  // Process all domains in parallel with Promise.all
  return Promise.all(domains.map(async (rawDomain) => {
    try {
      const domain = rawDomain.toLowerCase()
        .replace(/\.com$/, '')
        .replace(/[^a-zA-Z0-9-]/g, '') + '.com';

      // Check cache first
      const cached = cache.get(domain);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.result;
      }

      let result: DomainCheckResult | null = null;

      if (canUseService('RDAP')) {
        try {
          result = await checkDomainRDAP(domain);
          incrementServiceUsage('RDAP');
        } catch (error) {
          console.log('RDAP check failed, falling back to WHOIS');
        }
      }

      if (!result && canUseService('WHOIS')) {
        try {
          result = await checkDomainWhois(domain);
          incrementServiceUsage('WHOIS');
        } catch (error) {
          console.log('WHOIS check failed, falling back to Domainr');
        }
      }

      if (!result && canUseService('DOMAINR') && DOMAINR_API_KEY) {
        try {
          result = await checkDomainDomainr(domain);
          incrementServiceUsage('DOMAINR');
        } catch (error) {
          console.log('Domainr check failed');
        }
      }

      if (!result) {
        result = {
          domain,
          available: false,
          error: 'All availability checking services failed',
          source: 'error'
        };
      }

      cache.set(domain, { result, timestamp: Date.now() });
      return result;
    } catch (error) {
      return {
        domain: rawDomain,
        available: false,
        error: error instanceof Error ? error.message : 'Failed to check availability',
        source: 'error'
      };
    }
  }));
}