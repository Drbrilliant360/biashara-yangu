
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
  message?: string;
  status?: string;
  error?: string;
}

/**
 * Initiates a direct mobile money payment via Palm Pesa's pay-via-mobile endpoint
 * This will send a USSD prompt to the user's phone
 */
export const initiatePayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
  try {
    const transactionId = `TXN-${uuidv4().substring(0, 8)}-${Date.now()}`;
    
    // Log the request for debugging
    console.log('Initiating mobile payment with payload:', {
      name: request.name,
      email: request.email,
      phone: request.phone,
      amount: request.amount,
      transactionId
    });

    // In a production environment, this would be a real API call to Palm Pesa
    // For demo/development purposes, we're using a mock response
    
    // Mock successful payment initiation
    // Simulate a short delay to mimic network request
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mobile money payments return different response structure
    return {
      status: 'PENDING',
      message: 'Payment request sent to user\'s phone. Please check your phone and enter PIN to complete payment.',
      orderId: `SELCOM-${Date.now()}`,
    };
    
  } catch (error) {
    console.error('Error in mobile payment service:', error);
    return {
      error: 'Failed to process mobile payment request (mock service)',
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
