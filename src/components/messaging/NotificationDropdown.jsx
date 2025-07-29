import React, { useEffect, useState } from 'react';
import { Dropdown, ListGroup, Badge } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../context/MessageContext';
import { getNotifications, markNotificationAsRead } from '../../services/notificationService';

const NotificationDropdown = ({ show, onHide }) => {
  const { fetchUnreadCount } = useMessages();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Fetch notifications when dropdown is shown
  useEffect(() => {
    if (show) {
      fetchNotifications();
    }
  }, [show]);
  
  // Function to fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications({ limit: 5 });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get unread notifications only
  const unreadNotifications = notifications.filter(notification => !notification.isRead).slice(0, 5);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark notification as read
      await markNotificationAsRead(notification._id);
      
      // Refresh notifications and unread count
      fetchNotifications();
      fetchUnreadCount();
      
      // If notification has a link, navigate to it
      if (notification.link) {
        navigate(notification.link);
      }
      
      // Hide dropdown
      onHide();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewAll = () => {
    // Just hide the dropdown, don't navigate to messages
    onHide();
  };

  return (
    <Dropdown.Menu 
      show={show} 
      align="end" 
      className="notification-dropdown"
      style={{ minWidth: '300px', maxHeight: '400px', overflowY: 'auto' }}
    >
      <Dropdown.Header className="d-flex justify-content-between align-items-center">
        <span>Notifications</span>
        {unreadNotifications.length > 0 && (
          <Badge bg="primary" pill>
            {unreadNotifications.length}
          </Badge>
        )}
      </Dropdown.Header>
      
      {loading ? (
        <div className="text-center p-3">
          <p className="text-muted mb-0">Loading notifications...</p>
        </div>
      ) : unreadNotifications.length === 0 ? (
        <div className="text-center p-3">
          <p className="text-muted mb-0">No new notifications</p>
        </div>
      ) : (
        <ListGroup variant="flush">
          {unreadNotifications.map((notification) => (
            <ListGroup.Item 
              key={notification._id} 
              action 
              onClick={() => handleNotificationClick(notification)}
              className="border-bottom"
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-bold">
                    {notification.title || 'New Notification'}
                  </div>
                  <div className="notification-preview">
                    {notification.content?.substring(0, 50)}
                    {notification.content?.length > 50 ? '...' : ''}
                  </div>
                  <small className="text-muted">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </small>
                </div>
                <Badge bg="primary" pill>New</Badge>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      
      <Dropdown.Divider />
      <Dropdown.Item onClick={handleViewAll} className="text-center">
        Close notifications
      </Dropdown.Item>
    </Dropdown.Menu>
  );
};

export default NotificationDropdown;
