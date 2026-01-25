/**
 * @format
 */

import 'react-native-reanimated';

import { AppRegistry } from 'react-native';
import App from './App';

// Setup Firebase initialization check
import firebase from '@react-native-firebase/app';
if (!firebase.apps.length) {
    firebase.initializeApp();
}

// Setup FCM + Notifee background handlers
// This must be called outside of React component for background message handling
import { setupBackgroundHandler } from './src/services/PushNotificationService';
setupBackgroundHandler();

AppRegistry.registerComponent('main', () => App);

