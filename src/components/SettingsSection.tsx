import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
    const { theme } = useTheme();

    const styles = StyleSheet.create({
        container: {
            marginBottom: 16,
        },
        header: {
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: theme.colors.background,
        },
        title: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        content: {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.colors.border,
        },
        divider: {
            height: 1,
            backgroundColor: theme.colors.border,
            marginLeft: 76, // 20 padding + 40 icon + 16 margin
        },
    });

    // Add dividers between children
    const childrenArray = React.Children.toArray(children);
    const childrenWithDividers = childrenArray.map((child, index) => (
        <React.Fragment key={index}>
            {child}
            {index < childrenArray.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
    ));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
            </View>
            <View style={styles.content}>
                {childrenWithDividers}
            </View>
        </View>
    );
};
