import React from 'react';
import { Bell } from 'lucide-react';

const NotificationCenter: React.FC = () => {
  // Placeholder for notifications
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-6 flex items-center gap-4">
      <Bell className="w-6 h-6 text-yellow-500" />
      <div className="flex-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
        <div className="text-gray-500 dark:text-gray-400">No new notifications.</div>
      </div>
    </div>
  );
};

export default NotificationCenter;
