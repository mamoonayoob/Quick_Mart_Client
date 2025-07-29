import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Nav, 
  Button, 
  Dropdown,
  Badge,
  Image
} from 'react-bootstrap';
import { 
  BsSpeedometer2, 
  BsBox, 
  BsCart3, 
  BsGraphUp, 
  BsGear, 
  BsBell, 
  BsChevronLeft, 
  BsChevronRight,
  BsPersonCircle,
  BsBoxArrowRight,
  BsSearch,
  BsGrid,
  BsListUl,
  BsTruck,
  BsEnvelope,
  BsBellFill,
  BsGraphUp as BsTrendingUp
} from 'react-icons/bs';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import logo from '../../assets/logoIcon.png'
import '../admin/AdminLayout.css'; // Reuse admin CSS

const VendorLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  // Navigation items - Vendor specific
  const navItems = [
    { path: '/vendor/dashboard', icon: <BsSpeedometer2 />, label: 'Dashboard' },
    { path: '/vendor/products', icon: <BsBox />, label: 'My Products' },
    { path: '/vendor/orders', icon: <BsCart3 />, label: 'Orders' },
    { path: '/vendor/delivery', icon: <BsTruck />, label: 'Delivery' },
    { path: '/vendor/analytics', icon: <BsGraphUp />, label: 'Analytics' },
    { path: '/vendor/forecasting', icon: <BsTrendingUp />, label: 'Forecasting' },
    { path: '/vendor/messages', icon: <BsEnvelope />, label: 'Messages' },
    { path: '/vendor/notifications', icon: <BsBellFill />, label: 'Notifications' },
    { path: '/vendor/settings', icon: <BsGear />, label: 'Settings' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar - Similar to AdminLayout but with vendor branding */}
      <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img 
              src={logo} 
              alt="QuickMart Logo" 
              className="logo-img h-100" 
              />
              {!collapsed && <span className="logo-text text-danger">QuickMart</span>}
          </div>
          <Button 
            variant="link" 
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <BsChevronRight /> : <BsChevronLeft />}
          </Button>
        </div>
        
        <div className="sidebar-user">
          {!collapsed ? (
            <div className="user-info">
              <Image 
                src={user?.profilePicture || "https://ui-avatars.com/api/?name=Vendor&background=random"} 
                roundedCircle 
                className="user-avatar" 
              />
              <div className="user-details">
                <h6 className="mb-0">{user?.name || "Vendor User"}</h6>
                <span className="user-role">Vendor</span>
              </div>
            </div>
          ) : (
            <div className="user-info-collapsed">
              <Image 
                src={user?.profilePicture || "https://ui-avatars.com/api/?name=Vendor&background=random"} 
                roundedCircle 
                className="user-avatar-small" 
              />
            </div>
          )}
        </div>
        
        <Nav className="sidebar-nav flex-column">
          {navItems.map((item) => (
            <Nav.Item key={item.path}>
              <Nav.Link 
                as={Link} 
                to={item.path} 
                className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                {!collapsed && <span className="label">{item.label}</span>}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
      </div>

      {/* Main Content */}
      <div className={`admin-content ${collapsed ? 'expanded' : ''}`}>
        {/* Top Navbar */}
        <div className="admin-topbar">
          <div className="d-flex align-items-center">
            <div className="search-container">
              <BsSearch className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search..." 
              />
            </div>
          </div>
          
          <div className="topbar-actions">
            <Button variant="light" className="action-btn">
              <BsGrid />
            </Button>
            
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" id="notification-dropdown" className="action-btn">
                <BsBell />
                <Badge bg="danger" className="notification-badge">2</Badge>
              </Dropdown.Toggle>
              <Dropdown.Menu className="notification-menu">
                <div className="notification-header">
                  <h6 className="mb-0">Notifications</h6>
                  <Button variant="link" size="sm">Mark all as read</Button>
                </div>
                <Dropdown.Divider />
                <Dropdown.Item className="notification-item unread">
                  <div className="notification-icon order">
                    <BsCart3 />
                  </div>
                  <div className="notification-content">
                    <p className="notification-text">New order received</p>
                    <span className="notification-time">2 minutes ago</span>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item className="notification-item">
                  <div className="notification-icon product">
                    <BsBox />
                  </div>
                  <div className="notification-content">
                    <p className="notification-text">Product stock low: iPhone 13</p>
                    <span className="notification-time">5 hours ago</span>
                  </div>
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className="text-center">
                  <small>View all notifications</small>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" id="user-dropdown" className="action-btn user-dropdown">
                <Image 
                  src={user?.profilePicture || "https://ui-avatars.com/api/?name=Vendor&background=random"} 
                  roundedCircle 
                  className="topbar-avatar" 
                />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/vendor/profile">
                  <BsPersonCircle className="me-2" /> My Profile
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/vendor/settings">
                  <BsGear className="me-2" /> Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <BsBoxArrowRight className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            
            <Button 
              variant="light" 
              className="d-md-none action-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              <BsListUl />
            </Button>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="admin-page-content">
          <div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLayout;
