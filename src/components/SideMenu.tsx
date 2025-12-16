import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, Modal, TouchableWithoutFeedback, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ThemeSelectorModal } from './ThemeSelectorModal';

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
            width: 60,
            height: 60,
            borderRadius: 30,
            marginBottom: 12,
        },
        avatarPlaceholder: {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
        },
        avatarText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#FFFFFF',
        },
        userInfo: {
            marginTop: 4,
        },
        name: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        username: {
            fontSize: 14,
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
            paddingVertical: 14,
            paddingHorizontal: 20,
        },
        menuIcon: {
            marginRight: 16,
        },
        menuLabel: {
            fontSize: 16,
            color: theme.colors.text,
            fontWeight: '500',
        },
        footer: {
            padding: 20,
            paddingTop: 10, // Boşluğu azaltmak için
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            alignItems: 'center', // Butonu ortalamak için
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

    const MenuItem = ({ icon, label, onPress, color, iconFamily }: { icon: string, label: string, onPress: () => void, color?: string, iconFamily?: 'SimpleLineIcons' | 'Ionicons' }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            {iconFamily === 'Ionicons' ? (
                <Ionicons name={icon} size={20} color={color || theme.colors.text} style={styles.menuIcon} />
            ) : (
                <Icon name={icon} size={20} color={color || theme.colors.text} style={styles.menuIcon} />
            )}
            <Text style={[styles.menuLabel, color && { color }]}>{label}</Text>
        </TouchableOpacity>
    );

    const MenuContent = (
        <View style={[
            styles.menuContainer,
            isDrawer && { width: '100%', borderRightWidth: 0, elevation: 0, shadowOpacity: 0 },
            !isDrawer && { transform: [{ translateX: slideAnim }], paddingTop: insets.top }
        ]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => handleNavigation('Profile')}>
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

            <View style={styles.menuItems}>
                <MenuItem icon="user" label="Profil" onPress={() => handleNavigation('Profile')} />
                <MenuItem icon="search-outline" label="Keşfet" onPress={() => handleNavigation('Main', { screen: 'Discovery' })} iconFamily="Ionicons" />
                <MenuItem icon="bubble" label="Mesajlar" onPress={() => handleNavigation('Main', { screen: 'Messages' })} />
                <MenuItem icon="star" label="Popüler Kullanıcılar" onPress={() => handleNavigation('PopularUsers')} />
                <MenuItem icon="settings" label="Ayarlar" onPress={() => handleNavigation('Settings')} />
                <MenuItem
                    icon={themeMode === 'dark' ? 'moon' : 'sunny'}
                    label="Görünüm"
                    onPress={() => setThemeModalVisible(true)}
                    iconFamily="Ionicons"
                />
                <MenuItem
                    icon="bookmark-outline"
                    label="Kaydedilenler"
                    onPress={() => handleNavigation('SavedPosts')}
                    iconFamily="Ionicons"
                />

            </View>

            <View style={styles.footer}>
                <MenuItem icon="logout" label="Çıkış Yap" onPress={handleLogout} color={theme.colors.error} />
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
                        <TouchableOpacity onPress={() => handleNavigation('Profile')}>
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

                    <View style={styles.menuItems}>
                        <MenuItem icon="user" label="Profil" onPress={() => handleNavigation('Profile')} />
                        <MenuItem icon="search-outline" label="Keşfet" onPress={() => handleNavigation('Main', { screen: 'Discovery' })} iconFamily="Ionicons" />
                        <MenuItem icon="bubble" label="Mesajlar" onPress={() => handleNavigation('Main', { screen: 'Messages' })} />
                        <MenuItem icon="star" label="Popüler Kullanıcılar" onPress={() => handleNavigation('PopularUsers')} />
                        <MenuItem icon="settings" label="Ayarlar" onPress={() => handleNavigation('Settings')} />
                        <MenuItem
                            icon={themeMode === 'dark' ? 'moon' : 'sunny'}
                            label="Görünüm"
                            onPress={() => setThemeModalVisible(true)}
                            iconFamily="Ionicons"
                        />
                        <MenuItem
                            icon="bookmark-outline"
                            label="Kaydedilenler"
                            onPress={() => handleNavigation('SavedPosts')}
                            iconFamily="Ionicons"
                        />

                    </View>

                    <View style={styles.footer}>
                        <MenuItem icon="logout" label="Çıkış Yap" onPress={handleLogout} color={theme.colors.error} />
                    </View>
                </Animated.View>
                <ThemeSelectorModal visible={themeModalVisible} onClose={() => setThemeModalVisible(false)} />
            </View>
        </Modal>
    );
};


export default SideMenu;
