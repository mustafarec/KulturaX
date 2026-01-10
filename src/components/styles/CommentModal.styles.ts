import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const getStyles = (theme: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    container: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        alignItems: 'center',
    },
    headerIndicator: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.textSecondary,
        borderRadius: 2,
        marginBottom: 12,
        opacity: 0.3,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    closeButtonContainer: {
        padding: 8,
        backgroundColor: theme.colors.background,
        borderRadius: 20,
    },
    closeButton: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    replyItem: {
        marginLeft: 40,
        marginTop: -10,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontSize: 16,
    },
    commentContent: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 12,
        borderRadius: 16,
        borderTopLeftRadius: 4,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    username: {
        fontWeight: '700',
        color: theme.colors.text,
        fontSize: 14,
    },
    text: {
        color: theme.colors.text,
        fontSize: 14,
        lineHeight: 20,
    },
    time: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 16,
    },
    actionButton: {
        paddingVertical: 4,
    },
    actionText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    likedText: {
        color: theme.colors.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
        opacity: 0.5,
        color: theme.colors.textSecondary,
    },
    emptyText: {
        textAlign: 'center',
        color: theme.colors.textSecondary,
        fontSize: 15,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    replyBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        paddingHorizontal: 16,
        backgroundColor: theme.colors.background,
    },
    replyText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    cancelReply: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-end',
        backgroundColor: theme.colors.surface,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        color: theme.colors.text,
        marginRight: 12,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: theme.colors.textSecondary,
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
