import React, { useState, useEffect } from 'react';
import ImageUploader from '../../components/ImageUploader';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Badge, 
  Form,
  Spinner,
  Alert,
  Modal,
  InputGroup
} from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { 
  BsPlus, 
  BsPencil, 
  BsTrash, 
  BsEye, 
  BsSearch,
  BsExclamationTriangle,
  BsBoxSeam,
  BsCurrencyDollar,
  BsGraphUp,
  BsExclamationCircle,
  BsArrowUp,
  BsArrowDown
} from 'react-icons/bs';
import { vendorApi } from '../../services/api'; // Use vendor API
import './VendorProducts.css'; // Import custom styling
import '../admin/AdminLayout.css'; // Import admin CSS for beautiful stats cards

const VendorProducts = () => {
  // State for products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Pagination state
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  
  // State for product stats
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalValue: 0,
    avgPrice: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // State for product modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // State for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    mainImage: '',
    subImages: []
  });
  
  // State for image upload
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Mock products data for this vendor
  const mockProducts = [
    {
      _id: 'P1',
      name: 'iPhone 13',
      price: 999,
      stock: 24,
      sold: 42,
      image: 'https://via.placeholder.com/50',
      category: 'Smartphones',
      status: 'Active'
    },
    {
      _id: 'P2',
      name: 'AirPods Pro',
      price: 249,
      stock: 36,
      sold: 38,
      image: 'https://via.placeholder.com/50',
      category: 'Audio',
      status: 'Active'
    },
    {
      _id: 'P3',
      name: 'MacBook Pro',
      price: 1999,
      stock: 12,
      sold: 15,
      image: 'https://via.placeholder.com/50',
      category: 'Laptops',
      status: 'Active'
    },
    {
      _id: 'P4',
      name: 'iPad Air',
      price: 599,
      stock: 18,
      sold: 22,
      image: 'https://via.placeholder.com/50',
      category: 'Tablets',
      status: 'Active'
    },
    {
      _id: 'P5',
      name: 'Apple Watch Series 7',
      price: 399,
      stock: 15,
      sold: 19,
      image: 'https://via.placeholder.com/50',
      category: 'Wearables',
      status: 'Active'
    },
    {
      _id: 'P6',
      name: 'Samsung Galaxy S22',
      price: 899,
      stock: 20,
      sold: 28,
      image: 'https://via.placeholder.com/50',
      category: 'Smartphones',
      status: 'Active'
    },
    {
      _id: 'P7',
      name: 'Sony WH-1000XM4',
      price: 349,
      stock: 10,
      sold: 32,
      image: 'https://via.placeholder.com/50',
      category: 'Audio',
      status: 'Low Stock'
    },
    {
      _id: 'P8',
      name: 'Dell XPS 13',
      price: 1299,
      stock: 8,
      sold: 12,
      image: 'https://via.placeholder.com/50',
      category: 'Laptops',
      status: 'Low Stock'
    },
    {
      _id: 'P9',
      name: 'Samsung Galaxy Tab S7',
      price: 649,
      stock: 0,
      sold: 16,
      image: 'https://via.placeholder.com/50',
      category: 'Tablets',
      status: 'Out of Stock'
    },
    {
      _id: 'P10',
      name: 'Fitbit Versa 3',
      price: 229,
      stock: 5,
      sold: 24,
      image: 'https://via.placeholder.com/50',
      category: 'Wearables',
      status: 'Low Stock'
    }
  ];

  // Mock categories
  const categories = [
    'Smartphones',
    'Audio',
    'Laptops',
    'Tablets',
    'Wearables'
  ];

  // Function to calculate product stats from products data
  const calculateProductStats = (productsData) => {
    if (!Array.isArray(productsData)) {
      return {
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalValue: 0,
        avgPrice: 0
      };
    }
    
    const activeProducts = productsData.filter(p => p.status === 'Active' || p.isAvailable).length;
    const lowStockProducts = productsData.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStockProducts = productsData.filter(p => p.stock === 0).length;
    
    const totalValue = productsData.reduce((sum, product) => sum + (product.price * product.stock), 0);
    const avgPrice = totalRows > 0 ? productsData.reduce((sum, product) => sum + product.price, 0) / productsData.length : 0;
    
    return {
      totalProducts: totalRows, // Use the total from pagination response
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      avgPrice
    };
  };

  // Fetch products and calculate stats
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setStatsLoading(true);
      setError(null);
      
      try {
        console.log('Vendor Products: Fetching real-time data from API...');
        console.log(`Fetching page ${currentPage} with ${perPage} items per page`);
        
        // Fetch products from API with pagination params
        const response = await vendorApi.getProducts({
          page: currentPage,
          limit: perPage,
          search: searchTerm,
          category: filterCategory || undefined
        });
        
        // Log the full response to debug pagination issues
        console.log('Full API response:', response);
        
        const responseData = response.data;
        
        // Check if we have the expected pagination structure
        if (!responseData.pagination) {
          console.warn('Response does not contain pagination info:', responseData);
        }
        
        // Extract products data, handling different response formats
        const productsData = responseData.data || responseData.products || [];
        
        console.log('Vendor Products: Fetched products:', productsData);
        console.log('Total products in response:', productsData.length);
        
        if (Array.isArray(productsData)) {
          setProducts(productsData);
          
          // Set pagination data, with fallbacks for different API response formats
          const total = responseData.total || responseData.pagination?.total || productsData.length;
          const totalPages = responseData.pagination?.totalPages || 
                            Math.ceil(total / perPage) || 
                            1;
                            
          setTotalRows(total);
          setTotalPages(totalPages);
          
          // Calculate and set product stats
          const stats = calculateProductStats(productsData);
          setProductStats(stats);
          
          console.log('Pagination info:', {
            currentPage,
            totalPages,
            totalItems: total,
            itemsPerPage: perPage
          });
        } else {
          console.warn('Products data is not an array:', productsData);
          setProducts([]);
          setTotalRows(0);
          setTotalPages(1);
          setProductStats(calculateProductStats([]));
        }
        
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
        
        // Fallback to mock data for development
        console.log('Using mock products data');
        setProducts(mockProducts);
        setTotalRows(mockProducts.length);
        setTotalPages(Math.ceil(mockProducts.length / perPage));
        
        // Calculate stats from mock data
        const mockStats = calculateProductStats(mockProducts);
        setProductStats(mockStats);
        console.log('Vendor Products: Mock stats calculated:', mockStats);
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };
    
    fetchProducts();
  }, [currentPage, perPage, searchTerm, filterCategory]);

  // Handle delete confirmation
  const handleDeleteConfirm = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setDeleting(true);
    
    try {
      console.log('Deleting product:', productToDelete._id);
      
      // Call the vendor API to delete product
      const response = await vendorApi.deleteProduct(productToDelete._id);
      
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        // Handle pagination change
        const handlePageChange = (page) => {
          console.log('Changing to page:', page);
          setCurrentPage(page);
        };
        
        // Handle rows per page change
        const handlePerRowsChange = (newPerPage, page) => {
          console.log('Changing rows per page:', newPerPage, 'Page:', page);
          setPerPage(newPerPage);
          setCurrentPage(page);
        };
        
        // Remove product from state
        const updatedProducts = products.filter(p => p._id !== productToDelete._id);
        setProducts(updatedProducts);
        
        // Recalculate stats after deletion
        const updatedStats = calculateProductStats(updatedProducts);
        setProductStats(updatedStats);
        
        console.log('Product deleted successfully. Updated stats:', updatedStats);
        
        // Close modal and reset state
        setShowDeleteModal(false);
        setProductToDelete(null);
        
        // Show success message
        alert('Product deleted successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      
      // Show error message
      alert('Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Handle view product
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };
  
  // Handle edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category,
      mainImage: product.mainImage || product.image || '', // Support both new and old format
      subImages: product.subImages || []
    });
    setShowEditModal(true);
  };
  
  // Handle image upload
  const handleImageUpload = async (event, isMainImage = true) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('image', file);
      
      // Call the vendor API to upload the image
      const response = await vendorApi.uploadProductImage(formData);
      
      if (response.data.success) {
        const imageUrl = response.data.url;
        
        if (isMainImage) {
          // Set as main image
          setFormData(prev => ({
            ...prev,
            mainImage: imageUrl
          }));
        } else {
          // Add to sub images
          setFormData(prev => ({
            ...prev,
            subImages: [...prev.subImages, imageUrl]
          }));
        }
      } else {
        throw new Error(response.data.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  // Handle remove sub image
  const handleRemoveSubImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      subImages: prev.subImages.filter((_, index) => index !== indexToRemove)
    }));
  };
  
  // Handle add product
  const handleAddProduct = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      mainImage: '',
      subImages: []
    });
    setShowAddModal(true);
  };
  
  // Handle search input change with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle save product (add or edit)
  const handleSaveProduct = async () => {
    setSaving(true);
    
    try {
      // Prepare product data with main image and sub-images
      const productData = {
        ...formData,
        // For backward compatibility, keep image field but use mainImage as the primary
        image: formData.mainImage
      };
      
      if (selectedProduct) {
        // Edit existing product
        const response = await vendorApi.updateProduct(selectedProduct._id, productData);
        
        if (response.data.success) {
          // Update product in the list
          const updatedProducts = products.map(product => {
            if (product._id === selectedProduct._id) {
              return { 
                ...product, 
                ...productData,
                // Ensure the UI shows the updated images
                image: productData.mainImage, 
                mainImage: productData.mainImage,
                subImages: productData.subImages
              };
            }
            return product;
          });
          
          setProducts(updatedProducts);
          setShowEditModal(false);
          // Could show success message here
        } else {
          throw new Error(response.data.message || 'Failed to update product');
        }
      } else {
        // Add new product
        const response = await vendorApi.addProduct(productData);
        
        if (response.data.success) {
          // Add new product to the list with proper image structure
          const newProduct = {
            ...response.data.product,
            mainImage: productData.mainImage,
            subImages: productData.subImages
          };
          
          // Instead of just adding to the current products array,
          // refresh the product list to ensure pagination works correctly
          setShowAddModal(false);
          setCurrentPage(1); // Reset to first page to see the new product
          setTotalRows(prevTotal => prevTotal + 1); // Update total count
          
          // Refresh products from the server
          fetchProducts();
          // Could show success message here
        } else {
          throw new Error(response.data.message || 'Failed to add product');
        }
      }
    } catch (err) {
      console.error('Error saving product:', err);
      // Could show error message here
    } finally {
      setSaving(false);
    }
  };
  
  // Helper function to get badge variant based on status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Low Stock':
        return 'warning';
      case 'Out of Stock':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // DataTable columns
  const columns = [
    {
      name: 'Product',
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="d-flex align-items-center">
          {(row.mainImage || row.image) && (
            <img 
              src={row.mainImage || row.image} 
              alt={row.name} 
              style={{ width: '40px', height: '40px', marginRight: '10px', objectFit: 'cover' }} 
            />
          )}
          <div>
            <div>{row.name}</div>
            <small className="text-muted">{row.category}</small>
          </div>
        </div>
      ),
    },
    {
      name: 'Price',
      selector: row => row.price,
      sortable: true,
      format: row => `$${row.price.toFixed(2)}`,
    },
    {
      name: 'Stock',
      selector: row => row.stock,
      sortable: true,
    },
    {
      name: 'Sold',
      selector: row => row.sold,
      sortable: true,
    },
    {
      name: 'Category',
      selector: row => row.category,
      sortable: true,
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <Badge bg={getStatusBadgeVariant(row.status)} className="status-badge">
          {row.status}
        </Badge>
      ),
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="d-flex flex-wrap gap-1">
          <Button 
            variant="outline-primary" 
            size="sm"
            onClick={() => handleViewProduct(row)}
            className="me-1 mb-1"
          >
            <BsEye /> View
          </Button>
          
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => handleEditProduct(row)}
            className="me-1 mb-1"
          >
            <BsPencil /> Edit
          </Button>
          
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => handleDeleteConfirm(row)}
            className="mb-1"
          >
            <BsTrash /> Delete
          </Button>
        </div>
      ),
      button: true,
      width: '220px',
    }
  ];

  return (
    <div className="vendor-products">
      <div className="page-header mb-4">
        <h1 className="page-title">Products Management</h1>
        <p className="text-muted">View and manage your products</p>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Product Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Total Products</h6>
              <h3 className="stats-value">
                {statsLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  productStats.totalProducts
                )}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Active Products</h6>
              <h3 className="stats-value">
                {statsLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  productStats.activeProducts
                )}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Low Stock</h6>
              <h3 className="stats-value">
                {statsLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  productStats.lowStockProducts
                )}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Out of Stock</h6>
              <h3 className="stats-value">
                {statsLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  productStats.outOfStockProducts
                )}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Products Table */}
      <Card className="admin-card">
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
          <Card.Title className="mb-0">Products</Card.Title>
          
          <div className="d-flex gap-2 mt-2 mt-md-0 flex-wrap">
            <InputGroup size="sm" style={{ width: '200px' }}>
              <InputGroup.Text>
                <BsSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            
            <Form.Select 
              size="sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </Form.Select>
            
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleAddProduct}
            >
              <BsPlus /> Add Product
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handlePerRowsChange}
              paginationPerPage={perPage}
              paginationDefaultPage={currentPage}
              highlightOnHover
              responsive
              striped
              noHeader
              progressPending={loading}
              progressComponent={
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading products...</p>
                </div>
              }
            />
          )}
        </Card.Body>
      </Card>
      
      {/* View Product Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>View Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              <Row>
                <Col md={5} className="text-center mb-3 mb-md-0">
                  {/* Main Image */}
                  {(selectedProduct.mainImage || selectedProduct.image) ? (
                    <img 
                      src={selectedProduct.mainImage || selectedProduct.image} 
                      alt={selectedProduct.name} 
                      className="img-fluid rounded" 
                      style={{ maxHeight: '250px', objectFit: 'contain' }} 
                    />
                  ) : (
                    <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ height: '250px' }}>
                      <span className="text-muted">No main image</span>
                    </div>
                  )}
                  
                  {/* Sub Images */}
                  {selectedProduct.subImages && selectedProduct.subImages.length > 0 && (
                    <div className="mt-3">
                      <small className="text-muted d-block mb-2">Additional Images</small>
                      <div className="d-flex flex-wrap justify-content-center gap-2">
                        {selectedProduct.subImages.map((img, index) => (
                          <img 
                            key={index}
                            src={img} 
                            alt={`${selectedProduct.name} ${index + 1}`} 
                            className="img-thumbnail" 
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </Col>
                <Col md={7}>
                  <h4>{selectedProduct.name}</h4>
                  <Badge bg={getStatusBadgeVariant(selectedProduct.status)} className="mb-3">
                    {selectedProduct.status}
                  </Badge>
                  
                  <p className="text-muted">{selectedProduct.description || 'No description available.'}</p>
                  
                  <Row className="mt-4">
                    <Col xs={6} md={4}>
                      <small className="text-muted d-block">Price</small>
                      <strong>${selectedProduct.price?.toFixed(2)}</strong>
                    </Col>
                    <Col xs={6} md={4}>
                      <small className="text-muted d-block">Stock</small>
                      <strong>{selectedProduct.stock}</strong>
                    </Col>
                    <Col xs={6} md={4}>
                      <small className="text-muted d-block">Sold</small>
                      <strong>{selectedProduct.sold}</strong>
                    </Col>
                  </Row>
                  
                  <div className="mt-3">
                    <small className="text-muted d-block">Category</small>
                    <strong>{selectedProduct.category}</strong>
                  </div>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowViewModal(false);
              handleEditProduct(selectedProduct);
            }}
          >
            Edit Product
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Edit Product Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price ($)</Form.Label>
                      <Form.Control 
                        type="number" 
                        name="price" 
                        value={formData.price} 
                        onChange={handleInputChange} 
                        required 
                        min="0" 
                        step="0.01" 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stock</Form.Label>
                      <Form.Control 
                        type="number" 
                        name="stock" 
                        value={formData.stock} 
                        onChange={handleInputChange} 
                        required 
                        min="0" 
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange} 
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Image URL</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="image" 
                    value={formData.image} 
                    onChange={handleInputChange} 
                    placeholder="https://example.com/image.jpg" 
                  />
                  
                  {formData.image ? (
                    <div className="mt-3 text-center">
                      <img 
                        src={formData.image} 
                        alt="Product preview" 
                        className="img-fluid rounded" 
                        style={{ maxHeight: '150px', objectFit: 'contain' }} 
                      />
                    </div>
                  ) : (
                    <div className="bg-light rounded d-flex align-items-center justify-content-center mt-3" style={{ height: '150px' }}>
                      <span className="text-muted">No image</span>
                    </div>
                  )}
                  
                  <div className="mt-3 small text-muted">
                    For production, you would implement an image upload feature here.
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveProduct}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>Save Changes</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Add Product Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Price ($)</Form.Label>
                      <Form.Control 
                        type="number" 
                        name="price" 
                        value={formData.price} 
                        onChange={handleInputChange} 
                        required 
                        min="0" 
                        step="0.01" 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Stock</Form.Label>
                      <Form.Control 
                        type="number" 
                        name="stock" 
                        value={formData.stock} 
                        onChange={handleInputChange} 
                        required 
                        min="0" 
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange} 
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Image URL</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="image" 
                    value={formData.image} 
                    onChange={handleInputChange} 
                    placeholder="https://example.com/image.jpg" 
                  />
                  
                  {formData.image ? (
                    <div className="mt-3 text-center">
                      <img 
                        src={formData.image} 
                        alt="Product preview" 
                        className="img-fluid rounded" 
                        style={{ maxHeight: '150px', objectFit: 'contain' }} 
                      />
                    </div>
                  ) : (
                    <div className="bg-light rounded d-flex align-items-center justify-content-center mt-3" style={{ height: '150px' }}>
                      <span className="text-muted">No image</span>
                    </div>
                  )}
                  
                  <div className="mt-3 small text-muted">
                    For production, you would implement an image upload feature here.
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveProduct}
            disabled={saving}
          >
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Adding...
              </>
            ) : (
              <>Add Product</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <BsExclamationTriangle size={48} className="text-warning mb-3" />
            <h5>Are you sure?</h5>
            <p>
              You are about to delete the product: <strong>{productToDelete?.name}</strong>
            </p>
            <p className="text-danger">This action cannot be undone.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteProduct}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>Delete Product</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VendorProducts;
