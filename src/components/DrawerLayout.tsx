import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback, Easing } from 'react-native';
import { useSideMenu } from '../context/SideMenuContext';
import { useTheme } from '../context/ThemeContext';
import SideMenu from './SideMenu';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

interface DrawerLayoutProps {
    children: React.ReactNode;
}

export const DrawerLayout: React.FC<DrawerLayoutProps> = ({ children }) => {
    const { isMenuOpen, closeMenu } = useSideMenu();
    const { theme } = useTheme();

    const slideAnim = useRef(new Animated.Value(0)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isMenuOpen) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: MENU_WIDTH,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.poly(4)),
                }),
                Animated.timing(overlayAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.poly(4)),
                }),
                Animated.timing(overlayAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isMenuOpen]);

    return (
        <View style={styles.container}>
            {/* Side Menu (Behind) */}
            <View style={[styles.menuContainer, { width: MENU_WIDTH, backgroundColor: theme.colors.surface }]}>
                <SideMenu visible={true} onClose={closeMenu} isDrawer={true} />
            </View>

            {/* Main Content (Front) */}
            <Animated.View
                style={[
                    styles.mainContainer,
                    {
                        transform: [{ translateX: slideAnim }],
                        backgroundColor: theme.colors.background,
                        overflow: 'hidden',
                        // Add shadow to main content to separate it from menu
                        shadowColor: "#000",
                        shadowOffset: { width: -5, height: 0 },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 10,
                    }
                ]}
            >
                {children}

                {/* Overlay for tap to close - always rendered but hidden/disabled when closed */}
                <Animated.View
                    style={[styles.overlay, { opacity: overlayAnim }]}
                    pointerEvents={isMenuOpen ? 'auto' : 'none'}
                >
                    <TouchableWithoutFeedback onPress={closeMenu}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>
                </Animated.View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Background color behind everything
    },
    menuContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 1,
    },
    mainContainer: {
        flex: 1,
        zIndex: 2,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 1000,
        elevation: 1000,
    },
});
