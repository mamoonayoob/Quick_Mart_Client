import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Badge, Tab, Nav } from 'react-bootstrap';
import { useMessages } from '../../context/MessageContext';
import MessageList from '../../components/messaging/MessageList';
import MessageDetail from '../../components/messaging/MessageDetail';
import { getMessagesByOrderId } from '../../services/messageService';
import WebSocketStatus from '../../components/messaging/WebSocketStatus';
import { useSelector } from 'react-redux';
import { sendMessageToCustomer } from '../../services/messageService';
import { onMessage, offMessage, initSocket } from '../../services/socketService';

// Safe DOM access utility to prevent "Cannot read properties of null" errors
const safelyAccessDOM = (callback) => {
  // Use requestAnimationFrame to ensure DOM is ready
  if (typeof window !== 'undefined') {
    window.requestAnimationFrame(() => {
      try {
        callback();
      } catch (error) {
        console.warn('Safe DOM access prevented error:', error);
      }
    });
  }
};

const VendorMessages = () => {
  const { 
    loading, 
    error, 
    vendorMessages, 
    fetchVendorMessages, 
    fetchCustomerMessages,
    fetchAdminMessages,
    sendMessage, 
    markMessageAsRead,
    setActiveConversation 
  } = useMessages();
  
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [activeHierarchy, setActiveHierarchy] = useState('vendor'); // 'vendor', 'customer', 'admin'
  const { user } = useSelector(state => state.auth);

  const [loadingOrderMessages, setLoadingOrderMessages] = useState(false);
  const [errorOrderMessages, setErrorOrderMessages] = useState(null);
  const [orderMessages, setOrderMessages] = useState([]);

  // Fetch messages - only vendor messages are accessible to vendor users
  const fetchMessages = useCallback(() => {
    console.log('Fetching vendor messages');
    fetchVendorMessages();
  }, [fetchVendorMessages]);
  
  // Filter messages by type within the vendor's accessible messages
  const [messageFilter, setMessageFilter] = useState('all'); // 'all', 'customer', 'admin'
  
  // Fetch messages for a specific order - this avoids 403 errors when accessing customer messages
  const fetchOrderMessages = async (orderId) => {
    if (!orderId) return;
    
    setLoadingOrderMessages(true);
    setErrorOrderMessages(null);
    
    try {
      const response = await getMessagesByOrderId(orderId);
      console.log('Order messages:', response.data?.data);
      setOrderMessages(response.data?.data || []);
      
      // Update selected conversation with detailed messages if available
      if (selectedConversation && response.data?.data?.length > 0) {
        setSelectedConversation(prev => ({
          ...prev,
          messages: response.data.data
        }));
      }
      
      return response.data;
    } catch (error) {
      setErrorOrderMessages("Failed to fetch order messages");
      console.error("Error fetching order messages:", error);
      return [];
    } finally {
      setLoadingOrderMessages(false);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (filter) => {
    console.log('Changing filter to:', filter);
    setMessageFilter(filter);
    setSelectedConversation(null); // Reset selected conversation when changing filter
  };

  useEffect(() => {
    // Fetch messages when component mounts
    fetchMessages();
  }, [fetchMessages]);

  // Group messages by order
  const [orderGroups, setOrderGroups] = useState({});

  useEffect(() => {
    console.log("vendorMessages", vendorMessages);
    
    // Check if vendorMessages is an object with data property (API response format)
    if (vendorMessages && vendorMessages.data && Array.isArray(vendorMessages.data)) {
      // Extract the data array from the API response
      const messagesArray = vendorMessages.data;
      console.log("Processing messages array:", messagesArray);
      
      // Group messages by order
      const groups = messagesArray.reduce((acc, message) => {
        // Safely extract orderId, handling both string and object formats
        const orderId = message.orderId?._id || message.orderId;
        if (!orderId) return acc;
        
        if (!acc[orderId]) {
          acc[orderId] = [];
        }
        acc[orderId].push(message);
        return acc;
      }, {});
      
      setOrderGroups(groups);
      console.log("orderGroups", groups);
    } else if (Array.isArray(vendorMessages)) {
      // If vendorMessages is already an array
      const groups = vendorMessages.reduce((acc, message) => {
        // Safely extract orderId, handling both string and object formats
        const orderId = message.orderId?._id || message.orderId;
        if (!orderId) return acc;
        
        if (!acc[orderId]) {
          acc[orderId] = [];
        }
        acc[orderId].push(message);
        return acc;
      }, {});
      
      setOrderGroups(groups);
      console.log("orderGroups", groups);
    } else {
      // If vendorMessages is neither an array nor an object with data property
      console.log("Invalid vendorMessages format:", vendorMessages);
      setOrderGroups({});
    }
  }, [vendorMessages]);

  // Create a list of order conversations with filtering
  console.log("Creating order conversations from groups:", orderGroups);
  const orderConversations = Object.entries(orderGroups || {}).map(([orderId, messages]) => {
    // Sort messages by date (newest first)
    const sortedMessages = [...messages].sort((a, b) => {
      return new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp);
    });
    
    // Get the latest message
    const latestMessage = sortedMessages[0];
    if (!latestMessage) return null; // Skip if no messages
    
    // Count unread messages
    const unreadCount = messages.filter(m => !m.isRead && m.receiver?._id === user?.id).length;
    
    // Map to match MessageList component's expected structure
    return {
      _id: orderId, // MessageList expects _id
      id: orderId,
      orderId: orderId, // Use orderId as a string, not as an object
      title: `Order #${orderId.substring(0, 8)}`,
      content: latestMessage.content || latestMessage.message || 'No content', // MessageList expects content
      message: latestMessage.content || latestMessage.message || 'No content',
      createdAt: latestMessage.createdAt || latestMessage.timestamp, // MessageList expects createdAt
      timestamp: latestMessage.createdAt || latestMessage.timestamp,
      isRead: unreadCount === 0, // MessageList expects isRead
      unreadCount,
      messages,
      sender: { // MessageList expects sender.name
        name: latestMessage.sender?.name || latestMessage.senderName || 'Customer',
        _id: latestMessage.sender?._id || latestMessage.senderId
      },
      recipientId: latestMessage.receiver?._id || latestMessage.recipientId,
      recipientType: latestMessage.receiver?.role || latestMessage.recipientType || 'customer',
      senderType: latestMessage.sender?.role || latestMessage.senderType || 'customer',
      senderName: latestMessage.sender?.name || latestMessage.senderName || 'Customer'
    };
  }).filter(Boolean); // Remove any null entries
  
  // Apply message filter
  console.log("Order conversations before filtering:", orderConversations);
  const filteredConversations = messageFilter === 'all' 
    ? orderConversations 
    : orderConversations.filter(conv => conv.senderType === messageFilter);
  console.log("Filtered conversations after applying filter '"+messageFilter+"':", filteredConversations);

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setActiveConversation(conversation.id);
    
    // Fetch detailed messages for this order to avoid 403 errors
    fetchOrderMessages(conversation.orderId?._id || conversation.orderId);
    
    // Mark messages as read
    if (conversation.unreadCount > 0) {
      markMessageAsRead(conversation.id);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (user?.id) {
      console.log('Initializing socket with user ID:', user.id);
      // Pass both user ID and token explicitly
      initSocket(user.id, user.token);
      
      // Set up message listener with proper event name
      const handleNewMessage = (data) => {
        console.log('New message received:', data);
        
        // Use safelyAccessDOM for any DOM operations that might happen after receiving a message
        safelyAccessDOM(() => {
          // If this message belongs to a conversation we're viewing, update it
          if (selectedConversation && data.orderId === selectedConversation.orderId) {
            console.log('Updating selected conversation with new message');
            setSelectedConversation(prev => {
              const updated = {...prev};
              if (!updated.messages) updated.messages = [];
              updated.messages.push(data);
              updated.lastMessage = data.message;
              updated.timestamp = data.timestamp;
              return updated;
            });
          }
          
          // Always refresh all messages to keep the list updated
          // Delay the fetch slightly to ensure DOM is ready
          setTimeout(() => {
            fetchMessages();
          }, 100);
        });
      };
      
      // Subscribe to message events with proper event name 'message'
      onMessage('message', handleNewMessage);
      
      return () => {
        // Clean up listeners when component unmounts
        offMessage('message');
      };
    }
  }, [user, fetchMessages, selectedConversation]);

  // Handle sending a message
  const handleSendMessage = async (message, orderId) => {
    if (!selectedConversation) return;
    
    try {
      // Use the direct service function for better reliability
      const response = await sendMessageToCustomer(orderId || selectedConversation.orderId, message);
      
      if (response && response.data && response.data.data) {
        const newMessage = response.data.data;
        
        // Update the local state immediately with the new message
        const updatedConversation = {...selectedConversation};
        if (!updatedConversation.messages) {
          updatedConversation.messages = [];
        }
        
        // Add the new message only if it doesn't already exist (prevent duplicates)
        const messageExists = updatedConversation.messages.some(msg => 
          msg._id === newMessage._id || 
          (msg.content === newMessage.content && 
           msg.sender?._id === newMessage.sender?._id && 
           Math.abs(new Date(msg.createdAt) - new Date(newMessage.createdAt)) < 1000)
        );
        
        if (!messageExists) {
          updatedConversation.messages.push(newMessage);
          updatedConversation.lastMessage = newMessage.message || newMessage.content;
          updatedConversation.timestamp = newMessage.timestamp || newMessage.createdAt;
        }
        
        setSelectedConversation(updatedConversation);
        
        // Also refresh the order messages to show the new message in the UI
        await fetchOrderMessages(selectedConversation.orderId);
        
        // Refresh the full message list but with a slight delay to avoid race conditions
        setTimeout(() => {
          fetchVendorMessages();
        }, 300);
      }
      
      // Also use the context method to update UI state
      sendMessage({
        recipientId: selectedConversation.recipientId,
        recipientType: 'customer',
        message,
        orderId: orderId || selectedConversation.orderId
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Container className="py-4" style={{ height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
      <h2 className="mb-4">Vendor Messages</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* WebSocket Status for debugging (hidden in production) */}
      {process.env.NODE_ENV === 'development' && <WebSocketStatus />}
      
      <Tab.Container activeKey={messageFilter} onSelect={handleFilterChange}>
        <Row className="flex-grow-1">
          <Col md={4} className="d-flex flex-column">
            <Card className="shadow-sm mb-4 flex-grow-1">
              <Card.Header className="bg-white">
                <Nav variant="tabs" className="flex-column flex-sm-row">
                  <Nav.Item>
                    <Nav.Link eventKey="all">All Messages</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="customer">From Customers</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="admin">From Admin</Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body className="p-0" style={{ height: '500px', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                  <h6 className="mb-0">Order Conversations</h6>
                  {orderConversations.reduce((total, conv) => total + conv.unreadCount, 0) > 0 && (
                    <Badge bg="danger" pill>
                      {orderConversations.reduce((total, conv) => total + conv.unreadCount, 0)}
                    </Badge>
                  )}
                </div>
                {loading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <Tab.Content className="h-100">
                    <Tab.Pane eventKey="all" className="h-100">
                      <MessageList 
                        messages={filteredConversations}
                        onSelect={handleConversationSelect}
                        selectedMessageId={selectedConversation?.id}
                        emptyMessage="No messages found"
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="customer" className="h-100">
                      <MessageList 
                        messages={filteredConversations}
                        onSelect={handleConversationSelect}
                        selectedMessageId={selectedConversation?.id}
                        emptyMessage="No messages from customers found"
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="admin" className="h-100">
                      <MessageList 
                        messages={filteredConversations}
                        onSelect={handleConversationSelect}
                        selectedMessageId={selectedConversation?.id}
                        emptyMessage="No messages from admin found"
                      />
                    </Tab.Pane>
                  </Tab.Content>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={8} className="d-flex flex-column">
            <Card className="shadow-sm flex-grow-1" style={{ display: 'flex', flexDirection: 'column' }}>
              {selectedConversation ? (
                <MessageDetail
                  selectedConversation={{
                    ...selectedConversation,
                    // Use orderMessages if available, otherwise fallback to conversation.messages
                    messages: orderMessages.length > 0 ? orderMessages : selectedConversation.messages,
                    // Ensure orderId is a string to avoid React object rendering errors
                    orderId: selectedConversation.orderId ? 
                      (typeof selectedConversation.orderId === 'string' ? 
                        selectedConversation.orderId : 
                        (selectedConversation.orderId._id ? 
                          selectedConversation.orderId._id : 
                          'Unknown')) : 
                      'Unknown'
                  }}
                  onSendMessage={handleSendMessage}
                  loading={loadingOrderMessages}
                  error={errorOrderMessages}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                  <div className="text-center">
                    <i className="bi bi-chat-dots" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3">Select an order conversation to view messages</p>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Tab.Container>
      
      {selectedConversation && (
        <Row className="mt-3">
          <Col md={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">Order Information</Card.Header>
              <Card.Body>
                <p><strong>Order ID:</strong> {selectedConversation.orderId}</p>
                <p><strong>Customer:</strong> {selectedConversation.senderName || 'Customer'}</p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => window.location.href = `/vendor/orders/${selectedConversation.orderId}`}
                >
                  View Order Details
                </button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default VendorMessages;
