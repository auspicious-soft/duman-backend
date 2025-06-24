import { Request, Response } from "express";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { initializePayment, processCheckRequest, processResultRequest } from "../../services/payment/freedompay-service";
import { ordersModel } from "../../models/orders/orders-schema";

/**
 * Initializes a payment with FreedomPay
 * @param req - Express request object
 * @param res - Express response object
 */
export const initPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    console.log('orderId: ', orderId);

    // Find the order
    const order = await ordersModel.findById(orderId);
    if (!order) {
      return res.status(httpStatusCode.NOT_FOUND).json({
        success: false,
        message: "Order not found"
      });
    }

    // Get user information if available
    const user = req.user;
    let userPhone, userEmail;

    if (user) {
      userPhone = typeof user !== 'string' && 'phoneNumber' in user ? user.phoneNumber : undefined;
      userEmail = typeof user !== 'string' && 'email' in user ? user.email : undefined;
    }

    // Use a consistent order identifier
    const orderIdentifier = order.identifier || order._id.toString();

    console.log('Using order identifier for payment:', orderIdentifier);

    // Initialize payment - Choose one approach by uncommenting
    // Direct API Approach
    const response = await initializePayment(
      orderIdentifier,
      order.totalAmount,
      `Payment for order ${orderIdentifier}`,
      userPhone,
      userEmail,
      
    );

    // Library Approach (uncomment to use)
    /*
    const response = await initializePaymentWithLibrary(
      orderIdentifier,
      order.totalAmount,
      `Payment for order ${orderIdentifier}`,
      userPhone,
      userEmail
    );
    */

    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message || "Failed to initialize payment"
    });
  }
};

/**
 * Handles the check request from FreedomPay
 * @param req - Express request object
 * @param res - Express response object
 */
export const checkPayment = async (req: Request, res: Response) => {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    const response = await processCheckRequest(params);

    // Return XML response
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="utf-8"?>
<response>
    <pg_status>${response.pg_status}</pg_status>
    <pg_description>${response.pg_description}</pg_description>
    <pg_salt>${response.pg_salt}</pg_salt>
    ${response.pg_sig ? `<pg_sig>${response.pg_sig}</pg_sig>` : ''}
</response>`);
  } catch (error: any) {
    console.error('Error in check payment:', error);

    // Return error response in XML format
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="utf-8"?>
<response>
    <pg_status>error</pg_status>
    <pg_description>Internal server error</pg_description>
    <pg_salt>${Math.random().toString(36).substring(2, 15)}</pg_salt>
</response>`);
  }
};

/**
 * Handles the result request from FreedomPay
 * @param req - Express request object
 * @param res - Express response object
 */
export const resultPayment = async (req: Request, res: Response) => {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    console.log('params: ', params);
    const response = await processResultRequest(params);
    console.log('response: ', response); 

    // Return XML response
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="utf-8"?>
<response>
    <pg_status>${response.pg_status}</pg_status>
    <pg_description>${response.pg_description}</pg_description>
    <pg_salt>${response.pg_salt}</pg_salt>
    ${response.pg_sig ? `<pg_sig>${response.pg_sig}</pg_sig>` : ''}
</response>`);
  } catch (error: any) {
    console.error('Error in result payment:', error);

    // Return error response in XML format
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="utf-8"?>
<response>
    <pg_status>error</pg_status>
    <pg_description>Internal server error</pg_description>
    <pg_salt>${Math.random().toString(36).substring(2, 15)}</pg_salt>
</response>`);
  }
};

/**
 * Gets the payment status for an order
 * @param req - Express request object
 * @param res - Express response object
 */
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await ordersModel.findById(orderId);
    if (!order) {
      return res.status(httpStatusCode.NOT_FOUND).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(httpStatusCode.OK).json({
      success: true,
      data: {
        status: order.status,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId,
        paymentCompletedAt: order.paymentCompletedAt,
        paymentAmount: order.paymentAmount,
        totalAmount: order.totalAmount
      }
    });
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message || "Failed to get payment status"
    });
  }
};
