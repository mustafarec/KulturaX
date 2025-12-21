import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Item {
    id: string;
    title: string;
    subtitle?: string; // author, artist, etc.
    image?: string;
    type?: string;
}

interface HorizontalListProps {
    data: Item[];
    onItemPress: (item: Item) => void;
    variant?: 'portrait' | 'square' | 'circle'; // portrait for books/movies, circle for artists
}

export const HorizontalList: React.FC<HorizontalListProps> = ({ data, onItemPress, variant = 'portrait' }) => {
    const { theme } = useTheme();

    const styles = React.useMemo(() => StyleSheet.create({
        listContent: {
            paddingHorizontal: 20,
            paddingBottom: 10,
        },
        card: {
            marginRight: 16,
            width: variant === 'portrait' ? 120 : variant === 'circle' ? 90 : 120,
            alignItems: variant === 'circle' ? 'center' : 'flex-start',
        },
        imageContainer: {
            width: variant === 'portrait' ? 120 : variant === 'circle' ? 90 : 120,
            height: variant === 'portrait' ? 180 : variant === 'circle' ? 90 : 120,
            borderRadius: variant === 'circle' ? 50 : 12, // Figma uses rounded-xl (~12px)
            backgroundColor: theme.colors.surface,
            marginBottom: 12,
            overflow: 'hidden',
            shadowColor: theme.shadows.default.shadowColor,
            shadowOffset: theme.shadows.default.shadowOffset,
            shadowOpacity: theme.shadows.default.shadowOpacity,
            shadowRadius: theme.shadows.default.shadowRadius,
            elevation: theme.shadows.default.elevation,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        image: {
            width: '100%',
            height: '100%',
        },
        placeholder: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
        },
        placeholderText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.textSecondary,
        },
        title: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 4,
            textAlign: variant === 'circle' ? 'center' : 'left',
            fontFamily: theme.fonts.headings,
        },
        subtitle: {
            fontSize: 11,
            color: theme.colors.textSecondary,
            fontWeight: '500',
            textAlign: variant === 'circle' ? 'center' : 'left',
            fontFamily: theme.fonts.main,
        },
        playIcon: {
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: theme.colors.primary,
            borderRadius: 20,
            width: 32,
            height: 32,
            justifyContent: 'center',
            alignItems: 'center',
        },
        playIconText: {
            color: '#fff',
            fontSize: 14,
        }
    }), [theme, variant]);

    const renderItem = ({ item }: { item: Item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onItemPress(item)}
            activeOpacity={0.8}
        >
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>{item.title.charAt(0)}</Text>
                    </View>
                )}
                {/* Optional: Add play icon for music if needed, can be controlled by a prop or item.type */}
            </View>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            {item.subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
        />
    );
};
