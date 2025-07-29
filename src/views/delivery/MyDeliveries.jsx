import React, { useState, useEffect, Fragment } from 'react';
import { useSelector } from 'react-redux';
import { 
  Card, 
  Row, 
  Col, 
  Badge, 
  Button, 
  Form, 
  Spinner,
  Alert,
  Modal,
  Container
} from 'react-bootstrap';
import { 
  BsBoxSeam, 
  BsTruck, 
  BsCheckCircle,
  BsPhone,
  BsGeoAlt,
  BsArrowClockwise,
  BsXCircle,
  BsEye,
  BsCalendar,
  BsSearch,
  BsClock,
  BsCheckLg
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import DataTable from 'react-data-table-component';
import { deliveryApi } from '../../services/api';

const MyDeliveries = () => {
  const { user } = useSelector((state) => state.auth);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deliveredOrdersForTable, setDeliveredOrdersForTable] = useState([]);
  
  // Simple stats - only 4 cards needed
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    inProgressDeliveries: 0,
    rejectedDeliveries: 0
  });

  useEffect(() => {
    fetchMyDeliveries();
    
    // Set up real-time polling every 30 seconds
    const pollInterval = setInterval(() => {
      fetchMyDeliveries();
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const fetchMyDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard stats from backend
      let backendStats = null;
      try {
        const statsRes = await deliveryApi.getDashboardStats();
        if (statsRes.data?.success) {
          backendStats = statsRes.data.stats;
          console.log('📊 Stats:', backendStats);
          console.log('📊 deliveredOrders count:', backendStats?.deliveredOrders);
          console.log('📊 recentActivity:', backendStats?.recentActivity);
          console.log('📊 Does stats have delivered orders data?', backendStats?.deliveredOrdersData || 'No');
        }
      } catch (statsError) {
        console.log('❌ Stats Error:', statsError.message);
      }
      
      // Get all 15 delivered orders - combine recentActivity with API data
      let deliveredOrdersData = [];
      const expectedCount = backendStats?.deliveredOrders || 15;
      
      // First, get delivered orders from recentActivity (has customer names and values)
      const deliveredFromStats = backendStats?.recentActivity?.filter(activity => 
        activity.status === 'delivered'
      ) || [];
      
      console.log('✅ Delivered from stats recentActivity:', deliveredFromStats.length);
      
      // Then get all delivered orders from API to fill the remaining slots
      try {
        const deliveredRes = await deliveryApi.getAllDeliveredOrders();
        console.log('📦 Delivered Orders API Response:', deliveredRes.data);
        
        if (deliveredRes.data?.success) {
          const allDeliveredOrders = deliveredRes.data.data || [];
          console.log('✅ All delivered orders from API:', allDeliveredOrders.length);
          
          // Create a map of stats data by order ID for easy lookup
          const statsDataMap = {};
          deliveredFromStats.forEach(statsOrder => {
            statsDataMap[statsOrder.id] = statsOrder;
          });
          
          // Enhance API orders with stats data where available
          const enhancedOrders = allDeliveredOrders.slice(0, expectedCount).map(apiOrder => {
            const statsData = statsDataMap[apiOrder._id] || statsDataMap[apiOrder.order];
            
            if (statsData) {
              // Use stats data for customer name and order value
              return {
                ...apiOrder,
                customerName: statsData.customerName,
                orderValue: statsData.orderValue,
                hasStatsData: true
              };
            } else {
              // Use API data only
              return {
                ...apiOrder,
                customerName: 'Customer Info Needed',
                orderValue: 0,
                hasStatsData: false
              };
            }
          });
          
          deliveredOrdersData = enhancedOrders;
          console.log('✅ Enhanced orders with stats data:', deliveredOrdersData.length);
          console.log('✅ Orders with customer data:', deliveredOrdersData.filter(o => o.hasStatsData).length);
          
        } else {
          // Fallback to just stats data if API fails
          deliveredOrdersData = deliveredFromStats.slice(0, expectedCount);
          console.log('⚠️ API failed, using only stats data:', deliveredOrdersData.length);
        }
      } catch (error) {
        // Fallback to just stats data if API fails
        deliveredOrdersData = deliveredFromStats.slice(0, expectedCount);
        console.log('❌ API error, using only stats data:', error.message);
      }
      
      console.log('✅ Final delivered orders for table:', deliveredOrdersData.length);
      setDeliveredOrdersForTable(deliveredOrdersData);
      
      // Also fetch regular deliveries for other dashboard data
      const allDeliveriesRes = await deliveryApi.getMyDeliveries();
      
      if (allDeliveriesRes.data?.success) {
        const allDeliveries = allDeliveriesRes.data.data || [];
        console.log('🚚 Regular deliveries (for dashboard):', allDeliveries.length);
        
        // Set deliveries data for dashboard
        setDeliveries(allDeliveries);
        
        // Use backend stats if available, otherwise calculate from data
        if (backendStats) {
          console.log('Using backend stats:', backendStats);
          setStats({
            totalDeliveries: backendStats.totalDeliveries || 0,
            deliveredOrders: backendStats.deliveredOrders || 0,
            inProgressOrders: backendStats.inProgressOrders || 0,
            rejectedOrders: backendStats.rejectedOrders || 0
          });
        } else {
          // Fallback to calculating stats from delivery data
          console.log('Calculating stats from delivery data...');
          calculateStats(allDeliveries);
        }
        
        // Update last refreshed timestamp
        setLastUpdated(new Date());
        
        console.log('✅ My Deliveries loaded successfully:', {
          total: allDeliveries.length,
          delivered: allDeliveries.filter(d => d.status === 'delivered').length,
          backendStatsUsed: !!backendStats
        });
      } else {
        throw new Error(allDeliveriesRes.data?.message || 'Failed to fetch deliveries');
      }
      
    } catch (error) {
      console.error('❌ Error fetching deliveries:', error);
      
      // Handle specific error types
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view deliveries.');
        toast.error('Access denied.');
      } else {
        setError('Failed to load your deliveries. Please try again.');
        toast.error('Failed to load deliveries');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (deliveries) => {
    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter(d => d.status === 'delivered').length;
    const inProgressDeliveries = deliveries.filter(d => d.status === 'picked_up' || d.status === 'in_transit').length;
    const rejectedDeliveries = deliveries.filter(d => d.status === 'rejected').length;
    
    setStats({
      totalDeliveries,
      completedDeliveries,
      inProgressDeliveries,
      rejectedDeliveries
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusConfig = (status) => {
    const configs = {
      'pending': { variant: 'warning', text: 'Pending' },
      'assigned': { variant: 'info', text: 'Assigned' },
      'picked_up': { variant: 'primary', text: 'Picked Up' },
      'in_transit': { variant: 'secondary', text: 'In Transit' },
      'delivered': { variant: 'success', text: 'Delivered' },
      'cancelled': { variant: 'danger', text: 'Cancelled' },
      'rejected': { variant: 'danger', text: 'Rejected' }
    };
    return configs[status] || { variant: 'secondary', text: status };
  };

  // Use existing delivery data to show real delivered orders
  // This uses the actual data that's already being fetched successfully
  const deliveredOrders = deliveries.filter(delivery => delivery.status === 'delivered');
  
  console.log('📊 Real delivered orders from existing data:', deliveredOrders.length);
  
  // Sort delivered orders by most recent delivery date (descending)
  const sortedDeliveredOrders = deliveredOrders.sort((a, b) => {
    const dateA = new Date(a.deliveryTime || a.updatedAt);
    const dateB = new Date(b.deliveryTime || b.updatedAt);
    return dateB - dateA; // Most recent first
  });

  // Filter delivered orders based on search
  const filteredDeliveredOrders = sortedDeliveredOrders.filter(delivery => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      delivery.order?.orderNumber?.toLowerCase().includes(searchLower) ||
      delivery.order?.user?.name?.toLowerCase().includes(searchLower) ||
      delivery._id?.toLowerCase().includes(searchLower)
    );
  });

  // Delivered Orders Table Columns
  const deliveredOrdersColumns = [
    {
      id: 1,
      name: 'Order ID',
      cell: row => (
        <div>
          <div className="fw-bold text-primary">
            #{row.order?.orderNumber || row._id?.slice(-6) || 'N/A'}
          </div>
          <small className="text-muted">
            {new Date(row.order?.createdAt || row.createdAt).toLocaleDateString()}
          </small>
        </div>
      ),
      sortable: true,
      width: '140px'
    },
    {
      id: 2,
      name: 'Customer Name',
      cell: row => (
        <div>
          <div className="fw-bold text-dark">
            {row.order?.user?.name || 'Unknown Customer'}
          </div>
          <small className="text-muted d-flex align-items-center">
            <BsPhone className="me-1" size={12} />
            {row.order?.user?.phone || 'No contact'}
          </small>
        </div>
      ),
      sortable: true,
      minWidth: '180px'
    },
    {
      id: 3,
      name: 'Total Amount',
      cell: row => (
        <div className="text-center">
          <div className="fw-bold text-success fs-6">
            ₹{row.order?.totalPrice?.toLocaleString() || '0'}
          </div>
          <small className="text-muted">Order Total</small>
        </div>
      ),
      sortable: true,
      center: true,
      width: '140px'
    },
    {
      id: 4,
      name: 'Date',
      cell: row => (
        <div className="text-center">
          <div className="fw-bold text-dark">
            {new Date(row.deliveryTime || row.updatedAt).toLocaleDateString()}
          </div>
          <small className="text-muted">
            {new Date(row.deliveryTime || row.updatedAt).toLocaleTimeString()}
          </small>
        </div>
      ),
      sortable: true,
      sortFunction: (a, b) => {
        const dateA = new Date(a.deliveryTime || a.updatedAt);
        const dateB = new Date(b.deliveryTime || b.updatedAt);
        return dateB - dateA;
      },
      center: true,
      width: '160px'
    },
    {
      id: 5,
      name: 'Details',
      cell: row => (
        <div className="text-center">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedDelivery(row);
              setShowDetailModal(true);
            }}
            className="px-3"
          >
            <BsEye className="me-1" size={14} />
            View Details
          </Button>
        </div>
      ),
      center: true,
      width: '140px',
      ignoreRowClick: true
    }
  ];

  // Legacy filter for all deliveries (keeping for compatibility)
  const filteredDeliveries = deliveries.filter(delivery => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      delivery._id?.toLowerCase().includes(searchLower) ||
      delivery.order?.orderNumber?.toLowerCase().includes(searchLower) ||
      delivery.order?.user?.name?.toLowerCase().includes(searchLower) ||
      delivery.status?.toLowerCase().includes(searchLower)
    );
  });

  // Filter only completed/delivered orders for the iframe table
  const completedDeliveries = deliveries.filter(delivery => 
    delivery.status === 'delivered' || delivery.status === 'completed'
  );

  const columns = [
    {
      name: '#',
      cell: (row, index) => (
        <div className="fw-bold text-primary">
          {index + 1}
        </div>
      ),
      width: '60px'
    },
    {
      name: 'Order Details',
      cell: row => (
        <div>
          <div className="fw-bold">{row.order?.orderNumber || 'N/A'}</div>
          <small className="text-muted">
            {row.order?.user?.name || 'Unknown Customer'}
          </small>
        </div>
      ),
      sortable: true,
      minWidth: '150px'
    },
    {
      name: 'Address',
      cell: row => (
        <div>
          {row.order?.shippingAddress ? (
            <>
              <div className="fw-bold">{row.order.shippingAddress.street}</div>
              <small className="text-muted d-flex align-items-center">
                <BsGeoAlt className="me-1" size={12} />
                {row.order.shippingAddress.city}, {row.order.shippingAddress.state}
              </small>
            </>
          ) : (
            <span className="text-muted">Address not available</span>
          )}
        </div>
      ),
      minWidth: '180px'
    },
    {
      name: 'Amount',
      cell: row => (
        <div className="text-center">
          <div className="fw-bold text-success">
            {formatCurrency(row.order?.totalPrice || 0)}
          </div>
          <small className="text-muted">Order Total</small>
        </div>
      ),
      center: true,
      width: '120px'
    },
    {
      name: 'Status',
      cell: row => {
        const statusConfig = getStatusConfig(row.status);
        return (
          <Badge bg={statusConfig.variant}>
            {statusConfig.text}
          </Badge>
        );
      },
      center: true,
      width: '120px'
    },
    {
      name: 'Date',
      cell: row => (
        <div className="text-center">
          <div className="fw-bold">
            {new Date(row.createdAt).toLocaleDateString()}
          </div>
          <small className="text-muted">
            {new Date(row.createdAt).toLocaleTimeString()}
          </small>
        </div>
      ),
      sortable: true,
      width: '120px'
    },
    {
      name: 'Contact',
      cell: row => (
        <div className="text-center">
          {row.order?.user?.phone ? (
            <Button
              variant="outline-success"
              size="sm"
              title="Call Customer"
              onClick={() => {
                window.open(`tel:${row.order.user.phone}`, '_self');
                toast.success('Opening phone dialer...');
              }}
            >
              <BsPhone className="me-1" size={14} />
              Call
            </Button>
          ) : (
            <span className="text-muted small">No contact</span>
          )}
        </div>
      ),
      width: '100px',
      center: true
    },
    {
      name: 'Actions',
      cell: row => (
        <Button
          variant="outline-primary"
          size="sm"
          title="View Details"
          onClick={() => {
            setSelectedDelivery(row);
            setShowDetailModal(true);
          }}
        >
          <BsEye className="me-1" size={14} />
          View
        </Button>
      ),
      width: '100px',
      center: true
    },
    {
      name: 'Customer',
      cell: row => (
        <div>
          <div className="fw-bold text-dark">
            {row.order?.user?.name || 'Unknown Customer'}
          </div>
          <small className="text-muted d-flex align-items-center">
            <BsPhone className="me-1" size={12} />
            {row.order?.user?.phone || 'No contact'}
          </small>
        </div>
      ),
      sortable: true,
      width: '160px'
    },
    {
      name: 'Address',
      cell: row => (
        <div>
          {row.order?.shippingAddress ? (
            <>
              <div className="fw-bold text-dark">
                {row.order.shippingAddress.street}
              </div>
              <small className="text-muted d-flex align-items-center">
                <BsGeoAlt className="me-1" size={12} />
                {row.order.shippingAddress.city}, {row.order.shippingAddress.state}
              </small>
            </>
          ) : (
            <span className="text-muted">Address not available</span>
          )}
        </div>
      ),
      minWidth: '180px'
    },
    {
      name: 'Amount',
      cell: row => (
        <div className="text-center">
          <div className="fw-bold text-success">
            {formatCurrency(row.order?.totalPrice || 0)}
          </div>
          <small className="text-muted">Order Total</small>
        </div>
      ),
      center: true,
      width: '120px'
    },
    {
      name: 'Status',
      cell: row => {
        const config = getStatusConfig(row.status);
        const IconComponent = config.icon;
        
        return (
          <div className="text-center">
            <Badge 
              bg={config.variant}
              className="d-flex align-items-center justify-content-center"
              style={{ 
                minWidth: '100px',
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              <IconComponent className="me-1" size={12} />
              {config.text}
            </Badge>
          </div>
        );
      },
      sortable: true,
      width: '140px'
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="text-center">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => {
              setSelectedDelivery(row);
              setShowDetailModal(true);
            }}
            className="me-2"
          >
            <BsEye className="me-1" size={12} />
            View
          </Button>
        </div>
      ),
      width: '100px',
      center: true
    }
  ];

  const getTabCounts = () => {
    const all = deliveries.length;
    const active = deliveries.filter(d => ['pending', 'assigned', 'picked_up', 'in_transit'].includes(d.status)).length;
    const completed = deliveries.filter(d => d.status === 'delivered').length;
    const cancelled = deliveries.filter(d => d.status === 'cancelled').length;
    
    return { all, active, completed, cancelled };
  };

  const tabCounts = getTabCounts();

  return (
    <div className="my-deliveries container mt-2">
      {/* Header - Responsive */}
      <div className="row align-items-center mb-4 specialcssmydeliveries">
        <div className="col-12 col-md-8 mb-3 mb-md-0">
          <h1 className="h3 mb-0">My Deliveries</h1>
          <div className="d-flex align-items-center gap-2">
            <p className="text-muted mb-0">All your delivery history and current assignments</p>
            {lastUpdated && (
              <div className="d-flex align-items-center text-success" style={{ fontSize: '0.875rem' }}>
                <div className="pulse-dot me-1"></div>
                <span>Live • Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-md-4 d-flex justify-content-md-end">
          <Button variant="outline-primary" onClick={fetchMyDeliveries} disabled={loading} className="w-100 w-md-auto">
          {loading ? (
            <>
              <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
              Refreshing...
            </>
          ) : (
            <>
              <BsArrowClockwise className="me-1" /> Refresh
            </>
          )}
          </Button>
        </div>
      </div>

      {/* Simple 4 Stats Cards */}
      <Row className={`g-3 mb-4 ${loading ? 'data-refresh' : ''}`}>
        <Col md={6} xl={3}>
          <div className="stats-card primary h-100 d-flex flex-column justify-content-between rounded shadow-sm p-3" style={{ boxShadow: '0 4px 12px rgba(54, 162, 235, 0.3)' }}>
            <div className="stats-icon">
              <BsBoxSeam />
            </div>
            <h6 className="stats-title">Total Deliveries</h6>
            <h3 className="stats-value">
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                stats.totalDeliveries || 0
              )}
            </h3>
            <div className="stats-change">
              <span className="text-light">All time</span>
            </div>
          </div>
        </Col>
        
        <Col md={6} xl={3}>
          <div className="stats-card success h-100 d-flex flex-column justify-content-between rounded shadow-sm p-3" style={{ boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)' }}>
            <div className="stats-icon">
              <BsCheckCircle />
            </div>
            <h6 className="stats-title">Completed</h6>
            <h3 className="stats-value">
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
              stats.deliveredOrders || 0
              )}
            </h3>
            <div className="stats-change">
              <span className="text-light">Successfully delivered</span>
            </div>
          </div>
        </Col>
        
        <Col md={6} xl={3}>
          <div className="stats-card warning h-100 d-flex flex-column justify-content-between rounded shadow-sm p-3" style={{ boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)' }}>
            <div className="stats-icon">
              <BsTruck />
            </div>
            <h6 className="stats-title">In Progress</h6>
            <h3 className="stats-value">
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                stats.inProgressOrders || 0
              )}
            </h3>
            <div className="stats-change">
              <span className="text-light">Active deliveries</span>
            </div>
          </div>
        </Col>
        
        <Col md={6} xl={3}>
          <div className="stats-card danger h-100 d-flex flex-column justify-content-between rounded shadow-sm p-3" style={{ boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)' }}>
            <div className="stats-icon">
              <BsXCircle />
            </div>
            <h6 className="stats-title">Rejected</h6>
            <h3 className="stats-value">
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                stats.rejectedOrders || 0
              )}
            </h3>
            <div className="stats-change">
              <span className="text-light">Declined assignments</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* Completed Orders Table in iframe */}
      <Card className="admin-card mb-4 overflow-hidden w-100">
        <Card.Header className="p-3">
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-8">
              <Card.Title className="mb-0">My Completed Orders</Card.Title>
              <small className="text-muted">Last 15 orders successfully delivered by you</small>
            </div>
            <div className="col-12 col-md-4 d-flex justify-content-md-end">
              <Badge bg="success" className="px-3 py-2">
                {deliveredOrdersForTable.length} Completed
              </Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading completed orders...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <Alert variant="danger">{error}</Alert>
              <Button variant="primary" onClick={fetchMyDeliveries}>
                Retry
              </Button>
            </div>
          ) : (
            <div style={{ height: 'auto', maxHeight: '70vh', overflow: 'hidden' }}>
              <iframe
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#fff'
                }}
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>Completed Orders</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                      body { 
                        margin: 0; 
                        padding: 15px; 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: #fff;
                      }
                      .table-container {
                        max-height: 450px;
                        overflow-y: auto;
                      }
                      .table th {
                        background-color: #f8f9fa;
                        border-top: none;
                        font-weight: 600;
                        font-size: 0.875rem;
                        position: sticky;
                        top: 0;
                        z-index: 10;
                      }
                      .table td {
                        vertical-align: middle;
                        font-size: 0.875rem;
                      }
                      .badge {
                        font-size: 0.75rem;
                      }
                      .order-id {
                        font-family: monospace;
                        font-weight: 600;
                      }
                      .customer-info {
                        line-height: 1.3;
                      }
                      .amount {
                        font-weight: 600;
                        color: #198754;
                      }
                      .date-info {
                        font-size: 0.8rem;
                        color: #6c757d;
                      }
                      .table tbody tr:hover {
                        background-color: #f8f9fa;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="table-container">
                      <table class="table table-hover mb-0">
                        <thead>
                          <tr>
                            <th style="width: 15%">Order ID</th>
                            <th style="width: 25%">Customer</th>
                            <th style="width: 30%">Order Status</th>
                            <th style="width: 15%">Amount</th>
                            <th style="width: 15%">Delivered Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${deliveredOrdersForTable.slice(0, 15).map((order, index) => {
                            // Enhanced data structure - combines API data with stats data
                            const orderId = order.id?.slice(-6) || order._id?.slice(-6) || `ORD-${index + 1}`;
                            
                            // Extract data - prioritize stats data when available
                            let customerName = order.customerName || 'Customer Info Needed';
                            let customerPhone = 'Phone Not Available'; // Not available in current data
                            let orderStatus = order.status || 'delivered'; // Show order status instead of address
                            let amount = order.orderValue || 0;
                            
                            // Add indicator if we have stats data
                            const hasRealData = order.hasStatsData ? '✓' : '';
                            
                            // Format status with proper styling
                            const getStatusBadge = (status) => {
                              const statusConfig = {
                                'delivered': { color: '#28a745', text: 'Delivered' },
                                'picked_up': { color: '#17a2b8', text: 'Picked Up' },
                                'in_transit': { color: '#ffc107', text: 'In Transit' },
                                'assigned': { color: '#6c757d', text: 'Assigned' },
                                'pending': { color: '#dc3545', text: 'Pending' }
                              };
                              const config = statusConfig[status] || { color: '#6c757d', text: status };
                              return `<span style="background-color: ${config.color}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${config.text}</span>`;
                            };
                            
                            // Date info - use delivery dates from API or stats
                            const deliveredDate = order.deliveryTime || order.deliveredAt || order.updatedAt;
                            const createdDate = order.createdAt || order.updatedAt;
                            
                            return `
                            <tr>
                              <td>
                                <div class="order-id">#${orderId}</div>
                                <div class="date-info">${createdDate ? new Date(createdDate).toLocaleDateString() : 'N/A'}</div>
                              </td>
                              <td>
                                <div class="customer-info">
                                  <div class="fw-semibold">${customerName}</div>
                                  <div class="text-muted">${customerPhone}</div>
                                </div>
                              </td>
                              <td>
                                <div class="text-center">
                                  ${getStatusBadge(orderStatus)}
                                </div>
                              </td>
                              <td>
                                <div class="amount">₹${Number(amount).toLocaleString()}</div>
                              </td>
                              <td>
                                <div>${deliveredDate ? new Date(deliveredDate).toLocaleDateString() : 'N/A'}</div>
                                <div class="date-info">${deliveredDate ? new Date(deliveredDate).toLocaleTimeString() : ''}</div>
                              </td>
                            </tr>
                            `;
                          }).join('')}
                          ${deliveredOrdersForTable.length === 0 ? `
                            <tr>
                              <td colspan="5" class="text-center py-5">
                                <div class="text-muted">
                                  <svg width="48" height="48" fill="currentColor" class="bi bi-check-circle mb-3" viewBox="0 0 16 16">
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                                  </svg>
                                  <h5>No completed orders yet</h5>
                                  <p>You haven't delivered any orders yet.</p>
                                </div>
                              </td>
                            </tr>
                          ` : ''}
                        </tbody>
                      </table>
                    </div>
                  </body>
                  </html>
                `}
                title="Completed Orders Table"
              />
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delivery Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="xl">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <BsBoxSeam className="me-2 text-primary" />
            Delivery Details - #{selectedDelivery?.order?.orderNumber || selectedDelivery?._id?.slice(-6)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedDelivery && (
            <>
              {/* Status Banner */}
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: getStatusConfig(selectedDelivery.status).color + '15' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <Badge 
                      bg={getStatusConfig(selectedDelivery.status).variant} 
                      className="me-3 p-2"
                      style={{ fontSize: '0.9rem' }}
                    >
                      {React.createElement(getStatusConfig(selectedDelivery.status).icon, { className: 'me-2', size: 16 })}
                      {getStatusConfig(selectedDelivery.status).text}
                    </Badge>
                    <div>
                      <h6 className="mb-0">Current Status</h6>
                      <small className="text-muted">Last updated: {new Date(selectedDelivery.updatedAt).toLocaleString()}</small>
                    </div>
                  </div>
                  {selectedDelivery.order?.user?.phone && (
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => window.open(`tel:${selectedDelivery.order.user.phone}`, '_self')}
                    >
                      <BsPhone className="me-1" /> Call Customer
                    </Button>
                  )}
                </div>
              </div>

              <Row>
                {/* Order Information */}
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="bg-primary text-white">
                      <h6 className="mb-0"><BsBoxSeam className="me-2" />Order Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Order ID:</strong>
                        <div className="text-primary fw-bold">#{selectedDelivery.order?.orderNumber || 'N/A'}</div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Customer:</strong>
                        <div className="fw-semibold">{selectedDelivery.order?.user?.name || 'N/A'}</div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Phone:</strong>
                        <div className="d-flex align-items-center">
                          <BsPhone className="me-2 text-muted" />
                          <span>{selectedDelivery.order?.user?.phone || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Order Amount:</strong>
                        <div className="text-success fw-bold fs-5">
                          ₹{selectedDelivery.order?.totalPrice?.toLocaleString() || 0}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Order Date:</strong>
                        <div>{new Date(selectedDelivery.order?.createdAt || selectedDelivery.createdAt).toLocaleDateString()}</div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Delivery Information */}
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0"><BsTruck className="me-2" />Delivery Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Delivery ID:</strong>
                        <div className="text-info fw-bold">{selectedDelivery._id}</div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Assigned Date:</strong>
                        <div>{new Date(selectedDelivery.createdAt).toLocaleString()}</div>
                      </div>
                      
                      {selectedDelivery.pickupTime && (
                        <div className="mb-3">
                          <strong>Pickup Time:</strong>
                          <div className="text-primary">{new Date(selectedDelivery.pickupTime).toLocaleString()}</div>
                        </div>
                      )}
                      
                      {selectedDelivery.deliveryTime && (
                        <div className="mb-3">
                          <strong>Delivery Time:</strong>
                          <div className="text-success">{new Date(selectedDelivery.deliveryTime).toLocaleString()}</div>
                        </div>
                      )}
                      
                      {selectedDelivery.estimatedDeliveryTime && (
                        <div className="mb-3">
                          <strong>Estimated Delivery:</strong>
                          <div>{new Date(selectedDelivery.estimatedDeliveryTime).toLocaleString()}</div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Delivery Address */}
              <Row className="mt-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-warning text-dark">
                      <h6 className="mb-0"><BsGeoAlt className="me-2" />Delivery Address</h6>
                    </Card.Header>
                    <Card.Body>
                      {selectedDelivery.order?.shippingAddress ? (
                        <div className="row">
                          <div className="col-md-8">
                            <div className="mb-2">
                              <strong>Street:</strong> {selectedDelivery.order.shippingAddress.street}
                            </div>
                            <div className="mb-2">
                              <strong>City:</strong> {selectedDelivery.order.shippingAddress.city}
                            </div>
                            <div className="mb-2">
                              <strong>State:</strong> {selectedDelivery.order.shippingAddress.state}
                            </div>
                            <div className="mb-2">
                              <strong>ZIP Code:</strong> {selectedDelivery.order.shippingAddress.zipCode}
                            </div>
                          </div>
                          <div className="col-md-4 text-end">
                            <Button 
                              variant="outline-primary" 
                              onClick={() => {
                                const address = `${selectedDelivery.order.shippingAddress.street}, ${selectedDelivery.order.shippingAddress.city}, ${selectedDelivery.order.shippingAddress.state} ${selectedDelivery.order.shippingAddress.zipCode}`;
                                window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
                              }}
                            >
                              <BsGeoAlt className="me-1" /> Open in Maps
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted mb-0">Address information not available</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Order Items - Enhanced */}
              {selectedDelivery.order?.items && selectedDelivery.order.items.length > 0 && (
                <Row className="mt-4">
                  <Col md={12}>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-dark text-white">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">
                            <BsBoxSeam className="me-2" />
                            Order Items ({selectedDelivery.order.items.length} items)
                          </h6>
                          <Badge bg="light" text="dark">
                            Total: ₹{selectedDelivery.order.totalPrice?.toLocaleString() || 0}
                          </Badge>
                        </div>
                      </Card.Header>
                      <Card.Body className="p-0">
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th className="fw-bold">Product Name</th>
                                <th className="fw-bold text-center">Quantity</th>
                                <th className="fw-bold text-end">Unit Price</th>
                                <th className="fw-bold text-end">Total Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedDelivery.order.items.map((item, index) => (
                                <tr key={index}>
                                  <td>
                                    <div className="fw-semibold text-dark">
                                      {item.product?.name || item.name || 'Unknown Item'}
                                    </div>
                                    {item.product?.description && (
                                      <small className="text-muted">{item.product.description}</small>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    <Badge bg="primary" className="px-3 py-2">
                                      {item.quantity}
                                    </Badge>
                                  </td>
                                  <td className="text-end fw-semibold">
                                    ₹{item.price?.toLocaleString() || 0}
                                  </td>
                                  <td className="text-end fw-bold text-success">
                                    ₹{(item.quantity * (item.price || 0)).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="table-light">
                              <tr>
                                <td colSpan="3" className="text-end fw-bold">Grand Total:</td>
                                <td className="text-end fw-bold text-success fs-5">
                                  ₹{selectedDelivery.order.totalPrice?.toLocaleString() || 0}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Payment Information */}
              <Row className="mt-4">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">
                        <BsCheckCircle className="me-2" />
                        Delivery Status
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Current Status:</strong>
                        <div className="mt-2">
                          <Badge 
                            bg={getStatusConfig(selectedDelivery.status).variant} 
                            className="p-2 fs-6"
                          >
                            {React.createElement(getStatusConfig(selectedDelivery.status).icon, { className: 'me-2', size: 16 })}
                            {getStatusConfig(selectedDelivery.status).text}
                          </Badge>
                        </div>
                      </div>
                      
                      {selectedDelivery.deliveryTime && (
                        <div className="mb-3">
                          <strong>Delivered At:</strong>
                          <div className="text-success fw-semibold">
                            {new Date(selectedDelivery.deliveryTime).toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      {selectedDelivery.pickupTime && (
                        <div className="mb-3">
                          <strong>Picked Up At:</strong>
                          <div className="text-info fw-semibold">
                            {new Date(selectedDelivery.pickupTime).toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-3">
                        <strong>Delivery Duration:</strong>
                        <div className="text-muted">
                          {selectedDelivery.pickupTime && selectedDelivery.deliveryTime ? (
                            (() => {
                              const pickup = new Date(selectedDelivery.pickupTime);
                              const delivery = new Date(selectedDelivery.deliveryTime);
                              const duration = Math.round((delivery - pickup) / (1000 * 60)); // minutes
                              return duration > 60 ? 
                                `${Math.floor(duration / 60)}h ${duration % 60}m` : 
                                `${duration} minutes`;
                            })()
                          ) : 'N/A'}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0">
                        <BsPhone className="me-2" />
                        Payment Information
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <strong>Payment Method:</strong>
                        <div className="mt-2">
                          <Badge 
                            bg={selectedDelivery.order?.paymentMethod === 'card' ? 'primary' : 'warning'} 
                            className="p-2"
                          >
                            {selectedDelivery.order?.paymentMethod === 'card' ? 'Card Payment' : 
                             selectedDelivery.order?.paymentMethod === 'cash' ? 'Cash on Delivery' :
                             selectedDelivery.order?.paymentMethod || 'Not Specified'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Payment Status:</strong>
                        <div className="mt-2">
                          <Badge 
                            bg={selectedDelivery.order?.paymentStatus === 'paid' ? 'success' : 'warning'} 
                            className="p-2"
                          >
                            {selectedDelivery.order?.paymentStatus === 'paid' ? 'Paid' : 
                             selectedDelivery.order?.paymentStatus === 'pending' ? 'Pending' :
                             selectedDelivery.order?.paymentStatus || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Order Total:</strong>
                        <div className="text-success fw-bold fs-5">
                          ₹{selectedDelivery.order?.totalPrice?.toLocaleString() || 0}
                        </div>
                      </div>
                      
                      {selectedDelivery.order?.deliveryFee && (
                        <div className="mb-3">
                          <strong>Delivery Fee:</strong>
                          <div className="text-muted">
                            ₹{selectedDelivery.order.deliveryFee.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Notes */}
              {selectedDelivery.notes && (
                <Row className="mt-4">
                  <Col xs={12}>
                    <Card className="border-0 shadow-sm">
                      <Card.Header className="bg-light">
                        <h6 className="mb-0">Delivery Notes</h6>
                      </Card.Header>
                      <Card.Body>
                        <p className="mb-0">{selectedDelivery.notes}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </>
          )}
          
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyDeliveries;
