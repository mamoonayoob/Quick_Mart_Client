import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Row, Col, Alert } from 'react-bootstrap';
import { deliveryApi } from '../../services/api';

const DeliveryOrders = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // const [successMessage, setSuccessMessage] = useState('');


  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveryApi.getMyDeliveries();
      
      if (response.data && response.data.success) {
        setDeliveries(response.data.deliveries || []);
      }
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const [updatingStatus, setUpdatingStatus] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [deliveryId]: true }));
      setError(null);
      
      const response = await deliveryApi.updateDeliveryStatus(deliveryId, newStatus);
      
      if (response.data && response.data.success) {
        // Update local state immediately for better UX
        setDeliveries(prev => 
          prev.map(d => 
            d._id === deliveryId 
              ? { ...d, status: newStatus }
              : d
          )
        );
        
        // Show success message
        const action = newStatus === 'in_progress' ? 'started' : 'completed';
        setSuccessMessage(`Delivery ${action} successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Refresh data to ensure consistency
        await fetchDeliveries();
        
        // Close modal if open
        if (showModal && selectedDelivery?._id === deliveryId) {
          setShowModal(false);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating delivery status:', err);
      setError(`Failed to update status: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [deliveryId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      in_progress: 'info',
      delivered: 'success',
      cancelled: 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const handleViewDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setShowModal(true);
  };

  if (loading && deliveries.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading your deliveries...</p>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2>
            <i className="fas fa-box me-2"></i>
            My Deliveries
          </h2>
          <p className="text-muted">Manage your assigned deliveries</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="success" className="mb-3" dismissible onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      
      <Card>
        <Card.Body>
          {deliveries.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
              <p className="text-muted">No deliveries assigned yet.</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => (
                  <tr key={delivery._id}>
                    <td>#{delivery.orderId}</td>
                    <td>{delivery.customerName}</td>
                    <td>{delivery.customerPhone}</td>
                    <td className="text-truncate" style={{ maxWidth: '200px' }}>
                      {delivery.deliveryAddress}
                    </td>
                    <td>{getStatusBadge(delivery.status)}</td>
                    <td>${delivery.deliveryFee}</td>
                    <td>{new Date(delivery.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                        onClick={() => handleViewDetails(delivery)}
                        disabled={updatingStatus[delivery._id]}
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      {delivery.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="info"
                          onClick={() => updateDeliveryStatus(delivery._id, 'in_progress')}
                          disabled={updatingStatus[delivery._id]}
                        >
                          {updatingStatus[delivery._id] ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Starting...
                            </>
                          ) : 'Start'}
                        </Button>
                      )}
                      {delivery.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => updateDeliveryStatus(delivery._id, 'delivered')}
                          disabled={updatingStatus[delivery._id]}
                        >
                          {updatingStatus[delivery._id] ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Completing...
                            </>
                          ) : 'Complete'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Delivery Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Delivery Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDelivery && (
            <div>
              <Row>
                <Col md={6}>
                  <h6>Order Information</h6>
                  <p><strong>Order ID:</strong> #{selectedDelivery.orderId}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedDelivery.status)}</p>
                  <p><strong>Delivery Fee:</strong> ${selectedDelivery.deliveryFee}</p>
                </Col>
                <Col md={6}>
                  <h6>Customer Information</h6>
                  <p><strong>Name:</strong> {selectedDelivery.customerName}</p>
                  <p><strong>Phone:</strong> {selectedDelivery.customerPhone}</p>
                  <p><strong>Email:</strong> {selectedDelivery.customerEmail}</p>
                </Col>
              </Row>
              <Row>
                <Col>
                  <h6>Delivery Address</h6>
                  <p>{selectedDelivery.deliveryAddress}</p>
                  {selectedDelivery.deliveryNotes && (
                    <>
                      <h6>Delivery Notes</h6>
                      <p>{selectedDelivery.deliveryNotes}</p>
                    </>
                  )}
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {selectedDelivery && selectedDelivery.status === 'pending' && (
            <Button
              variant="info"
              onClick={() => updateDeliveryStatus(selectedDelivery._id, 'in_progress')}
            >
              Start Delivery
            </Button>
          )}
          {selectedDelivery && selectedDelivery.status === 'in_progress' && (
            <Button
              variant="success"
              onClick={() => updateDeliveryStatus(selectedDelivery._id, 'delivered')}
            >
              Mark as Delivered
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DeliveryOrders;
