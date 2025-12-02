import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FeedScreen } from '../screens/main/FeedScreen';
import { DiscoveryScreen } from '../screens/main/DiscoveryScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { InboxScreen } from '../screens/social/InboxScreen';
import { NotificationScreen } from '../screens/main/NotificationScreen';
import { theme } from '../theme/theme';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
    return (
        <Tab.Navigator
            safeAreaInsets={{ bottom: 0 }}
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.colors.glass,
                    borderTopWidth: 0,
                    position: 'absolute',
                    bottom: 30,
                    left: 20,
                    right: 20,
                    borderRadius: 30,
                    height: 60,
                    ...theme.shadows.glass,
                    elevation: 5,
                    paddingBottom: 0,
                    paddingTop: 0,
                    paddingHorizontal: 10, // Add breathing room
                    alignItems: 'center',
                },
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
                    marginTop: 10,
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
                    tabBarIcon: ({ color }) => (
                        <Icon name="bell" size={24} color={color} />
                    ),
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
