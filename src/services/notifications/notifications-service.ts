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
    console.log('payload: ', payload);
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