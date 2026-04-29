import { Route, Routes, Navigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import UserContext from "./context/UserContext";

import Sidebar from "./components/Sidebar";
import LoadingSpinner from "./components/LoadingSpinner";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import RolesPage from "./pages/RolesPage";
import UsersPage from "./pages/UsersPage";
import AuditPage from "./pages/AuditPage";

const ProtectedRoute = ({ children }) => {
  const { authenticated } = useContext(UserContext);
  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
};

// Sends users to / if they hit a page their role can't see.
// Backend would 403 anyway; this just gives a faster redirect.
const ModuleGate = ({ module, action, children }) => {
  const { can } = useContext(UserContext);
  if (!can(module, action)) return <Navigate to="/" replace />;
  return children;
};

const RedirectAuthenticated = ({ children }) => {
  const { authenticated } = useContext(UserContext);
  if (authenticated) return <Navigate to="/" replace />;
  return children;
};

const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
    {children}
  </div>
);

const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  </div>
);

const App = () => {
  const { checkingAuth, checkAuth } = useContext(UserContext);

  useEffect(() => {
    checkAuth();
  }, []);

  if (checkingAuth) return <LoadingSpinner />;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <ModuleGate module="roles" action="read">
              <AppLayout>
                <RolesPage />
              </AppLayout>
            </ModuleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <ModuleGate module="users" action="read">
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </ModuleGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <ModuleGate module="audit" action="read">
              <AppLayout>
                <AuditPage />
              </AppLayout>
            </ModuleGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/login"
        element={
          <RedirectAuthenticated>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </RedirectAuthenticated>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
