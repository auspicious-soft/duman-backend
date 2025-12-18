import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";
import { ordersModel } from "src/models/orders/orders-schema";
import { freedomPayConfig } from "src/config/freedompay";
import { parseStringPromise } from "xml2js";
import { walletHistoryModel } from "src/models/wallet-history/wallet-history-schema";
import { usersModel } from "src/models/user/user-schema";
import { cartModel } from "src/models/cart/cart-schema";
import { readProgressModel } from "src/models/user-reads/read-progress-schema";
import { discountVouchersModel } from "src/models/discount-vouchers/discount-vouchers-schema";

console.log(freedomPayConfig);

/**
 * Handles post-payment success actions
 * @param order - The order that was successfully paid
 * @param paymentDetails - Payment details from the gateway
 */
async function handlePaymentSuccess(order: any, paymentDetails: any) {
	try {
		console.log(`Handling post-payment success actions for order ${order.identifier}`);

		// Here you can add additional business logic for successful payments:
		// 1. Send confirmation email/SMS to user
		// 2. Update user's purchased products/access
		// 3. Generate receipts
		// 4. Update inventory
		// 5. Trigger analytics events
		// 6. Send notifications

		// Example: Log the successful payment for analytics
		console.log("Payment success analytics:", {
			orderId: order.identifier,
			userId: order.userId,
			amount: paymentDetails.pg_amount,
			paymentMethod: paymentDetails.pg_payment_method,
			transactionId: paymentDetails.pg_payment_id,
			completedAt: new Date(),
		});
		const amount = (Number(paymentDetails.pg_amount) || 0) / 100; //TODO: confirm if division by 100 is needed
		console.log('amount: ', amount);
		const orderDetails = await ordersModel.findOne({ identifier: order.identifier });
		await walletHistoryModel.create({ orderId: orderDetails?._id, userId: order.userId, type: "earn", points: amount });
		await usersModel.findByIdAndUpdate(order.userId, { $inc: { wallet: amount } });
		const cart = await cartModel.findOneAndDelete({ userId: order.userId }); 
	} catch (error) {
		console.error("Error in post-payment success handling:", error);
	}
}

// Generate signature according to FreedomPay documentation
function generateSignature(params: Record<string, any>, secretKey: string, scriptName: string): string {
	// Sort parameters alphabetically by key
	const sortedKeys = Object.keys(params).sort();
	// Start with script name
	let sigString = `${scriptName};`;
	// Append each parameter value (excluding pg_sig) in sorted order
	sortedKeys.forEach((key) => {
		if (key !== "pg_sig") {
			sigString += `${params[key]};`;
		}
	});
	// Append secret key
	sigString += secretKey;
	// Generate MD5 hash and return as 32-character lowercase hexadecimal
	const hash = crypto.createHash("md5").update(sigString).digest("hex");
	console.log("Generated signature:", hash);
	return hash;
}

export const initializePayment = async (orderId: string, amount: number, description: string, userPhone?: any, userEmail?: string): Promise<{ redirect_url: string }> => {
	try {
		const params: Record<string, any> = {
			pg_merchant_id: freedomPayConfig.merchantId,
			pg_order_id: orderId,
			pg_amount: amount,
			pg_description: description,
			pg_salt: crypto.randomBytes(16).toString("hex"),
			pg_currency: freedomPayConfig.currency,
			pg_check_url: freedomPayConfig.checkUrl,
			pg_result_url: freedomPayConfig.resultUrl,
			pg_success_url: freedomPayConfig.successUrl,
			pg_failure_url: freedomPayConfig.failureUrl,
			pg_request_method: freedomPayConfig.requestMethod,
			pg_lifetime: freedomPayConfig.lifetime.toString(),
			pg_testing_mode: freedomPayConfig.testingMode ? "1" : "0",
			pg_payment_route: "frame",
			...(userPhone && !isNaN(userPhone) && { pg_user_phone: userPhone }),
			...(userEmail && { pg_user_contact_email: userEmail }),
		};

		params.pg_sig = generateSignature(params, freedomPayConfig.secretKey, "init_payment.php");

		const formData = new FormData();
		Object.entries(params).forEach(([key, value]) => {
			formData.append(key, value);
		});

		const response = await axios.post(freedomPayConfig.apiUrl, formData, {
			headers: {
				...formData.getHeaders(),
			},
		});

		console.log("Raw Payment response:", response.data);

		// Parse XML response
		const parsedResponse = await parseStringPromise(response.data, { explicitArray: false });
		console.log("parsedResponse: ", parsedResponse);

		const redirectUrl = parsedResponse.response.pg_redirect_url;
		console.log('redirectUrl: ', redirectUrl);
		if (redirectUrl) {
			return { redirect_url: redirectUrl }; // returning object
		} else {
			throw new Error("Redirect URL not found in response");
		}
	} catch (error: any) {
		console.error("Payment error:", error.response ? error.response.data : error.message);
		throw error;
	}
};

/**
 * Processes a payment check request from FreedomPay
 * @param params - Parameters from the check request
 * @returns Response to send back to FreedomPay
 */
export const processCheckRequest = async (params: Record<string, any>) => {
	try {
		const orderId = params.pg_order_id;
		const amount = parseFloat(params.pg_amount);

		// Find the order in the database
		const order = await ordersModel.findOne({ identifier: orderId });

		if (!order) {
			const response: Record<string, any> = {
				pg_status: "rejected",
				pg_description: "Order not found",
				pg_salt: Math.random().toString(36).substring(2, 15),
			};

			// Generate signature for the response
			response.pg_sig = generateSignature(response, freedomPayConfig.secretKey, "check.php");

			return response;
		}

		// Check if the amount matches
		if (order.totalAmount !== amount) {
			const response: Record<string, any> = {
				pg_status: "rejected",
				pg_description: "Amount mismatch",
				pg_salt: Math.random().toString(36).substring(2, 15),
			};

			// Generate signature for the response
			response.pg_sig = generateSignature(response, freedomPayConfig.secretKey, "check.php");

			return response;
		}

		// If everything is fine, allow the payment
		const response: Record<string, any> = {
			pg_status: "ok",
			pg_description: "Payment allowed",
			pg_salt: Math.random().toString(36).substring(2, 15),
		};

		// Generate signature for the response
		response.pg_sig = generateSignature(response, freedomPayConfig.secretKey, "check.php");

		return response;
	} catch (error) {
		console.error("Error processing check request:", error);
		const response: Record<string, any> = {
			pg_status: "error",
			pg_description: "Internal server error",
			pg_salt: Math.random().toString(36).substring(2, 15),
		};

		// Generate signature for the response
		response.pg_sig = generateSignature(response, freedomPayConfig.secretKey, "check.php");

		return response;
	}
};

/**
 * Processes a payment result request from FreedomPay
 * @param params - Parameters from the result request
 * @returns Response to send back to FreedomPay
 */
export const processResultRequest = async (params: Record<string, any>) => {
	console.log('params: ', params);
	try {
		const orderId = params.pg_order_id;
		const paymentId = params.pg_payment_id;
		const result = parseInt(params.pg_result);
		const paymentAmount = parseFloat(params.pg_amount);

		console.log("Processing payment result:", {
			orderId,
			paymentId,
			result,
			paymentAmount,
			paymentMethod: params.pg_payment_method,
		});

		// Find the order in the database
		const order = await ordersModel.findOne({ identifier: orderId });
		console.log('order: ', order);

		if (!order) {
			console.error(`Order not found for payment result: ${orderId}`);
			const response: Record<string, any> = {
				pg_status: "rejected",
				pg_description: "Order not found",
				pg_salt: Math.random().toString(36).substring(2, 15),
			};

			// Generate signature for the response
			response.pg_sig = generateSignature(response, freedomPayConfig.secretKey, "result.php");

			return response;
		}

		// Update order status based on payment result
		if (result === 1) {
			// Payment successful - Update comprehensive payment details
			console.log(`Payment successful for order ${orderId}. Updating order details...`);

			// Verify payment amount matches order amount
			if (Math.abs(order.totalAmount - paymentAmount) > 0.01) {
				console.warn(`Payment amount mismatch for order ${orderId}. Expected: ${order.totalAmount}, Received: ${paymentAmount}`);
			}

			// Update order with comprehensive payment information
			order.status = "Completed";
			order.transactionId = paymentId;
			order.paymentMethod = params.pg_payment_method || "FreedomPay";
			order.paymentCompletedAt = new Date();
			order.paymentAmount = paymentAmount;
			
			// Store the complete payment gateway response for audit purposes
			order.paymentGatewayResponse = {
				pg_payment_id: paymentId,
				pg_result: result,
				pg_amount: paymentAmount,
				pg_currency: params.pg_currency,
				pg_payment_method: params.pg_payment_method,
				pg_payment_date: params.pg_payment_date,
				pg_card_pan: params.pg_card_pan,
				pg_card_exp: params.pg_card_exp,
				pg_card_brand: params.pg_card_brand,
				pg_auth_code: params.pg_auth_code,
				pg_rrn: params.pg_rrn,
				pg_response_code: params.pg_response_code,
				pg_response_description: params.pg_response_description,
				pg_salt: params.pg_salt,
				processedAt: new Date(),
			};
            const readProgressDocs = order.productIds?.map((productId: any) => ({
				userId: order.userId,
				bookId: productId,
				progress: 0,
			}));
            
			const readProgress = await readProgressModel.insertMany(readProgressDocs);

			const redeemPoints = Number(order.redeemPoints);
			if (order.redeemPoints && redeemPoints > 0) {
			await usersModel.findByIdAndUpdate(order.userId, { $inc: { wallet: -redeemPoints } });

			await walletHistoryModel.create(
				[
					{
						orderId: order._id,
						userId: order.userId,
						type: "redeem",
						points:  order.redeemPoints,
					},
				],
				
			);
		}
		if (order.voucherId) {
			await discountVouchersModel
				.findByIdAndUpdate(order.voucherId, {
					$inc: { codeActivated: 1 },
				})
		}
			const cart = await cartModel.findOneAndDelete({ userId: order.userId });
			console.log('cart: ', cart);
			await order.save();
			
			console.log(`Order ${orderId} successfully updated with payment details:`, {
				transactionId: paymentId,
				paymentMethod: order.paymentMethod,
				paymentAmount: paymentAmount,
				completedAt: order.paymentCompletedAt,
			});

			// Handle post-payment success actions
			await handlePaymentSuccess(order, params);

			const response: Record<string, any> = {
				pg_status: "ok",
				pg_description: "Order paid",
				pg_salt: Math.random().toString(36).substring(2, 15),
			};
			// Generate signature for the response
			response.pg_sig = generateSignature(response, freedomPayConfig.secretKey, "result.php");
			return response;
		} else {
			// Payment failed
			console.log(`Payment failed for order ${orderId}. Result code: ${result}`);

			order.status = "Failed";

			// Store failure information for audit
			order.paymentGatewayResponse = {
				pg_payment_id: paymentId,
				pg_result: result,
				pg_amount: paymentAmount,
				pg_failure_code: params.pg_failure_code,
				pg_failure_description: params.pg_failure_description,
				pg_salt: params.pg_salt,
				processedAt: new Date(),
			};

			await order.save();

			console.log(`Order ${orderId} marked as failed with details stored`);

			const response: Record<string, any> = {
				pg_status: "ok",
				pg_description: "Payment failure recorded",
				pg_salt: Math.random().toString(36).substring(2, 15),
			};

			// Generate signature for the response
			response.pg_sig = generateSignature(response, freedomPayConfig.secretKey, "result.php");

			return response;
		}
	} catch (error) {
		console.error("Error processing result request:", error);
		const response: Record<string, any> = {
			pg_status: "error",
			pg_description: "Internal server error",
			pg_salt: Math.random().toString(36).substring(2, 15),
		};
		// Generate signature for the response
		response.pg_sig = generateSignature(response, freedomPayConfig.secretKey, "result.php");

		return response;
	}
};
