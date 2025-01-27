import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK

const serviceAccount = require(path.join(__dirname, 'config/firebase-adminsdk.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// Function to send notification
interface NotificationMessage {
    notification: {
        title: string;
        body: string;
    };
    token: string;
}

const sendNotification = async (fcmToken: string, title: string, body: string): Promise<void> => {
    const message: NotificationMessage = {
        notification: {
            title: title,
            body: body,
        },
        token: fcmToken, // Client's FCM token
    };

    try {
        const response: string = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

// Example usage
// sendNotification('<CLIENT_FCM_TOKEN>', 'Hello', 'This is a test notification');
