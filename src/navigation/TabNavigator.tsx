import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FeedScreen } from '../screens/main/FeedScreen';
import { DiscoveryScreen } from '../screens/main/DiscoveryScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { InboxScreen } from '../screens/social/InboxScreen';
import { NotificationScreen } from '../screens/main/NotificationScreen';
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useNotification } from '../context/NotificationContext';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    const { theme } = useTheme(); // Use dynamic theme

    return (
        <Tab.Navigator
            safeAreaInsets={{ bottom: 0 }}
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    borderWidth: 0,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 85,
                    elevation: 0, // Remove default elevation to handle shadow manually if needed
                    paddingBottom: 20,
                    paddingTop: 10,
                    paddingHorizontal: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                tabBarBackground: () => (
                    <View style={{ flex: 1 }}>
                        <LinearGradient
                            colors={[theme.colors.glass, theme.colors.glass]} // Use theme glass color which has opacity
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderTopWidth: 1,
                                borderTopColor: theme.colors.glassBorder,
                            }}
                        />
                    </View>
                ),
                tabBarShowLabel: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
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
                    marginTop: 5, // Push down to center vertically
                    marginBottom: 0,
                }
            }}
        >
            <Tab.Screen
                name="Feed"
                component={FeedScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Icon name="home" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Discovery"
                component={DiscoveryScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Icon name="magnifier" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Inbox"
                component={InboxScreen}
                options={{
                    tabBarIcon: ({ color }) => {
                        const { unreadCount } = useMessage();
                        return (
                            <View>
                                <Icon name="bubble" size={24} color={color} />
                                {unreadCount > 0 && (
                                    <View style={{
                                        position: 'absolute',
                                        right: -6,
                                        top: -4,
                                        backgroundColor: theme.colors.error,
                                        borderRadius: 10,
                                        minWidth: 18,
                                        height: 18,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderWidth: 2,
                                        borderColor: theme.colors.surface,
                                    }}>
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 2 }}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    },
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationScreen}
                options={{
                    tabBarIcon: ({ color }) => {
                        const { unreadCount } = useNotification();
                        return (
                            <View>
                                <Icon name="bell" size={24} color={color} />
                                {unreadCount > 0 && (
                                    <View style={{
                                        position: 'absolute',
                                        right: -6,
                                        top: -4,
                                        backgroundColor: theme.colors.error,
                                        borderRadius: 10,
                                        minWidth: 18,
                                        height: 18,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderWidth: 2,
                                        borderColor: theme.colors.surface,
                                    }}>
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 2 }}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    },
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color }) => {
                        const { user } = useAuth();
                        const showBadge = user && user.is_email_verified == 0;
                        return (
                            <View>
                                <Icon name="user" size={24} color={color} />
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
        </Tab.Navigator>
    );
};
