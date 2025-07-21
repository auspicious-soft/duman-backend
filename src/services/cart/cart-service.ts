
import mongoose from "mongoose";
import { Response } from "express";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { httpStatusCode } from "src/lib/constant";
import { cartModel } from "src/models/cart/cart-schema";

// Create or Add to Existing Pending Cart
export const createOrAddToCartService = async (user: any, body: any, res: Response) => {
  const { productId } = body;

  if (!productId) {
    return errorResponseHandler("Product ID is required", httpStatusCode.BAD_REQUEST, res);
  }

  // Check if pending cart exists
  let cart = await cartModel.findOne({ userId: user.id, buyed: "pending" });

  if (cart) {
    // Check if product already exists
    const alreadyExists = cart.productId.some(
      (id: mongoose.Types.ObjectId) => id.toString() === productId
    );

    if (!alreadyExists) {
      cart.productId.push(productId);
      await cart.save();
    }

    return {
      success: true,
      message: alreadyExists ? "Product already in cart" : "Product added to existing cart",
      data: cart,
    };
  } else {
    // Create a new cart
    const newCart = await cartModel.create({
      userId: user.id,
      productId: [productId],
      buyed: "pending",
    });

    return {
      success: true,
      message: "New cart created",
      data: newCart,
    };
  }
};

// Get User's Cart (Only Pending)
export const getUserCartService = async (user: any) => {
  const cart = await cartModel
    .findOne({ userId: user.id, buyed: "pending" })
    .populate("productId");

  return {
    success: true,
    message: "Cart fetched successfully",
    data: cart,
  };
};

// Update Cart (buyed status)
export const updateCartStatusService = async (cartId: string, body: any, user: any, res: Response) => {
  const { buyed } = body;

  if (!["pending", "purchased", "cancelled"].includes(buyed)) {
    return errorResponseHandler("Invalid status value", httpStatusCode.BAD_REQUEST, res);
  }

  const cart = await cartModel.findOneAndUpdate(
    { _id: cartId, userId: user.id },
    { $set: { buyed } },
    { new: true }
  );

  if (!cart) {
    return errorResponseHandler("Cart not found or unauthorized", httpStatusCode.NOT_FOUND, res);
  }

  return {
    success: true,
    message: "Cart status updated successfully",
    data: cart,
  };
};

// Delete Cart
export const removeFromCartService = async (req:any, res: Response) => {
  const { productId } = res.req.body;
  const cartId =  req.params.id;
  const user =  req.user;

  if (!productId) {
    return errorResponseHandler("Product ID is required to remove from cart", httpStatusCode.BAD_REQUEST, res);
  }

  const cart = await cartModel.findOne({ _id: cartId, userId: user.id,buyed:"pending" });

  if (!cart) {
    return errorResponseHandler("Cart not found or unauthorized", httpStatusCode.NOT_FOUND, res);
  }

  // Remove the product from the cart
  const updatedProductIds = cart.productId.filter(
    (id: any) => id.toString() !== productId
  );

  if (updatedProductIds.length === 0) {
    // If no products left, delete the cart
    await cartModel.findByIdAndDelete(cart._id);
    return {
      success: true,
      message: "Product removed and cart deleted as it became empty",
    };
  } else {
    // Otherwise, update the cart with remaining products
    cart.productId = updatedProductIds;
    await cart.save();
    return {
      success: true,
      message: "Product removed from cart",
      data: cart,
    };
  }
};
