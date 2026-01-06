import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  phoneNumber: string;
  name?: string;
  referralCode?: string;
  userType: 'consumer' | 'business';
  hasBusinessAccount: boolean;
}

interface AuthContextType {
  user: User | null;
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  signUp: (phoneNumber: string, password: string, userType: 'consumer' | 'business') => Promise<void>;
  updateProfile: (name: string, referralCode?: string) => Promise<void>;
  registerBusiness: () => Promise<void>;
  switchUserType: () => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedPhone = await AsyncStorage.getItem('user_phone');
        if (storedPhone) {
          setPhoneNumber(storedPhone);
        }
      } catch (e) {
        console.error('Failed to load auth', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const convexUser = useQuery(api.users.getUser, phoneNumber ? { phoneNumber } : "skip");
  const signUpMutation = useMutation(api.users.signUp);
  const signInMutation = useMutation(api.users.signIn);
  const updateUserMutation = useMutation(api.users.updateUser);

  const signIn = async (phone: string, password: string) => {
    try {
      await signInMutation({ phoneNumber: phone, password });
      setPhoneNumber(phone);
      await AsyncStorage.setItem('user_phone', phone);
    } catch (e) {
      console.error("Sign in failed:", e);
      throw e;
    }
  };

  const signUp = async (phone: string, password: string, userType: 'consumer' | 'business') => {
    try {
      await signUpMutation({ phoneNumber: phone, password, userType });
      setPhoneNumber(phone);
      await AsyncStorage.setItem('user_phone', phone);
    } catch (e) {
      console.error("Sign up failed:", e);
      throw e;
    }
  };

  const updateProfile = async (name: string, referralCode?: string) => {
    if (convexUser) {
      await updateUserMutation({ id: convexUser._id, name, referralCode });
    }
  };

  const registerBusiness = async () => {
    if (convexUser) {
      await updateUserMutation({ 
        id: convexUser._id, 
        hasBusinessAccount: true, 
        userType: 'business'
      });
      router.replace('/business-profile');
    }
  };

  const switchUserType = async () => {
    if (convexUser && convexUser.hasBusinessAccount) {
      const newType = convexUser.userType === 'consumer' ? 'business' : 'consumer';
      try {
        await updateUserMutation({ id: convexUser._id, userType: newType });
        
        // Clear navigation stack to prevent back-button confusion
        if (router.canGoBack()) {
          router.dismissAll();
        }

        // Small delay to ensure navigation state settles before replacing
        setTimeout(() => {
          if (newType === 'business') {
            router.replace('/business-profile');
          } else {
            router.replace('/(tabs)');
          }
        }, 100);
      } catch (e) {
        console.error("Failed to switch user type:", e);
      }
    }
  };

  const signOut = async () => {
    setPhoneNumber(null);
    await AsyncStorage.removeItem('user_phone');
    router.replace('/auth/landing');
  };

  const user: User | null = convexUser ? { ...convexUser, _id: convexUser._id } : null;

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, updateProfile, registerBusiness, switchUserType, signOut, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
