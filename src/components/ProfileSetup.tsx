import React, { useState } from 'react';
import { User, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    reasonForJoining: ''
  });
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    
    if (words.length <= 50) {
      setFormData({ ...formData, reasonForJoining: text });
      setWordCount(words.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim() || !formData.reasonForJoining.trim()) return;

    const words = formData.reasonForJoining.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length > 50) {
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        displayName: formData.displayName.trim(),
        reasonForJoining: formData.reasonForJoining.trim()
      });
      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-sm"></div>
                  <div className="relative bg-white/10 p-4 rounded-full backdrop-blur-sm">
                    <MessageCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Complete Your Profile</h1>
              <p className="text-blue-100 text-lg">Help us personalize your AskAbroad chat experience</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-white mb-3">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="text"
                  id="displayName"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Reason for Joining */}
            <div>
              <label htmlFor="reasonForJoining" className="block text-sm font-medium text-white mb-3">
                What brings you to AskAbroad? * (Max 50 words)
              </label>
              <div className="relative">
                <textarea
                  id="reasonForJoining"
                  required
                  rows={5}
                  value={formData.reasonForJoining}
                  onChange={handleReasonChange}
                  className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Tell us about your goals, interests, or what you're looking to achieve through AskAbroad. For example: 'I'm planning to study computer science in Canada and need guidance on university applications and student visa requirements.'"
                />
                <div className="absolute bottom-2 right-2 text-xs text-blue-300">
                  {wordCount}/50 words
                </div>
              </div>
              <div className="mt-2 bg-white/10 rounded-lg p-3">
                <p className="text-xs text-blue-200 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Share your specific goals and interests in 50 words or less. This helps us connect you with the right experts in our chat rooms.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !formData.displayName.trim() || !formData.reasonForJoining.trim() || wordCount > 50}
              className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Setting up your profile...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-3 h-5 w-5" />
                  <span>Continue to Chat Rooms</span>
                  <ArrowRight className="ml-3 h-5 w-5" />
                </>
              )}
            </button>

            {/* Info */}
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-blue-200">
                  Once you complete your profile, you'll have access to all chat rooms and can connect with experts worldwide.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;