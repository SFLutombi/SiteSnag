import React, { useState, useEffect } from 'react';
import { FaStar, FaTrash, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

interface DomainCardProps {
  domain: string;
  isStarred: boolean;
  onStar: () => void;
  onTrash: () => void;
  onMoreLike: () => void;
  onLessLike: () => void;
  checkDomainAvailability: (domain: string) => Promise<{ available: boolean; error?: string }>;
}

const DomainCard: React.FC<DomainCardProps> = ({
  domain,
  isStarred,
  onStar,
  onTrash,
  onMoreLike,
  onLessLike,
  checkDomainAvailability,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{ available: boolean; error?: string } | null>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      setIsChecking(true);
      try {
        const result = await checkDomainAvailability(domain);
        setAvailability(result);
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailability({ available: false, error: 'Failed to check availability' });
      } finally {
        setIsChecking(false);
      }
    };

    checkAvailability();
  }, [domain, checkDomainAvailability]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">{domain}</h3>
          <div className="flex items-center space-x-2">
            {isChecking ? (
              <span className="text-gray-500">Checking...</span>
            ) : availability ? (
              <span className={availability.available ? 'text-green-600' : 'text-red-600'}>
                {availability.available ? 'Available' : 'Taken'}
              </span>
            ) : null}
            <button
              onClick={onStar}
              className={`p-2 rounded-full transition-colors ${
                isStarred 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
              title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
            >
              <FaStar className="w-5 h-5" />
            </button>
            <button
              onClick={onTrash}
              className="p-2 rounded-full text-gray-400 hover:text-red-600 transition-colors"
              title="Remove this suggestion"
            >
              <FaTrash className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={onMoreLike}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <FaThumbsUp className="w-4 h-4" />
            <span>More Like This</span>
          </button>
          <button
            onClick={onLessLike}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <FaThumbsDown className="w-4 h-4" />
            <span>Less Like This</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DomainCard;
