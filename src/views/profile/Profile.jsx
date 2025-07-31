import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { fetchUserProfile } from "../../redux/slices/authSlice";
import { getOrders, updateUserProfile } from "../../helpers/apiHelpers";
import { useMessages } from "../../context/MessageContext";
import { BsEnvelope, BsEnvelopeFill, BsArrowLeft } from "react-icons/bs";
import CustomerWhatsAppChat from "../messaging/CustomerWhatsAppChat";

const Profile = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    user,
    loading: authLoading,
    error: authError,
  } = useSelector((state) => state.auth);
  const { unreadCount } = useMessages();

  // Check if we're on the messages route
  const isMessagesRoute = location.pathname === "/profile/messages";

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [editing, setEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Load user data into form when available
  useEffect(() => {
    console.log(user);
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  // Fetch user profile only on initial load
  useEffect(() => {
    if (!user) {
      dispatch(fetchUserProfile());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]); // Remove user from dependencies to prevent infinite loop

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const response = await getOrders();
        console.log(response);
        if (response && response.success && response.data) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrdersError("Failed to load your orders. Please try again.");
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (updateLoading) return; // Prevent multiple submissions

    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      // Use the updateUserProfile helper which already has the correct base URL and token handling
      const updatedProfileData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };

      const response = await updateUserProfile(updatedProfileData);

      if (response && response.success) {
        setUpdateSuccess(true);
        setEditing(false);

        // Update local form data to match what was saved
        setFormData((prevData) => ({
          ...prevData,
          name: updatedProfileData.name,
          phone: updatedProfileData.phone,
          address: updatedProfileData.address,
        }));

        // Update local storage directly instead of dispatching fetchUserProfile
        if (response.data) {
          const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
          const updatedUser = { ...currentUser, ...updatedProfileData };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } else {
        throw new Error(response?.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateError(
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3">Loading your profile...</p>
      </div>
    );
  }

  if (authError) {
    return <Alert variant="danger">Error loading profile: {authError}</Alert>;
  }

  // If on messages route, show WhatsApp messaging interface
  if (isMessagesRoute) {
    return (
      <Container fluid className="py-4">
        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <div className="d-flex align-items-center">
                  <Link
                    to="/profile"
                    className="btn btn-outline-danger btn-sm me-3"
                  >
                    <BsArrowLeft className="me-1" />
                    Back to Profile
                  </Link>
                  <div>
                    <h4 className="mb-0 text-danger">Messages</h4>
                    <p className="text-muted mb-0">
                      Chat with vendors, admins, and delivery personnel
                    </p>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div style={{ height: "80vh" }}>
                  <CustomerWhatsAppChat />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4 text-danger">My Profile</h2>

      <Row>
        {/* Quick Actions */}
        <Col md={12} className="mb-4">
          <div className="d-flex flex-wrap gap-3">
            <Link to="/profile/messages" className="text-decoration-none">
              <Card className="shadow-sm" style={{ width: "200px" }}>
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-light rounded-circle p-3 me-3">
                    {unreadCount > 0 ? (
                      <BsEnvelopeFill size={24} className="text-danger" />
                    ) : (
                      <BsEnvelope size={24} className="text-secondary" />
                    )}
                  </div>
                  <div>
                    <h6 className="mb-0">Messages</h6>
                    {unreadCount > 0 && (
                      <Badge bg="danger" pill>
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Link>

            <Link to="/orders/history" className="text-decoration-none">
              <Card className="shadow-sm" style={{ width: "200px" }}>
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-light rounded-circle p-3 me-3">
                    <i
                      className="bi bi-box text-secondary"
                      style={{ fontSize: "24px" }}
                    ></i>
                  </div>
                  <div>
                    <h6 className="mb-0">Orders</h6>
                    <small className="text-muted">
                      {orders?.length || 0} total
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Link>

            <Link to="/users/wishlist" className="text-decoration-none">
              <Card className="shadow-sm" style={{ width: "200px" }}>
                <Card.Body className="d-flex align-items-center">
                  <div className="bg-light rounded-circle p-3 me-3">
                    <i
                      className="bi bi-heart text-secondary"
                      style={{ fontSize: "24px" }}
                    ></i>
                  </div>
                  <div>
                    <h6 className="mb-0">Wishlist</h6>
                  </div>
                </Card.Body>
              </Card>
            </Link>
          </div>
        </Col>

        {/* Profile Information */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Personal Information</h5>
                <Button
                  variant={editing ? "outline-secondary" : "outline-danger"}
                  size="sm"
                  onClick={() => setEditing(!editing)}
                  disabled={updateLoading}
                >
                  {editing ? "Cancel" : "Edit"}
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {updateSuccess && (
                <Alert
                  variant="success"
                  dismissible
                  onClose={() => setUpdateSuccess(false)}
                >
                  Profile updated successfully!
                </Alert>
              )}

              {updateError && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setUpdateError(null)}
                >
                  {updateError}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing || updateLoading}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={true} // Email should not be editable
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing || updateLoading}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!editing || updateLoading}
                  />
                </Form.Group>

                {editing && (
                  <Button
                    variant="danger"
                    type="submit"
                    className="w-100"
                    disabled={updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        <span className="ms-2">Updating...</span>
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Account Summary */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Account Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h6 className="text-muted">Account Type</h6>
                <p className="mb-0">
                  {user?.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    : "Customer"}
                </p>
              </div>

              <div className="mb-4">
                <h6 className="text-muted">Member Since</h6>
                <p className="mb-0">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div className="mb-4">
                <h6 className="text-muted">Total Orders</h6>
                <p className="mb-0">{orders?.length}</p>
              </div>

              <div>
                <h6 className="text-muted">Account Status</h6>
                <span className="badge bg-success">Active</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <h4 className="mb-3 mt-4 text-danger">Recent Orders</h4>
      <Card className="shadow-sm">
        <Card.Body>
          {ordersLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="danger" />
              <p className="mt-2">Loading your orders...</p>
            </div>
          ) : ordersError ? (
            <Alert variant="danger">{ordersError}</Alert>
          ) : orders?.length === 0 ? (
            <p className="text-center py-4">
              You haven't placed any orders yet.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Order Status</th>
                    <th>Payment Status</th>
                    <th>Delivery Status</th>
                    <th>Payment Method</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((order) => (
                    <tr key={order._id}>
                      <td>#{order._id.substring(0, 8)}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>{order.orderItems.length}</td>
                      <td>Rs {order.itemsPrice?.toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge bg-${
                            order.orderStatus === "completed"
                              ? "success"
                              : order.orderStatus === "processing"
                              ? "warning"
                              : order.orderStatus === "pending"
                              ? "secondary"
                              : "info"
                          }`}
                        >
                          {order.orderStatus.charAt(0).toUpperCase() +
                            order.orderStatus.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${
                            order.paymentStatus === "completed"
                              ? "success"
                              : order.paymentStatus === "processing"
                              ? "warning"
                              : order.paymentStatus === "pending"
                              ? "secondary"
                              : "info"
                          }`}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge bg-${
                            order.deliveryStatus === "delivered"
                              ? "success"
                              : order.deliveryStatus === "processing"
                              ? "warning"
                              : order.deliveryStatus === "pending"
                              ? "secondary"
                              : "info"
                          }`}
                        >
                          {order.deliveryStatus.charAt(0).toUpperCase() +
                            order.deliveryStatus.slice(1)}
                        </span>
                      </td>
                      <td>{order.paymentMethod?.toUpperCase()}</td>
                      <td>
                        <Button variant="outline-secondary" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;
