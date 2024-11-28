import axios from 'axios';

interface DomainResponse {
  domains: string[];
}

interface AvailabilityResponse {
  available: boolean;
  price?: string;
  error?: string;
}

export async function generateDomains(query: string, count: number = 5): Promise<DomainResponse> {
  try {
    console.log('Sending request to /api/domains with:', { query, count }); // Debug log
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Valid query is required');
    }

    const response = await axios.post('/api/domains', {
      query: query.trim(),
      count
    });
    
    console.log('Response from /api/domains:', response.data); // Debug log
    return response.data;
  } catch (error: any) {
    console.error('Error generating domains:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to generate domains');
  }
}

export async function generateSimilarDomains(
  baseDomain: string,
  query: string,
  count: number = 5
): Promise<DomainResponse> {
  try {
    console.log('Sending request to /api/domains/similar with:', { query, baseDomain, count }); // Debug log
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Valid query is required');
    }

    if (!baseDomain || typeof baseDomain !== 'string' || baseDomain.trim().length === 0) {
      throw new Error('Valid base domain is required');
    }

    const response = await axios.post('/api/domains/similar', {
      query: query.trim(),
      baseDomain: baseDomain.trim(),
      count
    });
    
    console.log('Response from /api/domains/similar:', response.data); // Debug log
    return response.data;
  } catch (error: any) {
    console.error('Error generating similar domains:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to generate similar domains');
  }
}

export async function checkDomainAvailability(domain: string): Promise<AvailabilityResponse> {
  try {
    console.log('Checking availability for domain:', domain); // Debug log
    
    const response = await axios.get(`/api/domains/availability?domain=${domain}`);
    console.log('Availability response:', response.data); // Debug log
    
    return response.data;
  } catch (error: any) {
    console.error('Error checking domain availability:', error.response?.data || error.message);
    return {
      available: false,
      error: error.response?.data?.error || 'Failed to check domain availability'
    };
  }
}
