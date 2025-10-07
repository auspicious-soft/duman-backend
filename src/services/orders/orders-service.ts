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
import { cartModel } from "src/models/cart/cart-schema";
import mongoose from "mongoose";
import { discountVouchersModel } from "src/models/discount-vouchers/discount-vouchers-schema";

// export const createOrderService = async (payload: any, res: Response, userDetails: any, userInfo?: any) => {
// 	console.log('userInfo: ', userInfo);
// 	console.log('payload: ', payload);
// 	console.log('userDetails: ', userDetails);
// 	const products = await productsModel.find({ _id: { $in: payload.productIds } });
// 	const hasDiscountedProduct = products.some((product) => product.isDiscounted);

// 	if (hasDiscountedProduct && payload.voucherId) {
// 		return errorResponseHandler("Voucher cannot be applied to discounted products", httpStatusCode.BAD_REQUEST, res);
// 	}

// 	const identifier = customAlphabet("0123456789", 5);
// 	payload.identifier = identifier();
// 	const newOrder = new ordersModel({ ...payload, userId: userInfo.id });
// 	const savedOrder = await newOrder.save();
// 	if (payload.redeemPoints) {
// 		await usersModel.findByIdAndUpdate(userInfo.id, { $inc: { wallet: -payload.redeemPoints } });
// 		await walletHistoryModel.create({ orderId: savedOrder._id, userId: userInfo.id, type: "redeem", points: payload.redeemPoints });
// 	}
// 	// Automatically initialize payment after order creation
// 	let paymentData = null;
// 	try {
// 		console.log(`Order ${savedOrder.identifier} created successfully. Initializing payment...`);

// 		// Get user information for payment initialization
// 		let userPhone, userEmail;
// 		if (userInfo && userInfo.phoneNumber && userInfo.email) {
// 			// If userInfo is provided directly with phone and email
// 			userPhone = userInfo.phoneNumber;
// 			userEmail = userInfo.email;
// 		} else {
// 			// Fetch user details from database
// 			const userId = userDetails.id;
// 			if (userId) {
// 				const user = await usersModel.findById(userId);
// 				if (user) {
// 					userPhone = user.phoneNumber;
// 					userEmail = user.email;
// 				}
// 			}
// 		}

// 		// Initialize payment with FreedomPay
// 		// const paymentResponse = await initializePayment(savedOrder.identifier, (savedOrder.totalAmount - payload.redeemPoints) / 100, `Payment for order ${savedOrder.identifier}`, userPhone, userEmail);
// 		const modifiedAmount = payload.redeemPoints ? savedOrder.totalAmount - payload.redeemPoints : savedOrder.totalAmount;

// 		const paymentResponse = await initializePayment(savedOrder.identifier as string, modifiedAmount / 100, `Payment for order ${savedOrder.identifier}`, userPhone, userEmail);
// 		paymentData = paymentResponse;
// 		console.log(`Payment initialized successfully for order ${savedOrder.identifier}`);
// 	} catch (paymentError) {
// 		console.error(`Failed to initialize payment for order ${savedOrder.identifier}:`, paymentError);
// 		// Don't fail the order creation if payment initialization fails
// 		// Just log the error and continue
// 	}

// 	return {
// 		success: true,
// 		message: "Order created successfully",
// 		data: {
// 			order: savedOrder,
// 			payment: paymentData,
// 		},
// 	};
// };


export const createOrderService = async (payload: any, res: Response, userDetails: any, userInfo?: any) => {

	// Start a session
	const session = await mongoose.startSession();

	try {
		session.startTransaction();

		const products = await productsModel.find({ _id: { $in: payload.productIds } }).session(session);
		const hasDiscountedProduct = products.some((product) => product.isDiscounted);

		if (hasDiscountedProduct && payload.voucherId) {
			await session.abortTransaction();
			session.endSession();
			return errorResponseHandler("Voucher cannot be applied to discounted products", httpStatusCode.BAD_REQUEST, res);
		}
        await discountVouchersModel.findByIdAndUpdate(payload.voucherId, { $inc: { codeActivated: 1 } }).session(session);
		const identifier = customAlphabet("0123456789", 5);
		payload.identifier = identifier();

		const newOrder = new ordersModel({ ...payload, userId: userInfo.id });
		const savedOrder = await newOrder.save({ session });

		if (payload.redeemPoints) {
			await usersModel.findByIdAndUpdate(
				userInfo.id,
				{ $inc: { wallet: -payload.redeemPoints } },
				{ session }
			);

			await walletHistoryModel.create(
				[{
					orderId: savedOrder._id,
					userId: userInfo.id,
					type: "redeem",
					points: payload.redeemPoints,
				}],
				{ session }
			);
		}

		// Commit the transaction
		await session.commitTransaction();
		session.endSession();

		// Payment initialization - OUTSIDE the transaction
		let paymentData = null;
		try {
			console.log(`Order ${savedOrder.identifier} created successfully. Initializing payment...`);

			let userPhone, userEmail;
			if (userInfo && userInfo.phoneNumber && userInfo.email) {
				userPhone = userInfo.phoneNumber;
				userEmail = userInfo.email;
			} else {
				const userId = userDetails.id;
				if (userId) {
					const user = await usersModel.findById(userId);
					if (user) {
						userPhone = user.phoneNumber;
						userEmail = user.email;
					}
				}
			}

			const modifiedAmount = payload.redeemPoints
				? savedOrder.totalAmount - payload.redeemPoints
				: savedOrder.totalAmount;

			const paymentResponse = await initializePayment(
				savedOrder.identifier as string,
				modifiedAmount / 100,
				`Payment for order ${savedOrder.identifier}`,
				userPhone,
				userEmail
			);

			paymentData = paymentResponse;
			console.log(`Payment initialized successfully for order ${savedOrder.identifier}`);
		} catch (paymentError) {
			console.error(`Failed to initialize payment for order ${savedOrder.identifier}:`, paymentError);
		}

		return {
			success: true,
			message: "Order created successfully",
			data: {
				order: savedOrder,
				payment: paymentData,
			},
		};
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		console.error("Transaction failed:", err);
		throw err; // Will be caught by the calling function (controller)
	}
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


export const getWalletHistoryService = async (userData: any, payload: any, res: Response) => {
	const user = await usersModel.findById(userData.id);
	if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

	// Base filter: user-specific
	let filter: any = { userId: userData.id };

	// If month filter is provided
	if (payload.month) {
		const monthMap: { [key: string]: number } = {
			jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
			jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
		};

		const monthKey = payload.month.toLowerCase();
		const monthNumber = monthMap[monthKey];

		if (monthNumber !== undefined) {
			const year = payload.year ? parseInt(payload.year, 10) : new Date().getFullYear();
			const startDate = new Date(year, monthNumber, 1);
			const endDate = new Date(year, monthNumber + 1, 1);

			filter.createdAt = { $gte: startDate, $lt: endDate };
		}
	} else if (payload.year) {
		// If only year is provided, filter by the full year
		const year = parseInt(payload.year, 10);
		const startDate = new Date(year, 0, 1);
		const endDate = new Date(year + 1, 0, 1);

		filter.createdAt = { $gte: startDate, $lt: endDate };
	}

	const walletHistory = await walletHistoryModel
		.find(filter)
		.populate("orderId", "-paymentGatewayResponse");

	return {
		success: true,
		message: "Wallet History fetched successfully",
		data: { wallet: user.wallet, history: walletHistory },
	};
};

export const createFreeProductOrderService = async (payload: any, res: Response, userDetails: any) => {
	const products = await productsModel.find({ _id: { $in: payload.productIds } });

	const identifier = customAlphabet("0123456789", 5);
	payload.identifier = identifier();
	const newOrder = new ordersModel({ ...payload, userId: userDetails.id,status:"Completed", totalAmount:0 });
	const savedOrder = await newOrder.save();
	
	const cart = await cartModel.findOneAndDelete({ userId: savedOrder.userId }); 

	return {
		success: true,
		message: "Order created successfully",
		data: {
			order: savedOrder,
		},
	};
}; 