import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import Icon from 'react-native-vector-icons/SimpleLineIcons';

interface ReviewCardProps {
    review: any;
    onUserPress?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onUserPress }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.contentTitle} numberOfLines={1}>
                        {review.content_title || 'Bilinmeyen İçerik'}
                    </Text>
                    <View style={styles.ratingBadge}>
                        <Icon name="star" size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.ratingText}>{review.rating}</Text>
                    </View>
                </View>
                <Text style={styles.date}>
                    {new Date(review.created_at).toLocaleDateString()}
                </Text>
            </View>

            <Text style={styles.reviewText}>
                {review.review_text || review.content}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.glass,
        borderRadius: theme.borderRadius.liquid,
        marginBottom: theme.spacing.m,
        padding: theme.spacing.l,
        ...theme.shadows.soft,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
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
    },
    contentTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginRight: theme.spacing.s,
    },
    ratingBadge: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    date: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginLeft: theme.spacing.s,
    },
    reviewText: {
        fontSize: 15,
        color: theme.colors.text,
        lineHeight: 22,
        fontStyle: 'italic',
        opacity: 0.9,
    },
});
