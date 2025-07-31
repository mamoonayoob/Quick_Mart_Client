import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Form, Button, Spinner } from 'react-bootstrap';
import { useToast } from '../../components/ToastNotification';

// Card element styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

function StripePaymentForm({ onPaymentMethod, clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded
      toast.warning('Payment system is still loading. Please wait a moment.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get a reference to a mounted CardElement
      const cardElement = elements.getElement(CardElement);

      // Use the clientSecret from the payment intent to confirm the payment
      if (!clientSecret) {
        setError('Missing client secret. Cannot process payment.');
        toast.error('Payment configuration error. Please try again.');
        return;
      }
      
      console.log('Using client secret:', clientSecret);
      
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // You can collect these from the user if needed
            name: 'QuickMart Customer',
          },
        },
      });

      if (confirmError) {
        console.error('[Payment confirmation error]', confirmError);
        setError(confirmError.message);
        toast.error(`Payment failed: ${confirmError.message}`);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded
        toast.success('Payment successful!');
        // Pass the payment intent to the parent component
        onPaymentMethod({
          id: paymentIntent.id,
          status: paymentIntent.status,
          type: 'card'
        });
      } else {
        // Fallback to creating a payment method if confirmCardPayment isn't available
        // This is a backup approach and may not be needed if the payment intent flow works
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
        });

        if (error) {
          console.error('[Payment method error]', error);
          setError(error.message);
          toast.error(`Payment failed: ${error.message}`);
        } else {
          console.log('[PaymentMethod]', paymentMethod);
          toast.success('Payment method created successfully!');
          // Pass the payment method to the parent component
          onPaymentMethod(paymentMethod);
        }
      }
    } catch (err) {
      console.error('Unexpected payment error:', err);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="stripe-form">
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Card Details</Form.Label>
          <div className="card-element-container p-3 border rounded">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
          <small className="text-muted mt-2 d-block">
            For testing, use card number: 4242 4242 4242 4242, any future date, any 3 digits for CVC, and any 5 digits for postal code.
          </small>
        </Form.Group>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <Button 
          variant="primary" 
          type="submit" 
          disabled={!stripe || processing}
          className="w-100"
        >
          {processing ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Processing Payment...</span>
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </Form>
    </div>
  );
}

export default StripePaymentForm;
