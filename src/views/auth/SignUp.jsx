import React, { useState, useEffect } from "react";
// import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../../redux/slices/authSlice";
import logo from "../../assets/logoIcon.png";
const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });
  
  const [passwordError, setPasswordError] = useState("");
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
    // Clear any previous errors when component mounts
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear password error when user types in password fields
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      setPasswordError("");
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    // Remove confirmPassword before sending to API
    const { confirmPassword, ...registerData } = formData;
    dispatch(registerUser(registerData));
  };

  return (
    <div className="container-fluid">
      <Container className="login-container">
        <Row>
          {/* Left Side (Logo & Title) */}
          <Col md={6} className="left-side text-center d-flex flex-row justify-content-center">
            <div className="d-flex flex-row align-items-center justify-content-center">
              <img src={logo} alt="Quick Mart Logo" width={200} height={200} className="img-fluid" />
              <h2>Quick Mart</h2>
            </div>
          </Col>

          {/* Right Side (Signup Form) */}
          <Col md={6} className="right-side">
            <div className="login-box">
              <h3 className="text-center mb-5 fs-2 fw-bold">Sign Up</h3>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {passwordError && <Alert variant="danger">{passwordError}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="text"
                    name="name"
                    className="loginInput"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Control
                    type="email"
                    name="email"
                    className="loginInput"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Control
                    type="tel"
                    name="phone"
                    className="loginInput"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="password"
                        name="password"
                        className="loginInput"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        className="loginInput"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Button
                  type="submit"
                  className="login-btn btn mt-3 fw-bold"
                  disabled={loading}
                >
                  {loading ? "Signing up..." : "Sign Up"}
                </Button>
              </Form>

              <p className="text-center mt-3">Or continue with</p>

              {/* Social Icons */}
              <div className="social-icons">
                <i className="fab fa-apple"></i>
                <i className="fab fa-facebook"></i>
                <i className="fab fa-google"></i>
              </div>
              
              <p className="signup-link d-flex justify-content-center mt-3">
                Already have an account? <Link to="/login">Log In</Link>
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SignUp;
