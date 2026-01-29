import React from 'react';
import { Users } from 'lucide-react';

const TeamManagementPanel: React.FC = () => {
  // Placeholder for team/user management
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-6 h-6 text-blue-500" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Team Management</h2>
      </div>
      <div className="text-gray-500 dark:text-gray-400">Manage team members, roles, and permissions here.</div>
    </div>
  );
};

export default TeamManagementPanel;
