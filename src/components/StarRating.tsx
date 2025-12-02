import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    editable?: boolean;
    size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
    rating,
    onRatingChange,
    editable = false,
    size = 24
}) => {
    const { theme } = useTheme();
    const renderStar = (index: number) => {
        const filled = index < rating;
        const star = filled ? '⭐' : '☆';

        if (editable && onRatingChange) {
            return (
                <TouchableOpacity
                    key={index}
                    onPress={() => onRatingChange(index + 1)}
                    style={styles.starButton}
                >
                    <Text style={[styles.star, { fontSize: size }]}>{star}</Text>
                </TouchableOpacity>
            );
        }

        return (
            <Text key={index} style={[styles.star, { fontSize: size }]}>
                {star}
            </Text>
        );
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        starButton: {
            padding: 4,
        },
        star: {
            color: theme.colors.primary,
        },
    }), [theme]);

    return (
        <View style={styles.container}>
            {[0, 1, 2, 3, 4].map(renderStar)}
        </View>
    );
};


