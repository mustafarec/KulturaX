import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSideMenu } from '../context/SideMenuContext';
import { useTheme } from '../context/ThemeContext';

export const AnimatedMenuButton = () => {
    const { isMenuOpen, toggleMenu } = useSideMenu();
    const { theme } = useTheme();
    const lottieRef = useRef<LottieView>(null);

    useEffect(() => {
        if (isMenuOpen) {
            // Play from start to frame 30 (exactly where it becomes X)
            lottieRef.current?.play(0, 30);
        } else {
            // Reverse from 30 to 0
            lottieRef.current?.play(30, 0);
        }
    }, [isMenuOpen]);

    // Initial check: if valid lottie
    return (
        <TouchableOpacity onPress={toggleMenu} style={styles.container}>
            <LottieView
                key={(theme as any).id} // Force re-render on theme change
                ref={lottieRef}
                source={require('../assets/animations/menu.json')}
                style={styles.lottie}
                loop={false}
                autoPlay={false}
                speed={1.5}
                colorFilters={[
                    {
                        keypath: "Top.Top.Stroke 1",
                        color: theme.colors.text,
                    },
                    {
                        keypath: "Middle.Middle.Stroke 1",
                        color: theme.colors.text,
                    },
                    {
                        keypath: "Bottom.Bottom.Stroke 1",
                        color: theme.colors.text,
                    },
                    // Fallback in case structure varies slightly or to catch generic
                    {
                        keypath: "**.Stroke 1",
                        color: theme.colors.text,
                    }
                ]}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 50, // Standard touch target
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        // marginLeft: -10, // Optional: if lottie needs centering adjustment 
    },
    lottie: {
        width: 100, // Much larger to crop whitespace/padding in the animation file
        height: 100,
    },
});
