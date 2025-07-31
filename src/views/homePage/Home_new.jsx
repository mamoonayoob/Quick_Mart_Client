import React, { useState, useEffect } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Spinner
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { BsArrowRight } from "react-icons/bs";

// Import API helpers
import { getAllProducts } from "../../helpers/apiHelpers";

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch featured products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getAllProducts();
        if (response && response.data) {
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

  return (
    <div className="home-page">
      {/* Simple Hero Section */}
      <div className="hero-section bg-light py-5 mb-4">
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 className="display-4 fw-bold">Welcome to QuickMart</h1>
              <p className="lead">Discover amazing products at great prices</p>
              <Button as={Link} to="/product" variant="primary" size="lg">
                Shop Now
              </Button>
            </Col>
            <Col md={6} className="text-center">
              <img 
                src="https://via.placeholder.com/600x400" 
                alt="Hero" 
                className="img-fluid rounded" 
              />
            </Col>
          </Row>
        </Container>
      </div>
      
      {/* Featured Products */}
      <Container className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title">Featured Products</h2>
          <Link to="/product" className="view-all-link">
            View All <BsArrowRight className="ms-1" />
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading products...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <Row className="g-4">
            {featuredProducts.map((product) => (
              <Col key={product._id} xs={6} md={4} lg={3}>
                <Card className="h-100 shadow-sm">
                  <Link to={`/singleProduct/${product._id}`}>
                    <Card.Img 
                      variant="top" 
                      src={product.images && product.images[0] ? product.images[0] : "https://via.placeholder.com/300"}
                      alt={product.name}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  </Link>
                  <Card.Body>
                    <Card.Title className="h6">{product.name}</Card.Title>
                    <Card.Text className="text-primary fw-bold">
                      ${product.price}
                    </Card.Text>
                    <Button variant="outline-primary" size="sm">
                      Add to Cart
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}

export default Home;
