import React, { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError, fetchUserProfile } from "../../redux/slices/authSlice";
import logo from "../../assets/logoIcon.png";
const LogIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  // Get the redirect path from location state or use role-based default
  const from = location.state?.from?.pathname || "/";
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // If authenticated, try to fetch the user profile for the most up-to-date data
      dispatch(fetchUserProfile())
        .unwrap()
        .then((userData) => {
          // Redirect based on user role
          const userRole = userData?.role || JSON.parse(localStorage.getItem('user'))?.role;
          console.log("User role for redirect:", userRole);
          
          let redirectPath;
          // If coming from a specific page, honor that, otherwise redirect based on role
          if (location.state?.from?.pathname) {
            redirectPath = from;
          } else {
            // Role-based redirect
            switch(userRole) {
              case 'admin':
                redirectPath = '/admin/dashboard';
                break;
              case 'vendor':
                redirectPath = '/vendor/dashboard';
                break;
              case 'deliveryman':
              case 'delivery':
                redirectPath = '/delivery/dashboard';
                break;
              default: // customer or any other role
                redirectPath = '/';
                break;
            }
          }
          
          console.log("Redirecting to:", redirectPath);
          navigate(redirectPath, { replace: true });
        })
        .catch((err) => {
          console.error("Failed to fetch profile:", err);
          // Get user from localStorage as fallback
          const userFromStorage = JSON.parse(localStorage.getItem('user'));
          let fallbackPath = '/';
          
          if (userFromStorage?.role === 'admin') {
            fallbackPath = '/admin/dashboard';
          } else if (userFromStorage?.role === 'vendor') {
            fallbackPath = '/vendor/dashboard';
          } else if (userFromStorage?.role === 'deliveryman' || userFromStorage?.role === 'delivery') {
            fallbackPath = '/delivery/dashboard';
          }
          
          navigate(fallbackPath, { replace: true });
        });
    }
    
    // Clear any previous errors when component mounts
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch, from]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData))
      .unwrap()
      .then((response) => {
        console.log("Login successful", response);
        
        // Direct navigation based on user role
        const userRole = response?.user?.role;
        console.log("User role from login response:", userRole);
        
        // Redirect based on role
        if (userRole === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (userRole === 'vendor') {
          navigate('/vendor/dashboard', { replace: true });
        } else if (userRole === 'delivery' || userRole === 'deliveryman') {
          navigate('/delivery/dashboard', { replace: true });
        } else {
          // Default to home for customers or unknown roles
          navigate('/', { replace: true });
        }
      })
      .catch((err) => {
        console.error("Login failed:", err);
        // Error is already handled in the reducer
      });
  };

  return (
    <div className="container-fluid">
      <Container className="login-container">
        <Row>
          <Col
            md={6}
            className="left-side text-center d-flex flex-row justify-content-center align-i"
          >
            <div className="d-flex flex-row align-items-center justify-content-center">
              <img src={logo} alt="Quick Mart Logo" width={200} height={200} className="img-fluid" />
              <h2>Quick Mart</h2>
            </div>
          </Col>

          {/* Right Side (Login Form) */}
          <Col md={6} className="right-side">
            <div className="login-box">
              <h3 className="text-center mb-5 fs-2 fw-bold">Log In</h3>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="loginInput"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="loginInput"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Button
                  type="submit"
                  className="login-btn btn mt-3 fw-bold btn-outline-danger"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Form>

              <p className="text-center mt-3">Or continue with</p>

              <div className="social-icons">
                <i className="fab fa-apple"></i>
                <i className="fab fa-facebook"></i>
                <i className="fab fa-google"></i>
              </div>
            </div>
            <p className="signup-link d-flex justify-content-center">
              Not a member? <Link to="/signup">Sign up</Link>
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LogIn;
