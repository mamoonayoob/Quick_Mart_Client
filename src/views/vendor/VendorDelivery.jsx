import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Form, 
  Modal,
  Spinner,
  Alert
} from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { BsTruck, BsPersonCheck, BsCheckCircle } from 'react-icons/bs';
import { vendorApi } from '../../services/api';

const VendorDelivery = () => {
  // State for delivery orders and delivery personnel
  const [pendingOrders, setPendingOrders] = useState([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  // State for feedback messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Note: Mock data has been moved inside the fetchDeliveryData callback function to avoid React Hook dependency warnings
  // Fetch delivery data from API
  const fetchDeliveryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
 
    try {
      // Try to get real data from API
      const [ordersResponse, personnelResponse] = await Promise.all([
        vendorApi.getPendingDeliveries(),
        vendorApi.getDeliveryPersonnel()
      ]);
      
      // Process orders data
      if (ordersResponse.data && ordersResponse.data.success) {
        setPendingOrders(ordersResponse.data.data || []);
      } else {
        console.warn('Failed to fetch orders data, using mock data as fallback');
        setPendingOrders(ordersResponse.data.data || [] );
      }
      
      // Process personnel data
      if (personnelResponse.data && personnelResponse.data.success) {
        console.log(personnelResponse.data.data);
        setDeliveryPersonnel(personnelResponse.data.data || []);
      } else {
        console.warn('Failed to fetch personnel data, using mock data as fallback');
        setDeliveryPersonnel(personnelResponse.data.data || [] );
      }
      
      // Fallback for empty data (development only)
      if (pendingOrders.length === 0) setPendingOrders(ordersResponse.data.data || [] );
      if (deliveryPersonnel.length === 0) setDeliveryPersonnel(personnelResponse.data.data || [] );
    } catch (err) {
      console.error('Error fetching delivery data:', err);
      setError('Failed to load delivery data. Please try again later.');
      // Only use mock data if we have no real data
      // if (pendingOrders.length === 0) setPendingOrders(ordersResponse.data.data || [] );
      // if (deliveryPersonnel.length === 0) setDeliveryPersonnel(personnelResponse.data.data || [] );
    } finally {
      setLoading(false);
    }
  }, [pendingOrders.length, deliveryPersonnel.length]);
  
  // Load delivery data on component mount
  useEffect(() => {
    fetchDeliveryData();
  }, []);

  // Handle opening the assign modal
  const handleOpenAssignModal = (order) => {
    setSelectedOrder(order);
    setSelectedDeliveryPerson('');
    setAssignmentNote('');
    setShowAssignModal(true);
  };

  // Handle assigning delivery
  const handleAssignDelivery = async () => {
    if (!selectedOrder || !selectedDeliveryPerson) {
      setErrorMessage('Please select a delivery person');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setAssigning(true);
    setErrorMessage('');
    
    try {
      console.log('Assigning delivery:', {
        orderId: selectedOrder._id,
        deliveryPersonId: selectedDeliveryPerson,
        note: assignmentNote
      });
      
      // Call the vendor API to assign delivery
      const response = await vendorApi.assignDelivery({
        orderId: selectedOrder._id,
        deliveryPersonId: selectedDeliveryPerson,
        note: assignmentNote
      });
      
      console.log('Delivery assignment response:', response.data);
      
      if (response.data && response.data.success) {
        // Update the orders list by removing the assigned order
        const updatedOrders = pendingOrders.filter(order => order._id !== selectedOrder._id);
        setPendingOrders(updatedOrders);
        
        // Show success message with more details
        const deliveryPerson = deliveryPersonnel.find(p => p._id === selectedDeliveryPerson);
        const orderNumber = selectedOrder.orderNumber || selectedOrder.orderId || 'N/A';
        const deliveryPersonName = deliveryPerson?.name || 'delivery person';
        const successMsg = `Delivery #${orderNumber} assigned to ${deliveryPersonName} successfully!`;
        setSuccessMessage(successMsg);
        
        console.log('Assignment successful:', {
          orderId: selectedOrder._id,
          orderNumber,
          deliveryPersonId: selectedDeliveryPerson,
          deliveryPersonName,
          response: response.data
        });
        
        // Close modal and reset form
        setShowAssignModal(false);
        setSelectedOrder(null);
        setSelectedDeliveryPerson('');
        setAssignmentNote('');
        
        // Refresh the pending orders list
        await fetchDeliveryData();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
        
        // Log successful assignment for debugging
        console.log(`Successfully assigned order #${selectedOrder.orderNumber} to delivery person ${deliveryPerson?._id}`);
      } else {
        throw new Error(response.data?.message || 'Failed to assign delivery - no success status in response');
      }
    } catch (err) {
      console.error('Error assigning delivery:', err);
      // Show detailed error message to the user
      const errorMsg = err.response?.data?.message || err.message || 'Failed to assign delivery. Please try again.';
      setErrorMessage(`Error: ${errorMsg}`);
      console.error('Full error details:', {
        error: err,
        response: err.response?.data
      });
      // Keep error message visible longer for debugging
      setTimeout(() => setErrorMessage(''), 10000);
    } finally {
      setAssigning(false);
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };  const formatAddress = (address) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    
    try {
      const { street, city, state, zipCode, country } = address;
      return `${street || ''}, ${city || ''}, ${state || ''} ${zipCode || ''}, ${country || ''}`;
    } catch (error) {
      console.error('Error formatting address:', error);
      return 'Invalid address format';
    }
  };
  // DataTable columns for pending orders
  const pendingOrdersColumns = [
    {
      name: 'Order ID',
      selector: row => row._id,
      sortable: true,
    },
    {
      name: 'Customer',
      selector: row => row.user.name,
      sortable: true,
      cell: row => (
        <div>
          <div>{row.user.name}</div>
          <small className="text-muted">{row.user.email}</small>
        </div>
      ),
    },
    {
      name: 'Address',
      selector: row => formatAddress(row.shippingAddress),
      sortable: true,
      grow: 2,
    },
    {
      name: 'Amount',
      selector: row => row.totalPrice,
      sortable: true,
      format: row => `$${row.totalPrice?.toFixed(2)}`,
    },
    {
      name: 'Date',
      selector: row => formatDate(row.createdAt),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => handleOpenAssignModal(row)}
        >
          <BsPersonCheck className="me-1" /> Assign Delivery
        </Button>
      )
    }
  ];

  return (
    <div className="vendor-delivery-page">
      <h2 className="mb-4">Delivery Management</h2>
      
      {/* Success and Error Messages */}
      {successMessage && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccessMessage('')} dismissible>
          {successMessage}
        </Alert>
      )}
      
      {errorMessage && (
        <Alert variant="danger" className="mb-4" onClose={() => setErrorMessage('')} dismissible>
          {errorMessage}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Delivery Stats */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="admin-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon primary">
                <BsTruck />
              </div>
              <div className="ms-3">
                <h6 className="stats-title">Pending Deliveries</h6>
                <h3 className="stats-value">{pendingOrders.length}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="admin-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon success">
                <BsPersonCheck />
              </div>
              <div className="ms-3">
                <h6 className="stats-title">Available Delivery Personnel</h6>
                <h3 className="stats-value">
                  {deliveryPersonnel.length}
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="admin-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stats-icon info">
                <BsCheckCircle />
              </div>
              <div className="ms-3">
                <h6 className="stats-title">Completed Today</h6>
                <h3 className="stats-value">5</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Pending Deliveries */}
      <Card className="admin-card mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Card.Title className="mb-0">Pending Deliveries</Card.Title>
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => fetchDeliveryData()}
          >
            Refresh
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading pending deliveries...</p>
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="text-center py-5">
              <BsCheckCircle size={48} className="text-success mb-3" />
              <h5>All caught up!</h5>
              <p className="text-muted">No pending deliveries at the moment.</p>
            </div>
          ) : (
            <DataTable
              columns={pendingOrdersColumns}
              data={pendingOrders}
              pagination
              highlightOnHover
              responsive
              striped
              noHeader
            />
          )}
        </Card.Body>
      </Card>
      
      {/* Assign Delivery Modal */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assign Delivery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <h6>Order Details</h6>
              <Row className="mb-4">
                <Col md={6}>
                  <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                  <p><strong>Customer:</strong> {selectedOrder.user.name}</p>
                  <p><strong>Phone:</strong> {selectedOrder.user.phone}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Amount:</strong> ${selectedOrder.totalPrice.toFixed(2)}</p>
                  <p><strong>Date:</strong> {selectedOrder.createdAt}</p>
                  <p><strong>Address:</strong> {formatAddress(selectedOrder.shippingAddress)}</p>
                </Col>
              </Row>
              
              <h6>Products</h6>
              <div className="table-responsive mb-4">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems.map((product, index) => (
                      <tr key={index}>
                        <td>{product.name}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>{product.quantity}</td>
                        <td>${(product.price * product.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Select Delivery Person</Form.Label>
                  <Form.Select 
                    value={selectedDeliveryPerson} 
                    onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                  >
                    <option value="">-- Select Delivery Person --</option>
                    {deliveryPersonnel
                      // .filter(person => person.status === 'Available')
                      .map(person => (
                        <option key={person._id} value={person._id}>
                          {person.name} 
                        </option>
                      ))
                    }
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Notes (Optional)</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    placeholder="Add any special instructions for the delivery person..."
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                  />
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAssignDelivery}
            disabled={!selectedDeliveryPerson || assigning}
          >
            {assigning ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Assigning...
              </>
            ) : (
              <>Assign Delivery</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VendorDelivery;
