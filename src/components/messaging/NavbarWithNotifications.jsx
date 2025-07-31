import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BsSearch,
  BsCart3,
  BsPerson,
  BsBoxArrowRight,
  BsHeart,
  BsGear,
  BsClipboardCheck,
  BsBell,
  BsBellFill,
  BsChatDots,
  BsEnvelope,
  BsEnvelopeFill,
} from "react-icons/bs";
import {
  Navbar,
  Nav,
  NavDropdown,
  Form,
  FormControl,
  Badge,
  Button,
} from "react-bootstrap";
import { useCart } from "../../context/CartContext";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { useMessages } from "../../context/MessageContext";
import NotificationDropdown from "./NotificationDropdown";
import "../Navbar.css"; // Import the CSS file
import logo from "../../assets/logoIcon.png";
import axios from "axios";
import { getUnreadCount as getUnreadNotificationCount } from "../../services/notificationService";

const NavbarWithNotifications = () => {
  const { cartCount, loading: cartLoading } = useCart();
  const { unreadCount: unreadMessageCount } = useMessages();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const notificationRef = useRef(null);
  const chatbotRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Fetch notification count when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotificationCount();
    }
  }, [isAuthenticated]);

  // Function to fetch unread notification count
  const fetchUnreadNotificationCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadNotificationCount(count);
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
    }
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (chatbotRef.current && !chatbotRef.current.contains(event.target)) {
        setShowChatbot(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  // Check if current route is messages
  const isMessagesRoute = location.pathname.includes("/messages");

  return (
    <>
      <Navbar expand="xl" bg="light" className="shadow-sm mb-3 p-2 sticky-top">
        {/* Logo and Heading */}
        <Navbar.Brand
          as={Link}
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={logo}
            alt="Logo"
            width="70"
            height="70"
            className="img-fluid"
          />
          <h4 className="ms-2 mb-0 d-none d-sm-block">QuickMart</h4>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          {/* Search Form */}
          <Form
            className="d-flex mx-auto"
            style={{ maxWidth: "500px" }}
            onSubmit={handleSearch}
          >
            <FormControl
              type="search"
              placeholder="Search products..."
              className="me-2"
              aria-label="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="outline-success" type="submit">
              <BsSearch />
            </Button>
          </Form>

          {/* Navigation Links */}
          <Nav className="ms-auto align-items-center">
            {isAuthenticated && (
              <>
                {/* Messages Icon - Linking to profile messages section */}
                <Nav.Link
                  as={Link}
                  to="/profile/messages"
                  className="position-relative me-2"
                  title="Messages"
                >
                  {isMessagesRoute ? (
                    <BsEnvelopeFill size={20} />
                  ) : (
                    <BsEnvelope size={20} />
                  )}
                  {unreadMessageCount > 0 && (
                    <Badge
                      bg="danger"
                      pill
                      className="position-absolute"
                      style={{
                        top: "0",
                        right: "0",
                        transform: "translate(25%, -25%)",
                      }}
                    >
                      {unreadMessageCount}
                    </Badge>
                  )}
                </Nav.Link>

                {/* Notifications Icon */}
                <div ref={notificationRef} className="position-relative me-2">
                  <Nav.Link
                    className="position-relative"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) {
                        fetchUnreadNotificationCount(); // Refresh count when opening
                      }
                    }}
                    title="Notifications"
                  >
                    {unreadNotificationCount > 0 ? (
                      <>
                        <BsBellFill size={20} />
                        <Badge
                          bg="danger"
                          className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                          style={{ fontSize: "0.6rem" }}
                        >
                          {unreadNotificationCount > 9
                            ? "9+"
                            : unreadNotificationCount}
                        </Badge>
                      </>
                    ) : (
                      <BsBell size={20} />
                    )}
                  </Nav.Link>
                  <NotificationDropdown
                    show={showNotifications}
                    onHide={() => setShowNotifications(false)}
                  />
                </div>

                {/* Cart Icon */}
                <Nav.Link
                  as={Link}
                  to="/cart"
                  className="position-relative me-2"
                  title="Cart"
                >
                  <BsCart3 size={20} />
                  {cartCount > 0 && !cartLoading && (
                    <Badge
                      bg="success"
                      pill
                      className="position-absolute"
                      style={{
                        top: "0",
                        right: "0",
                        transform: "translate(25%, -25%)",
                      }}
                    >
                      {cartCount}
                    </Badge>
                  )}
                </Nav.Link>
              </>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <NavDropdown
                title={
                  <div className="d-inline-block">
                    <BsPerson size={24} />
                    <span className="ms-1 d-none d-lg-inline">
                      {user?.name || "Account"}
                    </span>
                  </div>
                }
                id="user-dropdown"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <BsPerson className="me-2" /> Profile
                </NavDropdown.Item>

                {user?.role === "customer" && (
                  <>
                    <NavDropdown.Item as={Link} to="/orders">
                      <BsClipboardCheck className="me-2" /> Orders
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/wishlist">
                      <BsHeart className="me-2" /> Wishlist
                    </NavDropdown.Item>
                  </>
                )}

                {(user?.role === "admin" || user?.role === "vendor") && (
                  <NavDropdown.Item as={Link} to="/dashboard">
                    <BsGear className="me-2" /> Dashboard
                  </NavDropdown.Item>
                )}

                <NavDropdown.Divider />
                <NavDropdown.Item onClick={() => dispatch(logout())}>
                  <BsBoxArrowRight className="me-2" /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="me-2">
                  Login
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/register"
                  className="btn btn-outline-primary"
                >
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Chatbot Button for Customers */}
      {isAuthenticated && user?.role === "customer" && (
        <div
          ref={chatbotRef}
          className="position-fixed"
          style={{ bottom: "20px", right: "20px", zIndex: 1050 }}
        >
          <Button
            variant="success"
            className="rounded-circle shadow"
            style={{ width: "60px", height: "60px" }}
            onClick={() => setShowChatbot(!showChatbot)}
          >
            <BsChatDots size={24} />
          </Button>

          {showChatbot && (
            <div
              className="position-absolute bg-white rounded shadow-lg"
              style={{
                bottom: "70px",
                right: "0",
                width: "350px",
                height: "500px",
                overflow: "hidden",
              }}
            >
              <ChatBot onClose={() => setShowChatbot(false)} />
            </div>
          )}
        </div>
      )}
    </>
  );
};

// ChatBot component
const ChatBot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 Hi! I'm your support assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await axios.post(
        "https://nextgenretail.site/quickmart/chat",
        {
          message: input,
        }
      );

      setMessages([...newMessages, { role: "bot", text: res.data.reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "bot", text: "⚠️ Sorry, I couldn't process your request." },
      ]);
    }
  };

  return (
    <div style={styles.chatBox}>
      <div style={styles.header}>
        <h5 className="m-0">QuickMart Support</h5>
        {onClose && (
          <button style={styles.closeButton} onClick={onClose}>
            ×
          </button>
        )}
      </div>
      <div style={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.role === "user" ? "#d1e7dd" : "#f8f9fa",
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button style={styles.button} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  chatBox: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "10px 15px",
    backgroundColor: "#198754",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 15,
  },
  message: {
    padding: "10px 15px",
    borderRadius: 20,
    maxWidth: "80%",
    fontSize: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: 10,
    borderTop: "1px solid #eee",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    border: "1px solid #ccc",
    outline: "none",
  },
  button: {
    padding: "8px 16px",
    borderRadius: 20,
    border: "none",
    backgroundColor: "#198754",
    color: "white",
    cursor: "pointer",
  },
};

export default NavbarWithNotifications;
