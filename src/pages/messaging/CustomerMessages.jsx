import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Nav, Alert, Spinner } from 'react-bootstrap';
import { useMessages } from '../../context/MessageContext';
import MessageList from '../../components/messaging/MessageList';
import MessageDetail from '../../components/messaging/MessageDetail';
import { useSelector } from 'react-redux';

const CustomerMessages = () => {
  const { 
    loading, 
    error, 
    customerMessages, 
    fetchCustomerMessages, 
    sendMessage, 
    markMessageAsRead,
    activeConversation, 
    setActiveConversation 
  } = useMessages();
  
  const [activeKey, setActiveKey] = useState('vendors');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // Fetch messages when component mounts
    fetchCustomerMessages();
  }, [fetchCustomerMessages]);
  useEffect(() => {
console.log( "customerMessages",customerMessages);
  }, [customerMessages]);

  // Group messages by vendor/admin
  // Ensure customerMessages is an array before using filter
  const messagesArray = Array.isArray(customerMessages) ? customerMessages : (customerMessages ? Array.from(customerMessages) : []);
  // const customerMessages = messagesArray.filter(msg => msg.messageType === 'customer-to-vendor') || [];
  const vendorMessages = messagesArray.filter(msg => msg.messageType === 'vendor-to-customer') || [];
  const adminMessages = messagesArray.filter(msg => msg.messageType === 'customer-to-admin') || [];

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    console.log("conversation",conversation);
    setSelectedConversation(conversation);
    setActiveConversation(conversation._id);
    
    // Mark messages as read
    if (conversation.unreadCount > 0) {
      markMessageAsRead(conversation._id);
    }
  };

  // Handle sending a message
  const handleSendMessage = (message, orderId = null) => {
    if (!selectedConversation) return;
    
    const recipientType = selectedConversation.recipientType || 
                          (activeKey === 'vendors' ? 'vendor' : 'admin');
    
    sendMessage({
      recipientId: selectedConversation.recipientId,
      recipientType,
   content:   message,
      orderId: orderId || selectedConversation.orderId
    });
  };

  return (
    <Container className="py-4" style={{ height: '600px',display:'flex',flexDirection:'column' }}>
      <h2 className="mb-4">My Messages</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Tab.Container activeKey={activeKey} onSelect={setActiveKey}>
        <Row>
          <Col md={3}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <Nav variant="tabs" className="flex-column flex-sm-row">
                  <Nav.Item>
                    <Nav.Link eventKey="vendors">Vendors</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="admin">Support</Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body className="p-0" style={{ height: '500px', overflowY: 'auto' }}>
                {loading ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <Tab.Content>
                    <Tab.Pane eventKey="customer">
                      <MessageList 
                        messages={customerMessages}
                        onSelect={handleConversationSelect}
                        activeId={selectedConversation?._id}
                        emptyMessage="No vendor conversations yet"
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="vendors">
                      <MessageList 
                        messages={vendorMessages}
                        onSelect={handleConversationSelect}
                        activeId={selectedConversation?._id}
                        emptyMessage="No vendor conversations yet"
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="admin">
                      <MessageList 
                        messages={adminMessages}
                        onSelect={handleConversationSelect} 
                        activeId={selectedConversation?._id}
                        emptyMessage="No support conversations yet"
                      />
                    </Tab.Pane>
                  </Tab.Content>
                )}
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={9}>
            <Card className="shadow-sm" style={{ height: '600px' }}>
              {selectedConversation ? (
                <MessageDetail
                messages={messagesArray}
                selectedConversation={selectedConversation}
                  onSendMessage={handleSendMessage}
                  currentUserId={user?.id}
                  currentUserType="customer"
                  showOrderInfo={activeKey === 'vendors'}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                  <div className="text-center">
                    <i className="bi bi-chat-dots" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3">Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default CustomerMessages;
