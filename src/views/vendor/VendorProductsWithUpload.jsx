/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
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
  InputGroup,
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import {
  BsPlus,
  BsPencil,
  BsTrash,
  BsEye,
  BsSearch,
  BsExclamationTriangle,
  BsImage,
} from "react-icons/bs";
import { vendorApi } from "../../services/api";
import ImageUploader from "../../components/ImageUploader";

const VendorProductsWithUpload = () => {
  // State for products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

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
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    mainImage: "",
    subImages: [],
    status: "Active",
  });

  // State for image upload
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Mock categories
  const categories = [
    "Smartphones",
    "Audio",
    "Laptops",
    "Tablets",
    "Wearables",
  ];

  // Define table columns
  const columns = [
    {
      name: "Product",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div className="d-flex align-items-center">
          {row.image || row.mainImage ? (
            <img
              src={row.mainImage || row.image}
              alt={row.name}
              width="40"
              height="40"
              className="rounded me-2"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div
              className="bg-light rounded me-2 d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40 }}
            >
              <BsImage className="text-muted" />
            </div>
          )}
          <div>
            <div>{row.name}</div>
            <small className="text-muted">{row.category}</small>
          </div>
        </div>
      ),
    },
    {
      name: "Price",
      selector: (row) => row.price,
      sortable: true,
      cell: (row) => `$${row.price?.toFixed(2)}`,
    },
    {
      name: "Stock",
      selector: (row) => row.stock,
      sortable: true,
      cell: (row) => (
        <div>
          <span>{row.stock}</span>
          <Badge bg={getStatusBadgeVariant(row.status)} className="ms-2">
            {row.status}
          </Badge>
        </div>
      ),
    },
    {
      name: "Sold",
      selector: (row) => row.sold,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleViewProduct(row)}
          >
            <BsEye />
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => handleEditProduct(row)}
          >
            <BsPencil />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleDeleteConfirm(row)}
          >
            <BsTrash />
          </Button>
        </div>
      ),
    },
  ];

  // Fetch products
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call the vendor API to get products
      const response = await vendorApi.getProducts({
        search: searchTerm,
        category: filterCategory || undefined,
      });

      if (response.data && response.data.success) {
        setProducts(response.data.data || []);
      } else {
        throw new Error(response.data?.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again later.");

      // Fallback to mock data if API fails (for development purposes)
      // You can remove this in production
      setProducts([
        {
          _id: "P1",
          name: "iPhone 13",
          price: 999,
          stock: 24,
          sold: 42,
          image: "https://via.placeholder.com/50",
          category: "Smartphones",
          status: "Active",
        },
        {
          _id: "P2",
          name: "AirPods Pro",
          price: 249,
          stock: 36,
          sold: 38,
          image: "https://via.placeholder.com/50",
          category: "Audio",
          status: "Active",
        },
        // Add more mock products as needed
      ]);
    } finally {
      setLoading(false);
    }
  };

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
      const response = await vendorApi.deleteProduct(productToDelete._id);

      if (response.data && response.data.success) {
        // Remove product from state
        setProducts((prevProducts) =>
          prevProducts.filter((p) => p._id !== productToDelete._id)
        );

        // Close modal and reset state
        setShowDeleteModal(false);
        setProductToDelete(null);
      } else {
        throw new Error(response.data?.message || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Handle view product
  const handleViewProduct = (product) => {
    console.log(product);
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      stock: product.stock || "",
      category: product.category || "",
      mainImage: product.mainImage || product.image || "",
      subImages: product.subImages || [],
      status: product.status || "Active",
    });
    setShowEditModal(true);
  };

  // Handle image upload from ImageUploader component
  const handleImageUploaded = (imageUrl, isMainImage = true) => {
    if (isMainImage) {
      setFormData((prev) => ({
        ...prev,
        mainImage: imageUrl,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subImages: [...prev.subImages, imageUrl],
      }));
    }
  };

  // Handle remove sub image
  const handleRemoveSubImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      subImages: prev.subImages.filter((_, index) => index !== indexToRemove),
    }));
  };

  // Handle add product
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      mainImage: "",
      subImages: [],
      status: "Active",
    });
    setShowAddModal(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle save product (add or edit)
  const handleSaveProduct = async () => {
    // Validate form
    if (
      !formData.name ||
      !formData.price ||
      !formData.stock ||
      !formData.category
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        mainImage: formData.mainImage,
        subImages: formData.subImages,
        status: formData.status,
      };

      let response;

      if (selectedProduct) {
        console.log(selectedProduct);
        // Update existing product
        response = await vendorApi.updateProduct(
          selectedProduct._id,
          productData
        );
      } else {
        // Add new product
        response = await vendorApi.addProduct(productData);
      }

      if (response.data && response.data.success) {
        // Refresh products list
        fetchProducts();

        // Close modal
        setShowEditModal(false);
        setShowAddModal(false);
      } else {
        throw new Error(response.data?.message || "Failed to save product");
      }
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Failed to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Helper function to get badge variant based on status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "Low Stock":
        return "warning";
      case "Out of Stock":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <div>
      <div className="page-header mb-4">
        <h1 className="page-title">Products Management</h1>
        <p className="text-muted">View and manage your products</p>
      </div>
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Total Products</h6>
              <h3 className="stats-value">{products.length}</h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Active</h6>
              <h3 className="stats-value">
                {products.filter((p) => p.status === "Active").length}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Low Stock</h6>
              <h3 className="stats-value">
                {products.filter((p) => p.stock < 10).length}
              </h3>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="admin-card h-100">
            <Card.Body className="text-center">
              <h6 className="stats-title">Out of Stock</h6>
              <h3 className="stats-value">
                {products.filter((p) => p.stock === 0).length}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Card>
        <Card.Header className="bg-white">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <h5 className="mb-0">Products</h5>

            <InputGroup size="sm" style={{ width: "auto" }}>
              <InputGroup.Text>
                <BsSearch />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Form.Select
              size="sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ width: "150px" }}
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </Form.Select>

            <Button variant="primary" size="sm" onClick={handleAddProduct}>
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
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              pagination
              highlightOnHover
              responsive
              striped
              noHeader
            />
          )}
        </Card.Body>
      </Card>

      {/* View Product Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>View Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              <Row>
                <Col md={5} className="text-center mb-3 mb-md-0">
                  {/* Main Image */}
                  {selectedProduct.mainImage || selectedProduct.image ? (
                    <img
                      src={selectedProduct.mainImage || selectedProduct.image}
                      alt={selectedProduct.name}
                      className="img-fluid rounded"
                      style={{ maxHeight: "250px", objectFit: "contain" }}
                    />
                  ) : (
                    <div
                      className="bg-light rounded d-flex align-items-center justify-content-center"
                      style={{ height: "250px" }}
                    >
                      <span className="text-muted">No main image</span>
                    </div>
                  )}

                  {/* Sub Images */}
                  {selectedProduct.subImages &&
                    selectedProduct.subImages.length > 0 && (
                      <div className="mt-3">
                        <small className="text-muted d-block mb-2">
                          Additional Images
                        </small>
                        <div className="d-flex flex-wrap justify-content-center gap-2">
                          {selectedProduct.subImages.map((img, index) => (
                            <img
                              key={index}
                              src={img}
                              alt={`${selectedProduct.name} ${index + 1}`}
                              className="img-thumbnail"
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                </Col>
                <Col md={7}>
                  <h4>{selectedProduct.name}</h4>
                  <Badge
                    bg={getStatusBadgeVariant(selectedProduct.status)}
                    className="mb-3"
                  >
                    {selectedProduct.status}
                  </Badge>

                  <p className="text-muted">
                    {selectedProduct.description || "No description available."}
                  </p>

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
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
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
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Image</Form.Label>

                  {/* Image URL input */}
                  <Form.Control
                    type="text"
                    name="mainImage"
                    value={formData.mainImage}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="mb-2"
                  />

                  {/* Image upload component */}
                  <ImageUploader
                    onImageUploaded={(url) => handleImageUploaded(url, true)}
                    isMainImage={true}
                    buttonLabel="Upload Main Image"
                    className="mb-2"
                  />

                  {/* Image preview */}
                  {formData.mainImage ? (
                    <div className="mt-3 text-center">
                      <img
                        src={formData.mainImage}
                        alt="Product preview"
                        className="img-fluid rounded"
                        style={{ maxHeight: "150px", objectFit: "contain" }}
                      />
                    </div>
                  ) : (
                    <div
                      className="bg-light rounded d-flex align-items-center justify-content-center mt-3"
                      style={{ height: "150px" }}
                    >
                      <span className="text-muted">No image</span>
                    </div>
                  )}

                  {/* Additional images section */}
                  <div className="mt-4">
                    <Form.Label>Additional Images</Form.Label>
                    <ImageUploader
                      onImageUploaded={(url) => handleImageUploaded(url, false)}
                      isMainImage={false}
                      buttonLabel="Add Image"
                      className="mb-2"
                    />

                    {formData.subImages && formData.subImages.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {formData.subImages.map((img, index) => (
                          <div key={index} className="position-relative">
                            <img
                              src={img}
                              alt={`Product ${index + 1}`}
                              className="img-thumbnail"
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                              }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0 p-0"
                              style={{
                                width: "20px",
                                height: "20px",
                                fontSize: "10px",
                              }}
                              onClick={() => handleRemoveSubImage(index)}
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
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
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
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
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Image</Form.Label>

                  {/* Image URL input */}
                  <Form.Control
                    type="text"
                    name="mainImage"
                    value={formData.mainImage}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="mb-2"
                  />

                  {/* Image upload component */}
                  <ImageUploader
                    onImageUploaded={(url) => handleImageUploaded(url, true)}
                    isMainImage={true}
                    buttonLabel="Upload Main Image"
                    className="mb-2"
                  />

                  {/* Image preview */}
                  {formData.mainImage ? (
                    <div className="mt-3 text-center">
                      <img
                        src={formData.mainImage}
                        alt="Product preview"
                        className="img-fluid rounded"
                        style={{ maxHeight: "150px", objectFit: "contain" }}
                      />
                    </div>
                  ) : (
                    <div
                      className="bg-light rounded d-flex align-items-center justify-content-center mt-3"
                      style={{ height: "150px" }}
                    >
                      <span className="text-muted">No image</span>
                    </div>
                  )}

                  {/* Additional images section */}
                  <div className="mt-4">
                    <Form.Label>Additional Images</Form.Label>
                    <ImageUploader
                      onImageUploaded={(url) => handleImageUploaded(url, false)}
                      isMainImage={false}
                      buttonLabel="Add Image"
                      className="mb-2"
                    />

                    {formData.subImages && formData.subImages.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {formData.subImages.map((img, index) => (
                          <div key={index} className="position-relative">
                            <img
                              src={img}
                              alt={`Product ${index + 1}`}
                              className="img-thumbnail"
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                              }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0 p-0"
                              style={{
                                width: "20px",
                                height: "20px",
                                fontSize: "10px",
                              }}
                              onClick={() => handleRemoveSubImage(index)}
                            >
                              &times;
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
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
              You are about to delete the product:{" "}
              <strong>{productToDelete?.name}</strong>
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

export default VendorProductsWithUpload;
