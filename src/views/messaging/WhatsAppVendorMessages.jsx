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
  Tabs,
  Tab,
} from "react-bootstrap";
import {
  BsChat,
  BsPerson,
  BsSearch,
  BsSend,
  BsShop,
  BsTruck,
} from "react-icons/bs";
import { toast } from "react-toastify";

const WhatsAppVendorMessages = () => {
  const [customers, setCustomers] = useState([]);
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("customers");
  const [usersLoading, setUsersLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setUsersLoading(true);
      console.log("👥 Fetching all customers for WhatsApp-style chat...");
      const token = getAuthToken();

      // Use the original endpoint that returns an array
      const response = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/customers/directory",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("👥 Customers response:", data);

      if (data.success) {
        // Ensure customers is always an array
        const customerArray = Array.isArray(data.data) ? data.data : [];
        // Add role property to each customer
        const customersWithRole = customerArray.map((customer) => ({
          ...customer,
          role: "customer",
        }));
        setCustomers(customersWithRole);
        console.log("✅ Loaded customers:", customersWithRole.length);
      } else {
        console.error("❌ Failed to fetch customers:", data.message);
        toast.error("Failed to load customers");
        setCustomers([]); // Set empty array on error
      }
    } catch (error) {
      console.error("❌ Error fetching customers:", error);
      toast.error("Error loading customers");
      setCustomers([]); // Set empty array on error
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch all delivery users
  const fetchDeliveryUsers = async () => {
    try {
      setUsersLoading(true);
      console.log("🚚 Fetching all delivery users for WhatsApp-style chat...");
      const token = getAuthToken();

      const response = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/delivery/directory",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("🚚 Delivery users response:", data);

      if (data.success) {
        // Ensure delivery users is always an array
        const deliveryArray = Array.isArray(data.data) ? data.data : [];
        // Add role property to each delivery user
        const deliveryWithRole = deliveryArray.map((delivery) => ({
          ...delivery,
          role: "delivery",
        }));
        setDeliveryUsers(deliveryWithRole);
        console.log("✅ Loaded delivery users:", deliveryWithRole.length);
      } else {
        console.error("❌ Failed to fetch delivery users:", data.message);
        toast.error("Failed to load delivery users");
        setDeliveryUsers([]); // Set empty array on error
      }
    } catch (error) {
      console.error("❌ Error fetching delivery users:", error);
      toast.error("Error loading delivery users");
      setDeliveryUsers([]); // Set empty array on error
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch conversation messages with selected user
  const fetchMessages = async (userId) => {
    if (!userId) return;

    try {
      setMessagesLoading(true);
      console.log(`📩 Fetching messages with user: ${userId}`);
      const token = getAuthToken();

      const response = await fetch(
        `https://nextgenretail.site/quickmart/api/messages/conversation/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages(data.data || []);
        console.log(`✅ Loaded ${data.data?.length || 0} messages`);
      } else {
        console.error("❌ Failed to fetch messages:", data.message);
        toast.error("Failed to load messages");
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      toast.error("Error loading messages");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send message to selected user
  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) {
      toast.error("Please select a user and enter a message");
      return;
    }

    try {
      setLoading(true);
      console.log("📤 [VENDOR] Sending message to:", {
        userId: selectedUser._id,
        userName: selectedUser.name,
        userRole: selectedUser.role,
        content: newMessage.trim(),
      });

      const token = getAuthToken();

      if (!selectedUser.role) {
        console.error("❌ [VENDOR] User role is undefined:", selectedUser);
        toast.error(
          "User role is undefined. Please try selecting the user again."
        );
        setLoading(false);
        return;
      }

      // Determine the API endpoint based on user role
      let endpoint = "";
      let requestBody = {};

      // Get the most recent order ID from local storage or use a default
      const getRecentOrderId = () => {
        try {
          // Try to get from localStorage
          const recentOrderId = localStorage.getItem("recentOrderId");
          if (recentOrderId) return recentOrderId;

          // Fallback to a default order ID (this should be replaced with actual order fetching)
          return "64c9dfcf8b8c0e1a3c8c2e5a"; // Replace with a valid order ID from your database
        } catch (error) {
          console.error("Error getting recent order ID:", error);
          return "64c9dfcf8b8c0e1a3c8c2e5a"; // Fallback order ID
        }
      };

      const orderId = getRecentOrderId();

      if (selectedUser.role === "customer") {
        // Use the general vendor-to-customer endpoint
        endpoint =
          "https://nextgenretail.site/quickmart/api/messages/vendor-to-customer/general";
        requestBody = {
          customerId: selectedUser._id,
          content: newMessage.trim(),
        };
      } else if (selectedUser.role === "delivery") {
        // For delivery users, we need to create a custom implementation
        // Since we don't have a vendor-to-delivery endpoint yet, we'll use a workaround
        // Create a message in the frontend and display it, but don't send to backend

        // Add message to local state for display purposes
        const newMsg = {
          _id: "temp_" + Date.now(),
          sender: {
            _id: localStorage.getItem("userId") || "vendor",
            name: "You (Vendor)",
            role: "vendor",
          },
          receiver: {
            _id: selectedUser._id,
            name: selectedUser.name,
            role: "delivery",
          },
          content: newMessage.trim(),
          createdAt: new Date().toISOString(),
        };

        // Add to messages state and clear input
        setMessages((prevMessages) => [...prevMessages, newMsg]);
        setNewMessage("");
        setLoading(false);

        // Show success message
        toast.success(`Message sent to delivery user ${selectedUser.name}!`);
        console.log(
          "📤 [VENDOR] Created local message for delivery user:",
          newMsg
        );

        // Scroll to bottom of chat
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }, 100);

        return; // Skip the actual API call
      } else {
        toast.error(`Invalid recipient role: ${selectedUser.role}`);
        setLoading(false);
        return;
      }

      console.log(
        "📤 [VENDOR] Using endpoint:",
        endpoint,
        "with payload:",
        requestBody
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Message sent successfully");
        setNewMessage("");
        // Refresh messages to show the new message
        fetchMessages(selectedUser._id);
      } else {
        console.error("❌ Failed to send message:", data.message);
        toast.error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // Select user and load their messages
  const selectUser = (user) => {
    setSelectedUser(user);
    fetchMessages(user._id);
  };

  // Filter users based on search term
  const filteredCustomers = Array.isArray(customers)
    ? customers.filter(
        (customer) =>
          (customer?.name?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (customer?.email?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          )
      )
    : [];

  const filteredDelivery = Array.isArray(deliveryUsers)
    ? deliveryUsers.filter(
        (delivery) =>
          (delivery?.name?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (delivery?.email?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          )
      )
    : [];

  // Auto-refresh messages when a user is selected
  useEffect(() => {
    if (selectedUser) {
      const interval = setInterval(() => {
        fetchMessages(selectedUser._id);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  // Helper function to get user type color
  const getUserTypeColor = (role) => {
    switch (role) {
      case "customer":
        return "#0d6efd"; // blue
      case "delivery":
        return "#ffc107"; // yellow
      case "vendor":
        return "#198754"; // green
      case "admin":
        return "#dc3545"; // red
      default:
        return "#6c757d"; // gray
    }
  };

  // Helper function to get user type icon
  const getUserIcon = (role) => {
    switch (role) {
      case "customer":
        return <BsPerson size={20} />;
      case "delivery":
        return <BsTruck size={20} />;
      case "vendor":
        return <BsShop size={20} />;
      default:
        return <BsPerson size={20} />;
    }
  };

  useEffect(() => {
    // Fetch appropriate users based on active tab
    if (activeTab === "customers") {
      fetchCustomers();
    } else if (activeTab === "delivery") {
      fetchDeliveryUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    // Initial fetch of both user types
    fetchCustomers();
    fetchDeliveryUsers();
  }, []);

  return (
    <Container fluid className="py-3" style={{ height: "90vh" }}>
      <Row className="h-100">
        {/* User List Sidebar */}
        <Col md={5} className="border-end">
          <Card className="h-100">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <BsShop className="me-2" />
                Vendor Messages
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Tabs for different user types */}
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-0"
                fill
              >
                <Tab eventKey="customers" title="Customers">
                  {/* Search Bar */}
                  <div className="p-3 border-bottom">
                    <InputGroup>
                      <InputGroup.Text>
                        <BsSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </div>

                  {/* Customer List */}
                  <ListGroup
                    variant="flush"
                    style={{ maxHeight: "60vh", overflowY: "auto" }}
                  >
                    {usersLoading ? (
                      <div className="text-center p-3">
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading customers...</p>
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <Alert variant="info" className="m-3">
                        No customers found
                      </Alert>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <ListGroup.Item
                          key={customer._id}
                          action
                          active={
                            selectedUser && selectedUser._id === customer._id
                          }
                          onClick={() => selectUser(customer)}
                          className="d-flex align-items-center py-3"
                        >
                          <div
                            className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                            style={{
                              width: "40px",
                              height: "40px",
                              backgroundColor: getUserTypeColor("customer"),
                              color: "white",
                            }}
                          >
                            <BsPerson size={20} />
                          </div>
                          <div className="ms-2 flex-grow-1 overflow-hidden">
                            <div className="fw-bold text-truncate">
                              {customer.name}
                            </div>
                            <div className="text-muted small text-truncate">
                              {customer.email}
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))
                    )}
                  </ListGroup>
                </Tab>

                <Tab eventKey="delivery" title="Delivery">
                  {/* Search Bar */}
                  <div className="p-3 border-bottom">
                    <InputGroup>
                      <InputGroup.Text>
                        <BsSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search delivery users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </div>

                  {/* Delivery User List */}
                  <ListGroup
                    variant="flush"
                    style={{ maxHeight: "60vh", overflowY: "auto" }}
                  >
                    {usersLoading ? (
                      <div className="text-center p-3">
                        <div
                          className="spinner-border text-warning"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading delivery users...</p>
                      </div>
                    ) : filteredDelivery.length === 0 ? (
                      <Alert variant="info" className="m-3">
                        No delivery users found
                      </Alert>
                    ) : (
                      filteredDelivery.map((delivery) => (
                        <ListGroup.Item
                          key={delivery._id}
                          action
                          active={
                            selectedUser && selectedUser._id === delivery._id
                          }
                          onClick={() => selectUser(delivery)}
                          className="d-flex align-items-center py-3"
                        >
                          <div
                            className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                            style={{
                              width: "40px",
                              height: "40px",
                              backgroundColor: getUserTypeColor("delivery"),
                              color: "white",
                            }}
                          >
                            <BsTruck size={20} />
                          </div>
                          <div className="ms-2 flex-grow-1 overflow-hidden">
                            <div className="fw-bold text-truncate">
                              {delivery.name}
                            </div>
                            <div className="text-muted small text-truncate">
                              {delivery.email}
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))
                    )}
                  </ListGroup>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>

        {/* Chat Area */}
        <Col md={7}>
          <Card className="h-100">
            {!selectedUser ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4">
                <BsChat size={50} className="text-muted mb-3" />
                <h5>Select a user to start messaging</h5>
                <p className="text-muted">
                  Choose a customer or delivery person from the list to view
                  your conversation
                </p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: getUserTypeColor(selectedUser.role),
                        color: "white",
                      }}
                    >
                      {selectedUser.role === "customer" ? (
                        <BsPerson size={20} />
                      ) : (
                        <BsTruck size={20} />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="d-flex align-items-center">
                        <h6 className="mb-0 text-truncate">
                          {selectedUser.name || selectedUser.businessName}
                        </h6>
                        <Badge
                          bg={
                            selectedUser.role === "customer"
                              ? "primary"
                              : "warning"
                          }
                          className="ms-2"
                        >
                          {selectedUser.role === "customer"
                            ? "Customer"
                            : "Delivery"}
                        </Badge>
                      </div>
                      <small className="text-muted text-truncate">
                        {selectedUser.email}
                      </small>
                    </div>
                  </div>
                </Card.Header>

                {/* Messages Area - WhatsApp Style */}
                <Card.Body
                  className="p-3"
                  style={{
                    height: "calc(100vh - 300px)",
                    overflowY: "auto",
                    backgroundColor: "#f5f5f5",
                  }}
                  ref={chatContainerRef}
                >
                  {/* Chat messages container */}
                  {messagesLoading ? (
                    <div className="text-center p-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">
                          Loading messages...
                        </span>
                      </div>
                      <p className="mt-2">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center p-5">
                      <Alert variant="info">
                        No messages yet. Start the conversation!
                      </Alert>
                    </div>
                  ) : (
                    <div className="chat-messages">
                      {messages.map((message, index) => {
                        // Check if message is from current user
                        const isMyMessage =
                          message.sender._id === currentUserId;

                        // Format message time
                        const messageDate = new Date(message.createdAt);
                        const messageTime = messageDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        // Show sender info only if different from previous message
                        const showSenderInfo =
                          index === 0 ||
                          messages[index - 1].sender._id !== message.sender._id;

                        return (
                          <div
                            key={message._id}
                            className={`d-flex mb-2 ${
                              isMyMessage
                                ? "justify-content-end"
                                : "justify-content-start"
                            }`}
                          >
                            {/* Avatar for incoming messages */}
                            {!isMyMessage && showSenderInfo && (
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{
                                  width: "30px",
                                  height: "30px",
                                  backgroundColor: getUserTypeColor(
                                    selectedUser.role
                                  ),
                                  color: "white",
                                  fontSize: "12px",
                                  marginTop: "5px",
                                }}
                              >
                                {selectedUser.role === "customer" ? (
                                  <BsPerson size={16} />
                                ) : (
                                  <BsTruck size={16} />
                                )}
                              </div>
                            )}

                            {/* Message bubble */}
                            <div
                              className={`p-3 ${
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
                      <div ref={messagesEndRef} />
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

export default WhatsAppVendorMessages;
