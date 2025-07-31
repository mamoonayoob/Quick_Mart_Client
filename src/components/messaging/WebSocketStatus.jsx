import React, { useEffect, useState } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { useMessages } from '../../context/MessageContext';
import { getSocketStatus } from '../../services/socketService';

/**
 * Component to display WebSocket connection status
 * Useful for debugging real-time messaging issues
 */
const WebSocketStatus = () => {
  const { socketStatus } = useMessages();
  const [localStatus, setLocalStatus] = useState('not_initialized');
  
  // Update status every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getSocketStatus();
      setLocalStatus(status);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Get badge color based on status
  const getBadgeColor = (status) => {
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
  
  return (
    <Card className="mb-3">
      <Card.Header>WebSocket Status</Card.Header>
      <Card.Body>
        <div className="d-flex align-items-center">
          <span className="me-2">Context Status:</span>
          <Badge bg={getBadgeColor(socketStatus)}>
            {socketStatus || 'Unknown'}
          </Badge>
        </div>
        <div className="d-flex align-items-center mt-2">
          <span className="me-2">Direct Status:</span>
          <Badge bg={getBadgeColor(localStatus)}>
            {localStatus || 'Unknown'}
          </Badge>
        </div>
        <small className="text-muted d-block mt-2">
          {socketStatus === 'connected' ? 
            'Real-time messaging is active' : 
            'Real-time messaging may be unavailable'}
        </small>
      </Card.Body>
    </Card>
  );
};

export default WebSocketStatus;
