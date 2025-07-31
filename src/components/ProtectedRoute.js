import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Protected route component that checks authentication and role
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, role, user, _debug } = useSelector(
    (state) => state.auth
  );
  const location = useLocation();

  // Debug logging for role verification
  useEffect(() => {
    console.log("ProtectedRoute - Current path:", location.pathname);
    console.log("ProtectedRoute - Auth state:", {
      isAuthenticated,
      role,
      userRole: user?.role,
    });
    console.log("ProtectedRoute - Allowed roles:", allowedRoles);
    console.log("ProtectedRoute - Debug info:", _debug);

    // Check localStorage directly as a backup
    const storedUser = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null;
    console.log("ProtectedRoute - localStorage user:", storedUser);

    if (allowedRoles && !allowedRoles.includes(role)) {
      console.warn(
        `Role mismatch: Current role '${role}' not in allowed roles:`,
        allowedRoles
      );
    }
  }, [location.pathname, isAuthenticated, role, user, allowedRoles, _debug]);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log("ProtectedRoute - Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Double-check role from both Redux state and localStorage as backup
  const storedUser = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;
  const effectiveRole = role || storedUser?.role || "customer";

  // If role is not allowed, redirect to home page
  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    console.warn(
      `ProtectedRoute - Role '${effectiveRole}' not allowed, redirecting to home`
    );
    return <Navigate to="/" replace />;
  }

  // If authenticated and role is allowed, render the children
  return children;
};

export default ProtectedRoute;
