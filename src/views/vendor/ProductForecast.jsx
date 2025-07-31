/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Table,
  Alert,
  Spinner,
  Badge,
  Button,
} from "react-bootstrap";
import {
  BsArrowUp,
  BsArrowDown,
  BsCalendar,
  BsGraphUp,
  BsInfoCircle,
} from "react-icons/bs";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { forecastingService } from "../../services/forecastingApi";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ProductForecast = ({ productId, productName, onClose, show = true }) => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    if (productId && show) {
      fetchProductForecast();
    }
  }, [productId, selectedPeriod, show]);

  const fetchProductForecast = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await forecastingService.getProductForecast(
        productId,
        selectedPeriod
      );
      setForecastData(response);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch product forecast"
      );
      console.error("Product forecast fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (!forecastData || !forecastData.data || !forecastData.data.forecast)
      return null;

    const labels = forecastData.data.forecast.map((item) =>
      new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    );

    const forecastValues = forecastData.data.forecast.map(
      (item) => item.predicted_quantity
    );
    const lowerBound = forecastData.data.forecast.map(
      (item) => item.lower_bound
    );
    const upperBound = forecastData.data.forecast.map(
      (item) => item.upper_bound
    );

    return {
      labels,
      datasets: [
        {
          label: "Forecast",
          data: forecastValues,
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.1)",
          fill: false,
          tension: 0.4,
        },
        {
          label: "Upper Bound",
          data: upperBound,
          borderColor: "rgba(255, 99, 132, 0.3)",
          backgroundColor: "rgba(255, 99, 132, 0.1)",
          fill: "+1",
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: "Lower Bound",
          data: lowerBound,
          borderColor: "rgba(255, 99, 132, 0.3)",
          backgroundColor: "rgba(255, 99, 132, 0.1)",
          fill: false,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Sales Forecast - ${productName}`,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Predicted Sales",
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  const getRecommendations = () => {
    if (!forecastData || !forecastData.data || !forecastData.data.summary)
      return [];

    const recommendations = [];
    const summary = forecastData.data.summary;
    const product = forecastData.data.product;

    if (summary.average_daily_quantity > (product?.currentStock || 0) / 7) {
      recommendations.push({
        type: "warning",
        message:
          "Consider restocking soon - forecast exceeds current stock levels",
      });
    }

    if (summary.predicted_growth_rate_percent > 0) {
      recommendations.push({
        type: "success",
        message: "Positive trend detected - consider increasing inventory",
      });
    } else {
      recommendations.push({
        type: "info",
        message:
          "Declining trend - monitor closely and adjust marketing strategy",
      });
    }

    if (summary.confidence < 0.6) {
      recommendations.push({
        type: "warning",
        message:
          "Low confidence forecast - consider gathering more historical data",
      });
    }

    return recommendations;
  };

  const chartData = formatChartData();
  const recommendations = getRecommendations();

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <BsGraphUp className="me-2 text-primary" />
          Product Forecast - {productName}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading forecast data...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <BsInfoCircle className="me-2" />
            {error}
            <div className="mt-2">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={fetchProductForecast}
              >
                Try Again
              </Button>
            </div>
          </Alert>
        ) : (
          <>
            {/* Summary Cards */}
            {forecastData && (
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="display-6 text-primary mb-2">
                        <BsCalendar />
                      </div>
                      <h6 className="card-title">Forecast Period</h6>
                      <h4 className="text-primary mb-0">
                        {selectedPeriod} Days
                      </h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="display-6 text-success mb-2">
                        <BsArrowUp />
                      </div>
                      <h6 className="card-title">Avg Daily Forecast</h6>
                      <h4 className="text-success mb-0">
                        {forecastData.data?.summary?.average_daily_quantity?.toFixed(
                          1
                        ) || "0"}
                      </h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="display-6 text-info mb-2">
                        <BsGraphUp />
                      </div>
                      <h6 className="card-title">Total Forecast</h6>
                      <h4 className="text-info mb-0">
                        {forecastData.data?.summary?.total_predicted_quantity?.toFixed(
                          0
                        ) || "0"}
                      </h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body className="text-center">
                      <div className="display-6 text-warning mb-2">
                        {(forecastData.data?.summary
                          ?.predicted_growth_rate_percent || 0) > 0 ? (
                          <BsArrowUp />
                        ) : (forecastData.data?.summary
                            ?.predicted_growth_rate_percent || 0) < 0 ? (
                          <BsArrowDown />
                        ) : (
                          <BsArrowUp />
                        )}
                      </div>
                      <h6 className="card-title">Trend</h6>
                      <Badge
                        bg={
                          (forecastData.data?.summary
                            ?.predicted_growth_rate_percent || 0) > 0
                            ? "success"
                            : (forecastData.data?.summary
                                ?.predicted_growth_rate_percent || 0) < 0
                            ? "danger"
                            : "warning"
                        }
                        className="fs-6"
                      >
                        {(forecastData.data?.summary
                          ?.predicted_growth_rate_percent || 0) > 0
                          ? "Growing"
                          : (forecastData.data?.summary
                              ?.predicted_growth_rate_percent || 0) < 0
                          ? "Declining"
                          : "Stable"}{" "}
                        (
                        {(
                          forecastData.data?.summary
                            ?.predicted_growth_rate_percent || 0
                        ).toFixed(1)}
                        %)
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Chart */}
            {chartData && (
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <BsGraphUp className="me-2" />
                      Forecast Chart
                    </h5>
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant={
                          selectedPeriod === 7 ? "primary" : "outline-primary"
                        }
                        onClick={() => setSelectedPeriod(7)}
                      >
                        7 Days
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          selectedPeriod === 30 ? "primary" : "outline-primary"
                        }
                        onClick={() => setSelectedPeriod(30)}
                      >
                        30 Days
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          selectedPeriod === 90 ? "primary" : "outline-primary"
                        }
                        onClick={() => setSelectedPeriod(90)}
                      >
                        90 Days
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "300px" }}>
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-light border-bottom">
                  <h5 className="mb-0">
                    <BsInfoCircle className="me-2" />
                    Recommendations
                  </h5>
                </Card.Header>
                <Card.Body>
                  {recommendations.map((rec, index) => (
                    <Alert key={index} variant={rec.type} className="mb-2">
                      {rec.message}
                    </Alert>
                  ))}
                </Card.Body>
              </Card>
            )}

            {/* Forecast Table */}
            {forecastData &&
              forecastData.data &&
              forecastData.data.forecast && (
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white border-bottom">
                    <h5 className="mb-0">
                      <BsCalendar className="me-2" />
                      Detailed Forecast
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                      <Table striped hover responsive size="sm">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Forecast</th>
                            <th>Lower Bound</th>
                            <th>Upper Bound</th>
                            <th>Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecastData.data.forecast.map((item, index) => (
                            <tr key={index}>
                              <td>
                                {new Date(item.date).toLocaleDateString()}
                              </td>
                              <td>
                                <strong>
                                  {item.predicted_quantity.toFixed(1)}
                                </strong>
                              </td>
                              <td>{item.lower_bound.toFixed(1)}</td>
                              <td>{item.upper_bound.toFixed(1)}</td>
                              <td>
                                <Badge bg="info">
                                  {(
                                    ((item.upper_bound - item.lower_bound) /
                                      item.predicted_quantity) *
                                    100
                                  ).toFixed(0)}
                                  %
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={fetchProductForecast}>
          Refresh Data
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductForecast;
