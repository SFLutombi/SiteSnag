import React from 'react';
import { FaStar } from 'react-icons/fa';

interface LayoutProps {
  children: React.ReactNode;
  onShowStarred: () => void;
  starredCount: number;
}

const Layout: React.FC<LayoutProps> = ({ children, onShowStarred, starredCount }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">SiteSnag</h1>
            <button
              onClick={onShowStarred}
              className="flex items-center space-x-2 px-4 py-2 rounded-md bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
            >
              <FaStar />
              <span>Starred ({starredCount})</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            Powered by Mistral AI - Find your perfect domain name with AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
