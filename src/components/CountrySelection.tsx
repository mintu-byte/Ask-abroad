import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowRight, Star, Globe, Sparkles, Users } from 'lucide-react';
import { getCountriesByCategory } from '../data/countries';
import { useAuth } from '../contexts/AuthContext';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';
import Navbar from './Navbar';

interface CountrySelectionProps {
  category: 'study' | 'travel' | 'visa';
  onBack: () => void;
}

interface CountryWithUsers {
  code: string;
  name: string;
  image: string;
  description: string;
  studyDescription: string;
  travelDescription: string;
  visaDescription?: string;
  popular: boolean;
  onlineUsers: number;
}

const CountrySelection: React.FC<CountrySelectionProps> = ({ category, onBack }) => {
  const navigate = useNavigate();
  useAuth();
  const [countriesWithUsers, setCountriesWithUsers] = useState<CountryWithUsers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const countries = getCountriesByCategory(category);
    const roomType = category === 'visa' ? 'visa' : 'general';
    
    // Create promises for each country to get user counts
    const countryPromises = countries.map(country => {
      return new Promise<CountryWithUsers>((resolve) => {
        const roomId = `${country.code}-${category}-${roomType}`;
        const roomUsersRef = ref(database, `rooms/${roomId}/users`);
        
        const unsubscribe = onValue(roomUsersRef, (snapshot) => {
          const data = snapshot.val();
          const userCount = data ? Object.keys(data).length : 0;
          
          resolve({
            ...country,
            onlineUsers: userCount
          });
          
          // Unsubscribe after getting the data
          unsubscribe();
        });
      });
    });

    Promise.all(countryPromises).then(countriesData => {
      // Sort by online users (descending), then by popularity, then alphabetically
      const sortedCountries = countriesData.sort((a, b) => {
        // First sort by online users count (descending)
        if (a.onlineUsers !== b.onlineUsers) {
          return b.onlineUsers - a.onlineUsers;
        }
        // Then by popularity
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        // Finally alphabetically
        return a.name.localeCompare(b.name);
      });
      
      setCountriesWithUsers(sortedCountries);
      setLoading(false);
    });
  }, [category]);

  const handleCountrySelect = (countryCode: string) => {
    navigate(`/chat/${countryCode}/${category}`);
  };

  const getCategoryInfo = () => {
    if (category === 'study') {
      return {
        title: 'Study Abroad Chat Rooms',
        subtitle: 'Choose your dream study destination',
        description: 'Join live chat rooms with education Industry Experts and current students to get real-time insights about universities, applications, scholarships, and student life.',
        icon: '🎓',
        gradient: 'from-blue-500 via-blue-600 to-indigo-600'
      };
    } else if (category === 'travel') {
      return {
        title: 'Travel Chat Rooms',
        subtitle: 'Explore the world with confidence',
        description: 'Connect with local residents and travel experts in real-time chat rooms for visa guidance, cultural tips, and must-visit recommendations.',
        icon: '✈️',
        gradient: 'from-green-500 via-emerald-600 to-teal-600'
      };
    } else {
      return {
        title: 'Visa Guidance Chat Rooms',
        subtitle: 'Get expert visa assistance',
        description: 'Connect with visa experts and immigration specialists for country-specific guidance on applications, documentation, and processes.',
        icon: '📋',
        gradient: 'from-purple-500 via-purple-600 to-pink-600'
      };
    }
  };

  const categoryInfo = getCategoryInfo();

  // Separate popular and regular countries
  const popularCountries = countriesWithUsers.filter(country => country.popular);
  const regularCountries = countriesWithUsers.filter(country => !country.popular);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <Navbar />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Loading chat rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  const CountryCard = ({ country }: { country: CountryWithUsers }) => (
    <div
      key={country.code}
      onClick={() => handleCountrySelect(country.code)}
      className="group relative cursor-pointer"
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${country.popular ? categoryInfo.gradient : 'from-blue-500 to-purple-500'} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300`}></div>

      {/* Main card */}
      <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
        {/* Flag Section - Top Half */}
        <div className="h-32 bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center border-b border-white/20 p-4">
          <div className="w-full h-full overflow-hidden rounded-md relative">
            <img
              src={country.image}
              alt={`${country.name} flag`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>

        {/* Content Section - Bottom Half */}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-3 text-center">
            {country.name}
          </h3>
          <p className="text-sm text-blue-100 mb-4 leading-relaxed text-center">
            {category === 'study' ? country.studyDescription : 
             category === 'travel' ? country.travelDescription : 
             country.visaDescription || 'Expert visa guidance and immigration support'}
          </p>

          {/* Online users count */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <Users className="h-4 w-4 text-green-300" />
            <span className="text-sm text-green-300 font-medium">
              {country.onlineUsers} online
            </span>
          </div>

          <div className={`flex items-center justify-center space-x-2 text-white bg-gradient-to-r ${country.popular ? categoryInfo.gradient : 'from-blue-600 to-purple-600'} rounded-xl py-3 px-4 group-hover:shadow-lg transition-all duration-300`}>
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Join Chat Room</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </div>
    </div>
  );

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
        {/* Header */}
        <div className="text-center mb-16">
          <button
            onClick={onBack}
            className="group inline-flex items-center text-blue-300 hover:text-white mb-8 transition-all duration-200 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 hover:bg-white/20"
          >
            <ArrowRight className="h-5 w-5 mr-2 transform rotate-180 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Categories
          </button>

          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${categoryInfo.gradient} rounded-full blur-lg opacity-50 animate-pulse`}></div>
              <div className={`relative bg-gradient-to-r ${categoryInfo.gradient} p-6 rounded-full text-6xl`}>
                {categoryInfo.icon}
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            {categoryInfo.title}
          </h1>
          <p className="text-xl text-blue-100 max-w-4xl mx-auto mb-4 leading-relaxed">
            {categoryInfo.subtitle}
          </p>
          <p className="text-blue-200 max-w-3xl mx-auto leading-relaxed">
            {categoryInfo.description}
          </p>
        </div>

        {/* Popular Countries */}
        {popularCountries.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-3 rounded-xl">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">Most Active Chat Destinations</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularCountries.map((country) => (
                <CountryCard key={country.code} country={country} />
              ))}
            </div>
          </div>
        )}

        {/* All Countries */}
        {regularCountries.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">All Chat Destinations</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {regularCountries.map((country) => (
                <CountryCard key={country.code} country={country} />
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-6">
                Don't see your destination?
              </h2>
              <p className="text-blue-100 mb-8 text-lg leading-relaxed">
                We're constantly expanding our chat network. Contact us to request support for additional countries and we'll connect you with experts in your desired destination.
              </p>
              <button className="group inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                <MessageSquare className="mr-3 h-5 w-5" />
                Contact Support
                <ArrowRight className="ml-3 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountrySelection;