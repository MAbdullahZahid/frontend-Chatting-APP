// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Swal from "sweetalert2";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketId, setSocketId] = useState(null);
  const socketRef = useRef(null);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const logout = (showAlert = false) => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("tokenExpiration");
    setIsAuthenticated(false);
    setUserId(null);

    // Disconnect socket when logging out
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (showAlert) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please login again.",
        confirmButtonText: "OK"
      });
    }
  };

  const login = (token, id) => {
    const expirationTime = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
    localStorage.setItem("authToken", token);
    localStorage.setItem("userId", id);
    localStorage.setItem("tokenExpiration", expirationTime);
    setIsAuthenticated(true);
    setUserId(id);
    setJustLoggedIn(true); 
  };

  // Check on app load
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const expiry = localStorage.getItem("tokenExpiration");
    const id = localStorage.getItem("userId");

    if (token && expiry && Date.now() < Number(expiry)) {
      setIsAuthenticated(true);
      setUserId(id);
    } else {
      logout(false);
    }
    setLoading(false);
  }, []);

  // Auto logout at expiry
  useEffect(() => {
    const expiry = localStorage.getItem("tokenExpiration");
    if (!isAuthenticated || !expiry) return;

    const expiryTime = Number(expiry);
    const now = Date.now();

    if (now >= expiryTime) {
      logout(true);
      return;
    }

    const timeout = setTimeout(() => {
      logout(true);
    }, expiryTime - now);

    return () => clearTimeout(timeout);
  }, [isAuthenticated]);

  // Connect to WebSocket when logged in
useEffect(() => {
  if (isAuthenticated && userId) {
    socketRef.current = io("http://localhost:5000");

    const socket = socketRef.current;

    const handleBroadcast = (data) => {
      if (!justLoggedIn) return; 

      if (!("Notification" in window)) return;

      if (Notification.permission === "granted") {
        new Notification("User Joined", { body: data.message });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("User Joined", { body: data.message });
          }
        });
      }

      setJustLoggedIn(false); // reset after first notification
    };

    socket.on("connect", () => {
      setSocketId(socket.id);
      console.log("🔌 Connected to WebSocket:", socket.id);
      socket.emit("userJoined", userId);
    });

    socket.on("broadcast", handleBroadcast);

    return () => {
      socket.off("broadcast", handleBroadcast);
      socket.disconnect();
      socketRef.current = null;
    };
  }
}, [isAuthenticated, userId, justLoggedIn]);


  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, socketId ,login, logout, loading,
      socket: socketRef.current,
     }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
