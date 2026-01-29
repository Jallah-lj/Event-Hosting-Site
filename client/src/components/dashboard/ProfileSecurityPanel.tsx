import React from 'react';
import { Shield } from 'lucide-react';

const ProfileSecurityPanel: React.FC = () => {
  // Placeholder for profile/security management
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-6 h-6 text-purple-500" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Profile & Security</h2>
      </div>
      <div className="text-gray-500 dark:text-gray-400">Change password, verify phone/email, and manage security settings here.</div>
    </div>
  );
};

export default ProfileSecurityPanel;
