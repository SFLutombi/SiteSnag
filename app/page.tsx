'use client';

import { useState, useEffect } from 'react';
import { cleanup } from '@/utils/domainChecker';

interface DomainResult {
  domain: string;
  available?: boolean;
  price?: string;
  error?: string;
  checking?: boolean;
  showAvailable?: boolean;
  selected?: boolean;
  disliked?: boolean;
}

interface StarredDomain {
  domain: string;
  price?: string;
  dateStarred: Date;
  available?: boolean;
}

export default function Home() {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedDomains, setDisplayedDomains] = useState<DomainResult[]>([]);
  const [overflowDomains, setOverflowDomains] = useState<DomainResult[]>([]);
  const [starredDomains, setStarredDomains] = useState<StarredDomain[]>([]);
  const [searchedDomains, setSearchedDomains] = useState<Set<string>>(new Set());
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [dislikedDomains, setDislikedDomains] = useState<string[]>([]);

  const TARGET_DOMAIN_COUNT = 5;

  // Cleanup browser on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const handleGenerateDomains = async () => {
    if (loading || !description) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description,
          excludeDomains: Array.from(searchedDomains),
          dislikedDomains // Pass disliked domains to the AI
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate domain suggestions');
      }

      const data = await response.json();
      
      // Add domains to display immediately with checking status
      const newDomains: DomainResult[] = data.suggestions.map((domain: string) => ({
        domain,
        checking: true
      }));

      // Update searched domains
      newDomains.forEach(d => {
        searchedDomains.add(d.domain);
      });
      setSearchedDomains(new Set(searchedDomains));

      // Start availability checks
      const currentAvailableCount = displayedDomains.length;
      const neededForDisplay = Math.max(0, TARGET_DOMAIN_COUNT - currentAvailableCount);
      
      if (neededForDisplay > 0) {
        const domainsForDisplay = newDomains.slice(0, neededForDisplay);
        const remainingDomains = newDomains.slice(neededForDisplay);
        
        setDisplayedDomains(prev => [...prev, ...domainsForDisplay]);
        setOverflowDomains(prev => [...prev, ...remainingDomains]);
      } else {
        setOverflowDomains(prev => [...prev, ...newDomains]);
      }

      // Start checking availability
      const checkAvailability = async () => {
        try {
          const response = await fetch('/api/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains: newDomains.map(d => d.domain) })
          });
          
          if (!response.ok) throw new Error('Failed to check availability');
          
          const results = await response.json();
          
          // Update domains with availability immediately
          const availableResults = results.filter(r => r.available);
          const unavailableResults = results.filter(r => !r.available);
          
          // First, update all domains with their results
          setDisplayedDomains(current => 
            current.map(d => {
              const result = results.find(r => r.domain === d.domain);
              if (result) {
                return {
                  ...d,
                  checking: false,
                  available: result.available,
                  error: result.error,
                  showAvailable: result.available
                };
              }
              return d;
            })
          );

          setOverflowDomains(current => 
            current.map(d => {
              const result = results.find(r => r.domain === d.domain);
              if (result) {
                return {
                  ...d,
                  checking: false,
                  available: result.available,
                  error: result.error,
                  showAvailable: result.available
                };
              }
              return d;
            })
          );

          // After a delay, remove unavailable domains and promote available ones if needed
          setTimeout(() => {
            setDisplayedDomains(current => {
              const available = current.filter(d => d.available);
              const needed = TARGET_DOMAIN_COUNT - available.length;
              
              if (needed > 0) {
                // Promote domains from overflow
                const promoted = overflowDomains
                  .filter(d => d.available)
                  .slice(0, needed);
                
                if (promoted.length > 0) {
                  setOverflowDomains(overflow => 
                    overflow.filter(d => !promoted.find(p => p.domain === d.domain))
                  );
                }
                
                return [...available, ...promoted];
              }
              
              return available;
            });
          }, 2000);

        } catch (error) {
          console.error('Error checking availability:', error);
          setError('Failed to check domain availability');
        }
      };

      checkAvailability();
      
    } catch (err) {
      console.error('Error generating domains:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Check if we need more domains whenever displayed domains changes
  useEffect(() => {
    if (displayedDomains.length < TARGET_DOMAIN_COUNT && description) {
      handleGenerateDomains();
    }
  }, [displayedDomains.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayedDomains([]);
    setOverflowDomains([]);
    setSearchedDomains(new Set());
    setError(null);
    handleGenerateDomains();
  };

  const handleStar = (domain: DomainResult) => {
    const alreadyStarred = starredDomains.some(d => d.domain === domain.domain);
    
    if (alreadyStarred) {
      setStarredDomains(starredDomains.filter(d => d.domain !== domain.domain));
    } else {
      setStarredDomains([...starredDomains, {
        domain: domain.domain,
        price: domain.price,
        available: domain.available,
        dateStarred: new Date()
      }]);
    }
  };

  const handleRemove = (domainToRemove: string) => {
    // Remove from displayed domains
    setDisplayedDomains(displayedDomains.filter(result => result.domain !== domainToRemove));
    
    // If we have overflow domains, move one to displayed
    if (overflowDomains.length > 0) {
      const [nextDomain, ...remainingOverflow] = overflowDomains;
      setDisplayedDomains(current => [...current, nextDomain]);
      setOverflowDomains(remainingOverflow);
    }
  };

  const handleMoreLikeThis = async (domain: string) => {
    setSelectedDomain(domain);
    setLoading(true);
    try {
      // Keep only the selected domain
      setDisplayedDomains(current => 
        current.filter(d => d.domain === domain).map(d => ({
          ...d,
          selected: true
        }))
      );
      setOverflowDomains([]);

      // Generate similar domains
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: `Generate domain names similar to: ${domain}. Use similar word patterns, prefixes, or suffixes.`,
          excludeDomains: Array.from(searchedDomains)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate similar domain suggestions');
      }

      const data = await response.json();
      
      // Add new domains with checking status
      const newDomains: DomainResult[] = data.suggestions
        .filter((d: string) => d !== domain)
        .slice(0, 4)
        .map((domain: string) => ({
          domain,
          checking: true
        }));

      // Update searched domains
      newDomains.forEach(d => {
        searchedDomains.add(d.domain);
      });
      setSearchedDomains(new Set(searchedDomains));

      // Add new domains to display
      setDisplayedDomains(current => [...current, ...newDomains]);

      // Start checking availability
      const checkAvailability = async () => {
        try {
          const response = await fetch('/api/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domains: newDomains.map(d => d.domain) })
          });
          
          if (!response.ok) throw new Error('Failed to check availability');
          
          const results = await response.json();
          
          // Update domains with availability
          setDisplayedDomains(current => 
            current.map(d => {
              if (d.domain === domain) return d; // Keep selected domain as is
              const result = results.find(r => r.domain === d.domain);
              if (result) {
                return {
                  ...d,
                  checking: false,
                  available: result.available,
                  error: result.error,
                  showAvailable: result.available
                };
              }
              return d;
            })
          );

          // Remove unavailable domains after animation
          setTimeout(() => {
            setDisplayedDomains(current => 
              current.filter(d => d.domain === domain || d.available)
            );
          }, 2000);
        } catch (error) {
          console.error('Error checking availability:', error);
          setError('Failed to check domain availability');
        }
      };

      checkAvailability();
      
    } catch (err) {
      console.error('Error generating similar domains:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLessLikeThis = async (domain: string) => {
    // Add to disliked domains
    setDislikedDomains(prev => [...prev, domain]);
    
    // Mark the domain as disliked and remove after animation
    setDisplayedDomains(current =>
      current.map(d => 
        d.domain === domain 
          ? { ...d, disliked: true, available: false }
          : d
      )
    );

    // Remove the domain after animation
    setTimeout(() => {
      setDisplayedDomains(current => 
        current.filter(d => d.domain !== domain)
      );
    }, 1000);

    // If we need more domains after removing this one
    if (displayedDomains.length <= TARGET_DOMAIN_COUNT) {
      handleGenerateDomains();
    }
  };

  const promoteNextDomain = () => {
    if (overflowDomains.length > 0) {
      const [nextDomain, ...remainingOverflow] = overflowDomains;
      setDisplayedDomains(current => [...current, nextDomain]);
      setOverflowDomains(remainingOverflow);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
          SiteSnag Domain Generator
        </h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your website idea..."
              className="flex-1 p-4 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="px-6 py-4 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Domains'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-8 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-8">
          {/* Results Section */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-700">Domain Suggestions</h2>
              <div className="text-sm text-gray-500">
                Showing {displayedDomains.length} of {displayedDomains.length + overflowDomains.length} domains
              </div>
            </div>
            <div className="space-y-4">
              {displayedDomains.map((result) => (
                <div
                  key={result.domain}
                  className={`p-4 bg-white rounded-lg shadow-sm border transition-colors duration-300 ${
                    result.checking ? 'border-blue-200' :
                    result.selected ? 'border-green-500' :
                    result.disliked ? 'border-red-500 bg-red-50' :
                    result.available ? 'border-gray-200' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{result.domain}</h3>
                      <div className="flex items-center gap-2">
                        {result.checking ? (
                          <div className="flex items-center text-blue-600">
                            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Checking availability...
                          </div>
                        ) : result.available ? (
                          <span className={`text-green-600 transition-opacity duration-300 ${result.showAvailable ? 'opacity-100' : 'opacity-0'}`}>
                            Available - {result.price}
                          </span>
                        ) : (
                          <span className="text-red-600">Not Available</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoreLikeThis(result.domain)}
                        className={`px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors`}
                        disabled={loading || result.checking}
                      >
                        More like this
                      </button>
                      <button
                        onClick={() => handleLessLikeThis(result.domain)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        disabled={loading || result.checking}
                      >
                        Less like this
                      </button>
                      <button
                        onClick={() => handleStar(result)}
                        className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                          starredDomains.some(d => d.domain === result.domain)
                            ? 'text-yellow-500'
                            : 'text-gray-400'
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemove(result.domain)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-red-500"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {displayedDomains.length === 0 && !loading && (
                <div className="text-center p-8 text-gray-500">
                  No domains generated yet
                </div>
              )}
            </div>
          </div>

          {/* Starred Domains Section */}
          <div className="w-80">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Starred Domains</h2>
            <div className="space-y-3">
              {starredDomains.map((starred) => (
                <div
                  key={starred.domain}
                  className="p-3 bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <h3 className="text-md font-medium text-gray-900">{starred.domain}</h3>
                  <div className="flex items-center gap-2">
                    {starred.available === undefined ? null : 
                      starred.available ? (
                        <span className="text-green-600 text-sm">Available - {starred.price}</span>
                      ) : (
                        <span className="text-red-600 text-sm">Not Available</span>
                      )
                    }
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Starred {starred.dateStarred.toLocaleDateString()}
                  </p>
                </div>
              ))}
              {starredDomains.length === 0 && (
                <p className="text-gray-500 text-center p-4">
                  No starred domains yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
