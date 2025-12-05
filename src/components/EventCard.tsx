import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface EventProps {
    id: string;
    title: string;
    date: string; // Formatted date string, e.g., "Sat, Aug 24 • 7:00 PM"
    location: string;
    image?: string;
}

interface EventCardProps {
    event: EventProps;
    onPress: (event: EventProps) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
    const { theme } = useTheme();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            marginBottom: 16,
            marginHorizontal: 20,
            padding: 12,
            shadowColor: theme.shadows.default.shadowColor,
            shadowOffset: theme.shadows.default.shadowOffset,
            shadowOpacity: theme.shadows.default.shadowOpacity,
            shadowRadius: theme.shadows.default.shadowRadius,
            elevation: theme.shadows.default.elevation,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
        },
        imageContainer: {
            width: 80,
            height: 80,
            borderRadius: 12,
            overflow: 'hidden',
            marginRight: 16,
            backgroundColor: theme.colors.background,
        },
        image: {
            width: '100%',
            height: '100%',
        },
        placeholder: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
        },
        placeholderText: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.textSecondary,
        },
        infoContainer: {
            flex: 1,
            justifyContent: 'center',
        },
        title: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 6,
        },
        date: {
            fontSize: 13,
            color: theme.colors.primary,
            fontWeight: '600',
            marginBottom: 4,
        },
        location: {
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
    }), [theme]);

    return (
        <TouchableOpacity style={styles.container} onPress={() => onPress(event)} activeOpacity={0.8}>
            <View style={styles.imageContainer}>
                {event.image ? (
                    <Image source={{ uri: event.image }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>{event.title.charAt(0)}</Text>
                    </View>
                )}
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
                <Text style={styles.date}>{event.date}</Text>
                <Text style={styles.location} numberOfLines={1}>{event.location}</Text>
            </View>
        </TouchableOpacity>
    );
};
