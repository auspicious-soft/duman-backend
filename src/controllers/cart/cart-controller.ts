import { Request, Response } from "express";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { createOrAddToCartService, getUserCartService, removeFromCartService, updateCartStatusService } from "src/services/cart/cart-service";

// Create or add to cart
export const createOrAddToCartController = async (req: Request, res: Response) => {
  try {
    const response = await createOrAddToCartService(req.user, req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message });
  }
};

// Get user's current cart
export const getUserCartController = async (req: Request, res: Response) => {
  try {
    const response = await getUserCartService(req.user);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message });
  }
};

// Update cart status (e.g., mark as "purchased")
export const updateCartStatusController = async (req: Request, res: Response) => {
  try {
    const response = await updateCartStatusService(req.params.id, req.body, req.user, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message });
  }
};

// Delete cart
export const removeFromCartController = async (req: Request, res: Response) => {
  try {
    const response = await removeFromCartService(req, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message });
  }
};
