import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { customFetch } from '@workspace/api-client-react';

interface User {
  email: string;
  role: 'student' | 'admin';
  name: string;
  license: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('zainco_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('zainco_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await customFetch<{ access_token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      const { access_token, user: newUser } = response;
      
      setUser(newUser);
      localStorage.setItem('zainco_user', JSON.stringify(newUser));
      localStorage.setItem('token', access_token);
      
      setLocation(newUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      console.error("Login failed", err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('zainco_user');
    localStorage.removeItem('token');
    setLocation('/login');
    // Optional: actually hit /api/auth/logout if needed
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center font-display text-primary">Loading Zainco International...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
