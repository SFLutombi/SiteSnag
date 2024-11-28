import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

interface NotificationProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

const icons = {
  success: <FaCheckCircle className="text-green-500" />,
  error: <FaExclamationCircle className="text-red-500" />,
  info: <FaInfoCircle className="text-blue-500" />,
};

const backgrounds = {
  success: 'bg-green-50',
  error: 'bg-red-50',
  info: 'bg-blue-50',
};

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center space-x-3 ${backgrounds[type]}`}
      role="alert"
    >
      {icons[type]}
      <span className="text-gray-800">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-gray-500 hover:text-gray-700"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Notification;
