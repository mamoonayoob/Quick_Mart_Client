import React, { useEffect, useState, useCallback } from "react";
import { 
  Row, 
  Col, 
  Button, 
  Spinner, 
  Container, 
  Form, 
  InputGroup, 
  Toast, 
  Dropdown,
  Badge,
  Card
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BsSearch, BsFilter, BsGrid3X3, BsListUl, BsSliders } from "react-icons/bs";
import img from "../../assets/image.png"; // Use dynamic image later
import { getAllProducts, addToCart, getWishlist, addToWishlist, removeFromWishlist } from "../../helpers/apiHelpers";
import ProductCard from "./ProductCard";
import "./Product.css";

function Product() {
  const [products, setProducts] = useState([]);
  const [priceFilter, setPriceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [actionProductId, setActionProductId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list view
  const [sortBy, setSortBy] = useState("featured"); // sorting option
  
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const getProducts = async () => {
    setLoading(true);
    try {
      // Request a larger number of products (up to 100) to show all products
      const response = await getAllProducts({
        limit: 100, // Get up to 100 products instead of default 10
        page: 1
      });
      
      console.log("Products fetched:", response);
      const productData = response.data || [];
      console.log("Total products found:", productData.length);
      
      setProducts(productData);
      
      // Extract unique categories from products
      const uniqueCategories = [...new Set(productData
        .map(product => product.category || product.description)
        .filter(category => category))];
      
      setCategories(uniqueCategories);
      setError(null);
    } catch (error) {
      console.error("Error fetching products:", error.message);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    // Check if user is authenticated before adding to cart
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/product" } });
      return;
    }
    
    // Check if product is in stock
    if (!product.stock || product.stock <= 0) {
      setToastMessage("Sorry, this product is out of stock");
      setShowToast(true);
      return;
    }
    
    setCartLoading(true);
    setActionProductId(product._id);
    try {
      // Using our apiHelpers with the token already in interceptors
      await addToCart({
        productId: product._id,
        quantity: 1
      });
      
      setToastMessage("Added to cart successfully!");
      setShowToast(true);
    } catch (err) {
      console.error("Error adding to cart:", err);
      if (err.response?.status === 401) {
        setToastMessage("Your session has expired. Please login again.");
        setShowToast(true);
        navigate("/login");
      } else {
        setToastMessage("Failed to add to cart. Please try again.");
        setShowToast(true);
      }
    } finally {
      setCartLoading(false);
      setActionProductId(null);
    }
  };
  
  const handleBuyNow = (product) => {
    // Check if user is authenticated before proceeding to buy
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/singleProduct/${product._id}` } });
      return;
    }
    
    // Navigate to single product page
    navigate(`/singleProduct/${product._id}`);
  };

  // Apply all filters to products
  const filteredProducts = products.filter((product) => {
    // Price filter
    const matchPrice =
      priceFilter === "" || Number(product.price) <= Number(priceFilter);

    // Category filter
    const matchCategory =
      categoryFilter === "" ||
      (product?.category?.toLowerCase().includes(categoryFilter.toLowerCase())) ||
      (product?.description?.toLowerCase().includes(categoryFilter.toLowerCase()));
    
    // Search query filter
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = query === "" || 
      (product?.name?.toLowerCase().includes(query)) ||
      (product?.Tittle?.toLowerCase().includes(query)) ||
      (product?.description?.toLowerCase().includes(query)) ||
      (product?.product_desc?.toLowerCase().includes(query));

    return matchPrice && matchCategory && matchSearch;
  });
  
  // Sort products based on selected sort option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") {
      return a.price - b.price;
    } else if (sortBy === "price-high") {
      return b.price - a.price;
    } else if (sortBy === "newest") {
      return new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now());
    } else {
      // Default: featured or any other option
      return 0; // Keep original order
    }
  });

  // Fetch wishlist items
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await getWishlist();
      if (response && response.success && response.data) {
        // Extract product IDs from wishlist items
        const wishlistProductIds = response.data.map(item => item.product._id);
        setWishlistItems(wishlistProductIds);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  }, [isAuthenticated]);

  // Handle add to wishlist
  const handleToggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/product" } });
      return;
    }
    
    setWishlistLoading(true);
    setActionProductId(productId);
    
    try {
      if (wishlistItems.includes(productId)) {
        // Remove from wishlist
        await removeFromWishlist(productId);
        setWishlistItems(prev => prev.filter(id => id !== productId));
        setToastMessage("Removed from wishlist!");
      } else {
        // Add to wishlist
        await addToWishlist({ productId });
        setWishlistItems(prev => [...prev, productId]);
        setToastMessage("Added to wishlist!");
      }
      setShowToast(true);
    } catch (error) {
      console.error("Error updating wishlist:", error);
      setToastMessage("Failed to update wishlist");
      setShowToast(true);
    } finally {
      setWishlistLoading(false);
      setActionProductId(null);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);
  
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <div className="product-page">
      {/* Toast notification */}
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)} 
        delay={30000} 
        autohide
        className="notification-toast"
      >
        <Toast.Header>
          <strong className="me-auto">QuickMart</strong>
        </Toast.Header>
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>

      {/* Page Header */}
      <div className="page-header">
        <Container>
          <h2 className="fw-bold mb-3">Explore Our Products</h2>
          <Row>
            <Col md={8}>
              <div className="input-group mb-3">
                <Form.Control 
                  type="text" 
                  placeholder="Search for products..." 
                  className="search-input py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  variant="primary" 
                  className="search-button"
                  onClick={() => getProducts()}
                >
                  <BsSearch /> Search
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      
      <Container>
        <Row>
          {/* Sidebar Filters */}
          <Col lg={3} className="filters-sidebar">
            <div className="search-filters">
              <div className="filter-heading">
                <BsFilter className="me-2" /> Filters
              </div>
              
              {/* Price Range Filter */}
              <div className="filter-group">
                <div className="filter-label">Price Range</div>
                <div className="price-range-slider">
                  <Form.Label>Max Price: Rs. {priceFilter}</Form.Label>
                  <Form.Range 
                    min="100"
                    max="10000"
                    step="100"
                    value={priceFilter || "100000"}
                    onChange={(e) => setPriceFilter(e.target.value)}
                  />
                  <div className="d-flex justify-content-between">
                    <small>Rs. 100</small>
                    <small>Rs. 100,000</small>
                  </div>
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="filter-group">
                <div className="filter-label">Categories</div>
                <Form>
                  <Form.Check
                    type="radio"
                    id="category-all"
                    label="All Categories"
                    name="category"
                    checked={categoryFilter === ""}
                    onChange={() => setCategoryFilter("")}
                    className="category-item"
                  />
                  {categories.map((category, index) => (
                    <Form.Check
                      key={index}
                      type="radio"
                      id={`category-${index}`}
                      label={
                        <div className="d-flex w-100 justify-content-between gap-2">
                          {category.toUpperCase()} 
                          <span className="count">
                            {filteredProducts.filter(p => 
                              p.category === category || p.description === category
                            ).length}
                          </span>
                        </div>
                      }
                      name="category"
                      checked={categoryFilter === category}
                      onChange={() => setCategoryFilter(category)}
                      className="category-item"
                    />
                  ))}
                </Form>
              </div>
              
              {/* Sort Options */}
              <div className="filter-group">
                <div className="filter-label">Sort By</div>
                <Form.Select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-select-sm"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </Form.Select>
              </div>
              
              {/* Action Banner */}
              <div className="action-banner mt-4">
                <h3>New Arrivals!</h3>
                <p>Check out our latest products</p>
                <Button className="action-button">Shop Now</Button>
              </div>
            </div>
          </Col>

          {/* Products Grid */}
          <Col lg={9}>
            {loading ? (
              <div className="loading-container">
                <Spinner animation="border" variant="primary" className="loading-spinner" />
                <p>Loading products...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <>
                {/* Products Toolbar */}
                <div className="products-toolbar mb-4">
                  <div className="products-count">
                    Showing {sortedProducts.length} products
                  </div>
                  
                  <div className="d-flex align-items-center">
                    <div className="sort-dropdown me-3">
                      <Dropdown>
                        <Dropdown.Toggle variant="light" id="dropdown-sort">
                          Sort: {sortBy.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => setSortBy("featured")}>Featured</Dropdown.Item>
                          <Dropdown.Item onClick={() => setSortBy("price-low")}>Price: Low to High</Dropdown.Item>
                          <Dropdown.Item onClick={() => setSortBy("price-high")}>Price: High to Low</Dropdown.Item>
                          <Dropdown.Item onClick={() => setSortBy("newest")}>Newest First</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    
                    <div className="view-options">
                      <Button 
                        variant={viewMode === "grid" ? "primary" : "light"} 
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        title="Grid View"
                      >
                        <BsGrid3X3 />
                      </Button>
                      <Button 
                        variant={viewMode === "list" ? "primary" : "light"} 
                        size="sm"
                        onClick={() => setViewMode("list")}
                        title="List View"
                      >
                        <BsListUl />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Products List */}
                <Row className="products-grid">
                  {sortedProducts.length > 0 ? (
                    sortedProducts.map((product) => (
                      <Col 
                        key={product._id} 
                        xs={12} 
                        md={viewMode === "list" ? 12 : 6} 
                        lg={viewMode === "list" ? 12 : 4} 
                        className="mb-4"
                      >
                        <ProductCard
                          product={product}
                          handleAddToCart={handleAddToCart}
                          handleBuyNow={handleBuyNow}
                          handleToggleWishlist={handleToggleWishlist}
                          wishlistItems={wishlistItems}
                          wishlistLoading={wishlistLoading}
                          cartLoading={cartLoading}
                          actionProductId={actionProductId}
                        />
                      </Col>
                    ))
                  ) : (
                    <Col xs={12}>
                      <div className="no-products">
                        <h3>No products found</h3>
                        <p>Try adjusting your filters or search criteria</p>
                        <Button 
                          variant="primary" 
                          onClick={() => {
                            setSearchQuery("");
                            setPriceFilter("50000");
                            setCategoryFilter("");
                            getProducts();
                          }}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </Col>
                  )}
                </Row>
              </>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Product;
