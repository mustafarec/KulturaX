import { LogLevel, OneSignal } from 'react-native-onesignal';
import { notificationService } from './backendApi';
import { DeviceEventEmitter, Platform } from 'react-native';
import * as NavigationService from './NavigationService';

const ONESIGNAL_APP_ID = '01acbcb6-a4a3-463f-bff4-e49676745f56';

export const initOneSignal = () => {
    // Optional - Enable logging to debug issues
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);

    // OneSignal Initialization
    OneSignal.initialize(ONESIGNAL_APP_ID);

    // Request permission for notifications
    OneSignal.Notifications.requestPermission(true);

    // Listen for push notifications
    OneSignal.Notifications.addEventListener('click', (event) => {
        console.log('OneSignal: notification clicked:', event);
        DeviceEventEmitter.emit('notificationReceived');

        const data = event.notification.additionalData;
        if (data) {
            if (data.type === 'like' || data.type === 'comment' || data.type === 'reply' || data.type === 'repost') {
                if (data.post_id) {
                    NavigationService.navigate('PostDetail', { postId: data.post_id });
                }
            } else if (data.type === 'message') {
                if (data.sender_id) {
                    NavigationService.navigate('ChatDetail', { otherUserId: data.sender_id });
                }
            }
        }
    });

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        console.log('OneSignal: notification received in foreground:', event);
        // Bildirimin görünmesini sağla
        event.getNotification().display();
        // Uygulama içindeki listeyi güncellemesi için sinyal gönder
        DeviceEventEmitter.emit('notificationReceived');
    });

    // Get Device State and Register Token to Backend
    const id = OneSignal.User.pushSubscription.getPushSubscriptionId();
    if (id) {
        console.log('OneSignal: Push subscription ID:', id);
    }

    OneSignal.User.pushSubscription.addEventListener('change', (event) => {
        console.log('OneSignal: Push subscription state changed:', event);
    });
};

export const setExternalUserId = (userId: string) => {
    OneSignal.login(userId);
};

export const removeExternalUserId = () => {
    OneSignal.logout();
};

export const registerUser = async (userId: number) => {
    try {
        // Login to OneSignal
        OneSignal.login(userId.toString());

        // Get current token
        const token = OneSignal.User.pushSubscription.getPushSubscriptionId();

        // Register if token exists
        if (token) {
            console.log('OneSignal: Registering initial token:', token);
            await notificationService.registerToken(userId, token, Platform.OS === 'ios' ? 'ios' : 'android');
        }

        // Listen for token changes (e.g. first time generation)
        OneSignal.User.pushSubscription.addEventListener('change', async (event) => {
            console.log('OneSignal: Push subscription state changed:', event);
            const newToken = event.current.id;
            if (newToken) {
                console.log('OneSignal: Registering new token:', newToken);
                await notificationService.registerToken(userId, newToken, Platform.OS === 'ios' ? 'ios' : 'android');
            }
        });

    } catch (error) {
        console.error('OneSignal registration error:', error);
    }
};

export const removeUserToken = async () => {
    try {
        const token = OneSignal.User.pushSubscription.getPushSubscriptionId();
        if (token) {
            console.log('OneSignal: Removing token:', token);
            await notificationService.removeToken(token);
        }
    } catch (error) {
        console.error('OneSignal remove token error:', error);
    }
};
