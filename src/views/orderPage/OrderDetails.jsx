import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  ListGroup,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderById } from "../../helpers/apiHelpers";

function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // State
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        console.log("Fetching order details for order ID:", orderId);
        setLoading(true);

        // Check if order details are in session storage first (from OrderHistory)
        // const storedOrder = sessionStorage.getItem('selectedOrder');
        // if (storedOrder) {
        //   setOrder(JSON.parse(storedOrder));
        //   // sessionStorage.removeItem('selectedOrder'); // Clear after use
        // } else {
        // Fetch from API if not in session storage
        const data = await getOrderById(orderId);
        setOrder(data?.data);
        // }

        setError(null);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      console.log("User is authenticated");
      fetchOrder();
    } else {
      navigate("/login", { state: { from: `/orders/${orderId}` } });
    }
  }, [orderId, isAuthenticated, navigate]);

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "warning";
      case "processing":
        return "info";
      case "shipped":
        return "primary";
      case "delivered":
        return "success";
      case "placed":
        return "info";
      case "cancelled":
        return "danger";
      default:
        return "secondary";
    }
  };

  // Get payment status badge variant
  const getPaymentBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "warning";
      case "completed":
        return "success";
      case "failed":
        return "danger";
      case "refunded":
        return "info";
      default:
        return "secondary";
    }
  };
  useEffect(() => {
    console.log("Order details:", order);
  }, [order]);
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p>Loading order details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate("/orders/history")}>
          Back to Orders
        </Button>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">Order not found</Alert>
        <Button variant="primary" onClick={() => navigate("/orders/history")}>
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Order Details</h1>
        <Button
          variant="outline-primary"
          onClick={() => navigate("/orders/history")}
        >
          Back to Orders
        </Button>
      </div>

      <Row>
        {/* Order Summary */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h4>Order Summary</h4>
            </Card.Header>
            <Card.Body>
              {/* <p><strong>Order ID:</strong> {order._id}</p> */}
              <p>
                <strong>Date:</strong> {formatDate(order?.order?.createdAt)}
              </p>
              <p>
                <strong>Order Status:</strong>{" "}
                <Badge bg={getStatusBadgeVariant(order?.order?.orderStatus)}>
                  {order?.order?.orderStatus || "Processing"}
                </Badge>
              </p>
              <p>
                <strong>Payment Status:</strong>{" "}
                <Badge bg={getPaymentBadgeVariant(order?.order?.paymentStatus)}>
                  {order?.order?.paymentStatus || "Pending"}
                </Badge>
              </p>
              <p>
                <strong>Delivery Status:</strong>{" "}
                <Badge bg={getStatusBadgeVariant(order?.order?.deliveryStatus)}>
                  {order?.order?.deliveryStatus || "Pending"}
                </Badge>
              </p>
              <p>
                <strong>Payment Method:</strong> {order?.order?.paymentMethod}
              </p>
              <p>
                <strong>Delivery Type:</strong> {order?.order?.deliveryType}
              </p>
              {order?.order?.expectedDeliveryDate && (
                <p>
                  <strong>Expected Delivery:</strong>{" "}
                  {formatDate(order?.order?.expectedDeliveryDate)}
                </p>
              )}
              {order?.order?.paidAt && (
                <p>
                  <strong>Paid At:</strong> {formatDate(order?.order?.paidAt)}
                </p>
              )}
              {order?.order?.notes && (
                <p>
                  <strong>Notes:</strong> {order?.order?.notes}
                </p>
              )}
            </Card.Body>
          </Card>

          {/* Shipping Address */}
          <Card className="mb-4">
            <Card.Header>
              <h4>Shipping Address</h4>
            </Card.Header>
            <Card.Body>
              <p>{order?.order?.shippingAddress?.street}</p>
              <p>
                {order?.order?.shippingAddress?.city},{" "}
                {order?.order?.shippingAddress?.state}{" "}
                {order?.order?.shippingAddress?.zipCode}
              </p>
              <p>{order?.order?.shippingAddress?.country}</p>
            </Card.Body>
          </Card>

          {/* Delivery Location */}
          {order?.order?.deliveryLocation && (
            <Card className="mb-4">
              <Card.Header>
                <h4>Delivery Location</h4>
              </Card.Header>
              <Card.Body>
                <p>Latitude: {order?.order?.deliveryLocation.latitude}</p>
                <p>Longitude: {order?.order?.deliveryLocation.longitude}</p>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${order?.order?.deliveryLocation.latitude},${order?.order?.deliveryLocation.longitude}`,
                      "_blank"
                    )
                  }
                >
                  View on Map
                </Button>
              </Card.Body>
            </Card>
          )}

          {/* Vendor Information */}
          {order?.order?.vendorId && (
            <Card className="mb-4">
              <Card.Header>
                <h4>Vendor Information</h4>
              </Card.Header>
              <Card.Body>
                <p>
                  <strong>Business Name:</strong>{" "}
                  {order?.order?.vendorId.businessName}
                </p>
                <p>
                  <strong>Vendor Name:</strong> {order?.order?.vendorId.name}
                </p>
                {/* <p><strong>Vendor ID:</strong> {order.vendorId._id}</p> */}
              </Card.Body>
            </Card>
          )}

          {/* Payment Result */}
          {order?.order?.paymentResult && (
            <Card className="mb-4">
              <Card.Header>
                <h4>Payment Information</h4>
              </Card.Header>
              <Card.Body>
                {/* <p><strong>Payment ID:</strong> {order.paymentResult.id}</p> */}
                <p>
                  <strong>Status:</strong> {order?.order?.paymentResult?.status}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {order?.order?.paymentResult?.email_address}
                </p>
                <p>
                  <strong>Update Time:</strong>{" "}
                  {new Date(
                    parseInt(order?.order?.paymentResult?.update_time)
                  ).toLocaleString()}
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Order Items */}
        <Col md={8}>
          <Card>
            <Card.Header>
              <h4>Order Items</h4>
            </Card.Header>
            <ListGroup variant="flush">
              {order?.order?.orderItems?.map((item, index) => (
                <ListGroup.Item key={index}>
                  <Row className="align-items-center">
                    <Col xs={2} md={1}>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                          }}
                          className="rounded"
                        />
                      )}
                    </Col>
                    <Col xs={2} md={1}>
                      <div className="text-center fw-bold">
                        {item.quantity}x
                      </div>
                    </Col>
                    <Col xs={4} md={6}>
                      <div className="fw-bold">{item.name}</div>
                      <div className="text-muted small">
                        Product ID: {item.product}
                      </div>
                    </Col>
                    <Col xs={4} md={4} className="text-end">
                      <div className="fw-bold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-muted">
                        ${item.price.toFixed(2)} each
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}

              <ListGroup.Item>
                <Row>
                  <Col md={8} className="fw-bold">
                    Items Price:
                  </Col>
                  <Col md={4} className="fw-bold text-end">
                    ${order?.order?.itemsPrice?.toFixed(2) || "0.00"}
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col md={8} className="fw-bold">
                    Tax:
                  </Col>
                  <Col md={4} className="fw-bold text-end">
                    ${order?.order?.taxPrice?.toFixed(2) || "0.00"}
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col md={8} className="fw-bold">
                    Shipping:
                  </Col>
                  <Col md={4} className="fw-bold text-end">
                    ${order?.order?.shippingPrice?.toFixed(2) || "0.00"}
                  </Col>
                </Row>
              </ListGroup.Item>

              <ListGroup.Item>
                <Row>
                  <Col md={8} className="fw-bold">
                    Total:
                  </Col>
                  <Col md={4} className="fw-bold text-end fs-5">
                    ${order?.order?.totalPrice?.toFixed(2) || "0.00"}
                  </Col>
                </Row>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default OrderDetails;
