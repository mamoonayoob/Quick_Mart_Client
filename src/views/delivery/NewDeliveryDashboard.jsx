import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Badge, 
  Button, 
  Form, 
  InputGroup, 
  Spinner,
  Alert,
  Modal,
  ButtonGroup,
  Dropdown,
  ProgressBar
} from 'react-bootstrap';
import { 
  BsBoxSeam, 
  BsCashCoin, 
  BsTruck, 
  BsCheckCircle,
  BsSearch,
  BsFilter,
  BsPhone,
  BsEye,
  BsMap,
  BsGeoAlt,
  BsInfoCircle,
  BsCheckLg,
  BsArrowClockwise,
  BsClock,
  BsCalendarCheck,
  BsThreeDotsVertical,
  BsArrowUp, 
  BsArrowDown,
  BsCurrencyDollar,
  BsDownload,
  BsCart3,
  BsPeople,
  BsBox,
  BsXCircle
} from 'react-icons/bs';
import { toast } from 'react-toastify';
import DataTable from 'react-data-table-component';
import { deliveryApi } from '../../services/api';

const DeliveryDashboard = () => {
  // Mock data for initial render - will be replaced with API data
  const mockStats = {
    totalDeliveries: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    inProgressDeliveries: 0,
    successRate: 0
  };

  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    inProgressDeliveries: 0,
    rejectedDeliveries: 0,
    successRate: 0
  });
  
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Assignment Approval System
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [processingAssignment, setProcessingAssignment] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    checkForPendingAssignments();
    
    // Set up real-time polling every 30 seconds
    const pollInterval = setInterval(() => {
      fetchDashboardData();
      checkForPendingAssignments();
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [statusFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Console data fetch for debugging
      console.log('=== DELIVERY DASHBOARD DATA FETCH ===');
      console.log('User ID:', user._id || user.id);
      console.log('User Role:', user.role);
      
      // Fetch dashboard stats from backend
      let backendStats = null;
      try {
        console.log('Fetching dashboard stats...');
        const statsRes = await deliveryApi.getDashboardStats();
        console.log('Stats Response:', statsRes.data);
        if (statsRes.data?.success) {
          backendStats = statsRes.data.stats;
          console.log('Backend Stats Data:', backendStats);
        }
      } catch (statsError) {
        console.log('Stats Error:', statsError.message);
      }
      
      // Fetch delivery tasks
      console.log('Fetching delivery tasks...');
      const allDeliveriesRes = await deliveryApi.getMyDeliveries();
      console.log('Delivery Tasks Response:', allDeliveriesRes.data);
      
      if (allDeliveriesRes.data?.success) {
        const allDeliveries = allDeliveriesRes.data.data || [];
        console.log('Delivery Tasks Data:', allDeliveries);
        console.log('Total Tasks Found:', allDeliveries.length);
        
        // Filter for active deliveries only (processing/pending orders)
        const activeDeliveries = allDeliveries.filter(delivery => 
          ['pending', 'assigned', 'picked_up', 'in_transit'].includes(delivery.status)
        );
        
        // Apply additional status filter if selected
        let filteredDeliveries = activeDeliveries;
        if (statusFilter !== 'all') {
          filteredDeliveries = activeDeliveries.filter(delivery => 
            delivery.status === statusFilter
          );
        }
        
        setDeliveries(filteredDeliveries);
        
        // Use backend stats if available, otherwise calculate from delivery data
        if (backendStats) {
          // Use backend stats for all calculations including earnings
          setStats({
            totalDeliveries: backendStats.totalDeliveries || 0,
            // totalEarnings: backendStats.totalRevenue || 0, // Use backend calculated revenue
            // todayEarnings: backendStats.todaysRevenue || 0, // Use backend today's revenue
            completedDeliveries: backendStats.deliveredOrders || 0,
            pendingDeliveries: backendStats.pendingOrders || 0,
            inProgressDeliveries: backendStats.inProgressOrders || 0,
            rejectedDeliveries: backendStats.rejectedOrders || 0, // Use backend rejected orders
            successRate: backendStats.successRate || 0 // Use backend calculated success rate
          });
        } else {
          // Fallback: Calculate stats from delivery data
          const today = new Date().toISOString().split('T')[0];
          const todayDeliveries = allDeliveries.filter(delivery => {
            const deliveryDate = new Date(delivery.deliveryTime || delivery.updatedAt).toISOString().split('T')[0];
            return delivery.status === 'delivered' && deliveryDate === today;
          });
          
          const completedDeliveries = allDeliveries.filter(d => d.status === 'delivered');
          const pendingDeliveries = allDeliveries.filter(d => d.status === 'pending' || d.status === 'assigned');
          const inProgressDeliveries = allDeliveries.filter(d => d.status === 'picked_up' || d.status === 'in_transit');
          const rejectedDeliveries = allDeliveries.filter(d => d.status === 'rejected');
          
          const successRate = allDeliveries.length > 0 
            ? Math.round((completedDeliveries.length / allDeliveries.length) * 100) 
            : 0;
          
          // Calculate earnings from delivery data
          const totalEarnings = completedDeliveries.reduce((sum, d) => {
            const amount = d.deliveryFee || d.earnings || (d.order?.totalPrice || 0) * 0.1;
            return sum + (parseFloat(amount) || 0);
          }, 0);
          
          const todayEarnings = todayDeliveries.reduce((sum, d) => {
            const amount = d.deliveryFee || d.earnings || (d.order?.totalPrice || 0) * 0.1;
            return sum + (parseFloat(amount) || 0);
          }, 0);
          
          setStats({
            totalDeliveries: allDeliveries.length,
            totalEarnings,
            todayEarnings,
            completedDeliveries: completedDeliveries.length,
            pendingDeliveries: pendingDeliveries.length,
            inProgressDeliveries: inProgressDeliveries.length,
            rejectedDeliveries: rejectedDeliveries.length,
            successRate
          });
        }
        
        // Update last refreshed timestamp
        setLastUpdated(new Date());
      } else {
        throw new Error(allDeliveriesRes.data?.message || 'Failed to load deliveries');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view delivery data.');
      } else {
        setError(error.response?.data?.message || 'Failed to load delivery data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  
  const applyFilters = (deliveries, searchTerm, status) => {
    let result = [...deliveries];
    
    // Apply status filter
    if (status && status !== 'all') {
      result = result.filter(delivery => delivery.status === status);
    }
    
    // Apply search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(delivery => 
        (delivery.order?.orderNumber?.toLowerCase().includes(term)) ||
        (delivery.order?.user?.name?.toLowerCase().includes(term)) ||
        (delivery.status?.toLowerCase().includes(term)) ||
        (delivery._id?.toLowerCase().includes(term))
      );
    }
    
    return result;
  };
  
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    const filtered = applyFilters(deliveries, value, statusFilter);
    setFilteredDeliveries(filtered);
  };
  

  
  const handleExport = () => {
    try {
      // Use filtered deliveries if available, otherwise use all deliveries
      const dataToExport = filteredDeliveries.length > 0 ? filteredDeliveries : deliveries;
      
      if (!dataToExport || dataToExport.length === 0) {
        toast.warning('No data to export');
        return;
      }

      // Create CSV header
      const headers = [
        'Order ID',
        'Order Date',
        'Customer',
        'Status',
        'Amount',
        'Delivery Address',
        'Phone',
        'Delivery Person'
      ];

      // Create CSV rows
      const csvRows = [];
      csvRows.push(headers.join(','));

      dataToExport.forEach(delivery => {
        const row = [
          `"${delivery.order?.orderNumber || delivery._id}"`,
          `"${new Date(delivery.createdAt).toLocaleString()}"`,
          `"${delivery.order?.user?.name || 'N/A'}"`,
          `"${delivery.status || 'N/A'}"`,
          `"${formatCurrency(delivery.order?.totalPrice || 0)}"`,
          `"${delivery.order?.shippingAddress?.street || 'N/A'}"`,
          `"${delivery.order?.shippingAddress?.phone || 'N/A'}"`,
          `"${delivery.deliveryPerson?.name || 'Unassigned'}"`
        ];
        csvRows.push(row.join(','));
      });

      // Create CSV file
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deliveries_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export deliveries');
    }
  };

  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = {
      'pending': [
        { value: 'assigned', label: 'Mark as Assigned' },
        { value: 'cancelled', label: 'Cancel Delivery' }
      ],
      'assigned': [
        { value: 'picked_up', label: 'Mark as Picked Up' },
        { value: 'cancelled', label: 'Cancel Delivery' }
      ],
      'picked_up': [
        { value: 'in_transit', label: 'Mark as In Transit' },
        { value: 'delivered', label: 'Mark as Delivered' },
        { value: 'cancelled', label: 'Cancel Delivery' }
      ],
      'in_transit': [
        { value: 'delivered', label: 'Mark as Delivered' },
        { value: 'cancelled', label: 'Cancel Delivery' }
      ]
    };
    
    return statusFlow[currentStatus] || [];
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    if (!deliveryId || !newStatus) return;
    
    try {
      setUpdatingStatus(deliveryId);
      
      // Save the current state in case we need to revert
      const currentDeliveries = [...deliveries];
      
      // Optimistically update the UI
      setDeliveries(prevDeliveries => 
        prevDeliveries.map(delivery => 
        delivery._id === deliveryId 
          ? { 
              ...delivery, 
              status: newStatus, 
              updatedAt: new Date().toISOString() 
            }
          : delivery
        )
      );
      
      // Update the status via API
      const response = await deliveryApi.updateDeliveryStatus(deliveryId, { status: newStatus });
      
      if (!response.data?.success) {
        // Revert to previous state if API call fails
        setDeliveries(currentDeliveries);
        throw new Error(response.data?.message || 'Failed to update status');
      }
      
      // If we get here, the API call was successful
      toast.success(`Delivery marked as ${newStatus.replace('_', ' ')}`);
      
      // Update the local state with the server response to ensure consistency
      setDeliveries(prevDeliveries => 
        prevDeliveries.map(delivery => 
          delivery._id === deliveryId
            ? { ...delivery, ...response.data.data }
            : delivery
        )
      );
      
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error(error.response?.data?.message || 'Failed to update delivery status');
      throw error;
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  
  const handleAcceptDelivery = (delivery) => {
    setSelectedDelivery(delivery);
    setShowAcceptModal(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedDelivery) return;
    
    try {
      setUpdatingStatus(selectedDelivery._id);
      const response = await deliveryApi.updateDeliveryStatus(
        selectedDelivery._id, 
        { status: selectedDelivery.newStatus }
      );
      
      if (response.data?.success) {
        toast.success('Delivery status updated successfully');
        setShowAcceptModal(false);
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Assignment Approval System Functions
  const checkForPendingAssignments = async () => {
    try {
      console.log('=== CHECKING FOR PENDING ASSIGNMENTS ===');
      // Check for deliveries with status 'assigned' but not yet accepted
      const response = await deliveryApi.getMyTasks();
      console.log('My tasks response:', response.data);
      
      if (response.data?.success) {
        const allTasks = response.data.data || [];
        console.log('All tasks:', allTasks);
        console.log('Tasks with assigned status:', allTasks.filter(d => d.status === 'assigned'));
        console.log('Tasks not accepted:', allTasks.filter(d => !d.isAccepted));
        
        const assignments = allTasks.filter(delivery => 
          delivery.status === 'assigned' && !delivery.isAccepted
        );
        console.log('Filtered pending assignments:', assignments);
        
        // If there are new assignments, show notification
        if (assignments.length > 0) {
          const newAssignments = assignments.filter(assignment => 
            !pendingAssignments.find(pending => pending._id === assignment._id)
          );
          
          if (newAssignments.length > 0) {
            setPendingAssignments(assignments);
            // Show modal for the first new assignment
            if (newAssignments[0]) {
              setCurrentAssignment(newAssignments[0]);
              setShowAssignmentModal(true);
              toast.info(`New delivery assignment received!`);
            }
          }
        } else {
          setPendingAssignments([]);
        }
      }
    } catch (error) {
      console.error('Error checking pending assignments:', error);
    }
  };

  const handleAcceptAssignment = async () => {
    console.log('=== ACCEPT ASSIGNMENT CLICKED ===');
    console.log('Current assignment:', currentAssignment);
    
    if (!currentAssignment) {
      console.log('ERROR: No current assignment found');
      return;
    }
    
    try {
      console.log('Setting processing to true...');
      setProcessingAssignment(true);
      
      console.log('Calling acceptTask API with ID:', currentAssignment._id);
      // Call backend to accept the assignment
      const response = await deliveryApi.acceptTask(currentAssignment._id);
      console.log('Accept API response:', response);
      
      if (response.data?.success) {
        toast.success('Assignment accepted successfully!');
        
        // Remove from pending assignments
        setPendingAssignments(prev => 
          prev.filter(assignment => assignment._id !== currentAssignment._id)
        );
        
        // Close modal
        setShowAssignmentModal(false);
        setCurrentAssignment(null);
        
        // Refresh dashboard data
        await fetchDashboardData();
        
        // Check for next pending assignment
        const remainingAssignments = pendingAssignments.filter(
          assignment => assignment._id !== currentAssignment._id
        );
        if (remainingAssignments.length > 0) {
          setTimeout(() => {
            setCurrentAssignment(remainingAssignments[0]);
            setShowAssignmentModal(true);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error accepting assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to accept assignment');
    } finally {
      setProcessingAssignment(false);
    }
  };

  const handleRejectAssignment = async () => {
    if (!currentAssignment) return;
    
    try {
      setProcessingAssignment(true);
      
      // Call backend to reject the assignment
      const response = await deliveryApi.rejectTask(currentAssignment._id, 'Rejected by delivery person');
      
      if (response.data?.success) {
        toast.success('Assignment rejected successfully!');
        
        // Remove from pending assignments
        setPendingAssignments(prev => 
          prev.filter(assignment => assignment._id !== currentAssignment._id)
        );
        
        // Close modal
        setShowAssignmentModal(false);
        setCurrentAssignment(null);
        
        // Refresh dashboard data
        await fetchDashboardData();
        
        // Check for next pending assignment
        const remainingAssignments = pendingAssignments.filter(
          assignment => assignment._id !== currentAssignment._id
        );
        if (remainingAssignments.length > 0) {
          setTimeout(() => {
            setCurrentAssignment(remainingAssignments[0]);
            setShowAssignmentModal(true);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to reject assignment');
    } finally {
      setProcessingAssignment(false);
    }
  };

  const handleViewOrderDetails = (delivery) => {
    setSelectedOrder(delivery);
    setShowOrderModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const columns = [
    {
      name: '#',
      cell: (row, index) => (
        <div className="fw-bold text-primary">
          {index + 1}
        </div>
      ),
      width: '50px'
    },
    {
      name: 'Order Details',
      cell: row => (
        <div>
          <div className="fw-bold text-dark">
            {row.order?.orderNumber || `#${row._id?.substring(0, 8).toUpperCase()}`}
          </div>
          <small className="text-muted">
            {new Date(row.createdAt).toLocaleDateString()}
          </small>
        </div>
      ),
      sortable: true,
      width: '140px'
    },
    {
      name: 'Customer Info',
      cell: row => (
        <div className="d-flex align-items-center">
          <div className="avatar-circle me-3">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(row.order?.user?.name || 'Customer')}&background=4361ee&color=fff&size=40`}
              alt="Customer"
              className="rounded-circle"
              width="40"
              height="40"
            />
          </div>
          <div>
            <div className="fw-semibold text-dark">{row.order?.user?.name || 'Customer'}</div>
            <small className="text-muted d-flex align-items-center">
              <BsPhone className="me-1" size={12} />
              {row.order?.user?.phone || 'N/A'}
            </small>
          </div>
        </div>
      ),
      sortable: true,
      minWidth: '220px'
    },
    {
      name: 'Delivery Address',
      cell: row => (
        <div>
          {row.order?.shippingAddress ? (
            <>
              <div className="fw-medium text-dark">{row.order.shippingAddress.street}</div>
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
      minWidth: '200px'
    },
    {
      name: 'Order Value',
      cell: row => (
        <div className="text-center">
          <div className="fw-bold text-success">
            {formatCurrency(row.order?.totalPrice || 0)}
          </div>
          <small className="text-muted">Order Total</small>
        </div>
      ),
      sortable: true,
      width: '120px'
    },
    {
      name: 'Status',
      cell: (row, rowIndex) => {
        const status = row.status || 'pending';
        const statusConfig = {
          pending: { variant: 'warning', icon: BsClock, text: 'Pending Assignment', color: '#f59e0b', bgColor: '#fef3c7' },
          assigned: { variant: 'info', icon: BsTruck, text: 'Ready for Pickup', color: '#06b6d4', bgColor: '#cffafe' },
          picked_up: { variant: 'primary', icon: BsCheckLg, text: 'Order Picked Up', color: '#4361ee', bgColor: '#e0e7ff' },
          in_transit: { variant: 'secondary', icon: BsTruck, text: 'On the Way', color: '#6b7280', bgColor: '#f3f4f6' },
          delivered: { variant: 'success', icon: BsCheckCircle, text: 'Delivered', color: '#10b981', bgColor: '#d1fae5' },
          cancelled: { variant: 'danger', icon: BsCheckCircle, text: 'Cancelled', color: '#ef4444', bgColor: '#fee2e2' },
          rejected: { variant: 'danger', icon: BsXCircle, text: 'Rejected by Delivery Boy', color: '#dc3545', bgColor: '#f8d7da' }
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        const IconComponent = config.icon;

        const handleStatusUpdate = async () => {
          const nextStatusMap = {
            'pending': 'assigned',
            'assigned': 'picked_up',
            'picked_up': 'in_transit',
            'in_transit': 'delivered'
          };
          
          const nextStatus = nextStatusMap[status];
          if (!nextStatus) return;
          
          try {
            setUpdatingStatus(row._id);
            
            // Update status via API
            const response = await deliveryApi.updateDeliveryStatus(row._id, nextStatus);
            
            if (response.data?.success) {
              // Show success message
              toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`);
              
              // Refresh data to get updated info
              await fetchDashboardData();
            }
          } catch (error) {
            console.error('Error updating status:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
          } finally {
            setUpdatingStatus(null);
          }
        };

        const canUpdate = ['pending', 'assigned', 'picked_up', 'in_transit'].includes(status);
        const isUpdating = updatingStatus === row._id;
        
        return (
          <div className="d-flex flex-column align-items-center">
            {/* Status Display */}
            <div 
              className="status-card p-2 rounded mb-2 text-center"
              style={{ 
                backgroundColor: config.bgColor,
                border: `2px solid ${config.color}`,
                minWidth: '120px',
                maxWidth: '160px'
              }}
            >
              <div className="d-flex align-items-center justify-content-center mb-1">
                <IconComponent 
                  className="me-2" 
                  size={16} 
                  style={{ color: config.color }}
                />
                <span 
                  className="fw-semibold" 
                  style={{ color: config.color, fontSize: '0.75rem' }}
                >
                  {config.text}
                </span>
              </div>
              <small className="text-muted">
                {new Date(row.updatedAt).toLocaleTimeString()}
              </small>
            </div>
            
            {/* Update Button - Only if backend supports it */}
            {canUpdate && (
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={handleStatusUpdate}
                disabled={isUpdating || loading}
                className="btn-sm"
                style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}
              >
                {isUpdating ? (
                  <>
                    <Spinner as="span" size="sm" animation="border" role="status" className="me-1" />
                    Updating...
                  </>
                ) : (
                  <>
                    <BsArrowUp className="me-1" size={10} />
                    Next Step
                  </>
                )}
              </Button>
            )}
          </div>
        );
      },
      minWidth: '200px',
      center: true
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="text-center">
          <Button
            variant="outline-info"
            size="sm"
            title="View Order Details"
            className="btn-action"
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
            onClick={() => handleViewOrderDetails(row)}
          >
            <BsEye className="me-1" size={12} />
            <span className="d-none d-md-inline">Details</span>
          </Button>
          {row.order?.orderItems && (
            <small className="text-muted d-block mt-1">
              {row.order.orderItems.length} item(s)
            </small>
          )}
        </div>
      ),
      width: '140px',
      center: true
    }
  ];

  const customStyles = {
    headCells: {
      style: {
        padding: '12px 15px',
        backgroundColor: '#f8f9fa',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        letterSpacing: '0.5px'
      },
    },
    cells: {
      style: {
        padding: '15px',
        verticalAlign: 'middle'
      },
    },
  };

  if (loading && deliveries.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center flex-column" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    
    <div className="delivery-dashboard container mt-5 px-3 px-md-4 specialcss">
      {/* Dashboard Header - Responsive */}
      <div className="row align-items-center mb-4">
        <div className="col-12 col-lg-8 mb-3 mb-lg-0">
          <h1 className="h3 mb-2 mb-md-0">Delivery Dashboard</h1>
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2">
            <p className="text-muted mb-0 small">Welcome back to your delivery portal</p>
            {lastUpdated && (
              <div className="d-flex align-items-center text-success" style={{ fontSize: '0.75rem' }}>
                <div className="pulse-dot me-1"></div>
                <span className="d-none d-sm-inline">Live • Updated {new Date(lastUpdated).toLocaleTimeString()}</span>
                <span className="d-sm-none">Live</span>
              </div>
            )}
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center justify-content-lg-end">
          {/* Pending Assignments Notification */}
          {pendingAssignments.length > 0 && (
            <div className="position-relative">
              <Button
                variant="warning"
                onClick={() => {
                  if (pendingAssignments[0]) {
                    setCurrentAssignment(pendingAssignments[0]);
                    setShowAssignmentModal(true);
                  }
                }}
                className="d-flex align-items-center"
              >
                <BsTruck className="me-2" />
                Pending Assignments
                <Badge bg="danger" className="ms-2">
                  {pendingAssignments.length}
                </Badge>
              </Button>
            </div>
          )}
          
          <Button variant="outline-primary" onClick={fetchDashboardData} disabled={loading}>
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
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      {/* Stats Cards - Responsive */}
      <div className="bg-light shadow-sm mb-3 pb-3 rounded-bottom w-100">
        <Row className={`g-3 mx-0 ${loading ? 'data-refresh' : ''}`}>
        <Col xs={12} sm={6} lg={3}>
          <div className="stats-card primary h-100 d-flex flex-column justify-content-between rounded shadow-sm p-3" style={{ boxShadow: '0 4px 12px rgba(54, 162, 235, 0.3)' }}>
            <div className="stats-icon">
              <BsBoxSeam />
            </div>
            <h6 className="stats-title fs-6 fw-semibold">Total Deliveries</h6>
            <h3 className="stats-value fs-2 fw-bold my-2">
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                stats.totalDeliveries || 0
              )}
            </h3>
            <div className="stats-change positive">
              <BsArrowUp />
              <span className="text-light small">All time</span>
            </div>
          </div>
        </Col>
        
        <Col xs={12} sm={6} lg={3}>
          <div className="stats-card bg-danger text-white h-100 d-flex flex-column justify-content-between rounded shadow-sm p-3" style={{ background: 'linear-gradient(135deg, #dc3545, #c82333)', boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)' }}>
            <div className="stats-icon">
              <BsXCircle />
            </div>
            <h6 className="stats-title fs-6 fw-semibold">Rejected Orders</h6>
            <h3 className="stats-value fs-2 fw-bold my-2">
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                stats.rejectedOrders || 0
              )}
            </h3>
            <div className="stats-change">
              <span className="text-light small">Declined by delivery boys</span>
            </div>
          </div>
        </Col>
        
        <Col xs={12} sm={6} lg={3}>
          <div className="stats-card warning bg-warning h-100 d-flex flex-column justify-content-between rounded shadow-sm p-3" style={{ boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)' }}>
            <div className="stats-icon">
              <BsTruck />
            </div>
            <h6 className="stats-title fs-6 fw-semibold">In Progress</h6>
            <h3 className="stats-value fs-2 fw-bold my-2">
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                stats.inProgressDeliveries || 0
              )}
            </h3>
            <div className="stats-change">
              <span className="text-light small">Active deliveries</span>
            </div>
          </div>
        </Col>
        
        <Col xs={12} sm={6} lg={3}>
          <div className="stats-card danger bg-success h-100 d-flex flex-column justify-content-between rounded shadow-sm p-3" style={{ boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)' }}>
            <div className="stats-icon">
              <BsCheckCircle />
            </div>
            <h6 className="stats-title fs-6 fw-semibold">Completed</h6>
            <h3 className="stats-value fs-2 fw-bold my-2">
              {loading ? (
                <Spinner size="sm" animation="border" />
              ) : (
                stats.completedDeliveries || 0
              )}
            </h3>
            <div className="stats-change positive">
              <BsArrowUp />
              <span className="text-light small">{stats.successRate || 0}% success rate</span>
            </div>
          </div>
        </Col>
        </Row>
      </div>

      {/* Recent Deliveries Table - Admin/Vendor Dashboard Style - Scrollable */}
      <Card className="admin-card mb-4 overflow-hidden w-100" style={{ marginTop: '0px', position: 'relative', zIndex: 1 }}>
        <Card.Header className="p-3">
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-6">
              <Card.Title className="mb-0 h5">Recent Deliveries</Card.Title>
            </div>
            <div className="col-12 col-md-6">
              <div className="d-flex flex-column flex-sm-row gap-2">
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="flex-grow-1 w-100"
                />
                <Form.Select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="flex-shrink-0 w-auto"
                  style={{ minWidth: '140px' }}
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Ready</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
                <Button 
                  variant="outline-primary" 
                  onClick={handleExport}
                  disabled={loading || deliveries.length === 0}
                  className="flex-shrink-0 d-flex align-items-center justify-content-center"
                  size="sm"
                >
                  <BsDownload className="me-1 d-none d-sm-inline" /> 
                  <span className="d-none d-sm-inline">Export</span>
                  <BsDownload className="d-sm-none" />
                </Button>
              </div>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body className="p-0" style={{ minHeight: '400px' }}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading deliveries...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5">
              <Alert variant="danger">{error}</Alert>
              <Button variant="primary" onClick={fetchDashboardData}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="w-100" style={{ minHeight: '400px' }}>
              <DataTable
                columns={columns}
                data={deliveries}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 20, 50]}
                highlightOnHover
                pointerOnHover
                responsive
                striped
                noHeader
                fixedHeader
                fixedHeaderScrollHeight="400px"
                customStyles={{
                  headRow: {
                    style: {
                      backgroundColor: '#f8f9fa',
                      borderBottom: '2px solid #dee2e6',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }
                  },
                  table: {
                    style: {
                      minHeight: '300px'
                    }
                  },
                  tableWrapper: {
                    style: {
                      display: 'table',
                      width: '100%',
                      tableLayout: 'auto'
                    }
                  },
                  responsiveWrapper: {
                    style: {
                      minHeight: '300px',
                      overflowX: 'auto',
                      borderRadius: '0.25rem',
                      width: '100%'
                    }
                  }
                }}
                noDataComponent={
                  <div className="text-center py-5">
                    <BsBoxSeam size={48} className="text-muted mb-3" />
                    <h5>No deliveries found</h5>
                    <p className="text-muted">You don't have any deliveries at the moment.</p>
                  </div>
                }
              />
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Delivery Acceptance Modal */}
      <Modal show={showAcceptModal} onHide={() => setShowAcceptModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delivery Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to accept this delivery?</p>
          {selectedDelivery && (
            <div className="mt-3">
              <p><strong>Order ID:</strong> {selectedDelivery.order?.orderNumber || 'N/A'}</p>
              <p><strong>Customer:</strong> {selectedDelivery.order?.user?.name || 'N/A'}</p>
              <p><strong>Delivery Address:</strong> {selectedDelivery.order?.shippingAddress?.street || 'N/A'}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowAcceptModal(false)}
            disabled={updatingStatus === selectedDelivery?._id}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmAccept}
            disabled={updatingStatus === selectedDelivery?._id}
          >
            {updatingStatus === selectedDelivery?._id ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                Accepting...
              </>
            ) : (
              'Accept Delivery'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Order Details Modal with Google Maps */}
      <Modal show={showOrderModal} onHide={() => setShowOrderModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <BsInfoCircle className="me-2 text-info" />
            Order Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              {/* Order Summary */}
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Order Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-2">
                        <strong>Order ID:</strong> 
                        <span className="ms-2 text-primary">
                          {selectedOrder.order?.orderNumber || `#${selectedOrder._id?.substring(0, 8).toUpperCase()}`}
                        </span>
                      </div>
                      <div className="mb-2">
                        <strong>Order Date:</strong> 
                        <span className="ms-2">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="mb-2">
                        <strong>Total Amount:</strong> 
                        <span className="ms-2 text-success fw-bold">
                          {formatCurrency(selectedOrder.order?.totalPrice || 0)}
                        </span>
                      </div>
                      <div className="mb-2">
                        <strong>Delivery Fee:</strong> 
                        <span className="ms-2 text-info">
                          {formatCurrency(selectedOrder.order?.deliveryFee || 0)}
                        </span>
                      </div>
                      <div className="mb-2">
                        <strong>Status:</strong> 
                        <Badge bg="primary" className="ms-2">
                          {selectedOrder.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Customer Information</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex align-items-center mb-3">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedOrder.order?.user?.name || 'Customer')}&background=4361ee&color=fff&size=50`}
                          alt="Customer"
                          className="rounded-circle me-3"
                          width="50"
                          height="50"
                        />
                        <div>
                          <div className="fw-bold">{selectedOrder.order?.user?.name || 'Customer'}</div>
                          <small className="text-muted">{selectedOrder.order?.user?.email || 'N/A'}</small>
                        </div>
                      </div>
                      <div className="mb-2">
                        <strong>Phone:</strong> 
                        <span className="ms-2">{selectedOrder.order?.user?.phone || 'N/A'}</span>
                        {selectedOrder.order?.user?.phone && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="ms-2"
                            onClick={() => {
                              window.open(`tel:${selectedOrder.order.user.phone}`, '_self');
                              toast.success('Opening phone dialer...');
                            }}
                          >
                            <BsPhone size={12} /> Call
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Order Items */}
              {selectedOrder.order?.orderItems && selectedOrder.order.orderItems.length > 0 && (
                <Card className="mb-4">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">Order Items ({selectedOrder.order.orderItems.length})</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.order.orderItems.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {item.image && (
                                    <img 
                                      src={item.image} 
                                      alt={item.name}
                                      className="me-2 rounded"
                                      width="40"
                                      height="40"
                                      style={{ objectFit: 'cover' }}
                                    />
                                  )}
                                  <div>
                                    <div className="fw-medium">{item.name || 'Item'}</div>
                                    {item.description && (
                                      <small className="text-muted">{item.description}</small>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>{item.quantity || 1}</td>
                              <td>{formatCurrency(item.price || 0)}</td>
                              <td className="fw-bold">{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Delivery Address & Google Maps */}
              <Card>
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Delivery Location</h6>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      const address = selectedOrder.order?.shippingAddress;
                      if (address) {
                        const query = encodeURIComponent(`${address.street}, ${address.city}, ${address.state} ${address.zipCode}`);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                      }
                    }}
                  >
                    <BsMap className="me-1" /> Open in Google Maps
                  </Button>
                </Card.Header>
                <Card.Body>
                  {selectedOrder.order?.shippingAddress ? (
                    <div>
                      <div className="mb-3">
                        <div className="fw-bold text-dark">
                          <BsGeoAlt className="me-2 text-danger" />
                          {selectedOrder.order.shippingAddress.street}
                        </div>
                        <div className="text-muted">
                          {selectedOrder.order.shippingAddress.city}, {selectedOrder.order.shippingAddress.state} {selectedOrder.order.shippingAddress.zipCode}
                        </div>
                        {selectedOrder.order.shippingAddress.country && (
                          <div className="text-muted">{selectedOrder.order.shippingAddress.country}</div>
                        )}
                      </div>
                      
                      {/* Embedded Google Maps */}
                      <div className="border rounded" style={{ height: '300px', overflow: 'hidden' }}>
                        <iframe
                          width="100%"
                          height="300"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO_BcqCGAOtMtk&q=${encodeURIComponent(
                            `${selectedOrder.order.shippingAddress.street}, ${selectedOrder.order.shippingAddress.city}, ${selectedOrder.order.shippingAddress.state} ${selectedOrder.order.shippingAddress.zipCode}`
                          )}`}
                        ></iframe>
                      </div>
                      
                      <div className="mt-3 d-flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            const address = selectedOrder.order.shippingAddress;
                            const query = encodeURIComponent(`${address.street}, ${address.city}, ${address.state} ${address.zipCode}`);
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
                          }}
                        >
                          <BsMap className="me-1" /> Get Directions
                        </Button>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => {
                            const address = selectedOrder.order.shippingAddress;
                            const query = encodeURIComponent(`${address.street}, ${address.city}, ${address.state} ${address.zipCode}`);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                          }}
                        >
                          <BsGeoAlt className="me-1" /> View on Maps
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <BsGeoAlt size={48} className="text-muted mb-3" />
                      <h6>No delivery address available</h6>
                      <p className="text-muted mb-0">Address information is not provided for this order.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
            Close
          </Button>
          {selectedOrder?.order?.user?.phone && (
            <Button
              variant="success"
              onClick={() => {
                window.open(`tel:${selectedOrder.order.user.phone}`, '_self');
                toast.success('Opening phone dialer...');
              }}
            >
              <BsPhone className="me-1" /> Call Customer
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Assignment Approval Modal */}
      <Modal 
        show={showAssignmentModal} 
        onHide={() => !processingAssignment && setShowAssignmentModal(false)} 
        centered 
        backdrop={processingAssignment ? 'static' : true}
        keyboard={!processingAssignment}
      >
        <Modal.Header closeButton={!processingAssignment}>
          <Modal.Title className="d-flex align-items-center">
            <BsTruck className="me-2 text-primary" />
            New Delivery Assignment
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentAssignment && (
            <div>
              <Alert variant="info" className="mb-4">
                <div className="d-flex align-items-center">
                  <BsInfoCircle className="me-2" size={20} />
                  <div>
                    <strong>You have received a new delivery assignment!</strong>
                    <br />
                    <small>Please review the details below and choose to accept or reject this assignment.</small>
                  </div>
                </div>
              </Alert>

              {/* Assignment Details */}
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">Assignment Details</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong>Order ID:</strong>
                        <div className="text-primary">
                          {currentAssignment.order?.orderNumber || `#${currentAssignment._id?.substring(0, 8).toUpperCase()}`}
                        </div>
                      </div>
                      <div className="mb-3">
                        <strong>Order Value:</strong>
                        <div className="text-success fw-bold">
                          {formatCurrency(currentAssignment.order?.totalPrice || 0)}
                        </div>
                      </div>
                      <div className="mb-3">
                        <strong>Delivery Fee:</strong>
                        <div className="text-info fw-bold">
                          {formatCurrency(currentAssignment.order?.deliveryFee || 0)}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong>Customer:</strong>
                        <div>{currentAssignment.order?.user?.name || 'Customer'}</div>
                        <small className="text-muted">
                          <BsPhone className="me-1" size={12} />
                          {currentAssignment.order?.user?.phone || 'N/A'}
                        </small>
                      </div>
                      <div className="mb-3">
                        <strong>Assigned At:</strong>
                        <div>{new Date(currentAssignment.createdAt).toLocaleString()}</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Delivery Address */}
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">Delivery Address</h6>
                </Card.Header>
                <Card.Body>
                  {currentAssignment.order?.shippingAddress ? (
                    <div>
                      <div className="fw-bold text-dark">
                        <BsGeoAlt className="me-2 text-danger" />
                        {currentAssignment.order.shippingAddress.street}
                      </div>
                      <div className="text-muted">
                        {currentAssignment.order.shippingAddress.city}, {currentAssignment.order.shippingAddress.state} {currentAssignment.order.shippingAddress.zipCode}
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            const address = currentAssignment.order.shippingAddress;
                            const query = encodeURIComponent(`${address.street}, ${address.city}, ${address.state} ${address.zipCode}`);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                          }}
                        >
                          <BsMap className="me-1" /> View on Maps
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted">Address not available</div>
                  )}
                </Card.Body>
              </Card>

              {/* Pending Assignments Counter */}
              {pendingAssignments.length > 1 && (
                <Alert variant="warning">
                  <BsClock className="me-2" />
                  <strong>Multiple Assignments:</strong> You have {pendingAssignments.length} pending assignments. 
                  This is assignment 1 of {pendingAssignments.length}.
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-3 justify-content-center">
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleRejectAssignment}
                  disabled={processingAssignment}
                  className="px-4"
                >
                  {processingAssignment ? (
                    <>
                      <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <BsCheckCircle className="me-2" />
                      ❌ Reject Assignment
                    </>
                  )}
                </Button>
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleAcceptAssignment}
                  disabled={processingAssignment}
                  className="px-4"
                >
                  {processingAssignment ? (
                    <>
                      <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <BsCheckCircle className="me-2" />
                      ✅ Accept Assignment
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DeliveryDashboard;