import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Alert, 
  Spinner 
} from 'react-bootstrap';
import { vendorApi } from '../../services/api';
import ImageUploader from '../../components/ImageUploader';

const TestIntegration = () => {
  // State for image upload testing
  const [uploadedImage, setUploadedImage] = useState('');
  const [uploadedSubImages, setUploadedSubImages] = useState([]);
  
  // State for delivery API testing
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [deliveryError, setDeliveryError] = useState(null);
  const [deliverySuccess, setDeliverySuccess] = useState(null);

  // Handle main image upload
  const handleMainImageUploaded = (imageUrl) => {
    setUploadedImage(imageUrl);
  };

  // Handle sub image upload
  const handleSubImageUploaded = (imageUrl) => {
    setUploadedSubImages(prev => [...prev, imageUrl]);
  };

  // Handle remove sub image
  const handleRemoveSubImage = (indexToRemove) => {
    setUploadedSubImages(prev => 
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // Fetch delivery data
  const fetchDeliveryData = async () => {
    setLoadingDeliveries(true);
    setDeliveryError(null);
    setDeliverySuccess(null);
    
    try {
      // Get real data from API
      const [ordersResponse, personnelResponse] = await Promise.all([
        vendorApi.getPendingDeliveries(),
        vendorApi.getDeliveryPersonnel()
      ]);
      
      // Process orders data
      if (ordersResponse.data && ordersResponse.data.success) {
        setPendingDeliveries(ordersResponse.data.orders || []);
      } else {
        throw new Error(ordersResponse.data?.message || 'Failed to fetch pending deliveries');
      }
      
      // Process personnel data
      if (personnelResponse.data && personnelResponse.data.success) {
        setDeliveryPersonnel(personnelResponse.data.personnel || []);
      } else {
        throw new Error(personnelResponse.data?.message || 'Failed to fetch delivery personnel');
      }
      
      setDeliverySuccess('Successfully fetched delivery data from API');
    } catch (err) {
      console.error('Error fetching delivery data:', err);
      setDeliveryError('Failed to load delivery data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoadingDeliveries(false);
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Integration Test Page</h2>
      
      {/* Image Upload Testing */}
      <Card className="mb-4">
        <Card.Header>
          <h4>Image Upload Testing</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h5>Main Image Upload</h5>
              <ImageUploader 
                onImageUploaded={handleMainImageUploaded}
                isMainImage={true}
                buttonLabel="Upload Main Image"
                className="mb-3"
              />
              
              {uploadedImage ? (
                <div className="mt-3">
                  <h6>Uploaded Image:</h6>
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded main" 
                    className="img-fluid rounded" 
                    style={{ maxHeight: '200px' }} 
                  />
                  <p className="mt-2">
                    <small className="text-muted">Image URL: {uploadedImage}</small>
                  </p>
                </div>
              ) : (
                <Alert variant="info">No main image uploaded yet</Alert>
              )}
            </Col>
            
            <Col md={6}>
              <h5>Additional Images Upload</h5>
              <ImageUploader 
                onImageUploaded={handleSubImageUploaded}
                isMainImage={false}
                buttonLabel="Upload Additional Image"
                className="mb-3"
              />
              
              {uploadedSubImages.length > 0 ? (
                <div className="mt-3">
                  <h6>Uploaded Sub Images:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {uploadedSubImages.map((img, index) => (
                      <div key={index} className="position-relative">
                        <img 
                          src={img} 
                          alt={`Sub ${index + 1}`} 
                          className="img-thumbnail" 
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                        />
                        <Button 
                          variant="danger" 
                          size="sm" 
                          className="position-absolute top-0 end-0 p-0" 
                          style={{ width: '20px', height: '20px', fontSize: '10px' }}
                          onClick={() => handleRemoveSubImage(index)}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert variant="info">No additional images uploaded yet</Alert>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Delivery API Testing */}
      <Card>
        <Card.Header>
          <h4>Delivery API Testing</h4>
        </Card.Header>
        <Card.Body>
          <Button 
            variant="primary" 
            onClick={fetchDeliveryData}
            disabled={loadingDeliveries}
            className="mb-3"
          >
            {loadingDeliveries ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Fetching Data...
              </>
            ) : (
              'Test Delivery APIs'
            )}
          </Button>
          
          {deliverySuccess && (
            <Alert variant="success" className="mb-3">
              {deliverySuccess}
            </Alert>
          )}
          
          {deliveryError && (
            <Alert variant="danger" className="mb-3">
              {deliveryError}
            </Alert>
          )}
          
          {pendingDeliveries.length > 0 && (
            <div className="mb-4">
              <h5>Pending Deliveries ({pendingDeliveries.length})</h5>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeliveries.map(order => (
                      <tr key={order._id}>
                        <td>{order._id}</td>
                        <td>{order.customer?.name}</td>
                        <td>${order.totalAmount?.toFixed(2)}</td>
                        <td>{order.status}</td>
                        <td>{order.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {deliveryPersonnel.length > 0 && (
            <div>
              <h5>Delivery Personnel ({deliveryPersonnel.length})</h5>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryPersonnel.map(person => (
                      <tr key={person._id}>
                        <td>{person._id}</td>
                        <td>{person.name}</td>
                        <td>{person.status}</td>
                        <td>{person.rating}</td>
                        <td>{person.completedDeliveries}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TestIntegration;
