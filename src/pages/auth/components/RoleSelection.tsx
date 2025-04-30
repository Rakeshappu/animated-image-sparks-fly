
import { useState } from 'react';
import { UserRole } from '../../../types';
import { GraduationCap, UserCog, ShieldCheck } from 'lucide-react';
import { Logo } from '../../../components/common/Logo';

interface RoleSelectionProps {
  onRoleSelect: (role: string) => void;
}

export const RoleSelection = ({ onRoleSelect }: RoleSelectionProps) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to VersatileShare
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please select your role to continue
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`flex items-center p-4 border rounded-lg ${
                  selectedRole === 'student'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`rounded-full p-2 mr-4 ${
                  selectedRole === 'student'
                    ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Student</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Access study materials and resources
                  </p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedRole('faculty')}
                className={`flex items-center p-4 border rounded-lg ${
                  selectedRole === 'faculty'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`rounded-full p-2 mr-4 ${
                  selectedRole === 'faculty'
                    ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <UserCog className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Faculty</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload and manage educational content
                  </p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`flex items-center p-4 border rounded-lg ${
                  selectedRole === 'admin'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`rounded-full p-2 mr-4 ${
                  selectedRole === 'admin'
                    ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Administrator</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage system and user settings
                  </p>
                </div>
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!selectedRole}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
