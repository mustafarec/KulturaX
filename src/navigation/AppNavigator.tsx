import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '../context/AuthContext';
import { CreateQuoteScreen } from '../screens/social/CreateQuoteScreen';
import { ChatScreen } from '../screens/social/ChatScreen';
import { FollowListScreen } from '../screens/social/FollowListScreen';
import { BookDetailScreen } from '../screens/content/BookDetailScreen';
import { MovieDetailScreen } from '../screens/content/MovieDetailScreen';
import { ContentDetailScreen } from '../screens/content/ContentDetailScreen';
import { ConcertScreen } from '../screens/content/ConcertScreen';
import { PostSelectionScreen } from '../screens/social/PostSelectionScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { ChatDetailScreen } from '../screens/main/ChatDetailScreen';
import { MessageScreen } from '../screens/main/MessageScreen';

import { OtherProfileScreen } from '../screens/main/OtherProfileScreen';
import { PostDetailScreen } from '../screens/main/PostDetailScreen';
import { CreatorDetailScreen } from '../screens/content/CreatorDetailScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { VerificationScreen } from '../screens/auth/VerificationScreen';
import { SavedPostsScreen } from '../screens/main/SavedPostsScreen';
import { useTheme } from '../context/ThemeContext';
import { navigationRef } from '../services/NavigationService';
import { View, Image } from 'react-native';

import { FeedPreferencesScreen } from '../screens/settings/FeedPreferencesScreen';
import { BlockedUsersScreen } from '../screens/settings/BlockedUsersScreen';

const Stack = createNativeStackNavigator();

import { SideMenuProvider } from '../context/SideMenuContext';
import { DrawerLayout } from '../components/DrawerLayout';

const MainWithDrawer = () => (
    <SideMenuProvider>
        <DrawerLayout>
            <TabNavigator />
        </DrawerLayout>
    </SideMenuProvider>
);

export const AppNavigator = () => {
    const { user, isLoading } = useAuth();
    const { theme } = useTheme();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <Image
                    source={require('../assets/images/header_logo.png')}
                    style={{ width: 150, height: 150, resizeMode: 'contain' }}
                />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Main" component={MainWithDrawer} />
                        <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Messages" component={MessageScreen} options={{ headerShown: false }} />

                        <Stack.Screen name="FollowList" component={FollowListScreen} options={{ headerShown: false }} />

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
                            name="Concerts"
                            component={ConcertScreen}
                            options={{
                                headerShown: false,
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
                            name="PostSelection"
                            component={PostSelectionScreen}
                            options={{
                                presentation: 'transparentModal',
                                animation: 'fade',
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
                            name="FeedPreferences"
                            component={FeedPreferencesScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="BlockedUsers"
                            component={BlockedUsersScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SavedPosts"
                            component={SavedPostsScreen}
                            options={{ headerShown: false }}
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
