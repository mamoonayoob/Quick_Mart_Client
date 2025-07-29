import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Image, Button, Spinner, Alert, Breadcrumb, Tabs, Tab, Table, Card } from "react-bootstrap";
import { useSelector } from "react-redux";
import InnerImageZoom from 'react-inner-image-zoom';
import 'react-inner-image-zoom/lib/styles.min.css';
import { 
  BsCartPlus, BsHeart, BsHeartFill, BsStarFill, 
  BsDash, BsPlus, BsArrowRight, BsCheckCircleFill,
  BsTruck, BsShieldCheck, BsArrowReturnLeft
} from "react-icons/bs";
import "./SingleProduct.css";
import { useToast } from "../../components/ToastNotification";
import { useCart } from "../../context/CartContext";

// API helpers
import { getProductById, addToWishlist, removeFromWishlist, getAllProducts } from "../../helpers/apiHelpers";

// Sample images (replace with actual image imports)
import mainImage from "../../assets/image.png";
import thumb1 from "../../assets/Card.png";
import thumb2 from "../../assets/Frame 7 (1).png";
import thumb3 from "../../assets/Frame 7.png";

function SingleProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshCart, addToCart } = useCart(); // Get cart context functions
  
  // Product states
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  // Product options
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [stockWarning, setStockWarning] = useState(false);
  
  // Image gallery
  const [selectedImg, setSelectedImg] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [zoomPosition, setZoomPosition] = useState('right');
  
  // UI states
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  
  // Auth state
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Define fetchProductData inside useEffect to avoid dependency issues
  useEffect(() => {
    // Check authentication status when component mounts
    if (!isAuthenticated) {
      toast.info("Please login to view product details");
      navigate("/login", { state: { from: `/singleProduct/${id}` } });
      return;
    }
    
    // Define fetchProductData inside useEffect
    const fetchProductData = async () => {
      setLoading(true);
      try {
        // Fetch main product details
        const response = await getProductById(id);
        const productData = response.data;
        console.log("Product data:", productData);
        setProduct(productData);
        // Set up image gallery
        setSelectedImg(productData.image);

        
        // Set up thumbnails
        const productImages = productData.supportImages && productData.supportImages.length > 0
          && productData.supportImages || [];
        
        setThumbnails(productImages);
        
        // Set default color and size if available
        if (productData.colors && productData.colors.length > 0) {
          setColor(productData.colors[0]);
        }
        
        if (productData.sizes && productData.sizes.length > 0) {
          setSize(productData.sizes[0]);
        }
        
        // Check if product is in wishlist
        setInWishlist(false);
        
        // Fetch related products (same category)
        if (productData.category) {
          const allProducts = await getAllProducts();
          if (allProducts && allProducts.data) {
            const related = allProducts.data
              .filter(p => p.category === productData.category && p._id !== id)
              .slice(0, 4);
            setRelatedProducts(related);
          }
        }
        
        setError(null);
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setError("Failed to load product details. Please try again.");
        toast.error("Failed to load product details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductData();
    
    // Handle window resize for zoom position
    const handleResize = () => {
      setZoomPosition(window.innerWidth <= 768 ? 'over' : 'right');
    };
    
    // Set initial zoom position based on screen size
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [id, isAuthenticated, navigate]);
  
  // Handle wishlist toggle
  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.info("Please login to manage your wishlist");
      navigate("/login", { state: { from: `/singleProduct/${id}` } });
      return;
    }
    
    setWishlistLoading(true);
    
    try {
      if (inWishlist) {
        await removeFromWishlist(id);
        setInWishlist(false);
        toast.info(`${product.name} removed from your wishlist`);
      } else {
        await addToWishlist(id);
        setInWishlist(true);
        toast.success(`${product.name} added to your wishlist`);
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
      toast.error("Failed to update wishlist. Please try again.");
    } finally {
      setWishlistLoading(false);
    }
  };
  
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info("Please login to add items to your cart");
      navigate("/login", { state: { from: `/singleProduct/${id}` } });
      return;
    }
    
    if (!product.stock || product.stock <= 0) {
      toast.warning("Sorry, this product is out of stock");
      return;
    }
    
    // Check if quantity is valid
    if (quantity > product.stock) {
      toast.warning(`Sorry, only ${product.stock} items available in stock`);
      setQuantity(product.stock);
      return;
    }
    
    setCartLoading(true);
    try {
      // Use the CartContext's addToCart function
      // This ensures the cart state is updated immediately after adding
      await addToCart({
        productId: product._id,
        quantity: parseInt(quantity),
        color: color || undefined,
        size: size || undefined
      });
      
      toast.success(`${product.name} added to your cart!`);
      
      // Force refresh cart data to update UI
      refreshCart();
    } catch (err) {
      console.error("Error adding to cart:", err);
      if (err.response?.status === 401) {
        toast.error("Your session has expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Failed to add to cart. Please try again.");
      }
    } finally {
      setCartLoading(false);
    }
  };
  
  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.info("Please login to purchase items");
      navigate("/login", { state: { from: `/singleProduct/${id}` } });
      return;
    }
    
    if (!product.stock || product.stock <= 0) {
      toast.warning("Sorry, this product is out of stock");
      return;
    }
    
    setBuyNowLoading(true);
    try {
      // First add to cart using context function
      await addToCart({
        productId: product._id,
        quantity: parseInt(quantity),
        color: color || undefined,
        size: size || undefined
      });
      
      // Force refresh cart before navigating
      await refreshCart();
      
      // Then navigate to checkout
      navigate('/checkOutPage');
    } catch (err) {
      console.error("Error processing buy now:", err);
      if (err.response?.status === 401) {
        toast.error("Your session has expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Failed to process your request. Please try again.");
      }
    } finally {
      setBuyNowLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="text-center my-5 py-5">
        <div className="animate-fade-in">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading product details...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center my-5">
        <Alert variant="danger" className="animate-fade-in">
          <Alert.Heading>Oops! Something went wrong</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="text-center my-5">
        <div className="animate-fade-in">
          <h3 className="mb-4">Product Not Found</h3>
          <p className="text-muted">The product you're looking for doesn't exist or has been removed.</p>
          <Button variant="primary" as={Link} to="/">Continue Shopping</Button>
        </div>
      </Container>
    );
  }

  return (
    <div className="single-product-container">
      <Container>
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="product-breadcrumb animate-fade-in">
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Home</Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/products" }}>Products</Breadcrumb.Item>
          {product.category && (
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/category/${product.category}` }}>
              {product.category}
            </Breadcrumb.Item>
          )}
          <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
        </Breadcrumb>
        
        <Row className="justify-content-between">
          {/* Left Column - Product Image & Thumbnails */}
          <Col md={12} lg={6} className="product-gallery animate-fade-in">
            <div className="main-image-container mb-3">
              <InnerImageZoom
                src={selectedImg}
                zoomSrc={selectedImg}
                zoomType="hover"
                zoomPreload={true}
                // zoomScale={0.9}
                moveType="pan"
                hideHint={false}
                zoomPosition={zoomPosition}
                className="product-main-image"
              />
            </div>
            
            <div className="thumbnails-container">
              {thumbnails?.map((img, index) => (
                <Image
                  key={index}
                  src={img}
                  className={`thumbnail ${selectedImg === img ? 'active' : ''}`}
                  onClick={() => setSelectedImg(img)}
                  alt={`${product.name} - Thumbnail ${index + 1}`}
                />
              ))}
            </div>
          </Col>
          
          {/* Right Column - Product Info */}
          <Col md={12} lg={6} className="product-info animate-fade-in">
            <h1 className="product-title">{product.name}</h1>
            
            {product.category && (
              <p className="product-category">{product.category}</p>
            )}
            
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                {[...Array(5)].map((_, i) => (
                  <BsStarFill 
                    key={i} 
                    className={i < (product.rating || 4) ? "text-warning" : "text-muted"}
                  />
                ))}
              </div>
              <span className="text-muted">({product.numReviews || 24} reviews)</span>
            </div>
            
            <h2 className="product-price">
              ${product.price?.toFixed(2) || "0.00"}
              {product.oldPrice && (
                <small className="text-muted text-decoration-line-through ms-2">
                  ${product.oldPrice.toFixed(2)}
                </small>
              )}
            </h2>
            
            <div className="product-description mb-4">
              <p>{product.description || "No description available for this product."}</p>
            </div>
            
            <div className="stock-status mb-3">
              {product.stock > 0 ? (
                <span className="in-stock">
                  <BsCheckCircleFill className="me-1" /> In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="out-of-stock">
                  Out of Stock
                </span>
              )}
            </div>
            
            <div className="product-options">
              {/* Color Options */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-3">
                  <p className="option-label">Color:</p>
                  <div className="color-options">
                    {product.colors.map((colorOption, index) => (
                      <div 
                        key={index}
                        className={`color-option ${color === colorOption ? 'active' : ''}`}
                        style={{ backgroundColor: colorOption }}
                        onClick={() => setColor(colorOption)}
                        title={colorOption}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Size Options */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-3">
                  <p className="option-label">Size:</p>
                  <div className="size-options">
                    {product.sizes.map((sizeOption, index) => (
                      <div 
                        key={index}
                        className={`size-option ${size === sizeOption ? 'active' : ''}`}
                        onClick={() => setSize(sizeOption)}
                      >
                        {sizeOption}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quantity Control */}
              <div className="mb-4">
                <p className="option-label">Quantity:</p>
                <div className="quantity-control">
                  <div 
                    className="quantity-btn" 
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  >
                    <BsDash />
                  </div>
                  <input 
                    type="number" 
                    className="quantity-input" 
                    value={quantity} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0 && val <= (product.stock || 10)) {
                        setQuantity(val);
                      }
                    }}
                    min="1"
                    max={product.stock || 10}
                  />
                  <div 
                    className="quantity-btn"
                    onClick={() => quantity < (product.stock || 10) && setQuantity(quantity + 1)}
                  >
                    <BsPlus />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="product-actions-btn">
              <Button 
                className="add-to-cart-btn" 
                onClick={handleAddToCart}
                disabled={cartLoading || !product.stock || product.stock <= 0}
              >
                {cartLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <BsCartPlus size={20} />
                    <span>Add to Cart</span>
                  </>
                )}
              </Button>
              
              <Button 
                className="buy-now-btn"
                onClick={handleBuyNow}
                disabled={buyNowLoading || !product.stock || product.stock <= 0}
              >
                {buyNowLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <BsArrowRight size={20} />
                    <span>Buy Now</span>
                  </>
                )}
              </Button>
              
              <Button 
                variant={inWishlist ? "danger" : "outline-danger"}
                className="wishlist-btn"
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
              >
                {wishlistLoading ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : inWishlist ? (
                  <BsHeartFill size={20} />
                ) : (
                  <BsHeart size={20} />
                )}
              </Button>
            </div>
            
            <div className="product-meta mt-4">
              <div className="d-flex align-items-center mb-2">
                <BsTruck className="me-2 text-muted" size={18} />
                <span>Free shipping for orders over $50</span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <BsShieldCheck className="me-2 text-muted" size={18} />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="d-flex align-items-center">
                <BsArrowReturnLeft className="me-2 text-muted" size={18} />
                <span>Easy returns & exchanges</span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      
      {/* Product Details Tabs */}
      <Container className="product-tabs animate-fade-in mt-5">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
          fill
        >
          <Tab eventKey="description" title="Description">
            <div className="tab-content">
              <h4>Product Description</h4>
              <p>{product.description || "No detailed description available for this product."}</p>
              
              {product.features && product.features.length > 0 && (
                <>
                  <h5 className="mt-4">Key Features</h5>
                  <ul>
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </Tab>
          
          <Tab eventKey="specifications" title="Specifications">
            <div className="tab-content">
              <h4>Product Specifications</h4>
              <Table striped bordered hover>
                <tbody>
                  <tr>
                    <td>Brand</td>
                    <td>{product.brand || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td>Model</td>
                    <td>{product.model || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td>Dimensions</td>
                    <td>{product.dimensions || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td>Weight</td>
                    <td>{product.weight || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td>Material</td>
                    <td>{product.material || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td>Country of Origin</td>
                    <td>{product.origin || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td>Warranty</td>
                    <td>{product.warranty || "Standard manufacturer warranty"}</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </Tab>
          
          <Tab eventKey="reviews" title="Reviews">
            <div className="tab-content">
              <h4>Customer Reviews</h4>
              {/* This would typically be populated from API data */}
              <div className="review-summary d-flex align-items-center mb-4">
                <div className="me-4">
                  <h2 className="mb-0">{product.rating || 4.5}</h2>
                  <div>
                    {[...Array(5)].map((_, i) => (
                      <BsStarFill 
                        key={i} 
                        className={i < Math.floor(product.rating || 4) ? "text-warning" : "text-muted"}
                      />
                    ))}
                  </div>
                  <p className="text-muted mb-0">{product.numReviews || 24} reviews</p>
                </div>
                <div className="flex-grow-1">
                  {/* Rating distribution bars would go here */}
                  <div className="d-flex align-items-center mb-1">
                    <span className="me-2">5 ★</span>
                    <div className="progress flex-grow-1" style={{ height: '8px' }}>
                      <div className="progress-bar bg-success" style={{ width: '70%' }}></div>
                    </div>
                    <span className="ms-2">70%</span>
                  </div>
                  <div className="d-flex align-items-center mb-1">
                    <span className="me-2">4 ★</span>
                    <div className="progress flex-grow-1" style={{ height: '8px' }}>
                      <div className="progress-bar bg-success" style={{ width: '20%' }}></div>
                    </div>
                    <span className="ms-2">20%</span>
                  </div>
                  <div className="d-flex align-items-center mb-1">
                    <span className="me-2">3 ★</span>
                    <div className="progress flex-grow-1" style={{ height: '8px' }}>
                      <div className="progress-bar bg-warning" style={{ width: '5%' }}></div>
                    </div>
                    <span className="ms-2">5%</span>
                  </div>
                  <div className="d-flex align-items-center mb-1">
                    <span className="me-2">2 ★</span>
                    <div className="progress flex-grow-1" style={{ height: '8px' }}>
                      <div className="progress-bar bg-danger" style={{ width: '3%' }}></div>
                    </div>
                    <span className="ms-2">3%</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="me-2">1 ★</span>
                    <div className="progress flex-grow-1" style={{ height: '8px' }}>
                      <div className="progress-bar bg-danger" style={{ width: '2%' }}></div>
                    </div>
                    <span className="ms-2">2%</span>
                  </div>
                </div>
              </div>
              
              {/* Sample reviews */}
              <Card className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <h5>John Doe</h5>
                    <small className="text-muted">2 days ago</small>
                  </div>
                  <div>
                    {[...Array(5)].map((_, i) => (
                      <BsStarFill 
                        key={i} 
                        className={i < 5 ? "text-warning" : "text-muted"}
                        size={14}
                      />
                    ))}
                  </div>
                  <p className="mt-2">Great product! Exactly what I was looking for. The quality is excellent and it arrived earlier than expected.</p>
                </Card.Body>
              </Card>
              
              <Card className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <h5>Jane Smith</h5>
                    <small className="text-muted">1 week ago</small>
                  </div>
                  <div>
                    {[...Array(5)].map((_, i) => (
                      <BsStarFill 
                        key={i} 
                        className={i < 4 ? "text-warning" : "text-muted"}
                        size={14}
                      />
                    ))}
                  </div>
                  <p className="mt-2">Very good product. The only reason I'm not giving 5 stars is because the color is slightly different from what's shown in the pictures.</p>
                </Card.Body>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </Container>
      
      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <Container className="related-products animate-fade-in">
          <h3 className="section-title">Related Products</h3>
          <Row>
            {relatedProducts.map((relatedProduct) => (
              <Col key={relatedProduct._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <Card className="h-100 product-card">
                  <Link to={`/singleProduct/${relatedProduct._id}`}>
                    <Card.Img 
                      variant="top" 
                      src={relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images[0] : mainImage} 
                      alt={relatedProduct.name}
                    />
                  </Link>
                  <Card.Body>
                    <Card.Title as="h5">{relatedProduct.name}</Card.Title>
                    <div className="d-flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <BsStarFill 
                          key={i} 
                          className={i < (relatedProduct.rating || 4) ? "text-warning" : "text-muted"}
                          size={12}
                        />
                      ))}
                      <small className="text-muted ms-1">({relatedProduct.numReviews || 0})</small>
                    </div>
                    <Card.Text as="h6" className="product-price">
                      ${relatedProduct.price?.toFixed(2) || "0.00"}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      )}
    </div>
  );
}

export default SingleProduct;
