import React from 'react';
import { User, Calendar, MessageCircle, Award, Crown, Globe, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

const ProfileDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'consultant':
        return <Crown className="h-8 w-8 text-purple-400" />;
      case 'resident':
        return <Globe className="h-8 w-8 text-green-400" />;
      case 'guest':
        return <Users className="h-8 w-8 text-orange-400" />;
      default:
        return <User className="h-8 w-8 text-blue-400" />;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'consultant':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'resident':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      case 'guest':
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white';
    }
  };

  const getUserTypeGradient = (userType: string) => {
    switch (userType) {
      case 'consultant':
        return 'from-purple-600 via-purple-700 to-pink-600';
      case 'resident':
        return 'from-green-600 via-emerald-700 to-teal-600';
      case 'guest':
        return 'from-orange-600 via-red-700 to-pink-600';
      default:
        return 'from-blue-600 via-indigo-700 to-purple-600';
    }
  };

  const getUserTypeDisplayName = (userType: string) => {
    switch (userType) {
      case 'consultant':
        return 'Industry Expert';
      case 'resident':
        return 'Resident';
      case 'guest':
        return 'Guest';
      default:
        return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <Navbar />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getUserTypeGradient(currentUser.userType)} px-8 py-12`}>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-sm"></div>
                <div className="relative w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                  {getUserTypeIcon(currentUser.userType)}
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">{currentUser.displayName}</h1>
                <p className="text-blue-100 text-lg mb-2">{currentUser.email}</p>
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${getUserTypeColor(currentUser.userType)} shadow-lg`}>
                  {getUserTypeIcon(currentUser.userType)}
                  <span className="font-medium">
                    {getUserTypeDisplayName(currentUser.userType)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                  <User className="h-6 w-6 mr-2 text-blue-400" />
                  Basic Information
                </h2>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-sm font-medium text-blue-200">User Type</span>
                      <span className={`px-4 py-2 text-sm font-medium rounded-full ${getUserTypeColor(currentUser.userType)} shadow-lg`}>
                        {getUserTypeDisplayName(currentUser.userType)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-sm font-medium text-blue-200">Email</span>
                      <span className="text-sm text-white">{currentUser.email}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-blue-200">Member Since</span>
                      <span className="text-sm text-white flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                        {new Date(currentUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                  <Sparkles className="h-6 w-6 mr-2 text-yellow-400" />
                  Activity Statistics
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-blue-400/20">
                    <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
                    <div className="text-sm text-blue-200">Messages Sent</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-green-400/20">
                    <div className="text-3xl font-bold text-green-400 mb-2">0</div>
                    <div className="text-sm text-green-200">Rooms Joined</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-purple-400/20">
                    <div className="text-3xl font-bold text-purple-400 mb-2">0</div>
                    <div className="text-sm text-purple-200">Helped Users</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-6 text-center border border-orange-400/20">
                    <div className="text-3xl font-bold text-orange-400 mb-2">0</div>
                    <div className="text-sm text-orange-200">Active Days</div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Type Specific Information */}
            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <Award className="h-6 w-6 mr-2 text-yellow-400" />
                {currentUser.userType === 'consultant' ? 'Industry Expert Information' : 
                 currentUser.userType === 'resident' ? 'Resident Information' : 
                 currentUser.userType === 'guest' ? 'Guest Information' : 'User Information'}
              </h2>
              
              <div className={`bg-gradient-to-br ${getUserTypeGradient(currentUser.userType)}/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20`}>
                {currentUser.userType === 'consultant' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Crown className="h-8 w-8 text-purple-400" />
                      <span className="text-xl font-semibold text-white">Verified Industry Expert</span>
                    </div>
                    <p className="text-blue-100 leading-relaxed">
                      As an AskAbroad Industry Expert, you have the privilege to guide students and professionals 
                      in their international journey through our real-time chat platform. Your expertise helps shape dreams into reality.
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 mt-4">
                      <p className="text-sm text-purple-200">
                        💼 Access to all chat rooms • 🎯 Priority support • 📊 Analytics dashboard
                      </p>
                    </div>
                  </div>
                )}
                
                {currentUser.userType === 'resident' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Globe className="h-8 w-8 text-green-400" />
                      <span className="text-xl font-semibold text-white">Community Resident</span>
                    </div>
                    <p className="text-blue-100 leading-relaxed">
                      As a resident abroad, your real-world experience is invaluable to those considering 
                      a similar path. Share your insights in chat rooms and help others make informed decisions.
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 mt-4">
                      <p className="text-sm text-green-200">
                        🌍 Local insights • 💬 Chat room access • 🤝 Community support
                      </p>
                    </div>
                  </div>
                )}

                {currentUser.userType === 'guest' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <Users className="h-8 w-8 text-orange-400" />
                      <span className="text-xl font-semibold text-white">Guest User</span>
                    </div>
                    <p className="text-blue-100 leading-relaxed">
                      Welcome to AskAbroad! As a guest, you can explore our chat rooms with limited messaging. 
                      Sign up for unlimited access to all features and expert guidance.
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 mt-4">
                      <p className="text-sm text-orange-200">
                        📝 5 messages limit • 👀 View all chats • 🔓 Upgrade anytime
                      </p>
                    </div>
                  </div>
                )}
                
                {currentUser.userType === 'user' && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <User className="h-8 w-8 text-blue-400" />
                      <span className="text-xl font-semibold text-white">Community Member</span>
                    </div>
                    <p className="text-blue-100 leading-relaxed">
                      Welcome to AskAbroad! Connect with Industry Experts and residents in real-time chat rooms to get personalized 
                      guidance for your international education, work, or immigration goals.
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 mt-4">
                      <p className="text-sm text-blue-200">
                        💬 Unlimited messaging • 🌍 Global chat rooms • 🎯 Expert guidance
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-blue-400" />
                Quick Actions
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => window.location.href = '/categories'}
                  className="group flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  <span>Browse Chat Rooms</span>
                  <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
                </button>
                
                <button className="flex items-center justify-center px-6 py-4 border-2 border-white/20 text-white rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 backdrop-blur-sm">
                  <User className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
                
                <button className="flex items-center justify-center px-6 py-4 border-2 border-white/20 text-white rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 backdrop-blur-sm">
                  <Award className="h-5 w-5 mr-2" />
                  Account Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard;