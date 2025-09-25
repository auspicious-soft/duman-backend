import { Response } from "express";
import { httpStatusCode } from "src/lib/constant";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { notificationsModel } from "src/models/notifications/notification-schema";
import { usersModel } from "src/models/user/user-schema";
import { sendNotification } from "src/utils/FCM/FCM";

export const sendNotificationToUsersService = async (payload: any, res: Response) => {
	try {
		const users = await usersModel.find().select("fcmToken");
		if (!users.length) return errorResponseHandler("No users found", httpStatusCode.NO_CONTENT, res);

		// const notifications = users.map(user => ({
		//     userIds: user._id,
		//     title: payload.title,
		//     description: payload.description
		// }));

		// // Save notifications to database
		// await notificationsModel.insertMany(notifications);

		// Send FCM notifications to all users
		const fcmPromises = users.map((user) => {
			const userIds = [user._id];
			return sendNotification({
				userIds: userIds,
				type: payload.type,
				adminTitle: payload.title,
				adminDescription: payload.description,
			});
		});

		await Promise.all(fcmPromises);

		return { success: true, message: "Notification sent successfully to all users" };
	} catch (error) {
		console.error("Error in sendNotificationToUsersService:", error);
		throw error;
	}
};

export const sendNotificationToUserService = async (payload: any, res: Response) => {
	try {
		const { title, description, userIds } = payload;
		if (!userIds) {
			return errorResponseHandler("User IDs are required", httpStatusCode.BAD_REQUEST, res);
		}

		const users = await usersModel.find({ _id: { $in: userIds } }).select("fcmToken");
		if (!users.length) return errorResponseHandler("No users found", httpStatusCode.NO_CONTENT, res);

		// const notifications = users.map(user => ({
		//     userIds: user._id,
		//     title,
		//     description
		// }));

		// // Save notifications to database
		// const savedNotifications = await notificationsModel.insertMany(notifications);
		// console.log('savedNotifications: ', savedNotifications);

		// Send FCM notifications to specific users
		// const fcmPromises = users.map(user => {
		// if (user.fcmToken) {
		// return sendNotification( title, description,userIds);
		// }
		// return Promise.resolve();
		// });
		const fcmPromises = await sendNotification({
			userIds: userIds,
			type: payload.type,
			adminTitle: title,
			adminDescription: description,
		});
		// await Promise.all(fcmPromises);

		return { success: true, message: "Notification sent successfully" };
	} catch (error) {
		console.error("Error in sendNotificationToUserService:", error);
		throw error;
	}
};

export const getAllNotificationsOfUserService = async (userData: any, res: Response) => {
	try {
		const user = await usersModel.findById(userData.id);
		if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

		const results = await notificationsModel.find({ userIds: userData.id }).sort({ createdAt: -1 }).select("-__v -userId");

		return { success: true, message: "Notifications fetched successfully", data: results };
	} catch (error) {
		console.error("Error in getAllNotificationsOfUserService:", error);
		throw error;
	}
};

export const markAllNotificationsAsReadService = async (userData: any, res: Response) => {
	try {
		const user = await usersModel.findById(userData.id);
		if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

		const notifications = await notificationsModel.find({ userIds: userData.id, isRead: false }).select("-__v -userId");
		console.log('notifications: ', notifications);

		if (!notifications.length) {
			return errorResponseHandler("No notifications found", httpStatusCode.NO_CONTENT, res);
		}

		await notificationsModel.updateMany({ userIds: userData.id, isRead: false }, { $set: { isRead: true } });

		return { success: true, message: "Notifications marked as read successfully" };
	} catch (error) {
		console.error("Error in markAllNotificationsAsReadService:", error);
		throw error;
	}
};
export const markNotificationsAsReadService = async (userData: any,id:string, res: Response) => {
	try {
		const user = await usersModel.findById(userData.id);
		console.log('userData.id: ', userData.id);
		if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

		const notifications = await notificationsModel.find({ userIds: userData.id,_id: id, isRead: false }).select("-__v -userId");
		console.log('notifications: ', notifications);

		if (!notifications.length) {
			return errorResponseHandler("No notifications found", httpStatusCode.NO_CONTENT, res);
		}

		await notificationsModel.updateMany({ userIds: userData.id, _id: id, isRead: false }, { $set: { isRead: true } });

		return { success: true, message: "Notification marked as read successfully" };
	} catch (error) {
		console.error("Error in markAllNotificationsAsReadService:", error);
		throw error;
	}
};
