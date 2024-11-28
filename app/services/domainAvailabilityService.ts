import axios from 'axios';
import { sleep } from '../utils/helpers';
import whois from 'whois';
import { promisify } from 'util';

const whoisLookup = promisify(whois.lookup);
const WHOIS_API_KEY = process.env.WHOIS_API_KEY;
const DOMAINR_API_KEY = process.env.DOMAINR_API_KEY;

interface DomainAvailabilityResult {
  isAvailable: boolean;
  provider: string;
  error?: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function checkWithWhoisLibrary(domain: string): Promise<DomainAvailabilityResult> {
  try {
    const result = await whoisLookup(domain);
    const isAvailable = result.includes('No match') || 
                       result.includes('NOT FOUND') ||
                       result.includes('No entries found');
    
    return {
      isAvailable,
      provider: 'WHOIS Library'
    };
  } catch (error) {
    throw error;
  }
}

async function checkWithWhoisAPI(domain: string): Promise<DomainAvailabilityResult> {
  try {
    const response = await axios.get(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`
    );
    return {
      isAvailable: !response.data.WhoisRecord?.registryData?.createdDate,
      provider: 'WHOIS API'
    };
  } catch (error) {
    console.error('Error checking with Whois API:', error);
    throw error;
  }
}

async function checkWithICANN(domain: string): Promise<DomainAvailabilityResult> {
  try {
    const response = await axios.get(`https://rdap.verisign.com/com/v1/domain/${domain}`);
    return {
      isAvailable: false,
      provider: 'ICANN RDAP'
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      return {
        isAvailable: true,
        provider: 'ICANN RDAP'
      };
    }
    throw error;
  }
}

async function checkWithDomainr(domain: string): Promise<DomainAvailabilityResult> {
  try {
    await delay(1000);
    const response = await axios.get(
      `https://domainr.p.rapidapi.com/v2/status?domain=${domain}`,
      {
        headers: {
          'X-RapidAPI-Key': DOMAINR_API_KEY || '',
          'X-RapidAPI-Host': 'domainr.p.rapidapi.com',
        },
      }
    );

    const status = response.data.status[0].status;
    return {
      isAvailable: status === 'inactive' || status === 'unknown',
      provider: 'Domainr'
    };
  } catch (error: any) {
    if (error.response?.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    throw error;
  }
}

async function checkDomainAvailability(domain: string): Promise<DomainAvailabilityResult> {
  const methods = [
    { name: 'ICANN', fn: checkWithICANN },
    { name: 'WHOIS Library', fn: checkWithWhoisLibrary },
    { name: 'Domainr', fn: checkWithDomainr },
    { name: 'Whois API', fn: checkWithWhoisAPI }
  ];

  for (const method of methods) {
    try {
      const result = await method.fn(domain);
      return result;
    } catch (error: any) {
      console.warn(`Error checking domain with ${method.name}:`, error);
      if (error.message === 'RATE_LIMIT') {
        continue;
      }
      if (method === methods[methods.length - 1]) {
        return {
          isAvailable: false,
          provider: 'Error',
          error: 'Unable to check availability'
        };
      }
    }
  }

  return {
    isAvailable: false,
    provider: 'Error',
    error: 'All availability checks failed'
  };
}

export async function checkMultipleDomains(
  domains: string[]
): Promise<DomainAvailabilityResult[]> {
  const batchSize = 3;
  const results: DomainAvailabilityResult[] = [];

  for (let i = 0; i < domains.length; i += batchSize) {
    const batch = domains.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(domain => checkDomainAvailability(domain))
    );
    results.push(...batchResults);
    
    if (i + batchSize < domains.length) {
      await delay(2000);
    }
  }

  return results;
}
