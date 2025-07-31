import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Tabs, 
  Tab, 
  Button, 
  Form, 
  InputGroup,
  Badge,
  Alert
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  BsChat, 
  BsShop, 
  BsSearch, 
  BsPlus,
  BsBox,
  BsPeople
} from 'react-icons/bs';
import { useMessages } from '../../context/MessageContext';
import MessageList from '../../components/messaging/MessageList';
import MessageDetail from '../../components/messaging/MessageDetail';
import { 
  sendMessageToVendor, 
  sendMessageToAdmin,
  sendGeneralMessageToVendor,
  getCustomerConversations,
  getConversationHistory
} from '../../services/messageService';
import { toast } from 'react-toastify';

const EnhancedCustomerMessages = () => {
  const { loading, error, fetchMessages, customerMessages } = useMessages();
  const [activeTab, setActiveTab] = useState('general');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [conversations, setConversations] = useState({
    general: [],
    orders: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllConversations();
  }, []);

  const fetchAllConversations = async () => {
    try {
      // Fetch enhanced conversations (both general and order-based)
      const response = await getCustomerConversations();
      if (response.data?.success) {
        const allConversations = response.data.data || [];
        
        // Separate general and order-based conversations
        const generalConversations = allConversations.filter(conv => 
          !conv.orderId || conv.conversationType === 'general'
        );
        const orderConversations = allConversations.filter(conv => 
          conv.orderId && conv.conversationType !== 'general'
        );
        
        setConversations({
          general: generalConversations,
          orders: orderConversations
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback to existing message system
      fetchMessages();
    }
  };

  const handleSelectMessage = async (message) => {
    setSelectedMessage(message);
    
    // Fetch full conversation history
    if (message.otherUserId) {
      try {
        const response = await getConversationHistory(
          message.otherUserId, 
          message.conversationType || 'general'
        );
        if (response.data?.success) {
          const fullConversation = {
            ...message,
            messages: response.data.data || []
          };
          setSelectedMessage(fullConversation);
        }
      } catch (error) {
        console.error('Error fetching conversation history:', error);
      }
    }
  };

  const handleSendMessage = async (content) => {
    if (!selectedMessage) {
      toast.error('Please select a conversation');
      return;
    }

    console.log('🔄 Customer sending message:', {
      content,
      selectedMessage,
      conversationType: selectedMessage.conversationType,
      otherUserId: selectedMessage.otherUserId,
      orderId: selectedMessage.orderId
    });

    try {
      let response;
      
      if (selectedMessage.conversationType === 'general') {
        // General vendor message
        console.log('📤 Sending general message to vendor:', selectedMessage.otherUserId);
        response = await sendGeneralMessageToVendor(
          selectedMessage.otherUserId, 
          content
        );
      } else if (selectedMessage.orderId) {
        // Order-based vendor message
        console.log('📤 Sending order-based message for order:', selectedMessage.orderId);
        response = await sendMessageToVendor(selectedMessage.orderId, content);
      } else {
        // Admin message
        console.log('📤 Sending message to admin');
        response = await sendMessageToAdmin(content, selectedMessage.orderId);
      }
      
      console.log('✅ Customer message response:', response);
      
      if (response?.data?.success) {
        toast.success('Message sent successfully!');
        
        // Update conversation with new message
        const newMessage = response.data.data;
        if (selectedMessage.messages) {
          selectedMessage.messages.push(newMessage);
          setSelectedMessage({...selectedMessage});
        }
        
        // Refresh conversations
        fetchAllConversations();
      } else {
        console.error('❌ Customer message sending failed:', response);
        toast.error('Message sending failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Customer error sending message:', error);
      toast.error(`Failed to send message: ${error.message || 'Please try again.'}`);
    }
  };

  const handleNewConversation = () => {
    navigate('/vendors/directory');
  };

  const filteredConversations = (conversationType) => {
    const convs = conversations[conversationType] || [];
    if (!searchTerm.trim()) return convs;
    
    return convs.filter(conv =>
      conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <BsChat className="me-2" />
          Messages
        </h2>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={handleNewConversation}
          >
            <BsPlus className="me-2" />
            New Message
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/vendors/directory')}
          >
            <BsShop className="me-2" />
            Browse Vendors
          </Button>
        </div>
      </div>

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Conversations</h5>
                <Badge bg="primary">{Object.values(conversations).flat().length}</Badge>
              </div>
              
              {/* Search Bar */}
              <InputGroup size="sm">
                <InputGroup.Text>
                  <BsSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Card.Header>
            
            <Card.Body className="p-0">
              <Tabs
                activeKey={activeTab}
                onSelect={(key) => setActiveTab(key)}
                className="border-bottom-0"
              >
                <Tab 
                  eventKey="general" 
                  title={
                    <span>
                      <BsPeople className="me-2" />
                      General ({conversations.general.length})
                    </span>
                  }
                >
                  <div className="p-3">
                    {filteredConversations('general').length === 0 ? (
                      <Alert variant="light" className="text-center">
                        <BsChat className="mb-2" size={24} />
                        <p className="mb-2">No general conversations</p>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={handleNewConversation}
                        >
                          Start a conversation
                        </Button>
                      </Alert>
                    ) : (
                      <MessageList
                        messages={filteredConversations('general').map(conv => ({
                          _id: conv._id,
                          senderName: conv.otherUserName,
                          content: conv.lastMessage?.content || 'New conversation',
                          createdAt: conv.lastMessage?.createdAt || conv.createdAt,
                          isRead: conv.isRead,
                          conversationType: 'general',
                          otherUserId: conv.otherUserId
                        }))}
                        onSelectMessage={handleSelectMessage}
                        selectedMessageId={selectedMessage?._id}
                      />
                    )}
                  </div>
                </Tab>
                
                <Tab 
                  eventKey="orders" 
                  title={
                    <span>
                      <BsBox className="me-2" />
                      Orders ({conversations.orders.length})
                    </span>
                  }
                >
                  <div className="p-3">
                    {filteredConversations('orders').length === 0 ? (
                      <Alert variant="light" className="text-center">
                        <BsBox className="mb-2" size={24} />
                        <p className="mb-2">No order conversations</p>
                        <small className="text-muted">
                          Order-based conversations will appear here
                        </small>
                      </Alert>
                    ) : (
                      <MessageList
                        messages={filteredConversations('orders').map(conv => ({
                          _id: conv._id,
                          senderName: conv.otherUserName,
                          content: conv.lastMessage?.content || 'Order conversation',
                          createdAt: conv.lastMessage?.createdAt || conv.createdAt,
                          isRead: conv.isRead,
                          orderId: conv.orderId,
                          conversationType: 'order'
                        }))}
                        onSelectMessage={handleSelectMessage}
                        selectedMessageId={selectedMessage?._id}
                      />
                    )}
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <MessageDetail
            selectedConversation={selectedMessage}
            onSendMessage={handleSendMessage}
            loading={loading}
            error={error}
          />
          
          {selectedMessage && (
            <Card className="mt-3">
              <Card.Header className="bg-white">
                <h6 className="mb-0">
                  {selectedMessage.conversationType === 'general' ? 'Vendor' : 'Order'} Information
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMessage.otherUserName || 'User')}&background=4361ee&color=fff&size=50`}
                    alt={selectedMessage.otherUserName}
                    className="rounded-circle me-3"
                    width="50"
                    height="50"
                  />
                  <div>
                    <h6 className="mb-1">{selectedMessage.otherUserName}</h6>
                    <small className="text-muted">
                      {selectedMessage.conversationType === 'general' 
                        ? 'General Conversation' 
                        : `Order #${selectedMessage.orderId}`
                      }
                    </small>
                  </div>
                </div>
                
                {selectedMessage.orderId && (
                  <div className="mt-3">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => navigate(`/orders/${selectedMessage.orderId}`)}
                    >
                      <BsBox className="me-2" />
                      View Order Details
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default EnhancedCustomerMessages;
