import { Response } from "express";
import mongoose from "mongoose";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { walletModel } from "../../models/wallet/wallet-schema";
import { walletTransactionModel } from "../../models/wallet/wallet-transaction-schema";
import { initializePayment } from "../payment/freedompay-service";
import { customAlphabet } from "nanoid";

/**
 * Get or create a wallet for a user
 * @param userId - User ID
 * @param res - Express response object
 * @returns User's wallet
 */
export const getOrCreateWalletService = async (userId: string, res?: Response) => {
  try {
    // Check if wallet exists
    let wallet = await walletModel.findOne({ userId });
    
    // If wallet doesn't exist, create it
    if (!wallet) {
      wallet = new walletModel({
        userId,
        balance: 0,
        currency: "KZT",
        isActive: true
      });
      
      await wallet.save();
    }
    
    return {
      success: true,
      message: "Wallet retrieved successfully",
      data: wallet
    };
  } catch (error) {
    console.error("Error in getOrCreateWalletService:", error);
    return errorResponseHandler(
      "Failed to get or create wallet",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

/**
 * Get wallet balance for a user
 * @param userId - User ID
 * @param res - Express response object
 * @returns Wallet balance
 */
export const getWalletBalanceService = async (userId: string, res?: Response) => {
  try {
    // Get or create wallet
    const walletResponse = await getOrCreateWalletService(userId, res);
    
    if (!walletResponse.success) {
      return walletResponse;
    }
    
    const wallet = walletResponse.data;
    
    return {
      success: true,
      message: "Wallet balance retrieved successfully",
      data: {
        balance: wallet.balance,
        currency: wallet.currency
      }
    };
  } catch (error) {
    console.error("Error in getWalletBalanceService:", error);
    return errorResponseHandler(
      "Failed to get wallet balance",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

/**
 * Get wallet transactions for a user
 * @param userId - User ID
 * @param page - Page number
 * @param limit - Number of transactions per page
 * @param res - Express response object
 * @returns Wallet transactions
 */
export const getWalletTransactionsService = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  res?: Response
) => {
  try {
    // Get wallet
    const walletResponse = await getOrCreateWalletService(userId, res);
    
    if (!walletResponse.success) {
      return walletResponse;
    }
    
    const wallet = walletResponse.data;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get transactions
    const transactions = await walletTransactionModel
      .find({ walletId: wallet._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const totalCount = await walletTransactionModel.countDocuments({ walletId: wallet._id });
    
    return {
      success: true,
      message: "Wallet transactions retrieved successfully",
      data: {
        transactions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    };
  } catch (error) {
    console.error("Error in getWalletTransactionsService:", error);
    return errorResponseHandler(
      "Failed to get wallet transactions",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

/**
 * Add funds to wallet (create a top-up transaction)
 * @param userId - User ID
 * @param amount - Amount to add
 * @param res - Express response object
 * @returns Top-up transaction
 */
export const addFundsToWalletService = async (
  userId: string,
  amount: number,
  res?: Response
) => {
  try {
    // Validate amount
    if (amount <= 0) {
      return errorResponseHandler(
        "Amount must be greater than 0",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }
    
    // Get or create wallet
    const walletResponse = await getOrCreateWalletService(userId, res);
    
    if (!walletResponse.success) {
      return walletResponse;
    }
    
    const wallet = walletResponse.data;
    
    // Create a transaction reference
    const generateRef = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);
    const reference = `TOP-${generateRef()}`;
    
    // Create a pending transaction
    const transaction = new walletTransactionModel({
      walletId: wallet._id,
      userId,
      amount,
      type: "CREDIT",
      status: "PENDING",
      description: "Wallet top-up",
      reference
    });
    
    await transaction.save();
    
    // Initialize payment with FreedomPay
    const paymentResponse = await initializePayment(
      reference,
      amount,
      "Wallet top-up",
      undefined,
      undefined,
      res
    );
    
    if (!paymentResponse.success) {
      // Update transaction status to failed
      transaction.status = "FAILED";
      await transaction.save();
      
      return paymentResponse;
    }
    
    return {
      success: true,
      message: "Wallet top-up initiated successfully",
      data: {
        transaction,
        payment: paymentResponse.data
      }
    };
  } catch (error) {
    console.error("Error in addFundsToWalletService:", error);
    return errorResponseHandler(
      "Failed to add funds to wallet",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

/**
 * Process wallet top-up completion
 * @param reference - Transaction reference
 * @param status - Transaction status
 * @param transactionId - Payment transaction ID
 * @param res - Express response object
 * @returns Updated transaction
 */
export const processWalletTopUpService = async (
  reference: string,
  status: "COMPLETED" | "FAILED",
  transactionId?: string,
  res?: Response
) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Find the transaction
    const transaction = await walletTransactionModel.findOne({ 
      reference,
      type: "CREDIT",
      status: "PENDING"
    }).session(session);
    
    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      
      return errorResponseHandler(
        "Transaction not found",
        httpStatusCode.NOT_FOUND,
        res
      );
    }
    
    // Update transaction status
    transaction.status = status;
    if (transactionId) {
      transaction.transactionId = transactionId;
    }
    
    await transaction.save({ session });
    
    // If payment was successful, update wallet balance
    if (status === "COMPLETED") {
      const wallet = await walletModel.findById(transaction.walletId).session(session);
      
      if (!wallet) {
        await session.abortTransaction();
        session.endSession();
        
        return errorResponseHandler(
          "Wallet not found",
          httpStatusCode.NOT_FOUND,
          res
        );
      }
      
      // Update wallet balance
      wallet.balance += transaction.amount;
      await wallet.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    return {
      success: true,
      message: status === "COMPLETED" 
        ? "Wallet top-up completed successfully" 
        : "Wallet top-up failed",
      data: transaction
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error("Error in processWalletTopUpService:", error);
    return errorResponseHandler(
      "Failed to process wallet top-up",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};

/**
 * Deduct funds from wallet for an order
 * @param userId - User ID
 * @param amount - Amount to deduct
 * @param orderId - Order ID
 * @param description - Transaction description
 * @param res - Express response object
 * @returns Updated wallet
 */
export const deductFundsFromWalletService = async (
  userId: string,
  amount: number,
  orderId: string,
  description: string = "Order payment",
  res?: Response
) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Get wallet
    const wallet = await walletModel.findOne({ userId }).session(session);
    
    if (!wallet) {
      await session.abortTransaction();
      session.endSession();
      
      return errorResponseHandler(
        "Wallet not found",
        httpStatusCode.NOT_FOUND,
        res
      );
    }
    
    // Check if wallet has sufficient balance
    if (wallet.balance < amount) {
      await session.abortTransaction();
      session.endSession();
      
      return errorResponseHandler(
        "Insufficient wallet balance",
        httpStatusCode.BAD_REQUEST,
        res
      );
    }
    
    // Create a transaction reference
    const generateRef = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);
    const reference = `ORD-${generateRef()}`;
    
    // Create a transaction
    const transaction = new walletTransactionModel({
      walletId: wallet._id,
      userId,
      amount,
      type: "DEBIT",
      status: "COMPLETED",
      description,
      reference,
      orderId
    });
    
    await transaction.save({ session });
    
    // Update wallet balance
    wallet.balance -= amount;
    await wallet.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return {
      success: true,
      message: "Payment from wallet completed successfully",
      data: {
        wallet,
        transaction
      }
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error("Error in deductFundsFromWalletService:", error);
    return errorResponseHandler(
      "Failed to process payment from wallet",
      httpStatusCode.INTERNAL_SERVER_ERROR,
      res
    );
  }
};
