import { createHash } from 'crypto';

const freedomPayConfig = { secretKey: 'B9RZWYnQFBVZ2fhT' };
const params = {
  pg_amount: 345,
  pg_check_url: 'https://10e2-103-223-15-43.ngrok-free.app/api/payments/check',
  pg_currency: 'KZT',
  pg_description: 'Payment for order 56722',
  pg_failure_url: 'https://10e2-103-223-15-43.ngrok-free.app/payment/failure',
  pg_failure_url_method: 'GET',
  pg_lifetime: 86400,
  pg_merchant_id: '555419',
  pg_order_id: '56722',
  pg_request_method: 'POST',
  pg_result_url: 'https://10e2-103-223-15-43.ngrok-free.app/api/payments/result',
  pg_salt: '0q3fd0kpdbd9', // Update with your latest salt
  pg_success_url: 'https://10e2-103-223-15-43.ngrok-free.app/payment/success',
  pg_success_url_method: 'GET',
};

const sortedKeys = Object.keys(params).sort();
let signatureString = '';
for (const key of sortedKeys) {
  const value = typeof params[key] === 'number' ? params[key].toString() : params[key];
  signatureString += (signatureString ? ';' : '') + value;
}
signatureString += `;${freedomPayConfig.secretKey}`;

console.log('Signature string:', signatureString);
const signature = createHash('md5').update(signatureString).digest('hex');
console.log('Generated signature:', signature);