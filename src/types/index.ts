export interface User {
  uid: string;
  email: string;
  displayName: string;
  mobileNumber?: string;
  userType: 'user' | 'consultant' | 'resident' | 'guest';
  country?: string;
  reasonForJoining?: string;
  selectedCategory?: 'study' | 'travel' | 'visa';
  createdAt: string;
  messageCount?: number; // For guest users
  isGuest?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'consultant' | 'resident' | 'guest';
  content: string;
  timestamp: string;
  country: string;
  category: 'study' | 'travel' | 'visa';
  roomType: 'general' | 'visa';
  expiresAt: string;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  hasConsultantReply?: boolean;
  status?: 'pending' | 'urgent' | 'answered' | 'unanswered';
  isUnanswered?: boolean;
}

export interface Country {
  code: string;
  name: string;
  image: string;
  description: string;
  studyDescription: string;
  travelDescription: string;
  visaDescription?: string;
  popular: boolean;
}

export interface ConsultantCredential {
  id: string;
  email: string;
  password: string;
  name: string;
  specialization: string;
  isActive: boolean;
}

export interface RoomUser {
  uid: string;
  displayName: string;
  userType: string;
  joinedAt: string;
}