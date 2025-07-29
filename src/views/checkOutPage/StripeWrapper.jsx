import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';
import { Spinner, Form, Button } from 'react-bootstrap';
import { useToast } from '../../components/ToastNotification';

// Load Stripe.js asynchronously
const stripePromise = loadStripe('pk_test_51RfS2yPkHyjUMySX2nTBL3UP3F4AmhCyaJQHUfWCPKiKXBwS0MGM80751v7GfEdiADA3FcAy4RYSSHrj8Ndk0N3w00S9Uh8ZoI');

function StripeWrapper({ onPaymentMethod, orderId, clientSecret: propClientSecret }) {
  const [clientSecret, setClientSecret] = useState(propClientSecret || '');
  const [loading, setLoading] = useState(!propClientSecret);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Use ref to track component mount state
  const isMounted = React.useRef(true);

  // Effect for component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Effect to update clientSecret when prop changes
  useEffect(() => {
    if (propClientSecret) {
      setClientSecret(propClientSecret);
      setLoading(false);
    }
  }, [propClientSecret]);

  // No need to fetch payment intent as we're now receiving it from props

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
      },
    },
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Initializing payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
        <button 
          className="btn btn-outline-danger mt-2" 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="alert alert-warning">
        Payment system is initializing. Please wait...
      </div>
    );
  }

  // Show error state or loading state
  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Initializing payment...</p>
      </div>
    );
  }

  // If we have an error or no client secret, show the fallback UI
  if (error || !clientSecret) {
    // Only show the error message once when it first appears
    if (error) {
      toast.error('Payment initialization failed. Please try again.');
    }
    
    return (
      <div className="p-4 border rounded">
        <h5>Payment Method: Credit Card</h5>
        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
            <p>Using simulation mode instead.</p>
          </div>
        )}
        {!error && (
          <p className="text-muted mb-3">
            Stripe payment is currently in development mode. The backend API for payment intents is not available.
          </p>
        )}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Card Number</Form.Label>
            <Form.Control type="text" placeholder="4242 4242 4242 4242" disabled />
          </Form.Group>
          <div className="d-flex gap-2">
            <Form.Group className="mb-3 flex-grow-1">
              <Form.Label>Expiry Date</Form.Label>
              <Form.Control type="text" placeholder="MM/YY" disabled />
            </Form.Group>
            <Form.Group className="mb-3 flex-grow-1">
              <Form.Label>CVC</Form.Label>
              <Form.Control type="text" placeholder="123" disabled />
            </Form.Group>
          </div>
          <Button 
            variant="primary" 
            className="w-100"
            onClick={() => {
              // Simulate a successful payment
              toast.success('Payment simulation successful!');
              onPaymentMethod({
                id: 'sim_' + Math.random().toString(36).substring(2),
                status: 'succeeded',
                type: 'card'
              });
            }}
          >
            Simulate Payment
          </Button>
          <div className="mt-2 text-center text-muted">
            <small>This is a simulation. No actual payment will be processed.</small>
          </div>
        </Form>
      </div>
    );
  }

  // If we have a valid client secret, render the actual Stripe Elements
  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentForm 
        onPaymentMethod={onPaymentMethod} 
        clientSecret={clientSecret} 
      />
    </Elements>
  );
}

export default StripeWrapper;
