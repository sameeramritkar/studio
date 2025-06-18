'use client';

import type { User, UserRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  login: (username: string, role: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('scrumPointUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('scrumPointUser');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((username: string, role: UserRole) => {
    const newUser: User = { id: crypto.randomUUID(), username, role };
    setUser(newUser);
    localStorage.setItem('scrumPointUser', JSON.stringify(newUser));
    router.push('/poker');
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('scrumPointUser');
    localStorage.removeItem('pokerSessionState'); // Also clear poker session state
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
