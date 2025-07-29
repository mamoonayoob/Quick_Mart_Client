import React, { useState, useEffect } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Carousel, 
  Badge,
  Spinner,
  Toast,
  ToastContainer
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { BsArrowRight, BsCart, BsStarFill, BsHeart, BsCheckCircle } from "react-icons/bs";
import { useCart } from "../../context/CartContext";

// Import existing assets
import ExampleCarouselImage1 from "../../assets/Property 1=Group 4.png";
import img1 from "../../assets/Property 1=Group 10.png";
import img2 from "../../assets/Property 1=Group 12.png";
import img3 from "../../assets/Property 1=Group 6.png";
import img4 from "../../assets/Property 1=Group 8.png";
import banner1 from "../../assets/Property 1=Group 1.png";

// Import API helpers
import { getAllProducts } from "../../helpers/apiHelpers";

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState({});
  
  // Get cart context
  const { addToCart } = useCart();
  
  // Fetch featured products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getAllProducts();
        if (response && response.data) {
          // Get up to 8 products for featured section
          setFeaturedProducts(response.data.slice(0, 8));
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load featured products");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Handle adding product to cart
  const handleAddToCart = async (product) => {
    try {
      // Mark this product as being added to cart (for UI feedback)
      setAddingToCart(prev => ({ ...prev, [product._id]: true }));
      
      // Prepare cart data
      const cartData = {
        productId: product._id,
        quantity: 1,
        name: product.name,
        price: product.price,
        image: product.image
      };
      
      // Call the addToCart function from CartContext
      await addToCart(cartData);
      
      // Show success toast
      setToastMessage(`${product.name} added to cart!`);
      setShowToast(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setToastMessage('Failed to add item to cart. Please try again.');
      setShowToast(true);
    } finally {
      // Reset loading state for this product
      setAddingToCart(prev => ({ ...prev, [product._id]: false }));
    }
  };

  return (
    <div className="home-page">
      {/* Toast notification for cart actions */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1070 }}>
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={3000} 
          autohide 
          bg="success"
        >
          <Toast.Header closeButton>
            <BsCheckCircle className="me-2" />
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
      {/* Hero Carousel with Modern Design */}
      <div className="hero-section position-relative container-fluid h-auto mb-5">
        <Carousel className="hero-carousel">
          <Carousel.Item>
            <div className="position-relative">
              <img
                className="d-block w-100"
                src={ExampleCarouselImage1}
                alt="Summer Collection"
                style={{ maxHeight: "500px", objectFit: "cover" }}
              />
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center" 
                
                >
                <Container>
                  <div className="text-white ps-md-5" style={{ maxWidth: "600px" }}>
                    <Badge bg="danger" className="mb-2">New Arrivals</Badge>
                    <h1 className="display-4 fw-bold mb-3">Summer Collection 2025</h1>
                    <p className="lead mb-4">Discover the latest trends with up to 40% off on selected items.</p>
                    <Link to="/product">
                      <Button 
                        className="buy-now-btn px-4 py-2" 
                        size="lg"
                      >
                        Shop Now <BsArrowRight className="ms-2" />
                      </Button>
                    </Link>
                  </div>
                </Container>
              </div>
            </div>
          </Carousel.Item>
          
          <Carousel.Item>
            <div className="position-relative">
              <img
                className="d-block w-100"
                src={ExampleCarouselImage1}
                alt="Electronics Sale"
                style={{ maxHeight: "500px", objectFit: "cover" }}
              />
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center" 
                >
                <Container>
                  <div className="text-white ps-md-5" style={{ maxWidth: "600px" }}>
                    <Badge bg="warning" text="dark" className="mb-2">Limited Time</Badge>
                    <h1 className="display-4 fw-bold mb-3">Electronics Mega Sale</h1>
                    <p className="lead mb-4">Premium gadgets and accessories at unbeatable prices.</p>
                    <Link to="/product">
                      <Button 
                        className="buy-now-btn px-4 py-2" 
                        size="lg"
                      >
                        Explore Deals <BsArrowRight className="ms-2" />
                      </Button>
                    </Link>
                  </div>
                </Container>
              </div>
            </div>
          </Carousel.Item>
          
          <Carousel.Item>
            <div className="position-relative">
              <img
                className="d-block w-100"
                src={ExampleCarouselImage1}
                alt="Home Essentials"
                style={{ maxHeight: "500px", objectFit: "cover" }}
              />
              <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center" 
                >
                <Container>
                  <div className="text-white ps-md-5" style={{ maxWidth: "600px" }}>
                    <Badge bg="success" className="mb-2">Best Sellers</Badge>
                    <h1 className="display-4 fw-bold mb-3">Home Essentials</h1>
                    <p className="lead mb-4">Transform your space with our curated collection of home products.</p>
                    <Link to="/product">
                      <Button variant="success" size="lg" className="rounded-pill px-4">
                        Shop Collection <BsArrowRight className="ms-2" />
                      </Button>
                    </Link>
                  </div>
                </Container>
              </div>
            </div>
          </Carousel.Item>
        </Carousel>
      </div>

      {/* Category Highlights */}
      <Container  className="mb-5">
        <h2 className="fw-bold mb-4 text-center">Shop by Category</h2>
        <Row>
          <Col md={3} sm={6} className="mb-4">
            <Card className="category-card h-100 border-0 shadow-sm">
              <Card.Img variant="top" src={img1} className="category-img" />
              <Card.Body className="text-center">
                <Card.Title className="fw-bold">Electronics</Card.Title>
                <Link to="/product" className="text-decoration-none">
                  <Button variant="outline-dark" size="sm" className="mt-2 rounded-pill">
                    Browse
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-4">
            <Card className="category-card h-100 border-0 shadow-sm">
              <Card.Img variant="top" src={img2} className="category-img" />
              <Card.Body className="text-center">
                <Card.Title className="fw-bold">Fashion</Card.Title>
                <Link to="/product" className="text-decoration-none">
                  <Button variant="outline-dark" size="sm" className="mt-2 rounded-pill">
                    Browse
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-4">
            <Card className="category-card h-100 border-0 shadow-sm">
              <Card.Img variant="top" src={img3} className="category-img" />
              <Card.Body className="text-center">
                <Card.Title className="fw-bold">Home & Kitchen</Card.Title>
                <Link to="/product" className="text-decoration-none">
                  <Button variant="outline-dark" size="sm" className="mt-2 rounded-pill">
                    Browse
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} className="mb-4">
            <Card className="category-card h-100 border-0 shadow-sm">
              <Card.Img variant="top" src={img4} className="category-img" />
              <Card.Body className="text-center">
                <Card.Title className="fw-bold">Beauty</Card.Title>
                <Link to="/product" className="text-decoration-none">
                  <Button variant="outline-dark" size="sm" className="mt-2 rounded-pill">
                    Browse
                  </Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Featured Banner */}
      <Container   className="px-0 mb-5">
        <div className="position-relative">
          <img 
            src={banner1} 
            alt="Special Offer" 
            className="w-100" 
            style={{ maxHeight: "300px", objectFit: "cover" }}
          />
          <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center"
            style={{ background: "rgba(0,0,0,0.4)" }}>
            <Container>
              <div className="text-white text-center">
                <h2 className="display-5 fw-bold mb-3">Special Offer</h2>
                <p className="lead mb-4">Get 20% off on your first purchase with code: QUICKMART20</p>
                <Link to="/product">
                  <Button variant="light" size="lg" className="rounded-pill px-4">
                    Shop Now
                  </Button>
                </Link>
              </div>
            </Container>
          </div>
        </div>
      </Container>

      {/* Featured Products Section */}
      <Container className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Featured Products</h2>
          <Link to="/product" className="text-decoration-none">
            <Button variant="outline-primary" className="rounded-pill">
              View All <BsArrowRight className="ms-1" />
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading featured products...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <Row>
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                  <Card className="h-100 product-card shadow-sm">
                    <div className="position-relative">
                      <Card.Img 
                        variant="top" 
                        src={product.image || img1} 
                        style={{ height: "200px", objectFit: "cover" }} 
                      />
                      <div className="position-absolute top-0 end-0 p-2">
                        <Button 
                          variant="light" 
                          size="sm" 
                          className="rounded-circle p-2 shadow-sm"
                        >
                          <BsHeart />
                        </Button>
                      </div>
                      {product.countInStock <= 0 && (
                        <div className="position-absolute top-0 start-0 m-2">
                          <Badge bg="danger">Out of Stock</Badge>
                        </div>
                      )}
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <Card.Title className="h6 text-truncate">{product.name}</Card.Title>
                      <div className="mb-2">
                        {Array(5).fill().map((_, i) => (
                          <BsStarFill key={i} className={i < (product.rating || 4) ? "text-warning" : "text-muted"} />
                        ))}
                        <small className="ms-1 text-muted">({product.numReviews || 0})</small>
                      </div>
                      <Card.Text className="text-primary fw-bold mb-3">
                        ${product.price}
                      </Card.Text>
                      <div className="mt-auto d-flex gap-2">
                        <Button 
                          className=" flex-grow-1 buy-now-btn"
                          disabled={product.countInStock <= 0 || addingToCart[product._id]}
                          onClick={() => handleAddToCart(product)}
                        >
                          {addingToCart[product._id] ? (
                            <>
                              <Spinner size="sm" animation="border" className="me-1" /> Adding...
                            </>
                          ) : (
                            <>
                              <BsCart className="me-1" /> Add to Cart
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <div className="text-center py-5">
                  <p>No featured products available.</p>
                </div>
              </Col>
            )}
          </Row>
        )}
      </Container>
      
      {/* Newsletter Subscription */}
      <Container  className="bg-light py-5 mb-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} className="text-center">
              <h2 className="fw-bold mb-3">Subscribe to Our Newsletter</h2>
              <p className="text-muted mb-4">Stay updated with the latest products, exclusive offers and discounts.</p>
              <div className="d-flex">
                <input 
                  type="email" 
                  className="form-control form-control-lg" 
                  placeholder="Enter your email address"
                />
                <Button variant="primary" size="lg" className="ms-2">
                  Subscribe
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </Container>

      {/* Custom CSS for animations and hover effects */}
      <style jsx>{`
        .product-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
        .category-img {
          transition: transform 0.5s ease;
          height: 180px;
          object-fit: cover;
        }
        .category-card:hover .category-img {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}

export default Home;
