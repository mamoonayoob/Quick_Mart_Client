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
  BsShieldCheck,
  BsTruck,
} from "react-icons/bs";
import { toast } from "react-toastify";

const WhatsAppCustomerMessages = () => {
  const [allUsers, setAllUsers] = useState({
    vendors: [],
    admins: [],
    deliveryBoys: [],
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("vendors");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
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

  // Fetch all user types (vendors, admins, delivery boys)
  const fetchAllUsers = async () => {
    try {
      console.log("👥 Fetching all users for universal messaging...");
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

      // Fetch delivery boys
      const deliveryResponse = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/delivery-boys/directory",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const deliveryData = await deliveryResponse.json();

      console.log("📊 All users response:", {
        vendors: vendorsData.success ? vendorsData.data?.length : 0,
        admins: adminsData.success ? adminsData.data?.length : 0,
        deliveryBoys: deliveryData.success ? deliveryData.data?.length : 0,
      });

      // Update state with all user types
      setAllUsers({
        vendors: vendorsData.success ? vendorsData.data || [] : [],
        admins: adminsData.success ? adminsData.data || [] : [],
        deliveryBoys: deliveryData.success ? deliveryData.data || [] : [],
      });

      console.log("✅ Loaded all users successfully");
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      toast.error("Error loading users");
    }
  };

  // Fetch conversation messages with selected user
  const fetchMessages = async (userId) => {
    if (!userId) return;

    try {
      console.log("📨 Fetching messages with user:", userId);
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
      console.log("📨 Messages response:", data);

      if (data.success) {
        setMessages(data.data || []);
        console.log("✅ Loaded messages:", data.data?.length || 0);
      } else {
        console.error("❌ Failed to fetch messages:", data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    }
  };

  // Send message to selected user (vendor, admin, or delivery boy)
  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) {
      toast.error("Please select a user and enter a message");
      return;
    }

    try {
      setLoading(true);

      // Determine the API endpoint based on user role
      let apiEndpoint = "";
      let requestBody = {};

      if (selectedUser.role === "vendor") {
        apiEndpoint =
          "https://nextgenretail.site/quickmart/api/messages/customer-to-vendor/general";
        requestBody = {
          vendorId: selectedUser._id,
          content: newMessage.trim(),
        };
      } else if (selectedUser.role === "admin") {
        apiEndpoint =
          "https://nextgenretail.site/quickmart/api/messages/customer-to-admin/general";
        requestBody = {
          adminId: selectedUser._id,
          content: newMessage.trim(),
        };
      } else if (
        selectedUser.role === "deliveryman" ||
        selectedUser.role === "delivery"
      ) {
        apiEndpoint =
          "https://nextgenretail.site/quickmart/api/messages/customer-to-delivery/general";
        requestBody = {
          deliveryId: selectedUser._id,
          content: newMessage.trim(),
        };
      }

      console.log("📤 Sending message to user:", {
        userId: selectedUser._id,
        userName: selectedUser.businessName || selectedUser.name,
        userRole: selectedUser.role,
        content: newMessage.trim(),
        endpoint: apiEndpoint,
      });

      const token = getAuthToken();

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("📤 Send message response:", data);

      if (data.success) {
        console.log("🎉 Message sent successfully!");
        toast.success(
          `Message sent to ${selectedUser.businessName || selectedUser.name}!`
        );
        setNewMessage("");

        // Refresh messages immediately
        await fetchMessages(selectedUser._id);
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
  const selectUser = async (user) => {
    console.log(
      "👤 Selecting user:",
      user.businessName || user.name,
      "- Role:",
      user.role
    );
    setSelectedUser(user);
    await fetchMessages(user._id);
  };

  // Get current user list based on active tab
  const getCurrentUserList = () => {
    return allUsers[activeTab] || [];
  };

  // Filter users based on search term and active tab
  const filteredUsers = getCurrentUserList().filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.businessName &&
        user.businessName.toLowerCase().includes(searchLower)) ||
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  // Get user type icon based on role
  const getUserIcon = (role) => {
    switch (role) {
      case "vendor":
        return <BsShop />;
      case "admin":
        return <BsShieldCheck />;
      case "deliveryman":
      case "delivery":
        return <BsTruck />;
      default:
        return <BsPerson />;
    }
  };

  // Get user type label
  const getUserTypeLabel = (role) => {
    switch (role) {
      case "vendor":
        return "Vendor";
      case "admin":
        return "Admin";
      case "deliveryman":
      case "delivery":
        return "Delivery";
      default:
        return "User";
    }
  };

  // Auto-refresh messages every 3 seconds when a user is selected
  useEffect(() => {
    if (selectedUser) {
      const interval = setInterval(() => {
        fetchMessages(selectedUser._id);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  // Auto-refresh user lists every 10 seconds to get new registered users
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllUsers();
    }, 200000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return (
    <Container fluid className="py-3" style={{ height: "90vh" }}>
      <Row className="h-100">
        {/* Universal User List Sidebar */}
        <Col md={4} className="border-end">
          <Card className="h-100">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <BsPerson className="me-2" />
                Universal Messages
              </h5>
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

              {/* User Type Tabs */}
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => {
                  setActiveTab(k);
                  setSearchTerm(""); // Clear search when switching tabs
                  setSelectedUser(null); // Clear selected user
                }}
                className="px-3 pt-2"
                variant="pills"
              >
                <Tab
                  eventKey="vendors"
                  title={
                    <span>
                      <BsShop className="me-1" />
                      Vendors ({allUsers.vendors.length})
                    </span>
                  }
                />
                <Tab
                  eventKey="admins"
                  title={
                    <span>
                      <BsShieldCheck className="me-1" />
                      Admins ({allUsers.admins.length})
                    </span>
                  }
                />
                <Tab
                  eventKey="deliveryBoys"
                  title={
                    <span>
                      <BsTruck className="me-1" />
                      Delivery ({allUsers.deliveryBoys.length})
                    </span>
                  }
                />
              </Tabs>

              {/* User List */}
              <div
                style={{ height: "calc(100vh - 320px)", overflowY: "auto" }}
                className="mt-2"
              >
                {filteredUsers.length === 0 ? (
                  <Alert variant="light" className="m-3">
                    <small>No {activeTab} found</small>
                  </Alert>
                ) : (
                  <ListGroup variant="flush">
                    {filteredUsers.map((user) => (
                      <ListGroup.Item
                        key={user._id}
                        action
                        onClick={() => selectUser(user)}
                        className={`p-3 border-bottom ${
                          selectedUser?._id === user._id ? "bg-light" : ""
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className={`rounded-circle text-white d-flex align-items-center justify-content-center me-3 ${
                              user.role === "vendor"
                                ? "bg-success"
                                : user.role === "admin"
                                ? "bg-danger"
                                : "bg-warning"
                            }`}
                            style={{
                              width: "40px",
                              height: "40px",
                              fontSize: "16px",
                            }}
                          >
                            {(user.businessName || user.name)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              {user.businessName || user.name}
                            </h6>
                            <small className="text-muted">{user.email}</small>
                            <div>
                              <Badge
                                bg={
                                  user.role === "vendor"
                                    ? "success"
                                    : user.role === "admin"
                                    ? "danger"
                                    : "warning"
                                }
                                className="small"
                              >
                                {getUserTypeLabel(user.role)}
                              </Badge>
                            </div>
                          </div>
                          {getUserIcon(user.role)}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Chat Area */}
        <Col md={8}>
          <Card className="h-100">
            {!selectedUser ? (
              <Card.Body className="d-flex align-items-center justify-content-center">
                <div className="text-center text-muted">
                  <BsChat size={60} className="mb-3" />
                  <h5>Select a user to start messaging</h5>
                  <p>
                    Choose any vendor, admin, or delivery person to begin your
                    conversation
                  </p>
                </div>
              </Card.Body>
            ) : (
              <>
                {/* Chat Header */}
                <Card.Header className="bg-light border-bottom">
                  <div className="d-flex align-items-center">
                    <div
                      className={`rounded-circle text-white d-flex align-items-center justify-content-center me-3 ${
                        selectedUser.role === "vendor"
                          ? "bg-success"
                          : selectedUser.role === "admin"
                          ? "bg-danger"
                          : "bg-warning"
                      }`}
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "16px",
                      }}
                    >
                      {(selectedUser.businessName || selectedUser.name)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0">
                        {selectedUser.businessName || selectedUser.name}
                      </h6>
                      <small className="text-muted">{selectedUser.email}</small>
                      <div>
                        <Badge
                          bg={
                            selectedUser.role === "vendor"
                              ? "success"
                              : selectedUser.role === "admin"
                              ? "danger"
                              : "warning"
                          }
                          className="small"
                        >
                          {getUserTypeLabel(selectedUser.role)}
                        </Badge>
                      </div>
                    </div>
                    {getUserIcon(selectedUser.role)}
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
                  {messages.length === 0 ? (
                    <div className="text-center text-muted mt-5">
                      <BsChat size={40} className="mb-3" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div>
                      {messages.map((message, index) => {
                        const isMyMessage =
                          message.sender._id === currentUserId;
                        return (
                          <div
                            key={message._id || index}
                            className={`mb-3 d-flex ${
                              isMyMessage
                                ? "justify-content-end"
                                : "justify-content-start"
                            }`}
                          >
                            <div
                              className={`p-3 rounded-3 max-width-70 ${
                                isMyMessage
                                  ? "bg-primary text-white"
                                  : "bg-white border"
                              }`}
                              style={{ maxWidth: "70%" }}
                            >
                              <div className="mb-1">{message.content}</div>
                              <small
                                className={`${
                                  isMyMessage ? "text-light" : "text-muted"
                                }`}
                              >
                                {new Date(message.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </Card.Body>

                {/* Message Input */}
                <Card.Footer className="bg-white border-top">
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !loading) {
                          sendMessage();
                        }
                      }}
                      disabled={loading}
                    />
                    <Button
                      variant="primary"
                      onClick={sendMessage}
                      disabled={loading || !newMessage.trim()}
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

export default WhatsAppCustomerMessages;
