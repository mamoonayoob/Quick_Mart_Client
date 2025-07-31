import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getCart,
  createOrder,
  getUserProfile,
  updateOrderPayment,
} from "../../helpers/apiHelpers";
import { useToast } from "../../components/ToastNotification";
import { useCart } from "../../context/CartContext";
import DeliveryLocationMap from "./DeliveryLocationMap";
import StripeWrapper from "../checkOutPage/StripeWrapper";

function CheckOut() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const toast = useToast();
  const { fetchCart } = useCart();

  // State for cart and order
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Refs to prevent duplicate API calls
  const cartFetchedRef = useRef(false);
  const profileFetchedRef = useRef(false);
  const [setWalletBalance] = useState(0);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [deliveryType, setDeliveryType] = useState("standard");
  const [notes, setNotes] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState({
    latitude: 40.7128,
    longitude: -74.006,
  });
  const [locationSelected, setLocationSelected] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [stripePaymentMethod, setStripePaymentMethod] = useState(null);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  // Fetch cart items and user profile when component mounts
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchCartItems = async () => {
      if (cartFetchedRef.current) return;

      try {
        setLoading(true);
        const response = await getCart();
        if (response.success) {
          setCartItems(response.data.items || []);
          calculateSubtotal(response.data.items || []);
          calculateShipping(deliveryType);
        } else {
          setError("Failed to fetch cart items");
        }
      } catch (err) {
        setError("Error fetching cart: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
        cartFetchedRef.current = true;
      }
    };

    const fetchUserProfile = async () => {
      if (profileFetchedRef.current) return;

      try {
        const response = await getUserProfile();
        if (response.success) {
          const { address, walletBalance: balance } = response.data;
          if (address) {
            setShippingAddress(address);
          }
          if (balance !== undefined) {
            setWalletBalance(balance);
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        profileFetchedRef.current = true;
      }
    };

    fetchCartItems();
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  // Calculate subtotal
  const calculateSubtotal = (items) => {
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setSubtotal(total);
    return total;
  };

  // Calculate shipping cost
  const calculateShipping = (type) => {
    const cost = type === "express" ? 10 : 5;
    setShippingCost(cost);
    return cost;
  };

  // Calculate total
  const calculateTotal = () => {
    return subtotal + shippingCost;
  };

  // Handle delivery type change
  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);
    calculateShipping(type);
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setPendingOrderId(null);
    setClientSecret(null);
    setPaymentIntentId(null);
    if (method !== "card") {
      setStripePaymentMethod(null);
    }
  };

  // Handle map click to set delivery location
  const handleMapClick = (location) => {
    setDeliveryLocation(location);
    setLocationSelected(true);
    setLocationError(false);
  };

  // Validate order fields
  const validateOrderFields = () => {
    let isValid = true;

    // Check if cart is empty
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return false;
    }

    // Check shipping address
    if (
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode ||
      !shippingAddress.country
    ) {
      toast.error("Please fill in all shipping address fields");
      isValid = false;
    }

    // Check delivery location
    if (
      !locationSelected ||
      !deliveryLocation ||
      !deliveryLocation.latitude ||
      !deliveryLocation.longitude
    ) {
      toast.error("Please select a delivery location on the map");
      setLocationError(true);
      isValid = false;
    }

    return isValid;
  };

  // Create a pending order for card payment
  const createPendingOrder = async () => {
    try {
      setProcessing(true);

      // For card payment initialization, we only need minimal validation
      if (
        !locationSelected ||
        !deliveryLocation ||
        !deliveryLocation.latitude ||
        !deliveryLocation.longitude
      ) {
        toast.error("Please select a delivery location on the map");
        setLocationError(true);
        setProcessing(false);
        return null;
      }

      const orderData = {
        orderItems: cartItems,
        shippingAddress,
        deliveryLocation,
        paymentMethod: "card",
        deliveryType,
        notes,
        status: "pending",
      };

      const response = await createOrder(orderData);

      if (response.success) {
        setPendingOrderId(response.data.order._id);
        setClientSecret(response.data.clientSecret);
        setPaymentIntentId(response.data.paymentIntentId);

        // Check if payment was already processed
        if (response.data.alreadyPaid) {
          toast.success("Payment was already processed successfully!");
          await fetchCart();
          navigate("/orders");
          return response.data;
        }

        toast.success(
          response.message || "Order created. Please complete payment."
        );
        return response.data;
      } else {
        toast.error(response.message || "Failed to create order");
        return null;
      }
    } catch (err) {
      toast.error("Error creating order: " + (err.message || "Unknown error"));
      return null;
    } finally {
      setProcessing(false);
    }
  };

  // Handle Stripe payment method
  const handleStripePaymentMethod = async (paymentMethod) => {
    try {
      setStripePaymentMethod(paymentMethod);

      if (pendingOrderId && paymentIntentId) {
        setProcessing(true);

        // Update payment status via API before redirecting
        const response = await updateOrderPayment(pendingOrderId, {
          paymentId: paymentMethod.id,
          paymentIntentId: paymentIntentId,
          status: "completed",
        });

        if (response.success) {
          toast.success("Payment successful! Order is being processed.");
          await fetchCart();
          navigate("/orders");
        } else {
          toast.error(response.message || "Payment update failed");
        }
      } else {
        toast.error("No pending order or payment intent found");
      }
    } catch (err) {
      toast.error(
        "Payment processing error: " + (err.message || "Unknown error")
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle place order
  const handlePlaceOrder = async (existingOrderId = null) => {
    try {
      setProcessing(true);

      // Validate all required fields
      if (!validateOrderFields()) {
        setProcessing(false);
        return;
      }

      // If payment method is card and we don't have a Stripe payment method yet
      if (paymentMethod === "card" && !stripePaymentMethod) {
        const pendingOrder = await createPendingOrder();
        if (!pendingOrder) {
          setProcessing(false);
          return;
        }
        setProcessing(false);
        return;
      }

      // For COD payments
      if (paymentMethod === "cod") {
        const orderData = {
          orderItems: cartItems,
          shippingAddress,
          paymentMethod,
          deliveryType,
          notes,
          deliveryLocation,
        };

        // Create new order for COD
        const response = await createOrder(orderData);

        if (response.success) {
          toast.success("Order placed successfully!");
          await fetchCart();
          navigate("/orders");
        } else {
          toast.error(response.message || "Failed to place order");
        }
      }
      // For card payments with existing payment method
      else if (
        paymentMethod === "card" &&
        existingOrderId &&
        stripePaymentMethod
      ) {
        // Update existing order (for card payments)
        const response = await updateOrderPayment({
          orderId: existingOrderId,
          paymentId: stripePaymentMethod.id,
          paymentIntentId: paymentIntentId,
          status: "completed",
        });

        if (response.success) {
          toast.success("Payment successful and order confirmed!");
          await fetchCart();
          navigate("/orders");
        } else {
          toast.error(response.message || "Payment update failed");
        }
      }
    } catch (err) {
      toast.error("Error placing order: " + (err.message || "Unknown error"));
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
    }
  };

  // Handle shipping address change
  const handleShippingAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Define styles for location input based on error state
  const locationInputStyle = locationError
    ? {
        border: "1px solid red",
        borderRadius: "4px",
        padding: "10px",
      }
    : {};

  // If loading, show spinner
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading your cart...</p>
      </Container>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  // If cart is empty, show empty cart message
  if (cartItems.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">Your cart is empty</Alert>
        <Button variant="primary" onClick={() => navigate("/")}>
          Continue Shopping
        </Button>
      </Container>
    );
  }

  // Main checkout form
  return (
    <Container className="py-5">
      <h1 className="mb-4">Checkout</h1>

      {error && (
        <Alert
          variant="danger"
          className="mb-4"
          dismissible
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Row>
        {/* Left Column - Checkout Form */}
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h4>Shipping Information</h4>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Street Address</Form.Label>
                      <Form.Control
                        type="text"
                        name="street"
                        value={shippingAddress.street}
                        onChange={handleShippingAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleShippingAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleShippingAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Zip Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipCode"
                        value={shippingAddress.zipCode}
                        onChange={handleShippingAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country</Form.Label>
                      <Form.Control
                        type="text"
                        name="country"
                        value={shippingAddress.country}
                        onChange={handleShippingAddressChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          {/* Delivery Options */}
          <Card className="mb-4">
            <Card.Header>
              <h4>Delivery Options</h4>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Check
                  type="radio"
                  id="standard-delivery"
                  name="deliveryType"
                  label="Standard Delivery ($5.00) - 3-5 business days"
                  checked={deliveryType === "standard"}
                  onChange={() => handleDeliveryTypeChange("standard")}
                />
                <Form.Check
                  type="radio"
                  id="express-delivery"
                  name="deliveryType"
                  label="Express Delivery ($10.00) - 1-2 business days"
                  checked={deliveryType === "express"}
                  onChange={() => handleDeliveryTypeChange("express")}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>
                  Delivery Location{" "}
                  {locationError && <span className="text-danger">*</span>}
                </Form.Label>
                <div style={locationInputStyle}>
                  <DeliveryLocationMap
                    onLocationSelect={handleMapClick}
                    initialLocation={deliveryLocation}
                  />
                </div>
                <Form.Text
                  className={locationError ? "text-danger" : "text-muted"}
                >
                  {locationError
                    ? "Please click on the map to set your delivery location"
                    : "Click on the map to set your delivery location"}
                </Form.Text>
                {locationSelected && (
                  <Alert variant="success" className="mt-2 p-2">
                    <small>
                      Delivery location selected at coordinates:{" "}
                      {deliveryLocation.latitude.toFixed(4)},{" "}
                      {deliveryLocation.longitude.toFixed(4)}
                    </small>
                  </Alert>
                )}
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Payment Method */}
          <Card className="mb-4">
            <Card.Header>
              <h4>Payment Method</h4>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Check
                  type="radio"
                  id="cod-payment"
                  name="paymentMethod"
                  label="Cash on Delivery"
                  checked={paymentMethod === "cod"}
                  onChange={() => handlePaymentMethodChange("cod")}
                />
                <Form.Check
                  type="radio"
                  id="card-payment"
                  name="paymentMethod"
                  label="Credit/Debit Card"
                  checked={paymentMethod === "card"}
                  onChange={() => handlePaymentMethodChange("card")}
                />
              </Form.Group>

              {paymentMethod === "card" && (
                <div className="mt-4">
                  <h5>Card Payment</h5>
                  {clientSecret ? (
                    <StripeWrapper
                      orderId={pendingOrderId}
                      clientSecret={clientSecret}
                      onPaymentMethod={handleStripePaymentMethod}
                    />
                  ) : (
                    <Button
                      variant="outline-primary"
                      onClick={() => createPendingOrder()}
                      disabled={processing}
                    >
                      {processing ? "Processing..." : "Proceed to Card Payment"}
                    </Button>
                  )}
                </div>
              )}

              <Form.Group className="mt-4">
                <Form.Label>Order Notes (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Special instructions for delivery"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Order Summary */}
        <Col md={4}>
          <Card>
            <Card.Header>
              <h4>Order Summary</h4>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h5>Items ({cartItems.length})</h5>
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className="d-flex justify-content-between mb-2"
                  >
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Shipping</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 fw-bold">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>

              <Button
                variant="primary"
                className="w-100 mt-4"
                onClick={() => setShowConfirmModal(true)}
                disabled={
                  processing ||
                  (paymentMethod === "card" && !stripePaymentMethod)
                }
              >
                {processing
                  ? "Processing..."
                  : paymentMethod === "card"
                  ? "Complete Payment"
                  : "Place Order"}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to place this order?</p>
          <p>
            <strong>Total Amount:</strong> ${calculateTotal().toFixed(2)}
            <br />
            <strong>Payment Method:</strong>{" "}
            {paymentMethod === "cod"
              ? "Cash on Delivery"
              : paymentMethod === "card"
              ? "Credit/Debit Card"
              : "Wallet"}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handlePlaceOrder(pendingOrderId)}
            disabled={processing}
          >
            {processing ? "Processing..." : "Confirm Order"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CheckOut;
