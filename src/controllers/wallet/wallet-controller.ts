import { Request, Response } from "express";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { 
  addFundsToWalletService, 
  getWalletBalanceService, 
  getWalletTransactionsService, 
  processWalletTopUpService 
} from "../../services/wallet/wallet-service";

/**
 * Get wallet balance for the authenticated user
 * @param req - Express request object
 * @param res - Express response object
 */
export const getWalletBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const response = await getWalletBalanceService(userId.toString(), res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message || "Failed to get wallet balance"
    });
  }
};

/**
 * Get wallet transactions for the authenticated user
 * @param req - Express request object
 * @param res - Express response object
 */
export const getWalletTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const response = await getWalletTransactionsService(
      userId.toString(),
      page,
      limit,
      res
    );
    
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message || "Failed to get wallet transactions"
    });
  }
};

/**
 * Initiate adding funds to wallet
 * @param req - Express request object
 * @param res - Express response object
 */
export const addFundsToWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(httpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated"
      });
    }
    
    const { amount } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Valid amount is required"
      });
    }
    
    const response = await addFundsToWalletService(
      userId.toString(),
      parseFloat(amount),
      res
    );
    
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message || "Failed to add funds to wallet"
    });
  }
};

/**
 * Process wallet top-up completion (callback from payment gateway)
 * @param req - Express request object
 * @param res - Express response object
 */
export const processWalletTopUp = async (req: Request, res: Response) => {
  try {
    const { reference, status, transactionId } = req.body;
    
    if (!reference || !status) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Reference and status are required"
      });
    }
    
    const validStatus = status === "COMPLETED" || status === "FAILED";
    
    if (!validStatus) {
      return res.status(httpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Invalid status"
      });
    }
    
    const response = await processWalletTopUpService(
      reference,
      status,
      transactionId,
      res
    );
    
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: message || "Failed to process wallet top-up"
    });
  }
};
