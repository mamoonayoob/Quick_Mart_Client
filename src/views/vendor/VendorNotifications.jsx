import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Form, Button, Alert, Spinner, Badge, Tabs, Tab } from 'react-bootstrap';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { useMessages } from '../../context/MessageContext';
import { sendNotificationToCustomer, sendNotificationToAllCustomers, getCustomersForNotifications } from '../../services/notificationApi';

const VendorNotifications = () => {
  const { user } = useSelector(state => state.auth);
  const { notifications, loading, error, fetchNotifications } = useMessages();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [notificationContent, setNotificationContent] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [customerList, setCustomerList] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState({ success: false, message: '' });
  const [activeTab, setActiveTab] = useState('individual');

  // Fetch notifications and customers on component mount
  useEffect(() => {
    fetchNotifications();
    fetchCustomers();
  }, [fetchNotifications]);
  
  // Fetch customers for notifications
  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await getCustomersForNotifications();
      if (response && response.success) {
        setCustomerList(response.data || []);
      } else {
        // Fallback to dummy data if API fails
        setCustomerList([
          { _id: 'cust1', name: 'John Doe' },
          { _id: 'cust2', name: 'Jane Smith' },
          { _id: 'cust3', name: 'Robert Johnson' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Fallback to dummy data
      setCustomerList([
        { _id: 'cust1', name: 'John Doe' },
        { _id: 'cust2', name: 'Jane Smith' },
        { _id: 'cust3', name: 'Robert Johnson' },
      ]);
    } finally {
      setCustomersLoading(false);
    }
  };

  // Customer selection is now handled directly in the form onChange

  // Handle sending a notification to a specific customer
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationContent.trim() || !selectedCustomer) return;

    setSendingNotification(true);
    setNotificationStatus({ success: false, message: '' });

    try {
      // Send notification using the API service
      await sendNotificationToCustomer(
        selectedCustomer._id, 
        notificationContent,
        'vendor_notification'
      );
      
      // Clear the form
      setNotificationContent('');
      
      // Show success message
      setNotificationStatus({
        success: true,
        message: `Notification sent to ${selectedCustomer.name} successfully!`
      });
      
      // Refresh notifications list
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      setNotificationStatus({
        success: false,
        message: `Failed to send notification: ${error.message || 'Unknown error'}`
      });
    } finally {
      setSendingNotification(false);
    }
  };
  
  // Handle sending a broadcast notification to all customers
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastContent.trim()) return;

    setSendingBroadcast(true);
    setNotificationStatus({ success: false, message: '' });

    try {
      // Send broadcast notification using the API service
      await sendNotificationToAllCustomers(
        broadcastContent,
        'vendor_announcement'
      );
      
      // Clear the form
      setBroadcastContent('');
      
      // Show success message
      setNotificationStatus({
        success: true,
        message: 'Announcement sent to all customers successfully!'
      });
      
      // Refresh notifications list
      fetchNotifications();
    } catch (error) {
      console.error('Error sending broadcast notification:', error);
      setNotificationStatus({
        success: false,
        message: `Failed to send announcement: ${error.message || 'Unknown error'}`
      });
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Customer Notifications</h2>
      
      <Row>
        {/* Sent Notifications */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Sent Notifications</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {loading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading notifications...</span>
                  </Spinner>
                  <p className="mt-2">Loading notifications...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : notifications.length === 0 ? (
                <Alert variant="info">No notifications found.</Alert>
              ) : (
                <ListGroup variant="flush">
                  {notifications
                    .filter(notification => notification.senderId === user?.id)
                    .map(notification => (
                      <ListGroup.Item key={notification._id}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <p className="mb-1">{notification.content}</p>
                            <small className="text-muted">
                              {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                            </small>
                          </div>
                          {!notification.isRead && (
                            <Badge bg="primary" pill>
                              New
                            </Badge>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {/* Send New Notification */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Send New Notification</h5>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              {/* Show notification status message */}
              {notificationStatus.message && (
                <Alert variant={notificationStatus.success ? "success" : "danger"} dismissible>
                  {notificationStatus.message}
                </Alert>
              )}
              
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="individual" title="Individual Customer">
                  <Form onSubmit={handleSendNotification}>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Customer</Form.Label>
                      {customersLoading ? (
                        <div className="text-center py-2">
                          <Spinner animation="border" size="sm" />
                          <span className="ms-2">Loading customers...</span>
                        </div>
                      ) : (
                        <Form.Select 
                          value={selectedCustomer?._id || ''}
                          onChange={(e) => {
                            const customerId = e.target.value;
                            const customer = customerList.find(c => c._id === customerId);
                            setSelectedCustomer(customer);
                          }}
                          required
                        >
                          <option value="">-- Select Customer --</option>
                          {customerList.map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {customer.name}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Notification Content</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Enter notification message..."
                        value={notificationContent}
                        onChange={(e) => setNotificationContent(e.target.value)}
                        required
                      />
                    </Form.Group>
                    
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={!selectedCustomer || !notificationContent.trim() || loading || sendingNotification}
                    >
                      {sendingNotification ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Sending...
                        </>
                      ) : (
                        'Send Notification'
                      )}
                    </Button>
                  </Form>
                </Tab>
                
                <Tab eventKey="broadcast" title="Broadcast to All">
                  <Form onSubmit={handleSendBroadcast}>
                    <Form.Group className="mb-3">
                      <Form.Label>Announcement Content</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Enter announcement message to send to all customers..."
                        value={broadcastContent}
                        onChange={(e) => setBroadcastContent(e.target.value)}
                        required
                      />
                    </Form.Group>
                    
                    <Alert variant="info">
                      <i className="bi bi-info-circle me-2"></i>
                      This message will be sent to all customers as an announcement.
                    </Alert>
                    
                    <Button 
                      type="submit" 
                      variant="warning"
                      disabled={!broadcastContent.trim() || loading || sendingBroadcast}
                    >
                      {sendingBroadcast ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Broadcasting...
                        </>
                      ) : (
                        'Broadcast to All Customers'
                      )}
                    </Button>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
          
          <Card className="mt-4">
            <Card.Header>
              <h5 className="mb-0">Notification Tips</h5>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0">
                <li>Keep notifications concise and relevant</li>
                <li>Use notifications for important updates only</li>
                <li>Avoid sending multiple notifications in a short time</li>
                <li>For conversations, use the Messages feature instead</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VendorNotifications;
