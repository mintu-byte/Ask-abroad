import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, User, Phone, MessageCircle, UserX, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TermsModal from './TermsModal';

// Type declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: any) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
        };
      };
    };
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [authType, setAuthType] = useState<'selection' | 'login' | 'signup' | 'guest'>('selection');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'user' | 'resident'>('user');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    mobileNumber: '',
    confirmPassword: '',
    guestName: ''
  });
  const [loading, setLoading] = useState(false);

  const { login, signup, loginWithGoogle, loginAsGuest } = useAuth();

  useEffect(() => {
    // Initialize Google One Tap
    if (isOpen && window.google) {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID') {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        });
      }
    }
  }, [isOpen]);

  const handleGoogleResponse = async (_response: any) => {
    // Check if user needs to accept terms first
    setPendingGoogleAuth(true);
    setShowTermsModal(true);
  };

  const handleGoogleTermsAccept = async () => {
    try {
      setLoading(true);
      setShowTermsModal(false);
      setPendingGoogleAuth(false);
      await loginWithGoogle();
      onClose();
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTermsModalClose = () => {
    setShowTermsModal(false);
    setPendingGoogleAuth(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authType === 'guest') {
        if (!formData.guestName.trim()) {
          throw new Error('Please enter your name');
        }
        // Generate a temporary email for guest users
        const tempEmail = `guest_${Date.now()}@askabroad.temp`;
        await loginAsGuest(formData.guestName.trim(), tempEmail);
      } else if (authType === 'login') {
        await login(formData.email, formData.password, 'user');
      } else if (authType === 'signup') {
        if (!acceptedTerms) {
          throw new Error('Please accept the terms and conditions to continue');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signup(
          formData.email, 
          formData.password, 
          formData.displayName, 
          formData.mobileNumber,
          userType
        );
      }
      onClose();
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Show terms modal for new Google users
    setShowTermsModal(true);
    setPendingGoogleAuth(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      displayName: '',
      mobileNumber: '',
      confirmPassword: '',
      guestName: ''
    });
    setUserType('user');
    setAcceptedTerms(false);
  };

  const handleClose = () => {
    setAuthType('selection');
    resetForm();
    onClose();
  };

  const goBack = () => {
    setAuthType('selection');
    resetForm();
  };

  // Selection Screen
  if (authType === 'selection') {
    return (
      <>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                      <div className="relative bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Welcome to AskAbroad!
                      </h3>
                      <p className="text-blue-100 text-sm">
                        Choose how you'd like to continue
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="bg-white px-6 py-8">
                <div className="space-y-4">
                  {/* Login/Signup Option */}
                  <button
                    onClick={() => setAuthType('login')}
                    className="w-full flex items-center justify-between p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">Login / Sign Up</h3>
                        <p className="text-sm text-gray-600">Create account or sign in for full access</p>
                      </div>
                    </div>
                    <div className="text-blue-500 group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </div>
                  </button>

                  {/* Guest Option */}
                  <button
                    onClick={() => setAuthType('guest')}
                    className="w-full flex items-center justify-between p-6 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <UserX className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">Continue as Guest</h3>
                        <p className="text-sm text-gray-600">Quick access with 5 message limit</p>
                      </div>
                    </div>
                    <div className="text-orange-500 group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </div>
                  </button>
                </div>

                {/* Info */}
                <div className="mt-8 text-center">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">
                      Join thousands of users getting expert guidance for studying and traveling abroad through real-time chat conversations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TermsModal
          isOpen={showTermsModal}
          onClose={handleTermsModalClose}
          onAccept={handleGoogleTermsAccept}
          userType="google"
        />
      </>
    );
  }

  // Guest Form
  if (authType === 'guest') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
          </div>

          <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 px-6 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={goBack}
                    className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                  >
                    ←
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                    <div className="relative bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Guest Access
                    </h3>
                    <p className="text-orange-100 text-sm">
                      Quick start with 5 messages
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-white px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Display Name */}
                <div>
                  <label htmlFor="guestName" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="guestName"
                    required
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <MessageCircle className="h-5 w-5 mr-2" />
                  )}
                  {loading ? 'Please wait...' : 'Start Chatting as Guest'}
                </button>
              </form>

              {/* Info */}
              <div className="mt-6 text-center">
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-orange-700">
                    As a guest, you can send up to 5 messages. You can use guest mode multiple times, but each session is limited to 5 messages. Sign up anytime for unlimited access to all features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login/Signup Form
  const isLogin = authType === 'login';

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
          </div>

          <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-200">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={goBack}
                    className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                  >
                    ←
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                    <div className="relative bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {isLogin ? 'Welcome Back!' : 'Join AskAbroad'}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {isLogin ? 'Continue your journey' : 'Start your global journey'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-white px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* User Type Selection - Only for signup */}
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      I am a:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType('user')}
                        className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all duration-200 ${
                          userType === 'user'
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <User className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">User</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Display Name - Only for signup */}
                {!isLogin && (
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      required
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                {/* Mobile Number - Only for signup */}
                {!isLogin && (
                  <div>
                    <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="mobileNumber"
                        required
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password - Only for signup */}
                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Confirm your password"
                    />
                  </div>
                )}

                {/* Terms and Conditions Checkbox - Only for signup */}
                {!isLogin && (
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center h-5">
                      <input
                        id="terms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        required
                      />
                    </div>
                    <div className="text-sm">
                      <label htmlFor="terms" className="text-gray-700">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-blue-600 hover:text-blue-500 underline focus:outline-none"
                        >
                          Terms and Conditions
                        </button>
                        {' '}and{' '}
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-500 underline focus:outline-none"
                        >
                          Privacy Policy
                        </button>
                      </label>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || (!isLogin && !acceptedTerms)}
                  className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <MessageCircle className="h-5 w-5 mr-2" />
                  )}
                  {loading ? 'Please wait...' : (isLogin ? 'Sign In & Chat' : 'Create Account & Chat')}
                </button>

                {/* Google Sign-in Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-4 px-6 border-2 border-gray-200 rounded-xl shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {loading ? 'Please wait...' : 'Continue with Google'}
                </button>
              </form>

              {/* Switch Mode */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setAuthType(isLogin ? 'signup' : 'login')}
                    className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors duration-200"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setShowTermsModal(false);
          if (pendingGoogleAuth) {
            handleGoogleTermsAccept();
          } else {
            setAcceptedTerms(true);
          }
        }}
        userType={pendingGoogleAuth ? 'google' : 'signup'}
      />
    </>
  );
};

export default AuthModal;