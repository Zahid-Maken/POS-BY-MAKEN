import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import Sidebar from '../../components/Sidebar';
import { User, Trash, Plus, Save, X, Lock, Key, UserPlus, Percent, DollarSign } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';

export default function AdminSettings() {
  const [newCashierUsername, setNewCashierUsername] = useState('');
  const [newCashierPassword, setNewCashierPassword] = useState('');
  const [showAddCashier, setShowAddCashier] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cashierToDelete, setCashierToDelete] = useState<string | null>(null);
  
  const { users, createCashier, updateCashierPassword, deleteCashier, getCashiers } = useAuthStore();
  const { settings, updateTaxRate, updateUniversalDiscount } = useSettingsStore();

  // State for tax and discount settings
  const [taxRate, setTaxRate] = useState(settings?.taxRate || 10);
  const [universalDiscount, setUniversalDiscount] = useState(settings?.universalDiscount || 0);

  useEffect(() => {
    setCashiers(getCashiers());
  }, [getCashiers, users]);

  useEffect(() => {
    if (settings) {
      setTaxRate(settings.taxRate);
      setUniversalDiscount(settings.universalDiscount);
    }
  }, [settings]);

  const handleCreateCashier = () => {
    setError('');
    setSuccess('');
    
    if (!newCashierUsername || !newCashierPassword) {
      setError('Please fill in all fields');
      return;
    }

    try {
      createCashier(newCashierUsername, newCashierPassword);
      setNewCashierUsername('');
      setNewCashierPassword('');
      setShowAddCashier(false);
      setSuccess('Cashier created successfully');
      setCashiers(getCashiers());
    } catch (err) {
      setError('Failed to create cashier');
    }
  };

  const handleChangePassword = () => {
    setError('');
    setSuccess('');
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      updateCashierPassword(selectedCashier as string, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePasswordModal(false);
      setSuccess('Password updated successfully');
    } catch (err) {
      setError('Failed to update password');
    }
  };

  const handleDeleteCashier = () => {
    setError('');
    setSuccess('');
    
    try {
      deleteCashier(cashierToDelete as string);
      setShowDeleteModal(false);
      setSuccess('Cashier deleted successfully');
      setCashiers(getCashiers());
    } catch (err: any) {
      setError(err.message || 'Failed to delete cashier');
    }
  };

  const handleUpdateTaxRate = () => {
    if (taxRate < 0 || taxRate > 100) {
      setError('Tax rate must be between 0 and 100');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      updateTaxRate(taxRate);
      setSuccess('Tax rate updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update tax rate');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  const handleUpdateDiscount = () => {
    if (universalDiscount < 0 || universalDiscount > 100) {
      setError('Discount must be between 0 and 100');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      updateUniversalDiscount(universalDiscount);
      setSuccess('Universal discount updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update universal discount');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
          <p className="text-gray-500">Manage your account and system settings</p>
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

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Cashier Accounts</h2>
            <button 
              onClick={() => setShowAddCashier(true)}
              className="flex items-center gap-2 bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              disabled={showAddCashier}
            >
              <Plus className="w-4 h-4" />
              Add Cashier
            </button>
          </div>

          {showAddCashier && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">New Cashier</h3>
                <button onClick={() => setShowAddCashier(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">@cashier</span>
                    </div>
                    <input
                      type="text"
                      value={newCashierUsername}
                      onChange={(e) => setNewCashierUsername(e.target.value)}
                      className="pl-16 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="john"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newCashierPassword}
                    onChange={(e) => setNewCashierPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCreateCashier}
                  className="flex items-center gap-2 bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <Save className="w-4 h-4" />
                  Create Cashier
                </button>
              </div>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cashiers.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                      No cashiers found
                    </td>
                  </tr>
                ) : (
                  cashiers.map((cashier) => (
                    <tr key={cashier.username}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{cashier.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => {
                            setSelectedCashier(cashier.username);
                            setShowChangePasswordModal(true);
                          }}
                        >
                          <Key className="h-5 w-5" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 mr-3"
                          onClick={() => {
                            setCashierToDelete(cashier.username);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Admin Account</h2>
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-emerald-100 rounded-full">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <div className="text-lg font-medium text-gray-900">@admin</div>
              <div className="text-sm text-gray-500">Administrator Account</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-gray-500" />
            Tax & Discount Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                  placeholder="10.0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Percent className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This tax rate will be applied to all sales
              </p>
              <button
                onClick={handleUpdateTaxRate}
                className="mt-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Tax Rate
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Universal Discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={universalDiscount}
                  onChange={(e) => setUniversalDiscount(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                  placeholder="0.0"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Percent className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This discount will be applied to all products
              </p>
              <button
                onClick={handleUpdateDiscount}
                className="mt-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Update Universal Discount
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium">Change Cashier Password</h3>
              <button onClick={() => setShowChangePasswordModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 mr-3"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Save className="h-4 w-4 mr-1" />
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-500">
                Are you sure you want to delete this cashier account? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 mr-3"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCashier}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 