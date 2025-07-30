import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
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
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { BsCalendar3, BsArrowUp, BsArrowDown, BsDownload } from 'react-icons/bs';
import { adminApi } from '../../services/api';

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

const Analytics = () => {
  // Mock data for initial development - using useMemo to avoid dependency array issues
  const mockSalesData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [12500, 14000, 15500, 13800, 16200, 17500, 18200, 19100, 20500, 22000, 23500, 25000],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Orders',
        data: [150, 165, 180, 160, 190, 210, 220, 230, 245, 260, 280, 300],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      }
    ]
  }), []);
  
  const mockCategoryData = useMemo(() => ({
    labels: ['Electronics', 'Clothing', 'Home & Kitchen', 'Smartphones', 'Wearables', 'Audio'],
    datasets: [
      {
        label: 'Sales by Category',
        data: [35, 25, 15, 12, 8, 5],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }), []);
  
  const mockCustomerData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'New Customers',
        data: [45, 52, 60, 55, 65, 75, 80, 85, 90, 95, 100, 110],
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
      },
      {
        label: 'Returning Customers',
        data: [30, 35, 40, 38, 45, 50, 55, 60, 65, 70, 75, 80],
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
      }
    ]
  }), []);
  
  // State for analytics data
  const [salesData, setSalesData] = useState({
    labels: [],
    datasets: []
  });
  const [categoryData, setCategoryData] = useState({
    labels: [],
    datasets: []
  });
  const [customerData, setCustomerData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for summary metrics - initialize with mock data values
  const [totalRevenue, setTotalRevenue] = useState(
    mockSalesData.datasets[0].data.reduce((sum, value) => sum + value, 0)
  );
  const [totalOrders, setTotalOrders] = useState(
    mockSalesData.datasets[1].data.reduce((sum, value) => sum + value, 0)
  );
  const [totalCustomers, setTotalCustomers] = useState(
    mockCustomerData.datasets[0].data.reduce((sum, value) => sum + value, 0) +
    mockCustomerData.datasets[1].data.reduce((sum, value) => sum + value, 0)
  );
  const [revenueGrowth, setRevenueGrowth] = useState(12.5); // Default 12.5% growth
  const [ordersGrowth] = useState(8.3);   // Default 8.3% growth
  const [customersGrowth, setCustomersGrowth] = useState(15.2); // Default 15.2% growth
  
  // State for date range filter
  const [dateRange, setDateRange] = useState('month'); // week, month, year
  // Define fetchAnalyticsData function outside of useEffect
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = { period: dateRange };
      
      try {
        // Fetch sales data (revenue and orders)
        const salesResponse = await adminApi.getAnalyticsSales(params);
        const salesResponseData = salesResponse.data.data || salesResponse.data;
        
        // Extract chart data and metrics
        let salesData = salesResponseData.chartData || { labels: [], datasets: [] };
        const salesMetrics = salesResponseData.metrics || {
          totalRevenue: 0,
          totalOrders: 0,
          revenueGrowth: '0%',
          ordersGrowth: '0%'
        };
        
        // Process sales data in chunks if it's large
        if (salesData && Array.isArray(salesData.labels) && salesData.labels.length > 100) {
          // Process in chunks of 100 data points
          const processedLabels = [];
          const processedDatasets = salesData.datasets.map(dataset => ({
            ...dataset,
            data: []
          }));
          
          // Process data in chunks
          for (let i = 0; i < salesData.labels.length; i += 100) {
            const chunkLabels = salesData.labels.slice(i, i + 100);
            processedLabels.push(...chunkLabels);
            
            salesData.datasets.forEach((dataset, datasetIndex) => {
              const chunkData = dataset.data.slice(i, i + 100);
              processedDatasets[datasetIndex].data.push(...chunkData);
            });
          }
          
          salesData = {
            labels: processedLabels,
            datasets: processedDatasets
          };
        }
        
        // Ensure salesData has the expected structure
        if (!salesData.datasets) {
          salesData.datasets = [];
        }
        
        // Update state with sales data
        setSalesData(salesData);
        
        // Update summary metrics
        setTotalRevenue(salesMetrics.totalRevenue || 0);
        setTotalOrders(salesMetrics.totalOrders || 0);
        setRevenueGrowth(parseFloat(salesMetrics.revenueGrowth) || 0);
        
        // Fetch category data
        const categoryResponse = await adminApi.getAnalyticsCategories(params);
        const categoryResponseData = categoryResponse.data.data || categoryResponse.data;
        
        // Extract chart data and insights
        let categoryData = categoryResponseData.chartData || { labels: [], datasets: [] };
        // Store insights data for potential future use
        // const categoryInsights = categoryResponseData.insights || [];
        // const topCategory = categoryResponseData.topCategory || { name: '', percentage: '0%', growth: '0%' };
        
        // Ensure categoryData has the expected structure
        if (!categoryData.datasets) {
          categoryData.datasets = [];
        }
        
        // Update state with category data
        setCategoryData(categoryData);
        
        // Fetch customer data
        const customerResponse = await adminApi.getAnalyticsCustomers(params);
        const customerResponseData = customerResponse.data.data || customerResponse.data;
        
        // Extract chart data and metrics
        let customerData = customerResponseData.chartData || { labels: [], datasets: [] };
        const customerMetrics = customerResponseData.metrics || {
          totalCustomers: 0,
          newCustomers: 0,
          returningCustomers: 0,
          customersGrowth: '0%',
          retentionRate: '0%',
          churnRate: '0%'
        };
        // Store demographics data for potential future use
        // const customerDemographics = customerResponseData.demographics || {};
        
        // Ensure customerData has the expected structure
        if (!customerData.datasets) {
          customerData.datasets = [];
        }
        
        // Process customer data in chunks if it's large
        if (customerData && Array.isArray(customerData.labels) && customerData.labels.length > 100) {
          // Process in chunks of 100 data points
          const processedLabels = [];
          const processedDatasets = customerData.datasets.map(dataset => ({
            ...dataset,
            data: []
          }));
          
          // Process data in chunks
          for (let i = 0; i < customerData.labels.length; i += 100) {
            const chunkLabels = customerData.labels.slice(i, i + 100);
            processedLabels.push(...chunkLabels);
            
            customerData.datasets.forEach((dataset, datasetIndex) => {
              const chunkData = dataset.data.slice(i, i + 100);
              processedDatasets[datasetIndex].data.push(...chunkData);
            });
          }
          
          customerData = {
            labels: processedLabels,
            datasets: processedDatasets
          };
        }
        
        // Update state with customer data
        setCustomerData(customerData);
        
        // Update summary metrics
        setTotalCustomers(customerMetrics.totalCustomers || 0);
        setCustomersGrowth(parseFloat(customerMetrics.customersGrowth) || 0);
      } catch (apiError) {
        console.warn('API call failed, using mock data instead:', apiError);
        
        // Fallback to mock data if API fails
        setSalesData(mockSalesData);
        setCategoryData(mockCategoryData);
        setCustomerData(mockCustomerData);
        
        // Set default metrics from mock data
        setTotalRevenue(mockSalesData.datasets[0].data.reduce((sum, value) => sum + value, 0));
        setTotalOrders(mockSalesData.datasets[1].data.reduce((sum, value) => sum + value, 0));
        setTotalCustomers(
          mockCustomerData.datasets[0].data.reduce((sum, value) => sum + value, 0) +
          mockCustomerData.datasets[1].data.reduce((sum, value) => sum + value, 0)
        );
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch analytics data. Using mock data instead.');
      
      // Fallback to mock data
      setSalesData(mockSalesData);
      setCategoryData(mockCategoryData);
      setCustomerData(mockCustomerData);
      
      // Set default metrics from mock data
      setTotalRevenue(mockSalesData.datasets[0].data.reduce((sum, value) => sum + value, 0));
      setTotalOrders(mockSalesData.datasets[1].data.reduce((sum, value) => sum + value, 0));
      setTotalCustomers(
        mockCustomerData.datasets[0].data.reduce((sum, value) => sum + value, 0) +
        mockCustomerData.datasets[1].data.reduce((sum, value) => sum + value, 0)
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch analytics data on component mount
  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Fetch data when date range changes
  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);
  
  // Options for the charts
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue & Orders Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Customer Acquisition',
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
        position: 'right',
      },
      title: {
        display: true,
        text: 'Sales by Category',
      },
    },
  };
  
  // Fetch data when date range changes
  useEffect(() => {
    // Call the fetchAnalyticsData function defined above
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // Export report functionality - fetch fresh data from API
  const exportReport = async () => {
    try {
      console.log('Export Debug - Starting fresh data fetch for export...');
      
      // Fetch fresh analytics data directly from API for export
      const params = { period: dateRange };
      let freshReportData = {
        summary: {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
          customersGrowth: 0,
          dateRange,
          generatedAt: new Date().toISOString()
        },
        salesData: {
          labels: [],
          revenue: [],
          orders: []
        },
        categoryData: {
          categories: [],
          sales: []
        },
        customerData: {
          periods: [],
          newCustomers: [],
          returningCustomers: []
        }
      };
      
      try {
        // Fetch fresh sales data
        const salesResponse = await adminApi.getAnalyticsSales(params);
        const salesResponseData = salesResponse.data.data || salesResponse.data;
        const salesMetrics = salesResponseData.metrics || {};
        const salesChartData = salesResponseData.chartData || { labels: [], datasets: [] };
        
        // Update summary with fresh sales data
        freshReportData.summary.totalRevenue = salesMetrics.totalRevenue || 0;
        freshReportData.summary.totalOrders = salesMetrics.totalOrders || 0;
        freshReportData.summary.revenueGrowth = parseFloat(salesMetrics.revenueGrowth) || 0;
        
        // Update sales chart data
        freshReportData.salesData.labels = salesChartData.labels || [];
        freshReportData.salesData.revenue = salesChartData.datasets?.find(d => d.label === 'Revenue' || d.label === 'revenue')?.data || [];
        freshReportData.salesData.orders = salesChartData.datasets?.find(d => d.label === 'Orders' || d.label === 'orders')?.data || [];
        
        console.log('Export Debug - Fresh sales data:', {
          totalRevenue: freshReportData.summary.totalRevenue,
          totalOrders: freshReportData.summary.totalOrders,
          salesLabels: freshReportData.salesData.labels.length,
          revenueData: freshReportData.salesData.revenue.length
        });
        
        // Fetch fresh category data
        const categoryResponse = await adminApi.getAnalyticsCategories(params);
        const categoryResponseData = categoryResponse.data.data || categoryResponse.data;
        const categoryChartData = categoryResponseData.chartData || { labels: [], datasets: [] };
        
        freshReportData.categoryData.categories = categoryChartData.labels || [];
        freshReportData.categoryData.sales = categoryChartData.datasets?.[0]?.data || [];
        
        // Fetch fresh customer data
        const customerResponse = await adminApi.getAnalyticsCustomers(params);
        const customerResponseData = customerResponse.data.data || customerResponse.data;
        const customerMetrics = customerResponseData.metrics || {};
        const customerChartData = customerResponseData.chartData || { labels: [], datasets: [] };
        
        // Update summary with fresh customer data
        freshReportData.summary.totalCustomers = customerMetrics.totalCustomers || 0;
        freshReportData.summary.customersGrowth = parseFloat(customerMetrics.customersGrowth) || 0;
        
        // Update customer chart data
        freshReportData.customerData.periods = customerChartData.labels || [];
        freshReportData.customerData.newCustomers = customerChartData.datasets?.find(d => d.label === 'New Customers' || d.label === 'new_customers')?.data || [];
        freshReportData.customerData.returningCustomers = customerChartData.datasets?.find(d => d.label === 'Returning Customers' || d.label === 'returning_customers')?.data || [];
        
      } catch (apiError) {
        console.warn('Fresh API fetch failed, using current state data:', apiError);
        // Fallback to current state data if API fails
        freshReportData = {
          summary: {
            totalRevenue: totalRevenue || 0,
            totalOrders: totalOrders || 0,
            totalCustomers: totalCustomers || 0,
            revenueGrowth: revenueGrowth || 0,
            ordersGrowth: ordersGrowth || 0,
            customersGrowth: customersGrowth || 0,
            dateRange,
            generatedAt: new Date().toISOString()
          },
          salesData: {
            labels: salesData?.labels || [],
            revenue: salesData?.datasets?.find(d => d.label === 'Revenue' || d.label === 'revenue')?.data || [],
            orders: salesData?.datasets?.find(d => d.label === 'Orders' || d.label === 'orders')?.data || []
          },
          categoryData: {
            categories: categoryData?.labels || [],
            sales: categoryData?.datasets?.[0]?.data || []
          },
          customerData: {
            periods: customerData?.labels || [],
            newCustomers: customerData?.datasets?.find(d => d.label === 'New Customers' || d.label === 'new_customers')?.data || [],
            returningCustomers: customerData?.datasets?.find(d => d.label === 'Returning Customers' || d.label === 'returning_customers')?.data || []
          }
        };
      }
      
      // Debug: Log final report data
      console.log('Export Debug - Final report data:', freshReportData);
      
      const reportData = freshReportData;

      // Generate CSV content
      let csvContent = 'QuickMart Analytics Report\n';
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Date Range: ${dateRange}\n\n`;
      
      // Summary section
      csvContent += 'SUMMARY METRICS\n';
      csvContent += 'Metric,Value,Growth\n';
      csvContent += `Total Revenue,$${(reportData.summary.totalRevenue || 0).toLocaleString()},${reportData.summary.revenueGrowth || 0}%\n`;
      csvContent += `Total Orders,${(reportData.summary.totalOrders || 0).toLocaleString()},${reportData.summary.ordersGrowth || 0}%\n`;
      csvContent += `Total Customers,${(reportData.summary.totalCustomers || 0).toLocaleString()},${reportData.summary.customersGrowth || 0}%\n\n`;
      
      // Sales data section
      if (reportData.salesData.labels.length > 0) {
        csvContent += 'SALES DATA\n';
        csvContent += 'Period,Revenue,Orders\n';
        reportData.salesData.labels.forEach((label, index) => {
          const revenue = reportData.salesData.revenue[index] || 0;
          const orders = reportData.salesData.orders[index] || 0;
          csvContent += `${label},$${revenue.toLocaleString()},${orders}\n`;
        });
        csvContent += '\n';
      } else {
        csvContent += 'SALES DATA\n';
        csvContent += 'No sales data available for the selected period\n\n';
      }
      
      // Category data section
      if (reportData.categoryData.categories.length > 0) {
        csvContent += 'CATEGORY SALES\n';
        csvContent += 'Category,Sales Percentage\n';
        reportData.categoryData.categories.forEach((category, index) => {
          const sales = reportData.categoryData.sales[index] || 0;
          csvContent += `${category},${sales}%\n`;
        });
        csvContent += '\n';
      } else {
        csvContent += 'CATEGORY SALES\n';
        csvContent += 'No category data available for the selected period\n\n';
      }
      
      // Customer data section
      if (reportData.customerData.periods.length > 0) {
        csvContent += 'CUSTOMER ACQUISITION\n';
        csvContent += 'Period,New Customers,Returning Customers\n';
        reportData.customerData.periods.forEach((period, index) => {
          const newCustomers = reportData.customerData.newCustomers[index] || 0;
          const returningCustomers = reportData.customerData.returningCustomers[index] || 0;
          csvContent += `${period},${newCustomers},${returningCustomers}\n`;
        });
      } else {
        csvContent += 'CUSTOMER ACQUISITION\n';
        csvContent += 'No customer data available for the selected period\n';
      }
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename with current date and time
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      const filename = `QuickMart_Analytics_Report_${dateRange}_${dateStr}_${timeStr}.csv`;
      
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Analytics report exported successfully:', filename);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error generating report. Please try again.');
    }
  };
  
  return (
    <div className="admin-analytics">
      <div className="page-header mb-4">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="text-muted">Comprehensive sales and customer analytics</p>
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
                  <option value="quarter">Last 90 Days</option>
                  <option value="year">Last 12 Months</option>
                </Form.Select>
                <Button 
                  variant="outline-primary" 
                  onClick={exportReport}
                  disabled={loading}
                >
                  <BsDownload className="me-2" />
                  {loading ? 'Loading...' : 'Export Report'}
                </Button>
              </div>
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
      
      {/* Summary Cards */}
      <Row className="mb-4">
        <Col lg={4} md={6} className="mb-4 mb-lg-0">
          <Card className="admin-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-subtitle text-muted">Total Revenue</h6>
                <div className={`trend ${revenueGrowth >= 0 ? 'trend-up' : 'trend-down'}`}>
                  {revenueGrowth >= 0 ? <BsArrowUp /> : <BsArrowDown />}
                  <span>{Math.abs(revenueGrowth)}%</span>
                </div>
              </div>
              <h3 className="card-value">${(totalRevenue / 1000).toFixed(1)}k</h3>
              <p className="text-muted small">Compared to previous period</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} md={6} className="mb-4 mb-lg-0">
          <Card className="admin-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-subtitle text-muted">Total Orders</h6>
                <div className={`trend ${ordersGrowth >= 0 ? 'trend-up' : 'trend-down'}`}>
                  {ordersGrowth >= 0 ? <BsArrowUp /> : <BsArrowDown />}
                  <span>{Math.abs(ordersGrowth)}%</span>
                </div>
              </div>
              <h3 className="card-value">{totalOrders}</h3>
              <p className="text-muted small">Compared to previous period</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} md={12}>
          <Card className="admin-card h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="card-subtitle text-muted">Total Customers</h6>
                <div className={`trend ${customersGrowth >= 0 ? 'trend-up' : 'trend-down'}`}>
                  {customersGrowth >= 0 ? <BsArrowUp /> : <BsArrowDown />}
                  <span>{Math.abs(customersGrowth)}%</span>
                </div>
              </div>
              <h3 className="card-value">{totalCustomers}</h3>
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
      
      <Row>
        <Col>
          <Card className="admin-card">
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading customer data...</p>
                </div>
              ) : (
                <Bar data={customerData} options={barChartOptions} />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;
