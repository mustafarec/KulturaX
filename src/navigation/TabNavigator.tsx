import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, DeviceEventEmitter, Modal, TouchableWithoutFeedback, Dimensions, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { useCollapsible } from '../context/CollapsibleContext';
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
import { useMessage } from '../context/MessageContext';
import { usePostHub } from '../context/PostHubContext';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolate, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalize } from '../utils/responsive';

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

const FloatingAnimatedButton = ({ onPress, isOpen, theme, bottomInset }: { onPress: () => void, isOpen: boolean, theme: any, bottomInset: number }) => {
    const rotation = useSharedValue(0);

    React.useEffect(() => {
        rotation.value = withTiming(isOpen ? 135 : 0, { duration: 250, easing: Easing.out(Easing.cubic) });
    }, [isOpen]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    const buttonSize = normalize(60);

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
                    bottom: bottomInset + 15, // Floating button position adjusted for safe area
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: buttonSize / 2,
                },
                animatedStyle
            ]}
            onPress={onPress}
        >
            <Plus size={normalize(32)} color="#FFF" />
        </AnimatedTouchable>
    );
};

// --- Main Navigator ---

export const TabNavigator = () => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const isBlackTheme = (theme as any).id === 'black';

    const { isModalVisible, openModal } = usePostHub();

    // Black Theme Constraints
    const blackThemeBarSettings = {
        backgroundColor: '#000000',
        activeColor: '#FFFFFF',
        inactiveColor: '#a8a29e', // Stone Gray
    };

    // Calculate dynamic tab bar height and padding
    const bottomPadding = insets.bottom > 0 ? insets.bottom : 10;
    const tabBarHeight = 60 + bottomPadding;
    const iconSize = normalize(24);
    const activeIconScale = 1.1;

    const { translateY: globalTranslateY } = useCollapsible();
    const HIDE_DISTANCE = 150;

    const bottomBarAnimatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            transform: [
                {
                    translateY: interpolate(
                        globalTranslateY.value,
                        [0, 1],
                        [0, HIDE_DISTANCE],
                        'clamp'
                    ),
                },
            ],
        };
    });

    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                tabBar={(props) => (
                    <Animated.View style={bottomBarAnimatedStyle}>
                        <BottomTabBar {...props} />
                    </Animated.View>
                )}
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        position: 'absolute',
                        backgroundColor: isBlackTheme ? 'rgba(0,0,0,1)' : theme.colors.surface,
                        borderTopWidth: isBlackTheme ? 0 : 1,
                        borderTopColor: theme.colors.border,
                        height: tabBarHeight,
                        paddingBottom: Platform.OS === 'ios' ? bottomPadding : 10,
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
                        width: normalize(28),
                        height: normalize(28),
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
                            <Home size={focused ? iconSize * activeIconScale : iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Discovery"
                    component={DiscoveryScreen}
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <Compass size={focused ? iconSize * activeIconScale : iconSize} color={color} strokeWidth={focused ? 2.5 : 2} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="NewPost"
                    component={View}
                    listeners={{
                        tabPress: (e) => {
                            e.preventDefault();
                            openModal();
                        },
                    }}
                    options={{
                        tabBarButton: (props) => {
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
                                    disabled={true}
                                    onBlur={safeOnBlur}
                                    onFocus={safeOnFocus}
                                    onLongPress={safeOnLongPress}
                                    onPressIn={safeOnPressIn}
                                    onPressOut={safeOnPressOut}
                                    delayLongPress={safeDelayLongPress}
                                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <View style={{ width: normalize(60), height: normalize(60) }} />
                                </TouchableOpacity>
                            );
                        },
                    }}
                />

                <Tab.Screen
                    name="Messages"
                    component={MessageScreen}
                    options={{
                        tabBarIcon: ({ color, focused }) => {
                            const { unreadCount } = useMessage();
                            const size = focused ? iconSize * activeIconScale : iconSize;

                            return (
                                <View>
                                    <Mail size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
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
                        tabBarIcon: ({ color, focused }) => {
                            const { user } = useAuth();
                            const showBadge = user && !user.is_email_verified;
                            const size = focused ? iconSize * activeIconScale : iconSize;

                            return (
                                <View>
                                    {user?.avatar_url ? (
                                        <Image
                                            source={{ uri: user.avatar_url }}
                                            style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: color }}
                                        />
                                    ) : (
                                        <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
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

            <Animated.View style={bottomBarAnimatedStyle}>
                <FloatingAnimatedButton isOpen={isModalVisible} onPress={() => openModal()} theme={theme} bottomInset={bottomPadding > 10 ? bottomPadding : 0} />
            </Animated.View>

        </View>
    );
};

const styles = StyleSheet.create({
    floatingButtonData: {
        position: 'absolute',
        alignSelf: 'center',
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

