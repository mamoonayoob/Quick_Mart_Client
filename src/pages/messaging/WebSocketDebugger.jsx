import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Badge, ListGroup } from 'react-bootstrap';
import WebSocketTester from '../../components/messaging/WebSocketTester';
import { useMessages } from '../../context/MessageContext';
import websocketService from '../../services/websocketService';

/**
 * WebSocketDebugger page for testing and monitoring WebSocket functionality
 */
const WebSocketDebugger = () => {
  const { 
    socketStatus, 
    unreadCount, 
    messages, 
    notifications 
  } = useMessages();
  
  const [connectionStats, setConnectionStats] = useState({
    reconnectCount: 0,
    lastConnected: null,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0
  });
  
  // Update connection stats periodically
  useEffect(() => {
    const updateStats = () => {
      const wsStatus = websocketService.getStatus();
      if (wsStatus === 'connected' && !connectionStats.lastConnected) {
        setConnectionStats(prev => ({
          ...prev,
          lastConnected: new Date(),
          reconnectCount: prev.reconnectCount + 1
        }));
      } else if (wsStatus !== 'connected' && connectionStats.lastConnected) {
        setConnectionStats(prev => ({
          ...prev,
          lastConnected: null
        }));
      }
    };
    
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [connectionStats.lastConnected]);
  
  // Track message counts
  useEffect(() => {
    if (messages?.length) {
      setConnectionStats(prev => ({
        ...prev,
        messagesReceived: messages.length
      }));
    }
  }, [messages]);

  return (
    <Container className="py-4">
      <h2 className="mb-4">WebSocket Debugger</h2>
      
      <Alert variant="info" className="mb-4">
        <Alert.Heading>WebSocket Testing Environment</Alert.Heading>
        <p>
          This page provides tools for testing and debugging WebSocket connections in the QuickMart messaging system.
          Use the tester below to send test messages, monitor connection status, and verify real-time functionality.
        </p>
      </Alert>
      
      <Row>
        <Col lg={8}>
          {/* WebSocket Tester Component */}
          <WebSocketTester />
          
          {/* Connection History */}
          <Card className="mt-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Connection History</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Reconnection Attempts</span>
                  <Badge bg="secondary" pill>{connectionStats.reconnectCount}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Last Connected</span>
                  <span>{connectionStats.lastConnected ? connectionStats.lastConnected.toLocaleTimeString() : 'Not connected'}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Messages Sent</span>
                  <Badge bg="primary" pill>{connectionStats.messagesSent}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Messages Received</span>
                  <Badge bg="success" pill>{connectionStats.messagesReceived}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Connection Errors</span>
                  <Badge bg="danger" pill>{connectionStats.errors}</Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          {/* WebSocket Stats */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">WebSocket Statistics</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Connection Status</span>
                  <Badge 
                    bg={socketStatus === 'connected' ? 'success' : 
                       socketStatus === 'connecting' ? 'warning' : 'danger'}
                  >
                    {socketStatus}
                  </Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Unread Messages</span>
                  <Badge bg="primary" pill>{unreadCount || 0}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Total Messages</span>
                  <Badge bg="secondary" pill>{messages?.length || 0}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Total Notifications</span>
                  <Badge bg="info" pill>{notifications?.length || 0}</Badge>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
          
          {/* WebSocket Troubleshooting */}
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Troubleshooting Tips</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>Connection Issues</strong>
                  <p className="small text-muted mb-0">Ensure the WebSocket server is running and accessible.</p>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Authentication Errors</strong>
                  <p className="small text-muted mb-0">Check that your user token is valid and properly sent.</p>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Message Not Received</strong>
                  <p className="small text-muted mb-0">Verify the receiver ID is correct and the user is online.</p>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Duplicate Messages</strong>
                  <p className="small text-muted mb-0">The WebSocket service has deduplication built in.</p>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>Reconnection</strong>
                  <p className="small text-muted mb-0">The service will automatically attempt to reconnect if disconnected.</p>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WebSocketDebugger;
