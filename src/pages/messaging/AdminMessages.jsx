import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Nav, Alert, Spinner, Button, Modal, Form } from 'react-bootstrap';
import { useMessages } from '../../context/MessageContext';
import MessageList from '../../components/messaging/MessageList';
import MessageDetail from '../../components/messaging/MessageDetail';
import WebSocketStatus from '../../components/messaging/WebSocketStatus';
import MessageTester from '../../components/messaging/MessageTester';
import { useSelector } from 'react-redux';

const AdminMessages = () => {
  const { 
    loading, 
    error, 
    adminMessages, 
    fetchAdminMessages, 
    sendMessage, 
    sendBroadcastMessage,
    markMessageAsRead,
    setActiveConversation 
  } = useMessages();
  
  const [activeKey, setActiveKey] = useState('customers');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // Fetch messages when component mounts
    fetchAdminMessages();
  }, [fetchAdminMessages]);

  // Group messages by customer/admin
  const customerMessages = adminMessages.filter(msg => msg.recipientType === 'customer' || msg.senderType === 'customer');
  const adminToAdminMessages = adminMessages.filter(msg => (msg.recipientType === 'admin' && msg.senderType === 'admin'));

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setActiveConversation(conversation.id);
    
    // Mark messages as read
    if (conversation.unreadCount > 0) {
      markMessageAsRead(conversation.id);
    }
  };

  // Handle sending a message
  const handleSendMessage = (message) => {
    if (!selectedConversation) return;
    
    const recipientType = selectedConversation.recipientType || 
                          (activeKey === 'customers' ? 'customer' : 'admin');
    
    sendMessage({
      recipientId: selectedConversation.recipientId,
      recipientType,
      message,
      orderId: selectedConversation.orderId
    });
  };

  // Handle sending a broadcast message
  const handleSendBroadcast = () => {
    if (broadcastMessage.trim()) {
      sendBroadcastMessage(broadcastMessage);
      setBroadcastMessage('');
      setShowBroadcastModal(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Admin Messaging Center</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* WebSocket Status for debugging */}
      <Row className="mb-3">
        <Col md={3}>
          <WebSocketStatus />
        </Col>
        <Col md={9}>
          {/* Message Tester for debugging real-time messaging */}
          <MessageTester role="admin" />
        </Col>
      </Row>
      
      <Tab.Container activeKey={activeKey} onSelect={setActiveKey}>
        <Row>
          <Col md={3}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <Nav variant="tabs" className="flex-column flex-sm-row">
                  <Nav.Item>
                    <Nav.Link eventKey="customers">Customers</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="admins">Admin Team</Nav.Link>
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
                    <Tab.Pane eventKey="customers">
                      <MessageList 
                        conversations={customerMessages}
                        onSelect={handleConversationSelect}
                        activeId={selectedConversation?.id}
                        emptyMessage="No customer conversations yet"
                      />
                    </Tab.Pane>
                    <Tab.Pane eventKey="admins">
                      <div className="p-3 border-bottom">
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="w-100"
                          onClick={() => setShowBroadcastModal(true)}
                        >
                          <i className="bi bi-broadcast me-2"></i>
                          Send Broadcast Message
                        </Button>
                      </div>
                      <MessageList 
                        conversations={adminToAdminMessages}
                        onSelect={handleConversationSelect}
                        activeId={selectedConversation?.id}
                        emptyMessage="No admin conversations yet"
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
                  conversation={selectedConversation}
                  onSendMessage={handleSendMessage}
                  currentUserId={user?.id}
                  currentUserType="admin"
                  showOrderInfo={activeKey === 'customers'}
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

      {/* Broadcast Message Modal */}
      <Modal show={showBroadcastModal} onHide={() => setShowBroadcastModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Send Broadcast Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Message to all admin team members</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Type your broadcast message here..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBroadcastModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSendBroadcast}>
            Send Broadcast
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminMessages;
