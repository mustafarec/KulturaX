import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, DeviceEventEmitter, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { FeedScreen } from '../screens/main/FeedScreen';
import { DiscoveryScreen } from '../screens/main/DiscoveryScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { MessageScreen } from '../screens/main/MessageScreen';
import { NotificationScreen } from '../screens/main/NotificationScreen';
import { useTheme } from '../context/ThemeContext';
import { Home, Search, Mail, User, Plus, Compass } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolate, Easing } from 'react-native-reanimated';

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

// --- Components ---

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const FloatingAnimatedButton = ({ onPress, isOpen, theme }: { onPress: () => void, isOpen: boolean, theme: any }) => {
    const rotation = useSharedValue(0);

    React.useEffect(() => {
        rotation.value = withTiming(isOpen ? 135 : 0, { duration: 250, easing: Easing.out(Easing.cubic) });
    }, [isOpen]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    return (
        <AnimatedTouchable
            activeOpacity={0.9}
            style={[
                styles.floatingButtonData,
                {
                    backgroundColor: theme.colors.primary,
                    shadowColor: theme.colors.primary,
                    borderColor: theme.colors.surface,
                    zIndex: 2000,
                },
                animatedStyle
            ]}
            onPress={onPress}
        >
            <Plus size={36} color="#FFF" />
        </AnimatedTouchable>
    );
};

import { PostCreationModal } from '../components/modals/PostCreationModal';

// ... (No inline PostMenuOverlay)

// --- Main Navigator ---

export const TabNavigator = () => {
    const { theme } = useTheme();
    const isBlackTheme = (theme as any).id === 'black';

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Black Theme Constraints
    const blackThemeBarSettings = {
        backgroundColor: '#000000',
        activeColor: '#FFFFFF',
        inactiveColor: '#a8a29e', // Stone Gray
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                safeAreaInsets={{ bottom: 0 }}
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: isBlackTheme ? 'rgba(0,0,0,1)' : theme.colors.surface,
                        borderTopWidth: isBlackTheme ? 0 : 1,
                        borderTopColor: theme.colors.border,
                        height: 60,
                        paddingBottom: 5, // Add some padding for the icons/labels
                        paddingTop: 5,
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    tabBarShowLabel: false,
                    tabBarActiveTintColor: isBlackTheme ? blackThemeBarSettings.activeColor : theme.colors.primary,
                    tabBarInactiveTintColor: isBlackTheme ? blackThemeBarSettings.inactiveColor : theme.colors.textSecondary,
                    tabBarItemStyle: {
                        height: 60,
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                    tabBarIconStyle: {
                        width: 28,
                        height: 28,
                    }
                }}
            >
                <Tab.Screen
                    name="Feed"
                    component={FeedStackScreen}
                    listeners={({ navigation }) => ({
                        tabPress: (e) => {
                            if (navigation.isFocused()) {
                                DeviceEventEmitter.emit('refresh_feed');
                            }
                        },
                    })}
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <Home size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Discovery"
                    component={DiscoveryScreen}
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <Compass size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="NewPost"
                    component={View}
                    listeners={{
                        tabPress: (e) => {
                            e.preventDefault(); // Prevent navigation
                            toggleMenu(); // Trigger custom menu
                        },
                    }}
                    options={{
                        // Render a transparent/empty placeholder in the tab bar to keep spacing
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
                                    disabled={true} // Disable default press, we handle via floating button
                                    onBlur={safeOnBlur}
                                    onFocus={safeOnFocus}
                                    onLongPress={safeOnLongPress}
                                    onPressIn={safeOnPressIn}
                                    onPressOut={safeOnPressOut}
                                    delayLongPress={safeDelayLongPress}
                                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <View style={{ width: 64, height: 64 }} />
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
                            <Mail size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
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
                                        <User size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
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
                        tabBarItemStyle: { display: 'none' },
                    }}
                />
            </Tab.Navigator>

            {/* Overlay Menu */}
            <PostCreationModal visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* Hoisted Floating Button */}
            <FloatingAnimatedButton isOpen={isMenuOpen} onPress={toggleMenu} theme={theme} />

        </View>
    );
};

const styles = StyleSheet.create({
    floatingButtonData: {
        position: 'absolute',
        bottom: 10, // Lowered to align with tab bar
        alignSelf: 'center',
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 12,
        borderWidth: 4,
    },
});
