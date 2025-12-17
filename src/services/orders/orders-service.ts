import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { filterBooksByLanguage, queryBuilder, sortBooks, toArray } from "src/utils";
import { ordersModel } from "../../models/orders/orders-schema";
import { customAlphabet } from "nanoid";
import { productsModel } from "../../models/products/products-schema";
import { initializePayment } from "../payment/freedompay-service";
import { usersModel } from "../../models/user/user-schema";
import { walletHistoryModel } from "src/models/wallet-history/wallet-history-schema";
import { cartModel } from "src/models/cart/cart-schema";
import mongoose, { ClientSession } from "mongoose";
import { discountVouchersModel } from "src/models/discount-vouchers/discount-vouchers-schema";
import { readProgressModel } from "src/models/user-reads/read-progress-schema";
import { favoritesModel } from "src/models/product-favorites/product-favorites-schema";


export const createOrderService = async (payload: any, res: Response, userInfo: any, user: unknown) => {
	const session: ClientSession = await mongoose.startSession();
    
	// helper to safely close the session without double-aborting
	const safeAbort = async () => {
		try {
			await session.abortTransaction();
		} catch (_) {}
		session.endSession();
	};

	try {
		session.startTransaction();
        const userDetails = await usersModel.findById(userInfo.id).session(session);
		if(!userDetails){
			await safeAbort();
			return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
		}
		// Fetch products for validation
		const products = await productsModel.find({ _id: { $in: payload.productIds } }).session(session);

		const hasDiscountedProduct = products.some((product) => product.isDiscounted);

		// Restrict voucher on discounted products
		if (hasDiscountedProduct && payload.voucherId) {
			await safeAbort();
			return errorResponseHandler("Voucher cannot be applied to discounted products", httpStatusCode.BAD_REQUEST, res);
		}

		// If voucher is applied, increment code activation
		if (payload.voucherId) {
			await discountVouchersModel
				.findByIdAndUpdate(payload.voucherId, {
					$inc: { codeActivated: 1 },
				})
				.session(session);
		}

		// Generate a unique order identifier
		const identifier = customAlphabet("0123456789", 5);
		payload.identifier = identifier();

		// Create and save new order
		const newOrder = new ordersModel({
			...payload,
			userId: userInfo.id,
		});

		const savedOrder = await newOrder.save({ session });

		// Handle redeem points, if applicable
		if (payload.redeemPoints) {
			await usersModel.findByIdAndUpdate(userInfo.id, { $inc: { wallet: -payload.redeemPoints } }, { session });

			await walletHistoryModel.create(
				[
					{
						orderId: savedOrder._id,
						userId: userInfo.id,
						type: "redeem",
						points: payload.redeemPoints,
					},
				],
				{ session }
			);
		}

		// Commit transaction
		await session.commitTransaction();
		session.endSession();

		// Initialize payment (outside the transaction)
		let paymentData = null;
		try {
			console.log(`Order ${savedOrder.identifier} created successfully. Initializing payment...`);

			let userPhone = userDetails?.countryCode ? `${userDetails?.countryCode}${userDetails?.phoneNumber}` : undefined;
			let userEmail = userInfo?.email;

			if (!userPhone || !userEmail) {
				const user = await usersModel.findById(userInfo.id);
				if (user) {
					userPhone = user.countryCode ? `${user.countryCode}${user.phoneNumber}` :undefined;
					userEmail = user.email;
				}
			}

			const modifiedAmount = payload.redeemPoints ? savedOrder.totalAmount - payload.redeemPoints : savedOrder.totalAmount;

			const paymentResponse = await initializePayment(savedOrder.identifier as string, modifiedAmount, `Payment for order ${savedOrder.identifier}`, userPhone, userEmail);

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
		await safeAbort();
		console.error("Transaction failed:", err);
		throw err;
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
	const limit = parseInt(payload.limit as string) || 100;
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

export const getOrderItemsService = async (
  user: any,
  payload: any,
  res: Response
) => {
  const userData = await usersModel.findById(user.id);

  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 100;
  const offset = (page - 1) * limit;

  // 1️⃣ Fetch orders (ONLY productIds)
  const orders = await ordersModel
    .find({ userId: user.id, status: "Completed" })
    .skip(offset)
    .limit(limit)
    .select(" productIds");

  if (!orders.length) {
    return errorResponseHandler("Order not found", httpStatusCode.NOT_FOUND, res);
  }

  // 2️⃣ Collect all unique productIds from orders
  const allProductIds = [
    ...new Set(
      orders.flatMap((order) =>
        order.productIds.map((id: any) => id.toString())
      )
    ),
  ];

  // 3️⃣ Fetch products from productsModel
  let products = await productsModel
    .find({ _id: { $in: allProductIds } })
    .populate([
      { path: "authorId", select: "name" },
      { path: "categoryId", select: "name" },
      { path: "publisherId", select: "name" },
    ]);

  // 4️⃣ Get favorites
  const favoriteProducts = await favoritesModel
    .find({ userId: user.id })
    .select("productId");

  const favoriteIds = favoriteProducts.map((fav) =>
    fav.productId.toString()
  );

  // 5️⃣ Attach isFavorite
  let productsWithFavoriteStatus = products.map((product) => ({
    ...product.toObject(),
    isFavorite: favoriteIds.includes(product._id.toString()),
  }));

  // 6️⃣ Language filter + sorting
  const languages = toArray(payload.language);
  productsWithFavoriteStatus = filterBooksByLanguage(
    productsWithFavoriteStatus,
    languages
  );

  productsWithFavoriteStatus = sortBooks(
    productsWithFavoriteStatus,
    payload.sorting,
    userData?.productsLanguage,
    user?.language
  );
  const paginatedBooks = productsWithFavoriteStatus.slice(
    offset,
    offset + limit
  );
const  totalOrders = productsWithFavoriteStatus.length;

  return {
    success: true,
    message: "Order items retrieved successfully",
    page,
    limit,
    total: totalOrders,
    data: {books:paginatedBooks},
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
			jan: 0,
			feb: 1,
			mar: 2,
			apr: 3,
			may: 4,
			jun: 5,
			jul: 6,
			aug: 7,
			sep: 8,
			oct: 9,
			nov: 10,
			dec: 11,
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

	const walletHistory = await walletHistoryModel.find(filter).populate("orderId", "-paymentGatewayResponse");

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
	const newOrder = new ordersModel({ ...payload, userId: userDetails.id, status: "Completed", totalAmount: 0 });
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
