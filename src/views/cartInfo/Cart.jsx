import React, { useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner, Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { updateCartItem, removeFromCart, clearCart } from "../../helpers/apiHelpers";
import { useCart } from "../../context/CartContext";
import { BsCart3, BsTrash, BsPlusCircle, BsDashCircle, BsArrowLeft, BsCartX } from "react-icons/bs";
import "./Cart.css";

// const productCart = [
//   {
//     Tittle: "Jbl Go 3",
//     product_desc: "Wireless Upto 24 hours Battery",
//     price: 15000,
//     picture: "./Picture/image.png",
//   },
//   {
//     Tittle: "JSony Zw-12 pro",
//     product_desc: "Wireless, Bluetooth 5.0, Extra Battery",
//     price: 25000,
//     picture: "./Picture/image (1).png",
//   },
//   {
//     Tittle: "Kz Moon Drop Go 3",
//     product_desc: "Extreme Battery 25mm Dynamic Driver",
//     price: 8000,
//     picture: "./Picture/image (2).png",
//   },
// ];

const Cart = () => {
  const { cartItems: cart, loading, error, fetchCart } = useCart();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionProductId, setActionProductId] = useState(null);
  const navigate = useNavigate();
  // Update item quantity
  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) return;
    
    try {
      setActionLoading(true);
      setActionError(null);
      setActionProductId(productId);
      await updateCartItem(productId, newQuantity);
      
      // Refresh cart data
      await fetchCart();
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      setActionError("Failed to update quantity. Please try again.");
    } finally {
      setActionLoading(false);
      setActionProductId(null);
    }
  };

  // Remove item from cart
  const handleRemoveFromCart = async (productId) => {
    try {
      setActionLoading(true);
      setActionError(null);
      setActionProductId(productId);
      await removeFromCart(productId);
      
      // Refresh cart data
      await fetchCart();
    } catch (error) {
      console.error("Error removing item from cart:", error);
      setActionError("Failed to remove item. Please try again.");
    } finally {
      setActionLoading(false);
      setActionProductId(null);
    }
  };
  
  // Clear entire cart
  const handleClearCart = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      setActionProductId('all'); // Using 'all' to indicate clearing all items
      await clearCart();
      
      // Refresh cart data
      await fetchCart();
    } catch (error) {
      console.error("Error clearing cart:", error);
      setActionError("Failed to clear cart. Please try again.");
    } finally {
      setActionLoading(false);
      setActionProductId(null);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-page">
      <Container>
        <div className="cart-header">
          <h2 className="cart-title">Your Shopping Cart</h2>
          <p className="cart-subtitle">Review your items and proceed to checkout</p>
        </div>
        
        <Row>
          <Col lg={8} className="mb-4">
            <div className="cart-table">
              <Row className="cart-table-header m-0">
                <Col xs={6} md={4}>Product</Col>
                <Col xs={6} md={2}>Price</Col>
                <Col xs={6} md={3}>Quantity</Col>
                <Col xs={6} md={2}>Total</Col>
                <Col xs={6} md={1}>Action</Col>
              </Row>

              {actionError && <Alert variant="danger" className="mb-3">{actionError}</Alert>}
              {loading ? (
                <div className="cart-loading">
                  <Spinner animation="border" role="status" className="spinner">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <h5>Loading your cart...</h5>
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3">{error}</Alert>
              ) : cart.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">
                    <BsCartX />
                  </div>
                  <h3>Your cart is empty</h3>
                  <p>Looks like you haven't added anything to your cart yet.</p>
                  <Button 
                    className="continue-shopping-btn"
                    onClick={() => navigate('/product')}
                  >
                    <BsArrowLeft className="me-2" /> Continue Shopping
                  </Button>
                </div>
              ) : (
                cart.map((item) => (
                  <Row className="cart-item align-items-center m-0" key={item.productId}>
                    <Col xs={12} md={4} className="d-md-flex align-items-center" data-title="Product">
                      <Image
                        src={item?.image}
                        className="product-img"
                        alt={item.name}
                      />
                      <div className="product-details">
                        <div className="product-title">{item.name}</div>
                        {item.variant && <div className="product-variant">{item.variant}</div>}
                      </div>
                    </Col>
                    <Col xs={12} md={2} className="product-price-text" data-title="Price">
                      Rs {item.price.toLocaleString()}
                    </Col>
                    <Col xs={12} md={3} data-title="Quantity">
                      <div className="quantity-control">
                        <button 
                          className="quantity-btn"
                          type="button"
                          disabled={actionLoading || item.quantity <= 1}
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        >
                          <BsDashCircle />
                        </button>
                        <input
                          type="text"
                          className="quantity-input"
                          value={item.quantity}
                          readOnly
                        />
                        <button 
                          className="quantity-btn"
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        >
                          <BsPlusCircle />
                        </button>
                      </div>
                    </Col>
                    <Col xs={12} md={2} className="cart-total" data-title="Total">
                      Rs {(item.price * item.quantity).toLocaleString()}
                    </Col>
                    <Col xs={12} md={1} className="text-center" data-title="Action">
                      <Button 
                        className="remove-btn"
                        onClick={() => handleRemoveFromCart(item.productId)}
                        disabled={actionLoading && actionProductId === item.productId}
                      >
                        {actionLoading && actionProductId === item.productId ? 
                          <Spinner size="sm" animation="border" /> : 
                          <BsTrash />}
                      </Button>
                    </Col>
                  </Row>
                ))
              )}
            </div>
          </Col>
          
          <Col lg={4}>
            <div className="order-summary-card">
              <div className="order-summary-header">
                <h5 className="m-0"><BsCart3 className="me-2" />Order Summary</h5>
              </div>
              <div className="order-summary-body">
                <div className="summary-item">
                  <span>Subtotal ({quantity} items)</span>
                  <span>Rs {total.toLocaleString()}</span>
                </div>
                <div className="summary-item">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                
                <div className="coupon-section">
                  <input type="text" className="coupon-input" placeholder="Enter coupon code" />
                  <button className="apply-coupon-btn">Apply</button>
                </div>
                
                <div className="summary-total">
                  <span>Total</span>
                  <span>Rs {total.toLocaleString()}</span>
                </div>
                
                {cart.length > 0 && (
                  <div className="mt-4">
                    <Link to="/checkOutPage" className="checkout-btn d-block text-center text-decoration-none">
                      Proceed to Checkout
                    </Link>
                    <button 
                      className="continue-shopping-btn"
                      onClick={() => navigate('/product')}
                    >
                      Continue Shopping
                    </button>
                    <button 
                      className="clear-cart-btn"
                      onClick={handleClearCart}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Spinner size="sm" animation="border" className="me-2" /> : <BsTrash className="me-2" />}
                      Clear Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Cart;
