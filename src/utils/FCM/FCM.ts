import admin from "firebase-admin";
import { configDotenv } from "dotenv";
import mongoose, { Types } from "mongoose";
import { usersModel } from "src/models/user/user-schema";
import { notificationsModel } from "src/models/notifications/notification-schema";
import { notificationMessages } from "..";

configDotenv();

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = () => {
	try {
		if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
			throw new Error("Missing Firebase service account credentials");
		}

		const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

		// Fix multiline private key issue
		serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

		if (!admin.apps.length) {
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
			});
			console.log("✅ Firebase Admin initialized");
		}
	} catch (error) {
		console.error("❌ Error initializing Firebase:", error);
		throw error;
	}
};

/**
 * Notification Service
 * @param userIds array of user ObjectIds
 * @param type notification type (key from notificationMessages)
 * @param language language code (default: 'en')
 * @param referenceId optional reference ids (bookingId, jobId, etc.)
 */
interface SendNotificationParams {
  userIds: any[];
  type: string;
  adminTitle?: any;
  adminDescription?: any;
  referenceId?: any;
}

export const sendNotification = async ({
  userIds,
  type,
  adminTitle,
  adminDescription,
  referenceId
}: SendNotificationParams) => {
// export const sendNotification = async (userIds: any[], type: string, adminTitle?: any, adminDescription?: any, referenceId?: any) => {

	try {
		// pick message template

		const notifications: any[] = [];   

		for (const userId of userIds) {
			const userData = await usersModel.findById(userId).select("fcmToken language");

      
			// Save each user’s notification separately in DB
			// if (userData.fcmToken) {
        // const userData = await usersModel.findOne({ fcmToken }).select("fcmToken _id");
        if (userData === null || userData === undefined) {
          console.error(`❌ User not found for FCM token for ${userId}`);
          return;
        }
		if (userData.notificationAllowed === false) {
			console.log(`❌ User ${userId} disabled notifications.`);
			return;
		}
        const userLanguage = userData?.language ?? "eng";


			let finalTitle: string | undefined;
			let finalDescription: string | undefined;

			if (type === "admin") {
				// Use adminTitle and adminDescription based on userLanguage
				if (!adminTitle || !adminDescription) {
					console.error(`❌ Missing adminTitle or adminDescription for admin notification`);
					continue;
				}
				finalTitle = adminTitle[userLanguage] || adminTitle["eng"];
				finalDescription = adminDescription[userLanguage] || adminDescription["eng"];
    
			} else {
				// Use regular notification template
				const messageTemplate = notificationMessages[userLanguage]?.[type];
				finalTitle =  messageTemplate?.title;
				finalDescription = messageTemplate?.description;
			}

			// Save notification in DB
			const notificationDoc = await notificationsModel.create({
				userIds: userId,
				title: finalTitle,
				description: finalDescription,
				isRead: false,
                type: type,
				referenceId:referenceId
			});
     

			notifications.push(notificationDoc);
			console.log("notifications: ", notifications);

			// Send push notification
			if (finalTitle && userData.fcmToken) {
				try {
					await admin.messaging().send({
						notification: {
							title: finalTitle,
							body: finalDescription,
						},

						token: userData.fcmToken,
					});
					console.log(`📲 Push sent to user ${userId}`);
				} catch (pushErr) {
					console.error(`❌ Error sending push notification to user ${userId}:`, pushErr);
				}
			}
		}
		// }

		return notifications;
	} catch (err: any) {
		console.error("❌ NotificationService error:", err);
		throw err;
	}
};

export interface NotificationMessage {
	notification: {
		title: string;
		body: string;
	};
	token: string;
}

export interface NotificationPayload {
	title: string;
	description: string;
	userIds?: string[];
}

// export const sendNotification = async (fcmToken: string, title: string, body: string): Promise<void> => {
//     const message: NotificationMessage = {
//         notification: {
//             title,
//             body,
//         },
//         token: fcmToken,
//     };

//     try {
//         const response = await admin.messaging().send(message);
//         console.log('Successfully sent FCM message:', response);
//     } catch (error) {
//         console.error('Error sending FCM message:', error);
//         throw error;
//     }
// };
// Example usage
// sendNotification('<CLIENT_FCM_TOKEN>', 'Hello', 'This is a test notification');
