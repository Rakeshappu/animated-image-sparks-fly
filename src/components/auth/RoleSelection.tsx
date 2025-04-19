
import { UserRole } from '../../types/auth';
import { GraduationCap, Users, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
}

export const RoleSelection = ({ onRoleSelect }: RoleSelectionProps) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md"
      >
        <motion.div
          variants={itemVariants}
          className="text-center mb-12"
        >
          <motion.div 
            className="flex items-center justify-center mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Share2 className="h-14 w-14 text-indigo-600" />
            <span className="ml-2 text-4xl font-bold text-indigo-600">VersatileShare</span>
          </motion.div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome to VersatileShare
          </h2>
          <p className="mt-3 text-xl text-gray-600">
            Choose how you'll use our platform
          </p>
        </motion.div>
        
        <div className="space-y-6">
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => onRoleSelect('student')}
              className="group relative w-full flex items-center justify-between py-6 px-6 border-2 border-indigo-100 text-lg font-medium rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg"
            >
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-indigo-500" />
                <span className="ml-4">Continue as Student</span>
              </div>
              <motion.div
                className="bg-indigo-100 p-2 rounded-full"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                >
                  →
                </motion.div>
              </motion.div>
            </button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={() => onRoleSelect('faculty')}
              className="group relative w-full flex items-center justify-between py-6 px-6 border-2 border-purple-100 text-lg font-medium rounded-xl text-purple-700 bg-white hover:bg-purple-50 transition-all shadow-md hover:shadow-lg"
            >
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-500" />
                <span className="ml-4">Continue as Faculty</span>
              </div>
              <motion.div
                className="bg-purple-100 p-2 rounded-full"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                >
                  →
                </motion.div>
              </motion.div>
            </button>
          </motion.div>
          
          <motion.div
            variants={itemVariants}
            className="text-center pt-4"
          >
            <p className="text-sm text-gray-500">
              Already have an account? {' '}
              <a href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </a>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
