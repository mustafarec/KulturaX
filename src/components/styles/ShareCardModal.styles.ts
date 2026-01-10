import { StyleSheet } from 'react-native';

export const getStyles = (theme: any) => {
    const isDark = theme.dark;
    const cardBg = isDark ? theme.colors.surface : '#FFFFFF';
    const cardTextPrimary = theme.colors.text;
    const cardTextSecondary = theme.colors.textSecondary;
    const accentColor = theme.colors.primary;
    const borderColor = theme.colors.border;
    const mutedBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    const mutedBgLight = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const avatarPlaceholderBg = isDark ? '#333' : '#E5E5E5';

    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContainer: {
            width: '100%',
            maxWidth: 360,
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            overflow: 'hidden',
            ...theme.shadows.soft,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        headerTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: theme.colors.text,
        },
        closeButton: {
            padding: 4,
        },
        cardContainer: {
            padding: 16,
        },
        shareCard: {
            backgroundColor: cardBg,
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: isDark ? 0 : 1,
            borderColor: borderColor,
        },
        coverImage: {
            width: '100%',
            height: 280,
        },
        cardContent: {
            padding: 20,
        },
        typeLabel: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
        },
        typeLabelText: {
            fontSize: 12,
            fontWeight: '600',
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        cardTitle: {
            fontSize: 24,
            fontWeight: '800',
            color: cardTextPrimary,
            marginBottom: 8,
        },
        cardSubtitle: {
            fontSize: 14,
            color: cardTextSecondary,
            marginBottom: 12,
        },
        cardMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
        },
        metaText: {
            fontSize: 13,
            color: cardTextSecondary,
        },
        ratingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        ratingText: {
            fontSize: 14,
            fontWeight: '700',
            color: '#F59E0B',
        },
        branding: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: borderColor,
        },
        brandingText: {
            fontSize: 14,
            fontWeight: '700',
            color: accentColor,
        },
        shareButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: theme.colors.primary,
            paddingVertical: 14,
            marginHorizontal: 16,
            marginBottom: 16,
            borderRadius: 12,
        },
        shareButtonText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        // Post specific styles
        postCard: {
            backgroundColor: cardBg,
            borderRadius: 20,
            padding: 24,
            borderWidth: isDark ? 0 : 1,
            borderColor: borderColor,
        },
        postAuthorRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        postAvatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
            marginRight: 12,
            backgroundColor: avatarPlaceholderBg,
        },
        postAuthorName: {
            fontSize: 16,
            fontWeight: '700',
            color: cardTextPrimary,
        },
        postQuote: {
            fontSize: 18,
            fontStyle: 'italic',
            color: cardTextPrimary,
            lineHeight: 26,
            marginBottom: 16,
            paddingLeft: 16,
            borderLeftWidth: 3,
            borderLeftColor: accentColor,
        },
        postText: {
            fontSize: 16,
            color: cardTextPrimary,
            lineHeight: 24,
            marginBottom: 16,
        },
        postCoverImage: {
            width: '100%',
            height: 160,
            borderRadius: 12,
            marginBottom: 16,
        },
        // Content card (like PostCard's bookCard)
        contentCard: {
            flexDirection: 'row',
            backgroundColor: mutedBg,
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
        },
        contentCover: {
            width: 50,
            height: 75,
            borderRadius: 8,
            backgroundColor: avatarPlaceholderBg,
        },
        contentInfo: {
            flex: 1,
            marginLeft: 12,
            justifyContent: 'center',
        },
        contentTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: cardTextPrimary,
            marginTop: 4,
        },
        // Quote box (like PostCard's quoteBox)
        quoteBox: {
            backgroundColor: mutedBgLight,
            borderLeftWidth: 3,
            borderLeftColor: accentColor,
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
        },
        // Profile specific styles
        profileCard: {
            backgroundColor: cardBg,
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
            borderWidth: isDark ? 0 : 1,
            borderColor: borderColor,
        },
        profileAvatar: {
            width: 100,
            height: 100,
            borderRadius: 50,
            marginBottom: 16,
            borderWidth: 3,
            borderColor: accentColor,
        },
        profileUsername: {
            fontSize: 24,
            fontWeight: '800',
            color: cardTextPrimary,
            marginBottom: 8,
        },
        profileBio: {
            fontSize: 14,
            color: cardTextSecondary,
            textAlign: 'center',
            marginBottom: 20,
            paddingHorizontal: 16,
        },
        profileStats: {
            flexDirection: 'row',
            gap: 32,
            marginBottom: 16,
        },
        profileStat: {
            alignItems: 'center',
        },
        profileStatNumber: {
            fontSize: 20,
            fontWeight: '800',
            color: cardTextPrimary,
        },
        profileStatLabel: {
            fontSize: 12,
            color: cardTextSecondary,
        },
        // Repost specific styles
        repostLabel: {
            fontSize: 11,
            color: cardTextSecondary,
            marginTop: 2,
        },
        repostedByContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            gap: 6,
        },
        repostedByText: {
            fontSize: 12,
            color: cardTextSecondary,
            fontWeight: '600',
        },
        originalPostCard: {
            backgroundColor: mutedBg,
            borderRadius: 12,
            padding: 14,
            marginTop: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: borderColor,
        },
        originalPostAuthorRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        originalPostAvatar: {
            width: 28,
            height: 28,
            borderRadius: 14,
            marginRight: 8,
            backgroundColor: avatarPlaceholderBg,
        },
        originalPostAuthorName: {
            fontSize: 13,
            fontWeight: '600',
            color: cardTextPrimary,
        },
        originalPostQuote: {
            fontSize: 14,
            fontStyle: 'italic',
            color: cardTextPrimary,
            lineHeight: 20,
            marginBottom: 10,
            paddingLeft: 12,
            borderLeftWidth: 2,
            borderLeftColor: accentColor,
        },
        originalPostText: {
            fontSize: 13,
            color: cardTextSecondary,
            lineHeight: 20,
            marginBottom: 10,
        },
        // Original post content card (for cover + title inside repost)
        originalContentCard: {
            flexDirection: 'row',
            backgroundColor: mutedBgLight,
            borderRadius: 8,
            padding: 10,
            marginBottom: 10,
        },
        originalContentCover: {
            width: 40,
            height: 60,
            borderRadius: 6,
            backgroundColor: avatarPlaceholderBg,
        },
        originalQuoteBox: {
            backgroundColor: mutedBgLight,
            borderLeftWidth: 2,
            borderLeftColor: accentColor,
            padding: 10,
            borderRadius: 6,
        },
    });
};
