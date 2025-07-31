import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import WhatsAppCustomerMessages from '../../views/messaging/WhatsAppCustomerMessages';
import WhatsAppVendorMessages from '../../views/messaging/WhatsAppVendorMessages';
import AdminMessages from './AdminMessages';

/**
 * MessageRouter component that routes users to appropriate messaging interface
 * based on their role (customer, vendor, or admin)
 * Now uses WhatsApp-style messaging components for better user experience
 */
const MessageRouter = () => {
  const { user, isAuthenticated } = useAuth();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Route based on user role
  switch (user?.role) {
    case 'admin':
      return <AdminMessages />;
    case 'vendor':
      return <WhatsAppVendorMessages />;
    case 'customer':
    default:
      return <WhatsAppCustomerMessages />;
  }
};

export default MessageRouter;
