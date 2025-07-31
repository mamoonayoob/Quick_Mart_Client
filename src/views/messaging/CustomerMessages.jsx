import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { useMessages } from '../../context/MessageContext';
// import { useAuth } from '../../context/AuthContext'; // Not needed as we're not using user info
import MessageList from '../../components/messaging/MessageList';
import MessageDetail from '../../components/messaging/MessageDetail';
import { 
  sendMessageToVendor, 
  sendMessageToAdmin, 
  getVendorByOrderId 
} from '../../services/messageService';

const CustomerMessages = () => {
  const { loading, error, fetchMessages, fetchOrderMessages, customerMessages } = useMessages();
  // const { user } = useAuth(); // Commented out since it's not being used
  const [activeTab, setActiveTab] = useState('vendor');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [vendorInfo, setVendorInfo] = useState(null);
  const { orderId } = useParams(); // In case we navigate from an order page

  useEffect(() => {
    // Fetch messages
    fetchMessages();
    
    // If orderId is provided, fetch messages for that order
    if (orderId) {
      fetchOrderMessages(orderId);
      fetchVendorInfo(orderId);
      setActiveTab('vendor');
    }
  }, [orderId, fetchMessages, fetchOrderMessages]);

  // Fetch vendor information by order ID
  const fetchVendorInfo = async (orderId) => {
    try {
      const response = await getVendorByOrderId(orderId);
      if (response && response.data) {
        setVendorInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching vendor info:', error);
    }
  };

  // Ensure customerMessages.data is an array before filtering
  const messagesData = customerMessages?.data ? 
    (Array.isArray(customerMessages.data) ? customerMessages.data : Array.from(Object.values(customerMessages.data))) 
    : [];
  
  // Group vendor messages by orderId
  const groupedVendorMessages = messagesData
    .filter(msg => msg.messageType === 'customer-to-vendor')
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
  
  // Filter messages by type (vendor or admin)
  const vendorMessages = groupedVendorMessages || [];
  
  const adminMessages = messagesData.filter(msg => 
    msg.messageType === 'customer-to-admin'
  ) || [];

  // Handle message selection
  const handleSelectMessage = (message) => {
    console.log("message",message);
    setSelectedMessage(message);
    
    // If selecting a vendor message, fetch vendor info
    if (message.messageType === 'customer-to-vendor') {
      fetchVendorInfo(message.orderId);
    }
  };

  // Handle sending message to vendor
  const handleSendToVendor = async (content) => {
    if (!selectedMessage || !selectedMessage.orderId) {
      alert('Please select an order to message the vendor');
      return;
    }
    
    try {
      const response = await sendMessageToVendor(selectedMessage.orderId, content);
      
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
      console.error('Error sending message to vendor:', error);
    }
  };

  // Handle sending message to admin
  const handleSendToAdmin = async (content) => {
    const orderId = selectedMessage?.orderId || null;
    
    try {
      await sendMessageToAdmin(content, orderId);
      fetchMessages();
      if (orderId) {
        fetchOrderMessages(orderId);
      }
    } catch (error) {
      console.error('Error sending message to admin:', error);
    }
  };

  return (
    <Container style={{ display: "flex",flexDirection: "column" }} className="py-4">
      <h2 className="mb-4">Messages</h2>
      
      <Row >
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <Tabs
                activeKey={activeTab}
                onSelect={(key) => setActiveTab(key)}
                className="mb-3"
              >
                <Tab eventKey="vendor" title="Vendors">
                  <MessageList
                    messages={vendorMessages}
                    onSelectMessage={handleSelectMessage}
                    selectedMessageId={selectedMessage?._id}
                  />
                </Tab>
                <Tab eventKey="admin" title="Support">
                  <MessageList
                    messages={adminMessages}
                    onSelectMessage={handleSelectMessage}
                    selectedMessageId={selectedMessage?._id}
                  />
                </Tab>
              </Tabs>
            </Card.Header>
          </Card>
        </Col>
        
        <Col md={8}>
          <MessageDetail
            selectedConversation={selectedMessage}
            onSendMessage={activeTab === 'vendor' ? handleSendToVendor : handleSendToAdmin}
            loading={loading}
            error={error}
          />
          
          {vendorInfo && activeTab === 'vendor' && (
            <Card className="mt-3">
              <Card.Header>Vendor Information</Card.Header>
              <Card.Body>
                <p><strong>Name:</strong> {vendorInfo.name}</p>
                <p><strong>Store:</strong> {vendorInfo.storeName}</p>
                <p><strong>Contact:</strong> {vendorInfo.email}</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerMessages;
