import axios from 'axios';
import { freedomPayConfig } from '../../config/freedompay';
import { Response } from 'express';
import { errorResponseHandler } from '../../lib/errors/error-response-handler';
import { httpStatusCode } from '../../lib/constant';
import { ordersModel } from '../../models/orders/orders-schema';
import { createHash } from 'crypto';
import { parseStringPromise } from 'xml2js';
import FormData from 'form-data';
/**
 * Generates a signature for FreedomPay API requests
 * @param params - Parameters to include in the signature
 * @param scriptName - Name of the script being called (default: init_payment.php)
 * @returns MD5 hash of the signature
 */
const generateSignature = (params: Record<string, any>, scriptName: string = 'init_payment.php'): string => {
  try {
    // Create a copy of params
    const paramsForSignature = { ...params };

    // Remove pg_sig if it exists
    delete paramsForSignature.pg_sig;

    // According to the official documentation:
    // 1. Start with script name
    // 2. Add all parameters in alphabetical order by key
    // 3. Add secret key at the end
    // 4. Join with semicolons and create MD5 hash

    // Create array for signature parts
    const signatureParts: string[] = [];

    // Start with script name
    signatureParts.push(scriptName);

    // Sort keys alphabetically
    const sortedKeys = Object.keys(paramsForSignature).sort();

    // Add all parameters in alphabetical order by key
    for (const key of sortedKeys) {
      signatureParts.push(String(paramsForSignature[key]));
    }

    // Add secret key for payments at the end
    // Make sure we're using the correct secret key for payments: B9RZWYnQFBVZ2fhT
    signatureParts.push(freedomPayConfig.secretKey);

    // Log the secret key being used (masked for security)
    const maskedKey = freedomPayConfig.secretKey.substring(0, 4) + '...' +
                     freedomPayConfig.secretKey.substring(freedomPayConfig.secretKey.length - 4);
    console.log(`Using secret key for payments (masked): ${maskedKey}`);

    // Join with semicolons
    const signatureString = signatureParts.join(';');

    // Log for debugging
    console.log('Using signature format from official documentation');
    console.log('Signature string:', signatureString);
    console.log('Parameters used for signature (in order):');
    console.log(`0: ${scriptName} (script name)`);
    sortedKeys.forEach((key, index) => {
      console.log(`${index + 1}: ${paramsForSignature[key]} (${key})`);
    });
    console.log(`${sortedKeys.length + 1}: [SECRET_KEY]`);

    // Generate MD5 hash
    const signature = createHash('md5').update(signatureString).digest('hex');
    console.log('Generated signature:', signature);

    return signature;
  } catch (error) {
    console.error('Error generating signature:', error);
    throw new Error('Failed to generate signature');
  }
};

/**
 * Test function to verify signature generation with a known example
 */
const testSignatureGeneration = () => {
  // Example from documentation curl command
  const testParams: Record<string, string> = {
    pg_order_id: '00102',
    pg_merchant_id: '555419',
    pg_amount: '10',
    pg_description: 'Ticket',
    pg_salt: 'some random string',
    pg_testing_mode: '1'
  };

  console.log('=== TESTING SIGNATURE GENERATION WITH EXAMPLE FROM DOCS ===');
  console.log('Test parameters:', testParams);

  // Manual calculation for verification - exactly as shown in the documentation
  // First, sort parameters alphabetically by key
  const sortedKeys = Object.keys(testParams).sort();
  console.log('Sorted keys:', sortedKeys);

  // Create signature string
  let signatureParts = ['init_payment.php'];
  sortedKeys.forEach(key => {
    signatureParts.push(testParams[key]);
  });

  // Make sure we're using the correct secret key for payments
  const paymentSecretKey = 'B9RZWYnQFBVZ2fhT';
  signatureParts.push(paymentSecretKey);
  console.log(`Using hardcoded secret key for payments: ${paymentSecretKey.substring(0, 4)}...${paymentSecretKey.substring(paymentSecretKey.length - 4)}`);

  const manualSignatureString = signatureParts.join(';');
  console.log('Manual signature string:', manualSignatureString);

  const manualSignature = createHash('md5').update(manualSignatureString).digest('hex');
  console.log('Manual signature:', manualSignature);

  // Using our function - but with hardcoded payment secret key to ensure correctness
  // Save the original secret key
  const originalSecretKey = freedomPayConfig.secretKey;

  // Temporarily override the secret key to ensure we're using the payment key
  const PAYMENT_SECRET_KEY = 'B9RZWYnQFBVZ2fhT';
  (freedomPayConfig as any).secretKey = PAYMENT_SECRET_KEY;

  const testSignature = generateSignature(testParams, 'init_payment.php');
  console.log('Function signature:', testSignature);

  // Restore the original secret key
  (freedomPayConfig as any).secretKey = originalSecretKey;

  // Compare
  console.log('Signatures match:', manualSignature === testSignature);

  // Create curl command for testing - exactly like the documentation
  // Note: The double quotes in the curl command are part of the shell syntax,
  // not the actual values sent to the server
  let testCurlCommand = `curl --location --globoff '${freedomPayConfig.apiUrl}/init_payment.php' \\`;
  testCurlCommand += `\n--form 'pg_order_id="${testParams.pg_order_id}"' \\`;
  testCurlCommand += `\n--form 'pg_merchant_id="${testParams.pg_merchant_id}"' \\`;
  testCurlCommand += `\n--form 'pg_amount="${testParams.pg_amount}"' \\`;
  testCurlCommand += `\n--form 'pg_description="${testParams.pg_description}"' \\`;
  testCurlCommand += `\n--form 'pg_salt="${testParams.pg_salt}"' \\`;
  testCurlCommand += `\n--form 'pg_sig="${testSignature}"' \\`;
  testCurlCommand += `\n--form 'pg_testing_mode="${testParams.pg_testing_mode}"'`;

  console.log('Test curl command:');
  console.log(testCurlCommand);
  console.log('=== END TEST ===');

  return testSignature;
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
    // Check if required configuration is available
    if (!freedomPayConfig.merchantId || !freedomPayConfig.secretKey) {
      console.error('FreedomPay configuration is missing. Check environment variables.');
      return errorResponseHandler(
        'Payment gateway configuration is missing',
        httpStatusCode.INTERNAL_SERVER_ERROR,
        res
      );
    }

    // Verify that we're using the correct secret key for payments
    const PAYMENT_SECRET_KEY = 'B9RZWYnQFBVZ2fhT';
    const RECEIPT_SECRET_KEY = 'FgdKAjNuSiPVj1Zh';

    if (freedomPayConfig.secretKey !== PAYMENT_SECRET_KEY) {
      console.warn('WARNING: The secret key being used does not match the expected secret key for payments.');
      console.warn(`Expected: ${PAYMENT_SECRET_KEY}`);
      console.warn(`Actual: ${freedomPayConfig.secretKey.substring(0, 4)}...${freedomPayConfig.secretKey.substring(freedomPayConfig.secretKey.length - 4)}`);

      // Check if we're accidentally using the receipt secret key
      if (freedomPayConfig.secretKey === RECEIPT_SECRET_KEY) {
        console.error('ERROR: You are using the secret key for receipts instead of the secret key for payments!');
        console.error('Please update your environment variable FREEDOMPAY_SECRET_KEY to use the payment secret key.');
        return errorResponseHandler(
          'Incorrect secret key configuration. Using receipt key instead of payment key.',
          httpStatusCode.INTERNAL_SERVER_ERROR,
          res
        );
      }

      // Force the correct secret key
      console.warn('Forcing the correct payment secret key...');
      (freedomPayConfig as any).secretKey = PAYMENT_SECRET_KEY;
    }

    console.log('Secret key for payments verified ✓');

    // Run test signature generation to verify our implementation
    testSignatureGeneration();

    console.log('FreedomPay Configuration:', {
      merchantId: freedomPayConfig.merchantId,
      secretKey: freedomPayConfig.secretKey ? '****' : 'NOT SET',
      apiUrl: freedomPayConfig.apiUrl,
      testingMode: freedomPayConfig.testingMode
    });

    console.log('orderId:', orderId);
    // Generate random salt
    const salt = Math.random().toString(36).substring(2, 15);
    console.log('salt:', salt);

    // Log config for debugging
    console.log('freedomPayConfig:', freedomPayConfig);

    // Format order ID - use a simple numeric format if possible
    // FreedomPay might prefer simple numeric IDs
    let formattedOrderId = orderId;

    // If it's a UUID, remove hyphens
    if (orderId.includes('-')) {
      formattedOrderId = orderId.replace(/-/g, '');
    }

    // If it's a MongoDB ObjectId, use the timestamp part (first 8 chars)
    if (/^[0-9a-f]{24}$/i.test(orderId)) {
      formattedOrderId = orderId.substring(0, 8);
    }

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

    // Add testing mode
    if (freedomPayConfig.testingMode) params.pg_testing_mode = 1;
    // Add optional parameters
    if (userPhone) params.pg_user_phone = userPhone;
    if (userEmail) params.pg_user_contact_email = userEmail;

    // Log parameters before signature
    console.log('Request parameters before signature:', params);

    // Generate signature
    const signature = generateSignature(params, 'init_payment.php');
    params.pg_sig = signature;
    console.log('Request parameters after signature:', params);

    // Let's try a completely different approach using URLSearchParams
    // instead of FormData, as this might be more compatible with the API

    // Create a minimal set of parameters, exactly like in the example
    const minimalParams: Record<string, string> = {
      pg_order_id: String(params.pg_order_id),
      pg_merchant_id: String(params.pg_merchant_id),
      pg_amount: String(params.pg_amount),
      pg_description: String(params.pg_description),
      pg_salt: String(params.pg_salt),
      pg_sig: String(params.pg_sig)
    };

    // Add testing mode if enabled
    if (freedomPayConfig.testingMode) {
      minimalParams.pg_testing_mode = '1';
    }

    // Create URLSearchParams object
    const urlSearchParams = new URLSearchParams();

    // Add parameters in the exact order shown in the example
    urlSearchParams.append('pg_order_id', minimalParams.pg_order_id);
    urlSearchParams.append('pg_merchant_id', minimalParams.pg_merchant_id);
    urlSearchParams.append('pg_amount', minimalParams.pg_amount);
    urlSearchParams.append('pg_description', minimalParams.pg_description);
    urlSearchParams.append('pg_salt', minimalParams.pg_salt);
    urlSearchParams.append('pg_sig', minimalParams.pg_sig);

    if (freedomPayConfig.testingMode) {
      urlSearchParams.append('pg_testing_mode', '1');
    }

    // Log the minimal parameters being sent
    console.log('Minimal parameters being sent:', minimalParams);
    console.log('URLSearchParams string:', urlSearchParams.toString());

    // Make API request
    // Use the API URL from the configuration
    const apiUrl = freedomPayConfig.apiUrl;
    console.log(`Using API URL: ${apiUrl}/init_payment.php`);

    // Log the exact curl command that would be equivalent to our request
    let curlCommand = `curl --location --request POST '${apiUrl}/init_payment.php'`;
    Object.entries(minimalParams).forEach(([key, value]) => {
      curlCommand += ` \\\n--data-urlencode '${key}=${value}'`;
    });
    if (freedomPayConfig.testingMode && !('pg_testing_mode' in minimalParams)) {
      curlCommand += ` \\\n--data-urlencode 'pg_testing_mode=1'`;
    }

    console.log('Equivalent curl command (using URL-encoded form):');
    console.log(curlCommand);

    // Also try a direct fetch approach
    console.log('\nTrying direct fetch approach with minimal parameters');

    // Create a simple form data object with just the required fields
    const simpleFormData = new FormData();
    Object.entries(minimalParams).forEach(([key, value]) => {
      simpleFormData.append(key, value);
    });
    if (freedomPayConfig.testingMode && !('pg_testing_mode' in minimalParams)) {
      simpleFormData.append('pg_testing_mode', '1');
    }

    // Try multiple approaches to see which one works
    let response;
    try {
      console.log('Approach 1: Using URLSearchParams with content-type application/x-www-form-urlencoded');
      response = await axios.post(
        `${apiUrl}/init_payment.php`,
        urlSearchParams,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
    } catch (error: any) {
      console.error('Approach 1 failed:', error.message || 'Unknown error');

      try {
        console.log('Approach 2: Using FormData with minimal parameters');
        response = await axios.post(
          `${apiUrl}/init_payment.php`,
          simpleFormData,
          {
            headers: {
              ...simpleFormData.getHeaders()
            }
          }
        );
      } catch (error: any) {
        console.error('Approach 2 failed:', error.message || 'Unknown error');

        try {
          console.log('Approach 3: Using URLSearchParams as string');
          response = await axios.post(
            `${apiUrl}/init_payment.php`,
            urlSearchParams.toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
        } catch (error: any) {
          console.error('Approach 3 failed:', error.message || 'Unknown error');

          try {
            // Approach 4: Try using a direct curl command as a last resort
            console.log('Approach 4: Using direct curl command');

            // Create a curl command that can be executed
            let execCurlCommand = `curl --location --request POST "${apiUrl}/init_payment.php"`;
            Object.entries(minimalParams).forEach(([key, value]) => {
              // Escape quotes in values
              const escapedValue = value.replace(/"/g, '\\"');
              execCurlCommand += ` --form "${key}=${escapedValue}"`;
            });

            if (freedomPayConfig.testingMode && !('pg_testing_mode' in minimalParams)) {
              execCurlCommand += ` --form "pg_testing_mode=1"`;
            }

            console.log('Executing curl command:', execCurlCommand);

            // Execute the curl command using child_process
            const { exec } = require('child_process');
            const curlPromise = new Promise<string>((resolve, reject) => {
              exec(execCurlCommand, (error: any, stdout: string, stderr: string) => {
                if (error) {
                  console.error(`Curl execution error: ${error.message}`);
                  reject(error);
                  return;
                }
                if (stderr) {
                  console.error(`Curl stderr: ${stderr}`);
                }
                resolve(stdout);
              });
            });

            const curlOutput = await curlPromise;
            console.log('Curl output:', curlOutput);

            // Parse the curl output as the response
            response = { data: curlOutput };
          } catch (error: any) {
            console.error('Approach 4 failed:', error.message || 'Unknown error');

            try {
              // Approach 5: Try with an absolute minimal set of parameters
              console.log('Approach 5: Using absolute minimal parameters');

              // Create an even more minimal set of parameters
              const absoluteMinimalParams: Record<string, string> = {
                pg_order_id: String(params.pg_order_id),
                pg_merchant_id: String(params.pg_merchant_id),
                pg_amount: String(params.pg_amount),
                pg_description: String(params.pg_description),
                pg_salt: String(params.pg_salt)
              };

              // Generate a new signature with just these parameters
              // Use the hardcoded payment secret key to ensure correctness
              const PAYMENT_SECRET_KEY = 'B9RZWYnQFBVZ2fhT';

              // Make sure we're using the correct secret key
              console.log('Using hardcoded payment secret key for signature generation');
              console.log(`Secret key being used: ${PAYMENT_SECRET_KEY.substring(0, 4)}...${PAYMENT_SECRET_KEY.substring(PAYMENT_SECRET_KEY.length - 4)}`);

              // Create a new signature generator function that uses the hardcoded key
              const generateMinimalSignature = (params: Record<string, string>): string => {
                try {
                  // Create a copy of params
                  const paramsForSignature = { ...params };

                  // Remove pg_sig if it exists
                  delete paramsForSignature.pg_sig;

                  // Sort keys alphabetically
                  const sortedKeys = Object.keys(paramsForSignature).sort();

                  // Create signature string
                  let signatureParts = ['init_payment.php'];
                  sortedKeys.forEach(key => {
                    signatureParts.push(String(paramsForSignature[key]));
                  });

                  // Add hardcoded payment secret key
                  signatureParts.push(PAYMENT_SECRET_KEY);

                  // Join with semicolons
                  const signatureString = signatureParts.join(';');

                  console.log('Minimal signature string:', signatureString);

                  // Generate MD5 hash
                  const signature = createHash('md5').update(signatureString).digest('hex');
                  console.log('Generated minimal signature:', signature);

                  return signature;
                } catch (error) {
                  console.error('Error generating minimal signature:', error);
                  throw new Error('Failed to generate minimal signature');
                }
              };

              const minimalSignature = generateMinimalSignature(absoluteMinimalParams);
              absoluteMinimalParams.pg_sig = minimalSignature;

              if (freedomPayConfig.testingMode) {
                absoluteMinimalParams.pg_testing_mode = '1';
              }

              console.log('Absolute minimal parameters:', absoluteMinimalParams);

              // Create a new URLSearchParams object
              const minimalUrlParams = new URLSearchParams();
              Object.entries(absoluteMinimalParams).forEach(([key, value]) => {
                minimalUrlParams.append(key, value);
              });

              // Try approach 5A: Using URLSearchParams
              try {
                console.log('Approach 5A: Using URLSearchParams with minimal parameters');
                response = await axios.post(
                  `${apiUrl}/init_payment.php`,
                  minimalUrlParams,
                  {
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded'
                    }
                  }
                );
              } catch (error: any) {
                console.error('Approach 5A failed:', error.message || 'Unknown error');

                // Try approach 5B: Using direct curl command with minimal parameters
                console.log('Approach 5B: Using direct curl command with minimal parameters');

                // Create a curl command that can be executed
                let minimalCurlCommand = `curl --location --request POST "${apiUrl}/init_payment.php"`;
                Object.entries(absoluteMinimalParams).forEach(([key, value]) => {
                  // Escape quotes in values
                  const escapedValue = value.replace(/"/g, '\\"');
                  minimalCurlCommand += ` --form "${key}=${escapedValue}"`;
                });

                console.log('Executing minimal curl command:', minimalCurlCommand);

                // Execute the curl command using child_process
                const { exec } = require('child_process');
                const curlPromise = new Promise<string>((resolve, reject) => {
                  exec(minimalCurlCommand, (error: any, stdout: string, stderr: string) => {
                    if (error) {
                      console.error(`Curl execution error: ${error.message}`);
                      reject(error);
                      return;
                    }
                    if (stderr) {
                      console.error(`Curl stderr: ${stderr}`);
                    }
                    resolve(stdout);
                  });
                });

                const curlOutput = await curlPromise;
                console.log('Curl output:', curlOutput);

                // Parse the curl output as the response
                response = { data: curlOutput };
              }
            } catch (error: any) {
              console.error('Approach 5 failed:', error.message || 'Unknown error');

              // If all approaches fail, throw the error
              throw new Error('All request approaches failed');
            }
          }
        }
      }
    }

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

      // Special handling for signature error (code 9998)
      if (errorCode === '9998') {
        console.error('SIGNATURE ERROR DETECTED! This means our signature calculation is incorrect.');
        console.error('Please check:');
        console.error('1. The secret key is correct');
        console.error('2. The parameters are sorted correctly');
        console.error('3. The script name is correct');
        console.error('4. All parameters are included in the signature');

        // Try the example from documentation again to verify our implementation
        testSignatureGeneration();
      }

      return errorResponseHandler(
        `Failed to initialize payment: ${errorDescription || 'Unknown error'}`,
        httpStatusCode.INTERNAL_SERVER_ERROR,
        res
      );
    }
  } catch (error: any) {
    console.error('Error initializing payment:', error);

    // Extract more detailed error information if available
    let errorMessage = 'Failed to initialize payment';

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);

      if (error.response.data) {
        errorMessage += `: ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
      errorMessage += ': No response received from server';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
      errorMessage += `: ${error.message}`;
    }

    return errorResponseHandler(
      errorMessage,
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
      response.pg_sig = generateSignature(response, 'check.php');

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
      response.pg_sig = generateSignature(response, 'check.php');

      return response;
    }

    // If everything is fine, allow the payment
    const response: Record<string, any> = {
      pg_status: 'ok',
      pg_description: 'Payment allowed',
      pg_salt: Math.random().toString(36).substring(2, 15)
    };

    // Generate signature for the response
    response.pg_sig = generateSignature(response, 'check.php');

    return response;
  } catch (error) {
    console.error('Error processing check request:', error);
    const response: Record<string, any> = {
      pg_status: 'error',
      pg_description: 'Internal server error',
      pg_salt: Math.random().toString(36).substring(2, 15)
    };

    // Generate signature for the response
    response.pg_sig = generateSignature(response, 'check.php');

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
      response.pg_sig = generateSignature(response, 'result.php');

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
      response.pg_sig = generateSignature(response, 'result.php');

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
      response.pg_sig = generateSignature(response, 'result.php');

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
    response.pg_sig = generateSignature(response, 'result.php');

    return response;
  }
};
