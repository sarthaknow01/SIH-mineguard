import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_ACCOUNTS } from '../utils/seedData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('mineguard_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    // Default to Inspector on fresh load
    return DEMO_ACCOUNTS[0];
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mineguard_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mineguard_auth_user');
    }
  }, [currentUser]);

  const login = (userId, password) => {
    const found = DEMO_ACCOUNTS.find(
      acc => acc.userId.toLowerCase() === userId.trim().toLowerCase() && acc.password === password
    );
    if (found) {
      setCurrentUser(found);
      return { success: true, user: found };
    }
    return { success: false, message: 'Invalid credentials. Use one of the demo accounts.' };
  };

  const switchRole = (roleKey) => {
    const found = DEMO_ACCOUNTS.find(acc => acc.role === roleKey);
    if (found) {
      setCurrentUser(found);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
