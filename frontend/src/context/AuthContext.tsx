import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  profileImage?: string;
  bio?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  preferredGender?: 'Men' | 'Women' | 'Everyone';
  isCollegeStudent?: boolean;
  institutionName?: string;
  preferredCommunity?: 'EVERYONE' | 'COLLEGE_STUDENTS';
  role: 'USER' | 'ADMIN';
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'AI_BLOCKED' | 'BANNED';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for token on mount
    const storedToken = localStorage.getItem('vibe_token');
    const storedUser = localStorage.getItem('vibe_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage');
        localStorage.removeItem('vibe_token');
        localStorage.removeItem('vibe_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('vibe_token', newToken);
    localStorage.setItem('vibe_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vibe_token');
    localStorage.removeItem('vibe_user');
  };

  useEffect(() => {
    let timeoutId: number;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      if (token) {
        timeoutId = window.setTimeout(() => {
          logout();
        }, 10 * 60 * 1000); // 10 minutes
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimeout));

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimeout));
    };
  }, [token]);

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('vibe_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
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
