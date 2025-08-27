// import admin from 'firebase-admin';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { readFile } from 'fs/promises';
// Initialize Firebase Admin SDK


// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
// Function to send notification


// export const sendNotification = async (fcmToken: string, title: string, body: string): Promise<void> => {
//     const message: NotificationMessage = {
//         notification: {
//             title: title,
//             body: body,
//         },
//         token: fcmToken, // Client's FCM token
//     };

//     try {
//         const response: string = await admin.messaging().send(message);
//         console.log('Successfully sent message:', response);
//     } catch (error) {
//         console.error('Error sending message:', error);
//     }
// };

// Alternative approach using environment variable
//  export   const initializeFirebase = async () => {
//         try {
//             if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
//                 throw new Error('Missing Firebase service account credentials');
//             }
    
//             // Parse JSON from the environment variable
//             const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
//             // Fix the private_key formatting issue (replace escaped \\n with actual newlines)
//             serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    
//             if (!admin.apps.length) {
//                 admin.initializeApp({
//                     credential: admin.credential.cert({
//                         type: "service_account",
//                         "project_id": "bookstagram-cd574",
//                         "private_key_id": "8170f6910021679f02d162db9bb4f95c91b32ecd",
//                         "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDWfe9AhUfX/GE5\\nNdQ+dwvsM0aWkjt9Lj8hm25tRxnKmO+DtLGJ9lArxzaLvU9DPN1C/PqhykrLBtga\\n...\\n-----END PRIVATE KEY-----\\n",
//                         "client_email": "firebase-adminsdk-fbsvc@bookstagram-cd574.iam.gserviceaccount.com",
//                         "client_id": "116859040876259039193",
//                         "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//                         "token_uri": "https://oauth2.googleapis.com/token",
//                         "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//                         "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40bookstagram-cd574.iam.gserviceaccount.com",
//                         "universe_domain": "googleapis.com"
//                     })
//                 });
//                 console.log('✅ Firebase Admin initialized successfully');
//             }
//         } catch (error) {
//             console.error('❌ Error initializing Firebase:', error);
//             throw error;
//         }
// }

import admin from "firebase-admin";
import { configDotenv } from "dotenv";
import mongoose, { Types } from "mongoose";
import { usersModel } from "src/models/user/user-schema";
import { notificationsModel } from "src/models/notifications/notification-schema";

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
    serviceAccount.private_key = serviceAccount.private_key.replace(
      /\\n/g,
      "\n"
    );

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
export const sendNotification = async (
  fcmToken: string,
  description?: string,
  title?: string
) => {
  try {
    // pick message template

    const notifications: any[] = [];

    // for (const userId of userIds) {
    //   const userData = await usersModel.findById(userId).select("fcmToken");

    //   const messageTemplate =
    //     notificationMessages[userData?.language || "en"]?.[type];

      // Save each user’s notification separately in DB
      if (fcmToken) {
        const userData = await usersModel.findOne({ fcmToken }).select("fcmToken _id");
        if (!userData){
            console.error(`❌ User not found for FCM token: ${fcmToken}`);
            return;
        }
        const userId = userData?._id;
        const notificationDoc = await notificationsModel.create({
          userId: userId,
          title: title,
          description: description,
          isRead: false,
        });

        notifications.push(notificationDoc);

        // Send push notification
        if (title && userData.fcmToken) {
          try {
            await admin.messaging().send({
              notification: {
                title: title,
                body: description,
              },

              token: userData.fcmToken,
            });
            console.log(`📲 Push sent to user ${userId}`);
          } catch (pushErr) {
            console.error(
              `❌ Error sending push notification to user ${userId}:`,
              pushErr
            );
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
