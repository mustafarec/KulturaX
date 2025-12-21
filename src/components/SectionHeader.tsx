import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SectionHeaderProps {
    title: string;
    onViewAll?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onViewAll }) => {
    const { theme } = useTheme();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 12,
            marginTop: 24,
        },
        title: {
            fontSize: 20,
            fontWeight: '800',
            color: theme.colors.text,
            letterSpacing: -0.5,
            fontFamily: theme.fonts.headings,
        },
        viewAll: {
            fontSize: 14,
            color: theme.colors.primary,
            fontWeight: '600',
        },
    }), [theme]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {onViewAll && (
                <TouchableOpacity onPress={onViewAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.viewAll}>Tümünü Gör</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};
