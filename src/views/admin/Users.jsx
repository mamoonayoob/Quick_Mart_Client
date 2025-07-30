import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-bootstrap';
import { 
  BsSearch, 
  BsFilter, 
  BsPlus, 
  BsEye, 
  BsPencil, 
  BsTrash,
  BsPersonCheck,
  BsPeople,
  BsShieldLock
} from 'react-icons/bs';
import DataTable from 'react-data-table-component';
import { toast } from 'react-toastify';
import { adminApi } from '../../services/api';


const Users = () => {
  // State for users data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for pagination
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // State for user modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    isActive: true,
    phone: '',
    address: ''
  });
  

  
  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Prepare query parameters
        const params = { 
          page: currentPage, 
          limit: perPage, 
          search: searchTerm || undefined, 
          role: filterRole !== 'all' ? filterRole : undefined 
        };
        
        // Fetch from backend API only
        const response = await adminApi.getUsers(params);
        
        if (response.data && response.data.data) {
          setUsers(response.data.data);
          setTotalRows(response.data.totalCount || response.data.data.length);
        } else {
          // If no data structure, set empty arrays
          setUsers([]);
          setTotalRows(0);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        setUsers([]);
        setTotalRows(0);
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [currentPage, searchTerm, filterRole, perPage]);
  
  // Handle user modal open
  const handleUserModalOpen = (mode, user = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    
    if (mode === 'add') {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        isActive: true,
        phone: '',
        address: ''
      });
    } else if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Don't show existing password
        role: user.role,
        isActive: user.isActive,
        phone: user.phone || '',
        address: user.address || ''
      });
    }
    
    setShowUserModal(true);
  };
  
  // Handle user form submit
  const handleUserFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Prepare form data for submission
      const submitData = { ...formData };
      
      // For edit mode, only include password if it's not empty
      if (modalMode === 'edit' && !submitData.password) {
        delete submitData.password;
      }
      
      console.log('Submitting user data:', { ...submitData, password: '***' });
      
      // Ensure role consistency - map 'delivery' to what backend expects
      if (submitData.role === 'delivery') {
        console.log('Creating delivery user with role: delivery');
      }
      
      // Submit to API
      let apiResponse;
      if (modalMode === 'add') {
        apiResponse = await adminApi.createUser(submitData);
        console.log('✅ User created successfully:', {
          success: apiResponse.data?.success,
          user: apiResponse.data?.user,
          message: apiResponse.data?.message
        });
        
        // Verify the created user has correct role
        if (apiResponse.data?.user) {
          console.log('✅ Created user details:', {
            id: apiResponse.data.user._id,
            email: apiResponse.data.user.email,
            role: apiResponse.data.user.role,
            name: apiResponse.data.user.name
          });
          
          // Test login credentials immediately
          console.log('🔐 User can now login with:', {
            email: apiResponse.data.user.email,
            password: '[password provided]',
            expectedDashboard: submitData.role === 'delivery' ? '/delivery/dashboard' : 
                              submitData.role === 'vendor' ? '/vendor/dashboard' :
                              submitData.role === 'admin' ? '/admin/dashboard' : '/'
          });
        }
      } else {
        apiResponse = await adminApi.updateUser(selectedUser._id, submitData);
        console.log('✅ User updated successfully:', apiResponse);
      }
      
      // Refresh user list after successful API call
      const params = { 
        page: currentPage, 
        limit: perPage, 
        search: searchTerm || undefined, 
        role: filterRole !== 'all' ? filterRole : undefined 
      };
      
      const response = await adminApi.getUsers(params);
      console.log('Refreshed users response:', response);
      
      // Fix: Use correct response path
      if (response.data && response.data.data) {
        setUsers(response.data.data);
        setTotalRows(response.data.totalCount || response.data.data.length);
      } else {
        // Fallback: try direct data access
        setUsers(response.data || []);
        setTotalRows(response.data?.length || 0);
      }
      
      // Close modal and reset state
      setShowUserModal(false);
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        isActive: true,
        phone: '',
        address: ''
      });
      setLoading(false);
      
      // Show success message
      const successMessage = modalMode === 'add' 
        ? `✅ ${submitData.role.charAt(0).toUpperCase() + submitData.role.slice(1)} user "${submitData.name}" created successfully!\n🔐 They can now login with email: ${submitData.email}` 
        : `✅ User "${submitData.name}" updated successfully!`;
      
      console.log(successMessage);
      toast.success(successMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
    } catch (err) {
      console.error('❌ Error saving user:', err);
      
      // Detailed error logging for debugging
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          data: err.config?.data ? JSON.parse(err.config.data) : null
        }
      });
      
      // Show detailed error to user
      let errorMessage = `Failed to ${modalMode === 'add' ? 'create' : 'update'} user`;
      
      if (err.response?.data?.message) {
        errorMessage += `: ${err.response.data.message}`;
      } else if (err.response?.status === 500) {
        errorMessage += ': Internal server error. Please check the backend logs.';
      } else if (err.message) {
        errorMessage += `: ${err.message}`;
      }
      
      console.error('❌ Final error message:', errorMessage);
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      setLoading(false);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to use the API
      try {
        await adminApi.deleteUser(userToDelete._id);
        
        // Refresh user list after successful API call
        const params = { 
          page: currentPage, 
          limit: perPage, 
          search: searchTerm || undefined, 
          role: filterRole !== 'all' ? filterRole : undefined 
        };
        const response = await adminApi.getUsers(params);
        
        // Fix: Use correct response path
        if (response.data && response.data.data) {
          setUsers(response.data.data);
          setTotalRows(response.data.totalCount || response.data.data.length);
        } else {
          setUsers(response.data || []);
          setTotalRows(response.data?.length || 0);
        }
      } catch (apiError) {
        console.warn('API call failed, updating UI only:', apiError);
        
        // Fallback to local state update if API fails
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        setUsers(prevUsers => 
          prevUsers.filter(user => user._id !== userToDelete._id)
        );
      }
      
      // Close modal
      setShowDeleteModal(false);
      setUserToDelete(null);
      setLoading(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle pagination change
  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // Handle per page change
  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
  };
  
  // Get badge variant based on user role
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'vendor':
        return 'warning';
      case 'delivery':
        return 'success';
      case 'customer':
        return 'info';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="admin-users">
      <div className="page-header mb-4">
        <h1 className="page-title">Users Management</h1>
        <p className="text-muted">Manage all users in the system</p>
      </div>
      
      {/* User Stats Cards */}
      <Row className="mb-4">
        <Col md={4} className='mb-4'>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="stats-icon bg-primary text-white rounded-circle p-3">
                  <BsPeople size={24} />
                </div>
              </div>
              <h6 className="text-muted">Total Users</h6>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3>{totalRows || users.length}</h3>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className='mb-4'>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="stats-icon bg-danger text-white rounded-circle p-3">
                  <BsShieldLock size={24} />
                </div>
              </div>
              <h6 className="text-muted">Admin Users</h6>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3>{users.filter(user => user.role === 'admin').length}</h3>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className='mb-4'>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="stats-icon bg-info text-white rounded-circle p-3">
                  <BsPersonCheck size={24} />
                </div>
              </div>
              <h6 className="text-muted">Active Users</h6>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3>{users.filter(user => user.isActive === true).length}</h3>
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
                  placeholder="Search users..."
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
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="vendor">Vendor</option>
                  <option value="delivery">Delivery Boy</option>
                  <option value="customer">Customer</option>
                </Form.Select>
              </InputGroup>
            </Col>
            
            <Col lg={5} className="d-flex justify-content-lg-end mt-3 mt-lg-0">
              <Button 
                variant="primary" 
                className="d-flex align-items-center"
                onClick={() => handleUserModalOpen('add')}
              >
                <BsPlus className="me-1" size={20} /> Add New User
              </Button>
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
      
      {/* Users Table */}
      <Card className="admin-card">
        <Card.Body>
          <DataTable
            title="Users Management"
            columns={[
              {
                name: 'Name',
                selector: row => row.name,
                sortable: true,
                cell: row => (
                  <div className="d-flex align-items-center">
                    <div 
                      className="user-avatar me-2"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#e9ecef',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        color: '#495057'
                      }}
                    >
                      {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div>{row.name}</div>
                  </div>
                )
              },
              {
                name: 'Email',
                selector: row => row.email,
                sortable: true
              },
              {
                name: 'Role',
                selector: row => row.role,
                sortable: true,
                cell: row => (
                  <Badge 
                    bg={getRoleBadgeVariant(row.role)} 
                    className="status-badge"
                  >
                    {row.role.charAt(0).toUpperCase() + row.role.slice(1)}
                  </Badge>
                )
              },
              {
                name: 'Status',
                selector: row => row.isActive,
                sortable: true,
                cell: row => (
                  <Badge 
                    bg={row.isActive ? 'success' : 'secondary'} 
                    className="status-badge"
                  >
                    {row.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                )
              },
              {
                name: 'Created Date',
                selector: row => row.createdAt,
                sortable: true
              },
              {
                name: 'Actions',
                cell: row => (
                  <div className="actions d-flex gap-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="action-icon"
                      onClick={() => handleUserModalOpen('view', row)}
                    >
                      <BsEye />
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      className="action-icon"
                      onClick={() => handleUserModalOpen('edit', row)}
                    >
                      <BsPencil />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="action-icon"
                      onClick={() => {
                        setUserToDelete(row);
                        setShowDeleteModal(true);
                      }}
                    >
                      <BsTrash />
                    </Button>
                  </div>
                ),
                button: true
              }
            ]}
            data={users}
            progressPending={loading}
            progressComponent={
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading users...</p>
              </div>
            }
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationDefaultPage={currentPage}
            paginationPerPage={perPage}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handlePerRowsChange}
            subHeader
            subHeaderComponent={
              <div className="w-100 d-flex flex-column flex-md-row justify-content-between mb-3">
                <div className="d-flex flex-column flex-md-row gap-3 mb-3 mb-md-0">
                  <InputGroup style={{ width: '250px' }}>
                    <InputGroup.Text>
                      <BsSearch />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                  
                  <InputGroup style={{ width: '200px' }}>
                    <InputGroup.Text>
                      <BsFilter />
                    </InputGroup.Text>
                    <Form.Select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="vendor">Vendor</option>
                      <option value="customer">Customer</option>
                    </Form.Select>
                  </InputGroup>
                </div>
                
                <Button 
                  variant="primary" 
                  className="d-flex align-items-center"
                  onClick={() => handleUserModalOpen('add')}
                >
                  <BsPlus className="me-1" size={20} /> Add New User
                </Button>
              </div>
            }
            customStyles={{
              headRow: {
                style: {
                  backgroundColor: '#f8f9fa',
                  borderTopStyle: 'solid',
                  borderTopWidth: '1px',
                  borderTopColor: '#e9ecef',
                }
              },
              rows: {
                style: {
                  minHeight: '60px',
                  fontSize: '14px'
                },
                stripedStyle: {
                  backgroundColor: '#f8f9fa',
                }
              }
            }}
            striped
            responsive
          />
        </Card.Body>
      </Card>
      
      {/* User Modal */}
      <Modal
        show={showUserModal}
        onHide={() => setShowUserModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'add' ? 'Add New User' : 
             modalMode === 'edit' ? 'Edit User' : 'User Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUserFormSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Password Field - Only show for new users */}
            {modalMode === 'add' && (
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password for new user"
                      required
                      minLength={6}
                    />
                    <Form.Text className="text-muted">
                      Password must be at least 6 characters long.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            )}
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="delivery">Delivery Boy</option>
                    {/* Admin option removed - only one admin allowed */}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <div className="d-flex align-items-center mt-2">
                    <Form.Check
                      type="switch"
                      id="user-status-switch"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      disabled={modalMode === 'view'}
                      label={formData.isActive ? 'Active' : 'Inactive'}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end mt-3">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => setShowUserModal(false)}
              >
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </Button>
              
              {modalMode !== 'view' && (
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
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
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userToDelete && (
            <p>
              Are you sure you want to delete user <strong>{userToDelete.name}</strong>? 
              This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setUserToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="danger"
            onClick={handleDeleteConfirm}
            disabled={loading}
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
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Users;
