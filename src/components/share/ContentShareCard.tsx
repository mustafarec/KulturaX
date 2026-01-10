import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Film, BookOpen, Music, Calendar, Star } from 'lucide-react-native';
import { ContentType } from '../../types/models';
import { getStyles } from '../styles/ShareCardModal.styles';

interface ContentShareCardProps {
    contentType?: ContentType;
    title: string;
    subtitle?: string;
    coverUrl?: string;
    rating?: number;
    year?: string;
    duration?: string;
}

export const ContentShareCard: React.FC<ContentShareCardProps> = ({
    contentType,
    title,
    subtitle,
    coverUrl,
    rating,
    year,
    duration,
}) => {
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const accentColor = theme.colors.primary;

    const getContentIcon = () => {
        switch (contentType) {
            case 'movie': return Film;
            case 'music': return Music;
            case 'event': return Calendar;
            default: return BookOpen;
        }
    };

    const getContentLabel = () => {
        switch (contentType) {
            case 'movie': return 'Film';
            case 'music': return 'Müzik';
            case 'event': return 'Etkinlik';
            default: return 'Kitap';
        }
    };

    const ContentIcon = getContentIcon();

    return (
        <View style={styles.shareCard}>
            {coverUrl && (
                <Image
                    source={{ uri: coverUrl }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
            )}
            <View style={styles.cardContent}>
                {contentType && (
                    <View style={styles.typeLabel}>
                        <ContentIcon size={14} color={accentColor} />
                        <Text style={styles.typeLabelText}>{getContentLabel()}</Text>
                    </View>
                )}
                <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
                {subtitle && <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>}
                <View style={styles.cardMeta}>
                    {year && <Text style={styles.metaText}>{year}</Text>}
                    {duration && <Text style={styles.metaText}>{duration}</Text>}
                    {rating && rating > 0 && (
                        <View style={styles.ratingContainer}>
                            <Star size={14} color="#F59E0B" fill="#F59E0B" />
                            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.branding}>
                    <Text style={styles.brandingText}>📱 KültüraX</Text>
                </View>
            </View>
        </View>
    );
};
