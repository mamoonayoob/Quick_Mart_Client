import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Button, 
  Row, 
  Col, 
  Tab, 
  Nav, 
  Alert, 
  Spinner,
  InputGroup
} from 'react-bootstrap';
import { 
  BsShieldLock, 
  BsGear, 
  BsBell, 
  BsEnvelope, 
  BsPerson, 
  BsCheck2Circle,
  BsExclamationTriangle
} from 'react-icons/bs';
import { useSelector } from 'react-redux';
import { adminApi } from '../../services/api';

const Settings = () => {
  // Get user from Redux store
  const { user } = useSelector(state => state.auth);
  
  // State for profile form
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    avatar: ''
  });
  
  // State for password form
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // State for notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    orderUpdates: true,
    newProducts: false,
    promotions: true,
    systemAlerts: true
  });
  
  // State for system settings
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'QuickMart',
    siteDescription: 'Your one-stop shop for all your needs',
    currency: 'USD',
    taxRate: '7.5',
    orderPrefix: 'ORD-',
    enableRegistration: true,
    maintenanceMode: false
  });
  
  // State for form submission
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Load user profile data
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'admin',
        avatar: user.avatar || ''
      });
    }
    
    // In a real app, you would fetch system settings from API
    // For now, we'll use mock data
  }, [user]);
  
  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle notification settings changes
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle system settings changes
  const handleSystemSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };
  
  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      // In production, uncomment the API call below
      /*
      await adminApi.updateProfile(profile);
      */
      
      // Mock successful update
      setTimeout(() => {
        setSuccess('Profile updated successfully!');
        setLoading(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }, 800);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again later.');
      setLoading(false);
    }
  };
  
  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    
    if (passwords.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In production, uncomment the API call below
      /*
      await adminApi.updatePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      */
      
      // Mock successful update
      setTimeout(() => {
        setSuccess('Password updated successfully!');
        setLoading(false);
        
        // Clear form
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }, 800);
      
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password. Please check your current password and try again.');
      setLoading(false);
    }
  };
  
  // Handle notification settings update
  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      // In production, uncomment the API call below
      /*
      await adminApi.updateNotificationSettings(notifications);
      */
      
      // Mock successful update
      setTimeout(() => {
        setSuccess('Notification settings updated successfully!');
        setLoading(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }, 800);
      
    } catch (err) {
      console.error('Error updating notification settings:', err);
      setError('Failed to update notification settings. Please try again later.');
      setLoading(false);
    }
  };
  
  // Handle system settings update
  const handleSystemSettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      // In production, uncomment the API call below
      /*
      await adminApi.updateSettings(systemSettings);
      */
      
      // Mock successful update
      setTimeout(() => {
        setSuccess('System settings updated successfully!');
        setLoading(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }, 800);
      
    } catch (err) {
      console.error('Error updating system settings:', err);
      setError('Failed to update system settings. Please try again later.');
      setLoading(false);
    }
  };
  
  return (
    <div className="admin-settings">
      <div className="page-header mb-4">
        <h1 className="page-title">Settings</h1>
        <p className="text-muted">Manage your account and system settings</p>
      </div>
      
      <Card className="admin-card">
        <Card.Body>
          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Row>
              <Col md={3} className="mb-4 mb-md-0">
                <Nav variant="pills" className="flex-column settings-nav">
                  <Nav.Item>
                    <Nav.Link eventKey="profile" className="d-flex align-items-center">
                      <BsPerson className="me-2" />
                      Profile
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="security" className="d-flex align-items-center">
                      <BsShieldLock className="me-2" />
                      Security
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="notifications" className="d-flex align-items-center">
                      <BsBell className="me-2" />
                      Notifications
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="system" className="d-flex align-items-center">
                      <BsGear className="me-2" />
                      System Settings
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>
              
              <Col md={9}>
                {/* Success and Error Alerts */}
                {success && (
                  <Alert variant="success" className="d-flex align-items-center">
                    <BsCheck2Circle className="me-2" size={18} />
                    {success}
                  </Alert>
                )}
                
                {error && (
                  <Alert variant="danger" className="d-flex align-items-center">
                    <BsExclamationTriangle className="me-2" size={18} />
                    {error}
                  </Alert>
                )}
                
                <Tab.Content>
                  {/* Profile Settings */}
                  <Tab.Pane eventKey="profile">
                    <h5 className="mb-4">Profile Information</h5>
                    <Form onSubmit={handleProfileUpdate}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={profile.name}
                              onChange={handleProfileChange}
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
                              value={profile.email}
                              onChange={handleProfileChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={profile.phone}
                              onChange={handleProfileChange}
                            />
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Control
                              type="text"
                              value={profile.role}
                              disabled
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-4">
                        <Form.Label>Profile Image URL</Form.Label>
                        <Form.Control
                          type="text"
                          name="avatar"
                          value={profile.avatar}
                          onChange={handleProfileChange}
                          placeholder="https://example.com/avatar.jpg"
                        />
                        <Form.Text className="text-muted">
                          Enter a URL for your profile image
                        </Form.Text>
                      </Form.Group>
                      
                      <Button 
                        type="submit" 
                        variant="primary" 
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
                    </Form>
                  </Tab.Pane>
                  
                  {/* Security Settings */}
                  <Tab.Pane eventKey="security">
                    <h5 className="mb-4">Change Password</h5>
                    <Form onSubmit={handlePasswordUpdate}>
                      <Form.Group className="mb-3">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="currentPassword"
                          value={passwords.currentPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="newPassword"
                          value={passwords.newPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                        <Form.Text className="text-muted">
                          Password must be at least 6 characters long
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={passwords.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                        />
                      </Form.Group>
                      
                      <Button 
                        type="submit" 
                        variant="primary" 
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
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                    </Form>
                  </Tab.Pane>
                  
                  {/* Notification Settings */}
                  <Tab.Pane eventKey="notifications">
                    <h5 className="mb-4">Notification Preferences</h5>
                    <Form onSubmit={handleNotificationUpdate}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="emailNotifications"
                          name="emailNotifications"
                          label="Email Notifications"
                          checked={notifications.emailNotifications}
                          onChange={handleNotificationChange}
                        />
                        <Form.Text className="text-muted">
                          Receive notifications via email
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="orderUpdates"
                          name="orderUpdates"
                          label="Order Updates"
                          checked={notifications.orderUpdates}
                          onChange={handleNotificationChange}
                        />
                        <Form.Text className="text-muted">
                          Receive notifications about order status changes
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="newProducts"
                          name="newProducts"
                          label="New Products"
                          checked={notifications.newProducts}
                          onChange={handleNotificationChange}
                        />
                        <Form.Text className="text-muted">
                          Receive notifications about new products
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="promotions"
                          name="promotions"
                          label="Promotions"
                          checked={notifications.promotions}
                          onChange={handleNotificationChange}
                        />
                        <Form.Text className="text-muted">
                          Receive notifications about promotions and discounts
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Check
                          type="switch"
                          id="systemAlerts"
                          name="systemAlerts"
                          label="System Alerts"
                          checked={notifications.systemAlerts}
                          onChange={handleNotificationChange}
                        />
                        <Form.Text className="text-muted">
                          Receive important system alerts
                        </Form.Text>
                      </Form.Group>
                      
                      <Button 
                        type="submit" 
                        variant="primary" 
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
                          'Save Preferences'
                        )}
                      </Button>
                    </Form>
                  </Tab.Pane>
                  
                  {/* System Settings */}
                  <Tab.Pane eventKey="system">
                    <h5 className="mb-4">System Configuration</h5>
                    <Form onSubmit={handleSystemSettingsUpdate}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Site Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="siteName"
                              value={systemSettings.siteName}
                              onChange={handleSystemSettingChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Currency</Form.Label>
                            <Form.Select
                              name="currency"
                              value={systemSettings.currency}
                              onChange={handleSystemSettingChange}
                            >
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="JPY">JPY (¥)</option>
                              <option value="CAD">CAD (C$)</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Site Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          name="siteDescription"
                          value={systemSettings.siteDescription}
                          onChange={handleSystemSettingChange}
                        />
                      </Form.Group>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Tax Rate (%)</Form.Label>
                            <Form.Control
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              name="taxRate"
                              value={systemSettings.taxRate}
                              onChange={handleSystemSettingChange}
                            />
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Order ID Prefix</Form.Label>
                            <Form.Control
                              type="text"
                              name="orderPrefix"
                              value={systemSettings.orderPrefix}
                              onChange={handleSystemSettingChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="enableRegistration"
                          name="enableRegistration"
                          label="Enable User Registration"
                          checked={systemSettings.enableRegistration}
                          onChange={handleSystemSettingChange}
                        />
                        <Form.Text className="text-muted">
                          Allow new users to register on the site
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Check
                          type="switch"
                          id="maintenanceMode"
                          name="maintenanceMode"
                          label="Maintenance Mode"
                          checked={systemSettings.maintenanceMode}
                          onChange={handleSystemSettingChange}
                        />
                        <Form.Text className="text-muted">
                          Put the site in maintenance mode (only admins can access)
                        </Form.Text>
                      </Form.Group>
                      
                      <Button 
                        type="submit" 
                        variant="primary" 
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
                          'Save Settings'
                        )}
                      </Button>
                    </Form>
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Settings;
