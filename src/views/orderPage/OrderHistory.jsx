import React, { useState, useEffect } from 'react';
import { Container, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { getOrderHistory } from '../../helpers/apiHelpers';

function OrderHistory() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalOrders: 0
  });
  
  // Fetch orders when component mounts or pagination changes
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getOrderHistory(pagination.page, pagination.limit);
        
        setOrders(response.data || []);
        setPagination({
          ...pagination,
          totalPages: response.totalPages || 1,
          totalOrders: response.totalOrders || 0
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchOrders();
    } else {
      navigate('/login', { state: { from: '/orders/history' } });
    }
  }, [isAuthenticated, navigate, pagination.page, pagination.limit]);
  
  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'delivered':
        return 'success';
      case 'placed':
        return 'info';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Get payment status badge variant
  const getPaymentBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'info';
      default:
        return 'secondary';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // // Get status badge variant
  // const getStatusBadgeVariant = (status) => {
  //   switch (status?.toLowerCase()) {
  //     case 'pending':
  //       return 'warning';
  //     case 'processing':
  //       return 'info';
  //     case 'shipped':
  //       return 'primary';
  //     case 'delivered':
  //       return 'success';
  //     case 'placed':
  //       return 'info';
  //     case 'cancelled':
  //       return 'danger';
  //     default:
  //       return 'secondary';
  //   }
  // };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <p>Loading your orders...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </Container>
    );
  }
  
  if (orders.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">You haven't placed any orders yet.</Alert>
        <Button variant="primary" onClick={() => navigate('/')}>
          Start Shopping
        </Button>
      </Container>
    );
  }
  
  // Define columns for DataTable
  const columns = [
    {
      name: 'Order ID',
      selector: row => row._id,
      sortable: true,
      cell: row => <div>{row._id.substring(0, 8)}...</div>
    },
    {
      name: 'Date',
      selector: row => row.createdAt,
      sortable: true,
      cell: row => <div>{formatDate(row.createdAt)}</div>
    },
    {
      name: 'Items',
      selector: row => row.orderItems?.length || 0,
      sortable: true,
      cell: row => <div>{row.orderItems?.length || 0} items</div>
    },
    {
      name: 'Total',
      selector: row => row.totalPrice,
      sortable: true,
      cell: row => <div>${row.totalPrice?.toFixed(2) || '0.00'}</div>
    },
    {
      name: 'Order Status',
      selector: row => row.orderStatus,
      sortable: true,
      cell: row => (
        <Badge bg={getStatusBadgeVariant(row.orderStatus)}>
          {row.orderStatus || 'Processing'}
        </Badge>
      )
    },
    {
      name: 'Payment',
      selector: row => row.paymentStatus,
      sortable: true,
      cell: row => (
        <Badge bg={getPaymentBadgeVariant(row.paymentStatus)}>
          {row.paymentStatus || 'Pending'}
        </Badge>
      )
    },
    {
      name: 'Delivery',
      selector: row => row.deliveryStatus,
      sortable: true,
      cell: row => (
        <Badge bg={getStatusBadgeVariant(row.deliveryStatus)}>
          {row.deliveryStatus || 'Pending'}
        </Badge>
      )
    },
    {
      name: 'Actions',
      cell: row => (
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => handleViewDetails(row)}
        >
          View Details
        </Button>
      ),
      button: true,
    },
  ];

  // Handle view details button click
  const handleViewDetails = (order) => {
    // Store order details in session storage for viewing on details page
    sessionStorage.setItem('selectedOrder', JSON.stringify(order));
    navigate(`/orders/${order._id}`);
  };

  // Custom styles for DataTable
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f8f9fa',
        fontSize: '14px',
        fontWeight: 'bold',
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        fontSize: '14px',
      },
    },
  };

  // Handle page change in DataTable
  const handlePageChange = page => {
    setPagination({
      ...pagination,
      page: page,
    });
  };

  // Handle rows per page change
  const handlePerRowsChange = async (newPerPage, page) => {
    setPagination({
      ...pagination,
      page: page,
      limit: newPerPage
    });
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">My Orders</h1>
      
      <DataTable
        columns={columns}
        data={orders}
        pagination
        paginationServer
        paginationTotalRows={pagination.totalOrders}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handlePerRowsChange}
        progressPending={loading}
        progressComponent={<Spinner animation="border" />}
        customStyles={customStyles}
        striped
        highlightOnHover
        pointerOnHover
        responsive
      />
    </Container>
  );
}

export default OrderHistory;
