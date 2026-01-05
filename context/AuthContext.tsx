import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  phoneNumber: string;
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (phoneNumber: string) => void;
  updateProfile: (name: string, email: string) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = (phoneNumber: string) => {
    // Mock login logic. In a real app, we would verify the token here.
    // Check if we have a "stored" user for this phone (mock persistence in memory?)
    // For now, just set the user with the phone number.
    setUser({ phoneNumber });
  };

  const updateProfile = (name: string, email: string) => {
    if (user) {
      setUser({ ...user, name, email });
    }
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, updateProfile, signOut, isAuthenticated: !!user }}>
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
