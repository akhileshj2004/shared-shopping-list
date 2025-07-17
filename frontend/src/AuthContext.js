import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';

const AuthContext = createContext(null);

// Use the environment variable set by Docker Compose, fallback to localhost for local dev
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores { id, username }
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [socket, setSocket] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // To indicate initial auth check

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Verify token with backend
          const response = await fetch(`${BACKEND_URL}/api/user/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token invalid or expired, clear it
            console.error('Token validation failed:', response.status);
            localStorage.removeItem('accessToken');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('accessToken');
          setToken(null);
          setUser(null);
        }
      }
      setAuthLoading(false);
    };

    initializeAuth();
  }, [token]); // Re-run if token changes

  useEffect(() => {
    if (user && token) {
      // Connect Socket.IO with the token
      const newSocket = io(BACKEND_URL, {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        if (error.message.includes('Authentication error')) {
          // If token is invalid/expired, log out
          logout();
        }
      });

      newSocket.on('error', (message) => {
        console.error('Socket error from server:', message);
        // You might want to display this error to the user
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    } else if (!user && socket) {
      // If user logs out, disconnect socket
      socket.disconnect();
      setSocket(null);
    }
  }, [user, token]); // Re-run if user or token changes

  const login = (newToken, userData) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    if (socket) {
      socket.disconnect();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, socket, login, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
