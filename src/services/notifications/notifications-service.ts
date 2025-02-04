import { Response } from "express";
import { httpStatusCode } from "src/lib/constant";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { notificationsModel } from "src/models/notifications/notification-schema";
import { usersModel } from "src/models/user/user-schema";

export const sendNotificationToUsersService = async (payload: { title: string, description: string }, res: Response) => {
    const users = await usersModel.find()
    if (!users.length) return errorResponseHandler("No users found", httpStatusCode.NO_CONTENT, res)
    const notifications = users.map(user => ({ userIds: user._id, title: payload.title, description: payload.description }))
    await notificationsModel.insertMany(notifications)
    return { success: true, message: "Notification sent successfully to all the users" }
}

export const sendNotificationToUserService = async (payload: { title: string, description: string, userIds: string[] }, res: Response) => {
    const { title, description, userIds } = payload
    const users = await usersModel.find({ _id: { $in: userIds } })
    if (!users.length) return errorResponseHandler("No users found", httpStatusCode.NO_CONTENT, res)
    const notifications = users.map(user => ({ userIds: user._id, title, description }))
    await notificationsModel.insertMany(notifications)
    return { success: true, message: "Notification sent successfully" };
};

export const getAllNotificationsOfUserService = async (id: string, res: Response) => {
    const user = await usersModel.findById(id)
    if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res)
    const results = await notificationsModel.find({ userIds: id }).sort({ createdAt: -1 }).select("-__v -userId")
    return { success: true, message: "Notifications fetched successfully", data: results }
}

export const markAllNotificationsAsReadService = async (id: string, res: Response) => {
    const user = await usersModel.findById(id)
    if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res)
    const notifications = await notificationsModel.find({ userIds: id, read: false }).select("-__v -userId")
    if (!notifications.length) return errorResponseHandler("No notifications found", httpStatusCode.NO_CONTENT, res)
    for (const notification of notifications) {
        await notificationsModel.findByIdAndUpdate(notification._id, { read: true })
    }
    return { success: true, message: "Notifications marked as read successfully" }
}   

// export const sendNotificationToUsersService = async (payload: NotificationPayload, res: Response) => {
//     try {
//         const users = await usersModel.find().select('fcmToken');
//         if (!users.length) return errorResponseHandler("No users found", httpStatusCode.NO_CONTENT, res);

//         const notifications = users.map(user => ({
//             userIds: user._id,
//             title: payload.title,
//             description: payload.description
//         }));

//         // Save notifications to database
//         await notificationsModel.insertMany(notifications);

//         // Send FCM notifications to all users
//         const fcmPromises = users.map(user => {
//             if (user.fcmToken) {
//                 return sendFCMNotification(user.fcmToken, payload.title, payload.description);
//             }
//             return Promise.resolve();
//         });

//         await Promise.all(fcmPromises);

//         return { success: true, message: "Notification sent successfully to all users" };
//     } catch (error) {
//         console.error('Error in sendNotificationToUsersService:', error);
//         throw error;
//     }
// };

// export const sendNotificationToUserService = async (payload: NotificationPayload, res: Response) => {
//     try {
//         const { title, description, userIds } = payload;
//         if (!userIds) {
//             return errorResponseHandler("User IDs are required", httpStatusCode.BAD_REQUEST, res);
//         }

//         const users = await usersModel.find({ _id: { $in: userIds } }).select('fcmToken');
//         if (!users.length) return errorResponseHandler("No users found", httpStatusCode.NO_CONTENT, res);

//         const notifications = users.map(user => ({
//             userIds: user._id,
//             title,
//             description
//         }));

//         // Save notifications to database
//         await notificationsModel.insertMany(notifications);

//         // Send FCM notifications to specific users
//         const fcmPromises = users.map(user => {
//             if (user.fcmToken) {
//                 return sendFCMNotification(user.fcmToken, title, description);
//             }
//             return Promise.resolve();
//         });

//         await Promise.all(fcmPromises);

//         return { success: true, message: "Notification sent successfully" };
//     } catch (error) {
//         console.error('Error in sendNotificationToUserService:', error);
//         throw error;
//     }
// };

// export const getAllNotificationsOfUserService = async (id: string, res: Response) => {
//     try {
//         const user = await usersModel.findById(id);
//         if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

//         const results = await notificationsModel
//             .find({ userIds: id })
//             .sort({ createdAt: -1 })
//             .select("-__v -userId");

//         return { success: true, message: "Notifications fetched successfully", data: results };
//     } catch (error) {
//         console.error('Error in getAllNotificationsOfUserService:', error);
//         throw error;
//     }
// };

// export const markAllNotificationsAsReadService = async (id: string, res: Response) => {
//     try {
//         const user = await usersModel.findById(id);
//         if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

//         const notifications = await notificationsModel
//             .find({ userIds: id, read: false })
//             .select("-__v -userId");

//         if (!notifications.length) {
//             return errorResponseHandler("No notifications found", httpStatusCode.NO_CONTENT, res);
//         }

//         await notificationsModel.updateMany(
//             { userIds: id, read: false },
//             { $set: { read: true } }
//         );

//         return { success: true, message: "Notifications marked as read successfully" };
//     } catch (error) {
//         console.error('Error in markAllNotificationsAsReadService:', error);
//         throw error;
//     }
// };