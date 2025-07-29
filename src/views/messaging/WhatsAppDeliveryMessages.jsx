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
  Spinner,
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

const WhatsAppDeliveryMessages = () => {
  const [allUsers, setAllUsers] = useState({
    vendors: [],
    admins: [],
    customers: [],
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("vendors");
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = JSON.parse(localStorage.getItem("user"))?.id;
  const messageRefreshInterval = useRef(null);
  const userRefreshInterval = useRef(null);

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

  // Initialize data and set up intervals
  useEffect(() => {
    fetchAllUsers();

    // Set up user refresh interval (every 30 seconds)
    userRefreshInterval.current = setInterval(() => {
      fetchAllUsers();
    }, 300000);

    return () => {
      if (messageRefreshInterval.current) {
        clearInterval(messageRefreshInterval.current);
      }
      if (userRefreshInterval.current) {
        clearInterval(userRefreshInterval.current);
      }
    };
  }, []);

  // Set up message refresh when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);

      // Set up message refresh interval (every 3 seconds)
      messageRefreshInterval.current = setInterval(() => {
        fetchMessages(selectedUser._id);
      }, 30000);
    } else {
      if (messageRefreshInterval.current) {
        clearInterval(messageRefreshInterval.current);
      }
    }

    return () => {
      if (messageRefreshInterval.current) {
        clearInterval(messageRefreshInterval.current);
      }
    };
  }, [selectedUser]);

  // Fetch all user types (vendors, admins, customers)
  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      console.log(
        "👥 [DELIVERY] Fetching all users for universal messaging..."
      );
      const token = getAuthToken();

      // Fetch vendors
      const vendorsResponse = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/vendors/directory",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const vendorsData = await vendorsResponse.json();

      // Fetch admins
      const adminsResponse = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/admins/directory",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const adminsData = await adminsResponse.json();

      // Fetch customers
      const customersResponse = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/customers/directory",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const customersData = await customersResponse.json();

      console.log("📊 [DELIVERY] All users response:", {
        vendors: vendorsData.success ? vendorsData.data?.length : 0,
        admins: adminsData.success ? adminsData.data?.length : 0,
        customers: customersData.success ? customersData.data?.length : 0,
      });

      // Explicitly set roles for each user type
      const vendors = vendorsData.success
        ? vendorsData.data.map((vendor) => ({
            ...vendor,
            role: "vendor",
          }))
        : [];

      const admins = adminsData.success
        ? adminsData.data.map((admin) => ({
            ...admin,
            role: "admin",
          }))
        : [];

      const customers = customersData.success
        ? customersData.data.map((customer) => ({
            ...customer,
            role: "customer",
          }))
        : [];

      // Update state with all user types with explicit roles
      setAllUsers({
        vendors,
        admins,
        customers,
      });

      console.log("✅ [DELIVERY] Loaded all users with explicit roles:", {
        vendors: vendors.length,
        admins: admins.length,
        customers: customers.length,
      });
    } catch (error) {
      console.error("❌ [DELIVERY] Error fetching users:", error);
      toast.error("Error loading users");
      setAllUsers({ vendors: [], admins: [], customers: [] });
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch conversation messages with selected user
  const fetchMessages = async (userId) => {
    if (!userId) return;

    try {
      setMessagesLoading(true);
      console.log("📨 [DELIVERY] Fetching messages with user:", userId);
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
      console.log("📨 [DELIVERY] Messages response:", data);

      if (data.success) {
        setMessages(data.data || []);
        console.log("✅ [DELIVERY] Loaded messages:", data.data?.length || 0);
      } else {
        console.error("❌ [DELIVERY] Failed to fetch messages:", data.message);
        setMessages([]);
      }
    } catch (error) {
      console.error("❌ [DELIVERY] Error fetching messages:", error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send message to selected user (vendor, admin, or customer)
  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) {
      toast.error("Please select a user and enter a message");
      return;
    }

    try {
      setLoading(true);
      console.log("📤 [DELIVERY] Sending message to user:", {
        userId: selectedUser._id,
        userName: selectedUser.businessName || selectedUser.name,
        userRole: selectedUser.role,
        content: newMessage.trim(),
      });

      const token = getAuthToken();

      if (!selectedUser.role) {
        console.error("❌ [DELIVERY] User role is undefined:", selectedUser);
        toast.error(
          "User role is undefined. Please try selecting the user again."
        );
        setLoading(false);
        return;
      }

      // Use direct API endpoints for better compatibility
      let endpoint = "";
      const requestBody = {
        content: newMessage.trim(),
      };

      // Set endpoint and request body based on recipient role
      if (selectedUser.role === "vendor") {
        endpoint =
          "https://nextgenretail.site/quickmart/api/messages/delivery-to-vendor/general";
        requestBody.vendorId = selectedUser._id;
      } else if (selectedUser.role === "admin") {
        endpoint =
          "https://nextgenretail.site/quickmart/api/messages/delivery-to-admin/general";
        requestBody.adminId = selectedUser._id;
      } else if (selectedUser.role === "customer") {
        endpoint =
          "https://nextgenretail.site/quickmart/api/messages/delivery-to-customer/general";
        requestBody.customerId = selectedUser._id;
      } else {
        toast.error(`Invalid recipient role: ${selectedUser.role}`);
        setLoading(false);
        return;
      }

      console.log("📤 [DELIVERY] Using direct endpoint:", {
        endpoint,
        requestBody,
        recipientRole: selectedUser.role,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("📤 [DELIVERY] Send message response:", data);

      if (data.success) {
        setNewMessage("");
        toast.success("Message sent successfully!");
        // Immediately refresh messages to show the new message
        fetchMessages(selectedUser._id);
      } else {
        console.error("❌ [DELIVERY] Failed to send message:", data.message);
        toast.error(data.message || "Failed to send message");
      }
    } catch (error) {
      console.error("❌ [DELIVERY] Error sending message:", error);
      toast.error("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // Select user and load their messages
  const selectUser = (user) => {
    console.log(
      "👤 [DELIVERY] Selecting user:",
      user.businessName || user.name,
      user.role
    );
    setSelectedUser(user);
    setMessages([]); // Clear previous messages
    // fetchMessages will be called by useEffect when selectedUser changes
  };

  // Get current user list based on active tab
  const getCurrentUserList = () => {
    const currentList = allUsers[activeTab] || [];

    if (!searchTerm) return currentList;

    return currentList.filter(
      (user) =>
        (user.name &&
          user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.businessName &&
          user.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email &&
          user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Get total user count for badge display
  const getTotalUserCount = () => {
    return (
      (allUsers.vendors?.length || 0) +
      (allUsers.admins?.length || 0) +
      (allUsers.customers?.length || 0)
    );
  };

  // Get user type icon based on role
  const getUserIcon = (role) => {
    switch (role) {
      case "vendor":
        return <BsShop className="text-success" size={20} />;
      case "admin":
        return <BsShieldCheck className="text-danger" size={20} />;
      case "customer":
        return <BsPerson className="text-primary" size={20} />;
      default:
        return <BsPerson className="text-muted" size={20} />;
    }
  };

  // Get user type color for badges
  const getUserTypeColor = (role) => {
    switch (role) {
      case "vendor":
        return "success";
      case "admin":
        return "danger";
      case "customer":
        return "primary";
      default:
        return "secondary";
    }
  };

  // Get user type label
  const getUserTypeLabel = (role) => {
    switch (role) {
      case "vendor":
        return "Vendor";
      case "admin":
        return "Admin";
      case "customer":
        return "Customer";
      default:
        return "User";
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        {/* User List Sidebar */}
        <Col md={5}>
          <Card className="mb-3 mb-md-0 h-100">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">
                  <BsTruck className="me-2" />
                  Delivery Messages
                </h5>
                <Badge bg="light" text="dark">
                  {getTotalUserCount()}
                </Badge>
              </div>
            </Card.Header>

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

              {/* Loading State for Users */}
              {usersLoading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 mb-0">Loading users...</p>
                </div>
              ) : (
                /* User Type Tabs */
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="border-bottom-0"
                >
                  <Tab
                    eventKey="vendors"
                    title={
                      <span>
                        <BsShop className="me-1" />
                        Vendors ({allUsers.vendors?.length || 0})
                      </span>
                    }
                  >
                    <div
                      style={{
                        height: "calc(100vh - 400px)",
                        overflowY: "auto",
                      }}
                    >
                      {getCurrentUserList().length === 0 ? (
                        <div className="text-center text-muted p-4">
                          <BsShop size={40} className="mb-3 text-success" />
                          <p>
                            {searchTerm
                              ? "No vendors match your search"
                              : "No vendors available"}
                          </p>
                        </div>
                      ) : (
                        <ListGroup variant="flush">
                          {getCurrentUserList().map((user) => (
                            <ListGroup.Item
                              key={user._id}
                              action
                              onClick={() => selectUser(user)}
                              className={`d-flex align-items-center p-3 ${
                                selectedUser?._id === user._id
                                  ? "bg-light border-primary"
                                  : ""
                              }`}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="me-3">
                                {getUserIcon(user.role)}
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1">
                                  {user.businessName || user.name}
                                </h6>
                                <small className="text-muted">
                                  {user.email}
                                </small>
                              </div>
                              <Badge bg={getUserTypeColor(user.role)}>
                                {getUserTypeLabel(user.role)}
                              </Badge>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </div>
                  </Tab>

                  <Tab
                    eventKey="admins"
                    title={
                      <span>
                        <BsShieldCheck className="me-1" />
                        Admins ({allUsers.admins?.length || 0})
                      </span>
                    }
                  >
                    <div
                      style={{
                        height: "calc(100vh - 400px)",
                        overflowY: "auto",
                      }}
                    >
                      {getCurrentUserList().length === 0 ? (
                        <div className="text-center text-muted p-4">
                          <BsShieldCheck
                            size={40}
                            className="mb-3 text-danger"
                          />
                          <p>
                            {searchTerm
                              ? "No admins match your search"
                              : "No admins available"}
                          </p>
                        </div>
                      ) : (
                        <ListGroup variant="flush">
                          {getCurrentUserList().map((user) => (
                            <ListGroup.Item
                              key={user._id}
                              action
                              onClick={() => selectUser(user)}
                              className={`d-flex align-items-center p-3 ${
                                selectedUser?._id === user._id
                                  ? "bg-light border-primary"
                                  : ""
                              }`}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="me-3">
                                {getUserIcon(user.role)}
                              </div>
                              <div
                                className="flex-grow-1"
                                style={{
                                  width: "calc(100% - 80px)",
                                  overflow: "hidden",
                                }}
                              >
                                <h6 className="mb-1 text-truncate">
                                  {user.businessName || user.name}
                                </h6>
                                <small className="text-muted text-truncate d-block">
                                  {user.email}
                                </small>
                              </div>
                              <Badge bg={getUserTypeColor(user.role)}>
                                {getUserTypeLabel(user.role)}
                              </Badge>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </div>
                  </Tab>

                  <Tab
                    eventKey="customers"
                    title={
                      <span>
                        <BsPerson className="me-1" />
                        Customers ({allUsers.customers?.length || 0})
                      </span>
                    }
                  >
                    <div
                      style={{
                        height: "calc(100vh - 400px)",
                        overflowY: "auto",
                      }}
                    >
                      {getCurrentUserList().length === 0 ? (
                        <div className="text-center text-muted p-4">
                          <BsPerson size={40} className="mb-3 text-primary" />
                          <p>
                            {searchTerm
                              ? "No customers match your search"
                              : "No customers available"}
                          </p>
                        </div>
                      ) : (
                        <ListGroup variant="flush">
                          {getCurrentUserList().map((user) => (
                            <ListGroup.Item
                              key={user._id}
                              action
                              onClick={() => selectUser(user)}
                              className={`d-flex align-items-center p-3 ${
                                selectedUser?._id === user._id
                                  ? "bg-light border-primary"
                                  : ""
                              }`}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="me-3">
                                {getUserIcon(user.role)}
                              </div>
                              <div
                                className="flex-grow-1"
                                style={{
                                  width: "calc(100% - 80px)",
                                  overflow: "hidden",
                                }}
                              >
                                <h6 className="mb-1 text-truncate">
                                  {user.businessName || user.name}
                                </h6>
                                <small className="text-muted text-truncate d-block">
                                  {user.email}
                                </small>
                              </div>
                              <Badge bg={getUserTypeColor(user.role)}>
                                {getUserTypeLabel(user.role)}
                              </Badge>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Chat Area */}
        <Col md={7}>
          <Card className="h-100">
            {!selectedUser ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5">
                <BsChat size={50} className="text-muted mb-3" />
                <h5>Select a user to start messaging</h5>
                <p className="text-muted text-center">
                  Choose a vendor, admin, or customer from the list to start a
                  conversation
                </p>
              </div>
            ) : (
              <>
                <Card.Header className="bg-white py-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <div className="me-2">{getUserIcon(selectedUser.role)}</div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0">
                        {selectedUser.businessName || selectedUser.name}
                      </h6>
                      <small className="text-muted">{selectedUser.email}</small>
                      <div>
                        <Badge
                          bg={getUserTypeColor(selectedUser.role)}
                          className="small"
                        >
                          {getUserTypeLabel(selectedUser.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card.Header>

                {/* Messages Area */}
                <Card.Body
                  className="p-3"
                  style={{
                    height: "calc(100vh - 300px)",
                    overflowY: "auto",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  {messagesLoading ? (
                    <div className="text-center p-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2 mb-0">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted mt-5">
                      <BsChat size={40} className="mb-3" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div>
                      {messages.map((message, index) => {
                        const isMyMessage =
                          message.sender._id === currentUserId;
                        const messageTime = new Date(
                          message.createdAt
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={message._id || index}
                            className={`mb-3 d-flex ${
                              isMyMessage
                                ? "justify-content-end"
                                : "justify-content-start"
                            }`}
                          >
                            {/* Add sender avatar for non-user messages */}
                            {!isMyMessage && (
                              <div
                                className="rounded-circle me-2 d-flex align-items-center justify-content-center"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  backgroundColor: getUserTypeColor(
                                    message.sender.role || "customer"
                                  ),
                                  color: "white",
                                  fontSize: "12px",
                                  flexShrink: 0,
                                  marginTop: "2px",
                                }}
                              >
                                {getUserIcon(message.sender.role || "customer")}
                              </div>
                            )}

                            <div
                              className={`p-3 rounded-3 max-width-70 ${
                                isMyMessage
                                  ? "bg-primary text-white"
                                  : "bg-white border"
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
                              {/* Sender name for non-user messages */}
                              {!isMyMessage && (
                                <div
                                  className="fw-bold mb-1"
                                  style={{
                                    fontSize: "12px",
                                    color: getUserTypeColor(
                                      message.sender.role || "customer"
                                    ),
                                  }}
                                >
                                  {message.sender.businessName ||
                                    message.sender.name ||
                                    "User"}
                                </div>
                              )}

                              {/* Message content */}
                              <div
                                className={`${
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
                                    isMyMessage ? "#0d6efd" : "white"
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

                            {/* Add delivery avatar for user messages */}
                            {isMyMessage && (
                              <div
                                className="rounded-circle ms-2 d-flex align-items-center justify-content-center"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  backgroundColor: "#FFC107",
                                  color: "white",
                                  fontSize: "12px",
                                  flexShrink: 0,
                                  marginTop: "2px",
                                }}
                              >
                                <BsTruck />
                              </div>
                            )}
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

export default WhatsAppDeliveryMessages;
