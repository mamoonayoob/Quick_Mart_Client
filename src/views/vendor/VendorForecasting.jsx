/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import {
  BsArrowUp,
  BsArrowDown,
  BsCalendar3,
  BsBoxSeam,
  BsGraphUp,
  BsExclamationTriangle,
  BsInfoCircle,
} from "react-icons/bs";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { forecastingService } from "../../services/forecastingApi";
import ProductForecast from "./ProductForecast";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VendorForecasting = () => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // ProductForecast modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchForecastData();
  }, [selectedPeriod]);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        "[DEBUG] Fetching forecast data with period:",
        selectedPeriod
      );

      const response = await forecastingService.getVendorForecast(
        selectedPeriod
      );

      console.log("[DEBUG] API Response:", response);
      console.log("[DEBUG] Response success:", response.success);
      console.log("[DEBUG] Response data:", response.data);

      if (response.success) {
        console.log("[DEBUG] Setting forecast data:", response.data);
        setForecastData(response.data);
      } else {
        console.log("[DEBUG] API Error:", response.message);
        setError(response.message || "Failed to fetch forecast data");
      }
    } catch (err) {
      console.error("[DEBUG] Forecast fetch error:", err);
      console.error("[DEBUG] Error details:", err.response?.data);
      setError("Failed to load forecast data");
    } finally {
      setLoading(false);
    }
  };

  // Format chart data for forecasting visualization
  const formatForecastChartData = () => {
    if (
      !forecastData ||
      !forecastData.forecasts ||
      forecastData.forecasts.length === 0
    ) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            label: "No Forecast Data",
            data: [0],
            borderColor: "rgba(128, 128, 128, 0.5)",
            backgroundColor: "rgba(128, 128, 128, 0.1)",
          },
        ],
      };
    }

    // Get top 5 products for chart
    const topProducts = forecastData.forecasts.slice(0, 5);
    const labels = topProducts.map(
      (product) => product.productName || "Unknown Product"
    );
    const forecastData_values = topProducts.map(
      (product) => product.summary?.total_predicted_quantity || 0
    );
    const currentStock = topProducts.map(
      (product) => product.currentStock || 0
    );

    return {
      labels,
      datasets: [
        {
          label: `Forecast (${selectedPeriod} days)`,
          data: forecastData_values,
          backgroundColor: "rgba(54, 162, 235, 0.7)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: "Current Stock",
          data: currentStock,
          backgroundColor: "rgba(75, 192, 192, 0.7)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options for forecasting visualization
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Demand Forecast vs Current Stock",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Quantity",
        },
      },
      x: {
        title: {
          display: true,
          text: "Products",
        },
      },
    },
  };

  // Calculate summary metrics
  const totalProducts = forecastData?.forecasts?.length || 0;
  const avgDailyForecast = forecastData?.summary?.averageDailyQuantity || 0;
  const totalForecast = forecastData?.summary?.totalPredictedQuantity || 0;
  const lowStockProducts =
    forecastData?.forecasts?.filter(
      (p) => p.currentStock < p.summary?.average_daily_quantity * 7 || 0
    ).length || 0;

  const getStockAlerts = () => {
    if (!forecastData || !forecastData.forecasts) return [];

    return forecastData.forecasts.filter((product) => {
      const avgForecast = product.summary?.average_daily_quantity || 0;
      const currentStock = product.currentStock || 0;
      return currentStock < avgForecast * 7; // Less than 7 days of stock
    });
  };

  // Handle opening product forecast modal
  const handleProductClick = (product) => {
    setSelectedProduct({
      id: product.productId,
      name: product.productName,
    });
    setShowProductModal(true);
  };

  // Handle closing product forecast modal
  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const chartData = formatForecastChartData();
  const stockAlerts = getStockAlerts();

  return (
    <div className="vendor-forecasting">
      {/* Page Header */}
      <div className="page-header mb-4">
        <h1 className="page-title">
          <BsGraphUp className="me-2" />
          Demand Forecasting
        </h1>
        <p className="text-muted">
          AI-powered sales predictions for your products
        </p>
      </div>

      {/* Date Range Filter */}
      <Card className="admin-card mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <div className="d-flex align-items-center">
                <BsCalendar3 className="me-2" />
                <span>Forecast Period:</span>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex">
                <Form.Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  className="me-2"
                >
                  <option value={7}>Next 7 Days</option>
                  <option value={30}>Next 30 Days</option>
                  <option value={90}>Next 90 Days</option>
                </Form.Select>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={fetchForecastData}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-4">
          <BsExclamationTriangle className="me-2" />
          {error}
          <Button
            variant="outline-danger"
            size="sm"
            className="ms-2"
            onClick={fetchForecastData}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-4 mb-lg-0">
          <Card className="admin-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-subtitle text-muted">Total Products</h6>
                <div className="trend trend-neutral">
                  <BsBoxSeam />
                </div>
              </div>
              <h3 className="card-value">{totalProducts}</h3>
              <p className="text-muted small">Products with forecast data</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4 mb-lg-0">
          <Card className="admin-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-subtitle text-muted">Avg Daily Forecast</h6>
                <div className="trend trend-up">
                  <BsArrowUp />
                  <span>+12%</span>
                </div>
              </div>
              <h3 className="card-value">{avgDailyForecast.toFixed(1)}</h3>
              <p className="text-muted small">Units per day predicted</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6} className="mb-4 mb-lg-0">
          <Card className="admin-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-subtitle text-muted">Total Forecast</h6>
                <div className="trend trend-up">
                  <BsGraphUp />
                  <span>+8%</span>
                </div>
              </div>
              <h3 className="card-value">{totalForecast.toFixed(0)}</h3>
              <p className="text-muted small">
                Units for {selectedPeriod} days
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} md={6}>
          <Card className="admin-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-subtitle text-muted">Stock Alerts</h6>
                <div
                  className={`trend ${
                    lowStockProducts > 0 ? "trend-down" : "trend-neutral"
                  }`}
                >
                  <BsExclamationTriangle />
                  {lowStockProducts > 0 && <span>Alert</span>}
                </div>
              </div>
              <h3 className="card-value">{lowStockProducts}</h3>
              <p className="text-muted small">Products need restocking</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col lg={12}>
          <Card className="admin-card h-100">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading forecast data...</p>
                </div>
              ) : (
                <Bar data={chartData} options={barChartOptions} />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-warning bg-opacity-10 border-bottom border-warning">
                <h5 className="mb-0 text-warning">
                  <BsExclamationTriangle className="me-2" />
                  Stock Alerts
                </h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="warning" className="mb-3">
                  <BsInfoCircle className="me-2" />
                  The following products may run out of stock based on forecast
                  predictions:
                </Alert>
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Avg Daily Forecast</th>
                      <th>Days Until Stock Out</th>
                      <th>Action Needed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockAlerts.map((product, index) => {
                      const daysUntilStockOut = Math.floor(
                        product.current_stock /
                          (product.forecast_summary?.avg_forecast || 1)
                      );
                      return (
                        <tr key={index}>
                          <td>
                            <strong>{product.name}</strong>
                          </td>
                          <td>
                            <Badge
                              bg={
                                product.current_stock < 10
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {product.current_stock}
                            </Badge>
                          </td>
                          <td>
                            {product.forecast_summary?.avg_forecast?.toFixed(
                              1
                            ) || "0"}
                          </td>
                          <td>
                            <Badge
                              bg={daysUntilStockOut < 3 ? "danger" : "warning"}
                            >
                              {daysUntilStockOut} days
                            </Badge>
                          </td>
                          <td>
                            <Button size="sm" variant="outline-primary">
                              Restock Now
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Product Forecast Table */}
      {forecastData &&
        forecastData.forecasts &&
        forecastData.forecasts.length > 0 && (
          <Row>
            <Col>
              <Card className="admin-card">
                <Card.Body>
                  <h5 className="mb-3">
                    <BsBoxSeam className="me-2" />
                    Product Forecast Summary
                  </h5>
                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Current Stock</th>
                        <th>Avg Daily Forecast</th>
                        <th>Total Forecast ({selectedPeriod} days)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastData.forecasts
                        .slice(0, 10)
                        .map((product, index) => (
                          <tr key={index}>
                            <td>
                              <strong
                                style={{ cursor: "pointer", color: "#007bff" }}
                                onClick={() => handleProductClick(product)}
                                title="Click for detailed forecast"
                              >
                                {product.productName || "Unknown Product"}
                              </strong>
                              <br />
                              <small className="text-muted">
                                {product.category || "No Category"}
                              </small>
                            </td>
                            <td>
                              <Badge
                                bg={
                                  product.currentStock < 10
                                    ? "danger"
                                    : "success"
                                }
                              >
                                {product.currentStock || 0}
                              </Badge>
                            </td>
                            <td>
                              {product.summary?.average_daily_quantity?.toFixed(
                                1
                              ) || "0"}
                            </td>
                            <td>
                              <strong>
                                {product.summary?.total_predicted_quantity?.toFixed(
                                  0
                                ) || "0"}
                              </strong>
                            </td>
                            <td>
                              {product.summary?.predicted_growth_rate_percent >
                              0 ? (
                                <Badge bg="success">
                                  <BsArrowUp className="me-1" />
                                  Growing
                                </Badge>
                              ) : product.summary
                                  ?.predicted_growth_rate_percent < 0 ? (
                                <Badge bg="danger">
                                  <BsArrowDown className="me-1" />
                                  Declining
                                </Badge>
                              ) : (
                                <Badge bg="warning">
                                  <BsArrowDown className="me-1" />
                                  Stable
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

      {/* Product Forecast Modal */}
      {selectedProduct && (
        <ProductForecast
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          show={showProductModal}
          onClose={handleCloseProductModal}
        />
      )}
    </div>
  );
};

export default VendorForecasting;
