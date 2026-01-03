import { useCallback } from 'react';
import { interactionService, postService } from '../services/backendApi';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { LayoutAnimation, UIManager, Platform } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface UseFeedActionsProps {
    updateAllFeeds: (updater: (feed: any[]) => any[]) => void;
    user: any;
}

export const useFeedActions = ({ updateAllFeeds, user }: UseFeedActionsProps) => {

    const handleDelete = useCallback(async (postId: number) => {
        if (!user) return;
        try {
            // Optimistic Remove
            updateAllFeeds(prev => prev.filter(post => post.id !== postId));

            await postService.delete(postId);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Gönderi silindi.' });
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Silinemedi.' });
            // Ideally revert here by fetching feed again or re-inserting if we kept a backup, 
            // but for deletion, refreshing is standard practice on error.
        }
    }, [user, updateAllFeeds]);

    const handleFeedback = useCallback(async (
        type: 'report' | 'not_interested' | 'show_more',
        item: any,
    ) => {
        if (!item || !user) return;

        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post &&
            item.content !== 'Yeniden paylaşım' &&
            item.content !== item.original_post.content;
        const targetPostId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;

        if (type === 'not_interested' || type === 'report') {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
            updateAllFeeds(prev => prev.filter(post => post.id !== item.id));

            Toast.show({
                type: 'success',
                text1: 'Bildirim alındı',
                text2: type === 'report' ? 'İçerik bildirildi ve gizlendi.' : 'Bu içerik gizlendi.'
            });
        } else if (type === 'show_more') {
            Toast.show({
                type: 'success',
                text1: 'Anlaşıldı',
                text2: 'Buna benzer içerikleri daha sık göreceksiniz.'
            });
        }

        try {
            await interactionService.sendFeedFeedback(targetPostId, type);
        } catch (error) {
            console.error('Feedback error:', error);
        }
    }, [user, updateAllFeeds]);

    const handleFeedbackAction = useCallback(async (targetPostId: number, interested: boolean, feedbackItemId: string) => {
        // Remove card locally
        updateAllFeeds(prev => prev.filter(item => item.id !== feedbackItemId));

        if (!user) return;
        try {
            await interactionService.sendFeedFeedback(targetPostId, interested ? 'show_more' : 'not_interested');
        } catch (error) {
            console.error('Feedback failed', error);
        }
    }, [user, updateAllFeeds]);

    const handleFeedbackDismiss = useCallback((feedbackItemId: string) => {
        updateAllFeeds(prev => prev.filter(item => item.id !== feedbackItemId));
    }, [updateAllFeeds]);

    return {
        handleDelete,
        handleFeedback,
        handleFeedbackAction,
        handleFeedbackDismiss
    };
};
