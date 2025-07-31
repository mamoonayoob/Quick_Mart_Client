import React from "react";
import "./App.css";
import MainRoutes from "./MainRoutes";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./components/ToastNotification";
import { MessageProvider } from "./context/MessageContext";
import { AuthProvider } from "./context/AuthContext";
import FirebaseNotificationHandler from "./components/firebase/FirebaseNotificationHandler";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CartProvider>
          <MessageProvider>
            <FirebaseNotificationHandler />
            <MainRoutes />
          </MessageProvider>
        </CartProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
