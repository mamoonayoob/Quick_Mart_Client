import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile } from '../../redux/slices/authSlice';
import { updateUserProfile } from '../../helpers/apiHelpers';

const CustomerProfileInfo = () => {
  const dispatch = useDispatch();
  const { user, loading: authLoading, error: authError } = useSelector((state) => state.auth);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [editing, setEditing] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Load user data into form when available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  // Fetch user profile only on initial load
  useEffect(() => {
    if (!user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (updateLoading) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const updatedProfileData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
      };
      
      const response = await updateUserProfile(updatedProfileData);
      
      if (response && response.success) {
        setUpdateSuccess(true);
        setEditing(false);
        
        // Update local form data to match what was saved
        setFormData(prevData => ({
          ...prevData,
          name: updatedProfileData.name,
          phone: updatedProfileData.phone,
          address: updatedProfileData.address,
        }));
        
        // Update local storage
        if (response.data) {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = { ...currentUser, ...updatedProfileData };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        throw new Error(response?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3">Loading your profile...</p>
      </div>
    );
  }

  if (authError) {
    return <Alert variant="danger">Error loading profile: {authError}</Alert>;
  }

  return (
    <div>
      <h4 className="mb-4 text-danger">Profile Information</h4>
      
      <Row>
        <Col lg={8}>
          {/* Profile Form */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Personal Details</h5>
                {!editing ? (
                  <Button variant="outline-danger" size="sm" onClick={() => setEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="me-2"
                      onClick={() => {
                        setEditing(false);
                        setUpdateError(null);
                        setUpdateSuccess(false);
                        // Reset form data
                        setFormData({
                          name: user?.name || '',
                          email: user?.email || '',
                          phone: user?.phone || '',
                          address: user?.address || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      type="submit" 
                      form="profileForm"
                      disabled={updateLoading}
                    >
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {updateSuccess && (
                <Alert variant="success" dismissible onClose={() => setUpdateSuccess(false)}>
                  Profile updated successfully!
                </Alert>
              )}
              
              {updateError && (
                <Alert variant="danger" dismissible onClose={() => setUpdateError(null)}>
                  {updateError}
                </Alert>
              )}

              <Form id="profileForm" onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!editing}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled={true}
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        Email cannot be changed for security reasons
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editing}
                        placeholder="Enter your phone number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Account Type</Form.Label>
                      <Form.Control
                        type="text"
                        value="Customer"
                        disabled={true}
                        className="bg-light"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Enter your complete address"
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Account Summary */}
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Account Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <h6 className="text-muted">Member Since</h6>
                <p className="mb-0">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              
              <div className="mb-4">
                <h6 className="text-muted">Account Status</h6>
                <span className="badge bg-success">Active</span>
              </div>

              <div className="mb-4">
                <h6 className="text-muted">User ID</h6>
                <p className="mb-0 small text-muted">#{user?._id?.substring(0, 8) || 'N/A'}</p>
              </div>
              
              <div>
                <h6 className="text-muted">Last Updated</h6>
                <p className="mb-0 small">{user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Never'}</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerProfileInfo;
