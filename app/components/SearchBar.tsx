import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-8">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter keywords or description for your domain..."
          className="w-full px-4 py-3 pr-12 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={`absolute right-2 p-2 text-white rounded-lg ${
            isLoading || !query.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          <FaSearch className="w-5 h-5" />
          <span className="sr-only">Search</span>
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Example: "tech startup", "fitness blog", "pet store"
      </p>
    </form>
  );
};

export default SearchBar;
