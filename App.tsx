import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { MessageProvider } from './src/context/MessageContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { initOneSignal } from './src/services/OneSignalService';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/components/ToastConfig';

import { NotificationProvider } from './src/context/NotificationContext';
import { PostHubProvider } from './src/context/PostHubContext';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

function App(): React.JSX.Element {
  useEffect(() => {
    initOneSignal();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <MessageProvider>
              <PostHubProvider>
                <NotificationProvider>
                  <AppNavigator />
                </NotificationProvider>
              </PostHubProvider>
            </MessageProvider>
          </ThemeProvider>
        </AuthProvider>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
