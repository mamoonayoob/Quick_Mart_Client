import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { Button, Card, Form, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';

/**
 * Component for testing messaging and notification functionality
 */
const MessagingTester = () => {
  const { user } = useAuth();
  const { 
    sendMessageToVendor, 
    sendMessageToAdmin, 
    sendMessageToCustomer,
    fetchMessages,
    markMessageRead,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead
  } = useMessage();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [testType, setTestType] = useState('socket');
  const [messageText, setMessageText] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [orderId, setOrderId] = useState('');

  const handleTest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let response;

      switch (testType) {
        case 'socket':
          // Test WebSocket messaging
          if (user.role === 'customer') {
            if (!recipientId) {
              throw new Error('Vendor ID is required for customer messages');
            }
            response = await sendMessageToVendor(messageText, recipientId, orderId || undefined);
          } else if (user.role === 'vendor') {
            if (!recipientId) {
              throw new Error('Customer ID is required for vendor messages');
            }
            response = await sendMessageToCustomer(messageText, recipientId, orderId || undefined);
          } else if (user.role === 'admin') {
            if (recipientId) {
              response = await sendMessageToCustomer(messageText, recipientId);
            } else {
              throw new Error('Recipient ID is required for admin messages');
            }
          }
          setResult('Message sent successfully via WebSocket');
          break;

        case 'fetch-messages':
          // Test message fetching
          response = await fetchMessages();
          setResult(`Fetched ${response.messages?.length || 0} messages`);
          break;

        case 'mark-read':
          // Test marking a message as read
          if (!recipientId) {
            throw new Error('Message ID is required to mark as read');
          }
          await markMessageRead(recipientId); // Using recipientId field for messageId
          setResult(`Message ${recipientId} marked as read`);
          break;

        case 'fetch-notifications':
          // Test notification fetching
          response = await fetchNotifications();
          setResult(`Fetched ${response.notifications?.length || 0} notifications`);
          break;

        case 'mark-notification':
          // Test marking a notification as read
          if (!recipientId) {
            throw new Error('Notification ID is required to mark as read');
          }
          await markNotificationRead(recipientId); // Using recipientId field for notificationId
          setResult(`Notification ${recipientId} marked as read`);
          break;

        case 'mark-all-notifications':
          // Test marking all notifications as read
          await markAllNotificationsRead();
          setResult('All notifications marked as read');
          break;

        default:
          throw new Error('Invalid test type');
      }
    } catch (err) {
      console.error('Test error:', err);
      setError(err.message || 'An error occurred during the test');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Alert variant="warning">
        Please log in to use the messaging tester.
      </Alert>
    );
  }

  return (
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h4>QuickMart Messaging & Notification Tester</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {result && <Alert variant="success">{result}</Alert>}

          <Form onSubmit={handleTest}>
            <Form.Group className="mb-3">
              <Form.Label>Test Type</Form.Label>
              <Form.Select 
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                required
              >
                <option value="socket">Send WebSocket Message</option>
                <option value="fetch-messages">Fetch Messages</option>
                <option value="mark-read">Mark Message as Read</option>
                <option value="fetch-notifications">Fetch Notifications</option>
                <option value="mark-notification">Mark Notification as Read</option>
                <option value="mark-all-notifications">Mark All Notifications as Read</option>
              </Form.Select>
            </Form.Group>

            {(testType === 'socket') && (
              <Form.Group className="mb-3">
                <Form.Label>Message Text</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Enter your message"
                  required={testType === 'socket'}
                />
              </Form.Group>
            )}

            {(['socket', 'mark-read', 'mark-notification'].includes(testType)) && (
              <Form.Group className="mb-3">
                <Form.Label>
                  {testType === 'socket' 
                    ? `Recipient ID (${user.role === 'customer' ? 'Vendor' : user.role === 'vendor' ? 'Customer' : 'User'})` 
                    : testType === 'mark-read' 
                      ? 'Message ID' 
                      : 'Notification ID'}
                </Form.Label>
                <Form.Control
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder={
                    testType === 'socket' 
                      ? `Enter ${user.role === 'customer' ? 'vendor' : user.role === 'vendor' ? 'customer' : 'user'} ID` 
                      : testType === 'mark-read' 
                        ? 'Enter message ID' 
                        : 'Enter notification ID'
                  }
                  required={['socket', 'mark-read', 'mark-notification'].includes(testType)}
                />
              </Form.Group>
            )}

            {(testType === 'socket' && ['customer', 'vendor'].includes(user.role)) && (
              <Form.Group className="mb-3">
                <Form.Label>Order ID (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter order ID (optional)"
                />
              </Form.Group>
            )}

            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Testing...
                </>
              ) : (
                'Run Test'
              )}
            </Button>
          </Form>
        </Card.Body>
        <Card.Footer>
          <Row>
            <Col>
              <small className="text-muted">
                Current User: {user.name} ({user.role})
              </small>
            </Col>
            <Col className="text-end">
              <small className="text-muted">
                User ID: {user.id}
              </small>
            </Col>
          </Row>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default MessagingTester;
