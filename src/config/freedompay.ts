import { configDotenv } from "dotenv";

configDotenv();

export const freedomPayConfig = {
  merchantId: process.env.FREEDOMPAY_MERCHANT_ID || '',
  secretKey: process.env.FREEDOMPAY_SECRET_KEY || '',
  apiUrl: process.env.FREEDOMPAY_API_URL || 'https://api.freedompay.kz',
  testingMode: process.env.FREEDOMPAY_TESTING_MODE === '1',
  
  // URLs for callbacks
  checkUrl: `${process.env.BACKEND_URL}/api/payments/check`,
  resultUrl: `${process.env.BACKEND_URL}/api/payments/result`,
  successUrl: `${process.env.BACKEND_URL}/payment/success`,
  failureUrl: `${process.env.BACKEND_URL}/payment/failure`,
  
  // Default settings
  requestMethod: 'POST',
  successUrlMethod: 'GET',
  failureUrlMethod: 'GET',
  lifetime: 86400, // 24 hours in seconds
  currency: 'KZT',
};
