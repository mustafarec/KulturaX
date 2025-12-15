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
import Icon from 'react-native-vector-icons/Ionicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import { useAuth } from '../context/AuthContext';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolate } from 'react-native-reanimated';

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
        rotation.value = withSpring(isOpen ? 135 : 0, { damping: 12, stiffness: 100 });
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
            <Icon name="add" size={36} color="#FFF" />
        </AnimatedTouchable>
    );
};

const PostMenuOverlay = ({ visible, onClose, theme }: { visible: boolean, onClose: () => void, theme: any }) => {
    const navigation = useNavigation();

    // Animasyon değerleri
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(20);

    React.useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            translateY.value = withTiming(20, { duration: 150 });
        }
    }, [visible]);

    const containerStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    if (!visible && opacity.value === 0) return null;

    // Menü Kartı Bileşeni
    const MenuCard = ({ icon, title, subtitle, onPress }: any) => {
        return (
            <TouchableOpacity
                style={[styles.menuCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                    <SimpleLineIcons name={icon} size={24} color={theme.colors.text} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.menuTitle, { color: theme.colors.text }]}>{title}</Text>
                    <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
                </View>
                <SimpleLineIcons name="arrow-right" size={14} color={theme.colors.text} style={{ opacity: 0.3 }} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Backdrop */}
            {visible && (
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' }} />
                </TouchableWithoutFeedback>
            )}

            {/* Menu Container */}
            <View style={styles.menuContainer} pointerEvents="box-none">
                <Animated.View style={[styles.animatedMenuWrapper, containerStyle]}>

                    <MenuCard
                        icon="bubble"
                        title="Düşünceni Paylaş"
                        subtitle="Aklından geçenleri takipçilerine anlat"
                        onPress={() => {
                            onClose();
                            (navigation as any).navigate('CreateQuote', { mode: 'thought' });
                        }}
                    />

                    <View style={{ height: 16 }} />

                    <MenuCard
                        icon="book-open"
                        title="İnceleme Yap"
                        subtitle="Kitap, film veya müzik hakkında yaz"
                        onPress={() => {
                            onClose();
                            (navigation as any).navigate('CreateQuote', { mode: 'quote' });
                        }}
                    />

                </Animated.View>
            </View>
        </View>
    );
};

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
                        backgroundColor: isBlackTheme ? blackThemeBarSettings.backgroundColor : theme.colors.surface,
                        borderTopWidth: 1,
                        borderTopColor: isBlackTheme ? '#2A2420' : theme.colors.border,
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 75,
                        elevation: 8,
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
                    tabBarActiveTintColor: isBlackTheme ? blackThemeBarSettings.activeColor : theme.colors.primary,
                    tabBarInactiveTintColor: isBlackTheme ? blackThemeBarSettings.inactiveColor : theme.colors.primary,
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
                    listeners={({ navigation }) => ({
                        tabPress: (e) => {
                            if (navigation.isFocused()) {
                                DeviceEventEmitter.emit('refresh_feed');
                            }
                        },
                    })}
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
                        tabBarItemStyle: { display: 'none' },
                    }}
                />
            </Tab.Navigator>

            {/* Overlay Menu */}
            <PostMenuOverlay visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} theme={theme} />

            {/* Hoisted Floating Button */}
            <FloatingAnimatedButton isOpen={isMenuOpen} onPress={toggleMenu} theme={theme} />

        </View>
    );
};

const styles = StyleSheet.create({
    floatingButtonData: {
        position: 'absolute',
        bottom: 22, // Lowered to have only a small overlap with the top edge
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
        elevation: 8,
        borderWidth: 4,
    },
    menuContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 110, // Position menu above button
    },
    animatedMenuWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    menuCard: {
        width: '90%',
        maxWidth: 360,
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    menuSubtitle: {
        fontSize: 13,
    },
});
