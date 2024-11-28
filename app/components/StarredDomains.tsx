import React from 'react';
import { FaStar, FaTrash } from 'react-icons/fa';

interface StarredDomainsProps {
  domains: string[];
  onUnstar: (domain: string) => void;
}

const StarredDomains: React.FC<StarredDomainsProps> = ({ domains, onUnstar }) => {
  if (domains.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No starred domains yet. Star some domains to save them here!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {domains.map((domain) => (
        <div
          key={domain}
          className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4"
        >
          <span className="text-lg font-medium">{domain}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => onUnstar(domain)}
              className="p-2 rounded-full text-yellow-500 hover:text-yellow-600 transition-colors"
              title="Unstar domain"
            >
              <FaStar />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StarredDomains;
