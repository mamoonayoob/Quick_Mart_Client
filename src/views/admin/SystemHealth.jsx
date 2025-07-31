import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Badge, 
  Button,
  ProgressBar,
  Spinner,
  Alert,
  Table
} from 'react-bootstrap';
import { 
  BsServer, 
  BsDatabase, 
  BsHddNetwork, 
  BsSpeedometer, 
  BsClockHistory,
  BsCheckCircle,
  BsXCircle,
  BsExclamationTriangle,
  BsArrowClockwise
} from 'react-icons/bs';
import { adminApi } from '../../services/api';

const SystemHealth = () => {
  // State for system health data
  const [systemHealth, setSystemHealth] = useState({
    status: 'unknown',
    uptime: 0,
    serverLoad: {
      cpu: 0,
      memory: 0,
      disk: 0
    },
    services: [],
    databaseStatus: {
      status: 'unknown',
      responseTime: 0,
      connections: 0
    },
    apiEndpoints: []
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Mock data for fallback
  const mockSystemHealth = useMemo(() => ({
    status: 'healthy',
    uptime: 1209600, // 14 days in seconds
    serverLoad: {
      cpu: 42,
      memory: 68,
      disk: 57
    },
    services: [
      { name: 'Web Server', status: 'online', responseTime: 120 },
      { name: 'Authentication Service', status: 'online', responseTime: 95 },
      { name: 'Payment Gateway', status: 'online', responseTime: 210 },
      { name: 'Email Service', status: 'warning', responseTime: 450 },
      { name: 'Search Service', status: 'online', responseTime: 180 }
    ],
    databaseStatus: {
      status: 'healthy',
      responseTime: 85,
      connections: 24
    },
    apiEndpoints: [
      { path: '/api/products', status: 'healthy', responseTime: 110 },
      { path: '/api/users', status: 'healthy', responseTime: 95 },
      { path: '/api/orders', status: 'healthy', responseTime: 130 },
      { path: '/api/auth', status: 'healthy', responseTime: 75 },
      { path: '/api/payments', status: 'warning', responseTime: 320 }
    ]
  }), []);

  // Fetch system health data
  const fetchSystemHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getSystemHealth();
      setSystemHealth(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching system health:', err);
      setError('Failed to load system health data. Using mock data instead.');
      setSystemHealth(mockSystemHealth); // Fallback to mock data
      setLoading(false);
    }
  }, [mockSystemHealth]);

  // Initial data fetch
  useEffect(() => {
    fetchSystemHealth();
  }, [fetchSystemHealth]);

  // Set up auto-refresh if enabled
  useEffect(() => {
    let intervalId;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchSystemHealth();
      }, refreshInterval * 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, fetchSystemHealth]);

  // Format uptime from seconds to days, hours, minutes
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Get variant color based on status
  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'offline':
      case 'error':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Get icon based on status
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'healthy':
        return <BsCheckCircle className="text-success" />;
      case 'warning':
        return <BsExclamationTriangle className="text-warning" />;
      case 'offline':
      case 'error':
        return <BsXCircle className="text-danger" />;
      default:
        return null;
    }
  };

  // Get progress bar variant based on value
  const getLoadVariant = (value) => {
    if (value < 50) return 'success';
    if (value < 80) return 'warning';
    return 'danger';
  };

  return (
    <div className="system-health-container">
      <h2 className="page-title mb-4">System Health</h2>
      
      {/* Refresh controls */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button 
            variant="outline-primary" 
            onClick={fetchSystemHealth}
            disabled={loading}
            className="me-2"
          >
            <BsArrowClockwise className="me-2" />
            Refresh Now
          </Button>
          <div className="form-check form-switch d-inline-block ms-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoRefreshSwitch"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="autoRefreshSwitch">
              Auto-refresh every {refreshInterval} seconds
            </label>
          </div>
        </div>
        {autoRefresh && (
          <select 
            className="form-select w-auto" 
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          >
            <option value="10">10 seconds</option>
            <option value="30">30 seconds</option>
            <option value="60">1 minute</option>
            <option value="300">5 minutes</option>
          </select>
        )}
      </div>
      
      {error && (
        <Alert variant="warning" className="mb-4">
          {error}
        </Alert>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading system health data...</p>
        </div>
      ) : (
        <>
          {/* System Overview */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-box bg-light-primary me-3">
                      <BsServer />
                    </div>
                    <h5 className="card-title mb-0">System Status</h5>
                  </div>
                  <h3>
                    <Badge bg={getStatusVariant(systemHealth.status)}>
                      {systemHealth.status.toUpperCase()}
                    </Badge>
                  </h3>
                  <p className="text-muted">
                    Uptime: {formatUptime(systemHealth.uptime)}
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-box bg-light-info me-3">
                      <BsSpeedometer />
                    </div>
                    <h5 className="card-title mb-0">CPU Usage</h5>
                  </div>
                  <h3>{systemHealth.serverLoad.cpu}%</h3>
                  <ProgressBar 
                    now={systemHealth.serverLoad.cpu} 
                    variant={getLoadVariant(systemHealth.serverLoad.cpu)} 
                    className="mt-2"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-box bg-light-warning me-3">
                      <BsHddNetwork />
                    </div>
                    <h5 className="card-title mb-0">Memory Usage</h5>
                  </div>
                  <h3>{systemHealth.serverLoad.memory}%</h3>
                  <ProgressBar 
                    now={systemHealth.serverLoad.memory} 
                    variant={getLoadVariant(systemHealth.serverLoad.memory)} 
                    className="mt-2"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100">
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-box bg-light-danger me-3">
                      <BsDatabase />
                    </div>
                    <h5 className="card-title mb-0">Disk Usage</h5>
                  </div>
                  <h3>{systemHealth.serverLoad.disk}%</h3>
                  <ProgressBar 
                    now={systemHealth.serverLoad.disk} 
                    variant={getLoadVariant(systemHealth.serverLoad.disk)} 
                    className="mt-2"
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Database Status */}
          <Row className="mb-4">
            <Col md={12}>
              <Card>
                <Card.Body>
                  <h5 className="card-title mb-4">Database Status</h5>
                  <Row>
                    <Col md={4}>
                      <div className="d-flex align-items-center mb-3">
                        <div className="icon-box bg-light-primary me-3">
                          <BsDatabase />
                        </div>
                        <div>
                          <h6 className="mb-0">Status</h6>
                          <Badge bg={getStatusVariant(systemHealth.databaseStatus.status)}>
                            {systemHealth.databaseStatus.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="d-flex align-items-center mb-3">
                        <div className="icon-box bg-light-info me-3">
                          <BsClockHistory />
                        </div>
                        <div>
                          <h6 className="mb-0">Response Time</h6>
                          <p className="mb-0">{systemHealth.databaseStatus.responseTime} ms</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="d-flex align-items-center mb-3">
                        <div className="icon-box bg-light-success me-3">
                          <BsHddNetwork />
                        </div>
                        <div>
                          <h6 className="mb-0">Active Connections</h6>
                          <p className="mb-0">{systemHealth.databaseStatus.connections}</p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Services Status */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <h5 className="card-title mb-4">Services Status</h5>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Status</th>
                        <th>Response Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemHealth.services.map((service, index) => (
                        <tr key={index}>
                          <td>{service.name}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              {getStatusIcon(service.status)}
                              <span className="ms-2">{service.status}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">{service.responseTime} ms</span>
                              <ProgressBar 
                                now={Math.min(100, service.responseTime / 5)} 
                                variant={
                                  service.responseTime < 200 ? 'success' : 
                                  service.responseTime < 400 ? 'warning' : 'danger'
                                }
                                style={{ width: '100px', height: '6px' }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
            
            {/* API Endpoints */}
            <Col md={6}>
              <Card>
                <Card.Body>
                  <h5 className="card-title mb-4">API Endpoints</h5>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Endpoint</th>
                        <th>Status</th>
                        <th>Response Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemHealth.apiEndpoints.map((endpoint, index) => (
                        <tr key={index}>
                          <td>{endpoint.path}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              {getStatusIcon(endpoint.status)}
                              <span className="ms-2">{endpoint.status}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">{endpoint.responseTime} ms</span>
                              <ProgressBar 
                                now={Math.min(100, endpoint.responseTime / 5)} 
                                variant={
                                  endpoint.responseTime < 200 ? 'success' : 
                                  endpoint.responseTime < 400 ? 'warning' : 'danger'
                                }
                                style={{ width: '100px', height: '6px' }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default SystemHealth;
