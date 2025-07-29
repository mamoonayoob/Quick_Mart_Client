import React from 'react';
import { Badge, Button } from 'react-bootstrap';
import { BsBell, BsBellFill } from 'react-icons/bs';
import { useMessages } from '../../context/MessageContext';

const NotificationBadge = ({ onClick }) => {
  const { unreadCount } = useMessages();

  return (
    <Button 
      variant="link" 
      className="position-relative notification-button p-0 mx-2" 
      onClick={onClick}
    >
      {unreadCount > 0 ? <BsBellFill size={20} /> : <BsBell size={20} />}
      {unreadCount > 0 && (
        <Badge 
          bg="danger" 
          pill 
          className="position-absolute top-0 start-100 translate-middle"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default NotificationBadge;
