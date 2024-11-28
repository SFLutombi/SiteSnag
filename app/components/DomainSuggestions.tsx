import React, { useState } from 'react';
import DomainCard from './DomainCard';
import LoadingSpinner from './LoadingSpinner';
import SearchBar from './SearchBar';
import { generateDomains, generateSimilarDomains, checkDomainAvailability } from '../services/domainService';
import { Domain } from '../types/domain';
import { FaStar } from 'react-icons/fa';

interface DomainSuggestionsProps {
  onStar: (domain: string) => void;
  starredDomains: string[];
}

const DomainSuggestions: React.FC<DomainSuggestionsProps> = ({ onStar, starredDomains }) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [buffer, setBuffer] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [excludedDomains, setExcludedDomains] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setIsLoading(true);
    setDomains([]); // Clear existing domains
    setBuffer([]); // Clear buffer
    
    try {
      console.log('Initiating domain search for:', query); // Debug log
      const response = await generateDomains(query, 8);
      console.log('Domain search response:', response); // Debug log
      
      if (response.domains && response.domains.length > 0) {
        const newDomains = response.domains.map(name => ({ 
          name, 
          isStarred: starredDomains.includes(name) 
        }));
        setDomains(newDomains.slice(0, 5));
        setBuffer(newDomains.slice(5));
      } else {
        console.log('No domains returned from search'); // Debug log
      }
    } catch (error) {
      console.error('Error generating domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStar = (index: number) => {
    const domain = domains[index];
    setDomains(domains.map((d, i) => 
      i === index ? { ...d, isStarred: !d.isStarred } : d
    ));
    onStar(domain.name);
  };

  const handleLike = async (index: number) => {
    const domain = domains[index];
    try {
      const response = await generateSimilarDomains(domain.name, searchQuery, 3);
      if (response.domains && response.domains.length > 0) {
        const newDomains = response.domains
          .filter(name => !excludedDomains.includes(name))
          .map(name => ({
            name,
            isStarred: starredDomains.includes(name)
          }));
        
        if (newDomains.length > 0) {
          setDomains(prevDomains => {
            const updatedDomains = [...prevDomains];
            newDomains.forEach((newDomain, i) => {
              if (i + index + 1 < updatedDomains.length) {
                updatedDomains[i + index + 1] = newDomain;
              }
            });
            return updatedDomains;
          });
        }
      }
    } catch (error) {
      console.error('Error generating similar domains:', error);
    }
  };

  const handleDislike = (index: number) => {
    const domain = domains[index];
    setExcludedDomains(prev => [...prev, domain.name]);
    
    if (buffer.length > 0) {
      const [nextDomain, ...remainingBuffer] = buffer;
      setDomains(domains.map((d, i) => 
        i === index ? nextDomain : d
      ));
      setBuffer(remainingBuffer);
    }
  };

  const handleTrash = (index: number) => {
    const domain = domains[index];
    setExcludedDomains(prev => [...prev, domain.name]);
    
    if (buffer.length > 0) {
      const [nextDomain, ...remainingBuffer] = buffer;
      const newDomains = [...domains];
      newDomains[index] = nextDomain;
      setDomains(newDomains);
      setBuffer(remainingBuffer);
    } else {
      const newDomains = [...domains];
      newDomains.splice(index, 1);
      setDomains(newDomains);
    }
  };

  const handleMoreLike = async (index: number) => {
    const domain = domains[index];
    setIsLoading(true);
    try {
      const response = await generateSimilarDomains(domain.name, searchQuery, 5);
      if (response.domains && response.domains.length > 0) {
        const newDomains = response.domains
          .filter(name => !excludedDomains.includes(name))
          .map(name => ({
            name,
            isStarred: starredDomains.includes(name)
          }));
        
        if (newDomains.length > 0) {
          setDomains([domains[index], ...newDomains]);
        }
      }
    } catch (error) {
      console.error('Error generating similar domains:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessLike = (index: number) => {
    const domain = domains[index];
    setExcludedDomains(prev => [...prev, domain.name]);
    handleTrash(index);
  };

  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        
        {isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : domains.length > 0 ? (
          <div className="space-y-4">
            {domains.map((domain, index) => (
              <DomainCard
                key={domain.name}
                domain={domain.name}
                isStarred={domain.isStarred}
                onStar={() => handleStar(index)}
                onTrash={() => handleTrash(index)}
                onMoreLike={() => handleMoreLike(index)}
                onLessLike={() => handleLessLike(index)}
                checkDomainAvailability={checkDomainAvailability}
              />
            ))}
          </div>
        ) : searchQuery ? (
          <p className="text-center text-gray-600">
            No domain suggestions found. Try a different search.
          </p>
        ) : null}
      </div>

      <div className="w-80 shrink-0">
        <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Starred Domains</h2>
          {starredDomains.length === 0 ? (
            <p className="text-gray-600 text-sm">No starred domains yet</p>
          ) : (
            <ul className="space-y-2">
              {starredDomains.map(domain => (
                <li 
                  key={domain}
                  className="flex items-center text-gray-800 py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <FaStar className="w-4 h-4 text-yellow-500 mr-2" />
                  {domain}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainSuggestions;
