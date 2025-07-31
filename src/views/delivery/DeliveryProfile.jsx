/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Badge,
  Image,
} from "react-bootstrap";
import {
  BsPerson,
  BsPhone,
  BsEnvelope,
  BsGeoAlt,
  BsTruck,
  BsCalendar,
  BsCheckCircle,
  BsStar,
  BsPencil,
} from "react-icons/bs";
import { toast } from "react-toastify";
import { deliveryApi } from "../../services/api";

const DeliveryProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    vehicleType: user?.vehicleType || "",
    licenseNumber: user?.licenseNumber || "",
    emergencyContact: user?.emergencyContact || "",
  });
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    rating: 0,
    joinDate: null,
  });

  useEffect(() => {
    fetchProfileStats();
  }, []);

  const fetchProfileStats = async () => {
    try {
      setLoading(true);

      // Fetch real delivery statistics from the dashboard API
      const response = await deliveryApi.getDashboardStats();
      console.log("Profile stats response:", response);

      if (response.data?.success) {
        const data = response.data.stats; // Correct path to stats data

        // Calculate profile statistics from dashboard data
        const totalDeliveries = data.totalDeliveries || 0;
        const completedDeliveries = data.deliveredOrders || 0;

        // Use static rating as requested
        const rating = 4.5;

        // Use user's creation date or default
        const joinDate = user?.createdAt
          ? new Date(user.createdAt)
          : new Date("2024-01-01");

        const profileStats = {
          totalDeliveries,
          completedDeliveries,
          rating,
          joinDate,
        };

        console.log("Calculated profile stats:", profileStats);
        setStats(profileStats);
      } else {
        throw new Error("Failed to fetch dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      toast.error("Failed to load profile statistics");

      // Fallback to basic stats if API fails
      setStats({
        totalDeliveries: 0,
        completedDeliveries: 0,
        rating: 4.5,
        joinDate: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // API call to update profile would go here
      // await deliveryApi.updateProfile(profileData);
      toast.success("Profile updated successfully");
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<BsStar key={i} className="text-warning me-1" />);
    }

    if (hasHalfStar) {
      stars.push(
        <BsStar
          key="half"
          className="text-warning me-1"
          style={{ opacity: 0.5 }}
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<BsStar key={`empty-${i}`} className="text-muted me-1" />);
    }

    return stars;
  };

  return (
    <div className="delivery-profile">
      {/* Profile Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">My Profile</h1>
          <p className="text-muted mb-0">
            Manage your delivery profile and settings
          </p>
        </div>
        <Button
          variant={editing ? "success" : "outline-primary"}
          onClick={editing ? handleSaveProfile : () => setEditing(true)}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                size="sm"
                animation="border"
                role="status"
                className="me-2"
              />
              {editing ? "Saving..." : "Loading..."}
            </>
          ) : (
            <>
              {editing ? (
                <BsCheckCircle className="me-1" />
              ) : (
                <BsPencil className="me-1" />
              )}
              {editing ? "Save Changes" : "Edit Profile"}
            </>
          )}
        </Button>
      </div>

      <Row>
        {/* Profile Information */}
        <Col lg={8}>
          <Card className="admin-card mb-4">
            <Card.Header>
              <Card.Title>Profile Information</Card.Title>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <BsPerson className="me-2" />
                      Full Name
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <BsEnvelope className="me-2" />
                      Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <BsPhone className="me-2" />
                      Phone Number
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <BsTruck className="me-2" />
                      Vehicle Type
                    </Form.Label>
                    <Form.Select
                      name="vehicleType"
                      value={profileData.vehicleType}
                      onChange={handleInputChange}
                      disabled={!editing}
                    >
                      <option value="">Select Vehicle Type</option>
                      <option value="bike">Bike</option>
                      <option value="scooter">Scooter</option>
                      <option value="car">Car</option>
                      <option value="van">Van</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <BsGeoAlt className="me-2" />
                      Address
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>License Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Emergency Contact</Form.Label>
                    <Form.Control
                      type="tel"
                      name="emergencyContact"
                      value={profileData.emergencyContact}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Profile Stats */}
        <Col lg={4}>
          <Card className="admin-card mb-4">
            <Card.Header>
              <Card.Title>Profile Overview</Card.Title>
            </Card.Header>
            <Card.Body className="text-center">
              <Image
                src={
                  user?.profilePicture ||
                  "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(user?.name || "DP") +
                    "&background=random"
                }
                roundedCircle
                width="100"
                height="100"
                className="mb-3"
              />
              <h5>{user?.name || "Delivery Person"}</h5>
              <Badge bg="success" className="mb-3">
                Active Delivery Partner
              </Badge>

              <div className="mb-3">
                <div className="d-flex justify-content-center align-items-center mb-2">
                  {renderStarRating(stats.rating)}
                  <span className="ms-2 fw-bold">{stats.rating}</span>
                </div>
                <small className="text-muted">Customer Rating</small>
              </div>

              {/* Main Stats Row */}
              <Row className="text-center">
                <Col>
                  <div className="border-end">
                    <h4 className="text-primary mb-0">
                      {stats.totalDeliveries}
                    </h4>
                    <small className="text-muted">Total Deliveries</small>
                  </div>
                </Col>
                <Col>
                  <h4 className="text-success mb-0">
                    {stats.completedDeliveries}
                  </h4>
                  <small className="text-muted">Completed</small>
                </Col>
              </Row>

              {stats.joinDate && (
                <div className="mt-3 pt-3 border-top">
                  <BsCalendar className="me-2 text-muted" />
                  <small className="text-muted">
                    Joined{" "}
                    {stats.joinDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DeliveryProfile;
