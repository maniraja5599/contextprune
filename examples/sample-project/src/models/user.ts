export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
}

export interface UserSession {
  token: string;
  userId: string;
  expiresAt: number;
}
