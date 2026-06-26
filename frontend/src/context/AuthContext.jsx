import { useState, useEffect } from "react";
import apiService, { normalizeStoredUser } from "../services/api";
import { AuthContext } from "./auth-context";

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapSession = async () => {
      const storedUser = localStorage.getItem("quote_user");

      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);

        if (!parsed || typeof parsed !== "object" || !parsed.email) {
          localStorage.removeItem("quote_user");
          setLoading(false);
          return;
        }

        const normalizedStoredUser = normalizeStoredUser(parsed);

        try {
          const response = await apiService.getUsers();
          const matchedUser = response.data.find(
            (user) => user.email?.toLowerCase() === normalizedStoredUser.email?.toLowerCase()
          );

          if (matchedUser) {
            setCurrentUser(matchedUser);
            localStorage.setItem("quote_user", JSON.stringify(matchedUser));
          } else {
            setCurrentUser(normalizedStoredUser);
          }
        } catch {
          setCurrentUser(normalizedStoredUser);
        }
      } catch {
        localStorage.removeItem("quote_user");
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();
  }, []);

  const login = (user) => {
    const normalizedUser = normalizeStoredUser(user);
    setCurrentUser(normalizedUser);
    localStorage.setItem("quote_user", JSON.stringify(normalizedUser));
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
