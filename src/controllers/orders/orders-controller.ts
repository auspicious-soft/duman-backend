import { Request, Response } from "express"
import { createOrderService, getOrderService, updateOrderService, getAllOrdersService, getWalletHistoryService } from "../../services/orders/orders-service";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";


export const createOrder = async (req: Request, res: Response) => {
    try {
        // Extract user information from the authenticated request
        let userInfo = null;
        if (req.user) {
            // For mobile app users (JWT token)
            if (typeof req.user === 'object' && 'id' in req.user) {
                userInfo = {
                    id: req.user.id,
                    email: req.user.email,
                    phoneNumber: req.user.phoneNumber
                };
            }
        } else if ((req as any).currentUser) {
            // For web users (Next.js auth)
            const userId = (req as any).currentUser;
            // We'll let the service fetch user details from the database
            userInfo = { id: userId };
        }

        const response = await createOrderService(req.body, res, userInfo);
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

export const getWalletHistory = async (req: Request, res: Response) => {
    try {
        const response = await getWalletHistoryService(req.params.id, res);
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
