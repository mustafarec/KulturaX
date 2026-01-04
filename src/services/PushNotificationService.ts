import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, {
    AndroidImportance,
    EventType,
    AndroidStyle,
    Event
} from '@notifee/react-native';
import * as NavigationService from './NavigationService';
import { notificationService } from './backendApi';
import { Platform, DeviceEventEmitter, NativeModules } from 'react-native';

const { ChatPrefs } = NativeModules;

// Track current active chat to suppress notifications
let currentActiveChatUserId: number | null = null;

export const setActiveChatUserId = (userId: number | null) => {
    currentActiveChatUserId = userId;
    // Also update native SharedPreferences for background handling
    if (Platform.OS === 'android' && ChatPrefs?.setActiveChatUserId) {
        ChatPrefs.setActiveChatUserId(userId?.toString() || null);
    }
};

// Create notification channels
async function createChannels() {
    await notifee.createChannel({
        id: 'messages',
        name: 'Mesajlar',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
    });

    await notifee.createChannel({
        id: 'social',
        name: 'Sosyal Bildirimler',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
    });
}

// Initialize push notifications
export async function initPushNotifications() {
    try {
        // Request permission
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED
            || authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
            return;
        }

        // Create channels
        await createChannels();

        // Handle foreground messages
        messaging().onMessage(async (remoteMessage) => {
            // If notification payload exists, system MAY have already shown it
            // For data-only messages, we need to display manually
            // With notification+data, system shows notification in background
            // but in foreground, system doesn't show - we handle it
            await displayNotification(remoteMessage.data);
        });

        // Handle background/quit notification press
        messaging().onNotificationOpenedApp((remoteMessage) => {
            handleNotificationPress(remoteMessage.data);
        });

        // Handle notification that opened app from quit state
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
            // Delay to ensure navigation is ready
            setTimeout(() => {
                handleNotificationPress(initialNotification.data);
            }, 1000);
        }

        // Handle Notifee foreground events
        notifee.onForegroundEvent(({ type, detail }: Event) => {
            if (type === EventType.PRESS) {
                handleNotificationPress(detail.notification?.data);
            } else if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'reply') {
                // Handle foreground reply
                const input = detail.input;
                const senderId = detail.notification?.data?.sender_id;
                if (input && senderId) {
                    sendReplyMessage(senderId as string, input);
                    notifee.cancelNotification(detail.notification?.id || '');
                }
            }
        });

        // Emit event for notification updates
        DeviceEventEmitter.emit('notificationReceived');
    } catch (error) {
        console.error('FCM: Initialization error', error);
    }
}

// Set up background message handler (must be called outside of React component)
export function setupBackgroundHandler() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        // If FCM has notification payload, system already shows the notification
        // We only need to call displayNotification for data-only messages
        // Check if notification payload exists
        if (remoteMessage.notification) {
            // System already displayed notification, skip manual display
            console.log('[FCM] Background: System handled notification');
            return;
        }
        // Data-only message - we need to display manually
        await displayNotification(remoteMessage.data);
    });

    // Handle Notifee background events (for inline reply)
    notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
        if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'reply') {
            const input = detail.input;
            const senderId = detail.notification?.data?.sender_id;

            if (input && senderId) {
                // Send reply message
                await sendReplyMessage(senderId as string, input);
            }

            // Cancel the notification
            if (detail.notification?.id) {
                await notifee.cancelNotification(detail.notification.id);
            }
        }
    });
}

// Display notification with Notifee
async function displayNotification(data: any) {
    if (!data) return;

    const { type, title, body, sender_id, sender_name, sender_avatar, post_id } = data;

    // Check if user is in active chat with sender - suppress if so
    if (type === 'message' && sender_id) {
        const senderIdNum = typeof sender_id === 'string' ? parseInt(sender_id, 10) : sender_id;
        if (currentActiveChatUserId === senderIdNum) {
            return;
        }
    }

    try {
        if (type === 'message') {
            // Message notification with inline reply
            await notifee.displayNotification({
                title: title || 'Yeni Mesaj',
                body: body || '',
                data: data,
                android: {
                    channelId: 'messages',
                    smallIcon: 'ic_launcher',
                    pressAction: { id: 'default' },
                    actions: [
                        {
                            title: 'Yanıtla',
                            pressAction: { id: 'reply' },
                            input: {
                                placeholder: 'Yanıtınızı yazın...',
                            },
                        },
                    ],
                },
            });
        } else {
            // Other notifications (like, comment, follow, etc.)
            await notifee.displayNotification({
                title: title || 'Bildirim',
                body: body || '',
                data: data,
                android: {
                    channelId: 'social',
                    smallIcon: 'ic_launcher',
                    pressAction: { id: 'default' },
                },
            });
        }

        // Emit event for in-app notification list update
        DeviceEventEmitter.emit('notificationReceived');
    } catch (error) {
        console.error('FCM: Error displaying notification', error);
    }
}

// Handle notification press
function handleNotificationPress(data: any) {
    if (!data) return;

    const { type, sender_id, post_id } = data;

    if (type === 'message' && sender_id) {
        const senderIdNum = typeof sender_id === 'string' ? parseInt(sender_id, 10) : sender_id;
        NavigationService.navigate('ChatDetail', { otherUserId: senderIdNum });
    } else if (['like', 'comment', 'reply', 'repost', 'quote'].includes(type) && post_id) {
        const postIdNum = typeof post_id === 'string' ? parseInt(post_id, 10) : post_id;
        NavigationService.navigate('PostDetail', { postId: postIdNum });
    } else if (['follow', 'follow_request', 'follow_accepted'].includes(type) && sender_id) {
        const senderIdNum = typeof sender_id === 'string' ? parseInt(sender_id, 10) : sender_id;
        NavigationService.navigate('OtherProfile', { userId: senderIdNum });
    }

    // Emit event for in-app notification list update
    DeviceEventEmitter.emit('notificationReceived');
}

// Send reply via inline reply
async function sendReplyMessage(senderId: string, message: string) {
    try {
        const { messageService } = await import('./api');
        await messageService.send(parseInt(senderId, 10), message);
    } catch (error) {
        console.error('FCM: Failed to send inline reply:', error);
    }
}

// Register FCM token
export async function registerFCMToken(userId: number) {
    try {
        const token = await messaging().getToken();

        if (token) {
            await notificationService.registerToken(token, Platform.OS === 'ios' ? 'ios' : 'android');
        }

        // Listen for token refresh
        messaging().onTokenRefresh(async (newToken) => {
            await notificationService.registerToken(newToken, Platform.OS === 'ios' ? 'ios' : 'android');
        });
    } catch (error) {
        console.error('FCM: Token registration error:', error);
    }
}

// Unregister FCM token
export async function unregisterFCMToken() {
    try {
        await messaging().deleteToken();
    } catch (error) {
        console.error('FCM: Token deletion error:', error);
    }
}

// Clear all notifications
export async function clearAllNotifications() {
    try {
        await notifee.cancelAllNotifications();
    } catch (error) {
        console.error('FCM: Error clearing notifications:', error);
    }
}
