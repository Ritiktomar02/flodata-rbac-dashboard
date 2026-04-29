import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import UserContext from "./UserContext";
import { AUTH } from "../services/api";

axios.defaults.withCredentials = true;

const emptyAuth = {
  permissions: {},
  fieldRules: {},
  dashboard: { canEditLayout: false, allowedWidgets: [] },
};

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [auth, setAuth] = useState(emptyAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const applyLogin = (data) => {
    setUser(data.user);
    setAuth(data.auth || emptyAuth);
    setAuthenticated(true);
    localStorage.setItem("hasSession", "true");
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(AUTH.LOGIN, { email, password });
      applyLogin(response.data);
      toast.success("Welcome back");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await axios.post(AUTH.LOGOUT);
    } finally {
      localStorage.removeItem("hasSession");
      setUser(null);
      setAuth(emptyAuth);
      setAuthenticated(false);
      setLoading(false);
    }
  };

  // On app load — if we previously had a session, ask the server whether the
  // cookie is still valid. Skip if no flag, so we don't hit /profile for visitors.
  const checkAuth = async () => {
    if (!localStorage.getItem("hasSession")) {
      setCheckingAuth(false);
      return;
    }
    try {
      const response = await axios.get(AUTH.PROFILE);
      setUser(response.data.user);
      setAuth(response.data.auth || emptyAuth);
      setAuthenticated(true);
    } catch {
      localStorage.removeItem("hasSession");
    } finally {
      setCheckingAuth(false);
    }
  };

  // Called after the current user's roles are changed so the sidebar / gates
  // refresh immediately without forcing a re-login.
  const refreshProfile = async () => {
    try {
      const response = await axios.get(AUTH.PROFILE);
      setUser(response.data.user);
      setAuth(response.data.auth || emptyAuth);
    } catch {
      /* ignore */
    }
  };

  const can = (module, action) =>
    Boolean(auth.permissions?.[module]?.includes(action));

  const fieldHidden = (module, field) =>
    Boolean(auth.fieldRules?.[module]?.hiddenFields?.includes(field));

  const fieldReadOnly = (module, field) =>
    Boolean(auth.fieldRules?.[module]?.readOnlyFields?.includes(field));

  return (
    <UserContext.Provider
      value={{
        user,
        auth,
        authenticated,
        checkingAuth,
        loading,
        error,
        login,
        logout,
        checkAuth,
        refreshProfile,
        can,
        fieldHidden,
        fieldReadOnly,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
