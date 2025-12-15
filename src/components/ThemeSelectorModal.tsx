import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, TouchableWithoutFeedback, Animated, Dimensions, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const { height } = Dimensions.get('window');

interface ThemeSelectorModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ visible, onClose }) => {
    const { theme, themeMode, darkThemeStyle, setThemeMode, setDarkThemeStyle } = useTheme();
    const [showModal, setShowModal] = useState(visible);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            setShowModal(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.cubic),
                }),
            ]).start(() => setShowModal(false));
        }
    }, [visible]);

    const handleClose = () => {
        onClose();
    };

    const isDarkMode = themeMode === 'dark';
    const isAutoMode = themeMode === 'auto';

    const handleDarkModeToggle = (value: boolean) => {
        if (value) {
            setThemeMode('dark');
        } else {
            setThemeMode('light');
        }
    };

    const handleAutoModeToggle = (value: boolean) => {
        if (value) {
            setThemeMode('auto');
        } else {
            setThemeMode('light');
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
            minHeight: 300,
        },
        header: {
            alignItems: 'center',
            marginBottom: 20,
        },
        handle: {
            width: 40,
            height: 4,
            backgroundColor: theme.colors.textSecondary,
            borderRadius: 2,
            opacity: 0.3,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginTop: 16,
            marginBottom: 24,
        },
        section: {
            marginBottom: 24,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        labelContainer: {
            flex: 1,
        },
        label: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 4,
        },
        subLabel: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            lineHeight: 18,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 16,
        },
        radioRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        radioLabel: {
            fontSize: 16,
            color: theme.colors.text,
        },
        radioButton: {
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: theme.colors.textSecondary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        radioButtonSelected: {
            borderColor: theme.colors.primary,
        },
        radioButtonInner: {
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: theme.colors.primary,
        },
    }), [theme]);

    return (
        <Modal
            visible={showModal}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
                            <View style={styles.header}>
                                <View style={styles.handle} />
                                <Text style={styles.title}>Karanlık mod</Text>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Karanlık mod</Text>
                                    <Switch
                                        value={isDarkMode}
                                        onValueChange={handleDarkModeToggle}
                                        trackColor={{ false: '#767577', true: theme.colors.primary }}
                                        thumbColor={'#f4f3f4'}
                                        disabled={isAutoMode}
                                    />
                                </View>

                                <View style={styles.row}>
                                    <View style={styles.labelContainer}>
                                        <Text style={styles.label}>Cihaz ayarlarını kullan</Text>
                                        <Text style={styles.subLabel}>
                                            Karanlık modun cihazınızın Ekran ve Parlaklık ayarlarındaki seçime göre ayarlanmasını sağlayın.
                                        </Text>
                                    </View>
                                    <Switch
                                        value={isAutoMode}
                                        onValueChange={handleAutoModeToggle}
                                        trackColor={{ false: '#767577', true: theme.colors.primary }}
                                        thumbColor={'#f4f3f4'}
                                    />
                                </View>
                            </View>

                            {(isDarkMode || isAutoMode) && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Tema</Text>

                                    <TouchableOpacity
                                        style={styles.radioRow}
                                        onPress={() => setDarkThemeStyle('dim')}
                                    >
                                        <Text style={styles.radioLabel}>Kahverengi</Text>
                                        <View style={[styles.radioButton, darkThemeStyle === 'dim' && styles.radioButtonSelected]}>
                                            {darkThemeStyle === 'dim' && <View style={styles.radioButtonInner} />}
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.radioRow}
                                        onPress={() => setDarkThemeStyle('black')}
                                    >
                                        <Text style={styles.radioLabel}>Işıkları kapat</Text>
                                        <View style={[styles.radioButton, darkThemeStyle === 'black' && styles.radioButtonSelected]}>
                                            {darkThemeStyle === 'black' && <View style={styles.radioButtonInner} />}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
