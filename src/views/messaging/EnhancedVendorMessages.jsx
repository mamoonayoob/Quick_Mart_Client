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
  Alert,
  Modal
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  BsChat, 
  BsPeople, 
  BsSearch, 
  BsPlus,
  BsBox,
  BsShop
} from 'react-icons/bs';
import { useMessages } from '../../context/MessageContext';
import MessageList from '../../components/messaging/MessageList';
import MessageDetail from '../../components/messaging/MessageDetail';
import { 
  sendMessageToCustomer,
  sendGeneralMessageToCustomer,
  sendGeneralMessageToDeliveryBoy,
  getUniversalConversations,
  getConversationHistory,
  getAllCustomersForMessaging,
  getAllDeliveryBoysForMessaging,
  getAllUsersForMessaging,
  sendUniversalMessage
} from '../../services/messageService';
import { toast } from 'react-toastify';

const EnhancedVendorMessages = () => {
  const { loading, error, fetchMessages } = useMessages();
  const [activeTab, setActiveTab] = useState('general');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [conversations, setConversations] = useState({
    general: [],
    orders: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [allUsers, setAllUsers] = useState({ customers: [], deliveryBoys: [] });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('customer');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllConversations();
    fetchAllUsers();
  }, []);

  const fetchAllConversations = async () => {
    try {
      console.log('🔄 Fetching vendor conversations...');
      const response = await getUniversalConversations();
      console.log('✅ Vendor conversations response:', response);
      
      if (response.data?.success) {
        const allConversations = response.data.data || [];
        console.log('📋 All conversations:', allConversations);
        
        // Separate general and order-based conversations
        const generalConversations = allConversations.filter(conv => !conv.orderId);
        const orderConversations = allConversations.filter(conv => conv.orderId);
        
        console.log('💬 General conversations:', generalConversations.length);
        console.log('📦 Order conversations:', orderConversations.length);
        
        setConversations({
          general: generalConversations,
          orders: orderConversations
        });
      } else {
        console.error('❌ Failed to fetch conversations - no success flag:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      console.error('❌ Conversation fetch error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Fallback to existing message system
      fetchMessages();
    }
  };

  const fetchAllUsers = async () => {
    try {
      console.log('👥 Fetching all users for messaging...');
      const response = await getAllUsersForMessaging();
      console.log('👥 All users fetch response:', response);
      
      if (response.data?.success) {
        const userData = response.data.data || { customers: [], deliveryBoys: [] };
        console.log('✅ Users loaded successfully:', {
          customers: userData.customers?.length || 0,
          deliveryBoys: userData.deliveryBoys?.length || 0
        });
        console.log('👥 User data:', userData);
        setAllUsers(userData);
      } else {
        console.error('❌ User fetch failed - no success flag:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      console.error('❌ User fetch error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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

    console.log('🔄 Sending message:', {
      content,
      selectedMessage,
      conversationType: selectedMessage.conversationType,
      otherUserId: selectedMessage.otherUserId,
      orderId: selectedMessage.orderId
    });

    try {
      let response;
      
      if (selectedMessage.conversationType === 'general') {
        // General customer message
        console.log('📤 Sending general message to customer:', selectedMessage.otherUserId);
        response = await sendGeneralMessageToCustomer(
          selectedMessage.otherUserId, 
          content
        );
      } else if (selectedMessage.orderId) {
        // Order-based customer message
        console.log('📤 Sending order-based message for order:', selectedMessage.orderId);
        response = await sendMessageToCustomer(selectedMessage.orderId, content);
      } else {
        console.error('❌ No valid message type found');
        toast.error('Invalid conversation type');
        return;
      }
      
      console.log('✅ Message response:', response);
      
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
        console.error('❌ Message sending failed:', response);
        toast.error('Message sending failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error(`Failed to send message: ${error.message || 'Please try again.'}`);
    }
  };

  const handleNewConversation = () => {
    setShowUserModal(true);
  };

  const handleStartConversation = async () => {
    console.log('🚀 Vendor starting new conversation:', {
      selectedUser,
      userId: selectedUser?._id,
      userRole: selectedUser?.role,
      selectedUserType,
      messageContent: newMessageContent,
      messageLength: newMessageContent?.trim()?.length
    });

    if (!selectedUser || !newMessageContent.trim()) {
      console.error('❌ Missing user or message content');
      toast.error('Please select a user and enter a message');
      return;
    }

    try {
      console.log('📤 Sending universal message:', {
        receiverId: selectedUser._id,
        receiverRole: selectedUser.role,
        content: newMessageContent.trim()
      });
      
      const response = await sendUniversalMessage(
        selectedUser._id, 
        newMessageContent.trim(),
        selectedUser.role
      );
      
      console.log('✅ Vendor new conversation response:', response);
      
      if (response?.data?.success) {
        console.log('🎉 Message sent successfully!');
        toast.success('Message sent successfully!');
        setShowUserModal(false);
        setSelectedUser(null);
        setNewMessageContent('');
        setSelectedUserType('customer');
        
        // Refresh conversations
        fetchAllConversations();
      } else {
        console.error('❌ Message sending failed - no success flag:', response);
        toast.error('Message sending failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      toast.error(`Failed to send message: ${error.response?.data?.message || error.message || 'Please try again.'}`);
    }
  };

  const filteredConversations = (conversationType) => {
    const convs = conversations[conversationType] || [];
    if (!searchTerm.trim()) return convs;
    
    return convs.filter(conv =>
      conv.otherUserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredUsers = {
    customers: allUsers.customers?.filter(customer =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [],
    deliveryBoys: allUsers.deliveryBoys?.filter(delivery =>
      delivery.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <BsChat className="me-2" />
          Customer Messages
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
            onClick={() => navigate('/vendor/orders')}
          >
            <BsBox className="me-2" />
            View Orders
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
                  {selectedMessage.conversationType === 'general' ? 'Customer' : 'Order'} Information
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex align-items-center">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMessage.otherUserName || 'Customer')}&background=4361ee&color=fff&size=50`}
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
                      onClick={() => navigate(`/vendor/orders/${selectedMessage.orderId}`)}
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

      {/* Universal User Selection Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Start New Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* User Type Selection */}
          <Form.Group className="mb-3">
            <Form.Label>Select User Type</Form.Label>
            <Form.Select 
              value={selectedUserType} 
              onChange={(e) => {
                setSelectedUserType(e.target.value);
                setSelectedUser(null); // Reset selected user when type changes
              }}
            >
              <option value="customer">Customer</option>
              <option value="delivery">Delivery Boy</option>
            </Form.Select>
          </Form.Group>
          
          {/* User Selection */}
          <Form.Group className="mb-3">
            <Form.Label>
              Select {selectedUserType === 'customer' ? 'Customer' : 'Delivery Boy'}
            </Form.Label>
            <Form.Select 
              value={selectedUser?._id || ''} 
              onChange={(e) => {
                const userList = selectedUserType === 'customer' ? allUsers.customers : allUsers.deliveryBoys;
                const user = userList.find(u => u._id === e.target.value);
                setSelectedUser(user);
              }}
            >
              <option value="">
                Choose a {selectedUserType === 'customer' ? 'customer' : 'delivery boy'}...
              </option>
              {(selectedUserType === 'customer' ? allUsers.customers : allUsers.deliveryBoys).map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                  {selectedUserType === 'delivery' && user.phone && ` - ${user.phone}`}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={newMessageContent}
              onChange={(e) => setNewMessageContent(e.target.value)}
              placeholder="Type your message here..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStartConversation}
            disabled={!selectedUser || !newMessageContent.trim()}
          >
            Send Message
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EnhancedVendorMessages;
