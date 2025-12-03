import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { MessageProvider } from './src/context/MessageContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { initOneSignal } from './src/services/OneSignalService';
import Toast from 'react-native-toast-message';

import { NotificationProvider } from './src/context/NotificationContext';

function App(): React.JSX.Element {
  useEffect(() => {
    initOneSignal();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <MessageProvider>
            <NotificationProvider>
              <AppNavigator />
            </NotificationProvider>
          </MessageProvider>
        </ThemeProvider>
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}

export default App;
