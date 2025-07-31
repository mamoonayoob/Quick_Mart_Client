import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, updatePaymentStatus } from '../../helpers/apiHelpers';

function UpdatePaymentStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // State
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Payment status form
  const [paymentData, setPaymentData] = useState({
    paymentId: '',
    status: 'pending' // Default status
  });
  
  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(orderId);
        setOrder(data);
        
        // Pre-fill form with existing payment data if available
        if (data.payment) {
          setPaymentData({
            paymentId: data.payment.paymentId || '',
            status: data.payment.status || 'pending'
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Check if user is admin
    if (isAuthenticated) {
      if (user && user.role === 'admin') {
        fetchOrder();
      } else {
        setError('You do not have permission to access this page.');
        setLoading(false);
      }
    } else {
      navigate('/login', { state: { from: `/admin/orders/${orderId}/payment` } });
    }
  }, [orderId, isAuthenticated, user, navigate]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate form
      if (!paymentData.status) {
        throw new Error('Please select a payment status');
      }
      
      // Update payment status
      await updatePaymentStatus(orderId, paymentData);
      
      // Show success message
      setSuccess('Payment status updated successfully');
      
      // Refresh order data
      const updatedOrder = await getOrderById(orderId);
      setOrder(updatedOrder);
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update payment status');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p>Loading order details...</p>
      </Container>
    );
  }
  
  if (error && !order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/admin/orders')}>
          Back to Orders
        </Button>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">Update Payment Status</h1>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {order && (
        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Header>
                <h4>Order Information</h4>
              </Card.Header>
              <Card.Body>
                <p><strong>Order ID:</strong> {order._id}</p>
                <p><strong>Customer:</strong> {order.user?.name || 'N/A'}</p>
                <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Order Status:</strong> {order.status}</p>
                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                <p><strong>Total Amount:</strong> ${order.totalAmount?.toFixed(2) || '0.00'}</p>
                <p><strong>Current Payment Status:</strong> {order.payment?.status || 'Not set'}</p>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card>
              <Card.Header>
                <h4>Update Payment Status</h4>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Payment ID (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      name="paymentId"
                      value={paymentData.paymentId}
                      onChange={handleInputChange}
                      placeholder="Enter payment reference ID"
                    />
                    <Form.Text className="text-muted">
                      For external payment references (e.g., Stripe payment ID)
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Payment Status</Form.Label>
                    <Form.Select
                      name="status"
                      value={paymentData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <div className="d-grid gap-2">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={processing}
                    >
                      {processing ? 'Updating...' : 'Update Payment Status'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default UpdatePaymentStatus;
