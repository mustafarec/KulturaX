import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedScreen } from '../screens/main/FeedScreen';
import { DiscoveryScreen } from '../screens/main/DiscoveryScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { MessageScreen } from '../screens/main/MessageScreen';
import { NotificationScreen } from '../screens/main/NotificationScreen';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Tab = createBottomTabNavigator();
const FeedStack = createNativeStackNavigator();

const FeedStackScreen = () => {
    return (
        <FeedStack.Navigator screenOptions={{ headerShown: false }}>
            <FeedStack.Screen name="FeedMain" component={FeedScreen} />
            <FeedStack.Screen name="Notifications" component={NotificationScreen} />
        </FeedStack.Navigator>
    );
};

export const TabNavigator = () => {
    const { theme } = useTheme(); // Use dynamic theme

    return (
        <Tab.Navigator
            safeAreaInsets={{ bottom: 0 }}
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface, // Solid opaque background
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 75,
                    elevation: 8, // Add shadow
                    paddingBottom: 15,
                    paddingTop: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: theme.shadows.default.shadowColor,
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarShowLabel: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.primary,
                tabBarItemStyle: {
                    height: 60,
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 0,
                    margin: 0,
                },
                tabBarIconStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignSelf: 'center',
                    width: 30,
                    height: 30,
                    marginTop: 5,
                    marginBottom: 0,
                }
            }}
        >
            <Tab.Screen
                name="Feed"
                component={FeedStackScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Icon name={focused ? "home" : "home-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Discovery"
                component={DiscoveryScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Icon name={focused ? "search" : "search-outline"} size={26} color={color} />
                    ),
                }}
            />

            <Tab.Screen
                name="NewPost"
                component={View} // Placeholder
                listeners={({ navigation }) => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('PostSelection');
                    },
                })}
                options={{
                    tabBarButton: (props) => {
                        // Sanitize props to handle type mismatch (null vs undefined)
                        const { delayLongPress, disabled, onBlur, onFocus, onLongPress, onPress, onPressIn, onPressOut, ...rest } = props;
                        const safeDelayLongPress = delayLongPress === null ? undefined : delayLongPress;
                        const safeDisabled = disabled === null ? undefined : disabled;
                        const safeOnBlur = onBlur === null ? undefined : onBlur;
                        const safeOnFocus = onFocus === null ? undefined : onFocus;
                        const safeOnLongPress = onLongPress === null ? undefined : onLongPress;
                        const safeOnPressIn = onPressIn === null ? undefined : onPressIn;
                        const safeOnPressOut = onPressOut === null ? undefined : onPressOut;

                        return (
                            <TouchableOpacity
                                {...(rest as any)}
                                disabled={safeDisabled}
                                onBlur={safeOnBlur}
                                onFocus={safeOnFocus}
                                onLongPress={safeOnLongPress}
                                onPressIn={safeOnPressIn}
                                onPressOut={safeOnPressOut}
                                delayLongPress={safeDelayLongPress}
                                style={{
                                    top: -20, // Float the button
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                                onPress={(e) => props.onPress?.(e)}
                            >
                                <View style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 32,
                                    backgroundColor: theme.colors.primary,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    shadowColor: theme.colors.primary,
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 12,
                                    elevation: 8,
                                    borderWidth: 4,
                                    borderColor: theme.colors.surface,
                                }}>
                                    <Icon name="add" size={36} color="#FFF" />
                                </View>
                            </TouchableOpacity>
                        );
                    },
                }}
            />

            <Tab.Screen
                name="Messages"
                component={MessageScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <Icon name={focused ? "mail" : "mail-outline"} size={26} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, focused }) => {
                        const { user } = useAuth();
                        const showBadge = user && user.is_email_verified == 0;

                        return (
                            <View>
                                {user?.avatar_url ? (
                                    <Image
                                        source={{ uri: user.avatar_url }}
                                        style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: color }}
                                    />
                                ) : (
                                    <Icon name={focused ? "person" : "person-outline"} size={26} color={color} />
                                )}
                                {showBadge && (
                                    <View style={{
                                        position: 'absolute',
                                        right: -2,
                                        top: -2,
                                        backgroundColor: theme.colors.error,
                                        borderRadius: 6,
                                        width: 12,
                                        height: 12,
                                        borderWidth: 2,
                                        borderColor: theme.colors.surface,
                                    }} />
                                )}
                            </View>
                        );
                    },
                }}
            />
            <Tab.Screen
                name="Inbox"
                component={MessageScreen}
                options={{
                    tabBarButton: () => null,
                    tabBarItemStyle: { display: 'none' }, // Layout'ta yer kaplamaması için
                }}
            />
        </Tab.Navigator>
    );
};
