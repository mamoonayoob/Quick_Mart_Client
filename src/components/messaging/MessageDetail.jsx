import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Alert, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { format, formatDistanceToNow } from 'date-fns';
import { BsCheckAll, BsCheck, BsSend, BsArrowLeft } from 'react-icons/bs';
import { useAuth } from '../../context/AuthContext'; // Assuming you have an AuthContext

const MessageDetail = ({ 
  selectedConversation, 
  onSendMessage, 
  loading,
  error 
}) => {
  const { user } = useAuth(); // Assuming you have an auth context with user info
  const [messageContent, setMessageContent] = useState('');
  const messagesEndRef = useRef(null);
  const [conversationMessages, setConversationMessages] = useState([]);

  // Process messages when selectedConversation changes
  useEffect(() => {
    if (selectedConversation) {
      // If we have a conversation history, use it
      if (selectedConversation.messages && Array.isArray(selectedConversation.messages)) {
        // Sort messages by date (oldest first)
        const sortedMessages = [...selectedConversation.messages].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setConversationMessages(sortedMessages);
      } else {
        // Otherwise just use the selected conversation as a single message
        setConversationMessages([selectedConversation]);
      }
      scrollToBottom();
    }
  }, [selectedConversation]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    
    onSendMessage(messageContent);
    setMessageContent('');
  };

  // If no conversation is selected
  if (!selectedConversation) {
    return (
      <Card className="message-detail h-100">
        <Card.Body className="d-flex flex-column justify-content-center align-items-center">
          <p className="text-muted">Select a conversation to view messages</p>
        </Card.Body>
      </Card>
    );
  }


  return (
    <Card className="message-detail h-100 shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            {selectedConversation.backAction && (
              <Button 
                variant="link" 
                className="p-0 me-2 text-dark" 
                onClick={selectedConversation.backAction}
              >
                <BsArrowLeft size={20} />
              </Button>
            )}
            <div>
              <h5 className="mb-0 fw-bold">
                {selectedConversation.sender?.name || 'Conversation'}
              </h5>
              {selectedConversation.orderId && (
                <div className="d-flex align-items-center mt-1">
                  <Badge bg="light" text="dark" className="me-2">
                    Order #{typeof selectedConversation.orderId === 'string' 
                      ? selectedConversation.orderId.substring(0, 8) 
                      : (selectedConversation.orderId._id 
                        ? selectedConversation.orderId._id.substring(0, 8) 
                        : 'Unknown')}
                  </Badge>
                  {selectedConversation.status && (
                    <Badge bg={selectedConversation.status === 'active' ? 'success' : 'secondary'}>
                      {selectedConversation.status}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          {selectedConversation.lastActive && (
            <small className="text-muted">
              Active {formatDistanceToNow(new Date(selectedConversation.lastActive), { addSuffix: true })}
            </small>
          )}
        </div>
      </Card.Header>
  
      <Card.Body className="message-content p-3" style={{ backgroundColor: '#f8f9fa' }}>
        {error && <Alert variant="danger">{error}</Alert>}
  
        <div className="messages-container" style={{ height: '400px', overflowY: 'auto', padding: '10px' }}>
          {conversationMessages.length > 0 ? (
            <ListGroup variant="flush">
              {conversationMessages.map((message, index) => {
                // Determine if the current user is the sender
                const isCurrentUser = user && (
                  message.sender?._id === user.id || 
                  message.sender?._id === user._id ||
                  message.messageType === (user.role === 'customer' ? 'customer-to-vendor' : 'vendor-to-customer')
                );
                
                // Show sender info if this is the first message or if the sender changed
                const showSenderInfo = index === 0 || 
                  (conversationMessages[index - 1]?.sender?._id !== message.sender?._id);
                
                const messageDate = new Date(message.createdAt);
                
                return (
                  <ListGroup.Item 
                    key={message._id || index}
                    className={`border-0 mb-2 ${isCurrentUser ? 'text-end' : 'text-start'}`}
                  >
                    {!isCurrentUser && showSenderInfo && (
                      <div className="sender-info mb-1">
                        <small className="text-muted fw-bold">
                          {message.sender?.name || 
                           (message.messageType === 'customer-to-vendor' ? 'Customer' : 'Vendor')}
                        </small>
                      </div>
                    )}
                    <div 
                      className={`message-bubble d-inline-block p-3 rounded-3 ${
                        isCurrentUser 
                          ? 'bg-primary text-white' 
                          : 'bg-white border'
                      }`}
                      style={{ 
                        maxWidth: '80%',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        borderTopLeftRadius: !isCurrentUser && !showSenderInfo ? '0.5rem' : '1.25rem',
                        borderTopRightRadius: isCurrentUser && !showSenderInfo ? '0.5rem' : '1.25rem',
                        borderBottomLeftRadius: '1.25rem',
                        borderBottomRightRadius: '1.25rem'
                      }}
                    >
                      <div className="message-content">{message.content}</div>
                      <div className="message-meta text-end mt-1">
                        <small className={isCurrentUser ? 'text-white-50' : 'text-muted'}>
                          {format(messageDate, 'h:mm a')}
                          {isCurrentUser && (
                            <span className="ms-1">
                              {message.isRead ? <BsCheckAll /> : <BsCheck />}
                            </span>
                          )}
                        </small>
                      </div>
                    </div>
                    {index > 0 && 
                      messageDate.getDate() !== new Date(conversationMessages[index - 1].createdAt).getDate() && (
                        <div className="date-separator text-center my-3">
                          <span className="badge bg-secondary">
                            {format(messageDate, 'MMMM d, yyyy')}
                          </span>
                        </div>
                    )}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          ) : (
            <div className="text-center p-5">
              <p className="text-muted">No messages in this conversation yet</p>
              <p className="text-muted small">Send a message to start the conversation</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card.Body>
  
      <Card.Footer className="bg-white border-top p-3">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="d-flex">
            <Form.Control
              type="text"
              placeholder="Type a message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              disabled={loading}
              className="rounded-pill border-secondary"
              style={{ paddingRight: '40px' }}
            />
            <Button
              type="submit"
              variant="primary"
              className="ms-2 rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '38px', height: '38px', padding: 0 }}
              disabled={!messageContent.trim() || loading}
            >
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <BsSend />
              )}
            </Button>
          </Form.Group>
        </Form>
      </Card.Footer>
    </Card>
  );
  
};

export default MessageDetail;
