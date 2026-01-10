import { StyleSheet } from 'react-native';

export const getStyles = (theme: any) => StyleSheet.create({
    container: {
        marginBottom: theme.spacing.m,
        borderBottomWidth: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
        paddingRight: 20,
    },
    optionsButton: {
        position: 'absolute',
        top: 12, // Aligned with typical padding
        right: 12,
        zIndex: 10,
        padding: 4,
    },
    userInfo: {
        flex: 1,
        marginLeft: theme.spacing.s,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        fontFamily: 'Roboto-Regular',
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        flexWrap: 'wrap',
    },
    username: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontFamily: theme.fonts.main,
    },
    dot: {
        marginHorizontal: 4,
        color: theme.colors.textSecondary,
        fontSize: 10,
    },
    time: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontFamily: theme.fonts.main,
    },
    content: {
        fontSize: 15,
        lineHeight: 22,
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
        fontFamily: theme.fonts.main,
    },
    bookCard: {
        backgroundColor: theme.colors.muted,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        flexDirection: 'row',
        marginBottom: theme.spacing.m,
    },
    bookCover: {
        width: 60,
        height: 90,
        borderRadius: theme.borderRadius.s,
        backgroundColor: theme.colors.secondary,
    },
    bookInfo: {
        flex: 1,
        marginLeft: theme.spacing.m,
        justifyContent: 'center',
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primary,
        fontFamily: theme.fonts.headings || theme.fonts.main,
        marginBottom: 4,
    },
    bookAuthor: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontFamily: theme.fonts.main,
    },
    quoteBox: {
        backgroundColor: theme.colors.background,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.s,
        marginBottom: theme.spacing.m,
    },
    quoteText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: theme.colors.text,
        fontFamily: theme.fonts.quote || theme.fonts.main,
        lineHeight: 24,
    },
    embeddedPostContainer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        marginBottom: 12,
        backgroundColor: theme.colors.surface,
    },
    embeddedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    embeddedAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.border,
        marginRight: 8,
    },
    embeddedName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    embeddedUsername: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    embeddedContent: {
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 8,
    },
    embeddedImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing.s,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    actionText: {
        fontSize: 13,
        marginLeft: 6,
        fontWeight: '500',
    }
});
