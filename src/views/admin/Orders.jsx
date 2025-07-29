import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Button, 
  Badge, 
  Form, 
  Modal, 
  Row, 
  Col,
  InputGroup,
  Spinner,
  Alert,
  Table
} from 'react-bootstrap';
import { 
  BsSearch, 
  BsFilter, 
  BsEye, 
  BsPencil, 
  BsCalendarDate
} from 'react-icons/bs';
import { adminApi } from '../../services/api';
import DataTable from 'react-data-table-component';

const Orders = () => {
  // State for orders data
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // State for order modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // State for status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [orderToUpdate, setOrderToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  
  // Mock data for initial development - expanded with more realistic data
  // Using useMemo to avoid dependency array issues in useEffect
  const mockOrders = useMemo(() => [
    { 
      _id: 'ORD-001', 
      customer: { _id: '1', name: 'John Doe', email: 'john@example.com' },
      products: [
        { _id: 'P1', name: 'iPhone 13', price: 999, quantity: 1, image: 'https://via.placeholder.com/50' },
        { _id: 'P2', name: 'AirPods Pro', price: 249, quantity: 1, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 1248,
      status: 'Delivered',
      paymentMethod: 'Credit Card',
      shippingAddress: '123 Main St, New York, NY 10001',
      createdAt: '2025-06-20',
      updatedAt: '2025-06-22'
    },
    { 
      _id: 'ORD-002', 
      customer: { _id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      products: [
        { _id: 'P3', name: 'Samsung Galaxy S22', price: 899, quantity: 1, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 899,
      status: 'Processing',
      paymentMethod: 'PayPal',
      shippingAddress: '456 Elm St, Los Angeles, CA 90001',
      createdAt: '2025-06-22',
      updatedAt: '2025-06-22'
    },
    { 
      _id: 'ORD-003', 
      customer: { _id: '3', name: 'Robert Johnson', email: 'robert@example.com' },
      products: [
        { _id: 'P4', name: 'MacBook Pro', price: 1999, quantity: 1, image: 'https://via.placeholder.com/50' },
        { _id: 'P5', name: 'Magic Mouse', price: 99, quantity: 1, image: 'https://via.placeholder.com/50' },
        { _id: 'P6', name: 'USB-C Hub', price: 49, quantity: 2, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 2196,
      status: 'Shipped',
      paymentMethod: 'Credit Card',
      shippingAddress: '789 Oak St, Chicago, IL 60007',
      createdAt: '2025-06-23',
      updatedAt: '2025-06-24'
    },
    { 
      _id: 'ORD-004', 
      customer: { _id: '4', name: 'Emily Davis', email: 'emily@example.com' },
      products: [
        { _id: 'P7', name: 'iPad Air', price: 599, quantity: 1, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 599,
      status: 'Delivered',
      paymentMethod: 'Apple Pay',
      shippingAddress: '101 Pine St, Seattle, WA 98101',
      createdAt: '2025-06-19',
      updatedAt: '2025-06-21'
    },
    { 
      _id: 'ORD-005', 
      customer: { _id: '5', name: 'Michael Wilson', email: 'michael@example.com' },
      products: [
        { _id: 'P8', name: 'Apple Watch Series 7', price: 399, quantity: 1, image: 'https://via.placeholder.com/50' },
        { _id: 'P9', name: 'Watch Band', price: 49, quantity: 2, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 497,
      status: 'Cancelled',
      paymentMethod: 'Credit Card',
      shippingAddress: '202 Maple St, Boston, MA 02108',
      createdAt: '2025-06-21',
      updatedAt: '2025-06-22'
    },
    { 
      _id: 'ORD-006', 
      customer: { _id: '6', name: 'Sarah Brown', email: 'sarah@example.com' },
      products: [
        { _id: 'P10', name: 'Wireless Headphones', price: 199, quantity: 1, image: 'https://via.placeholder.com/50' },
        { _id: 'P11', name: 'Bluetooth Speaker', price: 129, quantity: 1, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 328,
      status: 'Processing',
      paymentMethod: 'Credit Card',
      shippingAddress: '303 Cedar St, Miami, FL 33101',
      createdAt: '2025-06-24',
      updatedAt: '2025-06-24'
    },
    { 
      _id: 'ORD-007', 
      customer: { _id: '7', name: 'David Miller', email: 'david@example.com' },
      products: [
        { _id: 'P12', name: 'Gaming Laptop', price: 1499, quantity: 1, image: 'https://via.placeholder.com/50' },
        { _id: 'P13', name: 'Gaming Mouse', price: 79, quantity: 1, image: 'https://via.placeholder.com/50' },
        { _id: 'P14', name: 'Gaming Keyboard', price: 129, quantity: 1, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 1707,
      status: 'Pending',
      paymentMethod: 'PayPal',
      shippingAddress: '404 Birch St, Austin, TX 78701',
      createdAt: '2025-06-25',
      updatedAt: '2025-06-25'
    },
    { 
      _id: 'ORD-008', 
      customer: { _id: '8', name: 'Lisa Taylor', email: 'lisa@example.com' },
      products: [
        { _id: 'P15', name: 'Fitness Tracker', price: 149, quantity: 1, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 149,
      status: 'Shipped',
      paymentMethod: 'Credit Card',
      shippingAddress: '505 Walnut St, Denver, CO 80201',
      createdAt: '2025-06-23',
      updatedAt: '2025-06-24'
    },
    { 
      _id: 'ORD-009', 
      customer: { _id: '9', name: 'James Anderson', email: 'james@example.com' },
      products: [
        { _id: 'P16', name: 'Smart TV', price: 899, quantity: 1, image: 'https://via.placeholder.com/50' },
        { _id: 'P17', name: 'Streaming Device', price: 49, quantity: 1, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 948,
      status: 'Delivered',
      paymentMethod: 'Apple Pay',
      shippingAddress: '606 Spruce St, Atlanta, GA 30301',
      createdAt: '2025-06-18',
      updatedAt: '2025-06-20'
    },
    { 
      _id: 'ORD-010', 
      customer: { _id: '10', name: 'Patricia Thomas', email: 'patricia@example.com' },
      products: [
        { _id: 'P18', name: 'Coffee Maker', price: 129, quantity: 1, image: 'https://via.placeholder.com/50' },
        { _id: 'P19', name: 'Coffee Beans', price: 24, quantity: 2, image: 'https://via.placeholder.com/50' }
      ],
      totalAmount: 177,
      status: 'Processing',
      paymentMethod: 'PayPal',
      shippingAddress: '707 Aspen St, Portland, OR 97201',
      createdAt: '2025-06-24',
      updatedAt: '2025-06-24'
    },
  ],)
  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Prepare query parameters
        const params = {
          page: currentPage,
          limit: 10
        };
        
        if (searchTerm) {
          params.search = searchTerm;
        }
        
        if (filterStatus !== 'all') {
          params.status = filterStatus;
        }
        
        if (dateRange.startDate && dateRange.endDate) {
          params.startDate = dateRange.startDate;
          params.endDate = dateRange.endDate;
        }
        
        // Try to fetch from backend API
        try {
          const response = await adminApi.getOrders(params);
          setOrders(response.data.data);
          setLoading(false);
        } catch (apiError) {
          console.warn('API call failed, using mock data instead:', apiError);
          
          // Fallback to mock data if API fails
          setTimeout(() => {
            let filteredOrders = [...mockOrders];
            
            // Filter by search term
            if (searchTerm) {
              filteredOrders = filteredOrders.filter(order => 
                order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
              );
            }
            
            // Filter by status
            if (filterStatus !== 'all') {
              filteredOrders = filteredOrders.filter(order => 
                order.status === filterStatus
              );
            }
            
            // Filter by date range
            if (dateRange.startDate && dateRange.endDate) {
              const startDate = new Date(dateRange.startDate);
              const endDate = new Date(dateRange.endDate);
              
              filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= startDate && orderDate <= endDate;
              });
            }
            
            // Simple pagination (in a real app, this would be handled by the backend)
            const itemsPerPage = 10;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);
            
            setOrders(paginatedOrders);
            setLoading(false);
          }, 500);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [currentPage, searchTerm, filterStatus, dateRange]); 

  // Handle order modal open
  const handleOrderModalOpen = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };
  
  // Handle status update modal open
  const handleStatusModalOpen = (order) => {
    setOrderToUpdate(order);
    setNewStatus(order.status);
    setShowStatusModal(true);
  };

  // Format date to readable format
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

  // Format address object to string
  const formatAddress = (address) => {
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
  };

  const handleStatusUpdate = async () => {
    if (!orderToUpdate || !newStatus) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to use the API
      try {
        await adminApi.updateOrderStatus(orderToUpdate._id, { status: newStatus });
        
        // Refresh orders list after successful API call
        const params = { 
          page: currentPage,
          limit: 10,
          search: searchTerm || undefined, 
          status: filterStatus !== 'all' ? filterStatus : undefined 
        };
        const response = await adminApi.getOrders(params);
        setOrders(response.data.orders);
      } catch (apiError) {
        console.warn('API call failed, updating UI only:', apiError);
        
        // Fallback to local state update if API fails
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update orders state with new status
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderToUpdate._id 
              ? { ...order, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
              : order
          )
        );
      }
      
      // Close modal
      setShowStatusModal(false);
      setOrderToUpdate(null);
      setNewStatus('');
      setLoading(false);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="admin-orders">
      <div className="page-header mb-4">
        <h1 className="page-title">Orders Management</h1>
        <p className="text-muted">Manage and track all customer orders</p>
      </div>

      {/* Order Stats Cards */}
      <Row className='mb-4'>
        <Col md={4} className='mb-4'>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="stats-icon bg-primary text-white rounded-circle p-3">
                  <BsEye size={24} />
                </div>
              </div>
              <h6 className="text-muted">Total Orders</h6>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3>{orders?.length}</h3>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className='mb-4'>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="stats-icon bg-warning text-white rounded-circle p-3">
                  <BsFilter size={24} />
                </div>
              </div>
              <h6 className="text-muted">Pending Orders</h6>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3>{orders.filter(order => order.status === 'pending').length}</h3>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className='mb-4'>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="stats-icon bg-success text-white rounded-circle p-3">
                  <BsCalendarDate size={24} />
                </div>
              </div>
              <h6 className="text-muted">Today's Orders</h6>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3>
                  {orders.filter(order => {
                    const today = new Date().toISOString().split('T')[0];
                    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                    return orderDate === today;
                  }).length}
                </h3>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filter Bar */}
      <Card className="admin-card mb-4">
        <Card.Body>
          <Row>
            <Col md={6} lg={4}>
              <InputGroup className="mb-3 mb-md-0">
                <InputGroup.Text>
                  <BsSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col md={6} lg={3}>
              <InputGroup>
                <InputGroup.Text>
                  <BsFilter />
                </InputGroup.Text>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Orders Table */}
      <Card className="admin-card mb-4">
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <DataTable
            columns={[
              {
                name: 'Order ID',
                selector: (row) => row._id,
                sortable: true,
              },
              {
                name: 'Customer',
                selector: (row) => row?.user?.name,
                sortable: true,
              },
              {
                name: 'Date',
                selector: (row) => row?.createdAt,
                sortable: true,
                format: (row) => formatDate(row?.createdAt),
              },
              {
                name: 'Amount',
                selector: (row) => row?.itemsPrice,
                format: (row) => `$${row?.itemsPrice?.toFixed(2)}`,
                sortable: true,
                right: true,
              },
              {
                name: 'Status',
                selector: (row) => row.orderStatus,
                sortable: true,
                cell: (row) => (
                  <Badge bg={getStatusBadgeVariant(row.orderStatus)}>
                    {row.orderStatus}
                  </Badge>
                ),
              },
              {
                name: 'Payment Status',
                selector: (row) => row.paymentStatus,
                sortable: true,
                cell: (row) => (
                  <Badge bg={getPaymentStatusBadgeVariant(row.paymentStatus)}>
                    {row.paymentStatus}
                  </Badge>
                ),
              },
              {
                name: 'Delivery Status',
                selector: (row) => row.deliveryStatus,
                sortable: true,
                cell: (row) => (
                  <Badge bg={getDeliveryStatusBadgeVariant(row.deliveryStatus)}>
                    {row.deliveryStatus}
                  </Badge>
                ),
              },
              {
                name: 'Actions',
                cell: (row) => (
                  <>
                    <Button
                      variant="light"
                      size="sm"
                      className="action-btn me-1"
                      onClick={() => handleOrderModalOpen(row)}
                      title="View Order"
                    >
                      <BsEye />
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      className="action-btn"
                      onClick={() => handleStatusModalOpen(row)}
                      title="Update Status"
                    >
                      <BsPencil />
                    </Button>
                  </>
                ),
                button: true,
                width: '120px',
              },
            ]}
            data={orders}
            progressPending={loading}
            progressComponent={
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
              </div>
            }
            pagination
            paginationServer
            paginationTotalRows={orders.length}
            paginationPerPage={10}
            paginationComponentOptions={{
              rowsPerPageText: 'Orders per page:',
              rangeSeparatorText: 'of',
            }}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(currentRowsPerPage, currentPage) => {
              // This would normally update the API request with new rows per page
              console.log(currentRowsPerPage, currentPage);
            }}
            highlightOnHover
            pointerOnHover
            responsive
            striped
            noDataComponent="No orders found"
          />
        </Card.Body>
      </Card>

      {/* Order Details Modal */}
      <Modal
        show={showOrderModal}
        onHide={() => setShowOrderModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h6>Order Information</h6>
                  <p className="mb-1">
                    <strong>Order ID:</strong> {selectedOrder._id}
                  </p>
                  <p className="mb-1">
                    <strong>Date:</strong> {formatDate(selectedOrder.createdAt)}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong>
                    <Badge bg={getStatusBadgeVariant(selectedOrder.orderStatus)} className="ms-2">
                      {selectedOrder.orderStatus}
                    </Badge>
                  </p>
                  <p className="mb-1">
                    <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                  </p>
                </Col>
                <Col md={6}>
                  <h6>Customer Information</h6>
                  <p className="mb-1">
                    <strong>Name:</strong> {selectedOrder.user.name}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {selectedOrder.user.email}
                  </p>
                  <p className="mb-1">
                    <strong>Shipping Address:</strong> {formatAddress(selectedOrder.shippingAddress)}
                  </p>
                </Col>
              </Row>

              <h6>Order Items</h6>
              <Table className="admin-table mb-4">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th className="text-end">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.orderItems.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="me-2"
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                          />
                          <div>{product.name}</div>
                        </div>
                      </td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>{product.quantity}</td>
                      <td className="text-end">${(product.price * product.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end">
                      <strong>Total</strong>
                    </td>
                    <td className="text-end">
                      <strong>${selectedOrder.itemsPrice?.toFixed(2)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        show={showStatusModal}
        onHide={() => setShowStatusModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Order Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {orderToUpdate && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Order ID</Form.Label>
                <Form.Control type="text" value={orderToUpdate._id} disabled />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Current Status</Form.Label>
                <div>
                  <Badge bg={getStatusBadgeVariant(orderToUpdate.status)} className="status-badge">
                    {orderToUpdate.status}
                  </Badge>
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>New Status</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStatusUpdate}
            disabled={loading || !orderToUpdate || newStatus === orderToUpdate?.status}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Orders;
