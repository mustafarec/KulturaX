/**
 * @format
 */

import 'react-native-reanimated';

import { AppRegistry } from 'react-native';
import App from './App';

// Setup FCM + Notifee background handlers
// This must be called outside of React component for background message handling
import { setupBackgroundHandler } from './src/services/PushNotificationService';
setupBackgroundHandler();

AppRegistry.registerComponent('kitapmuzikfilm', () => App);

