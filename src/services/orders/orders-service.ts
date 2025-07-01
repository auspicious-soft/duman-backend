import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { ordersModel } from "../../models/orders/orders-schema";
import { customAlphabet } from "nanoid";
import { productsModel } from "../../models/products/products-schema";
import { initializePayment } from "../payment/freedompay-service";
import { usersModel } from "../../models/user/user-schema";
import { walletHistoryModel } from "src/models/wallet-history/wallet-history-schema";

export const createOrderService = async (payload: any, res: Response,userDetails:any, userInfo?: any) => {
	const products = await productsModel.find({ _id: { $in: payload.productIds } });
	const hasDiscountedProduct = products.some((product) => product.isDiscounted);

	if (hasDiscountedProduct && payload.voucherId) {
		return errorResponseHandler("Voucher cannot be applied to discounted products", httpStatusCode.BAD_REQUEST, res);
	}

	const identifier = customAlphabet("0123456789", 5);
	payload.identifier = identifier();
	const newOrder = new ordersModel({...payload, userId:userDetails.id});
	const savedOrder = await newOrder.save();
	if (payload.redeemPoints) {
		await usersModel.findByIdAndUpdate(payload.userId, { $inc: { wallet: -payload.redeemPoints } });
		await walletHistoryModel.create({ orderId: savedOrder.identifier, userId: payload.userId, type: "redeem", points: payload.redeemPoints });
	}
	// Automatically initialize payment after order creation
	let paymentData = null;
	try {
		console.log(`Order ${savedOrder.identifier} created successfully. Initializing payment...`);

		// Get user information for payment initialization
		let userPhone, userEmail;
		if (userInfo && userInfo.phoneNumber && userInfo.email) {
			// If userInfo is provided directly with phone and email
			userPhone = userInfo.phoneNumber;
			userEmail = userInfo.email;
		} else {
			// Fetch user details from database
			const userId = userDetails.id ;
			if (userId) {
				const user = await usersModel.findById(userId);
				if (user) {
					userPhone = user.phoneNumber;
					userEmail = user.email;
				}
			}
		}

		// Initialize payment with FreedomPay
		// const paymentResponse = await initializePayment(savedOrder.identifier, (savedOrder.totalAmount - payload.redeemPoints) / 100, `Payment for order ${savedOrder.identifier}`, userPhone, userEmail);
const modifiedAmount = payload.redeemPoints ? (savedOrder.totalAmount - payload.redeemPoints) : savedOrder.totalAmount;

const paymentResponse = await initializePayment(
  savedOrder.identifier as string,
  modifiedAmount/100,
  `Payment for order ${savedOrder.identifier}`,
  userPhone,
  userEmail
);
		paymentData = paymentResponse;
		console.log(`Payment initialized successfully for order ${savedOrder.identifier}`);
	} catch (paymentError) {
		console.error(`Failed to initialize payment for order ${savedOrder.identifier}:`, paymentError);
		// Don't fail the order creation if payment initialization fails
		// Just log the error and continue
	}

	return {
		success: true,
		message: "Order created successfully",
		data: {
			order: savedOrder,
			payment: paymentData,
		},
	};
};

export const getOrderService = async (id: any, res: Response) => {
	const order = await ordersModel.findById(id);
	// let query:any  = {}
	// if(payload)
	// const usersTotalAmount =  await ordersModel.find({userId : id, ...query}).select('totalAmount')

	if (!order) return errorResponseHandler("Order not found", httpStatusCode.NOT_FOUND, res);
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

	const totalDataCount = Object.keys(query).length < 1 ? await ordersModel.countDocuments() : await ordersModel.countDocuments(query);
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

export const updateOrderService = async (id: string, payload: any, res: Response) => {
	const updatedOrder = await ordersModel.findByIdAndUpdate(id, payload, {
		new: true,
	});
	if (!updatedOrder) return errorResponseHandler("Order not found", httpStatusCode.NOT_FOUND, res);
	return {
		success: true,
		message: "Order updated successfully",
		data: updatedOrder,
	};
};

export const getWalletHistoryService = async (id: string, res: Response) => {
  const user = await usersModel.findById(id)
  if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
	const walletHistory = await walletHistoryModel.find({userId: id}).populate('orderId');

	return {
		success: true,
		message: "Wallet History fetched successfully",
		data: walletHistory,
	};
};
