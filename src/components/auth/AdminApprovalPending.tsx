
import { useNavigate } from 'react-router-dom';
import { Clock, Check, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import api from '../../services/api.ts';

export const AdminApprovalPending = ({ email }: { email: string }) => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number>(0);
  
  useEffect(() => {
    // Fetch count of admin users pending approval
    const fetchPendingAdminCount = async () => {
      try {
        const response = await api.get('/api/admin/users');
        
        if (response.data && response.data.users) {
          // Filter for admin users that are not approved
          const pendingAdmins = response.data.users.filter(
            (user: any) => user.role === 'admin' && user.isAdminVerified === false
          );
          
          setPendingCount(pendingAdmins.length);
        }
      } catch (error) {
        console.error('Error fetching pending admin count:', error);
        // Default to 0 if there's an error
        setPendingCount(0);
      }
    };
    
    fetchPendingAdminCount();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
          
          <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
            Admin Approval Pending
          </h2>
          
          <p className="mt-4 text-sm text-gray-600">
            Your admin account has been created and is pending approval from the main administrator. 
            You will receive an email at <span className="font-medium">{email}</span> once your account has been approved.
          </p>
          
          <div className="mt-6 bg-indigo-50 p-4 rounded-lg text-left">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <Check className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3 text-sm text-indigo-700">
                <h3 className="font-medium">What happens next?</h3>
                <ul className="mt-2 list-disc list-inside pl-2 space-y-1">
                  <li>Your request will be reviewed by the main administrator</li>
                  <li>You'll receive an email notification when approved</li>
                  <li>Once approved, you can log in and access the admin dashboard</li>
                </ul>
              </div>
            </div>
          </div>
          
          {pendingCount > 0 && (
            <div className="mt-4 text-center py-2 px-4 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-700">
                Currently {pendingCount} admin account{pendingCount !== 1 ? 's' : ''} pending approval.
              </p>
            </div>
          )}
        </div>
        
        <div className="pt-4">
          <button
            onClick={() => navigate('/auth/login')}
            className="flex items-center justify-center w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to login
          </button>
        </div>
      </motion.div>
    </div>
  );
};
