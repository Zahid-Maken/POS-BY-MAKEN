import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Sidebar from '../../components/Sidebar';
import { User, Save, Key } from 'lucide-react';

export default function CashierSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user, changePassword } = useAuthStore();

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Verify the current password and update if valid
    if (user) {
      try {
        await changePassword(user.username, currentPassword, newPassword);
        setSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowChangePassword(false);
      } catch (err: any) {
        setError(err.message || 'Failed to change password');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
          <p className="text-gray-500">Manage your account settings</p>
        </div>

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Your Account</h2>
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-emerald-100 rounded-full">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <div className="text-lg font-medium text-gray-900">{user?.username}</div>
              <div className="text-sm text-gray-500">Cashier Account</div>
            </div>
          </div>

          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="flex items-center gap-2 text-emerald-600 mb-4 hover:text-emerald-700"
          >
            <Key className="w-4 h-4" />
            {showChangePassword ? 'Cancel' : 'Change Password'}
          </button>

          {showChangePassword && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Enter current password"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Enter new password"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleChangePassword}
                  className="flex items-center gap-2 bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 