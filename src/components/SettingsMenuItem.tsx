import React from 'react';
import { TouchableOpacity, Text, View, Switch, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface SettingsMenuItemProps {
    icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
    label: string;
    description?: string;
    onPress?: () => void;
    showChevron?: boolean;
    gradientColors?: string[];
    isToggle?: boolean;
    toggleValue?: boolean;
    onToggleChange?: (value: boolean) => void;
    danger?: boolean;
    disabled?: boolean;
}

export const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({
    icon: IconComponent,
    label,
    description,
    onPress,
    showChevron = true,
    gradientColors,
    isToggle = false,
    toggleValue = false,
    onToggleChange,
    danger = false,
    disabled = false,
}) => {
    const { theme } = useTheme();

    const defaultGradient = danger
        ? [theme.colors.error, '#B91C1C']
        : [theme.colors.secondary, theme.colors.primary];

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.surface,
        },
        iconContainer: {
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
        },
        textContainer: {
            flex: 1,
        },
        label: {
            fontSize: 16,
            fontWeight: '500',
            color: danger ? theme.colors.error : theme.colors.text,
        },
        description: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
    });

    const content = (
        <>
            <LinearGradient
                colors={gradientColors || defaultGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
            >
                <IconComponent size={20} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
            <View style={styles.textContainer}>
                <Text style={styles.label}>{label}</Text>
                {description && <Text style={styles.description}>{description}</Text>}
            </View>
            {isToggle ? (
                <Switch
                    value={toggleValue}
                    onValueChange={onToggleChange}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={toggleValue ? '#FFFFFF' : '#f4f3f4'}
                />
            ) : showChevron ? (
                <ChevronRight size={20} color={theme.colors.textSecondary} />
            ) : null}
        </>
    );

    if (isToggle) {
        return <View style={[styles.container, disabled && { opacity: 0.5 }]}>{content}</View>;
    }

    return (
        <TouchableOpacity
            style={[styles.container, disabled && { opacity: 0.5 }]}
            onPress={onPress}
            disabled={disabled}
        >
            {content}
        </TouchableOpacity>
    );
};
