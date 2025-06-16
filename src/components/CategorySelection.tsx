import React from 'react';
import { GraduationCap, Plane, ArrowRight, BookOpen, MapPin, MessageCircle, Users, Globe, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

interface CategorySelectionProps {
  onCategorySelect: (category: 'study' | 'travel' | 'visa') => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ onCategorySelect }) => {
  const { currentUser } = useAuth();

  const categories = [
    {
      id: 'study' as const,
      title: 'Study Abroad',
      description: 'Connect with education experts and students worldwide for university guidance, scholarships, and academic success',
      icon: <GraduationCap className="h-16 w-16" />,
      features: [
        'University selection guidance',
        'Application process help',
        'Scholarship information',
        'Student visa assistance',
        'Academic program advice'
      ],
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      bgGradient: 'from-blue-50 via-blue-100 to-indigo-100',
      borderGradient: 'from-blue-200 to-indigo-200',
      chatRooms: '150+ Active Chat Rooms',
      experts: '200+ Education Experts'
    },
    {
      id: 'travel' as const,
      title: 'Travel Abroad',
      description: 'Get real-time travel guidance, cultural insights, and destination recommendations from locals and travel experts',
      icon: <Plane className="h-16 w-16" />,
      features: [
        'Travel visa guidance',
        'Destination recommendations',
        'Cultural insights',
        'Travel planning tips',
        'Local customs advice'
      ],
      gradient: 'from-green-500 via-emerald-600 to-teal-600',
      bgGradient: 'from-green-50 via-emerald-100 to-teal-100',
      borderGradient: 'from-green-200 to-teal-200',
      chatRooms: '120+ Active Chat Rooms',
      experts: '180+ Travel Experts'
    },
    {
      id: 'visa' as const,
      title: 'Visa Guidance',
      description: 'Get expert assistance with visa applications, documentation, and immigration processes for any country',
      icon: <FileText className="h-16 w-16" />,
      features: [
        'Visa application guidance',
        'Document preparation help',
        'Immigration process support',
        'Country-specific requirements',
        'Expert consultation'
      ],
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      bgGradient: 'from-purple-50 via-purple-100 to-pink-100',
      borderGradient: 'from-purple-200 to-pink-200',
      chatRooms: '80+ Active Chat Rooms',
      experts: '150+ Visa Experts'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl mb-8 shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="h-20 w-20" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Welcome <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{currentUser?.displayName}</span>!
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Choose your area of interest to join live chat rooms and connect with the right experts for personalized guidance
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className="group relative cursor-pointer"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${category.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>

              {/* Main card */}
              <div className={`relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl`}>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r ${category.gradient} text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {category.icon}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {category.title}
                  </h2>
                  <p className="text-blue-100 leading-relaxed text-lg">
                    {category.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-white mb-1">{category.chatRooms}</div>
                    <div className="text-blue-200 text-sm">Chat Rooms</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold text-white mb-1">{category.experts}</div>
                    <div className="text-blue-200 text-sm">Online Experts</div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {category.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 bg-gradient-to-r ${category.gradient} rounded-full`}></div>
                      <span className="text-blue-100 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className={`flex items-center justify-center space-x-3 text-white bg-gradient-to-r ${category.gradient} rounded-xl py-4 px-6 group-hover:shadow-lg transition-all duration-300`}>
                  {category.id === 'study' ? (
                    <BookOpen className="h-6 w-6" />
                  ) : category.id === 'travel' ? (
                    <MapPin className="h-6 w-6" />
                  ) : (
                    <FileText className="h-6 w-6" />
                  )}
                  <span className="font-semibold text-lg">Join {category.title} Chats</span>
                  <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-2xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Not sure which category fits you?
            </h3>
            <p className="text-blue-100 mb-8 text-lg leading-relaxed">
              You can always switch between categories later. All sections have dedicated chat rooms with experts ready to help you achieve your international goals through real-time conversations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="text-white font-medium">Industry Expert</span>
                <span className="text-blue-200 text-sm">Verified professionals</span>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <span className="text-white font-medium">Global Interactions</span>
                <span className="text-blue-200 text-sm">Real experiences</span>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-white font-medium">24/7 Chat Support</span>
                <span className="text-blue-200 text-sm">Always available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySelection;