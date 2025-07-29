import React from 'react';
import { Carousel, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './HeroSection.css';

// Import existing assets (assuming these exist in your project)
import heroImage1 from '../assets/Property 1=Group 4.png';
import heroImage2 from '../assets/Property 1=Group 10.png';
import heroImage3 from '../assets/Property 1=Group 12.png';

const HeroSection = () => {
  const heroSlides = [
    {
      image: heroImage1,
      title: "Summer Collection 2025",
      subtitle: "New Arrivals",
      description: "Discover the latest trends and styles for the summer season",
      buttonText: "Shop Now",
      buttonLink: "/product?category=clothing",
      align: "left"
    },
    {
      image: heroImage2,
      title: "Tech Gadgets",
      subtitle: "Latest Electronics",
      description: "Explore cutting-edge technology and smart devices",
      buttonText: "Discover More",
      buttonLink: "/product?category=electronics",
      align: "center"
    },
    {
      image: heroImage3,
      title: "Home Essentials",
      subtitle: "Special Offers",
      description: "Transform your living space with our exclusive collection",
      buttonText: "View Collection",
      buttonLink: "/product?category=home",
      align: "right"
    }
  ];

  return (
    <div className="hero-section mb-5">
      <Carousel fade interval={5000} className="hero-carousel">
        {heroSlides.map((slide, index) => (
          <Carousel.Item key={index}>
            <div className="hero-slide-container">
              <img
                className="d-block w-100 hero-image"
                src={slide.image}
                alt={slide.title}
              />
              <Container>
                <div className={`hero-content text-${slide.align}`}>
                  <div className="hero-text-container">
                    <h5 className="hero-subtitle">{slide.subtitle}</h5>
                    <h1 className="hero-title">{slide.title}</h1>
                    <p className="hero-description">{slide.description}</p>
                    <Button 
                      as={Link} 
                      to={slide.buttonLink} 
                      variant="primary" 
                      size="lg" 
                      className="hero-button"
                    >
                      {slide.buttonText}
                    </Button>
                  </div>
                </div>
              </Container>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
      
      <div className="hero-features">
        <Container>
          <div className="features-container">
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-truck"></i>
              </div>
              <div className="feature-text">
                <h5>Free Shipping</h5>
                <p>On all orders over $50</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-arrow-repeat"></i>
              </div>
              <div className="feature-text">
                <h5>Easy Returns</h5>
                <p>30-day return policy</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-shield-check"></i>
              </div>
              <div className="feature-text">
                <h5>Secure Payment</h5>
                <p>100% secure checkout</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-headset"></i>
              </div>
              <div className="feature-text">
                <h5>24/7 Support</h5>
                <p>Dedicated customer service</p>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default HeroSection;
