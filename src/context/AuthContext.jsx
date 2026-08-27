import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_ACCOUNTS } from '../utils/seedData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('mineguard_auth_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validUser = DEMO_ACCOUNTS.find(
          acc => acc.userId === parsed?.userId || acc.badge === parsed?.badge || acc.email === parsed?.email
        );
        if (validUser) return validUser;
      } catch (e) {
        /* invalid JSON */
      }
      localStorage.removeItem('mineguard_auth_user');
    }
    // CRITICAL: Fresh launch MUST default to null (LOGIN FIRST)
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mineguard_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mineguard_auth_user');
    }
  }, [currentUser]);

  const login = (inputIdentifier, password) => {
    if (!inputIdentifier || !password) {
      return { success: false, message: 'Please enter both login ID/email and password.' };
    }

    const cleanId = inputIdentifier.trim().toLowerCase();
    const cleanPass = password.trim();

    const found = DEMO_ACCOUNTS.find(acc => {
      const matchId = (acc.userId && acc.userId.toLowerCase() === cleanId) ||
                      (acc.email && acc.email.toLowerCase() === cleanId) ||
                      (acc.badge && acc.badge.toLowerCase() === cleanId);
      const matchPass = acc.password === cleanPass;
      return matchId && matchPass;
    });

    if (found) {
      setCurrentUser(found);
      return { success: true, user: found };
    }

    return { success: false, message: 'Invalid credentials. Check user ID / email and password.' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mineguard_auth_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
