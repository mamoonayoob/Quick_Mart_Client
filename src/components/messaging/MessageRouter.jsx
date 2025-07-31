import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Component that routes users to the appropriate messaging interface based on their role
 * This component doesn't render anything visible but handles navigation logic
 */
const MessageRouter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      // If not logged in, redirect to login
      navigate('/login', { state: { from: '/messages' } });
      return;
    }

    // Route based on user role
    switch (user.role) {
      case 'customer':
        navigate('/messages/customer');
        break;
      case 'vendor':
        navigate('/messages/vendor');
        break;
      case 'admin':
        navigate('/messages/admin');
        break;
      default:
        // If role is unknown, redirect to home
        navigate('/');
        break;
    }
  }, [user, navigate]);

  // This component doesn't render anything visible
  return null;
};

export default MessageRouter;
