import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { NguoiDungDto } from '../Type';

interface AuthContextType {
  user: NguoiDungDto | null; 
  login: (userData: NguoiDungDto) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NguoiDungDto | null>(null);
  const segments = useSegments();
  const router = useRouter();
  
  const navigationState = useRootNavigationState();
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !navigationState?.key) return;

    const inAuthGroup = segments[0] === 'Login' || segments[0] === 'Regiter';
    
    const timer = setTimeout(() => {
      if (!user && !inAuthGroup) {
        router.replace('/Login');
      } else if (user && inAuthGroup) {
        router.replace('/');
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [user, segments, isMounted, navigationState?.key]);

  const login = (userData: NguoiDungDto) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);