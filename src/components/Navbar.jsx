import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "react-icons/bs";
import {
  Navbar,
  Nav,
  NavDropdown,
  Form,
  FormControl,
  Badge,
  Spinner,
  Image,
  Button,
} from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { useMessages } from "../context/MessageContext";
import NotificationDropdown from "./messaging/NotificationDropdown";
import "./Navbar.css"; // Import the CSS file
import logo from "../assets/logoIcon.png";
import axios from "axios";

// Define styles for ChatBot component
const chatBotStyles = {
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

// ChatBot component
const ChatBot = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 Hi! I'm your support assistant. How can I help you today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      const res = await axios.post(
        "https://nextgenretail.site/quickmart/api/chat",
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={chatBotStyles.chatBox}>
      <div style={chatBotStyles.header}>
        <h5 className="m-0">QuickMart Support</h5>
        {onClose && (
          <button style={chatBotStyles.closeButton} onClick={onClose}>
            ×
          </button>
        )}
      </div>
      <div style={chatBotStyles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...chatBotStyles.message,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.role === "user" ? "#d1e7dd" : "#f8f9fa",
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={chatBotStyles.inputArea}>
        <input
          style={chatBotStyles.input}
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button style={chatBotStyles.button} onClick={sendMessage}>
          {loading ? <Spinner animation="border" size="sm" /> : "Send"}
        </button>
      </div>
    </div>
  );
};

const NavigationBar = () => {
  const { cartCount, loading: cartLoading } = useCart();
  const { unreadCount, fetchNotifications } = useMessages();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const notificationRef = useRef(null);
  const chatbotRef = useRef(null);
  const navigate = useNavigate();
  // const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Fetch notifications when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications({ limit: 10 });
    }
  }, [isAuthenticated, fetchNotifications]);

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

  // Check if current route is messages
  // const isMessagesRoute = location.pathname.includes("/messages");

  // Fetch notifications when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications({ limit: 10 });
    }
  }, [isAuthenticated, fetchNotifications]);

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

  return (
    <>
      <Navbar expand="xl" bg="light" className="shadow-sm mb-3 p-2">
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
          <h2 className="fw-bold ">QuickMart</h2>
        </Navbar.Brand>

        {/* Toggle for Mobile */}
        <Navbar.Toggle aria-controls="navbarSupportedContent" />

        {/* Navbar Content */}
        <Navbar.Collapse
          id="navbarSupportedContent"
          className="justify-content-between"
        >
          {/* Search Bar */}
          <Form
            className="d-flex justify-content-center w-100 my-2 my-xl-0 order-2 order-xl-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/product?search=${encodeURIComponent(searchQuery)}`);
              }
            }}
          >
            <div
              className="position-relative w-100"
              style={{ maxWidth: "400px" }}
            >
              <FormControl
                type="search"
                placeholder="Search products..."
                className="rounded-pill ps-4 pe-5 shadow-sm w-100"
                style={{ height: "40px", borderColor: "#dc3545" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="position-absolute"
                style={{
                  top: "50%",
                  right: "15px",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  fontSize: "20px",
                  color: "#dc3545",
                }}
              >
                <BsSearch />
              </button>
            </div>
          </Form>
          {/* Nav Links */}
          <Nav className="ms-auto align-items-center gap-3 order-3 order-xl-2 mt-3 mt-xl-0 ps-3 pe-3">
            <Nav.Link as={Link} to="/" className="fw-bold text-dark">
              Home
            </Nav.Link>

            <Nav.Link as={Link} to="/product" className="fw-bold text-dark">
              Products
            </Nav.Link>

            {/* Dropdown for Categories */}
            <NavDropdown
              title={<span className="fw-bold text-dark">Categories</span>}
              id="categories-dropdown"
            >
              <NavDropdown.Item as={Link} to="/product?category=electronics">
                Electronics
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/product?category=clothing">
                Clothing
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/product?category=accessories">
                Accessories
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/product?category=home">
                Home & Kitchen
              </NavDropdown.Item>
            </NavDropdown>

            <Nav.Link as={Link} to="/services" className="fw-bold text-dark">
              Services
            </Nav.Link>

            {/* Messages Icon - NEW */}
            {/* {isAuthenticated && (
            <Nav.Link 
              as={Link} 
              to="/messages" 
              className="fw-bold text-dark position-relative"
              title="Messages"
            >
              {isMessagesRoute ? (
                <BsEnvelopeFill size={20} />
              ) : (
                <BsEnvelope size={20} />
              )}
              {unreadCount > 0 && (
                <Badge 
                  bg="danger" 
                  pill 
                  className="position-absolute" 
                  style={{ 
                    top: "-8px", 
                    right: "-8px", 
                    fontSize: "0.65rem",
                    minWidth: "18px"
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
              <span className="ms-2 d-none d-sm-inline">Messages</span>
            </Nav.Link>
          )} */}

            {/* Notifications Icon - NEW */}
            {isAuthenticated && (
              <div ref={notificationRef} className="position-relative">
                <button
                  className="btn btn-link p-0 position-relative notification-btn d-flex align-items-center"
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ color: "#212529" }}
                >
                  {showNotifications ? (
                    <BsBellFill size={22} />
                  ) : (
                    <BsBell size={22} />
                  )}
                  {unreadCount > 0 && (
                    <Badge
                      bg="danger"
                      pill
                      className="position-absolute"
                      style={{
                        top: "-8px",
                        right: "-8px",
                        fontSize: "0.65rem",
                        minWidth: "18px",
                      }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
                  {/* <span className="ms-2 d-none d-sm-inline fw-bold">Notifications</span> */}
                </button>

                {showNotifications && (
                  <div
                    className="position-absolute bg-white rounded shadow-lg"
                    style={{
                      top: "100%",
                      right: "0",
                      width: "350px",
                      zIndex: 1050,
                      marginTop: "10px",
                    }}
                  >
                    <NotificationDropdown
                      show={showNotifications}
                      onHide={() => setShowNotifications(false)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Cart with Badge */}
            <Nav.Link
              as={Link}
              to="/addtoCart"
              className="fw-bold text-dark position-relative d-flex align-items-center"
            >
              <div className="position-relative">
                <BsCart3 size={22} />
                {cartLoading ? (
                  <Spinner
                    animation="border"
                    variant="danger"
                    size="sm"
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                ) : cartCount > 0 ? (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute"
                    style={{
                      top: "-8px",
                      right: "-8px",
                      fontSize: "0.65rem",
                      minWidth: "18px",
                    }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </Badge>
                ) : null}
              </div>
              <span className="ms-2 d-none d-sm-inline">Cart</span>
            </Nav.Link>

            {/* User Account - Enhanced Dropdown */}
            <NavDropdown
              title={
                isAuthenticated && user
                  ? (user.name?.length > 10
                      ? user.name.substring(0, 10) + "..."
                      : user.name) || "Account"
                  : "Account"
              }
              // title={
              //   <div className="d-flex align-items-center w-100">
              //     {isAuthenticated && user && user.profilePicture ? (
              //       <Image
              //         src={user.profilePicture}
              //         roundedCircle
              //         width={32}
              //         height={32}
              //         className="border border-2 border-primary"
              //         alt="Profile"
              //         onError={(e) => {
              //           e.target.onerror = null;
              //           e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name || "User") + "&background=random";
              //         }}
              //       />
              //     ) : (
              //       <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary"
              //            style={{width: '32px', height: '32px'}}>
              //         <BsPerson size={20} color="white" />
              //       </div>
              //     )}
              //     <span className="ms-2 d-none d-sm-inline fw-semibold">
              //       {isAuthenticated && user ?
              //         (user.name?.length > 10 ? user.name.substring(0, 10) + '...' : user.name) || "Account"
              //         : "Account"}
              //     </span>
              //   </div>
              // }
              id="user-dropdown"
              align="end"
              className="profile-dropdown"
            >
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 border-bottom">
                    <div className="d-flex ">
                      {user && user.profilePicture ? (
                        <Image
                          src={user.profilePicture}
                          roundedCircle
                          width={48}
                          height={48}
                          className="border border-2 border-primary"
                          alt="Profile"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://ui-avatars.com/api/?name=" +
                              encodeURIComponent(user.name || "User") +
                              "&background=random";
                          }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle bg-primary"
                          style={{ width: "48px", height: "48px" }}
                        >
                          <BsPerson size={28} color="white" />
                        </div>
                      )}
                      <div className="ms-2">
                        <div className="fw-bold">{user?.name || "User"}</div>
                        <div className="text-muted small">
                          {user?.email || ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  {user && user.role === "admin" && (
                    <NavDropdown.Item
                      as={Link}
                      to="/addProduct"
                      className="py-2"
                    >
                      <BsGear className="me-2" /> Admin Dashboard
                    </NavDropdown.Item>
                  )}

                  <NavDropdown.Item as={Link} to="/profile" className="py-2">
                    <BsPerson className="me-2" /> My Profile
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to="/users/wishlist"
                    className="py-2"
                  >
                    <BsHeart className="me-2" /> Wishlist
                  </NavDropdown.Item>

                  <NavDropdown.Item as={Link} to="/orders" className="py-2">
                    <BsClipboardCheck className="me-2" /> My Orders
                  </NavDropdown.Item>

                  <NavDropdown.Item
                    as={Link}
                    to="/profile/messages"
                    className="py-2"
                  >
                    <BsEnvelope className="me-2" /> Messages
                    {unreadCount > 0 && (
                      <Badge bg="danger" pill className="ms-2">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </NavDropdown.Item>

                  <NavDropdown.Divider />

                  <NavDropdown.Item
                    onClick={() => {
                      dispatch(logout());
                      navigate("/login");
                    }}
                    className="text-danger py-2"
                  >
                    <BsBoxArrowRight className="me-2" /> Logout
                  </NavDropdown.Item>
                </>
              ) : (
                <>
                  <NavDropdown.Item as={Link} to="/login" className="py-2">
                    <BsPerson className="me-2" /> Login
                  </NavDropdown.Item>

                  <NavDropdown.Item as={Link} to="/signup" className="py-2">
                    <BsBoxArrowRight className="me-2" /> Sign Up
                  </NavDropdown.Item>
                </>
              )}
            </NavDropdown>
            {/* Commented out old dropdown code */}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

   
    </>
  );
};

export default NavigationBar;
