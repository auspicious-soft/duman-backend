import { Request, Response } from "express"
import {
    createOrderService,
    getOrderService,
    updateOrderService,
    deleteOrderService,
    getAllOrdersService,
    initOrderPaymentService,
    checkWalletBalanceForOrderService
} from "../../services/orders/orders-service";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";


export const createOrder = async (req: Request, res: Response) => {
    try {
        const response = await createOrderService(req.body, res);
        return res.status(httpStatusCode.CREATED).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

export const getOrder = async (req: Request, res: Response) => {
    try {
        const response = await getOrderService(req.params.id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

export const updateOrder = async (req: Request, res: Response) => {
    try {
        const response = await updateOrderService(req.params.id, req.body, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const response = await deleteOrderService(req.params.id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "Failed to delete order" });
    }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const response = await getAllOrdersService(req.query, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

/**
 * Initializes payment for an order
 * @param req - Express request object
 * @param res - Express response object
 */
export const initOrderPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { paymentMethod = 'freedompay' } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(httpStatusCode.UNAUTHORIZED).json({
                success: false,
                message: "User not authenticated"
            });
        }

        // Get user information
        let userId, userPhone, userEmail;

        if (typeof user !== "string" && "_id" in user) {
            userId = user._id.toString();
        }

        if (typeof user !== "string" && "phoneNumber" in user) {
            userPhone = user.phoneNumber;
        }

        if (typeof user !== "string" && "email" in user) {
            userEmail = user.email;
        }

        const response = await initOrderPaymentService(
            id,
            paymentMethod,
            userId,
            userPhone,
            userEmail,
            res
        );

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
 * Check if user has sufficient wallet balance for an order
 * @param req - Express request object
 * @param res - Express response object
 */
export const checkWalletBalance = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            return res.status(httpStatusCode.UNAUTHORIZED).json({
                success: false,
                message: "User not authenticated"
            });
        }

        let userId;
        if (typeof user !== "string" && "_id" in user) {
            userId = user._id.toString();
        } else {
            return res.status(httpStatusCode.BAD_REQUEST).json({
                success: false,
                message: "Invalid user information"
            });
        }

        const response = await checkWalletBalanceForOrderService(userId, id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: message || "Failed to check wallet balance"
        });
    }
};
