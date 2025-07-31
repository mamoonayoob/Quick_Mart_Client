/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, Form, Button, Spinner, Alert } from "react-bootstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { BsCalendar3, BsArrowUp, BsArrowDown } from "react-icons/bs";
import { vendorApi } from "../../services/api"; // Import vendor API for real-time data

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const VendorAnalytics = () => {
  // State for real-time analytics data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: [],
  });
  const [categoryData, setCategoryData] = useState({
    labels: [],
    datasets: [],
  });
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for date range filter
  const [dateRange, setDateRange] = useState("month"); // week, month, year

  // Mock data for vendor analytics using useMemo to prevent re-renders
  const mockSalesData = useMemo(
    () => ({
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Revenue",
          data: [
            5200, 6100, 5800, 6300, 7200, 8100, 8500, 9200, 9800, 10500, 11200,
            12500,
          ],
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4,
        },
        {
          label: "Orders",
          data: [42, 48, 45, 52, 58, 65, 70, 76, 82, 88, 94, 102],
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.4,
        },
      ],
    }),
    []
  );

  const mockCategoryData = useMemo(
    () => ({
      labels: ["Smartphones", "Audio", "Laptops", "Tablets", "Wearables"],
      datasets: [
        {
          label: "Sales by Category",
          data: [35, 25, 20, 12, 8],
          backgroundColor: [
            "rgba(255, 99, 132, 0.7)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.7)",
            "rgba(75, 192, 192, 0.7)",
            "rgba(153, 102, 255, 0.7)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }),
    []
  );

  // Data processing functions for real-time data
  const processSalesData = (salesByDay, period) => {
    if (!salesByDay || salesByDay.length === 0) {
      return mockSalesData; // Fallback to mock data
    }

    // Sort by date
    const sortedData = salesByDay.sort(
      (a, b) => new Date(a._id) - new Date(b._id)
    );

    const labels = sortedData.map((item) => {
      const date = new Date(item._id);
      if (period === "week") {
        return date.toLocaleDateString("en-US", { weekday: "short" });
      } else if (period === "month") {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else {
        return date.toLocaleDateString("en-US", { month: "short" });
      }
    });

    const revenueData = sortedData.map((item) => item.totalAmount || 0);
    const ordersData = sortedData.map((item) => item.count || 0);

    return {
      labels,
      datasets: [
        {
          label: "Revenue ($)",
          data: revenueData,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4,
        },
        {
          label: "Orders",
          data: ordersData,
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.4,
        },
      ],
    };
  };

  const processCategoryData = (salesByCategory) => {
    if (!salesByCategory || salesByCategory.length === 0) {
      return mockCategoryData; // Fallback to mock data
    }

    const labels = salesByCategory.map((item) => {
      // Capitalize and format category names
      return item._id
        ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
        : "Unknown Category";
    });

    const data = salesByCategory.map((item) => item.totalAmount || 0);

    // Define colors for different categories
    const categoryColors = [
      "rgba(255, 99, 132, 0.7)",
      "rgba(54, 162, 235, 0.7)",
      "rgba(255, 206, 86, 0.7)",
      "rgba(75, 192, 192, 0.7)",
      "rgba(153, 102, 255, 0.7)",
      "rgba(255, 159, 64, 0.7)",
      "rgba(199, 199, 199, 0.7)",
      "rgba(83, 102, 255, 0.7)",
    ];

    const backgroundColor = labels.map(
      (_, index) => categoryColors[index % categoryColors.length]
    );

    const borderColor = backgroundColor.map((color) =>
      color.replace("0.7", "1")
    );

    return {
      labels,
      datasets: [
        {
          label: "Sales by Category",
          data,
          backgroundColor,
          borderColor,
          borderWidth: 1,
        },
      ],
    };
  };

  // Fetch real-time analytics data from database
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch real analytics data from backend
        console.log("Calling analytics API with period:", dateRange);
        const params = { period: dateRange };
        console.log("API params:", params);
        const response = await vendorApi.getAnalytics(params);
        console.log("API response received:", response);

        if (response.data.success) {
          const data = response.data.data;
          setAnalyticsData(data);

          // Process sales data for charts
          const processedSalesData = processSalesData(
            data.salesByDay,
            dateRange
          );
          setSalesData(processedSalesData);

          // Process category data (sales by category)
          const processedCategoryData = processCategoryData(
            data.salesByCategory
          );
          setCategoryData(processedCategoryData);

          // Set top products
          setTopProducts(data.topProducts || []);
        } else {
          throw new Error("Failed to fetch analytics data");
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        console.error("Error details:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });

        setError(
          `Failed to load analytics data: ${
            err.response?.data?.message || err.message
          }`
        );

        // Fallback to mock data on error
        setSalesData(mockSalesData);
        setCategoryData(mockCategoryData);
        setTopProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange, mockSalesData, mockCategoryData]);

  // Options for the charts
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Revenue & Orders Overview",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        text: "Sales by Category",
      },
    },
  };

  // Calculate real-time summary metrics
  const totalRevenue = analyticsData?.totalSales?.totalAmount || 0;
  const totalOrders = analyticsData?.totalSales?.count || 0;

  // Calculate growth percentages (simplified for now - can be enhanced later)
  const revenueGrowth = 8.5; // TODO: Calculate from previous period data
  const ordersGrowth = 6.2; // TODO: Calculate from previous period data

  return (
    <div className="vendor-analytics">
      <div className="page-header mb-4">
        <h1 className="page-title">Vendor Analytics</h1>
        <p className="text-muted">Track your sales performance and trends</p>
      </div>

      {/* Date Range Filter */}
      <Card className="admin-card mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={6}>
              <div className="d-flex align-items-center">
                <BsCalendar3 className="me-2" />
                <span>Date Range:</span>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex">
                <Form.Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="me-2"
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last 12 Months</option>
                </Form.Select>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => window.location.reload()}
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
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col lg={6} md={6} className="mb-4 mb-lg-0">
          <Card className="admin-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-subtitle text-muted">Total Revenue</h6>
                <div
                  className={`trend ${
                    revenueGrowth >= 0 ? "trend-up" : "trend-down"
                  }`}
                >
                  {revenueGrowth >= 0 ? <BsArrowUp /> : <BsArrowDown />}
                  <span>{Math.abs(revenueGrowth)}%</span>
                </div>
              </div>
              <h3 className="card-value">
                ${totalRevenue ? (totalRevenue / 1000).toFixed(1) : 0}k
              </h3>
              <p className="text-muted small">Compared to previous period</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} md={6}>
          <Card className="admin-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-subtitle text-muted">Total Orders</h6>
                <div
                  className={`trend ${
                    ordersGrowth >= 0 ? "trend-up" : "trend-down"
                  }`}
                >
                  {ordersGrowth >= 0 ? <BsArrowUp /> : <BsArrowDown />}
                  <span>{Math.abs(ordersGrowth)}%</span>
                </div>
              </div>
              <h3 className="card-value">{totalOrders}</h3>
              <p className="text-muted small">Compared to previous period</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col lg={8} className="mb-4 mb-lg-0">
          <Card className="admin-card h-100">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading sales data...</p>
                </div>
              ) : (
                <Line data={salesData} options={lineChartOptions} />
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="admin-card h-100">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading category data...</p>
                </div>
              ) : (
                <Doughnut data={categoryData} options={doughnutChartOptions} />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Products Table */}
      <Card className="admin-card">
        <Card.Header>
          <Card.Title>Top Selling Products</Card.Title>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading product data...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts && topProducts.length > 0 ? (
                    topProducts.map((product, index) => {
                      const percentage =
                        totalRevenue > 0
                          ? (
                              (product.totalAmount / totalRevenue) *
                              100
                            ).toFixed(1)
                          : 0;
                      return (
                        <tr key={product._id || index}>
                          <td>{product.name || "Unknown Product"}</td>
                          <td>
                            $
                            {product.totalAmount && product.totalQuantity
                              ? (
                                  product.totalAmount / product.totalQuantity
                                ).toFixed(0)
                              : 0}
                          </td>
                          <td>{product.totalQuantity || 0}</td>
                          <td>
                            $
                            {product.totalAmount
                              ? product.totalAmount.toLocaleString()
                              : 0}
                          </td>
                          <td>{percentage}%</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        {loading
                          ? "Loading products..."
                          : "No products data available for selected period"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default VendorAnalytics;
