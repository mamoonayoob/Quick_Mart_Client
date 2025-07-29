import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Spinner, 
  Alert,
  Badge
} from 'react-bootstrap';
import { 
  BsCurrencyDollar, 
  BsCart3, 
  BsBoxSeam, 
  BsArrowUp, 
  BsArrowDown,
  BsTruck
} from 'react-icons/bs';
import DataTable from 'react-data-table-component';
import { vendorApi } from '../../services/api'; // Use vendor API

const VendorDashboard = () => {
  // Initial state for dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    totalProducts: 0,
    productsChange: 0,
    pendingDeliveries: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true); // Start with true to show loading state
  const [error, setError] = useState(null);
  

  
  // Use effect to load data when component mounts
  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
  }, []);
  
  // Function to load dashboard data from API
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Vendor Dashboard: Fetching real-time data from API...');
      
      // Fetch dashboard stats from API
      const statsResponse = await vendorApi.getDashboardStats();
      const statsData = statsResponse.data.stats || statsResponse.data.data || statsResponse.data;
      
      console.log('Vendor Dashboard: Stats data received:', statsData);
      
      // Update dashboard stats with real data
      setDashboardStats({
        totalRevenue: statsData.totalRevenue || 0,
        revenueChange: statsData.revenueChange || 0,
        totalOrders: statsData.totalOrders || 0,
        ordersChange: statsData.ordersChange || 0,
        totalProducts: statsData.totalProducts || 0,
        productsChange: statsData.productsChange || 0,
        pendingDeliveries: statsData.pendingDeliveries || 0
      });
      
      // Fetch recent orders from API
      const ordersResponse = await vendorApi.getRecentOrders();
      const ordersData = ordersResponse.data.orders || ordersResponse.data.data || ordersResponse.data;
      
      console.log('Vendor Dashboard: Recent orders received:', Array.isArray(ordersData) ? ordersData.length : 0, 'orders');
      setRecentOrders(Array.isArray(ordersData) ? ordersData : []);
      
      setLoading(false);
      
    } catch (err) {
      console.error('Error loading vendor dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      
      // Fallback to mock data if API fails
      console.log('Vendor Dashboard: Using fallback mock data due to API error');
      setDashboardStats({
        totalRevenue: 42500,
        revenueChange: 12.5,
        totalOrders: 156,
        ordersChange: 8.3,
        totalProducts: 48,
        productsChange: -2.1,
        pendingDeliveries: 12
      });
      setRecentOrders(mockRecentOrders);
      setLoading(false);
    }
  };

  // Dashboard data already initialized above

  // Mock recent orders for this vendor
  const mockRecentOrders = [
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

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch stats data first (this is working)
        const statsResponse = await vendorApi.getDashboardStats();
        
        if (statsResponse.data.success) {
          setDashboardStats(statsResponse.data.stats);
        } else {
          // If no success flag, try direct data access
          setDashboardStats(statsResponse.data);
        }
        
        // Try to fetch orders and products separately with error handling
        try {
          const ordersResponse = await vendorApi.getRecentOrders();
          if (ordersResponse.data.success) {
            setRecentOrders(ordersResponse.data.orders);
          } else {
            setRecentOrders(mockRecentOrders);
          }
        } catch (ordersError) {
          console.error('Error fetching recent orders:', ordersError);
          setRecentOrders(mockRecentOrders);
        }
        
        // Top products section removed as requested by user
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        
        // Fallback to mock data if API fails (for development purposes)
        setDashboardStats({
          totalRevenue: 42500,
          revenueChange: 12.5,
          totalOrders: 156,
          ordersChange: 8.3,
          totalProducts: 48,
          productsChange: -2.1,
          pendingDeliveries: 12
        });
        setRecentOrders(mockRecentOrders);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // DataTable columns for recent orders
  const recentOrdersColumns = [
    {
      name: 'Order ID',
      selector: row => row._id,
      sortable: true,
    },
    {
      name: 'Customer',
      selector: row => row.customer.name,
      sortable: true,
    },
    {
      name: 'Amount',
      selector: row => row.totalAmount,
      sortable: true,
      format: row => `$${row.totalAmount.toFixed(2)}`,
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <Badge bg={getStatusBadgeVariant(row.status)} className="status-badge">
          {row.status}
        </Badge>
      ),
    },
    {
      name: 'Date',
      selector: row => row.createdAt,
      sortable: true,
    }
  ];

  // DataTable columns for top products
  const topProductsColumns = [
    {
      name: 'Product',
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="d-flex align-items-center">
          <img 
            src={row.image} 
            alt={row.name} 
            style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }} 
          />
          <div>{row.name}</div>
        </div>
      ),
    },
    {
      name: 'Price',
      selector: row => row.price,
      sortable: true,
      format: row => `$${row.price.toFixed(2)}`,
    },
    {
      name: 'Stock',
      selector: row => row.stock,
      sortable: true,
    },
    {
      name: 'Sold',
      selector: row => row.sold,
      sortable: true,
    },
    {
      name: 'Category',
      selector: row => row.category,
      sortable: true,
    }
  ];

  // Helper function to get badge variant based on status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Delivered':
        return 'success';
      case 'Shipped':
        return 'info';
      case 'Processing':
        return 'primary';
      case 'Pending Delivery':
        return 'warning';
      case 'Cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="vendor-dashboard">
      <div className="page-header mb-4">
        <h1 className="page-title">Vendor Dashboard</h1>
        <p className="text-light">Welcome back to your vendor portal</p>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={6} xl={3}>
          <div className="stats-card primary">
            <div className="stats-icon">
              <BsCurrencyDollar />
            </div>
            <h6 className="stats-title">Total Revenue</h6>
            <h3 className="stats-value">${dashboardStats.totalRevenue.toLocaleString()}</h3>
            <div className={`stats-change ${dashboardStats.revenueChange >= 0 ? 'positive' : 'negative'}`}>
              {dashboardStats.revenueChange >= 0 ? <BsArrowUp /> : <BsArrowDown />}
              <span className="text-light">{Math.abs(dashboardStats.revenueChange)}% from last month</span>
            </div>
          </div>
        </Col>
        
        <Col md={6} xl={3}>
          <div className="stats-card success">
            <div className="stats-icon">
              <BsCart3 />
            </div>
            <h6 className="stats-title">Total Orders</h6>
            <h3 className="stats-value">{dashboardStats.totalOrders}</h3>
            <div className={`stats-change ${dashboardStats.ordersChange >= 0 ? 'positive' : 'negative'}`}>
              {dashboardStats.ordersChange >= 0 ? <BsArrowUp /> : <BsArrowDown />}
              <span className="text-light">{Math.abs(dashboardStats.ordersChange)}% from last month</span>
            </div>
          </div>
        </Col>
        
        <Col md={6} xl={3}>
          <div className="stats-card warning">
            <div className="stats-icon">
              <BsBoxSeam />
            </div>
            <h6 className="stats-title">Total Products</h6>
            <h3 className="stats-value">{dashboardStats.totalProducts}</h3>
            <div className={`stats-change ${dashboardStats.productsChange >= 0 ? 'positive' : 'negative'}`}>
              {dashboardStats.productsChange >= 0 ? <BsArrowUp /> : <BsArrowDown />}
              <span className="text-light">{Math.abs(dashboardStats.productsChange)}% from last month</span>
            </div>
          </div>
        </Col>
        
        <Col md={6} xl={3}>
          <div className="stats-card danger">
            <div className="stats-icon">
              <BsTruck />
            </div>
            <h6 className="stats-title">Pending Deliveries</h6>
            <h3 className="stats-value">{dashboardStats.pendingDeliveries}</h3>
            <div className="stats-change">
              <span className="text-light">Needs attention</span>
            </div>
          </div>
        </Col>
      </Row>
      
      {/* Recent Orders */}
      <Card className="admin-card mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <Card.Title className="mb-0">Recent Orders</Card.Title>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading recent orders...</p>
            </div>
          ) : (
            <DataTable
              columns={recentOrdersColumns}
              data={recentOrders}
              pagination
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

export default VendorDashboard;
