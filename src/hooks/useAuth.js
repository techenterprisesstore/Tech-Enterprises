import { useState, useEffect } from 'react';
import { onAuthChange, getUserProfile } from '../services/authService';
import { auth } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase auth is not configured, set loading to false immediately
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profileResult = await getUserProfile(firebaseUser.uid);
        if (profileResult.success) {
          setProfile(profileResult.profile);
        } else {
          // If profile fetch fails, still set user but no profile
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const refetchProfile = async () => {
    if (!user?.uid) return;
    const res = await getUserProfile(user.uid);
    if (res.success) setProfile(res.profile);
  };

  return { user, profile, loading, isAdmin: profile?.role === 'admin', refetchProfile };
};
