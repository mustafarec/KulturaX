import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BookOpen } from 'lucide-react-native';

interface QuoteCardProps {
    text: string;
    source: string;
    author?: string;
    themeColor?: string;
    variant?: 'default' | 'compact';
    imageUrl?: string;
    status?: string;
    onPress?: () => void;
}

export const QuoteCard = ({
    text,
    source,
    author,
    themeColor,
    variant = 'default',
    imageUrl,
    status,
    onPress
}: QuoteCardProps) => {
    const { theme } = useTheme();
    const activeThemeColor = themeColor || theme.colors.primary;

    const styles = React.useMemo(() => StyleSheet.create({
        card: {
            padding: theme.spacing.xl,
            borderRadius: theme.borderRadius.liquid,
            margin: theme.spacing.m,
            minHeight: 200,
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.shadows.soft,
        },

        text: {
            fontSize: 16, // Slightly larger than body for the main card 
            color: '#ffffff',
            textAlign: 'center',
            fontWeight: '600', // Thicker
            marginBottom: theme.spacing.l,
            lineHeight: 24,
        },
        footer: {
            alignItems: 'center',
        },
        source: {
            fontSize: 16,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 'bold',
        },
        author: {
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            marginTop: 4,
        },
        // Compact Styles
        compactCard: {
            backgroundColor: 'transparent',
            marginTop: 8,
            marginBottom: 8,
            flexDirection: 'row',
            width: '100%',
        },
        compactContent: {
            flex: 1,
        },
        compactText: {
            fontSize: 15, // Same as normal body text
            color: theme.colors.text,
            lineHeight: 22,
            marginBottom: 12,
            fontWeight: '600', // "Bir tık daha kalın"
        },
        statusText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginBottom: 8,
            fontStyle: 'italic',
        },
        embossedContainer: {
            marginTop: 12,
            paddingTop: 16, // Increased from 12
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            borderWidth: 1,
            borderColor: (theme as any).id === 'black' ? '#333333' : 'rgba(255, 255, 255, 0.05)', // Specific border for black mode
            backgroundColor: (theme as any).id === 'light' ? '#FFFCF5' : theme.colors.surface, // Very Light Cream for Light Mode
            paddingHorizontal: 16, // Increased from 12
            paddingBottom: 16, // Increased from 12
            borderRadius: 8,
            shadowColor: theme.dark ? "#000" : "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: theme.dark ? 0.3 : 0.05,
            shadowRadius: 3,
            elevation: 2,
        },
        bookInfoContainer: { // Keeping name for compatibility but it's just a row now
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
        },
        bookCover: {
            width: 30,
            height: 45,
            borderRadius: 4,
            marginRight: 15, // Increased from 10
            backgroundColor: theme.colors.secondary,
        },
        bookDetails: {
            flex: 1,
            justifyContent: 'center',
        },
        bookTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        bookAuthor: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
    }), [theme]);

    if (variant === 'compact') {
        const Content = (
            <View style={styles.compactCard}>
                <View style={styles.compactContent}>
                    {status && (
                        <Text style={styles.statusText}>{status}</Text>
                    )}

                    <View style={styles.embossedContainer}>
                        {(imageUrl || source) && (
                            <View style={styles.bookInfoContainer}>
                                {imageUrl ? (
                                    <Image
                                        source={{
                                            uri: imageUrl.replace(/^http:/, 'https:').replace(/&amp;/g, '&')
                                        }}
                                        style={styles.bookCover}
                                    />
                                ) : (
                                    <View style={[styles.bookCover, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <BookOpen size={16} color="#fff" />
                                    </View>
                                )}
                                <View style={styles.bookDetails}>
                                    <Text style={styles.bookTitle} numberOfLines={1}>{source}</Text>
                                    {author && <Text style={styles.bookAuthor} numberOfLines={1}>{author}</Text>}
                                </View>
                            </View>
                        )}

                        {text ? (
                            <Text style={styles.compactText}>
                                {text.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')}
                            </Text>
                        ) : null}
                    </View>
                </View>
            </View>
        );

        if (onPress) {
            return (
                <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                    {Content}
                </TouchableOpacity>
            );
        }

        return Content;
    }

    return (
        <View style={[styles.card, { backgroundColor: activeThemeColor }]}>

            <Text style={styles.text}>{text}</Text>
            <View style={styles.footer}>
                <Text style={styles.source}>— {source}</Text>
                {author && <Text style={styles.author}>{author}</Text>}
            </View>
        </View>
    );
};
