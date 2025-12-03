import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '../context/AuthContext';
import { CreateQuoteScreen } from '../screens/social/CreateQuoteScreen';
import { ChatScreen } from '../screens/social/ChatScreen';
import { BookDetailScreen } from '../screens/content/BookDetailScreen';
import { MovieDetailScreen } from '../screens/content/MovieDetailScreen';
import { ContentDetailScreen } from '../screens/content/ContentDetailScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { MessageScreen } from '../screens/main/MessageScreen';
import { OtherProfileScreen } from '../screens/main/OtherProfileScreen';
import { PostDetailScreen } from '../screens/main/PostDetailScreen';
import { CreatorDetailScreen } from '../screens/content/CreatorDetailScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { VerificationScreen } from '../screens/auth/VerificationScreen';
import { theme } from '../theme/theme';
import { navigationRef } from '../services/NavigationService';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
    const { user } = useAuth(); // Assuming user state is managed by a hook

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Main" component={TabNavigator} />
                        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Messages" component={MessageScreen} options={{ headerShown: false }} />

                        <Stack.Screen name="OtherProfile" component={OtherProfileScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ headerShown: false }} />
                        <Stack.Screen
                            name="CreatorDetail"
                            component={CreatorDetailScreen}
                            options={{
                                headerShown: true,
                                title: 'Detay',
                                headerStyle: { backgroundColor: theme.colors.background },
                                headerTintColor: theme.colors.text,
                            }}
                        />
                        <Stack.Screen
                            name="BookDetail"
                            component={BookDetailScreen}
                            options={{
                                headerShown: true,
                                title: 'Kitap Detayı',
                                headerStyle: { backgroundColor: theme.colors.background },
                                headerTintColor: theme.colors.text,
                            }}
                        />
                        <Stack.Screen
                            name="MovieDetail"
                            component={MovieDetailScreen}
                            options={{
                                headerShown: true,
                                title: 'Film Detayı',
                                headerStyle: { backgroundColor: theme.colors.background },
                                headerTintColor: theme.colors.text,
                            }}
                        />
                        <Stack.Screen
                            name="ContentDetail"
                            component={ContentDetailScreen}
                            options={{
                                headerShown: true,
                                title: 'İçerik Detayı',
                                headerStyle: { backgroundColor: theme.colors.background },
                                headerTintColor: theme.colors.text,
                            }}
                        />
                        <Stack.Screen
                            name="CreateQuote"
                            component={CreateQuoteScreen}
                            options={{
                                presentation: 'modal',
                                animation: 'slide_from_bottom',
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="Settings"
                            component={SettingsScreen}
                            options={{
                                headerShown: true,
                                title: 'Ayarlar',
                                headerStyle: { backgroundColor: theme.colors.background },
                                headerTintColor: theme.colors.text,
                            }}
                        />
                        <Stack.Screen
                            name="EditProfile"
                            component={EditProfileScreen}
                            options={{
                                headerShown: false,
                                presentation: 'modal',
                                animation: 'slide_from_bottom',
                            }}
                        />
                        <Stack.Screen
                            name="Verification"
                            component={VerificationScreen}
                            options={{
                                headerShown: false,
                                presentation: 'modal',
                            }}
                        />
                    </>
                ) : (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};
