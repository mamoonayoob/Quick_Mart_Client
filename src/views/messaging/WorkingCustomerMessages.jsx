import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  ListGroup,
  Alert,
  Modal,
  Badge,
} from "react-bootstrap";
import { BsChat, BsShop, BsPlus, BsPerson } from "react-icons/bs";
import { toast } from "react-toastify";

const WorkingCustomerMessages = () => {
  const [vendors, setVendors] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [messageContent, setMessageContent] = useState("");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Fetch all vendors
  const fetchVendors = async () => {
    try {
      console.log("🏪 Fetching all vendors...");
      const token = getAuthToken();

      const response = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/vendors/directory",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("🏪 Vendors response:", data);

      if (data.success) {
        setVendors(data.data || []);
        console.log("✅ Loaded vendors:", data.data?.length || 0);
      } else {
        console.error("❌ Failed to fetch vendors:", data.message);
        toast.error("Failed to load vendors");
      }
    } catch (error) {
      console.error("❌ Error fetching vendors:", error);
      toast.error("Error loading vendors");
    }
  };

  // Fetch customer conversations
  const fetchConversations = async () => {
    try {
      console.log("💬 Fetching customer conversations...");
      const token = getAuthToken();

      const response = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/customer/conversations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("💬 Conversations response:", data);

      if (data.success) {
        setConversations(data.data || []);
        console.log("✅ Loaded conversations:", data.data?.length || 0);

        // Auto-refresh conversations every 5 seconds for real-time updates
        setTimeout(() => {
          if (!loading) {
            fetchConversations();
          }
        }, 5000);
      } else {
        console.error("❌ Failed to fetch conversations:", data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
    }
  };

  // Send message to vendor
  const sendMessage = async () => {
    if (!selectedVendor || !messageContent.trim()) {
      toast.error("Please select a vendor and enter a message");
      return;
    }

    try {
      setLoading(true);
      console.log("📤 Sending message:", {
        vendorId: selectedVendor._id,
        vendorName: selectedVendor.name,
        content: messageContent.trim(),
      });

      const token = getAuthToken();

      const response = await fetch(
        "https://nextgenretail.site/quickmart/api/messages/customer-to-vendor/general",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vendorId: selectedVendor._id,
            content: messageContent.trim(),
          }),
        }
      );

      const data = await response.json();
      console.log("📤 Send message response:", data);

      if (data.success) {
        console.log("🎉 Message sent successfully!");
        toast.success(`Message sent to ${selectedVendor.name}!`);
        setMessageContent("");
        setSelectedVendor(null);
        setShowVendorModal(false);

        // Refresh conversations
        await fetchConversations();
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

  // Fetch conversation messages
  const fetchConversationMessages = async (partnerId) => {
    try {
      console.log("📨 Fetching conversation messages with:", partnerId);
      const token = getAuthToken();

      const response = await fetch(
        `https://nextgenretail.site/quickmart/api/messages/conversation/${partnerId}?type=general`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("📨 Conversation messages response:", data);

      if (data.success) {
        setConversationMessages(data.data || []);
        console.log("✅ Loaded conversation messages:", data.data?.length || 0);

        // Auto-refresh conversation messages every 3 seconds for real-time chat
        if (
          selectedConversation &&
          selectedConversation.partnerId === partnerId
        ) {
          setTimeout(() => {
            fetchConversationMessages(partnerId);
          }, 3000);
        }
      } else {
        console.error(
          "❌ Failed to fetch conversation messages:",
          data.message
        );
      }
    } catch (error) {
      console.error("❌ Error fetching conversation messages:", error);
    }
  };

  // Select conversation
  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchConversationMessages(conversation.partnerId);
  };

  useEffect(() => {
    fetchVendors();
    fetchConversations();
  }, []);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <BsChat className="me-2" />
          Customer Messages
        </h2>
        <Button
          variant="primary"
          onClick={() => setShowVendorModal(true)}
          disabled={vendors.length === 0}
        >
          <BsPlus className="me-2" />
          Message Vendor
        </Button>
      </div>

      <Row>
        {/* Vendors List */}
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BsShop className="me-2" />
                All Vendors ({vendors.length})
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
              {vendors.length === 0 ? (
                <Alert variant="info">
                  <small>Loading vendors...</small>
                </Alert>
              ) : (
                <ListGroup variant="flush">
                  {vendors.map((vendor) => (
                    <ListGroup.Item
                      key={vendor._id}
                      className="d-flex justify-content-between align-items-center p-2"
                    >
                      <div>
                        <h6 className="mb-1">{vendor.name}</h6>
                        <small className="text-muted">{vendor.email}</small>
                        {vendor.businessName && (
                          <div>
                            <small className="text-info">
                              {vendor.businessName}
                            </small>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setShowVendorModal(true);
                        }}
                      >
                        <BsChat />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Conversations List */}
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BsChat className="me-2" />
                My Conversations ({conversations.length})
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
              {conversations.length === 0 ? (
                <Alert variant="light">
                  <small>No conversations yet. Start messaging vendors!</small>
                </Alert>
              ) : (
                <ListGroup variant="flush">
                  {conversations.map((conv) => (
                    <ListGroup.Item
                      key={conv.partnerId}
                      action
                      onClick={() => selectConversation(conv)}
                      className={`p-2 ${
                        selectedConversation?.partnerId === conv.partnerId
                          ? "bg-light"
                          : ""
                      }`}
                    >
                      <div className="d-flex justify-content-between">
                        <div>
                          <h6 className="mb-1">
                            {conv.partner?.businessName ||
                              conv.partner?.name ||
                              "Unknown Vendor"}
                          </h6>
                          <p className="mb-1 text-muted small">
                            {conv.lastMessage?.content?.substring(0, 50) ||
                              "No messages yet"}
                            {conv.lastMessage?.content?.length > 50 && "..."}
                          </p>
                          <small className="text-muted">
                            {conv.lastMessage?.createdAt
                              ? new Date(
                                  conv.lastMessage.createdAt
                                ).toLocaleDateString()
                              : "New conversation"}
                          </small>
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge bg="primary">{conv.unreadCount}</Badge>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Conversation Messages */}
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <BsPerson className="me-2" />
                {selectedConversation
                  ? selectedConversation.partner?.businessName ||
                    selectedConversation.partner?.name ||
                    "Conversation"
                  : "Select Conversation"}
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
              {!selectedConversation ? (
                <Alert variant="light">
                  <small>Select a conversation to view messages</small>
                </Alert>
              ) : conversationMessages.length === 0 ? (
                <Alert variant="light">
                  <small>No messages in this conversation yet</small>
                </Alert>
              ) : (
                <div>
                  {conversationMessages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`mb-2 p-2 rounded ${
                        msg.sender._id === selectedConversation.partnerId
                          ? "bg-light text-start"
                          : "bg-primary text-white text-end"
                      }`}
                    >
                      <div className="small">
                        <strong>
                          {msg.sender._id === selectedConversation.partnerId
                            ? msg.sender.businessName || msg.sender.name
                            : "You"}
                        </strong>
                      </div>
                      <div>{msg.content}</div>
                      <div className="small opacity-75">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Message Vendor Modal */}
      <Modal
        show={showVendorModal}
        onHide={() => setShowVendorModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Send Message to Vendor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedVendor ? (
            <div>
              <Form.Label>Select Vendor to Message</Form.Label>
              <ListGroup style={{ maxHeight: "300px", overflowY: "auto" }}>
                {vendors.map((vendor) => (
                  <ListGroup.Item
                    key={vendor._id}
                    action
                    onClick={() => setSelectedVendor(vendor)}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <h6 className="mb-1">{vendor.name}</h6>
                      <small className="text-muted">{vendor.email}</small>
                      {vendor.businessName && (
                        <div>
                          <small className="text-info">
                            {vendor.businessName}
                          </small>
                        </div>
                      )}
                    </div>
                    <BsChat />
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          ) : (
            <div>
              <Alert variant="info">
                <strong>Messaging:</strong> {selectedVendor.name}
                {selectedVendor.businessName &&
                  ` (${selectedVendor.businessName})`}
              </Alert>

              <Form.Group>
                <Form.Label>Your Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message here..."
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowVendorModal(false);
              setSelectedVendor(null);
              setMessageContent("");
            }}
          >
            Cancel
          </Button>
          {selectedVendor && (
            <Button
              variant="primary"
              onClick={sendMessage}
              disabled={loading || !messageContent.trim()}
            >
              {loading ? "Sending..." : "Send Message"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default WorkingCustomerMessages;
