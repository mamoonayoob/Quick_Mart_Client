import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../../helpers/apiHelpers';
import { BsTrash, BsCartPlus } from 'react-icons/bs';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionItemId, setActionItemId] = useState(null);

  // Fetch wishlist data
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWishlist();
      console.log(response);
      if (response && response.success && response.data) {
        setWishlistItems(response.data);
      } else {
        setWishlistItems([]);
        console.error("Unexpected wishlist data format", response);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setError("Failed to load your wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load wishlist on component mount
  useEffect(() => {
    fetchWishlist();
  }, []);

  // Remove item from wishlist
  const handleRemoveFromWishlist = async (productId) => {
    try {
      setActionLoading(true);
      setActionItemId(productId);
      await removeFromWishlist(productId);
      
      // Update local state
      setWishlistItems(prevItems => prevItems.filter(item => 
        item._id !== productId
      ));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      setError("Failed to remove item from wishlist. Please try again.");
    } finally {
      setActionLoading(false);
      setActionItemId(null);
    }
  };

  // Add to cart
  const handleAddToCart = async (productId) => {
    try {
      setActionLoading(true);
      setActionItemId(productId);
      
      // This would be replaced with an actual API call to add to cart
      // await addToCart(productId, 1);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message or redirect to cart
      alert("Item added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError("Failed to add item to cart. Please try again.");
    } finally {
      setActionLoading(false);
      setActionItemId(null);
    }
  };

  return (
    <Container className="py-5">
      <h2 className="mb-4 text-danger">My Wishlist</h2>
      
      {error && (
        <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-3">Loading your wishlist...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <img 
              src="/loginpic/empty-wishlist.png" 
              alt="Empty Wishlist" 
              style={{ maxWidth: '200px', opacity: 0.7 }}
            />
          </div>
          <h4 className="text-muted mb-4">Your wishlist is empty</h4>
          <p className="text-muted mb-4">
            Browse our products and add items to your wishlist to save them for later.
          </p>
          <Link to="/product" className="btn btn-danger">
            Browse Products
          </Link>
        </div>
      ) : (
        <Row>
          {wishlistItems.map(item => (
            <Col key={item._id} lg={3} md={4} sm={6} className="mb-4">
              <Card className="h-100 shadow-sm product-card">
                <div className="position-relative">
                  <Link to={`/singleProduct/${item._id}`}>
                    <Card.Img 
                      variant="top" 
                      src={item.image 
                        ? item.image
                        : "/loginpic/placeholder.png"
                      } 
                      alt={item.name}
                      className="product-image"
                    />
                  </Link>
                  <Button
                    variant="light"
                    size="sm"
                    className="position-absolute top-0 end-0 m-2 rounded-circle p-2"
                    onClick={() => handleRemoveFromWishlist(item._id)}
                    disabled={actionLoading && actionItemId === item._id}
                  >
                    {actionLoading && actionItemId === item._id ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <BsTrash className="text-danger" />
                    )}
                  </Button>
                </div>
                
                <Card.Body className="d-flex flex-column">
                  <Link 
                    to={`/singleProduct/${item._id}`} 
                    className="text-decoration-none text-dark"
                  >
                    <Card.Title className="h6">{item.name}</Card.Title>
                  </Link>
                  
                  <Card.Text className="text-danger fw-bold mb-2">
                    Rs {item.price.toFixed(2)}
                  </Card.Text>
                  
                  <Card.Text className="small text-muted mb-3">
                    {item.isAvailable ? (
                      <span className="text-success">In Stock</span>
                    ) : (
                      <span className="text-danger">Out of Stock</span>
                    )}
                  </Card.Text>
                  
                  <Button
                    variant="outline-danger"
                    className="mt-auto w-100"
                    onClick={() => handleAddToCart(item._id)}
                    disabled={(actionLoading && actionItemId === item._id) || !item.isAvailable}
                  >
                    {actionLoading && actionItemId === item._id ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>
                        <BsCartPlus className="me-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Wishlist;
