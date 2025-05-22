
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
 * Note: This is currently a mock implementation as we can't directly access the API from the browser
 */
export const initiatePayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    const orderId = `ORDER-${uuidv4().substring(0, 8)}-${Date.now()}`;
    
    // Log the request for debugging
    console.log('Initiating payment with payload:', {
      name: request.name,
      email: request.email,
      phone: request.phone,
      amount: request.amount,
      orderId
    });

    // In production, this would make a real API call to Palm Pesa
    // For demo/development, we use a mock response
    
    // Mock successful payment link
    const mockPaymentUrl = `https://tz.selcom.online/paymentgw/checkout/MockPayment${orderId}`;

    // Simulate a short delay to mimic network request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      paymentUrl: mockPaymentUrl,
      orderId,
    };
    
  } catch (error) {
    console.error('Error in mock payment service:', error);
    return {
      error: 'Failed to process payment request (mock service)',
    };
  }
};

/**
 * Checks the status of a payment order
 * Note: This is currently a mock implementation
 */
export const checkOrderStatus = async (orderId: string) => {
  try {
    console.log('Checking order status for:', orderId);
    
    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock response for demo purposes
    return {
      status: 'PENDING', // or 'COMPLETED', 'FAILED', etc.
      message: 'Payment status check successful (mock)'
    };
    
  } catch (error) {
    console.error('Error checking order status:', error);
    throw new Error('Failed to check payment status (mock service)');
  }
};
