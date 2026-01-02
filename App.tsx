import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { MessageProvider } from './src/context/MessageContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { initPushNotifications } from './src/services/PushNotificationService';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/ToastConfig';

import { NotificationProvider } from './src/context/NotificationContext';
import { PostHubProvider } from './src/context/PostHubContext';
import { WebSocketProvider } from './src/context/WebSocketContext';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

// Superwall - Paywall yönetimi
import { SuperwallProvider } from 'expo-superwall';
import { SUPERWALL_IOS_API_KEY, SUPERWALL_ANDROID_API_KEY } from '@env';

// API Keys from .env
const SUPERWALL_API_KEYS = {
  ios: SUPERWALL_IOS_API_KEY || '',
  android: SUPERWALL_ANDROID_API_KEY || '',
};

function App(): React.JSX.Element {
  useEffect(() => {
    initPushNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SuperwallProvider apiKeys={SUPERWALL_API_KEYS}>
        <KeyboardProvider>
          <BottomSheetModalProvider>
            <SafeAreaProvider>
              <AuthProvider>
                <ThemeProvider>
                  <MessageProvider>
                    <WebSocketProvider>
                      <PostHubProvider>
                        <NotificationProvider>
                          <AppNavigator />
                        </NotificationProvider>
                      </PostHubProvider>
                    </WebSocketProvider>
                  </MessageProvider>
                </ThemeProvider>
              </AuthProvider>
              <Toast config={toastConfig} />
            </SafeAreaProvider>
          </BottomSheetModalProvider>
        </KeyboardProvider>
      </SuperwallProvider>
    </GestureHandlerRootView>
  );
}

export default App;
