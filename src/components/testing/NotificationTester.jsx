import React, { useState, useEffect, useContext } from 'react';
import { Button, Card, Container, Row, Col, Alert } from 'react-bootstrap';
import { requestNotificationPermission } from '../../services/firebaseMessagingService';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notificationService';
import { MessageContext } from '../../context/MessageContext';

const NotificationTester = () => {
  const [permissionStatus, setPermissionStatus] = useState('');
  const [fcmToken, setFcmToken] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    unreadNotifications, 
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead
  } = useContext(MessageContext);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('not-supported');
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      setLoading(true);
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setPermissionStatus('granted');
      }
    } catch (err) {
      setError(`Error requesting permission: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNotifications = async () => {
    try {
      setLoading(true);
      await fetchNotifications();
      const response = await getNotifications();
      setNotifications(response.notifications || []);
    } catch (err) {
      setError(`Error fetching notifications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setLoading(true);
      await markNotificationRead(notificationId);
      // Refresh notifications
      handleFetchNotifications();
    } catch (err) {
      setError(`Error marking notification as read: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsRead();
      // Refresh notifications
      handleFetchNotifications();
    } catch (err) {
      setError(`Error marking all notifications as read: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h2>Notification Testing Tool</h2>
      <p>Use this component to test notification functionality</p>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="mb-3">
        <Card.Header>Notification Permission</Card.Header>
        <Card.Body>
          <p>Current permission status: <strong>{permissionStatus}</strong></p>
          {permissionStatus !== 'granted' && permissionStatus !== 'not-supported' && (
            <Button 
              onClick={handleRequestPermission} 
              disabled={loading}
            >
              {loading ? 'Requesting...' : 'Request Notification Permission'}
            </Button>
          )}
          {fcmToken && (
            <div className="mt-2">
              <p>FCM Token (for testing):</p>
              <textarea 
                className="form-control" 
                rows="3" 
                value={fcmToken} 
                readOnly 
              />
            </div>
          )}
        </Card.Body>
      </Card>
      
      <Card className="mb-3">
        <Card.Header>Notifications</Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between mb-3">
            <Button 
              onClick={handleFetchNotifications} 
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Fetch Notifications'}
            </Button>
            
            <Button 
              variant="warning" 
              onClick={handleMarkAllAsRead} 
              disabled={loading || notifications.length === 0}
            >
              Mark All as Read
            </Button>
          </div>
          
          <p>Unread notifications: <strong>{unreadNotifications}</strong></p>
          
          {notifications.length > 0 ? (
            <div>
              {notifications.map(notification => (
                <Card key={notification._id} className="mb-2" bg={notification.read ? 'light' : 'info'}>
                  <Card.Body>
                    <Card.Title>{notification.title}</Card.Title>
                    <Card.Text>{notification.message}</Card.Text>
                    <div className="d-flex justify-content-between">
                      <small>Type: {notification.type}</small>
                      <small>
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </div>
                    {!notification.read && (
                      <Button 
                        size="sm" 
                        variant="outline-primary" 
                        className="mt-2"
                        onClick={() => handleMarkAsRead(notification._id)}
                        disabled={loading}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <p>No notifications found</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NotificationTester;
