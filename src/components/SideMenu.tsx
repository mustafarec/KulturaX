import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, Modal, TouchableWithoutFeedback, Easing, ScrollView } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Search, MessageCircle, Star, Settings, Moon, Sun, Bookmark, LogOut, Crown, FileText } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemeSelectorModal } from './ThemeSelectorModal';
import { PremiumButton } from './PremiumButton';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

interface SideMenuProps {
    visible: boolean;
    onClose: () => void;
    isDrawer?: boolean;
}

const SideMenu: React.FC<SideMenuProps> = ({ visible, onClose, isDrawer = false }) => {
    const { theme, themeMode } = useTheme();
    const { user, logout } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // Internal state to keep Modal visible during closing animation (only for non-drawer mode)
    const [isVisible, setIsVisible] = React.useState(visible);
    const [themeModalVisible, setThemeModalVisible] = React.useState(false);

    const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const styles = React.useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            flexDirection: 'row',
        },
        backdrop: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        menuContainer: {
            width: MENU_WIDTH,
            height: '100%',
            backgroundColor: theme.colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            borderRightWidth: 1,
            borderRightColor: theme.colors.border,
        },
        header: {
            padding: 20,
            paddingBottom: 10,
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            marginBottom: 10,
        },
        avatarPlaceholder: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
        },
        avatarText: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#FFFFFF',
        },
        userInfo: {
            marginTop: 4,
        },
        name: {
            fontSize: 17,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        username: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
        divider: {
            height: 1,
            backgroundColor: theme.colors.border,
            marginVertical: 10,
        },
        menuItems: {
            flex: 1,
            paddingTop: 10,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 11,
            paddingHorizontal: 18,
        },

        menuLabel: {
            fontSize: 15,
            color: theme.colors.text,
            fontWeight: '500',
        },
        footer: {
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 20,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            alignItems: 'center',
        },

    }), [theme]);

    useEffect(() => {
        if (isDrawer) return;

        if (visible) {
            setIsVisible(true);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.poly(4)),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -MENU_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.ease),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) {
                    setIsVisible(false);
                }
            });
        }
    }, [visible, isDrawer]);

    const handleNavigation = (screen: string, params?: any) => {
        onClose();
        if (!isDrawer) {
            setTimeout(() => {
                (navigation as any).navigate(screen, params);
            }, 300);
        } else {
            (navigation as any).navigate(screen, params);
        }
    };

    const handleLogout = () => {
        onClose();
        if (!isDrawer) {
            setTimeout(() => {
                logout();
            }, 300);
        } else {
            logout();
        }
    };

    // Get current route name to determine active state
    const currentRoute = useNavigationState(state => {
        const route = state?.routes[state.index];
        // Handle nested navigators if necessary, but simple check might suffice for now
        // Or recursively get the deeper route name
        return route?.name;
    });

    const MenuItem = ({
        IconComponent,
        label,
        onPress,
        color,
        gradientColors,
        isActive = false
    }: {
        IconComponent: any,
        label: string,
        onPress: () => void,
        color?: string,
        gradientColors?: string[],
        isActive?: boolean
    }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <LinearGradient
                colors={gradientColors || (isActive
                    ? [theme.colors.primary, '#5D4037'] // Darker/Richer for active
                    : [theme.colors.secondary, theme.colors.primary] // Default
                )}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                    shadowColor: isActive ? theme.colors.primary : "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isActive ? 0.35 : 0.15,
                    shadowRadius: 6,
                    elevation: isActive ? 6 : 3,
                    borderWidth: isActive ? 1.5 : 0, // Highlight border
                    borderColor: theme.colors.surface, // Or a contrasting color
                }}
            >
                <IconComponent
                    size={20}
                    color="#FFFFFF"
                    strokeWidth={2.5} // Increased thickness
                />
            </LinearGradient>
            <View>
                <Text style={[
                    styles.menuLabel,
                    color && { color },
                    isActive && { fontWeight: 'bold', color: theme.colors.primary } // Bold text for active
                ]}>{label}</Text>
                {isActive && (
                    <View style={{ height: 2, width: 20, backgroundColor: theme.colors.primary, marginTop: 4, borderRadius: 1 }} />
                )}
            </View>
        </TouchableOpacity>
    );

    const MenuContent = (
        <View style={[
            styles.menuContainer,
            isDrawer && { width: '100%', borderRightWidth: 0, elevation: 0, shadowOpacity: 0 },
            !isDrawer && { transform: [{ translateX: slideAnim }], paddingTop: insets.top }
        ]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => handleNavigation('Main', { screen: 'Profile' })}>
                    {user?.avatar_url ? (
                        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <View style={styles.userInfo}>
                    <Text style={styles.name}>{user?.full_name || user?.username}</Text>
                    <Text style={styles.username}>@{user?.username}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
                <PremiumButton style={{ marginBottom: 15, marginHorizontal: 20 }} />

                {/* Note: Active state logic might need refinement based on exact route names/structure */}
                <MenuItem
                    IconComponent={User}
                    label="Profil"
                    onPress={() => handleNavigation('Main', { screen: 'Profile' })}
                // Simple check - might not be perfect if 'Main' is active but deep inside Profile? 
                // Usually 'Main' is the stack, so we might need context. 
                // For now leaving manual active checks or broad assumption.
                />
                <MenuItem IconComponent={Search} label="Keşfet" onPress={() => handleNavigation('Main', { screen: 'Discovery' })} />
                <MenuItem IconComponent={MessageCircle} label="Mesajlar" onPress={() => handleNavigation('Main', { screen: 'Messages' })} />
                <MenuItem IconComponent={Star} label="Popüler Kullanıcılar" onPress={() => handleNavigation('PopularUsers')} />
                <MenuItem IconComponent={Settings} label="Ayarlar" onPress={() => handleNavigation('Settings')} />
                <MenuItem
                    IconComponent={themeMode === 'dark' ? Moon : Sun}
                    label="Görünüm"
                    onPress={() => setThemeModalVisible(true)}
                />
                <MenuItem
                    IconComponent={Bookmark}
                    label="Kaydedilenler"
                    onPress={() => handleNavigation('SavedPosts')}
                />
                <MenuItem
                    IconComponent={FileText}
                    label="Taslaklar"
                    onPress={() => handleNavigation('Drafts')}
                />

            </ScrollView>

            <View style={styles.footer}>
                <MenuItem
                    IconComponent={LogOut}
                    label="Çıkış Yap"
                    onPress={handleLogout}
                    color={theme.colors.error}
                    gradientColors={[theme.colors.error, '#B91C1C']}
                // No active state for logout
                />
            </View>
        </View >
    );

    if (isDrawer) {
        return (
            <View style={{ flex: 1, paddingTop: insets.top }}>
                {MenuContent}
                <ThemeSelectorModal visible={themeModalVisible} onClose={() => setThemeModalVisible(false)} />
            </View>
        );
    }

    if (!visible && !isVisible) return null;

    return (
        <Modal transparent visible={isVisible} animationType="none" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                <Animated.View style={[
                    styles.menuContainer,
                    { transform: [{ translateX: slideAnim }], paddingTop: insets.top }
                ]}>
                    {/* Re-render content for Modal mode to ensure animation works correctly with the Animated.View wrapper above */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => handleNavigation('Main', { screen: 'Profile' })}>
                            {user?.avatar_url ? (
                                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={styles.userInfo}>
                            <Text style={styles.name}>{user?.full_name || user?.username}</Text>
                            <Text style={styles.username}>@{user?.username}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
                        <PremiumButton style={{ marginBottom: 15, marginHorizontal: 20 }} />
                        <MenuItem IconComponent={User} label="Profil" onPress={() => handleNavigation('Main', { screen: 'Profile' })} />
                        <MenuItem IconComponent={Search} label="Keşfet" onPress={() => handleNavigation('Main', { screen: 'Discovery' })} />
                        <MenuItem IconComponent={MessageCircle} label="Mesajlar" onPress={() => handleNavigation('Main', { screen: 'Messages' })} />
                        <MenuItem IconComponent={Star} label="Popüler Kullanıcılar" onPress={() => handleNavigation('PopularUsers')} />
                        <MenuItem IconComponent={Settings} label="Ayarlar" onPress={() => handleNavigation('Settings')} />
                        <MenuItem
                            IconComponent={themeMode === 'dark' ? Moon : Sun}
                            label="Görünüm"
                            onPress={() => setThemeModalVisible(true)}
                        />
                        <MenuItem
                            IconComponent={Bookmark}
                            label="Kaydedilenler"
                            onPress={() => handleNavigation('SavedPosts')}
                        />
                        <MenuItem
                            IconComponent={FileText}
                            label="Taslaklar"
                            onPress={() => handleNavigation('Drafts')}
                        />

                    </ScrollView>

                    <View style={styles.footer}>
                        <MenuItem IconComponent={LogOut} label="Çıkış Yap" onPress={handleLogout} color={theme.colors.error} />
                    </View>
                </Animated.View>
                <ThemeSelectorModal visible={themeModalVisible} onClose={() => setThemeModalVisible(false)} />
            </View>
        </Modal>
    );
};


export default SideMenu;
