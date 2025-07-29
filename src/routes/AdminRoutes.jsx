import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminLayout from '../views/admin/AdminLayout';
import Dashboard from '../views/admin/Dashboard';
import Users from '../views/admin/Users';
import Orders from '../views/admin/Orders';
import Analytics from '../views/admin/Analytics';
import Settings from '../views/admin/Settings';
import Products from '../views/admin/Products';
import AdminMessages from '../views/messaging/AdminMessages';

// Admin route protection component
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  // Check if user is authenticated and has admin role
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route 
        path="/*" 
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/products" element={<Products />} />
                <Route path="/messages" element={<AdminMessages />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </AdminProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default AdminRoutes;
