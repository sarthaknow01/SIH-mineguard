import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_ACCOUNTS } from '../utils/seedData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // CRITICAL REQUIREMENT: Application start / load MUST ALWAYS default to null (LOGIN PAGE FIRST)
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Clear any previous persisted session on fresh launch to guarantee login screen first
    localStorage.removeItem('mineguard_auth_user');
  }, []);

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
