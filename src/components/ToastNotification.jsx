import React, { useState, createContext, useContext } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

// Create a context for toast notifications
const ToastContext = createContext();

// Custom hook to use toast context
export const useToast = () => useContext(ToastContext);

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const showToast = (message, variant = 'success', autoHide = true, delay = 3000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, variant, autoHide, delay }]);
    return id;
  };

  // Remove a toast by id
  const hideToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // Helper functions for different toast types
  const success = (message, autoHide = true, delay = 3000) => 
    showToast(message, 'success', autoHide, delay);
  
  const error = (message, autoHide = true, delay = 5000) => 
    showToast(message, 'danger', autoHide, delay);
  
  const info = (message, autoHide = true, delay = 3000) => 
    showToast(message, 'info', autoHide, delay);
  
  const warning = (message, autoHide = true, delay = 4000) => 
    showToast(message, 'warning', autoHide, delay);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, success, error, info, warning }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1070 }}>
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            bg={toast.variant}
            onClose={() => hideToast(toast.id)} 
            show={true}
            delay={toast.delay}
            autohide={toast.autoHide}
          >
            <Toast.Header>
              <strong className="me-auto">QuickMart</strong>
            </Toast.Header>
            <Toast.Body className={['danger', 'dark'].includes(toast.variant) ? 'text-white' : ''}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

// No default export needed as we're using named exports
