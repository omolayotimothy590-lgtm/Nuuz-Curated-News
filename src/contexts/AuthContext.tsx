import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: (credential: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async (currentUser: User) => {
    try {
      const updatedUser = await authService.refreshUserData(currentUser.id);
      setUser(updatedUser);
      localStorage.setItem('nuuz_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return currentUser;
    }
  };

  const refreshUser = async () => {
    if (user) {
      await refreshUserData(user);
    }
  };

  useEffect(() => {
    // Try to restore user from localStorage
    const savedUser = localStorage.getItem('nuuz_user');

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('✅ Restored user from localStorage:', userData.email);
        setUser(userData);
        // Refresh user data in background
        refreshUserData(userData);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('nuuz_user');
      }
    }

    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const user = await authService.signIn(email, password);
      setUser(user);
      localStorage.setItem('nuuz_user', JSON.stringify(user));
      console.log('✅ Sign in successful:', user.email);
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const user = await authService.signUp(email, password, fullName);
      setUser(user);
      localStorage.setItem('nuuz_user', JSON.stringify(user));
      console.log('✅ Sign up successful:', user.email);
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (credential: string) => {
    try {
      console.log('🔐 [AuthContext] Processing Google Sign-In...');
      console.log('🔐 [AuthContext] Credential length:', credential.length);
      
      const user = await authService.signInWithGoogle(credential);
      
      console.log('✅ [AuthContext] User data received from authService:', user.email);
      
      // Update React state first
      setUser(user);
      console.log('✅ [AuthContext] React state updated');
      
      // Then persist to localStorage
      localStorage.setItem('nuuz_user', JSON.stringify(user));
      console.log('✅ [AuthContext] User saved to localStorage');
      
      // Verify persistence
      const saved = localStorage.getItem('nuuz_user');
      if (saved) {
        console.log('✅ [AuthContext] Verified: User data persisted in localStorage');
      } else {
        console.error('❌ [AuthContext] WARNING: Failed to verify localStorage persistence');
      }
      
      console.log('✅ [AuthContext] Google Sign-In successful:', user.email);
    } catch (error) {
      console.error('❌ [AuthContext] Google Sign-In failed:', error);
      console.error('❌ [AuthContext] Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  };
  
  // Expose signInWithGoogle globally for Android native sign-in
  useEffect(() => {
    (window as any).signInWithGoogle = signInWithGoogle;
    console.log('✅ [AuthContext] Exposed signInWithGoogle globally for Android bridge');
    
    return () => {
      delete (window as any).signInWithGoogle;
    };
  }, [signInWithGoogle]);

  const signOut = async () => {
    console.log('👋 Signing out...');

    // Clear localStorage
    localStorage.removeItem('nuuz_user');

    // Clear state
    setUser(null);

    // Disable Google auto-select if available
    if (window.google) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {
        console.warn('Could not disable Google auto-select:', e);
      }
    }

    console.log('✅ Sign out complete');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
