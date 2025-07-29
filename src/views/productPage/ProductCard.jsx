import React from 'react';
import { Card, Button, Badge, Spinner } from 'react-bootstrap';
import { BsHeart, BsHeartFill, BsCart, BsEye, BsStarFill, BsStarHalf, BsStar } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({
  product,
  handleAddToCart,
  handleBuyNow,
  handleToggleWishlist,
  wishlistItems,
  wishlistLoading,
  cartLoading,
  actionProductId,
}) => {
  const navigate = useNavigate();
  
  // Check if product exists to prevent errors
  if (!product) {
    return null; // Don't render anything if product is undefined
  }

  // Generate random rating for demo purposes (if not available)
  const rating = product.rating || Math.floor(Math.random() * 5) + 1;
  
  // Generate random discount percentage (10-40%)
  const discountPercent = Math.floor(Math.random() * 30) + 10;
  const originalPrice = Math.floor(product.price * (100 / (100 - discountPercent)));
  
  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<BsStarFill key={i} className="text-warning" />);
      } else if (i === fullStars + 1 && halfStar) {
        stars.push(<BsStarHalf key={i} className="text-warning" />);
      } else {
        stars.push(<BsStar key={i} className="text-warning" />);
      }
    }
    
    return stars;
  };

  return (
    <Card className="product-card h-100 border-0 shadow-hover">
      {/* Product Badge (New, Sale, etc) */}
      {Math.random() > 0.6 && (
        <div className="product-badge">
          <span>{Math.random() > 0.5 ? 'NEW' : 'HOT'}</span>
        </div>
      )}
      
      {/* Product Image Container */}
      <div className="product-img-container">
        <Card.Img 
          variant="top" 
          src={product.image || "https://via.placeholder.com/300"} 
          className="product-page-img"
          onClick={() => navigate(`/singleProduct/${product._id}`)}
        />
        
        {/* Quick Action Buttons */}
        <div className="product-actions">
          {/* Wishlist button */}
          <Button
            variant="light"
            className="action-btn wishlist-btn"
            onClick={() => handleToggleWishlist(product._id)}
            disabled={wishlistLoading && actionProductId === product._id}
            title={wishlistItems.includes(product._id) ? "Remove from wishlist" : "Add to wishlist"}
          >
            {wishlistLoading && actionProductId === product._id ? (
              <Spinner animation="border" size="sm" />
            ) : wishlistItems.includes(product._id) ? (
              <BsHeartFill className="text-danger" />
            ) : (
              <BsHeart />
            )}
          </Button>
          
          {/* Quick view button */}
          <Button
            variant="light"
            className="action-btn quickview-btn"
            onClick={() => navigate(`/singleProduct/${product._id}`)}
            title="Quick view"
          >
            <BsEye />
          </Button>
          
          {/* Add to cart button - only visible on hover */}
          <Button
            variant="primary"
            className="action-btn addcart-btn"
            onClick={() => handleAddToCart(product)}
            disabled={cartLoading || !product.stock || product.stock <= 0}
            title="Add to cart"
          >
            {cartLoading && actionProductId === product._id ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <BsCart />
            )}
          </Button>
        </div>
      </div>
      
      {/* Product Info */}
      <Card.Body className="p-3 d-flex flex-column">
        {/* Category Tag */}
        <div className="mb-2">
          <small className="text-muted text-uppercase category-tag">
            {product.category || "General"}
          </small>
        </div>
        
        {/* Product Title */}
        <Card.Title 
          className="product-title mb-1" 
          onClick={() => navigate(`/singleProduct/${product._id}`)}
        >
          {product.name || product.Tittle}
        </Card.Title>
        
        {/* Rating Stars */}
        <div className="mb-2 product-rating">
          {renderRatingStars(rating)}
          <small className="ms-1 text-muted">({product.numReviews || Math.floor(Math.random() * 100)})</small>
        </div>
        
        {/* Price */}
        <div className="price-container mt-auto mb-2">
          <span className="current-price">Rs. {product.price}</span>
          <span className="original-price">Rs. {originalPrice}</span>
          <span className="discount-percent">{discountPercent}% off</span>
        </div>
        
        {/* Stock Status */}
        <div className="stock-status mb-3">
          {product.stock > 0 ? (
            <Badge bg="success" pill className="stock-badge">
              In Stock
            </Badge>
          ) : (
            <Badge bg="danger" pill className="stock-badge">
              Out of Stock
            </Badge>
          )}
        </div>
        
        {/* Buy Now Button */}
        <Button
          variant="danger"
          className="buy-now-btn w-100"
          onClick={() => handleBuyNow(product)}
          disabled={!product.stock || product.stock <= 0}
        >
          Buy Now
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;
