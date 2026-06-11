import React, { createContext, useState, useEffect } from "react";
import apiService from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("quote_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (user) => {
    setCurrentUser(user);
    localStorage.setItem("quote_user", JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("quote_user");
  };

  const switchRole = async (role) => {
    try {
      const response = await apiService.getUsers();
      const users = response.data;
      const userWithRole = users.find((u) => u.role === role);
      if (userWithRole) {
        login(userWithRole);
      }
    } catch (err) {
      console.error("Error switching role:", err);
    }
  };

  const register = async (name, email, password, proposedRole) => {
    const response = await apiService.registerUser(name, email, password, proposedRole);
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        logout,
        switchRole,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
