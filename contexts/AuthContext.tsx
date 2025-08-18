import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { authService } from '@/services/endpoints/auth';
import { chatService } from '@/services/endpoints/chat';
import { presenceService } from '@/services/presence';
import { UserProfile } from '@/services/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
        // Initialize presence service
        presenceService.initialize(session.user.id, true);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
        // Initialize presence service
        await presenceService.initialize(session.user.id, true);
      } else {
        setProfile(null);
        // Cleanup presence service
        presenceService.cleanup();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await chatService.getUserProfile(userId);
      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await authService.signIn({ email, password });
    if (error) {
      setLoading(false);
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    setLoading(true);
    const { error } = await authService.signUp({ 
      email, 
      password, 
      full_name: fullName, 
      username 
    });
    if (error) {
      setLoading(false);
    }
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    // Cleanup presence service first
    presenceService.cleanup();
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await authService.resetPassword(email);
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    const { data, error } = await chatService.updateUserProfile(user.id, updates);
    if (!error && data) {
      setProfile(data);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}