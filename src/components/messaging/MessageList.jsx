import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { formatDistanceToNow } from 'date-fns';

const MessageList = ({ messages, onSelect, onSelectMessage, selectedMessageId }) => {
  // Use onSelectMessage if provided, otherwise fallback to onSelect
  const handleSelect = onSelectMessage || onSelect;
  
  if (!messages || messages.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted">No messages found</p>
      </div>
    );
  }

  return (
    <ListGroup className="message-list">
      {messages.map((message) => {
        // For each message, we display only the most recent one
        // The full conversation is stored in message.messages
        
        return (
          <ListGroup.Item
            key={message._id}
            action
            active={selectedMessageId === message._id}
            onClick={() => handleSelect(message)}
            className={`d-flex justify-content-between align-items-start ${!message.isRead ? 'unread-message' : ''}`}
          >
            <div className="ms-2 me-auto">
              <div className="fw-bold">
                {message?.sender?.name || 'Unknown'}
                {!message.isRead && <Badge bg="primary" pill className="ms-2">New</Badge>}
              </div>
              <div className="message-preview">{message?.content ? message.content.substring(0, 50) : 'No content'}{message?.content && message.content.length > 50 ? '...' : ''}</div>
              <small className="text-muted">
                {message?.orderId && `Order #${typeof message.orderId === 'object' ? (message.orderId._id ? message.orderId._id.substring(0, 8) : 'Unknown') : (message.orderId ? message.orderId.substring(0, 8) : 'Unknown')} • `}
                {message?.createdAt && !isNaN(new Date(message.createdAt).getTime()) ? 
                  formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 
                  'Unknown time'}
              </small>
            </div>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
};

export default MessageList;
