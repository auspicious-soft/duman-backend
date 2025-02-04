import admin from 'firebase-admin';
import path from 'path';

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
const serviceAccount = require(path.join(__dirname, '../../firebase-service.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

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

export const sendNotification = async (fcmToken: string, title: string, body: string): Promise<void> => {
    const message: NotificationMessage = {
        notification: {
            title,
            body,
        },
        token: fcmToken,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent FCM message:', response);
    } catch (error) {
        console.error('Error sending FCM message:', error);
        throw error;
    }
};
// Example usage
// sendNotification('<CLIENT_FCM_TOKEN>', 'Hello', 'This is a test notification');
