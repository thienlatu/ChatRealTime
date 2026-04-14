import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

interface AuthContextType {
  user: any; 
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Chốt chặn kim cương: Phải đảm bảo Root Layout đã Mount xong xuôi (có key)
    if (!rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === 'Login' || segments[0] === 'Regiter';
    
    if (!user && !inAuthGroup) {
      router.replace('/Login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, segments, rootNavigationState?.key]); // Theo dõi đúng cái key của Root

  const login = (userData: any) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);