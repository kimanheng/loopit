import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  accountId: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  preferredLanguage: string;
  referralCode?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  signUp: (phoneNumber: string, password: string) => Promise<void>;
  updateProfile: (name: string, referralCode?: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

  const convexUser = useQuery(api.users.getUserByPhoneNumber, phoneNumber ? { phoneNumber } : "skip");
  const signUpMutation = useMutation(api.auth.signUp);
  const signInMutation = useMutation(api.auth.signIn);
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

  // Customer app always registers as customer
  const signUp = async (phone: string, password: string) => {
    try {
      await signUpMutation({ phoneNumber: phone, password, role: 'customer' });
      setPhoneNumber(phone);
      await AsyncStorage.setItem('user_phone', phone);
    } catch (e) {
      console.error("Sign up failed:", e);
      throw e;
    }
  };

  const updateProfile = async (name: string, referralCode?: string) => {
    if (convexUser) {
      await updateUserMutation({ 
        userId: convexUser._id, 
        name,
        referralCode
      });
    }
  };

  const signOut = async () => {
    setPhoneNumber(null);
    await AsyncStorage.removeItem('user_phone');
    router.replace('/auth/landing');
  };

  const user: User | null = convexUser ? { 
    _id: convexUser._id, 
    accountId: convexUser.accountId,
    phoneNumber: convexUser.phoneNumber,
    name: convexUser.name,
    email: convexUser.email,
    preferredLanguage: convexUser.preferredLanguage,
    referralCode: convexUser.referralCode
  } : null;

  // Calculate effective loading state
  // We are loading if:
  // 1. Initial async storage check is running (isLoading is true)
  // 2. We have a phone number but the query hasn't returned a result yet (convexUser is undefined)
  const isAuthLoading = isLoading || (!!phoneNumber && convexUser === undefined);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, updateProfile, signOut, isAuthenticated: !!user, isLoading: isAuthLoading }}>
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
