import { configDotenv } from "dotenv";

configDotenv();

export const freedomPayConfig = {
  merchantId: process.env.FREEDOMPAY_MERCHANT_ID || '555419',
  secretKey: process.env.FREEDOMPAY_SECRET_KEY || 'B9RZWYnQFBVZ2fhT',
  apiUrl: process.env.FREEDOMPAY_API_URL || 'https://api.freedompay.kz/init_payment.php',
  testingMode: process.env.FREEDOMPAY_TESTING_MODE === '0',
  checkUrl: `${process.env.BACKEND_URL}/api/payments/check`,
  resultUrl: `${process.env.BACKEND_URL}/api/payments/result`,
  successUrl: `${process.env.BACKEND_URL}/api/payments/success`,
  failureUrl: `${process.env.BACKEND_URL}/api/payments/failure`,
  requestMethod: 'POST',
  lifetime: 86400,
  currency: 'KZT',
};
