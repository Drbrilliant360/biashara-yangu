
import { v4 as uuidv4 } from 'uuid';

// Palm Pesa API configuration
const PALM_PESA_API = {
  BASE_URL: 'https://palmpesa.drmlelwa.co.tz',
  USER_ID: '25', // This should be replaced with your actual user ID
  API_TOKEN: 'jqSao6crtBmAo1Cie047ZonWdQXEyaOOstXk7GG5s34FyPHlVEn63fDjkrFO',
  TILL_NUMBER: 'TILL61103867',
};

// Types for the API
interface PaymentRequest {
  name: string;
  email: string;
  phone: string;
  amount: number;
}

interface PaymentResponse {
  paymentUrl?: string;
  orderId?: string;
  error?: string;
}

/**
 * Initiates a payment via Palm Pesa's process-payment endpoint
 */
export const initiatePayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    const orderId = `ORDER-${uuidv4().substring(0, 8)}-${Date.now()}`;
    
    const response = await fetch(`${PALM_PESA_API.BASE_URL}/api/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PALM_PESA_API.API_TOKEN}`,
      },
      body: JSON.stringify({
        user_id: PALM_PESA_API.USER_ID,
        vendor: PALM_PESA_API.TILL_NUMBER, 
        order_id: orderId,
        buyer_email: request.email,
        buyer_name: request.name,
        buyer_phone: request.phone,
        amount: request.amount,
        currency: "TZS",
        redirect_url: window.location.origin + "/settings",
        cancel_url: window.location.origin + "/settings",
        webhook: window.location.origin + "/api/payment-webhook", // This would need backend implementation
        buyer_remarks: "Monthly subscription payment",
        merchant_remarks: "Biashara Yangu Subscription",
        no_of_items: 1
      })
    });

    // For development/POC
    // Simulate successful response since we can't actually hit the API in this environment
    console.log('Payment initiated with payload:', {
      name: request.name,
      email: request.email,
      phone: request.phone,
      amount: request.amount,
      orderId
    });
    
    // In a real implementation, you would parse the actual API response
    // const data = await response.json();
    
    // Mock response for demo purposes
    const mockData = {
      error: "sharable payment link", 
      raw: {
        payment_gateway_url: `https://tz.selcom.online/paymentgw/checkout/MockPaymentLink${orderId}`
      }
    };
    
    return {
      paymentUrl: mockData.raw.payment_gateway_url,
      orderId,
    };
    
  } catch (error) {
    console.error('Error initiating payment:', error);
    return {
      error: 'Failed to process payment request',
    };
  }
};

/**
 * Checks the status of a payment order
 */
export const checkOrderStatus = async (orderId: string) => {
  try {
    const response = await fetch(`${PALM_PESA_API.BASE_URL}/api/order-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PALM_PESA_API.API_TOKEN}`,
      },
      body: JSON.stringify({
        order_id: orderId
      })
    });
    
    // In a real implementation, you would parse the actual API response
    // const data = await response.json();
    
    // Mock response for demo purposes
    return {
      status: 'PENDING', // or 'COMPLETED', 'FAILED', etc.
      message: 'Payment status check successful'
    };
    
  } catch (error) {
    console.error('Error checking order status:', error);
    throw new Error('Failed to check payment status');
  }
};
