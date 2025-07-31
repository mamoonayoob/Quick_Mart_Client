import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useMessages } from '../../context/MessageContext';
// We don't need useAuth since we're not using user info directly
// import { useAuth } from '../../context/AuthContext';
import MessageList from '../../components/messaging/MessageList';
import MessageDetail from '../../components/messaging/MessageDetail';
import { sendMessageToCustomer } from '../../services/messageService';

const VendorMessages = () => {
  const { loading, error, fetchMessages, orderMessages, fetchOrderMessages, vendorMessages } = useMessages();
  // We don't need user info directly in this component
  // const { user } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const navigate = useNavigate();
  const { orderId } = useParams(); // In case we navigate from an order page
  
  // Create messagesData using useMemo to avoid re-creating on every render
  const messagesData = useMemo(() => {
    return vendorMessages?.data ? 
      (Array.isArray(vendorMessages.data) ? vendorMessages.data : Array.from(Object.values(vendorMessages.data))) 
      : [];
  }, [vendorMessages]);

  useEffect(() => {
    // Fetch messages
    fetchMessages();
    
    // If orderId is provided, fetch messages for that order
    if (orderId) {
      fetchOrderMessages(orderId);
      
      // Find the first message with this orderId to select it
      const orderMessage = messagesData.find(msg => {
        const msgOrderId = msg.orderId?._id || msg.orderId;
        return msgOrderId === orderId;
      });
      if (orderMessage) {
        setSelectedMessage(orderMessage);
      }
    }
  }, [orderId, fetchMessages, fetchOrderMessages, messagesData]);

  // Handle message selection
  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    
    // Fetch order messages if not already loaded
    if (message.orderId && !orderMessages[message.orderId]) {
      fetchOrderMessages(message.orderId);
    }
  };

  // Handle sending message to customer
  const handleSendToCustomer = async (content) => {
    if (!selectedMessage || !selectedMessage.orderId) {
      alert('Please select an order to message the customer');
      return;
    }
    
    try {
      const response = await sendMessageToCustomer(selectedMessage.orderId, content);
      
      // Immediately update local state with the new message
      if (response && response.data && response.data.data) {
        const newMessage = response.data.data;
        
        // Add the new message to the conversation
        if (selectedMessage.messages && Array.isArray(selectedMessage.messages)) {
          selectedMessage.messages.push(newMessage);
          setSelectedMessage({...selectedMessage});
        } else {
          // If no messages array exists yet, create one
          const updatedMessage = {...selectedMessage, messages: [selectedMessage, newMessage]};
          setSelectedMessage(updatedMessage);
        }
      }
      
      // Still fetch messages to ensure sync with server
      fetchMessages();
      fetchOrderMessages(selectedMessage.orderId);
    } catch (error) {
      console.error('Error sending message to customer:', error);
    }
  };

  // messagesData is now defined via useMemo above
  
  // Group customer messages by orderId
  const groupedCustomerMessages = messagesData
    .filter(msg => msg.messageType === 'customer-to-vendor' || msg.messageType === 'vendor-to-customer')
    .reduce((acc, message) => {
      const orderId = message.orderId?._id || message.orderId;
      if (!orderId) return acc;
      
      // Find existing message with this orderId
      const existingIndex = acc.findIndex(m => 
        (m.orderId?._id === orderId || m.orderId === orderId)
      );
      
      if (existingIndex !== -1) {
        // If we already have a message for this order
        const existingMessage = acc[existingIndex];
        
        // Check if the current message is newer
        if (new Date(message.createdAt) > new Date(existingMessage.createdAt)) {
          // Store all messages for this order in the 'messages' property
          const allMessages = existingMessage.messages || [existingMessage];
          message.messages = [...allMessages, message];
          
          // Replace the existing message with the newer one
          acc[existingIndex] = message;
        } else {
          // Current message is older, just add it to the messages array
          const allMessages = existingMessage.messages || [existingMessage];
          acc[existingIndex].messages = [...allMessages, message];
        }
      } else {
        // First message with this orderId
        message.messages = [message];
        acc.push(message);
      }
      
      return acc;
    }, []);
    
  // Sort messages by date (newest first)
  const orderConversations = groupedCustomerMessages.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <Container style={{ display: "flex", flexDirection: "column" }} className="py-4">
      <h2 className="mb-4">Customer Messages</h2>
      
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Order Conversations</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {orderConversations.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted">No customer messages</p>
                </div>
              ) : (
                <MessageList
                  messages={orderConversations.map(conv => ({
                    _id: conv.orderId,
                    senderName: conv.customerName || 'Customer',
                    content: conv.content || (conv.lastMessage ? conv.lastMessage.content : 'New conversation'),
                    createdAt: conv.createdAt || (conv.lastMessage ? conv.lastMessage.createdAt : new Date()),
                    orderId: conv.orderId,
                    isRead: conv.isRead || (conv.unreadCount === 0)
                  }))}
                  onSelectMessage={(conv) => {
                    // Find the actual message from this conversation
                    const message = messagesData.find(msg => {
                      const msgOrderId = msg.orderId?._id || msg.orderId;
                      return msgOrderId === conv._id;
                    });
                    if (message) {
                      handleSelectMessage(message);
                    }
                  }}
                  selectedMessageId={selectedMessage?.orderId}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <MessageDetail
            selectedConversation={selectedMessage}
            onSendMessage={handleSendToCustomer}
            loading={loading}
            error={error}
          />
          
          {selectedMessage && (
            <Card className="mt-3">
              <Card.Header className="bg-white">Order Information</Card.Header>
              <Card.Body>
                <p><strong>Order ID:</strong> {selectedMessage.orderId}</p>
                <p><strong>Customer:</strong> {
                  selectedMessage.senderType === 'customer' 
                    ? selectedMessage.senderName 
                    : selectedMessage.receiverName || 'Customer'
                }</p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => navigate(`/vendor/orders/${selectedMessage.orderId}`)}
                >
                  View Order Details
                </button>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default VendorMessages;
