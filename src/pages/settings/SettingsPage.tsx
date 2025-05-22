
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Lock, Shield, Bell, Eye, EyeOff } from 'lucide-react';

export const SettingsPage = () => {
  const { user} = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile settings state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Security settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupStep, setSetupStep] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  
  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [resourceAlerts, setResourceAlerts] = useState(true);
  const [newFeatureUpdates, setNewFeatureUpdates] = useState(true);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // await updateUserProfile({
      //   fullName,
      //   phoneNumber,
      //   department
      // });
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error('Current password is required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setChangingPassword(true);
      
      // Call API to change password
      const response = await fetch('/api/user/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      
      toast.success('Password updated successfully');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };
  
  const initiate2FASetup = async () => {
    try {
      setVerifying2FA(true);
      
      // Call API to initiate 2FA setup
      // This would return a QR code URL and setup key
      
      // Simulated response
      setTimeout(() => {
        setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/VersatileShare:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=VersatileShare');
        setSetupKey('JBSWY3DPEHPK3PXP');
        setSetupStep(1);
        setVerifying2FA(false);
      }, 1000);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast.error('Failed to set up Two-Factor Authentication');
      setVerifying2FA(false);
    }
  };
  
  const verify2FACode = async () => {
    try {
      setVerifying2FA(true);
      
      // Call API to verify 2FA code
      // This would verify the user entered code against the setup key
      
      // Simulated verification
      if (verificationCode === '123456' || true) { // In a real app, remove "|| true"
        setTimeout(() => {
          setTwoFactorEnabled(true);
          setSetupStep(2);
          toast.success('Two-Factor Authentication enabled successfully');
          setVerifying2FA(false);
        }, 1000);
      } else {
        setTimeout(() => {
          toast.error('Invalid verification code');
          setVerifying2FA(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast.error('Failed to verify code');
      setVerifying2FA(false);
    }
  };
  
  const disable2FA = async () => {
    try {
      setVerifying2FA(true);
      
      // Call API to disable 2FA
      
      // Simulated response
      setTimeout(() => {
        setTwoFactorEnabled(false);
        setSetupStep(0);
        setVerificationCode('');
        toast.success('Two-Factor Authentication disabled');
        setVerifying2FA(false);
      }, 1000);
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error('Failed to disable Two-Factor Authentication');
      setVerifying2FA(false);
    }
  };
  
  const saveNotificationSettings = () => {
    toast.success('Notification preferences saved');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-gray-100">Account Settings</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 flex items-center ${
              activeTab === 'profile'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600'
            }`}
          >
            <User size={18} className="mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 flex items-center ${
              activeTab === 'security'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600'
            }`}
          >
            <Lock size={18} className="mr-2" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 flex items-center ${
              activeTab === 'notifications'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600'
            }`}
          >
            <Bell size={18} className="mr-2" />
            Notifications
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Your phone number"
                  />
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Your department"
                  />
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
          
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="relative">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={18} className="text-gray-400" />
                        ) : (
                          <Eye size={18} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff size={18} className="text-gray-400" />
                        ) : (
                          <Eye size={18} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} className="text-gray-400" />
                        ) : (
                          <Eye size={18} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Two-Factor Authentication</h3>
                
                {!twoFactorEnabled && setupStep === 0 && (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    <button
                      onClick={initiate2FASetup}
                      disabled={verifying2FA}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifying2FA ? 'Setting Up...' : 'Set Up Two-Factor Authentication'}
                    </button>
                  </div>
                )}
                
                {setupStep === 1 && (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Scan this QR code with your authenticator app, then enter the verification code below.
                    </p>
                    <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-6">
                      <div className="p-2 bg-white border">
                        <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          If you can't scan the QR code, use this key instead:
                        </p>
                        <p className="font-mono bg-gray-100 p-2 rounded text-sm break-all mb-2">
                          {setupKey}
                        </p>
                        <p className="text-xs text-gray-500">
                          Enter this key manually into your authenticator app.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Enter 6-digit code"
                        />
                      </div>
                      
                      <div className="flex space-x-4">
                        <button
                          onClick={verify2FACode}
                          disabled={verifying2FA || verificationCode.length !== 6}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {verifying2FA ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button
                          onClick={() => setSetupStep(0)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {twoFactorEnabled && (
                  <div>
                    <div className="flex items-center mb-4">
                      <Shield className="w-5 h-5 text-green-500 mr-2" />
                      <p className="text-green-700 font-medium">Two-Factor Authentication is enabled</p>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Your account is now protected with an additional layer of security. You'll be prompted for a code from your authenticator app when logging in.
                    </p>
                    <button
                      onClick={disable2FA}
                      disabled={verifying2FA}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifying2FA ? 'Disabling...' : 'Disable Two-Factor Authentication'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <form onSubmit={(e) => { e.preventDefault(); saveNotificationSettings(); }}>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Email Notifications</h4>
                    <p className="text-xs text-gray-500">Receive emails for important updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={emailNotifications}
                      onChange={() => setEmailNotifications(!emailNotifications)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Resource Alerts</h4>
                    <p className="text-xs text-gray-500">Get notified when new resources are available</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={resourceAlerts}
                      onChange={() => setResourceAlerts(!resourceAlerts)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">New Feature Updates</h4>
                    <p className="text-xs text-gray-500">Stay informed about new features and improvements</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newFeatureUpdates}
                      onChange={() => setNewFeatureUpdates(!newFeatureUpdates)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
