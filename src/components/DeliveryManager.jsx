import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { vendorApi } from '../services/api';

/**
 * Delivery Manager Component
 * 
 * This component serves as a wrapper to handle API calls for delivery management
 * It fetches pending deliveries and delivery personnel data
 */
const DeliveryManager = ({ children, onDataLoaded }) => {
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch delivery data from API
  const fetchDeliveryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get real data from API
      const [ordersResponse, personnelResponse] = await Promise.all([
        vendorApi.getPendingDeliveries(),
        vendorApi.getDeliveryPersonnel()
      ]);
      
      // Process orders data
      if (ordersResponse.data && ordersResponse.data.success) {
        setPendingDeliveries(ordersResponse.data.orders || []);
      } else {
        throw new Error(ordersResponse.data?.message || 'Failed to fetch pending deliveries');
      }
      
      // Process personnel data
      if (personnelResponse.data && personnelResponse.data.success) {
        setDeliveryPersonnel(personnelResponse.data.personnel || []);
      } else {
        throw new Error(personnelResponse.data?.message || 'Failed to fetch delivery personnel');
      }
      
      // Notify parent component that data is loaded
      if (onDataLoaded) {
        onDataLoaded({
          pendingDeliveries: ordersResponse.data.orders || [],
          deliveryPersonnel: personnelResponse.data.personnel || []
        });
      }
    } catch (err) {
      console.error('Error fetching delivery data:', err);
      setError('Failed to load delivery data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [onDataLoaded]);
  
  // Load delivery data on component mount
  useEffect(() => {
    fetchDeliveryData();
  }, [fetchDeliveryData]);

  // Assign delivery to personnel
  const assignDelivery = async (orderId, personnelId, notes = '') => {
    try {
      const response = await vendorApi.assignDelivery({
        orderId,
        personnelId,
        notes
      });
      
      if (response.data && response.data.success) {
        // Refresh data after successful assignment
        fetchDeliveryData();
        return { success: true, message: 'Delivery assigned successfully' };
      } else {
        throw new Error(response.data?.message || 'Failed to assign delivery');
      }
    } catch (err) {
      console.error('Error assigning delivery:', err);
      return { 
        success: false, 
        message: err.message || 'Failed to assign delivery. Please try again.' 
      };
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading delivery data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-3">
        {error}
      </Alert>
    );
  }

  // Clone children with delivery data props
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        pendingDeliveries,
        deliveryPersonnel,
        assignDelivery,
        refreshData: fetchDeliveryData
      });
    }
    return child;
  });
};

export default DeliveryManager;
