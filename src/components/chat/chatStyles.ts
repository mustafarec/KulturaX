import { StyleSheet, Platform } from 'react-native';

export const createChatStyles = (theme: any, insets: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: insets.top + 10,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderBottomLeftRadius: theme.borderRadius.xl,
        borderBottomRightRadius: theme.borderRadius.xl,
        ...theme.shadows.soft,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        borderRadius: theme.borderRadius.pill,
        backgroundColor: theme.colors.background,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    headerAvatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerAvatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: theme.fonts.headings,
    },
    headerTitle: {
        fontSize: 20,
        color: theme.colors.text,
        fontFamily: theme.fonts.headings,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
        paddingBottom: 32,
    },
    // Request styles
    requestContainer: {
        padding: 24,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        alignItems: 'center',
        paddingBottom: Math.max(insets.bottom, 24),
    },
    requestText: {
        fontSize: 15,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: theme.fonts.main,
        lineHeight: 22,
    },
    requestButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 16,
    },
    requestButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: theme.colors.primary,
    },
    declineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
        fontFamily: theme.fonts.main,
    },
    declineButtonText: {
        color: theme.colors.error,
        fontWeight: '600',
        fontSize: 15,
        fontFamily: theme.fonts.main,
    },
    // Search related styles
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 8,
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
        marginLeft: 8,
        padding: 0,
    },
    searchControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchButton: {
        padding: 4,
    },
    matchCounter: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginRight: 8,
        fontVariant: ['tabular-nums'],
    },
    highlightedText: {
        backgroundColor: '#FFE066', // Yellow highlight
        color: '#000',
    },
    activeHighlightedText: {
        backgroundColor: '#FF9F1C', // Orange for active match
        color: '#fff',
    },
});
