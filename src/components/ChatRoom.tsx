import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Users, Crown, Globe, AlertCircle, Reply, X, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ref, push, onValue, query, orderByChild, startAt, set, remove, onDisconnect, update } from 'firebase/database';
import { database } from '../config/firebase';
import { Message, RoomUser } from '../types';
import { countries } from '../data/countries';
import Navbar from './Navbar';

const ChatRoom: React.FC = () => {
  const { countryCode, category } = useParams<{ countryCode: string; category: string }>();
  const navigate = useNavigate();
  const { currentUser, incrementGuestMessageCount } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<RoomUser[]>([]);
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [highlightedMessage, setHighlightedMessage] = useState<string | null>(null);
  const [messageTimers, setMessageTimers] = useState<{ [key: string]: NodeJS.Timeout[] }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const country = countries.find(c => c.code === countryCode);

  // Check if current user is a consultant
  const isConsultant = currentUser?.userType === 'consultant';

  useEffect(() => {
    if (!currentUser || !countryCode || !category) return;

    // For visa category, use 'visa' as the room type
    const roomType = category === 'visa' ? 'visa' : 'general';
    const roomId = `${countryCode}-${category}-${roomType}`;

    // Add user to room presence
    const userPresenceRef = ref(database, `rooms/${roomId}/users/${currentUser.uid}`);
    const userPresenceData = {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      userType: currentUser.userType,
      joinedAt: new Date().toISOString()
    };

    set(userPresenceRef, userPresenceData);

    // Remove user when they disconnect
    onDisconnect(userPresenceRef).remove();

    // Listen for room users
    const roomUsersRef = ref(database, `rooms/${roomId}/users`);
    const unsubscribeUsers = onValue(roomUsersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.values(data) as RoomUser[];
        setOnlineUsers(usersList);
      } else {
        setOnlineUsers([]);
      }
    });

    // Listen for Firebase messages (only non-expired ones)
    const messagesRef = ref(database, `messages/${countryCode}/${category}/${roomType}`);
    const now = new Date().toISOString();
    const validMessagesQuery = query(messagesRef, orderByChild('expiresAt'), startAt(now));

    const unsubscribeMessages = onValue(validMessagesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        const sortedMessages = messagesList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMessages(sortedMessages);
        
        // Set up timers for new questions that don't have timers yet and aren't already processed
        sortedMessages.forEach(message => {
          if (isQuestion(message.content) && 
              !message.hasConsultantReply && 
              !message.isUnanswered && 
              !messageTimers[message.id] &&
              message.status !== 'unanswered') {
            setupMessageTimer(message);
          }
        });
      } else {
        setMessages([]);
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeMessages();
      // Clear all timers
      Object.values(messageTimers).forEach(timers => {
        timers.forEach(timer => clearTimeout(timer));
      });
      // Remove user from room when component unmounts
      remove(userPresenceRef);
    };
  }, [currentUser, countryCode, category]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close reply when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedMessage && !(event.target as Element).closest('.message-container')) {
        setSelectedMessage(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedMessage]);

  // Clear highlight after animation
  useEffect(() => {
    if (highlightedMessage) {
      const timer = setTimeout(() => {
        setHighlightedMessage(null);
      }, 2000); // Remove highlight after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [highlightedMessage]);

  const isQuestion = (content: string): boolean => {
    return content.includes('?');
  };

  const updateMessageStatus = async (messageId: string, status: string, additionalData: any = {}) => {
    const messageRef = ref(database, `messages/${countryCode}/${category}/${category === 'visa' ? 'visa' : 'general'}/${messageId}`);
    
    try {
      await update(messageRef, { status, ...additionalData });
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const setupMessageTimer = (message: Message) => {
    if (!isQuestion(message.content) || message.hasConsultantReply || message.isUnanswered) return;

    // Clear any existing timers for this message
    clearMessageTimers(message.id);

    const messageTime = new Date(message.timestamp).getTime();
    const now = Date.now();
    const elapsed = now - messageTime;

    // Calculate remaining time for each status
    const yellowTime = 30000; // 30 seconds
    const orangeTime = 60000; // 60 seconds (30 + 30)
    const redTime = 120000; // 120 seconds (60 + 60)

    const timers: NodeJS.Timeout[] = [];

    // Set timer for yellow status (30 seconds)
    if (elapsed < yellowTime) {
      const timer1 = setTimeout(() => {
        updateMessageStatus(message.id, 'pending');
      }, yellowTime - elapsed);
      timers.push(timer1);
    } else if (elapsed < orangeTime && !message.status) {
      // Already past yellow time, set to yellow immediately
      updateMessageStatus(message.id, 'pending');
    }

    // Set timer for orange status (60 seconds)
    if (elapsed < orangeTime) {
      const timer2 = setTimeout(() => {
        updateMessageStatus(message.id, 'urgent');
      }, orangeTime - elapsed);
      timers.push(timer2);
    } else if (elapsed < redTime && message.status !== 'urgent') {
      // Already past orange time, set to orange immediately
      updateMessageStatus(message.id, 'urgent');
    }

    // Set timer for red status (120 seconds) - mark as unanswered
    if (elapsed < redTime) {
      const timer3 = setTimeout(() => {
        updateMessageStatus(message.id, 'unanswered', { 
          isUnanswered: true,
          unansweredAt: new Date().toISOString()
        });
        // Clear timers after marking as unanswered
        clearMessageTimers(message.id);
      }, redTime - elapsed);
      timers.push(timer3);
    } else if (!message.isUnanswered) {
      // Already past red time, mark as unanswered immediately
      updateMessageStatus(message.id, 'unanswered', { 
        isUnanswered: true,
        unansweredAt: new Date().toISOString()
      });
    }

    // Store timers for cleanup
    setMessageTimers(prev => ({
      ...prev,
      [message.id]: timers
    }));
  };

  const clearMessageTimers = (messageId: string) => {
    if (messageTimers[messageId]) {
      messageTimers[messageId].forEach(timer => clearTimeout(timer));
      setMessageTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[messageId];
        return newTimers;
      });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !countryCode || !category) return;

    // Check if consultant is trying to send a message without replying
    if (isConsultant && !replyingTo) {
      return; // Prevent sending message
    }

    // Check guest message limit
    if (currentUser.isGuest) {
      const messageCount = currentUser.messageCount || 0;
      if (messageCount >= 5) {
        setShowGuestLimitModal(true);
        return;
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
    const roomType = category === 'visa' ? 'visa' : 'general';

    const message: Omit<Message, 'id'> = {
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderType: currentUser.userType,
      content: newMessage.trim(),
      timestamp: now.toISOString(),
      country: countryCode,
      category: category as 'study' | 'travel' | 'visa',
      roomType: roomType,
      expiresAt: expiresAt.toISOString(),
      ...(replyingTo && {
        replyTo: {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          content: replyingTo.content.length > 50
            ? replyingTo.content.substring(0, 50) + '...'
            : replyingTo.content
        }
      })
    };

    try {
      const messageRef = await push(ref(database, `messages/${countryCode}/${category}/${roomType}`), message);
      
      // If this is a consultant reply to a question
      if (isConsultant && replyingTo && isQuestion(replyingTo.content)) {
        const originalMessageRef = ref(database, `messages/${countryCode}/${category}/${roomType}/${replyingTo.id}`);
        
        // Only mark as answered if the question hasn't been marked as unanswered
        if (!replyingTo.isUnanswered) {
          await update(originalMessageRef, { 
            hasConsultantReply: true,
            status: 'answered',
            answeredAt: now.toISOString(),
            answeredBy: currentUser.uid
          });
          
          // Clear all timers for the original message
          clearMessageTimers(replyingTo.id);
        } else {
          // If already marked as unanswered, just add the reply info but keep it as unanswered
          await update(originalMessageRef, { 
            hasConsultantReply: true,
            repliedAfterUnanswered: true,
            lateReplyAt: now.toISOString(),
            lateReplyBy: currentUser.uid
          });
        }
      }

      // If this is a new question from a non-consultant, set up timer
      if (isQuestion(newMessage.trim()) && !isConsultant) {
        const newMessageData = { ...message, id: messageRef.key! };
        // Small delay to ensure the message is in the database before setting up timer
        setTimeout(() => {
          setupMessageTimer(newMessageData);
        }, 100);
      }

      if (currentUser.isGuest) {
        await incrementGuestMessageCount();
        
        // Check if this was the last message for guest
        const updatedMessageCount = (currentUser.messageCount || 0) + 1;
        if (updatedMessageCount >= 5) {
          setShowGuestLimitModal(true);
        }
      }

      setNewMessage('');
      setReplyingTo(null);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMessageClick = (message: Message) => {
    if (selectedMessage === message.id) {
      setSelectedMessage(null);
    } else {
      setSelectedMessage(message.id);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setSelectedMessage(null);
    // Focus on input field
    const inputField = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputField) {
      inputField.focus();
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      // Scroll to the message
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight the message
      setHighlightedMessage(messageId);
    }
  };

  const handleReplyClick = (replyToId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    scrollToMessage(replyToId);
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'consultant':
        return <Crown className="h-4 w-4 text-purple-400" />;
      case 'resident':
        return <Globe className="h-4 w-4 text-green-400" />;
      case 'guest':
        return <Users className="h-4 w-4 text-orange-400" />;
      default:
        return null;
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

  const getMessageStatusColor = (message: Message) => {
    if (!isQuestion(message.content)) {
      return '';
    }

    // If message is marked as unanswered, always show red
    if (message.isUnanswered) {
      return 'bg-red-500/30 border-red-400/50 shadow-red-500/20';
    }

    // If message has consultant reply and wasn't marked as unanswered, no special color
    if (message.hasConsultantReply && !message.isUnanswered) {
      return '';
    }

    // Check current status for pending questions
    switch (message.status) {
      case 'pending':
        return 'bg-yellow-500/30 border-yellow-400/50 shadow-yellow-500/20';
      case 'urgent':
        return 'bg-orange-500/30 border-orange-400/50 shadow-orange-500/20';
      case 'unanswered':
        return 'bg-red-500/30 border-red-400/50 shadow-red-500/20';
      default:
        return '';
    }
  };

  const getCategoryInfo = () => {
    if (category === 'study') {
      return {
        title: 'Study Abroad Chat',
        icon: '🎓',
        description: country?.studyDescription || country?.description,
        gradient: 'from-blue-500 via-blue-600 to-indigo-600'
      };
    } else if (category === 'travel') {
      return {
        title: 'Travel Chat',
        icon: '✈️',
        description: country?.travelDescription || country?.description,
        gradient: 'from-green-500 via-emerald-600 to-teal-600'
      };
    } else {
      return {
        title: 'Visa Guidance Chat',
        icon: '📋',
        description: country?.visaDescription || 'Expert visa guidance and immigration support',
        gradient: 'from-purple-500 via-purple-600 to-pink-600'
      };
    }
  };

  // Check if message is from current user
  const isOwnMessage = (message: Message) => {
    return message.senderId === currentUser?.uid;
  };

  // Get input placeholder text based on user type and reply status
  const getInputPlaceholder = () => {
    if (isConsultant) {
      if (replyingTo) {
        return 'Reply to message...';
      } else {
        return 'Select a message to reply to as an Industry Expert...';
      }
    }
    return replyingTo ? 'Reply to message...' : `Type your message in ${getCategoryInfo().title.toLowerCase()}...`;
  };

  // Check if input should be disabled
  const isInputDisabled = () => {
    if (currentUser?.isGuest && (currentUser.messageCount || 0) >= 5) {
      return true;
    }
    if (isConsultant && !replyingTo) {
      return true;
    }
    return false;
  };

  // Check if send button should be disabled
  const isSendDisabled = () => {
    if (!newMessage.trim()) return true;
    if (currentUser?.isGuest && (currentUser.messageCount || 0) >= 5) return true;
    if (isConsultant && !replyingTo) return true;
    return false;
  };

  if (!country) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-2xl font-bold text-white mb-4">Country not found</h1>
          <button
            onClick={() => navigate('/categories')}
            className="text-blue-300 hover:text-white transition-colors duration-200"
          >
            Back to categories
          </button>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo();
  const guestMessageCount = currentUser?.messageCount || 0;
  const remainingMessages = currentUser?.isGuest ? Math.max(0, 5 - guestMessageCount) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <Navbar />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Industry Expert Info Banner */}
        {isConsultant && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-300/30 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-purple-300 mr-3" />
              <p className="text-sm text-purple-100">
                <span className="font-bold text-purple-200">Industry Expert Mode:</span> You can only send messages by replying to other users' messages. 
                Select a message and click the reply button to provide your expert guidance.
              </p>
            </div>
          </div>
        )}

        {/* Guest Message Limit Warning */}
        {currentUser?.isGuest && remainingMessages !== null && remainingMessages <= 2 && (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-orange-300/30 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-300 mr-3" />
              <p className="text-sm text-orange-100">
                You have <span className="font-bold text-orange-200">{remainingMessages}</span> message{remainingMessages !== 1 ? 's' : ''} remaining as a guest.
                <button
                  onClick={() => navigate('/')}
                  className="ml-2 font-medium text-orange-200 underline hover:no-underline transition-all duration-200"
                >
                  Sign up for unlimited messaging
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Chat Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 mb-6">
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200 text-white/70 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-white flex items-center space-x-3">
                      <span>{country.name}</span>
                      <span className="text-2xl">{categoryInfo.icon}</span>
                      <span className="text-lg text-blue-200">- {categoryInfo.title}</span>
                    </h1>
                    <p className="text-sm text-blue-200">{categoryInfo.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-blue-200 bg-white/10 rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <Users className="h-4 w-4" />
                  <span>{onlineUsers.length} online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-black/10">
            {messages.length === 0 ? (
              <div className="text-center text-blue-200 py-12">
                <div className="text-6xl mb-6">
                  {categoryInfo.icon}
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                  <p className="text-xl font-medium mb-3 text-white">
                    Start the conversation!
                  </p>
                  <p className="text-sm text-blue-200">
                    {category === 'visa'
                      ? 'Get expert guidance on visa requirements, application processes, and documentation for ' + country.name
                      : category === 'study'
                      ? 'Share experiences, ask questions, and connect with others interested in studying in ' + country.name
                      : 'Share experiences, ask questions, and connect with others interested in ' + country.name
                    }
                  </p>
                  {isConsultant && (
                    <p className="text-xs text-purple-200 mt-3 italic">
                      As an Industry Expert, wait for users to post questions and provide your expert guidance by replying to their messages.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = isOwnMessage(message);
                const isHighlighted = highlightedMessage === message.id;
                const statusColor = getMessageStatusColor(message);
                const isQuestionMessage = isQuestion(message.content);
                const showUnansweredIcon = isQuestionMessage && message.isUnanswered;
                
                return (
                  <div
                    key={message.id}
                    ref={(el) => messageRefs.current[message.id] = el}
                    className={`message-container relative group transition-all duration-500 ${
                      selectedMessage === message.id ? 'bg-white/5 rounded-xl p-2' : ''
                    } ${
                      isHighlighted ? 'bg-yellow-500/20 rounded-xl p-2 animate-pulse' : ''
                    } ${isOwn ? 'flex justify-end' : 'flex justify-start'}`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start space-x-3 cursor-pointer ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* Avatar - only show for other users' messages */}
                        {!isOwn && (
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full ${getUserTypeColor(message.senderType)} flex items-center justify-center shadow-lg`}>
                              {getUserTypeIcon(message.senderType) || (
                                <span className="text-sm font-medium">
                                  {message.senderName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Message header - only show for other users' messages */}
                          {!isOwn && (
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-white">
                                {message.senderName}
                              </span>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${getUserTypeColor(message.senderType)}`}>
                                {getUserTypeDisplayName(message.senderType)}
                              </span>
                            </div>
                          )}

                          {/* Reply indicator */}
                          {message.replyTo && (
                            <div 
                              className={`bg-white/10 border-l-4 border-blue-400 pl-4 py-2 mb-3 rounded-r-lg backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-all duration-200 ${isOwn ? 'border-r-4 border-l-0 pr-4 pl-0 rounded-l-lg rounded-r-none' : ''}`}
                              onClick={(e) => handleReplyClick(message.replyTo!.id, e)}
                            >
                              <div className="flex items-center space-x-1 mb-1">
                                <Reply className="h-3 w-3 text-blue-400" />
                                <span className="text-xs font-medium text-blue-300">
                                  Replying to {message.replyTo.senderName}
                                </span>
                              </div>
                              <p className="text-xs text-blue-200 italic">
                                {message.replyTo.content}
                              </p>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div className={`backdrop-blur-sm rounded-xl p-4 relative border transition-all duration-300 ${statusColor} ${isOwn
                            ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-white rounded-br-md border-blue-400/30'
                            : 'bg-white/10 text-white rounded-bl-md border-white/20'
                            }`}>
                            {/* Unanswered question indicator */}
                            {showUnansweredIcon && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                <AlertTriangle className="h-3 w-3 text-white" />
                              </div>
                            )}
                            
                            <p className="text-sm leading-relaxed">
                              {message.content}
                            </p>

                            {/* Message timestamp and status */}
                            <div className={`flex items-center space-x-2 mt-2 text-xs ${isOwn ? 'justify-end text-blue-100' : 'justify-start text-blue-300'}`}>
                              <span>
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                              <span className="flex items-center">
                                <Sparkles className="h-3 w-3 mr-1" />
                                {Math.ceil((new Date(message.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))}h
                              </span>
                              {isQuestionMessage && (
                                <span className={`text-xs font-medium ${
                                  message.isUnanswered ? 'text-red-300' :
                                  message.hasConsultantReply ? 'text-green-300' :
                                  message.status === 'pending' ? 'text-yellow-300' :
                                  message.status === 'urgent' ? 'text-orange-300' :
                                  'text-blue-300'
                                }`}>
                                  {message.isUnanswered ? 'Unanswered' :
                                   message.hasConsultantReply ? 'Answered' :
                                   message.status === 'pending' ? 'Pending reply' :
                                   message.status === 'urgent' ? 'Urgent' :
                                   'Awaiting reply'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Reply button - shows when message is selected */}
                        {(selectedMessage === message.id) && (
                          <div className={`flex-shrink-0 ${isOwn ? 'order-1' : 'order-3'}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReply(message);
                              }}
                              className="p-2 text-blue-300 hover:bg-white/10 rounded-full transition-all duration-200 hover:text-white"
                              title="Reply to this message"
                            >
                              <Reply className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Preview */}
          {replyingTo && (
            <div className="px-6 py-4 bg-blue-500/20 border-t border-blue-400/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Reply className="h-4 w-4 text-blue-300" />
                  <span className="text-sm font-medium text-blue-200">
                    Replying to {replyingTo.senderName}
                  </span>
                  {isConsultant && (
                    <span className="text-xs text-purple-200 bg-purple-500/20 px-2 py-1 rounded-full">
                      Industry Expert Reply
                    </span>
                  )}
                </div>
                <button
                  onClick={cancelReply}
                  className="p-1 text-blue-300 hover:bg-white/10 rounded transition-all duration-200 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-blue-100 mt-2 italic bg-white/10 rounded-lg p-2">
                {replyingTo.content.length > 100
                  ? replyingTo.content.substring(0, 100) + '...'
                  : replyingTo.content}
              </p>
            </div>
          )}

          {/* Message Input */}
          <div className="px-6 py-4 border-t border-white/10">
            <form onSubmit={sendMessage} className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={getInputPlaceholder()}
                className={`flex-1 px-4 py-3 backdrop-blur-sm border rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 ${
                  isInputDisabled() 
                    ? 'bg-white/5 border-white/10 cursor-not-allowed' 
                    : 'bg-white/10 border-white/20'
                }`}
                disabled={isInputDisabled()}
              />
              <button
                type="submit"
                disabled={isSendDisabled()}
                className={`px-6 py-3 bg-gradient-to-r ${categoryInfo.gradient} text-white rounded-xl hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 transform hover:scale-105`}
              >
                <Send className="h-4 w-4" />
                <span>{replyingTo ? 'Reply' : 'Send'}</span>
              </button>
            </form>
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-blue-300 flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                Messages automatically expire after 48 hours to keep conversations fresh and relevant
                {replyingTo && ' • Click the X above to cancel reply'}
                {isConsultant && !replyingTo && ' • Select a message to reply to as an Industry Expert'}
              </p>
              {currentUser?.isGuest && (
                <p className="text-xs text-orange-300 font-medium">
                  {remainingMessages} message{remainingMessages !== 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Online Users Sidebar */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Online Users ({onlineUsers.length})
          </h3>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {onlineUsers.map((user) => (
              <div key={user.uid} className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                <div className={`w-8 h-8 rounded-full ${getUserTypeColor(user.userType)} flex items-center justify-center shadow-lg`}>
                  {getUserTypeIcon(user.userType) || (
                    <span className="text-xs font-medium">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-white font-medium truncate block">{user.displayName}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getUserTypeColor(user.userType)}`}>
                    {getUserTypeDisplayName(user.userType)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guest Limit Modal */}
      {showGuestLimitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
            </div>
            <div className="inline-block align-bottom bg-white/10 backdrop-blur-md rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20">
              <div className="px-6 py-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-500/20 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-white">
                      Guest Message Limit Reached
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-blue-200">
                        You've reached the 5-message limit for guest users. Sign up for a free account to continue chatting with unlimited messages and access all features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-medium text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                >
                  Sign Up Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuestLimitModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-white/20 shadow-sm px-6 py-3 bg-white/10 text-base font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;