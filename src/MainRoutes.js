import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useSelector } from "react-redux";

// Inside <Routes>

// Components
import Home from "./views/homePage/Home";
import Product from "./views/productPage/Product";
import SingleProduct from "./views/singleProductPage/SingleProduct";
import Services from "./views/customerServies/Services";
import Cart from "./views/cartInfo/Cart";
import NotFound from "./views/404Page/NotFound";
import CheckOut from "./views/checkOutPage/CheckOut";
import LogIn from "./views/auth/LogIn";
import SignUp from "./views/auth/SignUp";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AddProduct from "./views/Addproduct.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./views/profile/Profile";
import Wishlist from "./views/wishlist/Wishlist";
import OrderHistory from "./views/orderPage/OrderHistory";
import OrderDetails from "./views/orderPage/OrderDetails";
import Chat from ".//./components/Chat.jsx";
// import FloatingChat from "./components/FloatingChat";

// Admin Components
import AdminLayout from "./views/admin/AdminLayout";
import Dashboard from "./views/admin/Dashboard";
import Users from "./views/admin/Users";
import Orders from "./views/admin/Orders";
import Analytics from "./views/admin/Analytics";
import Settings from "./views/admin/Settings";
import Products from "./views/admin/Products";
import SystemHealth from "./views/admin/SystemHealth";
import AdminNotifications from "./views/admin/AdminNotifications";

// Vendor Components
import VendorLayout from "./views/vendor/VendorLayout";
import VendorDashboard from "./views/vendor/VendorDashboard";
import VendorOrders from "./views/vendor/VendorOrders";
import VendorProductsWithUpload from "./views/vendor/VendorProductsWithUpload";
import VendorNotifications from "./views/vendor/VendorNotifications";
import VendorAnalytics from "./views/vendor/VendorAnalytics";
import VendorDelivery from "./views/vendor/VendorDelivery";
import VendorForecasting from "./views/vendor/VendorForecasting";

// Messaging Components
import MessageRouter from "./pages/messaging/MessageRouter";
import VendorDirectory from "./views/messaging/VendorDirectory";

// Delivery Components
import DeliveryLayout from "./views/delivery/DeliveryLayout";
import NewDeliveryDashboard from "./views/delivery/NewDeliveryDashboard";
import MyDeliveries from "./views/delivery/MyDeliveries";
import DeliveryProfile from "./views/delivery/DeliveryProfile";
import CustomerMessages from "./views/messaging/CustomerMessages";
import AdminMessages from "./views/messaging/AdminMessages";
import WebSocketDebugger from "./pages/messaging/WebSocketDebugger";
import WhatsAppDeliveryMessages from "./views/messaging/WhatsAppDeliveryMessages";

// Testing Components
// import AuthDebugger from "./components/testing/AuthDebugger";
// import NotificationTester from "./components/testing/NotificationTester";

// Auth check wrapper component
const AuthWrapper = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the children
  return children;
};

export default function MainRoutes() {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes - Always accessible */}
        <Route path="/login" element={<LogIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* All other routes require authentication */}
        <Route
          path="/"
          element={
            <AuthWrapper>
              <Navbar />
              <Home />
              <Footer />
              <Chat />
            </AuthWrapper>
          }
        />

        <Route
          path="/product"
          element={
            <AuthWrapper>
              <Navbar />
              <Product />
              <Footer />
              <Chat />
            </AuthWrapper>
          }
        />

        <Route
          path="/singleProduct/:id"
          element={
            <AuthWrapper>
              <Navbar />
              <SingleProduct />
              <Footer />
            </AuthWrapper>
          }
        />

        <Route
          path="/services"
          element={
            <AuthWrapper>
              <Navbar />
              <Services />
              <Footer />
            </AuthWrapper>
          }
        />

        {/* Protected Routes with specific role requirements */}
        <Route
          path="/addtoCart"
          element={
            <AuthWrapper>
              <Navbar />
              <Cart />
              <Footer />
            </AuthWrapper>
          }
        />

        <Route
          path="/checkOutPage"
          element={
            <AuthWrapper>
              <Navbar />
              <CheckOut />
              <Footer />
            </AuthWrapper>
          }
        />

        <Route
          path="/profile"
          element={
            <AuthWrapper>
              <Navbar />
              <Profile />
              <Footer />
            </AuthWrapper>
          }
        />

        {/* Customer Message Routes - Only in profile area */}
        <Route
          path="/profile/messages"
          element={
            <AuthWrapper>
              <Navbar />
              <Profile />
              <Footer />
            </AuthWrapper>
          }
        />

        <Route
          path="/users/wishlist"
          element={
            <AuthWrapper>
              <Navbar />
              <Wishlist />
              <Footer />
            </AuthWrapper>
          }
        />

        <Route
          path="/orders/history"
          element={
            <AuthWrapper>
              <Navbar />
              <OrderHistory />
              <Footer />
            </AuthWrapper>
          }
        />

        <Route
          path="/order/history"
          element={
            <AuthWrapper>
              <Navbar />
              <OrderHistory />
              <Footer />
            </AuthWrapper>
          }
        />

        <Route
          path="/orders"
          element={
            <AuthWrapper>
              <Navbar />
              <OrderHistory />
              <Footer />
            </AuthWrapper>
          }
        />

        <Route
          path="/orders/:orderId"
          element={
            <AuthWrapper>
              <Navbar />
              <OrderDetails />
              <Footer />
            </AuthWrapper>
          }
        />

        {/* Vendor Directory Route - For customers to browse vendors */}
        <Route
          path="/vendors"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Navbar />
              <VendorDirectory />
              <Footer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendors/directory"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <Navbar />
              <VendorDirectory />
              <Footer />
            </ProtectedRoute>
          }
        />

        {/* WebSocket Debug Route - For development only */}
        <Route
          path="/websocket-debug"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Navbar />
              <WebSocketDebugger />
              <Footer />
            </ProtectedRoute>
          }
        />

        {/* Vendor/Admin Only Routes */}
        <Route
          path="/addProduct"
          element={
            <ProtectedRoute allowedRoles={["vendor", "admin"]}>
              <Navbar />
              <AddProduct />
              <Footer />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes - Using nested routes with Outlet */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* These are nested routes that will render in the Outlet */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="orders" element={<Orders />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="products" element={<Products />} />
          <Route path="system-health" element={<SystemHealth />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="messages" element={<AdminMessages />} />
        </Route>

        {/* Vendor Routes - Using nested routes with Outlet */}
        <Route
          path="/vendor"
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <VendorLayout />
            </ProtectedRoute>
          }
        >
          {/* These are nested routes that will render in the Outlet */}
          <Route index element={<VendorDashboard />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products" element={<VendorProductsWithUpload />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="messages" element={<MessageRouter />} />
          <Route path="customer-messages" element={<CustomerMessages />} />
          <Route path="admin-messages" element={<AdminMessages />} />
          <Route path="websocket-debug" element={<WebSocketDebugger />} />
          <Route path="notifications" element={<VendorNotifications />} />
          <Route path="analytics" element={<VendorAnalytics />} />
          <Route path="forecasting" element={<VendorForecasting />} />
          <Route path="delivery" element={<VendorDelivery />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Delivery Routes - Using nested routes with Outlet */}
        <Route
          path="/delivery"
          element={
            <ProtectedRoute allowedRoles={["deliveryman", "delivery"]}>
              <DeliveryLayout />
            </ProtectedRoute>
          }
        >
          {/* These are nested routes that will render in the Outlet */}
          <Route index element={<NewDeliveryDashboard />} />
          <Route path="dashboard" element={<NewDeliveryDashboard />} />
          <Route path="orders" element={<MyDeliveries />} />
          <Route path="my-deliveries" element={<MyDeliveries />} />
          <Route path="messages" element={<WhatsAppDeliveryMessages />} />
          <Route path="profile" element={<DeliveryProfile />} />
        </Route>

        {/* Testing Routes */}
        {/* <Route
          path="/test/auth"
          element={
            <>
              <Navbar />
              <AuthDebugger />
              <Footer />
            </>
          }
        />
        <Route
          path="/test/notifications"
          element={
            <>
              <Navbar />
              <NotificationTester />
              <Footer />
            </>
          }
        /> */}

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <AuthWrapper>
              <Navbar />
              <NotFound />
              <Footer />
            </AuthWrapper>
          }
        />
      </Routes>
    </Router>
  );
}
