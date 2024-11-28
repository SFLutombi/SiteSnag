'use client';

import React, { useState } from 'react';
import DomainSuggestions from './components/DomainSuggestions';

export default function Home() {
  const [starredDomains, setStarredDomains] = useState<string[]>([]);

  const handleStar = (domain: string) => {
    setStarredDomains(prev => {
      if (prev.includes(domain)) {
        return prev.filter(d => d !== domain);
      }
      return [...prev, domain];
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SiteSnag</h1>
        <p className="text-gray-600">Find the perfect domain name for your next project</p>
      </div>

      <DomainSuggestions 
        onStar={handleStar} 
        starredDomains={starredDomains} 
      />
    </main>
  );
}
