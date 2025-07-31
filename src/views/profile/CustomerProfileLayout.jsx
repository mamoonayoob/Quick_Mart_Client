import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Tab, Card, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMessages } from '../../context/MessageContext';
import { BsPerson, BsClipboardData, BsEnvelope, BsEnvelopeFill } from 'react-icons/bs';

// Import the separate components
import CustomerProfileInfo from './CustomerProfileInfo';
import CustomerOrders from './CustomerOrders';
import WhatsAppCustomerMessages from '../messaging/WhatsAppCustomerMessages';

const CustomerProfileLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useMessages();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');

  // Get active tab from URL if present
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/messages')) {
      setActiveTab('messages');
    } else if (path.includes('/orders')) {
      setActiveTab('orders');
    } else {
      setActiveTab('profile');
    }
  }, [location.pathname]);

  // Handle tab change and update URL
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'messages') {
      navigate('/profile/messages', { replace: true });
    } else if (tabKey === 'orders') {
      navigate('/profile/orders', { replace: true });
    } else {
      navigate('/profile', { replace: true });
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h4 className="mb-0 text-danger">My Account</h4>
                  <p className="text-muted mb-0">Manage your profile, orders, and messages</p>
                </div>
                <div className="d-flex align-items-center">
                  <div 
                    className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center me-3"
                    style={{ width: '50px', height: '50px', fontSize: '20px' }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h6 className="mb-0">{user?.name || 'Customer'}</h6>
                    <small className="text-muted">{user?.email}</small>
                  </div>
                </div>
              </div>
            </Card.Header>

            <Card.Body className="p-0">
              <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
                <Row className="g-0">
                  {/* Sidebar Navigation */}
                  <Col md={3} className="border-end bg-light">
                    <Nav variant="pills" className="flex-column p-3">
                      <Nav.Item className="mb-2">
                        <Nav.Link 
                          eventKey="profile" 
                          className="d-flex align-items-center text-start"
                          style={{ borderRadius: '8px' }}
                        >
                          <BsPerson size={20} className="me-3" />
                          <div>
                            <div className="fw-semibold">Profile</div>
                            <small className="text-muted">Personal information</small>
                          </div>
                        </Nav.Link>
                      </Nav.Item>

                      <Nav.Item className="mb-2">
                        <Nav.Link 
                          eventKey="orders" 
                          className="d-flex align-items-center text-start"
                          style={{ borderRadius: '8px' }}
                        >
                          <BsClipboardData size={20} className="me-3" />
                          <div>
                            <div className="fw-semibold">My Orders</div>
                            <small className="text-muted">Order history & tracking</small>
                          </div>
                        </Nav.Link>
                      </Nav.Item>

                      <Nav.Item className="mb-2">
                        <Nav.Link 
                          eventKey="messages" 
                          className="d-flex align-items-center text-start position-relative"
                          style={{ borderRadius: '8px' }}
                        >
                          {unreadCount > 0 ? (
                            <BsEnvelopeFill size={20} className="me-3 text-danger" />
                          ) : (
                            <BsEnvelope size={20} className="me-3" />
                          )}
                          <div>
                            <div className="fw-semibold">Messages</div>
                            <small className="text-muted">Chat with vendors & support</small>
                          </div>
                          {unreadCount > 0 && (
                            <Badge 
                              bg="danger" 
                              pill 
                              className="position-absolute top-0 end-0"
                              style={{ transform: 'translate(25%, -25%)' }}
                            >
                              {unreadCount}
                            </Badge>
                          )}
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Col>

                  {/* Main Content Area */}
                  <Col md={9}>
                    <Tab.Content className="h-100">
                      <Tab.Pane eventKey="profile" className="p-4">
                        <CustomerProfileInfo />
                      </Tab.Pane>

                      <Tab.Pane eventKey="orders" className="p-4">
                        <CustomerOrders />
                      </Tab.Pane>

                      <Tab.Pane eventKey="messages" className="p-0">
                        <div style={{ height: '80vh' }}>
                          <WhatsAppCustomerMessages />
                        </div>
                      </Tab.Pane>
                    </Tab.Content>
                  </Col>
                </Row>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CustomerProfileLayout;
