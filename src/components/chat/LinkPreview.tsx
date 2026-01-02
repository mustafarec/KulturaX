import React, { useState, useEffect, memo } from 'react';
import { View, Text, Image, TouchableOpacity, Linking, StyleSheet, ActivityIndicator } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LinkPreviewProps {
    url: string;
    isMyMessage: boolean;
    theme: any;
}

interface PreviewData {
    title: string;
    description: string;
    image: string | null;
    siteName: string;
}

// Cache configuration
const CACHE_KEY_PREFIX = 'link_preview_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory cache for fast access (session cache)
const memoryCache: Record<string, PreviewData | null> = {};

// Extract URL from text
export const extractUrl = (text: string): string | null => {
    const urlRegex = /((https?:\/\/)|(www\.))[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|edu|gov|io|co|tr|uk|de|fr|it|es|nl|pl|ru|br|cn|jp|kr|in|au)(\/[^\s]*)?/gi;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
};

// Load from persistent storage
const loadFromStorage = async (url: string): Promise<PreviewData | null | undefined> => {
    try {
        const cacheKey = CACHE_KEY_PREFIX + encodeURIComponent(url);
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Check TTL
            if (Date.now() - timestamp < CACHE_TTL) {
                memoryCache[url] = data;
                return data;
            }
            // Expired, remove
            await AsyncStorage.removeItem(cacheKey);
        }
    } catch (error) {
        // Silent fail
    }
    return undefined; // undefined = not cached, null = cached as failed
};

// Save to persistent storage
const saveToStorage = async (url: string, data: PreviewData | null): Promise<void> => {
    try {
        const cacheKey = CACHE_KEY_PREFIX + encodeURIComponent(url);
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
        memoryCache[url] = data;
    } catch (error) {
        // Silent fail
    }
};

// Fetch metadata from URL
const fetchLinkPreview = async (url: string): Promise<PreviewData | null> => {
    try {
        // 1. Check memory cache first (fastest)
        if (memoryCache[url] !== undefined) {
            return memoryCache[url];
        }

        // 2. Check persistent storage
        const storedData = await loadFromStorage(url);
        if (storedData !== undefined) {
            return storedData;
        }

        // 3. Fetch from network
        let validUrl = url;
        if (!url.match(/^https?:\/\//i)) {
            validUrl = 'https://' + url;
        }

        const response = await fetch(validUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
            },
        });

        if (!response.ok) {
            await saveToStorage(url, null);
            return null;
        }

        const html = await response.text();

        // Extract meta tags
        const getMetaContent = (property: string): string => {
            const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
            const match = html.match(regex);
            if (match) return match[1];

            const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i');
            const match2 = html.match(regex2);
            return match2 ? match2[1] : '';
        };

        let title = getMetaContent('og:title') || getMetaContent('twitter:title');
        if (!title) {
            const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
            title = titleMatch ? titleMatch[1] : '';
        }

        const description = getMetaContent('og:description') || getMetaContent('twitter:description') || getMetaContent('description');
        const image = getMetaContent('og:image') || getMetaContent('twitter:image');
        const siteName = getMetaContent('og:site_name') || new URL(validUrl).hostname;

        if (!title && !description) {
            await saveToStorage(url, null);
            return null;
        }

        const preview: PreviewData = {
            title: title.substring(0, 100),
            description: description.substring(0, 150),
            image: image || null,
            siteName: siteName,
        };

        await saveToStorage(url, preview);
        return preview;
    } catch (error) {
        await saveToStorage(url, null);
        return null;
    }
};

export const LinkPreview: React.FC<LinkPreviewProps> = memo(({ url, isMyMessage, theme }) => {
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadPreview = async () => {
            const data = await fetchLinkPreview(url);
            if (mounted) {
                setPreview(data);
                setError(!data);
                setLoading(false);
            }
        };

        loadPreview();

        return () => {
            mounted = false;
        };
    }, [url]);

    const handlePress = () => {
        let openUrl = url;
        if (!url.match(/^https?:\/\//i)) {
            openUrl = 'https://' + url;
        }
        Linking.openURL(openUrl).catch(err => console.error('Failed to open URL:', err));
    };

    const styles = StyleSheet.create({
        container: {
            marginTop: 8,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: isMyMessage ? 'rgba(0,0,0,0.15)' : theme.colors.background,
            borderWidth: isMyMessage ? 0 : 1,
            borderColor: theme.colors.border,
        },
        imageContainer: {
            width: '100%',
            height: 120,
            backgroundColor: theme.colors.surface,
        },
        image: {
            width: '100%',
            height: '100%',
        },
        content: {
            padding: 10,
        },
        siteName: {
            fontSize: 11,
            color: isMyMessage ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary,
            marginBottom: 2,
            textTransform: 'uppercase',
        },
        title: {
            fontSize: 14,
            fontWeight: '600',
            color: isMyMessage ? '#fff' : theme.colors.text,
            marginBottom: 4,
        },
        description: {
            fontSize: 12,
            color: isMyMessage ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary,
            lineHeight: 16,
        },
        urlRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 6,
        },
        urlText: {
            fontSize: 11,
            color: isMyMessage ? 'rgba(255,255,255,0.6)' : theme.colors.primary,
            marginLeft: 4,
            flex: 1,
        },
        loading: {
            padding: 20,
            alignItems: 'center',
        },
    });

    if (loading) {
        return (
            <View style={[styles.container, styles.loading]}>
                <ActivityIndicator size="small" color={isMyMessage ? '#fff' : theme.colors.primary} />
            </View>
        );
    }

    if (error || !preview) {
        return null; // Don't show anything if preview failed
    }

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
            {preview.image && (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: preview.image }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                </View>
            )}
            <View style={styles.content}>
                <Text style={styles.siteName}>{preview.siteName}</Text>
                {preview.title && (
                    <Text style={styles.title} numberOfLines={2}>{preview.title}</Text>
                )}
                {preview.description && (
                    <Text style={styles.description} numberOfLines={2}>{preview.description}</Text>
                )}
                <View style={styles.urlRow}>
                    <ExternalLink size={12} color={isMyMessage ? 'rgba(255,255,255,0.6)' : theme.colors.primary} />
                    <Text style={styles.urlText} numberOfLines={1}>{url}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});
