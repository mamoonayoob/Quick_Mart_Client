/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Modal,
  Alert,
  Spinner,
} from "react-bootstrap";
import {
  BsSearch,
  BsChat,
  BsShop,
  BsStar,
  BsGeoAlt,
  BsPhone,
  BsEnvelope,
} from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { vendorApi } from "../../services/api";
import { sendGeneralMessageToVendor } from "../../services/messageService";
import { toast } from "react-toastify";

const VendorDirectory = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [searchTerm, vendors]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      // Fetch all vendors from the API
      const response = await vendorApi.getAllVendors();
      if (response.data?.success) {
        setVendors(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    if (!searchTerm.trim()) {
      setFilteredVendors(vendors);
    } else {
      const filtered = vendors.filter(
        (vendor) =>
          vendor.businessName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
  };

  const handleMessageVendor = (vendor) => {
    setSelectedVendor(vendor);
    setShowMessageModal(true);
    setMessageContent("");
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setSendingMessage(true);
      await sendGeneralMessageToVendor(
        selectedVendor._id,
        messageContent.trim()
      );
      toast.success("Message sent successfully!");
      setShowMessageModal(false);
      setMessageContent("");

      // Navigate to messages page to continue conversation
      navigate("/messages");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleViewProducts = (vendor) => {
    navigate(`/vendor/${vendor._id}/products`);
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading vendors...</span>
        </Spinner>
        <p className="mt-2">Loading vendors...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <BsShop className="me-2" />
          Vendor Directory
        </h2>
        <Button variant="outline-primary" onClick={() => navigate("/messages")}>
          <BsChat className="me-2" />
          My Messages
        </Button>
      </div>

      {/* Search Bar */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <BsSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search vendors by name, business, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Vendors Grid */}
      <Row>
        {filteredVendors.length === 0 ? (
          <Col xs={12}>
            <Alert variant="info" className="text-center">
              {searchTerm
                ? "No vendors found matching your search."
                : "No vendors available."}
            </Alert>
          </Col>
        ) : (
          filteredVendors.map((vendor) => (
            <Col key={vendor._id} xs={12} md={6} lg={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar-circle me-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          vendor.businessName || vendor.name
                        )}&background=4361ee&color=fff&size=60`}
                        alt={vendor.businessName || vendor.name}
                        className="rounded-circle"
                        width="60"
                        height="60"
                      />
                    </div>
                    <div className="flex-grow-1">
                      <h5 className="mb-1">
                        {vendor.businessName || vendor.name}
                      </h5>
                      <small className="text-muted">{vendor.name}</small>
                    </div>
                  </div>

                  <div className="mb-3">
                    {vendor.email && (
                      <div className="d-flex align-items-center mb-1">
                        <BsEnvelope className="me-2 text-muted" size={14} />
                        <small className="text-muted">{vendor.email}</small>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="d-flex align-items-center mb-1">
                        <BsPhone className="me-2 text-muted" size={14} />
                        <small className="text-muted">{vendor.phone}</small>
                      </div>
                    )}
                    {vendor.address && (
                      <div className="d-flex align-items-center">
                        <BsGeoAlt className="me-2 text-muted" size={14} />
                        <small className="text-muted">{vendor.address}</small>
                      </div>
                    )}
                  </div>

                  {/* Vendor Stats */}
                  <div className="d-flex justify-content-between mb-3">
                    <div className="text-center">
                      <div className="fw-bold text-primary">
                        {vendor.productCount || 0}
                      </div>
                      <small className="text-muted">Products</small>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold text-success">
                        {vendor.orderCount || 0}
                      </div>
                      <small className="text-muted">Orders</small>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold text-warning d-flex align-items-center">
                        <BsStar className="me-1" size={14} />
                        {vendor.rating || "4.5"}
                      </div>
                      <small className="text-muted">Rating</small>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleMessageVendor(vendor)}
                    >
                      <BsChat className="me-2" />
                      Send Message
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleViewProducts(vendor)}
                    >
                      <BsShop className="me-2" />
                      View Products
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Message Modal */}
      <Modal
        show={showMessageModal}
        onHide={() => setShowMessageModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <BsChat className="me-2" />
            Message {selectedVendor?.businessName || selectedVendor?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVendor && (
            <div className="mb-3">
              <div className="d-flex align-items-center">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    selectedVendor.businessName || selectedVendor.name
                  )}&background=4361ee&color=fff&size=50`}
                  alt={selectedVendor.businessName || selectedVendor.name}
                  className="rounded-circle me-3"
                  width="50"
                  height="50"
                />
                <div>
                  <h6 className="mb-0">
                    {selectedVendor.businessName || selectedVendor.name}
                  </h6>
                  <small className="text-muted">{selectedVendor.email}</small>
                </div>
              </div>
            </div>
          )}

          <Form.Group>
            <Form.Label>Your Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              placeholder="Type your message here... (e.g., product inquiry, custom order, general questions)"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              disabled={sendingMessage}
            />
            <Form.Text className="text-muted">
              You can ask about products, pricing, custom orders, or any general
              inquiries.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMessageModal(false)}
            disabled={sendingMessage}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendMessage}
            disabled={sendingMessage || !messageContent.trim()}
          >
            {sendingMessage ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  className="me-2"
                />
                Sending...
              </>
            ) : (
              <>
                <BsChat className="me-2" />
                Send Message
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VendorDirectory;
