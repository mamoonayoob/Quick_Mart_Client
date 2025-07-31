import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, ListGroup, Badge, Alert, Tabs, Tab, Row, Col, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { BsArrowRepeat, BsTrash, BsPlayFill, BsStopFill, BsDownload, BsClipboard } from 'react-icons/bs';
import websocketService from '../../services/websocketService';
import { useMessages } from '../../context/MessageContext';

/**
 * WebSocketTester component for testing and debugging WebSocket connections
 * This component provides a UI to monitor WebSocket status and test message sending/receiving
 */
const WebSocketTester = () => {
  const { user } = useSelector(state => state.auth);
  const { socketStatus } = useMessages();
  const [localStatus, setLocalStatus] = useState('not_initialized');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('chat');
  const [receiverId, setReceiverId] = useState('');
  const [activeTab, setActiveTab] = useState('send');
  const [autoSend, setAutoSend] = useState(false);
  const [autoSendInterval, setAutoSendInterval] = useState(5);
  const [autoSendIntervalId, setAutoSendIntervalId] = useState(null);
  const testPresets = [
    { name: 'Simple Chat', type: 'chat', content: 'Hello, this is a test message!' },
    { name: 'Notification', type: 'notification', content: 'You have a new order #12345' },
    { name: 'System Alert', type: 'system', content: 'System maintenance in 10 minutes' },
  ];
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize WebSocket and set up listeners
  useEffect(() => {
    if (!user) return;
    // Initialize WebSocket connection
    const token = localStorage.getItem('token') || 'test-token';
    websocketService.connect(user.id, token);
    
    // Add connection status listener
    // const connectionListenerId = 'websocket-tester-connection';
    websocketService.addEventListener('connection', (data) => {
      setConnected(data.status === 'connected');
      addLogMessage('system', `Connection status: ${data.status}`);
    });
    
    // Add error listener
    // const errorListenerId = 'websocket-tester-error';
    websocketService.addEventListener('error', (data) => {
      setError(`WebSocket error: ${data.error?.message || 'Unknown error'}`);
      addLogMessage('error', `Error: ${data.error?.message || 'Unknown error'}`);
    });
    
    // Add message listener for all message types
    // const messageListenerId = 'websocket-tester-message';
    websocketService.addEventListener('all', (data) => {
      addLogMessage('received', `Received ${data.event} event: ${JSON.stringify(data.data)}`);
    });
    
    // Update status periodically
    const statusInterval = setInterval(() => {
      const status = websocketService.getStatus();
      setLocalStatus(status);
    }, 2000);
    
    // Clean up listeners and connection
    return () => {
      websocketService.removeEventListener('connection');
      websocketService.removeEventListener('error');
      websocketService.removeEventListener('all');
      clearInterval(statusInterval);
    };
  }, [user]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Add a log message to the messages list
  const addLogMessage = (type, content) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type,
      content,
      timestamp: new Date()
    }]);
  };
  
  // Handle sending a test message
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    
    if (!messageText.trim()) return;
    
    try {
      // Prepare message payload
      const payload = {
        content: messageText,
        senderId: user?.id,
        senderName: user?.name || 'Test User',
        receiverId: receiverId || 'all',
        timestamp: new Date().toISOString(),
        orderId: messageType === 'chat' ? '60d21b4667d0d8992e610c85' : undefined, // Example order ID for testing
        type: messageType
      };
      
      // Send the message
      websocketService.sendMessage(payload);
      const success = true; // Socket.IO will queue messages if disconnected
      
      if (success) {
        addLogMessage('sent', `Sent ${messageType} message: ${messageText}`);
        if (!autoSend) setMessageText('');
      } else {
        setError('Failed to send message. WebSocket may not be connected.');
        addLogMessage('error', 'Failed to send message. WebSocket may not be connected.');
      }
    } catch (error) {
      setError(`Error sending message: ${error.message}`);
      addLogMessage('error', `Error sending message: ${error.message}`);
    }
  };
  
  // Handle reconnecting WebSocket
  const handleReconnect = () => {
    try {
      // Close existing connection
      websocketService.disconnect();
      
      // Re-initialize WebSocket
      const token = localStorage.getItem('token') || 'test-token';
      websocketService.connect(user.id, token);
      
      addLogMessage('system', 'Attempting to reconnect WebSocket...');
    } catch (error) {
      setError(`Reconnection error: ${error.message}`);
      addLogMessage('error', `Reconnection error: ${error.message}`);
    }
  };
  
  // Handle auto-send toggle
  const toggleAutoSend = () => {
    if (autoSend) {
      // Stop auto-sending
      if (autoSendIntervalId) {
        clearInterval(autoSendIntervalId);
        setAutoSendIntervalId(null);
      }
      setAutoSend(false);
      addLogMessage('system', 'Auto-send stopped');
    } else {
      // Start auto-sending
      if (!messageText.trim()) {
        setError('Please enter a message to auto-send');
        return;
      }
      
      const intervalId = setInterval(() => {
        handleSendMessage();
      }, autoSendInterval * 1000);
      
      setAutoSendIntervalId(intervalId);
      setAutoSend(true);
      addLogMessage('system', `Auto-send started (every ${autoSendInterval} seconds)`);
    }
  };
  
  // Apply a test preset
  const applyPreset = (preset) => {
    setMessageType(preset.type);
    setMessageText(preset.content);
  };
  
  // Export log as JSON
  const exportLog = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `websocket-log-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Copy log to clipboard
  const copyLogToClipboard = () => {
    const logText = messages.map(msg => 
      `[${format(msg.timestamp, 'HH:mm:ss')}] [${msg.type}] ${msg.content}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText)
      .then(() => {
        addLogMessage('system', 'Log copied to clipboard');
      })
      .catch(err => {
        setError('Failed to copy log: ' + err.message);
      });
  };
  
  // Handle clearing log messages
  const handleClearLog = () => {
    setMessages([]);
  };
  
  // Get status badge variant based on connection status
  const getStatusVariant = (status) => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'closed':
      case 'closing':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Clean up auto-send interval on unmount
  useEffect(() => {
    return () => {
      if (autoSendIntervalId) {
        clearInterval(autoSendIntervalId);
      }
    };
  }, [autoSendIntervalId]);

  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center bg-light">
        <h5 className="mb-0">WebSocket Tester</h5>
        <div>
          <Badge bg={getStatusVariant(localStatus)} className="me-2">
            Local: {localStatus}
          </Badge>
          <Badge bg={getStatusVariant(socketStatus)} className="me-2">
            Context: {socketStatus}
          </Badge>
          <Button 
            size="sm" 
            variant="outline-primary" 
            onClick={handleReconnect}
            disabled={localStatus === 'connected'}
          >
            <BsArrowRepeat className="me-1" /> Reconnect
          </Button>
        </div>
      </Card.Header>
      
      <Card.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="send" title="Send Messages">
            <Form onSubmit={handleSendMessage} className="mb-3">
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Message Type</Form.Label>
                    <Form.Select 
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                    >
                      <option value="chat">Chat Message</option>
                      <option value="notification">Notification</option>
                      <option value="system">System Message</option>
                      <option value="ping">Ping</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Receiver ID (leave empty for broadcast)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Receiver ID"
                      value={receiverId}
                      onChange={(e) => setReceiverId(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-2">
                <Form.Label>Message Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Type a message to send..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={!connected}
                />
              </Form.Group>
              
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <div>
                  <Button 
                    type="submit" 
                    variant="primary"
                    className="me-2 mb-2"
                    disabled={!messageText.trim() || !connected}
                  >
                    Send Test Message
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant={autoSend ? "danger" : "success"}
                    className="me-2 mb-2"
                    onClick={toggleAutoSend}
                    disabled={!connected || (!autoSend && !messageText.trim())}
                  >
                    {autoSend ? (
                      <><BsStopFill /> Stop Auto-send</>
                    ) : (
                      <><BsPlayFill /> Start Auto-send</>
                    )}
                  </Button>
                </div>
                
                <div className="d-flex align-items-center mb-2">
                  {autoSend && (
                    <div className="d-flex align-items-center me-3">
                      <Spinner animation="border" size="sm" variant="success" className="me-2" />
                      <span>Sending every {autoSendInterval}s</span>
                    </div>
                  )}
                  
                  {!autoSend && (
                    <Form.Group className="d-flex align-items-center">
                      <Form.Label className="me-2 mb-0">Interval (s):</Form.Label>
                      <Form.Control
                        type="number"
                        min="1"
                        max="60"
                        value={autoSendInterval}
                        onChange={(e) => setAutoSendInterval(parseInt(e.target.value) || 5)}
                        style={{ width: '70px' }}
                      />
                    </Form.Group>
                  )}
                </div>
              </div>
            </Form>
            
            <h6 className="mt-4 mb-2">Test Presets</h6>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {testPresets.map((preset, index) => (
                <Button 
                  key={index} 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </Tab>
          
          <Tab eventKey="log" title="Message Log">
            <div className="d-flex justify-content-end mb-2">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-2"
                onClick={copyLogToClipboard}
              >
                <BsClipboard className="me-1" /> Copy Log
              </Button>
              
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-2"
                onClick={exportLog}
              >
                <BsDownload className="me-1" /> Export Log
              </Button>
              
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={handleClearLog}
              >
                <BsTrash className="me-1" /> Clear Log
              </Button>
            </div>
            
            <div className="message-log" style={{ height: '350px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.25rem' }}>
              <ListGroup variant="flush">
                {messages.length === 0 ? (
                  <div className="text-center text-muted p-5">
                    <p>No messages logged yet</p>
                    <p className="small">Send a test message or reconnect to generate log entries</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <ListGroup.Item 
                      key={msg.id}
                      className={`border-0 py-1 ${
                        msg.type === 'error' ? 'text-danger' : 
                        msg.type === 'system' ? 'text-secondary' :
                        msg.type === 'sent' ? 'text-primary' : 'text-success'
                      }`}
                    >
                      <Badge 
                        bg={msg.type === 'error' ? 'danger' : 
                             msg.type === 'system' ? 'secondary' :
                             msg.type === 'sent' ? 'primary' : 'success'}
                        className="me-2"
                        pill
                      >
                        {format(msg.timestamp, 'HH:mm:ss')}
                      </Badge>
                      <span>{msg.content}</span>
                    </ListGroup.Item>
                  ))
                )}
                <div ref={messagesEndRef} />
              </ListGroup>
            </div>
          </Tab>
        </Tabs>
      </Card.Body>
      
      <Card.Footer className="d-flex justify-content-between align-items-center bg-light">
        <small>
          WebSocket testing tool for debugging real-time messaging
        </small>
        <div>
          {connected ? (
            <Badge bg="success" pill>Connected</Badge>
          ) : (
            <Badge bg="danger" pill>Disconnected</Badge>
          )}
        </div>
      </Card.Footer>
    </Card>
  );
};

export default WebSocketTester;
