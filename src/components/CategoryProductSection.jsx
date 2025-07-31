import React from 'react';
import { Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsArrowRight, BsCart, BsHeart, BsStarFill } from 'react-icons/bs';
import './CategoryProductSection.css';

const CategoryProductSection = ({ 
  title, 
  icon, 
  products, 
  loading, 
  viewAllLink,
  handleAddToCart,
  handleToggleWishlist,
  wishlistItems = []
}) => {
  // If no products and not loading, don't render anything
  if (!loading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <div className="category-section mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          {icon && <span className="category-icon me-2">{icon}</span>}
          <h2 className="section-title mb-0">{title}</h2>
        </div>
        {viewAllLink && (
          <Link to={viewAllLink} className="view-all-link">
            View All <BsArrowRight className="ms-1" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading products...</p>
        </div>
      ) : (
        <Row className="g-4">
          {products && products.map((product) => (
            <Col key={product._id} xs={6} md={4} lg={3}>
              <Card className="product-card h-100 border-0 shadow-sm">
                <div className="product-img-wrapper">
                  <Link to={`/singleProduct/${product._id}`}>
                    <Card.Img 
                      variant="top" 
                      src={product.images && product.images[0] ? product.images[0] : "https://via.placeholder.com/300"}
                      alt={product.name}
                      className="product-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300?text=" + encodeURIComponent(product.name || "Product");
                      }}
                    />
                  </Link>
                  
                  {/* Quick action buttons */}
                  <div className="product-actions">
                    <Button 
                      variant="light" 
                      className="action-btn"
                      onClick={() => handleToggleWishlist && handleToggleWishlist(product._id)}
                      title="Add to wishlist"
                    >
                      <BsHeart className={wishlistItems.includes(product._id) ? "text-danger" : ""} />
                    </Button>
                    
                    <Button 
                      variant="primary" 
                      className="action-btn"
                      onClick={() => handleAddToCart && handleAddToCart(product)}
                      disabled={!product.countInStock || product.countInStock <= 0}
                      title="Add to cart"
                    >
                      <BsCart />
                    </Button>
                  </div>
                  
                  {/* Discount badge if applicable */}
                  {product.discount > 0 && (
                    <div className="discount-badge">
                      -{product.discount}%
                    </div>
                  )}
                </div>
                
                <Card.Body className="p-3">
                  <div className="mb-1">
                    <small className="text-muted text-uppercase category-tag">
                      {product.category || "General"}
                    </small>
                  </div>
                  
                  <Link to={`/singleProduct/${product._id}`} className="text-decoration-none">
                    <Card.Title className="product-title mb-1">
                      {product.name || product.title}
                    </Card.Title>
                  </Link>
                  
                  {/* Rating */}
                  <div className="mb-2 d-flex align-items-center">
                    {Array(5).fill().map((_, i) => (
                      <BsStarFill 
                        key={i} 
                        className={i < (product.rating || 4) ? "text-warning" : "text-muted"} 
                        size={14} 
                      />
                    ))}
                    <small className="ms-1 text-muted">({product.numReviews || 0})</small>
                  </div>
                  
                  {/* Price */}
                  <div className="d-flex align-items-center">
                    <span className="fw-bold text-primary me-2">
                      ${product.price}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-muted text-decoration-line-through small">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default CategoryProductSection;
