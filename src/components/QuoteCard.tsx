import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/SimpleLineIcons';

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
        quoteIcon: {
            position: 'absolute',
            top: 20,
            left: 20,
        },
        text: {
            fontSize: 20,
            color: '#ffffff',
            textAlign: 'center',
            fontWeight: 'bold',
            fontStyle: 'italic',
            marginBottom: theme.spacing.l,
            lineHeight: 28,
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
            fontSize: 18, // Slightly larger for quote emphasis
            color: theme.colors.text,
            lineHeight: 26,
            marginBottom: 12,
            fontFamily: 'serif', // Optional: for a more "bookish" feel
        },
        statusText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginBottom: 8,
            fontStyle: 'italic',
        },
        bookInfoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border, // Subtle separator
        },
        bookCover: {
            width: 30,
            height: 45,
            borderRadius: 4,
            marginRight: 10,
            backgroundColor: theme.colors.secondary, // Placeholder color
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
                    {text ? <Text style={styles.compactText}>{text}</Text> : null}

                    {status && (
                        <Text style={styles.statusText}>{status}</Text>
                    )}

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
                                    <Icon name="book-open" size={16} color="#fff" />
                                </View>
                            )}
                            <View style={styles.bookDetails}>
                                <Text style={styles.bookTitle} numberOfLines={1}>{source}</Text>
                                {author && <Text style={styles.bookAuthor} numberOfLines={1}>{author}</Text>}
                            </View>
                        </View>
                    )}
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
            <Icon name="speech" size={40} color="rgba(255,255,255,0.3)" style={styles.quoteIcon} />
            <Text style={styles.text}>{text}</Text>
            <View style={styles.footer}>
                <Text style={styles.source}>— {source}</Text>
                {author && <Text style={styles.author}>{author}</Text>}
            </View>
        </View>
    );
};
