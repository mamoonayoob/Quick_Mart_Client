import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge, ListGroup } from 'react-bootstrap';
import { useMessages } from '../../context/MessageContext';
import { getSocketStatus } from '../../services/socketService';

/**
 * Component for testing real-time messaging functionality
 * This helps debug WebSocket connections and message delivery
 */
const MessageTester = ({ role = 'vendor' }) => {
  const [message, setMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientType, setRecipientType] = useState('customer');
  const [orderId, setOrderId] = useState('');
  const [testMessages, setTestMessages] = useState([]);
  const [socketStatus, setSocketStatus] = useState('unknown');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const { sendMessage } = useMessages();
  
  // Update socket status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSocketStatus(getSocketStatus());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle sending test message
  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    if (!recipientId.trim()) {
      setError('Please enter a recipient ID');
      return;
    }
    
    try {
      setError(null);
      
      const messageData = {
        recipientId,
        recipientType,
        message,
        orderId: orderId || undefined
      };
      
      const response = await sendMessage(messageData);
      
      if (response) {
        setSuccess('Message sent successfully!');
        
        // Add to test messages list
        setTestMessages(prev => [
          {
            id: Date.now().toString(),
            content: message,
            recipientId,
            recipientType,
            timestamp: new Date().toISOString(),
            status: 'sent'
          },
          ...prev
        ]);
        
        // Clear form
        setMessage('');
      } else {
        setError('Failed to send message');
      }
    } catch (err) {
      setError(`Error: ${err.message || 'Unknown error'}`);
    }
  };
  
  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>Message Tester</span>
        <Badge bg={socketStatus === 'connected' ? 'success' : 'danger'}>
          {socketStatus}
        </Badge>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}
        
        <Form onSubmit={handleSendTestMessage}>
          <Form.Group className="mb-3">
            <Form.Label>Recipient Type</Form.Label>
            <Form.Select 
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Recipient ID</Form.Label>
            <Form.Control 
              type="text"
              placeholder="Enter recipient ID"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Order ID (optional)</Form.Label>
            <Form.Control 
              type="text"
              placeholder="Enter order ID if applicable"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control 
              as="textarea"
              rows={3}
              placeholder="Type your test message here"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Form.Group>
          
          <Button 
            type="submit" 
            variant="primary"
            disabled={socketStatus !== 'connected'}
          >
            Send Test Message
          </Button>
        </Form>
        
        <hr />
        
        <h6>Test Message History</h6>
        <ListGroup variant="flush" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {testMessages.length > 0 ? (
            testMessages.map(msg => (
              <ListGroup.Item key={msg.id} className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-bold">To: {msg.recipientType} ({msg.recipientId})</div>
                  <div>{msg.content}</div>
                  <small className="text-muted">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </small>
                </div>
                <Badge bg={msg.status === 'sent' ? 'success' : 'warning'}>
                  {msg.status}
                </Badge>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="text-center text-muted">
              No test messages sent yet
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default MessageTester;
