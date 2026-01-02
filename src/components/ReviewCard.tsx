import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Film, BookOpen, Star } from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';

interface ReviewCardProps {
    review: any;
    onUserPress?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onUserPress }) => {
    const { theme } = useTheme();
    const navigation = useNavigation<any>();

    const handlePress = () => {
        if (review.content_type === 'movie') {
            navigation.navigate('MovieDetail', { movieId: Number(review.content_id) });
        } else if (review.content_type === 'book') {
            navigation.navigate('BookDetail', { bookId: review.content_id });
        } else if (review.content_type === 'music') {
            navigation.navigate('ContentDetail', { id: review.content_id, type: 'music' });
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.liquid,
            marginBottom: theme.spacing.m,
            padding: theme.spacing.m,
            ...theme.shadows.soft,
            borderWidth: 1,
            borderColor: theme.colors.border,
            flexDirection: 'row',
        },
        coverImage: {
            width: 60,
            height: 90,
            borderRadius: 8,
            marginRight: theme.spacing.m,
            backgroundColor: theme.colors.secondary,
        },
        contentColumn: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: theme.spacing.s,
        },
        titleContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginRight: 8,
        },
        contentTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.text,
            marginRight: theme.spacing.s,
        },
        ratingBadge: {
            backgroundColor: '#FFC107',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
        },
        ratingText: {
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: 11,
        },
        date: {
            fontSize: 11,
            color: theme.colors.textSecondary,
        },
        reviewText: {
            fontSize: 14,
            color: theme.colors.text,
            lineHeight: 20,
            fontStyle: 'italic',
            opacity: 0.9,
        },
    }), [theme]);

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
            {review.image_url ? (
                <Image source={{ uri: review.image_url }} style={styles.coverImage} />
            ) : (
                <View style={[styles.coverImage, { justifyContent: 'center', alignItems: 'center' }]}>
                    {review.content_type === 'movie' ? <Film size={24} color="#FFF" /> : <BookOpen size={24} color="#FFF" />}
                </View>
            )}

            <View style={styles.contentColumn}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.contentTitle} numberOfLines={1}>
                            {review.content_title || 'Bilinmeyen İçerik'}
                        </Text>
                        <View style={styles.ratingBadge}>
                            <Star size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.ratingText}>{review.rating}</Text>
                        </View>
                    </View>
                    <Text style={styles.date}>
                        {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                </View>

                <Text style={styles.reviewText} numberOfLines={4}>
                    {review.review_text || review.content}
                </Text>
            </View>
        </TouchableOpacity>
    );
};
