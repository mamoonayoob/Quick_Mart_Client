import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Badge, 
  Form,
  Spinner,
  Alert,
  Modal
} from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { BsEye, BsTruck, BsX } from 'react-icons/bs';
import { vendorApi } from '../../services/api'; // Use vendor API

const VendorOrders = () => {
  // State for orders
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('');
  
  // State for modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // State for order stats
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    inProgressOrders: 0,
    deliveredOrders: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Calculate order stats from orders data
  const calculateOrderStats = (ordersData) => {
    const stats = {
      totalOrders: ordersData.length,
      inProgressOrders: 0,
      deliveredOrders: 0
    };
    
    ordersData.forEach(order => {
      const status = order.orderStatus || order.status;
      switch (status) {
        case 'Delivered':
        case 'delivered':
          stats.deliveredOrders++;
          break;
        default:
          // All non-delivered orders are considered in progress
          stats.inProgressOrders++;
          break;
      }
    });
    
    // Alternative calculation: inProgressOrders = totalOrders - deliveredOrders
    // This ensures accuracy even if some statuses are not explicitly handled
    stats.inProgressOrders = stats.totalOrders - stats.deliveredOrders;
    
    return stats;
  };
  
  // Fetch all orders for stats calculation
  const fetchOrderStats = async () => {
    setStatsLoading(true);
    try {
      // Fetch all orders without pagination for stats
      const response = await vendorApi.getOrders({
        limit: 1000 // Get all orders for accurate stats
      });
      
      if (response.data.success) {
        const stats = calculateOrderStats(response.data.data);
        setOrderStats(stats);
        console.log('Order stats calculated:', stats);
      } else {
        throw new Error(response.data.message || 'Failed to fetch order stats');
      }
    } catch (err) {
      console.error('Error fetching order stats:', err);
      // Fallback to mock data stats if API fails
      const mockStats = calculateOrderStats(mockOrders);
      setOrderStats(mockStats);
    } finally {
      setStatsLoading(false);
    }
  };

  // Mock orders data for this vendor
  const mockOrders = [
    {
      _id: 'ORD-001',
      customer: { name: 'John Doe', email: 'john@example.com' },
      totalAmount: 1248,
      status: 'Pending Delivery',
      paymentMethod: 'Credit Card',
      createdAt: '2025-06-25',
      products: [
        { name: 'iPhone 13', price: 999, quantity: 1 },
        { name: 'AirPods Pro', price: 249, quantity: 1 }
      ]
    },
    {
      _id: 'ORD-002',
      customer: { name: 'Jane Smith', email: 'jane@example.com' },
      totalAmount: 899,
      status: 'Processing',
      paymentMethod: 'PayPal',
      createdAt: '2025-06-26',
      products: [
        { name: 'Samsung Galaxy S22', price: 899, quantity: 1 }
      ]
    },
    {
      _id: 'ORD-003',
      customer: { name: 'Robert Johnson', email: 'robert@example.com' },
      totalAmount: 2196,
      status: 'Delivered',
      paymentMethod: 'Credit Card',
      createdAt: '2025-06-24',
      products: [
        { name: 'MacBook Pro', price: 1999, quantity: 1 },
        { name: 'Magic Mouse', price: 99, quantity: 1 },
        { name: 'USB-C Hub', price: 49, quantity: 2 }
      ]
    },
    {
      _id: 'ORD-004',
      customer: { name: 'Emily Davis', email: 'emily@example.com' },
      totalAmount: 599,
      status: 'Pending Delivery',
      paymentMethod: 'Apple Pay',
      createdAt: '2025-06-26',
      products: [
        { name: 'iPad Air', price: 599, quantity: 1 }
      ]
    },
    {
      _id: 'ORD-005',
      customer: { name: 'Michael Wilson', email: 'michael@example.com' },
      totalAmount: 497,
      status: 'Cancelled',
      paymentMethod: 'Credit Card',
      createdAt: '2025-06-23',
      products: [
        { name: 'Apple Watch Series 7', price: 399, quantity: 1 },
        { name: 'Watch Band', price: 49, quantity: 2 }
      ]
    }
  ];

  // Fetch order stats on component mount
  useEffect(() => {
    fetchOrderStats();
  }, []);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Call the vendor API to get orders
        const response = await vendorApi.getOrders({
          page: currentPage,
          limit: perPage,
          status: filterStatus || undefined
        });
        
        if (response.data.success) {
          setOrders(response.data.data);
          setTotalRows(response.data.total);
        } else {
          throw new Error(response.data.message || 'Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
        
        // Fallback to mock data if API fails (for development purposes)
        let filteredOrders = [...mockOrders];
        
        if (filterStatus) {
          filteredOrders = filteredOrders.filter(order => order.status === filterStatus);
        }
        
        setOrders(filteredOrders);
        setTotalRows(filteredOrders.length);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [currentPage, perPage, filterStatus]);

  // Handle page change
  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // Handle rows per page change
  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
  };
  
  // Handle view order
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };
  
  // Handle close view modal
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedOrder(null);
  };
  
  // Handle delivery assignment
  const handleDeliveryAssign = (order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
  };
  
  // Handle close delivery modal
  const handleCloseDeliveryModal = () => {
    setShowDeliveryModal(false);
    setSelectedOrder(null);
  };
  
  // Handle update order status
  const handleUpdateOrderStatus = async (newStatus) => {
    if (!selectedOrder) return;
    
    setUpdatingStatus(true);
    
    try {
      const response = await vendorApi.updateOrderStatus(selectedOrder._id, { status: newStatus });
      
      if (response.data.success) {
        // Update order in the list
        const updatedOrders = orders.map(order => {
          if (order._id === selectedOrder._id) {
            return { ...order, orderStatus: newStatus };
          }
          return order;
        });
        
        setOrders(updatedOrders);
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
        // Could show success message here
      } else {
        throw new Error(response.data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      // Could show error message here
    } finally {
      setUpdatingStatus(false);
    }
  };

// Get badge variant based on order status
const getStatusBadgeVariant = (status) => {
  if (!status) return 'secondary';
  
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'success';
    case 'processing':
      return 'primary';
    case 'shipped':
      return 'info';
    case 'cancelled':
      return 'danger';
    case 'pending':
      return 'warning';
    default:
      return 'secondary';
  }
};

// Get badge variant based on payment status
const getPaymentStatusBadgeVariant = (status) => {
  if (!status) return 'secondary';
  
  switch (status.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    case 'refunded':
      return 'info';
    default:
      return 'secondary';
  }
};

// Get badge variant based on delivery status
const getDeliveryStatusBadgeVariant = (status) => {
  if (!status) return 'secondary';
  
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'success';
    case 'in transit':
      return 'info';
    case 'preparing':
      return 'primary';
    case 'cancelled':
      return 'danger';
    case 'pending':
      return 'warning';
    default:
      return 'secondary';
  }
};  // Format date to readable format
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
};

  // DataTable columns
  const columns = [
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
      name: 'Amount',
      selector: row => row.totalPrice,
      sortable: true,
      format: row => `$${row.totalPrice?.toFixed(2)}`,
    },
    {
      name: 'Order Status',
      selector: row => row.orderStatus,
      sortable: true,
      cell: row => (
        <Badge bg={getStatusBadgeVariant(row.orderStatus)} className="status-badge">
          {row.orderStatus}
        </Badge>
      ),
    },
    {
      name: 'Payment Status',
      selector: row => row.paymentStatus,
      sortable: true,
      cell: row => (
        <Badge bg={getPaymentStatusBadgeVariant(row.paymentStatus)} className="status-badge">
          {row.paymentStatus}
        </Badge>
      ),
    },
    {
      name: 'Delivery Status',
      selector: row => row.deliveryStatus,
      sortable: true,
      cell: row => (
        <Badge bg={getDeliveryStatusBadgeVariant(row.deliveryStatus)} className="status-badge">
          {row.deliveryStatus}
        </Badge>
      ),
    },
    {
      name: 'Date',
      selector: row => formatDate(row.createdAt),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => handleViewOrder(row)}
          >
            <BsEye /> View
          </Button>
          
          {row.orderStatus === 'Processing' && (
            <Button 
              variant="outline-success" 
              size="sm"
              onClick={() => handleDeliveryAssign(row)}
            >
              <BsTruck /> Delivery
            </Button>
          )}
        </div>
      ),
      button: true,
    }
  ];

  return (
    <div className="vendor-orders">
      <div className="page-header mb-4">
        <h1 className="page-title">Orders Management</h1>
        <p className="text-muted">View and manage your orders</p>
      </div>
      
      {/* View Order Modal */}
      <Modal show={showViewModal} onHide={handleCloseViewModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h5>Order Information</h5>
                  <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'N/A'}</p>
                  <p><strong>Total Amount:</strong> ${selectedOrder.totalPrice?.toFixed(2)}</p>
                </Col>
                <Col md={6}>
                  <h5>Customer Information</h5>
                  <p><strong>Name:</strong> {selectedOrder.user?.name}</p>
                  <p><strong>Email:</strong> {selectedOrder.user?.email}</p>
                  <p><strong>Phone:</strong> {selectedOrder.user?.phone || 'N/A'}</p>
                </Col>
              </Row>
              
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body className="text-center">
                      <h6>Order Status</h6>
                      <Badge bg={getStatusBadgeVariant(selectedOrder.orderStatus)} className="p-2 fs-6 w-100">
                        {selectedOrder.orderStatus}
                      </Badge>
                      <div className="mt-3">
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleUpdateOrderStatus('Processing')}
                          disabled={selectedOrder.orderStatus === 'Processing' || updatingStatus}
                        >
                          Mark Processing
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleUpdateOrderStatus('Shipped')}
                          disabled={selectedOrder.orderStatus === 'Shipped' || updatingStatus}
                        >
                          Mark Shipped
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body className="text-center">
                      <h6>Payment Status</h6>
                      <Badge bg={getPaymentStatusBadgeVariant(selectedOrder.paymentStatus)} className="p-2 fs-6 w-100">
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Body className="text-center">
                      <h6>Delivery Status</h6>
                      <Badge bg={getDeliveryStatusBadgeVariant(selectedOrder.deliveryStatus)} className="p-2 fs-6 w-100">
                        {selectedOrder.deliveryStatus}
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <h5>Order Items</h5>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.product?.image && (
                              <img 
                                src={item.product.image} 
                                alt={item.product.name} 
                                style={{ width: '40px', height: '40px', marginRight: '10px', objectFit: 'cover' }} 
                              />
                            )}
                            <div>
                              <div>{item.product?.name}</div>
                              <small className="text-muted">{item.product?.sku || 'No SKU'}</small>
                            </div>
                          </div>
                        </td>
                        <td>${item.price?.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td>${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Subtotal</strong></td>
                      <td>${selectedOrder.subtotal?.toFixed(2) || '0.00'}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Shipping</strong></td>
                      <td>${selectedOrder.shippingCost?.toFixed(2) || '0.00'}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Tax</strong></td>
                      <td>${selectedOrder.taxAmount?.toFixed(2) || '0.00'}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Total</strong></td>
                      <td><strong>${selectedOrder.totalPrice?.toFixed(2) || '0.00'}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {selectedOrder.notes && (
                <div className="mt-4">
                  <h5>Order Notes</h5>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseViewModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delivery Assignment Modal */}
      <Modal show={showDeliveryModal} onHide={handleCloseDeliveryModal}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Delivery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <p><strong>Order ID:</strong> {selectedOrder._id}</p>
              <p><strong>Customer:</strong> {selectedOrder.user?.name}</p>
              <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
              
              <Form.Group className="mb-3">
                <Form.Label>Delivery Status</Form.Label>
                <Form.Select 
                  onChange={(e) => handleUpdateOrderStatus(e.target.value)}
                  value={selectedOrder.deliveryStatus}
                  disabled={updatingStatus}
                >
                  <option value="Pending">Pending</option>
                  <option value="Preparing">Preparing</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Estimated Delivery Date</Form.Label>
                <Form.Control type="date" />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Tracking Number (Optional)</Form.Label>
                <Form.Control type="text" placeholder="Enter tracking number" />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Delivery Notes</Form.Label>
                <Form.Control as="textarea" rows={3} placeholder="Add any delivery instructions or notes" />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeliveryModal}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              // Save delivery details logic would go here
              handleCloseDeliveryModal();
            }}
            disabled={updatingStatus}
          >
            {updatingStatus ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Order Stats */}
      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Total Orders</h6>
              {statsLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3 className="stats-value">{orderStats.totalOrders}</h3>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">In Progress</h6>
              {statsLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3 className="stats-value">{orderStats.inProgressOrders}</h3>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Delivered</h6>
              {statsLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3 className="stats-value">{orderStats.deliveredOrders}</h3>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Orders Table */}
      <Card className="admin-card">
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
          <Card.Title className="mb-0">Orders</Card.Title>
          
          <div className="d-flex gap-2 mt-2 mt-md-0">
            <Form.Select 
              size="sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="">All Statuses</option>
              <option value="Processing">Processing</option>
              <option value="Pending Delivery">Pending Delivery</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </Form.Select>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading orders...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={orders}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handlePerRowsChange}
              highlightOnHover
              responsive
              striped
              noHeader
            />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default VendorOrders;
