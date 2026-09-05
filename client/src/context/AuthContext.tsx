import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Business } from '../types';
import { api } from '../services/api';

interface AuthContextValue {
  user: User | null;
  business: Business | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, pass: string, businessName: string, desc?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateBusiness: (name: string, description?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.auth.me();
        if (res.success && res.data) {
          setUser(res.data.user);
          setBusiness(res.data.business);
        } else {
          setUser(null);
          setBusiness(null);
        }
      } catch (err) {
        console.error('Failed checking auth', err);
        setUser(null);
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login(email, pass);
    if (res.success && res.data) {
      setUser(res.data.user);
      setBusiness(res.data.business);
      return { success: true };
    }
    return { success: false, message: res.error?.message || 'Login gagal.' };
  };

  const register = async (email: string, pass: string, businessName: string, desc?: string) => {
    const res = await api.auth.register(email, pass, businessName, desc);
    if (res.success && res.data) {
      setUser(res.data.user);
      setBusiness(res.data.business);
      return { success: true };
    }
    return { success: false, message: res.error?.message || 'Registrasi gagal.' };
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
    setBusiness(null);
  };

  const updateBusiness = async (name: string, description?: string) => {
    const res = await api.business.update(name, description);
    if (res.success && res.data) {
      setBusiness(res.data);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
