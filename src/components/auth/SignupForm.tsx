
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRole, SignupFormData } from '../../types/auth.ts';
import { FormField } from './FormField.ts';
import { Share2, ArrowLeft, ArrowRight, GraduationCap, Users, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import cropped from '../../../public/uploads/cropped.png'

interface SignupFormProps {
  role: UserRole;
  onSubmit: (data: SignupFormData) => void;
}

export const SignupForm = ({ role, onSubmit }: SignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    role,
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phoneNumber: '',
    semester: role === 'student' ? 1 : undefined,
    secretNumber: role === 'faculty' ? '' : undefined,
    usn: role === 'student' ? '' : undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'semester' ? parseInt(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const departments = [
    { value: 'Computer Science', label: 'Computer Science' },
    { value: 'Information Science', label: 'Information Science' },
    { value: 'Electronics & Communication', label: 'Electronics & Communication' },
    { value: 'Electrics', label: 'Electrics' },
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Civil', label: 'Civil' }
  ];

  const semesters = Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Semester ${i + 1}`
  }));

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
      >
        <motion.div variants={itemVariants} className="text-center">
          <motion.div 
            className="flex items-center justify-center mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* <Share2 className="h-10 w-10 text-indigo-600" /> */}
            <span><img src={cropped} alt="logo" className="h-20 w-30"/></span>
            <span className="ml-2 text-3xl font-bold text-indigo-600">VersatileShare</span>
          </motion.div>
          
          <div className="flex items-center justify-center mb-4">
            {role === 'student' ? (
              <motion.div 
                className="flex items-center justify-center p-3 bg-indigo-50 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                <GraduationCap className="h-8 w-8 text-indigo-600" />
              </motion.div>
            ) : role === 'faculty' ? (
              <motion.div 
                className="flex items-center justify-center p-3 bg-purple-50 rounded-full" 
                whileHover={{ scale: 1.05 }}
              >
                <Users className="h-8 w-8 text-purple-600" />
              </motion.div>
            ) : (
              <motion.div 
                className="flex items-center justify-center p-3 bg-red-50 rounded-full" 
                whileHover={{ scale: 1.05 }}
              >
                <ShieldCheck className="h-8 w-8 text-red-600" />
              </motion.div>
            )}
          </div>
          
          <h2 className="text-2xl font-extrabold text-gray-900">
            {role === 'student' ? 'Student Registration' : 
             role === 'faculty' ? 'Faculty Registration' : 
             'Administrator Registration'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start sharing and accessing resources
          </p>
        </motion.div>

        <motion.form 
          variants={itemVariants} 
          className="mt-8 space-y-5" 
          onSubmit={handleSubmit}
        >
          <div className="rounded-md shadow-sm space-y-4">
            <motion.div variants={itemVariants}>
              <FormField
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                label="Department"
                name="department"
                type="select"
                value={formData.department}
                onChange={handleChange}
                options={departments}
              />
            </motion.div>

            {role === 'student' && (
              <>
                <motion.div variants={itemVariants}>
                  <FormField
                    label="University Serial Number (USN)"
                    name="usn"
                    value={formData.usn || ''}
                    onChange={handleChange}
                    placeholder="Enter your USN"
                    required={true}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    label="Semester"
                    name="semester"
                    type="select"
                    value={formData.semester?.toString() || '1'}
                    onChange={handleChange}
                    options={semesters}
                  />
                </motion.div>
              </>
            )}

            {role === 'faculty' && (
              <motion.div variants={itemVariants}>
                <FormField
                  label="Faculty Secret Number"
                  name="secretNumber"
                  value={formData.secretNumber || ''}
                  onChange={handleChange}
                  placeholder="Enter faculty secret number"
                />
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <FormField
                label="Phone Number"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                role === 'student' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' 
                  : role === 'faculty'
                  ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                  : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
            >
              <span className="absolute right-3 inset-y-0 flex items-center">
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
              Create Account
            </button>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="flex justify-between items-center pt-2"
          >
            <Link 
              to="/auth/role"
              className="flex items-center font-medium text-gray-600 hover:text-gray-500 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back to Role Selection</span>
            </Link>
            
            <Link 
              to="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors text-sm"
            >
              Have an account? Login
            </Link>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};
