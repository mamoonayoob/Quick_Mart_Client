import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, Button } from 'react-bootstrap';
import { getOrders } from '../../helpers/apiHelpers';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const response = await getOrders();
        console.log(response);
        if (response && response.success && response.data) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrdersError('Failed to load your orders. Please try again.');
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div>
      <h4 className="mb-4 text-danger">My Orders</h4>
      <Card className="shadow-sm">
        <Card.Body>
          {ordersLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="danger" />
              <p className="mt-2">Loading your orders...</p>
            </div>
          ) : ordersError ? (
            <Alert variant="danger">{ordersError}</Alert>
          ) : orders?.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="fas fa-shopping-cart fa-3x text-muted"></i>
              </div>
              <h5 className="text-muted">No Orders Yet</h5>
              <p className="text-muted">You haven't placed any orders yet. Start shopping to see your orders here!</p>
              <Button variant="danger" href="/">Start Shopping</Button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Order Status</th>
                    <th>Payment Status</th>
                    <th>Delivery Status</th>
                    <th>Payment Method</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders?.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <strong>#{order._id.substring(0, 8)}</strong>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className="badge bg-secondary">{order.orderItems.length} items</span>
                      </td>
                      <td>
                        <strong>Rs {order.itemsPrice?.toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`badge bg-${
                          order.orderStatus === 'completed' ? 'success' :
                          order.orderStatus === 'processing' ? 'warning' :
                          order.orderStatus === 'pending' ? 'secondary' : 'info'
                        }`}>
                          {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${
                          order.paymentStatus === 'completed' ? 'success' :
                          order.paymentStatus === 'processing' ? 'warning' :
                          order.paymentStatus === 'pending' ? 'secondary' : 'info'
                        }`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${
                          order.deliveryStatus === 'delivered' ? 'success' :
                          order.deliveryStatus === 'processing' ? 'warning' :
                          order.deliveryStatus === 'pending' ? 'secondary' : 'info'
                        }`}>
                          {order.deliveryStatus.charAt(0).toUpperCase() + order.deliveryStatus.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className="text-uppercase fw-semibold">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <Button variant="outline-danger" size="sm">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CustomerOrders;
