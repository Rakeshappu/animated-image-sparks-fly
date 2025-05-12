
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../../types/auth.ts';
import { GraduationCap, Users, Share2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const RoleSelection = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    localStorage.setItem('selectedRole', role);
    navigate('/auth/signup');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center mb-6">
          <Share2 className="h-12 w-12 text-indigo-600" />
          <span className="ml-2 text-4xl font-bold text-indigo-600">VersatileShare</span>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">
          Choose Your Role
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Select how you'll use VersatileShare
        </p>
      </motion.div>
      
      <div className="w-full max-w-md space-y-4">
        <motion.button
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => handleRoleSelect('student')}
          className="group relative w-full flex items-center justify-center py-6 px-4 border-2 border-indigo-100 text-lg font-medium rounded-xl text-indigo-600 bg-white hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg"
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-6">
            <GraduationCap className="h-8 w-8 text-indigo-500" />
          </span>
          <span className="ml-4">Continue as Student</span>
        </motion.button>

        <motion.button
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => handleRoleSelect('faculty')}
          className="group relative w-full flex items-center justify-center py-6 px-4 border-2 border-purple-100 text-lg font-medium rounded-xl text-purple-600 bg-white hover:bg-purple-50 transition-all shadow-md hover:shadow-lg"
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-6">
            <Users className="h-8 w-8 text-purple-500" />
          </span>
          <span className="ml-4">Continue as Faculty</span>
        </motion.button>
        
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => handleRoleSelect('admin')}
          className="group relative w-full flex items-center justify-center py-6 px-4 border-2 border-red-100 text-lg font-medium rounded-xl text-red-600 bg-white hover:bg-red-50 transition-all shadow-md hover:shadow-lg"
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-6">
            <ShieldCheck className="h-8 w-8 text-red-500" />
          </span>
          <span className="ml-4">Continue as Administrator</span>
        </motion.button>
      </div>
    </div>
  );
};
