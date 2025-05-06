import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { ordersModel } from "../../models/orders/orders-schema";
import { customAlphabet } from "nanoid";
import { productsModel } from "../../models/products/products-schema"; // Assuming you have a products model
import { initializePayment } from "../payment/freedompay-service";
import { deductFundsFromWalletService, getWalletBalanceService } from "../wallet/wallet-service";

export const createOrderService = async (payload: any, res: Response) => {

  // Check if any product is discounted
  const products = await productsModel.find({ _id: { $in: payload.productIds } });
  const hasDiscountedProduct = products.some(product => product.isDiscounted);

  if (hasDiscountedProduct && payload.voucherId) {
    return errorResponseHandler(
      "Voucher cannot be applied to discounted products",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  const identifier = customAlphabet("0123456789", 5);
  payload.identifier = identifier();

  // Set initial status to Pending
  payload.status = 'Pending';

  const newOrder = new ordersModel(payload);
  const savedOrder = await newOrder.save();

  return {
    success: true,
    message: "Order created successfully",
    data: savedOrder,
  };
};

/**
 * Initializes payment for an order using FreedomPay or wallet
 * @param orderId - Order ID
 * @param paymentMethod - Payment method (freedompay or wallet)
 * @param userId - User ID (required for wallet payment)
 * @param userPhone - User's phone number (optional for FreedomPay)
 * @param userEmail - User's email (optional for FreedomPay)
 * @param res - Express response object
 * @returns Payment initialization response
 */
export const initOrderPaymentService = async (
  orderId: string,
  paymentMethod: string = 'freedompay',
  userId?: string,
  userPhone?: string,
  userEmail?: string,
  res?: Response
) => {
  // Find the order
  const order = await ordersModel.findById(orderId);

  if (!order) {
    return errorResponseHandler(
      "Order not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  }

  // Check if order is already paid
  if (order.status === 'Completed') {
    return errorResponseHandler(
      "Order is already paid",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }

  // Process payment based on payment method
  if (paymentMethod.toLowerCase() === 'wallet') {
    // Validate userId for wallet payment
    if (!userId) {
      return errorResponseHandler(
        "User ID is required for wallet payment",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }

    // Process wallet payment
    const paymentResponse = await deductFundsFromWalletService(
      userId,
      order.totalAmount,
      orderId,
      `Payment for order ${order.identifier || order._id.toString()}`,
      res
    );

    if (paymentResponse.success) {
      // Update order status
      order.status = 'Completed';
      order.paymentMethod = 'Wallet';
      order.transactionId = paymentResponse.data.transaction._id.toString();
      await order.save();
    }

    return paymentResponse;
  } else {
    // Initialize payment with FreedomPay
    const paymentResponse = await initializePayment(
      order.identifier || order._id.toString(),
      order.totalAmount,
      `Payment for order ${order.identifier || order._id.toString()}`,
      userPhone,
      userEmail,
      res
    );

    return paymentResponse;
  }
};

/**
 * Check if user has sufficient wallet balance for an order
 * @param userId - User ID
 * @param orderId - Order ID
 * @param res - Express response object
 * @returns Whether user has sufficient balance
 */
export const checkWalletBalanceForOrderService = async (
  userId: string,
  orderId: string,
  res?: Response
) => {
  try {
    // Find the order
    const order = await ordersModel.findById(orderId);

    if (!order) {
      return errorResponseHandler(
        "Order not found",
        httpStatusCode.NOT_FOUND,
        res
      );
    }

    // Get wallet balance
    const walletResponse = await getWalletBalanceService(userId, res);

    if (!walletResponse.success) {
      return walletResponse;
    }

    const { balance } = walletResponse.data;

    // Check if balance is sufficient
    const hasSufficientBalance = balance >= order.totalAmount;

    return {
      success: true,
      message: hasSufficientBalance
        ? "Sufficient wallet balance"
        : "Insufficient wallet balance",
      data: {
        hasSufficientBalance,
        balance,
        required: order.totalAmount,
        shortfall: hasSufficientBalance ? 0 : order.totalAmount - balance
      }
    };
  } catch (error) {
    console.error("Error in checkWalletBalanceForOrderService:", error);
    return errorResponseHandler(
      "Failed to check wallet balance",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

export const getOrderService = async (id: any, res: Response) => {
  const order = await ordersModel.findById(id);
  // let query:any  = {}
  // if(payload)
  // const usersTotalAmount =  await ordersModel.find({userId : id, ...query}).select('totalAmount')

  if (!order)
    return errorResponseHandler(
      "Order not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  return {
    success: true,
    message: "Order retrieved successfully",
    data: order,
  };
};

export const getAllOrdersService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["identifier", "status"]);

  const totalDataCount =
    Object.keys(query).length < 1
      ? await ordersModel.countDocuments()
      : await ordersModel.countDocuments(query);
  const results = await ordersModel
    .find(query)
    .sort({
      createdAt: -1,
      ...sort,
    })
    .skip(offset)
    .limit(limit)
    .select("-__v");
  if (results.length)
    return {
      page,
      limit,
      success: true,
      message: "Orders retrieved successfully",
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      success: false,
      message: "No orders found",
      total: 0,
    };
  }
};

export const updateOrderService = async (
  id: string,
  payload: any,
  res: Response
) => {
  const updatedOrder = await ordersModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedOrder)
    return errorResponseHandler(
      "Order not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  return {
    success: true,
    message: "Order updated successfully",
    data: updatedOrder,
  };
};

export const deleteOrderService = async (id: string, res: Response) => {
  const deletedOrder = await ordersModel.findByIdAndDelete(id);
  if (!deletedOrder)
    return errorResponseHandler(
      "Order not found",
      httpStatusCode.NOT_FOUND,
      res
    );

  return {
    success: true,
    message: "Order Deleted successfully",
    data: deletedOrder,
  };
};
