// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, signup as apiSignup } from "../services/authApi";

const AuthContext = createContext(null);

// Key for localStorage
const STORAGE_KEY = "mediaAppAuth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, username, email }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved auth (if any) on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.user && parsed.token) {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      }
    } catch {
      // ignore corrupted storage
    } finally {
      setLoading(false);
    }
  }, []);

  function saveAuth(u, t) {
    setUser(u);
    setToken(t);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: u, token: t })
    );
  }

  async function login(credentials) {
    const res = await apiLogin(credentials);
    saveAuth(res.user, res.token);
    return res;
  }

  async function signup(data) {
    const res = await apiSignup(data);
    saveAuth(res.user, res.token);
    return res;
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
