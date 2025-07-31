/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  ListGroup,
  Alert,
  Badge,
  InputGroup,
} from "react-bootstrap";
import {
  BsChat,
  BsPerson,
  BsSearch,
  BsSend,
  BsShop,
  BsShieldCheck,
  BsTruck,
} from "react-icons/bs";
import { toast } from "react-toastify";

const CustomerWhatsAppChat = () => {
  // State for all users (vendors, admins, delivery)
  const [users, setUsers] = useState([]);

  // Selected user and chat state
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Fetch all users (vendors, admins, delivery) using the unified endpoint
  const fetchUsers = async () => {
    try {
      const token = getAuthToken();

      if (!token) {
        console.error("No auth token found");
        toast.error("Authentication error. Please log in again.");
        return;
      }

      // Use the getAllUsersForMessaging endpoint which now supports all user types for customers
      const response = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/users/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          return;
        }
        toast.error(`Server error: ${response.status}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // The backend returns an object with separate arrays for each role
        const vendors = Array.isArray(data.data?.vendors)
          ? data.data.vendors
          : [];
        const admins = Array.isArray(data.data?.admins) ? data.data.admins : [];
        const deliveryBoys = Array.isArray(data.data?.deliveryBoys)
          ? data.data.deliveryBoys
          : [];

        // Combine all users into a single array
        const allUsers = [...vendors, ...admins, ...deliveryBoys];

        // Only update state if we have valid data
        if (allUsers.some((user) => user && user._id)) {
          setUsers(allUsers);
        }

        if (allUsers.length === 0) {
          // No users found
        }
      } else {
        // Don't show toast on every refresh failure
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Don't show toast on every refresh error
    }
  };

  // Fetch messages with selected user
  const fetchMessages = async (userId) => {
    if (!userId) return;

    // Use a local variable to track if this specific request should continue
    // This helps prevent state updates after component unmount
    let isActive = true;

    setLoading(true);
    try {
      const token = getAuthToken();

      if (!token) {
        if (isActive) setLoading(false);
        return;
      }

      const response = await fetch(
        `https://nextgenretail.site/quickmart/api/messages/conversation/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
          },
        }
      );

      // Check if the request is still relevant
      if (!isActive) return;

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();

      // Check again if the request is still relevant
      if (!isActive) return;

      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);

        // Scroll to bottom after messages load
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    } catch (error) {
      if (!isActive) return;
      console.error("Error fetching messages:", error);
    } finally {
      if (isActive) {
        setLoading(false);
      }
    }

    // Return a cleanup function that can mark this request as no longer active
    return () => {
      isActive = false;
    };
  };

  // Send message to selected user
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) {
      toast.error("Please select a user and enter a message");
      return;
    }

    setLoading(true);
    try {
      // console.log('📨 Sending message to user:', selectedUser.name);
      const token = getAuthToken();

      // Determine endpoint based on user role
      let endpoint = "";
      let body = {};

      switch (selectedUser.role) {
        case "vendor":
          endpoint =
            "https://nextgenretail.site/quickmart/api/messages/customer-to-vendor/general";
          body = { vendorId: selectedUser._id, content: newMessage };
          break;
        case "admin":
          endpoint =
            "https://nextgenretail.site/quickmart/api/messages/customer-to-admin/general";
          body = { adminId: selectedUser._id, content: newMessage };
          break;
        case "delivery":
          endpoint =
            "https://nextgenretail.site/quickmart/api/messages/customer-to-delivery/general";
          body = { deliveryId: selectedUser._id, content: newMessage };
          break;
        default:
          endpoint =
            "https://nextgenretail.site/quickmart/api/messages/customer-to-vendor/general";
          body = { vendorId: selectedUser._id, content: newMessage };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log("📨 Send message response:", data);

      if (data.success) {
        // Add message to list and clear input
        setMessages([...messages, data.data]);
        setNewMessage("");
        console.log("✅ Message sent successfully");

        // Scroll to bottom after sending
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        console.error("❌ Failed to send message:", data.message);
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // Select user and load their messages
  const selectUser = async (user) => {
    console.log("👤 Selecting user:", user.name);
    setSelectedUser(user);
    await fetchMessages(user._id);
  };

  // Filter and group users based on search term and role
  const getFilteredUsers = () => {
    const term = searchTerm.toLowerCase();
    const filtered = Array.isArray(users)
      ? users.filter(
          (user) =>
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term) ||
            user.businessName?.toLowerCase().includes(term)
        )
      : [];

    console.log("🔍 Filtering users:", filtered.length);
    console.log(
      "🔍 User roles:",
      filtered.map((u) => u.role)
    );

    // Group users by role
    return {
      vendors: filtered.filter((user) => user.role === "vendor"),
      admins: filtered.filter((user) => user.role === "admin"),
      deliveryBoys: filtered.filter(
        (user) => user.role === "delivery" || user.role === "deliveryman"
      ),
    };
  };

  // Get role-based icon and color
  const getUserRoleIcon = (role) => {
    switch (role) {
      case "vendor":
        return { icon: <BsShop />, color: "success" };
      case "admin":
        return { icon: <BsShieldCheck />, color: "danger" };
      case "delivery":
        return { icon: <BsTruck />, color: "warning" };
      default:
        return { icon: <BsPerson />, color: "primary" };
    }
  };

  // Load users on component mount - only once with no dependencies
  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        await fetchUsers();
        if (!isMounted) return;
      } catch (error) {
        console.error("Error in initial user load:", error);
      }
    };

    loadUsers();

    // Set up periodic refresh for users (very infrequent)
    const usersInterval = setInterval(() => {
      if (isMounted) {
        fetchUsers().catch((err) =>
          console.error("Error in periodic user refresh:", err)
        );
      }
    }, 60000); // Refresh every 60 seconds (reduced frequency)

    return () => {
      isMounted = false;
      clearInterval(usersInterval);
    };
  }, []); // Empty dependency array - runs ONCE on mount

  // Handle message fetching ONLY when selectedUser changes
  useEffect(() => {
    let messageInterval = null;
    let isMounted = true;

    const loadMessages = async () => {
      if (!selectedUser || !isMounted) return;

      try {
        await fetchMessages(selectedUser._id);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    // Initial load
    loadMessages();

    // Only set up interval if we have a selected user
    if (selectedUser) {
      messageInterval = setInterval(() => {
        if (isMounted && selectedUser) {
          fetchMessages(selectedUser._id).catch((err) =>
            console.error("Error in message refresh:", err)
          );
        }
      }, 8000); // Less frequent refresh (8 seconds)
    }

    return () => {
      isMounted = false;
      if (messageInterval) {
        clearInterval(messageInterval);
      }
    };
  }, [selectedUser?._id]); // Only depend on the ID, not the entire object

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get filtered users
  const filteredUsers = getFilteredUsers();

  return (
    <Container fluid className="p-0">
      <Row className="g-0">
        {/* User List */}
        <Col md={4} className="border-end">
          <Card className="h-100 border-0">
            <Card.Body className="p-0">
              {/* Search Bar */}
              <div className="p-3 border-bottom">
                <InputGroup>
                  <InputGroup.Text>
                    <BsSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>

              {/* User List */}
              <div style={{ height: "calc(100vh - 250px)", overflowY: "auto" }}>
                {Object.values(filteredUsers).every(
                  (group) => group.length === 0
                ) ? (
                  <Alert variant="light" className="m-3">
                    <small>No users found</small>
                  </Alert>
                ) : (
                  <div>
                    {/* Vendors Section */}
                    {filteredUsers.vendors.length > 0 && (
                      <div className="mb-3">
                        <div className="bg-light p-2 border-bottom">
                          <div className="d-flex align-items-center">
                            <BsShop className="me-2 text-success" />
                            <strong className="text-success">Vendors</strong>
                            <Badge bg="success" pill className="ms-2">
                              {filteredUsers.vendors.length}
                            </Badge>
                          </div>
                        </div>
                        <ListGroup variant="flush">
                          {filteredUsers.vendors.map((user) => {
                            const roleInfo = getUserRoleIcon(user.role);
                            return (
                              <ListGroup.Item
                                key={user._id}
                                action
                                onClick={() => selectUser(user)}
                                className={`p-3 border-bottom ${
                                  selectedUser?._id === user._id
                                    ? "bg-light"
                                    : ""
                                }`}
                                style={{ cursor: "pointer" }}
                              >
                                <div className="d-flex align-items-center">
                                  <div
                                    className={`rounded-circle text-white d-flex align-items-center justify-content-center me-3 bg-${roleInfo.color}`}
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      fontSize: "16px",
                                    }}
                                  >
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-1">
                                      {user.name}
                                      <Badge
                                        bg={roleInfo.color}
                                        className="ms-2"
                                        pill
                                      >
                                        {user.role}
                                      </Badge>
                                    </h6>
                                    <small className="text-muted">
                                      {user.email}
                                    </small>
                                  </div>
                                  <BsChat className="text-muted" />
                                </div>
                              </ListGroup.Item>
                            );
                          })}
                        </ListGroup>
                      </div>
                    )}

                    {/* Admins Section */}
                    {filteredUsers.admins.length > 0 && (
                      <div className="mb-3">
                        <div className="bg-light p-2 border-bottom">
                          <div className="d-flex align-items-center">
                            <BsShieldCheck className="me-2 text-danger" />
                            <strong className="text-danger">Admins</strong>
                            <Badge bg="danger" pill className="ms-2">
                              {filteredUsers.admins.length}
                            </Badge>
                          </div>
                        </div>
                        <ListGroup variant="flush">
                          {filteredUsers.admins.map((user) => {
                            const roleInfo = getUserRoleIcon(user.role);
                            return (
                              <ListGroup.Item
                                key={user._id}
                                action
                                onClick={() => selectUser(user)}
                                className={`p-3 border-bottom ${
                                  selectedUser?._id === user._id
                                    ? "bg-light"
                                    : ""
                                }`}
                                style={{ cursor: "pointer" }}
                              >
                                <div className="d-flex align-items-center">
                                  <div
                                    className={`rounded-circle text-white d-flex align-items-center justify-content-center me-3 bg-${roleInfo.color}`}
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      fontSize: "16px",
                                    }}
                                  >
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-1">
                                      {user.name}
                                      <Badge
                                        bg={roleInfo.color}
                                        className="ms-2"
                                        pill
                                      >
                                        {user.role}
                                      </Badge>
                                    </h6>
                                    <small className="text-muted">
                                      {user.email}
                                    </small>
                                  </div>
                                  <BsChat className="text-muted" />
                                </div>
                              </ListGroup.Item>
                            );
                          })}
                        </ListGroup>
                      </div>
                    )}

                    {/* Delivery Section */}
                    {filteredUsers.deliveryBoys.length > 0 && (
                      <div className="mb-3">
                        <div className="bg-light p-2 border-bottom">
                          <div className="d-flex align-items-center">
                            <BsTruck className="me-2 text-warning" />
                            <strong className="text-warning">
                              Delivery Boys
                            </strong>
                            <Badge bg="warning" pill className="ms-2">
                              {filteredUsers.deliveryBoys.length}
                            </Badge>
                          </div>
                        </div>
                        <ListGroup variant="flush">
                          {filteredUsers.deliveryBoys.map((user) => {
                            const roleInfo = getUserRoleIcon(user.role);
                            return (
                              <ListGroup.Item
                                key={user._id}
                                action
                                onClick={() => selectUser(user)}
                                className={`p-3 border-bottom ${
                                  selectedUser?._id === user._id
                                    ? "bg-light"
                                    : ""
                                }`}
                                style={{ cursor: "pointer" }}
                              >
                                <div className="d-flex align-items-center">
                                  <div
                                    className={`rounded-circle text-white d-flex align-items-center justify-content-center me-3 bg-${roleInfo.color}`}
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      fontSize: "16px",
                                    }}
                                  >
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-1">
                                      {user.name}
                                      <Badge
                                        bg={roleInfo.color}
                                        className="ms-2"
                                        pill
                                      >
                                        {user.role}
                                      </Badge>
                                    </h6>
                                    <small className="text-muted">
                                      {user.email}
                                    </small>
                                  </div>
                                  <BsChat className="text-muted" />
                                </div>
                              </ListGroup.Item>
                            );
                          })}
                        </ListGroup>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Chat Area */}
        <Col md={8}>
          <Card className="h-100 border-0">
            {!selectedUser ? (
              <Card.Body className="d-flex align-items-center justify-content-center">
                <div className="text-center text-muted">
                  <BsChat size={48} className="mb-3" />
                  <h5>Select a user to start chatting</h5>
                </div>
              </Card.Body>
            ) : (
              <>
                {/* Chat Header */}
                <Card.Header
                  className={`bg-${
                    getUserRoleIcon(selectedUser.role).color
                  } text-white`}
                >
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle bg-white text-dark d-flex align-items-center justify-content-center me-2"
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "16px",
                      }}
                    >
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="mb-0">{selectedUser.name}</h6>
                      <small className="text-white">{selectedUser.email}</small>
                    </div>
                    <Badge bg="light" text="dark" className="ms-2">
                      {selectedUser.role.charAt(0).toUpperCase() +
                        selectedUser.role.slice(1)}
                    </Badge>
                  </div>
                </Card.Header>

                {/* Messages Area - WhatsApp Style */}
                <Card.Body
                  className="p-3"
                  style={{
                    height: "calc(100vh - 300px)",
                    overflowY: "auto",
                    backgroundColor: "#e5ded8", // WhatsApp background color
                    backgroundImage:
                      'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAO0lEQVQ4y2N89+4dA24gJiaGgRhArIHv3r0jTiMTA43BqIGjBg4hA4kECbGZfebMGWI0MpAUJKMGDiUDAQAJPwV1CyPJ0AAAAABJRU5ErkJggg==")', // Light pattern background
                    backgroundRepeat: "repeat",
                  }}
                  ref={messagesEndRef}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-muted mt-5 p-4 bg-white rounded-3 shadow-sm">
                      <BsChat size={40} className="mb-3" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="px-2">
                      {messages.map((message, index) => {
                        const isMyMessage =
                          message.sender._id === currentUserId;
                        const prevMessage =
                          index > 0 ? messages[index - 1] : null;
                        const showSenderInfo =
                          !prevMessage ||
                          prevMessage.sender._id !== message.sender._id;
                        const messageTime = new Date(
                          message.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={message._id || index}
                            className={`mb-2 d-flex ${
                              isMyMessage
                                ? "justify-content-end"
                                : "justify-content-start"
                            }`}
                          >
                            {/* Message bubble with WhatsApp style */}
                            <div
                              className={`py-2 px-3 ${
                                isMyMessage ? "bg-success" : "bg-white"
                              }`}
                              style={{
                                maxWidth: "75%",
                                position: "relative",
                                borderRadius: isMyMessage
                                  ? "12px 0 12px 12px"
                                  : "0 12px 12px 12px",
                                boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                                wordBreak: "break-word",
                              }}
                            >
                              {/* Sender name for group chats (optional) */}
                              {!isMyMessage && showSenderInfo && (
                                <div
                                  className="fw-bold"
                                  style={{ fontSize: "13px", color: "#9c3d54" }}
                                >
                                  {message.sender.name}
                                </div>
                              )}

                              {/* Message content */}
                              <div
                                className={`mb-1 ${
                                  isMyMessage ? "text-white" : "text-dark"
                                }`}
                              >
                                {message.content}
                              </div>

                              {/* Message timestamp */}
                              <div
                                className={`${
                                  isMyMessage ? "text-white-50" : "text-muted"
                                }`}
                                style={{
                                  fontSize: "11px",
                                  textAlign: "right",
                                  marginTop: "2px",
                                  opacity: 0.8,
                                }}
                              >
                                {messageTime}
                              </div>

                              {/* Triangle for bubble effect */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  [isMyMessage ? "right" : "left"]: -8,
                                  width: 0,
                                  height: 0,
                                  borderTop: `8px solid ${
                                    isMyMessage ? "#198754" : "white"
                                  }`,
                                  borderLeft: isMyMessage
                                    ? "8px solid transparent"
                                    : "none",
                                  borderRight: isMyMessage
                                    ? "none"
                                    : "8px solid transparent",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ height: "10px" }} />
                    </div>
                  )}
                </Card.Body>

                {/* Message Input - WhatsApp Style */}
                <Card.Footer className="bg-white border-top p-2">
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !loading) {
                          sendMessage();
                        }
                      }}
                      disabled={loading}
                      className="border-end-0"
                      style={{ borderRadius: "20px 0 0 20px" }}
                    />
                    <Button
                      variant="success"
                      onClick={sendMessage}
                      disabled={loading || !newMessage.trim()}
                      style={{ borderRadius: "0 20px 20px 0" }}
                    >
                      {loading ? "Sending..." : <BsSend />}
                    </Button>
                  </InputGroup>
                </Card.Footer>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerWhatsAppChat;
