import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

interface ThemeSelectorModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ visible, onClose }) => {
    const { theme, themeMode, darkThemeStyle, setThemeMode, setDarkThemeStyle } = useTheme();

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
            // If turning off auto, revert to current system state or default to light?
            // Better UX: if currently dark (due to system), stay dark. If light, stay light.
            // For simplicity, let's default to 'light' if turning off auto, or 'dark' if it was already dark.
            // Actually, let's just toggle to the explicit mode corresponding to the current active theme.
            // But we don't have easy access to "active theme" here without checking system scheme again.
            // Let's just default to 'light' for now as "off", or 'dark' if the user was previously dark.
            // A safer bet: if turning off auto, go to 'light' as a base, or let user toggle Dark Mode manually.
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
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={styles.container}>
                            <View style={styles.header}>
                                <View style={styles.handle} />
                                <Text style={styles.title}>Dark mode</Text>
                            </View>

                            <View style={styles.section}>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Dark mode</Text>
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
                                        <Text style={styles.label}>Use device settings</Text>
                                        <Text style={styles.subLabel}>
                                            Set Dark mode to use the Light or Dark selection located in your device Display & Brightness settings.
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
                                    <Text style={styles.sectionTitle}>Theme</Text>

                                    <TouchableOpacity
                                        style={styles.radioRow}
                                        onPress={() => setDarkThemeStyle('dim')}
                                    >
                                        <Text style={styles.radioLabel}>Dim</Text>
                                        <View style={[styles.radioButton, darkThemeStyle === 'dim' && styles.radioButtonSelected]}>
                                            {darkThemeStyle === 'dim' && <View style={styles.radioButtonInner} />}
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.radioRow}
                                        onPress={() => setDarkThemeStyle('black')}
                                    >
                                        <Text style={styles.radioLabel}>Lights out</Text>
                                        <View style={[styles.radioButton, darkThemeStyle === 'black' && styles.radioButtonSelected]}>
                                            {darkThemeStyle === 'black' && <View style={styles.radioButtonInner} />}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};
