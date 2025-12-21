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
            flexDirection: 'column', // Changed to column
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            marginBottom: 20,
            marginHorizontal: 20,
            ...theme.shadows.soft,
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: 'hidden', // Ensure image clips
        },
        imageContainer: {
            width: '100%',
            height: 160,
            backgroundColor: theme.colors.muted,
        },
        image: {
            width: '100%',
            height: '100%',
        },
        placeholder: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.muted,
        },
        placeholderText: {
            fontSize: 32,
            fontWeight: 'bold',
            color: theme.colors.textSecondary,
        },
        infoContainer: {
            padding: 16,
        },
        title: {
            fontSize: 18,
            fontWeight: '800',
            color: theme.colors.text,
            marginBottom: 8,
            fontFamily: theme.fonts.headings,
        },
        detailsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 6,
        },
        detailText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginLeft: 0,
            fontFamily: theme.fonts.main,
        },
        dateText: {
            fontSize: 14,
            color: theme.colors.primary,
            fontWeight: '600',
            fontFamily: theme.fonts.main,
            marginBottom: 4,
        },
        footerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        attendeeText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.main,
        },
        joinButton: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            backgroundColor: theme.colors.primary,
            borderRadius: 8,
        },
        joinButtonText: {
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 'bold',
        }

    }), [theme]);

    return (
        <TouchableOpacity style={styles.container} onPress={() => onPress(event)} activeOpacity={0.9}>
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

                {/* Date */}
                <Text style={styles.dateText}>{event.date}</Text>

                {/* Location */}
                <View style={styles.detailsRow}>
                    <Text style={styles.detailText} numberOfLines={1}>{event.location}</Text>
                </View>

                {/* Footer with fake "Join" button for visual parity */}
                <View style={styles.footerRow}>
                    <Text style={styles.attendeeText}>Detaylar için dokunun</Text>
                    <View style={styles.joinButton}>
                        <Text style={styles.joinButtonText}>İncele</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};
