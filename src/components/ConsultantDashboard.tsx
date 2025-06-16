import React, { useState, useEffect } from 'react';
import { Crown, BarChart3, Users, MessageCircle, AlertTriangle, TrendingUp, Calendar, Target, CheckCircle, XCircle, Clock, Globe, PieChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../config/firebase';
import { Message } from '../types';
import { countries } from '../data/countries';
import Navbar from './Navbar';

interface DashboardStats {
  questionsAnsweredToday: number;
  questionsNotAnsweredToday: number;
  questionsAnsweredTotal: number;
  questionsNotAnsweredTotal: number;
  conversionsToday: number;
  conversionsTotal: number;
}

interface CountryStats {
  code: string;
  name: string;
  onlineUsers: number;
}

const ConsultantDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    questionsAnsweredToday: 0,
    questionsNotAnsweredToday: 0,
    questionsAnsweredTotal: 0,
    questionsNotAnsweredTotal: 0,
    conversionsToday: 0,
    conversionsTotal: 0
  });
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [conversionsInput, setConversionsInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.userType !== 'consultant') {
      return;
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Load consultant stats from localStorage
    const savedStats = localStorage.getItem(`consultantStats_${currentUser.uid}`);
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      setStats(parsedStats);
    }

    // Listen to all messages to calculate stats in real-time
    const categories = ['study', 'travel', 'visa'];
    const roomTypes = ['general', 'visa'];
    
    let totalQuestionsAnswered = 0;
    let totalQuestionsNotAnswered = 0;
    let todayQuestionsAnswered = 0;
    let todayQuestionsNotAnswered = 0;

    const unsubscribes: (() => void)[] = [];

    countries.forEach(country => {
      categories.forEach(category => {
        roomTypes.forEach(roomType => {
          if (category !== 'visa' && roomType === 'visa') return;
          if (category === 'visa' && roomType === 'general') return;

          const messagesRef = ref(database, `messages/${country.code}/${category}/${roomType}`);
          
          const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const messages = Object.values(data) as Message[];
              
              // Reset counters for this room
              let roomAnsweredToday = 0;
              let roomNotAnsweredToday = 0;
              let roomAnsweredTotal = 0;
              let roomNotAnsweredTotal = 0;
              
              messages.forEach(message => {
                // Check if it's a question
                if (message.content.includes('?')) {
                  const messageDate = new Date(message.timestamp);
                  const isToday = messageDate >= startOfDay && messageDate < endOfDay;
                  
                  // Check if this consultant answered the question
                  if (message.hasConsultantReply && message.answeredBy === currentUser.uid) {
                    roomAnsweredTotal++;
                    if (isToday) roomAnsweredToday++;
                  } else if (message.isUnanswered) {
                    roomNotAnsweredTotal++;
                    if (isToday) roomNotAnsweredToday++;
                  }
                }
              });
              
              // Update totals (this is a simplified approach - in production you'd want more sophisticated tracking)
              totalQuestionsAnswered += roomAnsweredTotal;
              totalQuestionsNotAnswered += roomNotAnsweredTotal;
              todayQuestionsAnswered += roomAnsweredToday;
              todayQuestionsNotAnswered += roomNotAnsweredToday;
            }
          });
          
          unsubscribes.push(unsubscribe);
        });
      });
    });

    // Update stats periodically
    const updateStatsInterval = setInterval(() => {
      const newStats = {
        questionsAnsweredToday: todayQuestionsAnswered,
        questionsNotAnsweredToday: todayQuestionsNotAnswered,
        questionsAnsweredTotal: totalQuestionsAnswered,
        questionsNotAnsweredTotal: totalQuestionsNotAnswered,
        conversionsToday: stats.conversionsToday,
        conversionsTotal: stats.conversionsTotal
      };
      
      setStats(newStats);
      localStorage.setItem(`consultantStats_${currentUser.uid}`, JSON.stringify(newStats));
    }, 5000); // Update every 5 seconds

    // Get country stats
    const countryStatsPromises = countries.map(country => {
      return new Promise<CountryStats>((resolve) => {
        let totalUsers = 0;
        let completedCategories = 0;
        const totalCategories = 3; // study, travel, visa

        categories.forEach(category => {
          const roomType = category === 'visa' ? 'visa' : 'general';
          const roomId = `${country.code}-${category}-${roomType}`;
          const roomUsersRef = ref(database, `rooms/${roomId}/users`);
          
          onValue(roomUsersRef, (snapshot) => {
            const data = snapshot.val();
            const userCount = data ? Object.keys(data).length : 0;
            totalUsers += userCount;
            completedCategories++;
            
            if (completedCategories === totalCategories) {
              resolve({
                code: country.code,
                name: country.name,
                onlineUsers: totalUsers
              });
            }
          });
        });
      });
    });

    Promise.all(countryStatsPromises).then(stats => {
      const sortedStats = stats.sort((a, b) => b.onlineUsers - a.onlineUsers);
      setCountryStats(sortedStats);
      setLoading(false);
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      clearInterval(updateStatsInterval);
    };
  }, [currentUser]);

  const handleConversionsSubmit = () => {
    if (!conversionsInput.trim() || !currentUser) return;
    
    const conversions = parseInt(conversionsInput);
    if (isNaN(conversions) || conversions < 0) return;

    const newStats = {
      ...stats,
      conversionsToday: conversions,
      conversionsTotal: stats.conversionsTotal + conversions
    };

    setStats(newStats);
    localStorage.setItem(`consultantStats_${currentUser.uid}`, JSON.stringify(newStats));
    setConversionsInput('');
  };

  // Pie chart data for analytics
  const pieChartData = [
    { name: 'Answered', value: stats.questionsAnsweredTotal, color: '#10B981' },
    { name: 'Unanswered', value: stats.questionsNotAnsweredTotal, color: '#EF4444' }
  ];

  const totalQuestions = stats.questionsAnsweredTotal + stats.questionsNotAnsweredTotal;
  const responseRate = totalQuestions > 0 ? Math.round((stats.questionsAnsweredTotal / totalQuestions) * 100) : 0;

  if (!currentUser || currentUser.userType !== 'consultant') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-blue-200">This dashboard is only available for Industry Experts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-white mt-4">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-full">
                <Crown className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Industry Expert Dashboard
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            Welcome back, <span className="font-semibold text-purple-200">{currentUser.displayName}</span>! 
            Track your impact and performance as an AskAbroad Industry Expert.
          </p>
        </div>

        {/* Today's Stats */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-purple-400" />
            Today's Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <span className="text-2xl font-bold text-green-400">{stats.questionsAnsweredToday}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Questions Answered</h3>
              <p className="text-green-200 text-sm">Successfully helped users today</p>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-6 border border-red-400/20">
              <div className="flex items-center justify-between mb-4">
                <XCircle className="h-8 w-8 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{stats.questionsNotAnsweredToday}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Missed Questions</h3>
              <p className="text-red-200 text-sm">Questions that went unanswered</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold text-blue-400">{stats.conversionsToday}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Conversions</h3>
              <p className="text-blue-200 text-sm">Users converted today</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/20">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-8 w-8 text-purple-400" />
                <span className="text-2xl font-bold text-purple-400">
                  {stats.questionsAnsweredToday > 0 ? 
                    Math.round((stats.questionsAnsweredToday / (stats.questionsAnsweredToday + stats.questionsNotAnsweredToday)) * 100) : 0}%
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Response Rate</h3>
              <p className="text-purple-200 text-sm">Questions answered vs missed</p>
            </div>
          </div>
        </div>

        {/* All-Time Stats */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <TrendingUp className="h-8 w-8 mr-3 text-blue-400" />
            All-Time Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <span className="text-2xl font-bold text-green-400">{stats.questionsAnsweredTotal}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Total Questions Answered</h3>
              <p className="text-green-200 text-sm">Lifetime impact on users</p>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-6 border border-red-400/20">
              <div className="flex items-center justify-between mb-4">
                <XCircle className="h-8 w-8 text-red-400" />
                <span className="text-2xl font-bold text-red-400">{stats.questionsNotAnsweredTotal}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Total Missed Questions</h3>
              <p className="text-red-200 text-sm">Opportunities for improvement</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold text-blue-400">{stats.conversionsTotal}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Total Conversions</h3>
              <p className="text-blue-200 text-sm">Users successfully converted</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/20">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-8 w-8 text-purple-400" />
                <span className="text-2xl font-bold text-purple-400">{responseRate}%</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Overall Response Rate</h3>
              <p className="text-purple-200 text-sm">Lifetime performance metric</p>
            </div>
          </div>
        </div>

        {/* Analytics Pie Chart */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <PieChart className="h-8 w-8 mr-3 text-yellow-400" />
            Performance Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
              <h3 className="text-xl font-semibold text-white mb-6 text-center">Question Response Distribution</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {totalQuestions > 0 ? (
                      <>
                        {/* Answered slice */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="20"
                          strokeDasharray={`${(stats.questionsAnsweredTotal / totalQuestions) * 251.2} 251.2`}
                          strokeDashoffset="0"
                        />
                        {/* Unanswered slice */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="20"
                          strokeDasharray={`${(stats.questionsNotAnsweredTotal / totalQuestions) * 251.2} 251.2`}
                          strokeDashoffset={`-${(stats.questionsAnsweredTotal / totalQuestions) * 251.2}`}
                        />
                      </>
                    ) : (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#6B7280"
                        strokeWidth="20"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{responseRate}%</div>
                      <div className="text-sm text-blue-200">Response Rate</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-white">Answered</span>
                  </div>
                  <span className="text-green-400 font-semibold">{stats.questionsAnsweredTotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-white">Unanswered</span>
                  </div>
                  <span className="text-red-400 font-semibold">{stats.questionsNotAnsweredTotal}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Key Performance Indicators</h3>
              <div className="space-y-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-200">Total Questions Handled</span>
                    <span className="text-2xl font-bold text-white">{totalQuestions}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-200">Success Rate</span>
                    <span className="text-2xl font-bold text-green-400">{responseRate}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${responseRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-200">Total Conversions</span>
                    <span className="text-2xl font-bold text-blue-400">{stats.conversionsTotal}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stats.conversionsTotal / Math.max(totalQuestions, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Country Stats */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <Globe className="h-8 w-8 mr-3 text-green-400" />
            Live Country Statistics
          </h2>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {countryStats.map((country) => (
                  <div key={country.code} className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{country.name}</h3>
                        <p className="text-sm text-blue-200">Online users across all rooms</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">{country.onlineUsers}</div>
                        <div className="flex items-center text-green-300 text-sm">
                          <Users className="h-4 w-4 mr-1" />
                          <span>online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Conversions Input */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
            <Target className="h-8 w-8 mr-3 text-orange-400" />
            Daily Conversions Tracker
          </h2>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-xl font-semibold text-white mb-4">
                How many users did you convert today?
              </h3>
              <p className="text-blue-200 mb-6 text-sm">
                Track users who took action based on your guidance (signed up, applied, etc.)
              </p>
              <div className="flex space-x-4">
                <input
                  type="number"
                  min="0"
                  value={conversionsInput}
                  onChange={(e) => setConversionsInput(e.target.value)}
                  placeholder="Enter number"
                  className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={handleConversionsSubmit}
                  disabled={!conversionsInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                >
                  <Target className="h-4 w-4" />
                  <span>Update</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl border border-purple-300/30 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-3 text-yellow-400" />
            Performance Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Response Time</h3>
              <p className="text-purple-100 text-sm mb-4">
                Questions turn yellow after 30 seconds, orange after 1 minute, and get marked as unanswered after 2 minutes.
              </p>
              <div className="flex items-center space-x-2 text-yellow-300">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Aim to respond within 30 seconds for best results</span>
              </div>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Quality Metrics</h3>
              <p className="text-purple-100 text-sm mb-4">
                Focus on answering questions thoroughly and converting users to take action on their goals.
              </p>
              <div className="flex items-center space-x-2 text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Quality over quantity for maximum impact</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantDashboard;