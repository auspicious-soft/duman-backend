import axios from 'axios';
import { freedomPayConfig } from '../../config/freedompay';
import { Response } from 'express';
import { errorResponseHandler } from '../../lib/errors/error-response-handler';
import { httpStatusCode } from '../../lib/constant';
import { ordersModel } from '../../models/orders/orders-schema';
import { createHash } from 'crypto';
import { parseStringPromise } from 'xml2js';
/**
 * Generates a signature for FreedomPay API requests
 * @param params - Parameters to include in the signature
 * @returns MD5 hash of the signature
 */
const generateSignature = (params: Record<string, any>): string => {
  try {
    // Create a copy of params and exclude unwanted keys
    const paramsForSignature = { ...params };
    delete paramsForSignature.pg_sig;

    // IMPORTANT: Exclude optional parameters from signature
    // These parameters might not be required for signature in FreedomPay
    const excludeFromSignature = ['pg_testing_mode', 'pg_user_phone', 'pg_user_contact_email'];
    excludeFromSignature.forEach(key => delete paramsForSignature[key]);

    // Sort parameters alphabetically by key
    const sortedKeys = Object.keys(paramsForSignature).sort();

    // Try a different approach: add 'init_payment.php' at the beginning
    // This is required by FreedomPay
    let signatureString = 'init_payment.php';

    // Add all parameters in alphabetical order
    for (const key of sortedKeys) {
      let value = typeof paramsForSignature[key] === 'number'
        ? paramsForSignature[key].toString()
        : paramsForSignature[key];

      // Add value to signature string
      signatureString += `;${value}`;
    }

    // Add secret key at the end
    signatureString += `;${freedomPayConfig.secretKey}`;

    // Log for debugging
    console.log('Signature string:', signatureString);
    console.log('Parameters used for signature:');
    sortedKeys.forEach(key => {
      console.log(`${key}: ${paramsForSignature[key]}`);
    });

    // Generate MD5 hash
    const signature = createHash('md5').update(signatureString).digest('hex');
    console.log('Generated signature:', signature);
    return signature;
  } catch (error) {
    console.error('Error generating signature:', error);
    throw new Error('Failed to generate signature');
  }
};

export const initializePayment = async (
  orderId: string,
  amount: number,
  description: string,
  userPhone?: string,
  userEmail?: string,
  res?: any
) => {
  try {
    console.log('orderId:', orderId);
    // Generate random salt
    const salt = Math.random().toString(36).substring(2, 15);
    console.log('salt:', salt);

    // Log config for debugging
    console.log('freedomPayConfig:', freedomPayConfig);

    // Format order ID (remove hyphens)
    const formattedOrderId = orderId.replace(/-/g, '');
    console.log('Formatted order ID:', formattedOrderId);

    // Prepare request parameters
    const params: Record<string, any> = {
      pg_merchant_id: freedomPayConfig.merchantId,
      pg_order_id: formattedOrderId,
      pg_amount: amount,
      pg_description: description,
      pg_salt: salt,
      pg_currency: freedomPayConfig.currency,
      pg_check_url: freedomPayConfig.checkUrl,
      pg_result_url: freedomPayConfig.resultUrl,
      pg_request_method: freedomPayConfig.requestMethod,
      pg_success_url: freedomPayConfig.successUrl,
      pg_failure_url: freedomPayConfig.failureUrl,
      pg_success_url_method: freedomPayConfig.successUrlMethod,
      pg_failure_url_method: freedomPayConfig.failureUrlMethod,
      pg_lifetime: freedomPayConfig.lifetime,
    };

    // Add testing mode (excluded from signature)
    if (freedomPayConfig.testingMode) params.pg_testing_mode = 1;
    // Add optional parameters (excluded from signature)
    if (userPhone) params.pg_user_phone = userPhone;
    if (userEmail) params.pg_user_contact_email = userEmail;

    // Log parameters before signature
    console.log('Request parameters before signature:', params);

    // Generate signature
    params.pg_sig = generateSignature(params);
    console.log('Request parameters after signature:', params);

    // Log request body
    const requestBody = new URLSearchParams(params).toString();
    console.log('Request body:', requestBody);

    // Make API request
    const apiUrl = freedomPayConfig.testingMode
      ? 'https://test-api.freedompay.kz'
      : freedomPayConfig.apiUrl;
    const response = await axios.post(
      `${apiUrl}/init_payment.php`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Log raw response
    const result = response.data;
    console.log('Raw response:', result);

    // Parse XML response
    let parsedResult;
    try {
      parsedResult = await parseStringPromise(result);
    } catch (xmlError) {
      console.error('Error parsing XML response:', xmlError);
      throw new Error('Failed to parse payment response');
    }

    const pgStatus = parsedResult.response.pg_status?.[0];
    const paymentId = parsedResult.response.pg_payment_id?.[0];
    const redirectUrl = parsedResult.response.pg_redirect_url?.[0];
    const errorCode = parsedResult.response.pg_error_code?.[0];
    const errorDescription = parsedResult.response.pg_error_description?.[0];

    // Check response status
    if (pgStatus === 'ok' && paymentId && redirectUrl) {
      return {
        success: true,
        message: 'Payment initialized successfully',
        data: { paymentId, redirectUrl },
      };
    } else {
      console.error(`Payment failed: ${errorCode} - ${errorDescription}`);
      return errorResponseHandler(
        `Failed to initialize payment: ${errorDescription || 'Unknown error'}`,
        httpStatusCode.INTERNAL_SERVER_ERROR,
        res
      );
    }
  } catch (error) {
    console.error('Error initializing payment:', error);
    return errorResponseHandler(
      'Failed to initialize payment',
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};
/**
 * Generates a signature for FreedomPay API requests
 * @param scriptName - Name of the script being called
 * @param params - Parameters to include in the signature
 * @returns MD5 hash of the signature
 */
// const generateSignature = (scriptName: string, params: Record<string, any>): string => {
//   try {
//     // Create a copy of params
//     const paramsForSignature = { ...params };

//     // Remove pg_sig if it exists
//     delete paramsForSignature.pg_sig;

//     // Sort parameters alphabetically by key
//     const sortedKeys = Object.keys(paramsForSignature).sort();

//     // Build signature string
//     let signatureString = '';

//     // Start with script name
//     signatureString += scriptName;

//     // Add parameters in alphabetical order
//     for (const key of sortedKeys) {
//       signatureString += `;${paramsForSignature[key]}`;
//     }

//     // Add secret key at the end
//     signatureString += `;${freedomPayConfig.secretKey}`;

//     // Log for debugging
//     console.log('Signature string:', signatureString);
//     console.log('Parameters used for signature:');
//     sortedKeys.forEach(key => {
//       console.log(`${key}: ${paramsForSignature[key]}`);
//     });

//     // Generate MD5 hash
//     const signature = createHash('md5').update(signatureString).digest('hex');
//     console.log('Generated signature:', signature);

//     return signature;
//   } catch (error) {
//     console.error('Error generating signature:', error);
//     throw new Error('Failed to generate signature');
//   }
// };

// export const initializePayment = async (
//   orderId: string,
//   amount: number,
//   description: string,
//   userPhone?: string,
//   userEmail?: string,
//   res?: any
// ) => {
//   try {
//     console.log('orderId:', orderId);
//     // Generate random salt
//     const salt = Math.random().toString(36).substring(2, 15);
//     console.log('salt:', salt);

//     // Log config for debugging
//     console.log('freedomPayConfig:', freedomPayConfig);

//     // Format order ID (remove hyphens)
//     const formattedOrderId = orderId.replace(/-/g, '');
//     console.log('Formatted order ID:', formattedOrderId);

//     // Prepare request parameters (minimal set)
//     const params: Record<string, any> = {
//       pg_merchant_id: freedomPayConfig.merchantId,
//       pg_order_id: formattedOrderId,
//       pg_amount: amount,
//       pg_description: description,
//       pg_salt: salt,
//       pg_currency: freedomPayConfig.currency,
//       pg_check_url: freedomPayConfig.checkUrl,
//       pg_result_url: freedomPayConfig.resultUrl,
//       pg_request_method: freedomPayConfig.requestMethod,
//       pg_success_url: freedomPayConfig.successUrl,
//       pg_failure_url: freedomPayConfig.failureUrl,
//       pg_success_url_method: freedomPayConfig.successUrlMethod,
//       pg_failure_url_method: freedomPayConfig.failureUrlMethod,
//       pg_lifetime: freedomPayConfig.lifetime,
//     };

//     // Add testing mode
//     if (freedomPayConfig.testingMode) params.pg_testing_mode = 1;
//     // Add optional parameters
//     if (userPhone) params.pg_user_phone = userPhone;
//     if (userEmail) params.pg_user_contact_email = userEmail;

//     // Log parameters before signature
//     console.log('Request parameters before signature:', params);

//     // Generate signature
//     params.pg_sig = generateSignature('init_payment.php', params);
//     console.log('Request parameters after signature:', params);

//     // Log request body
//     const requestBody = new URLSearchParams(params).toString();
//     console.log('Request body:', requestBody);

//     // Make API request
//     const response = await axios.post(
//       `${freedomPayConfig.apiUrl}/init_payment.php`,
//       requestBody,
//       {
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//       }
//     );

//     // Log raw response
//     const result = response.data;
//     console.log('Raw response:', result);

//     // Check if response is XML
//     if (result.includes('<?xml')) {
//       console.log('Received XML response');

//       // Extract status, error code, and description using regex for simplicity
//       const statusMatch = result.match(/<pg_status>(.*?)<\/pg_status>/);
//       const pgStatus = statusMatch ? statusMatch[1] : null;

//       if (pgStatus === 'ok') {
//         // Extract payment ID and redirect URL
//         const paymentIdMatch = result.match(/<pg_payment_id>(.*?)<\/pg_payment_id>/);
//         const redirectUrlMatch = result.match(/<pg_redirect_url>(.*?)<\/pg_redirect_url>/);

//         if (paymentIdMatch && redirectUrlMatch) {
//           const paymentId = paymentIdMatch[1];
//           const redirectUrl = redirectUrlMatch[1];

//           return {
//             success: true,
//             message: 'Payment initialized successfully',
//             data: { paymentId, redirectUrl },
//           };
//         }
//       } else {
//         // Extract error information
//         const errorCodeMatch = result.match(/<pg_error_code>(.*?)<\/pg_error_code>/);
//         const errorDescMatch = result.match(/<pg_error_description>(.*?)<\/pg_error_description>/);

//         const errorCode = errorCodeMatch ? errorCodeMatch[1] : 'unknown';
//         const errorDescription = errorDescMatch ? errorDescMatch[1] : 'Unknown error';

//         console.error(`Payment failed: ${errorCode} - ${errorDescription}`);

//         return errorResponseHandler(
//           `Failed to initialize payment: ${errorDescription}`,
//           httpStatusCode.INTERNAL_SERVER_ERROR,
//           res
//         );
//       }
//     }

//     // If we reach here, something unexpected happened
//     console.error('Unexpected response format:', result);
//     return errorResponseHandler(
//       'Failed to initialize payment: Unexpected response format',
//       httpStatusCode.INTERNAL_SERVER_ERROR,
//       res
//     );
//   } catch (error) {
//     console.error('Error initializing payment:', error);
//     return errorResponseHandler(
//       'Failed to initialize payment',
//       httpStatusCode.INTERNAL_SERVER_ERROR,
//       res
//     );
//   }
// };
/**
 * Processes a payment check request from FreedomPay
 * @param params - Parameters from the check request
 * @returns Response to send back to FreedomPay
 */
export const processCheckRequest = async (params: Record<string, any>) => {
  try {
    const orderId = params.pg_order_id;
    const amount = parseFloat(params.pg_amount);

    // Find the order in the database
    const order = await ordersModel.findOne({ identifier: orderId });

    if (!order) {
      const response: Record<string, any> = {
        pg_status: 'rejected',
        pg_description: 'Order not found',
        pg_salt: Math.random().toString(36).substring(2, 15)
      };

      // Generate signature for the response
      response.pg_sig = generateSignature(response);

      return response;
    }

    // Check if the amount matches
    if (order.totalAmount !== amount) {
      const response: Record<string, any> = {
        pg_status: 'rejected',
        pg_description: 'Amount mismatch',
        pg_salt: Math.random().toString(36).substring(2, 15)
      };

      // Generate signature for the response
      response.pg_sig = generateSignature(response);

      return response;
    }

    // If everything is fine, allow the payment
    const response: Record<string, any> = {
      pg_status: 'ok',
      pg_description: 'Payment allowed',
      pg_salt: Math.random().toString(36).substring(2, 15)
    };

    // Generate signature for the response
    response.pg_sig = generateSignature(response);

    return response;
  } catch (error) {
    console.error('Error processing check request:', error);
    const response: Record<string, any> = {
      pg_status: 'error',
      pg_description: 'Internal server error',
      pg_salt: Math.random().toString(36).substring(2, 15)
    };

    // Generate signature for the response
    response.pg_sig = generateSignature(response);

    return response;
  }
};

/**
 * Processes a payment result request from FreedomPay
 * @param params - Parameters from the result request
 * @returns Response to send back to FreedomPay
 */
export const processResultRequest = async (params: Record<string, any>) => {
  try {
    const orderId = params.pg_order_id;
    const paymentId = params.pg_payment_id;
    const result = parseInt(params.pg_result);

    // Find the order in the database
    const order = await ordersModel.findOne({ identifier: orderId });

    if (!order) {
      const response: Record<string, any> = {
        pg_status: 'rejected',
        pg_description: 'Order not found',
        pg_salt: Math.random().toString(36).substring(2, 15)
      };

      // Generate signature for the response
      response.pg_sig = generateSignature(response);

      return response;
    }

    // Update order status based on payment result
    if (result === 1) {
      // Payment successful
      order.status = 'Completed';
      order.transactionId = paymentId;
      order.paymentMethod = params.pg_payment_method || 'FreedomPay';
      await order.save();

      const response: Record<string, any> = {
        pg_status: 'ok',
        pg_description: 'Order paid',
        pg_salt: Math.random().toString(36).substring(2, 15)
      };

      // Generate signature for the response
      response.pg_sig = generateSignature(response);

      return response;
    } else {
      // Payment failed
      order.status = 'Failed';
      await order.save();

      const response: Record<string, any> = {
        pg_status: 'ok',
        pg_description: 'Payment failure recorded',
        pg_salt: Math.random().toString(36).substring(2, 15)
      };

      // Generate signature for the response
      response.pg_sig = generateSignature(response);

      return response;
    }
  } catch (error) {
    console.error('Error processing result request:', error);
    const response: Record<string, any> = {
      pg_status: 'error',
      pg_description: 'Internal server error',
      pg_salt: Math.random().toString(36).substring(2, 15)
    };

    // Generate signature for the response
    response.pg_sig = generateSignature(response);

    return response;
  }
};
