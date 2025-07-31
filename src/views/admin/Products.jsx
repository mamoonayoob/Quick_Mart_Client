import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Badge, 
  Form, 
  Modal, 
  Row, 
  Col,
  InputGroup,
  Spinner,
  Alert
} from 'react-bootstrap';
import { 
  BsSearch, 
  BsFilter, 
  BsEye, 
  BsPencil, 
  BsTrash,
  BsPlus,
  BsBox,
  BsCart3,
  BsCurrencyDollar
} from 'react-icons/bs';
import DataTable from 'react-data-table-component';
import { adminApi } from '../../services/api';

const Products = () => {
  // State for products data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for pagination
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // State for modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // view, add, edit
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'electronics',
    stock: 0,
    image: '',
    rating: 0
  });
  
  // Mock data for initial development
  // Using useMemo to avoid dependency array issues in useEffect
  const mockProducts = useMemo(() => [
    {
      _id: 'P001',
      name: 'iPhone 13 Pro',
      description: 'Latest iPhone with A15 Bionic chip',
      price: 999,
      category: 'smartphones',
      stock: 50,
      image: 'https://via.placeholder.com/150',
      rating: 4.8,
      createdAt: '2025-01-15',
      updatedAt: '2025-06-20'
    },
    {
      _id: 'P002',
      name: 'Samsung Galaxy S22',
      description: 'Flagship Android smartphone',
      price: 899,
      category: 'smartphones',
      stock: 45,
      image: 'https://via.placeholder.com/150',
      rating: 4.7,
      createdAt: '2025-02-10',
      updatedAt: '2025-06-18'
    },
    {
      _id: 'P003',
      name: 'MacBook Pro 14"',
      description: 'Powerful laptop with M2 chip',
      price: 1999,
      category: 'electronics',
      stock: 20,
      image: 'https://via.placeholder.com/150',
      rating: 4.9,
      createdAt: '2025-03-05',
      updatedAt: '2025-06-15'
    },
    {
      _id: 'P004',
      name: 'AirPods Pro',
      description: 'Wireless earbuds with noise cancellation',
      price: 249,
      category: 'audio',
      stock: 100,
      image: 'https://via.placeholder.com/150',
      rating: 4.6,
      createdAt: '2025-04-20',
      updatedAt: '2025-06-10'
    },
    {
      _id: 'P005',
      name: 'iPad Air',
      description: '10.9-inch tablet with A14 Bionic chip',
      price: 599,
      category: 'electronics',
      stock: 35,
      image: 'https://via.placeholder.com/150',
      rating: 4.5,
      createdAt: '2025-05-12',
      updatedAt: '2025-06-05'
    }
  ], []);
  
  // Categories for filter dropdown
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'smartphones', name: 'Smartphones' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'audio', name: 'Audio' },
    { id: 'wearables', name: 'Wearables' },
    { id: 'cameras', name: 'Cameras' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'home', name: 'Home & Kitchen' },
    { id: 'tools', name: 'Tools' }
  ];
  
  // Function to fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare query parameters
      const params = { 
        page: currentPage, 
        limit: perPage, 
        search: searchTerm || undefined, 
        category: filterCategory !== 'all' ? filterCategory : undefined 
      };
      
      // Call API
      const response = await adminApi.getProducts(params);
      setProducts(response.data.data);
      setTotalRows(response.data.totalCount);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Using mock data instead.');
      
      // Filter mock data based on search and category
      let filteredProducts = [...mockProducts];
      
      // Apply search filter
      if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply category filter
      if (filterCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
          product.category === filterCategory
        );
      }
      
      setProducts(filteredProducts);
      setTotalRows(filteredProducts.length);
      setLoading(false);
    }
  }, [currentPage, perPage, searchTerm, filterCategory, mockProducts]);
  
  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  // Handle product modal open
  const handleProductModalOpen = (product, mode) => {
    setSelectedProduct(product);
    setModalMode(mode);
    
    if (mode === 'add') {
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: 'electronics',
        stock: 0,
        image: 'https://via.placeholder.com/150',
        rating: 0
      });
    } else if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        image: product.image,
        rating: product.rating
      });
    }
    
    setShowProductModal(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirmation = (productId) => {
    setProductToDelete({ _id: productId });
    setShowDeleteModal(true);
  };
  
  // Handle product form submit
  const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Try to use the API
      try {
        if (modalMode === 'add') {
          await adminApi.createProduct(formData);
        } else {
          await adminApi.updateProduct(selectedProduct._id, formData);
        }
        
        // Refresh product list after successful API call
        const params = { 
          page: currentPage, 
          limit: perPage, 
          search: searchTerm || undefined, 
          category: filterCategory !== 'all' ? filterCategory : undefined 
        };
        const response = await adminApi.getProducts(params);
        setProducts(response.data.products);
        setTotalRows(response.data.totalCount);
      } catch (apiError) {
        console.warn('API call failed, updating UI only:', apiError);
        
        // Fallback to local state update if API fails
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        if (modalMode === 'add') {
          const newProduct = {
            _id: `temp-${Date.now()}`,
            ...formData,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          };
          
          setProducts(prevProducts => [newProduct, ...prevProducts]);
        } else {
          setProducts(prevProducts => 
            prevProducts.map(product => 
              product._id === selectedProduct._id 
                ? { ...product, ...formData, updatedAt: new Date().toISOString().split('T')[0] }
                : product
            )
          );
        }
      }
      
      // Close modal
      setShowProductModal(false);
      setLoading(false);
    } catch (err) {
      console.error('Error submitting product form:', err);
      setError('Failed to submit product form. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to use the API
      try {
        await adminApi.deleteProduct(productToDelete._id);
        
        // Refresh product list after successful API call
        const params = { 
          page: currentPage, 
          limit: perPage, 
          search: searchTerm || undefined, 
          category: filterCategory !== 'all' ? filterCategory : undefined 
        };
        const response = await adminApi.getProducts(params);
        setProducts(response.data.products);
        setTotalRows(response.data.totalCount);
      } catch (apiError) {
        console.warn('API call failed, updating UI only:', apiError);
        
        // Fallback to local state update if API fails
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local state
        setProducts(prevProducts => 
          prevProducts.filter(product => product._id !== productToDelete._id)
        );
      }
      
      // Close modal
      setShowDeleteModal(false);
      setProductToDelete(null);
      setLoading(false);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle pagination change
  const handlePageChange = page => {
    setCurrentPage(page);
  };

  // Handle per page change
  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
  };
  
  return (
    <div className="admin-products">
      <div className="page-header mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="page-title">Products Management</h1>
          <p className="text-muted">Manage your product inventory</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => handleProductModalOpen(null, 'add')}
          className="d-flex align-items-center"
        >
          <BsPlus className="me-1" size={15} />
          Add Product
        </Button>
      </div>
      
      {/* Product Stats Cards */}
      <Row className="mb-4">
        <Col md={4} className='mb-4'>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="stats-icon bg-primary text-white rounded-circle p-3">
                  <BsBox size={24} />
                </div>
              </div>
              <h6 className="text-muted">Total Products</h6>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3>{totalRows || mockProducts.length}</h3>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className='mb-4'>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="stats-icon bg-success text-white rounded-circle p-3">
                  <BsCart3 size={24} />
                </div>
              </div>
              <h6 className="text-muted">In Stock Products</h6>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3>{mockProducts.filter(p => p.stock > 0).length}</h3>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className='mb-4'>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="stats-icon bg-warning text-white rounded-circle p-3">
                  <BsCurrencyDollar size={24} />
                </div>
              </div>
              <h6 className="text-muted">Average Price</h6>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <h3>
                  ${(mockProducts.reduce((sum, product) => sum + product.price, 0) / 
                    (mockProducts.length || 1)).toFixed(2)}
                </h3>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Search and Filter Bar */}
      <Card className="admin-card mb-4">
        <Card.Body>
          <Row>
            <Col md={6} lg={4}>
              <InputGroup className="mb-3 mb-md-0">
                <InputGroup.Text>
                  <BsSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            
            <Col md={6} lg={3}>
              <InputGroup>
                <InputGroup.Text>
                  <BsFilter />
                </InputGroup.Text>
                <Form.Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Products Table */}
      <Card className="admin-card">
        <Card.Body>
          <DataTable
            title="Products Management"
            columns={[
              {
                name: 'Product',
                selector: row => row.name,
                sortable: true,
                cell: row => (
                  <div className="d-flex align-items-center">
                    <img 
                      src={row.image} 
                      alt={row.name}
                      width="40"
                      height="40"
                      className="me-2 rounded"
                    />
                    <div>
                      <div className="fw-bold">{row.name}</div>
                      <div className="small text-muted">{row.category}</div>
                    </div>
                  </div>
                )
              },
              {
                name: 'Price',
                selector: row => row.price,
                sortable: true,
                format: row => `$${row.price.toFixed(2)}`,
                right: true
              },
              {
                name: 'Stock',
                selector: row => row.stock,
                sortable: true,
                right: true
              },
              {
                name: 'Rating',
                selector: row => row.rating,
                sortable: true,
                right: true,
                cell: row => (
                  <div className="d-flex align-items-center">
                    <span className="me-2">{row.rating}</span>
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(row.rating) ? 'text-warning' : 'text-muted'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )
              },
              {
                name: 'Actions',
                cell: row => (
                  <div className="d-flex">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="action-icon"
                      onClick={() => handleProductModalOpen(row, 'view')}
                    >
                      <BsEye />
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      className="action-icon"
                      onClick={() => handleProductModalOpen(row, 'edit')}
                    >
                      <BsPencil />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="action-icon"
                      onClick={() => handleDeleteConfirmation(row._id)}
                    >
                      <BsTrash />
                    </Button>
                  </div>
                )
              }
            ]}
            data={products}
            pagination
            paginationServer
            progressPending={loading}
            paginationTotalRows={totalRows}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handlePerRowsChange}
          />
        </Card.Body>
      </Card>

    {/* Product Modal */}
    <Modal
      show={showProductModal}
      onHide={() => setShowProductModal(false)}
      size="lg"
      centered
    >
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'view' ? 'Product Details' : 
             modalMode === 'edit' ? 'Edit Product' : 'Add New Product'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalMode === 'view' && selectedProduct ? (
            <div className="product-details">
              <Row>
                <Col md={4}>
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    className="img-fluid rounded mb-3"
                  />
                </Col>
                <Col md={8}>
                  <h4>{selectedProduct.name}</h4>
                  <p className="text-muted">{selectedProduct.description}</p>
                  
                  <Row className="mb-3">
                    <Col xs={6}>
                      <strong>Price:</strong> ${selectedProduct.price.toFixed(2)}
                    </Col>
                    <Col xs={6}>
                      <strong>Category:</strong> 
                      <Badge bg="info" className="ms-1 text-capitalize">
                        {selectedProduct.category}
                      </Badge>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col xs={6}>
                      <strong>Stock:</strong> {selectedProduct.stock}
                    </Col>
                    <Col xs={6}>
                      <strong>Rating:</strong> {selectedProduct.rating}/5
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col xs={6}>
                      <strong>Created:</strong> {selectedProduct.createdAt}
                    </Col>
                    <Col xs={6}>
                      <strong>Updated:</strong> {selectedProduct.updatedAt}
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>
          ) : (
            <Form onSubmit={handleProductFormSubmit}>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter product name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.slice(1).map(category => (
                        <option 
                          key={category.id} 
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  placeholder="Enter product description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </Form.Group>
              
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price ($)</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Stock</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="0" 
                      placeholder="0" 
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Rating</Form.Label>
                    <Form.Control 
                      type="number" 
                      min="0" 
                      max="5" 
                      step="0.1" 
                      placeholder="0.0" 
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Image URL</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Enter image URL" 
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  required
                />
              </Form.Group>
              
              <div className="mt-3">
                {error && <Alert variant="danger">{error}</Alert>}
              </div>
              
              <Modal.Footer className="px-0 pb-0">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowProductModal(false)}
                >
                  Cancel
                </Button>
                
                <Button 
                  variant="primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Saving...
                    </>
                  ) : (
                    'Save Product'
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Modal.Body>
        {modalMode === 'view' && (
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowProductModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this product? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="danger"
            onClick={handleDeleteProduct}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              'Delete Product'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Products;
