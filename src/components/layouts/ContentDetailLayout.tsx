import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, Pressable, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';

interface ContentDetailLayoutProps {
    title: string;
    image: string;
    subtitle?: string; // e.g., Author, Director
    onSubtitlePress?: () => void;
    metaText?: string; // e.g., Year • Duration
    stats?: React.ReactNode; // Rating, Pages, etc.
    actions?: React.ReactNode; // Like, Message buttons
    children: React.ReactNode; // Tabs and Body content
    headerActions?: React.ReactNode; // Top right buttons (Bookmark, Share)
}

const HERO_HEIGHT = 320;

export const ContentDetailLayout: React.FC<ContentDetailLayoutProps> = ({
    title,
    image,
    subtitle,
    onSubtitlePress,
    metaText,
    stats,
    actions,
    children,
    headerActions
}) => {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        heroContainer: {
            height: HERO_HEIGHT,
            width: '100%',
            position: 'relative',
        },
        heroImage: {
            width: '100%',
            height: '100%',
        },
        gradientOverlay: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 160,
        },
        floatingHeader: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: insets.top + 10, // Dynamic padding
            paddingHorizontal: 20,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
        },
        headerButton: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(0,0,0,0.3)', // Darker for better contrast
            justifyContent: 'center',
            alignItems: 'center',
        },
        infoCardContainer: {
            marginTop: -40, // Overlap
            paddingHorizontal: 20,
            paddingBottom: 20,
            position: 'relative',
            zIndex: 20,
            elevation: 20, // Critical for Android touch events
        },
        infoCard: {
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            padding: 24,
            width: '100%',
            ...theme.shadows.soft,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        title: {
            fontSize: 24,
            color: theme.colors.text,
            marginBottom: 8,
            fontFamily: theme.fonts.headings,
            fontWeight: '800',
        },
        subtitle: {
            fontSize: 15,
            color: theme.colors.primary,
            fontWeight: '600',
            marginBottom: 4,
            fontFamily: theme.fonts.main,
        },
        metaText: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginBottom: 16,
            fontFamily: theme.fonts.main,
        },
        divider: {
            height: 1,
            backgroundColor: theme.colors.border,
            marginVertical: 16,
            opacity: 0.5,
        },
        bodyContent: {
            paddingTop: 0,
        }

    }), [theme, insets.top]);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    {/* 1. Background Blur Layer */}
                    <Image
                        source={{ uri: image }}
                        style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
                        resizeMode="cover"
                        blurRadius={20}
                    />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />

                    {/* 2. Main Image Layer (Contained) */}
                    <Image
                        source={{ uri: image }}
                        style={styles.heroImage}
                        resizeMode="contain"
                    />

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.1)', theme.colors.background]} // Fade to bg
                        style={styles.gradientOverlay}
                    />

                    {/* Floating Header Actions (Absolute) */}
                    <View style={styles.floatingHeader}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.8}
                        >
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {headerActions}
                        </View>
                    </View>
                </View>

                {/* Overlapping Info Card */}
                <View style={styles.infoCardContainer}>
                    <View style={styles.infoCard}>
                        <Text style={styles.title}>{title}</Text>

                        {subtitle && (
                            onSubtitlePress ? (
                                <Pressable
                                    onPress={onSubtitlePress}
                                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                                    style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
                                >
                                    <Text style={[styles.subtitle, { textDecorationLine: 'underline' }]}>{subtitle}</Text>
                                </Pressable>
                            ) : (
                                <Text style={styles.subtitle}>{subtitle}</Text>
                            )
                        )}
                        {metaText && <Text style={styles.metaText}>{metaText}</Text>}

                        {stats && (
                            <View>
                                <View style={styles.divider} />
                                {stats}
                            </View>
                        )}

                        {actions && (
                            <View style={{ marginTop: 20 }}>
                                {actions}
                            </View>
                        )}
                    </View>
                </View>

                {/* Main Body (Tabs etc) */}
                <View style={styles.bodyContent}>
                    {children}
                </View>

            </ScrollView>
        </View>
    );
};
