import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '../context/AuthContext';
import { CreateQuoteScreen } from '../screens/social/CreateQuoteScreen';
import { CreateThoughtScreen } from '../screens/social/CreateThoughtScreen';
import { CreateReviewScreen } from '../screens/social/CreateReviewScreen';
import { CreateBookScreen } from '../screens/social/CreateBookScreen';
import { CreateEventScreen } from '../screens/social/CreateEventScreen';
import { ChatScreen } from '../screens/social/ChatScreen';
import { FollowListScreen } from '../screens/social/FollowListScreen';
import { PopularUsersScreen } from '../screens/social/PopularUsersScreen';
import { BookDetailScreen } from '../screens/content/BookDetailScreen';
import { MovieDetailScreen } from '../screens/content/MovieDetailScreen';
import { ContentDetailScreen } from '../screens/content/ContentDetailScreen';
import { ConcertScreen } from '../screens/content/ConcertScreen';
import { PostSelectionScreen } from '../screens/social/PostSelectionScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { ChatDetailScreen } from '../screens/main/ChatDetailScreen';
import { MessageScreen } from '../screens/main/MessageScreen';
import { TopicDetailScreen } from '../screens/main/TopicDetailScreen';
import { SearchContentScreen } from '../screens/main/SearchContentScreen';

import { OtherProfileScreen } from '../screens/main/OtherProfileScreen';
import { PostDetailScreen } from '../screens/main/PostDetailScreen';
import { CreatorDetailScreen } from '../screens/content/CreatorDetailScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { VerificationScreen } from '../screens/auth/VerificationScreen';
import { SavedPostsScreen } from '../screens/main/SavedPostsScreen';
import { DraftsScreen } from '../screens/main/DraftsScreen';
import { MyActivitiesScreen } from '../screens/main/MyActivitiesScreen';
import { useTheme } from '../context/ThemeContext';
import { navigationRef, onNavigationReady } from '../services/NavigationService';
import { View, Image } from 'react-native';

import { FeedPreferencesScreen } from '../screens/settings/FeedPreferencesScreen';
import { BlockedUsersScreen } from '../screens/settings/BlockedUsersScreen';
import { NotificationSettingsScreen } from '../screens/settings/NotificationSettingsScreen';
import { AboutScreen } from '../screens/settings/AboutScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';
import { MutedUsersScreen } from '../screens/settings/MutedUsersScreen';
import { UpdateDiagnosticScreen } from '../screens/settings/UpdateDiagnosticScreen';

const Stack = createNativeStackNavigator();

import { SideMenuProvider } from '../context/SideMenuContext';
import { DrawerLayout } from '../components/DrawerLayout';
import { PostCreationModal } from '../components/modals/PostCreationModal';

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

    // Construct Navigation Theme based on our App Theme
    const navigationTheme = {
        ...(theme.dark ? DarkTheme : DefaultTheme),
        colors: {
            ...(theme.dark ? DarkTheme.colors : DefaultTheme.colors),
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.text,
            border: theme.colors.border,
            primary: theme.colors.primary,
        },
    };

    return (
        <NavigationContainer ref={navigationRef} theme={navigationTheme} onReady={onNavigationReady}>
            <View style={{ flex: 1 }}>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {user ? (
                        <>
                            <Stack.Screen name="Main" component={MainWithDrawer} />
                            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
                            <Stack.Screen
                                name="ChatDetail"
                                component={ChatDetailScreen}
                                options={{
                                    headerShown: false,
                                    animation: 'slide_from_right',
                                    animationDuration: 250,
                                }}
                            />
                            <Stack.Screen name="Messages" component={MessageScreen} options={{ headerShown: false }} />

                            <Stack.Screen name="FollowList" component={FollowListScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="PopularUsers" component={PopularUsersScreen} options={{ headerShown: false }} />

                            <Stack.Screen name="OtherProfile" component={OtherProfileScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="SearchContent" component={SearchContentScreen} options={{ headerShown: false }} />
                            <Stack.Screen name="TopicDetail" component={TopicDetailScreen} options={{ headerShown: false }} />
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
                                name="CreateThought"
                                component={CreateThoughtScreen}
                                options={{
                                    presentation: 'modal',
                                    animation: 'slide_from_bottom',
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name="CreateReview"
                                component={CreateReviewScreen}
                                options={{
                                    presentation: 'modal',
                                    animation: 'slide_from_bottom',
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name="CreateBook"
                                component={CreateBookScreen}
                                options={{
                                    presentation: 'modal',
                                    animation: 'slide_from_bottom',
                                    headerShown: false,
                                }}
                            />
                            <Stack.Screen
                                name="CreateEvent"
                                component={CreateEventScreen}
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
                                name="NotificationSettings"
                                component={NotificationSettingsScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="About"
                                component={AboutScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="ChangePassword"
                                component={ChangePasswordScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="MutedUsers"
                                component={MutedUsersScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="UpdateDiagnostic"
                                component={UpdateDiagnosticScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="SavedPosts"
                                component={SavedPostsScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="Drafts"
                                component={DraftsScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="MyActivities"
                                component={MyActivitiesScreen}
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
                <PostCreationModal />
            </View>
        </NavigationContainer>
    );
};
