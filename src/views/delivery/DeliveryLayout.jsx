import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
// import '../../../assets/css/DeliveryLayout-fixed.css';
import {  
  Button, 
  Dropdown,
  Image,
  Form,
  Badge
} from 'react-bootstrap';
import { 
  BsSpeedometer2, 
  BsBox, 
  BsBoxArrowRight,
  BsSearch,
  BsBell,
  BsChevronLeft, 
  BsChevronRight,
  BsPerson,
  BsList,
  BsChatDots
} from 'react-icons/bs';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import '../../assets/css/DeliveryLayout.css';

const DeliveryLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Navigation items - Delivery specific (only essential items)
  const navItems = [
    { path: '/delivery/dashboard', icon: <BsSpeedometer2 className="me-2" />, label: 'Dashboard' },
    { path: '/delivery/orders', icon: <BsBox className="me-2" />, label: 'My Deliveries' },
    { path: '/delivery/messages', icon: <BsChatDots className="me-2" />, label: 'Messages' },
    { path: '/delivery/profile', icon: <BsPerson className="me-2" />, label: 'Profile' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <div className="delivery-layout d-flex vh-100">
      {/* Sidebar */}
      <div className={`delivery-sidebar ${collapsed ? 'collapsed' : ''} ${showMobileMenu ? 'show' : ''} bg-white border-end d-flex flex-column`}>
        <div className="sidebar-header p-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="logo-container d-flex align-items-center">
            <img 
              src="/loginpic/logo.png" 
              alt="QuickMart" 
              className="me-2" 
              style={{ width: '32px', height: '32px' }}
            />
            {!collapsed && <span className="font-weight-bold">QuickMart</span>}
          </div>
          <Button 
            variant="link" 
            className="p-0 d-none d-md-block"
            onClick={() => setCollapsed(!collapsed)}
            style={{ minWidth: '24px' }}
          >
            {collapsed ? <BsChevronRight /> : <BsChevronLeft />}
          </Button>
        </div>
        
        <div className="sidebar-user p-3 border-bottom">
          <div className="d-flex align-items-center">
            <Image 
              src={user?.profilePicture || "https://ui-avatars.com/api/?name=DP&background=random"} 
              roundedCircle 
              width="40"
              height="40"
              className="me-2"
            />
            {!collapsed && (
              <div>
                <div className="fw-bold text-truncate" style={{ maxWidth: '160px' }}>{user?.name || 'Delivery Person'}</div>
                <small className="text-muted">Delivery Partner</small>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-nav flex-grow-1 overflow-auto py-2">
          {navItems.map((item, index) => (
            <Link 
              key={index} 
              to={item.path} 
              className={`d-flex align-items-center py-2 px-3 text-decoration-none ${location.pathname === item.path ? 'bg-primary text-white' : 'text-dark'}`}
              onClick={() => setShowMobileMenu(false)}
            >
              {item.icon}
              {!collapsed && <span className="ms-2">{item.label}</span>}
            </Link>
          ))}
          
          <div 
            className="d-flex align-items-center py-2 px-3 text-dark" 
            style={{ cursor: 'pointer' }}
            onClick={handleLogout}
          >
            <BsBoxArrowRight className="me-2" />
            {!collapsed && <span>Logout</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="delivery-main flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Top Navigation */}
        <div className="top-nav bg-white border-bottom py-2">
          <div className="container">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <Button 
                  variant="light" 
                  className="sidebar-toggle d-md-none me-2"
                  onClick={toggleMobileMenu}
                >
                  <BsList className="fs-5" />
                </Button>
                
                <div className="position-relative d-none d-md-block" style={{ width: '300px' }}>
                  <Form.Control 
                    type="search" 
                    placeholder="Search orders..." 
                    className="ps-4"
                    style={{ borderRadius: '20px' }}
                  />
                  <BsSearch className="position-absolute" style={{ top: '10px', left: '12px', color: '#6c757d' }} />
                </div>
              </div>

              <div className="d-flex align-items-center">
                <div className="position-relative me-3">
                  <Button variant="light" className="rounded-circle p-2">
                    <BsBell className="fs-5" />
                  </Button>
                  <Badge 
                    bg="danger" 
                    className="position-absolute top-0 end-0 translate-middle rounded-pill"
                    style={{ fontSize: '0.6rem', padding: '0.25rem 0.4rem' }}
                  >
                    3
                  </Badge>
                </div>
                
                <Dropdown>
                  <Dropdown.Toggle 
                    variant="light" 
                    className="d-flex align-items-center bg-transparent border-0"
                  >
                    <Image 
                      src={user?.profilePicture || "https://ui-avatars.com/api/?name=DP&background=random"} 
                      roundedCircle 
                      width="36"
                      height="36"
                      className="me-2"
                    />
                    <span className="d-none d-lg-inline">{user?.name || 'User'}</span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu align="end" className="mt-2 border-0 shadow-sm">
                    <Dropdown.Item as={Link} to="/delivery/profile" className="d-flex align-items-center">
                      <BsPerson className="me-2" /> Profile
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="d-flex align-items-center">
                      <BsBoxArrowRight className="me-2" /> Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="content-wrapper flex-grow-1 overflow-auto p-3 p-md-4 bg-light">
          <div className="container-fluid">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryLayout;
