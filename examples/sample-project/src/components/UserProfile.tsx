import React, { useState, useEffect } from 'react';
import { User } from '../models/user.ts';

export interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading user profile...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="profile-card">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <span className="badge">{user.subscriptionTier}</span>
    </div>
  );
};
