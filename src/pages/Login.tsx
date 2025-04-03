import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, User, Key, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const navigate = useNavigate();
  const { 
    login, 
    isFirstLogin, 
    createAdmin, 
    completeOnboarding, 
    getRecoveryQuestion,
    resetPassword,
    checkRecoveryAnswer
  } = useAuthStore();

  useEffect(() => {
    if (isFirstLogin) {
      setIsOnboarding(true);
    }
  }, [isFirstLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(username, password);
      const role = username.includes('@admin') ? 'admin' : 'cashier';
      navigate(`/${role}`);
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const isCorrect = await checkRecoveryAnswer(username, recoveryAnswer);
      if (isCorrect) {
        await resetPassword(username, recoveryAnswer, newPassword);
        setShowForgotPassword(false);
        setError('');
      } else {
        setError('Incorrect recovery answer');
      }
    } catch (err) {
      setError('Password reset failed');
    }
  };

  const handleGetQuestion = () => {
    const question = getRecoveryQuestion(username);
    if (question) {
      setRecoveryQuestion(question);
    } else {
      setError('User not found');
    }
  };

  const handleAdminSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (adminPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!securityQuestion || !securityAnswer) {
      setError('Please fill in all fields');
      return;
    }

    createAdmin(adminPassword, securityQuestion, securityAnswer);
    completeOnboarding();
    setIsOnboarding(false);
  };

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Package className="w-10 h-10 text-emerald-500" />
            <h1 className="text-2xl font-bold">TapCart</h1>
          </div>

          <h2 className="text-xl font-semibold mb-4 text-center">Admin Setup</h2>
          <p className="text-gray-500 mb-6 text-center">Set up your admin account to get started</p>

          <form onSubmit={handleAdminSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="flex items-center mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 bg-gray-100 py-2 px-3">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span>@admin</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Admin Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Create a strong password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Confirm your password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Recovery Question</label>
              <input
                type="text"
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="E.g. What is your pet's name?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Recovery Answer</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Your answer"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Complete Setup
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Package className="w-10 h-10 text-emerald-500" />
            <h1 className="text-2xl font-bold">TapCart</h1>
          </div>

          <h2 className="text-xl font-semibold mb-4 text-center">Reset Password</h2>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Enter your username"
              />
            </div>

            {!recoveryQuestion ? (
              <button
                type="button"
                onClick={handleGetQuestion}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Get Recovery Question
              </button>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Recovery Question</label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200">
                    {recoveryQuestion}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Your Answer</label>
                  <input
                    type="text"
                    value={recoveryAnswer}
                    onChange={(e) => setRecoveryAnswer(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Your answer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="New password"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Back to Login
              </button>
              
              {recoveryQuestion && (
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Reset Password
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Package className="w-10 h-10 text-emerald-500" />
          <h1 className="text-2xl font-bold">TapCart</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="@admin or @cashier..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="w-full flex justify-center items-center gap-1 text-sm text-gray-500 hover:text-emerald-600"
          >
            <HelpCircle className="h-3 w-3" />
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
}