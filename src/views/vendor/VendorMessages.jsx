import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Form, Button, Alert } from 'react-bootstrap';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { useMessages } from '../../context/MessageContext';

const VendorMessages = () => {
  const { user } = useSelector(state => state.auth);
  const { messages, loading, error, fetchMessages } = useMessages();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [customerMessages, setCustomerMessages] = useState([]);
  const [groupedCustomers, setGroupedCustomers] = useState([]);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Process messages when they change
  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      // Group messages by customer
      const customerMap = messages.reduce((acc, message) => {
        // For vendor, we're interested in messages where vendor is sender or receiver
        if (
          (message.receiverId === user?.id && message.messageType === 'customer-to-vendor') ||
          (message.senderId === user?.id && message.messageType === 'vendor-to-customer')
        ) {
          const customerId = message.senderId === user?.id ? message.receiverId : message.senderId;
          const customerName = message.senderId === user?.id ? message.receiverName : message.senderName;
          
          if (!acc[customerId]) {
            acc[customerId] = {
              id: customerId,
              name: customerName || 'Customer',
              messages: [],
              latestMessage: null,
              unreadCount: 0
            };
          }
          
          // Add message to this customer's messages
          acc[customerId].messages.push(message);
          
          // Update latest message if this one is newer
          if (!acc[customerId].latestMessage || 
              new Date(message.createdAt) > new Date(acc[customerId].latestMessage.createdAt)) {
            acc[customerId].latestMessage = message;
          }
          
          // Count unread messages
          if (!message.isRead && message.receiverId === user?.id) {
            acc[customerId].unreadCount++;
          }
        }
        return acc;
      }, {});
      
      // Convert map to array and sort by latest message date
      const sortedCustomers = Object.values(customerMap).sort((a, b) => {
        if (!a.latestMessage) return 1;
        if (!b.latestMessage) return -1;
        return new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt);
      });
      
      setGroupedCustomers(sortedCustomers);
      
      // Update selected customer messages if needed
      if (selectedCustomer) {
        const customerData = customerMap[selectedCustomer.id];
        if (customerData) {
          setCustomerMessages(customerData.messages.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          ));
        }
      }
    }
  }, [messages, selectedCustomer, user?.id]);

  // Handle selecting a customer
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerMessages(customer.messages.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    ));
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedCustomer) return;

    try {
      // Assuming you have a service function to send messages
      // await sendMessageToCustomer(selectedCustomer.id, messageContent);
      
      // For now, let's just add a temporary message to the UI
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content: messageContent,
        senderId: user?.id,
        senderName: user?.name,
        receiverId: selectedCustomer.id,
        receiverName: selectedCustomer.name,
        createdAt: new Date().toISOString(),
        messageType: 'vendor-to-customer',
        isRead: false
      };
      
      setCustomerMessages([...customerMessages, tempMessage]);
      setMessageContent('');
      
      // In a real app, you would call your API here
      // After successful API call, refresh messages
      // fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Customer Messages</h2>
      
      <Row>
        {/* Customer List */}
        <Col md={4}>
          <Card className="mb-4 customer-list">
            <Card.Header>
              <h5 className="mb-0">Customers</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {loading ? (
                <div className="text-center p-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : groupedCustomers.length === 0 ? (
                <div className="text-center p-3">
                  <p className="text-muted mb-0">No customer messages</p>
                </div>
              ) : (
                groupedCustomers.map(customer => (
                  <ListGroup.Item 
                    key={customer.id} 
                    action 
                    active={selectedCustomer?.id === customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="d-flex justify-content-between align-items-start"
                  >
                    <div className="ms-2 me-auto">
                      <div className="fw-bold">{customer.name}</div>
                      {customer.latestMessage && (
                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                          {customer.latestMessage.content}
                        </div>
                      )}
                      <small className="text-muted">
                        {customer.latestMessage && format(new Date(customer.latestMessage.createdAt), 'MMM d, h:mm a')}
                      </small>
                    </div>
                    {customer.unreadCount > 0 && (
                      <span className="badge bg-primary rounded-pill">
                        {customer.unreadCount}
                      </span>
                    )}
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
        
        {/* Message Detail */}
        <Col md={8}>
          <Card className="message-detail h-100">
            {!selectedCustomer ? (
              <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                <p className="text-muted">Select a customer to view messages</p>
              </Card.Body>
            ) : (
              <>
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{selectedCustomer.name}</h5>
                  </div>
                </Card.Header>
                
                <Card.Body className="message-content">
                  {error && <Alert variant="danger">{error}</Alert>}
                  
                  <div className="messages-container" style={{ height: '400px', overflowY: 'auto' }}>
                    {customerMessages.length === 0 ? (
                      <div className="text-center p-5">
                        <p className="text-muted">No messages with this customer yet</p>
                      </div>
                    ) : (
                      <ListGroup variant="flush">
                        {customerMessages.map((message) => (
                          <ListGroup.Item 
                            key={message._id}
                            className={`border-0 mb-2 ${message.senderId === user?.id ? 'text-end' : ''}`}
                          >
                            <div 
                              className={`message-bubble d-inline-block p-3 rounded ${
                                message.senderId === user?.id ? 'bg-primary text-white' : 'bg-light'
                              }`}
                              style={{ maxWidth: '80%' }}
                            >
                              <div className="message-content">{message.content}</div>
                              <div className="message-meta text-end">
                                <small className={message.senderId === user?.id ? 'text-white-50' : 'text-muted'}>
                                  {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                                  {message.isRead && message.senderId === user?.id && (
                                    <span className="ms-2">✓</span>
                                  )}
                                </small>
                              </div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </div>
                </Card.Body>
                
                <Card.Footer>
                  <Form onSubmit={handleSendMessage}>
                    <Form.Group className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Type a message..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        disabled={loading}
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        className="ms-2"
                        disabled={!messageContent.trim() || loading}
                      >
                        Send
                      </Button>
                    </Form.Group>
                  </Form>
                </Card.Footer>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VendorMessages;
