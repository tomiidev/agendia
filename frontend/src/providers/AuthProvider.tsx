'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import apiFetch from '../lib/api/client';

interface AuthContextType {
  user: any | null;
  activeBusiness: any | null;
  memberships: any[];
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (registrationData: any) => Promise<void>;
  logout: () => Promise<void>;
  selectBusiness: (businessId: string) => void;
  activeProfessional: any | null;
  setActiveProfessional: (prof: any | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<any | null>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [activeProfessional, setActiveProfessionalState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname() || '';

  // Synchronize state from localStorage
  const loadAuthState = () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedBiz = localStorage.getItem('activeBusiness');
      const storedMemberships = localStorage.getItem('memberships');
      const storedProf = localStorage.getItem('activeProfessional');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        if (storedBiz) setActiveBusiness(JSON.parse(storedBiz));
        if (storedMemberships) setMemberships(JSON.parse(storedMemberships));
        if (storedProf) setActiveProfessionalState(JSON.parse(storedProf));
      } else {
        setUser(null);
        setActiveBusiness(null);
        setMemberships([]);
        setActiveProfessionalState(null);
      }
    } catch (e) {
      console.error('Failed parsing auth storage:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthState();

    // Listen to custom api-client logout/unauthorized events
    const handleAuthChanged = () => {
      loadAuthState();
    };

    window.addEventListener('auth-changed', handleAuthChanged);
    return () => window.removeEventListener('auth-changed', handleAuthChanged);
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('memberships', JSON.stringify(data.memberships));

      setUser(data.user);
      setMemberships(data.memberships);

      // Select first business as default if present
      if (data.memberships && data.memberships.length > 0) {
        const firstBiz = data.memberships[0].business;
        localStorage.setItem('activeBusinessId', firstBiz.id);
        localStorage.setItem('activeBusiness', JSON.stringify(firstBiz));
        setActiveBusiness(firstBiz);
        router.push('/dashboard');
      } else {
        // Go to onboarding
        router.push('/onboarding');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (registrationData: any) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registrationData),
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('memberships', JSON.stringify(data.memberships));

      setUser(data.user);
      setMemberships(data.memberships);

      if (data.memberships && data.memberships.length > 0) {
        const firstBiz = data.memberships[0].business;
        localStorage.setItem('activeBusinessId', firstBiz.id);
        localStorage.setItem('activeBusiness', JSON.stringify(firstBiz));
        setActiveBusiness(firstBiz);
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const setActiveProfessional = (prof: any | null) => {
    setActiveProfessionalState(prof);
    if (prof) {
      localStorage.setItem('activeProfessional', JSON.stringify(prof));
    } else {
      localStorage.removeItem('activeProfessional');
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error logging out from server:', error);
    } finally {
      // Clear all auth-related local storage items
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('memberships');
      localStorage.removeItem('activeBusinessId');
      localStorage.removeItem('activeBusiness');
      localStorage.removeItem('activeProfessional');

      // Clear the cookie client-side as well
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Reset state variables
      setUser(null);
      setActiveBusiness(null);
      setMemberships([]);
      setActiveProfessionalState(null);

      // Redirect to login page
      router.push('/login');
    }
  };

  const selectBusiness = (businessId: string) => {
    const membership = memberships.find(m => m.business.id === businessId);
    if (membership) {
      localStorage.setItem('activeBusinessId', businessId);
      localStorage.setItem('activeBusiness', JSON.stringify(membership.business));
      localStorage.removeItem('activeProfessional');
      setActiveBusiness(membership.business);
      setActiveProfessionalState(null);
      // Reload stats and charts by performing a soft reload or window location
      router.push('/dashboard');
    }
  };

  // Auth routing locks
  useEffect(() => {
    if (loading) return;
    
    // Check if we are in the client area
    const isClientDashboard = pathname.startsWith('/client-dashboard');
    
    // If in client area, do not apply SaaS internal routing locks
    if (isClientDashboard) {
      return; 
    }

    const publicRoutes = ['/login', '/register', '/book'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
      router.push('/dashboard');
    }
  }, [user, pathname, loading, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        activeBusiness,
        memberships,
        loading,
        login,
        register,
        logout,
        selectBusiness,
        activeProfessional,
        setActiveProfessional,
      }}
    >
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
