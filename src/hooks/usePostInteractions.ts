
import { useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { interactionService, postService } from '../services/backendApi';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export type PostUpdateFn = (updatedPost: any) => void;

interface UsePostInteractionsProps {
    onUpdatePost?: PostUpdateFn; // Callback to update the post in the parent list/view
}

export const usePostInteractions = ({ onUpdatePost }: UsePostInteractionsProps) => {
    const { user } = useAuth();
    const navigation = useNavigation();

    // LIKE
    const handleLike = useCallback(async (item: any) => {
        if (!user || !item) return;

        const isRepost = !!item.original_post_id;
        const isQuoteRepost = isRepost && item.original_post &&
            item.content !== 'Yeniden paylaşım' &&
            item.content !== item.original_post.content;

        // targetPostId hesapla ve geçerlilik kontrolü yap
        const rawTargetId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;
        const targetPostId = typeof rawTargetId === 'string' ? parseInt(rawTargetId, 10) : rawTargetId;

        // postId geçersizse işlemi yapma
        if (!targetPostId || isNaN(targetPostId)) {
            console.error('Invalid post ID for like:', rawTargetId, item);
            return;
        }

        const targetPost = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post : item;

        // Optimistic calcs
        const currentCount = parseInt(targetPost.like_count || '0', 10);
        const newIsLiked = !targetPost.is_liked;
        const newCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

        const updateLikeState = (post: any) => {
            // ID karşılaştırması - String çevirerek güvenli yap
            const isTarget = String(post.id) === String(targetPostId);
            if (isTarget) {
                return { ...post, is_liked: newIsLiked, like_count: newCount };
            }
            if (post.original_post && String(post.original_post.id) === String(targetPostId)) {
                return { ...post, original_post: { ...post.original_post, is_liked: newIsLiked, like_count: newCount } };
            }
            return post;
        };

        // Trigger Optimistic Update
        if (onUpdatePost) {
            onUpdatePost((post: any) => updateLikeState(post));
        }

        try {
            await interactionService.toggleLike(targetPostId);
        } catch (error) {
            console.error(error);
            // Revert
            if (onUpdatePost) {
                const revertLikeState = (post: any) => {
                    const isTarget = String(post.id) === String(targetPostId);
                    if (isTarget) {
                        return { ...post, is_liked: !newIsLiked, like_count: currentCount };
                    }
                    if (post.original_post && String(post.original_post.id) === String(targetPostId)) {
                        return { ...post, original_post: { ...post.original_post, is_liked: !newIsLiked, like_count: currentCount } };
                    }
                    return post;
                };
                onUpdatePost((post: any) => revertLikeState(post));
            }
        }
    }, [user, onUpdatePost]);

    // SAVE
    const handleToggleSave = useCallback(async (item: any) => {
        if (!item || !user) return;
        const isSaved = item.is_saved;

        const updateSaveState = (post: any, saved: boolean) => {
            if (post.id === item.id) return { ...post, is_saved: saved };
            if (post.original_post && post.original_post.id === item.id) {
                return { ...post, original_post: { ...post.original_post, is_saved: saved } };
            }
            return post;
        };

        if (onUpdatePost) onUpdatePost((post: any) => updateSaveState(post, !isSaved));

        try {
            await interactionService.toggleBookmark(user.id, item.id);
            Toast.show({ type: 'success', text1: 'Başarılı', text2: !isSaved ? 'Kaydedildi.' : 'Kaydedilenlerden çıkarıldı.' });
        } catch (error) {
            console.error(error);
            if (onUpdatePost) onUpdatePost((post: any) => updateSaveState(post, isSaved)); // Revert
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem başarısız.' });
        }
    }, [user, onUpdatePost]);

    // REPOST
    const handleDirectRepost = useCallback(async (item: any, onCloseMenu?: () => void) => {
        if (!user || !item) return;
        if (onCloseMenu) onCloseMenu();

        // Determine if this item is already a simple repost (not quote)
        const isSimpleRepost = !!item.original_post_id && item.original_post &&
            (item.content === 'Yeniden paylaşım' || item.content === item.original_post.content);

        // Target post: If item is a simple repost, we target the original. Otherwise we target item itself.
        const targetPost = isSimpleRepost ? item.original_post : item;
        const targetPostId = targetPost.id;
        const targetUser = targetPost.user;

        // Check if already reposted (Toggle Logic)
        const isAlreadyReposted = targetPost.is_reposted;

        // Optimistic Update Helper
        const updateRepostState = (post: any, newIsReposted: boolean) => {
            const isTarget = post.id === targetPostId;
            const isDirectRepostOfTarget = post.original_post && post.original_post.id === targetPostId &&
                (post.content === 'Yeniden paylaşım' || post.content === post.original_post.content);

            if (isTarget || isDirectRepostOfTarget) {
                const postToUpdate = isTarget ? post : post.original_post;
                const currentCount = parseInt(postToUpdate.repost_count || '0', 10);
                const newCount = newIsReposted ? currentCount + 1 : Math.max(0, currentCount - 1);

                if (isTarget) {
                    return { ...post, repost_count: newCount.toString(), is_reposted: newIsReposted };
                } else {
                    return {
                        ...post,
                        original_post: {
                            ...post.original_post,
                            repost_count: newCount.toString(),
                            is_reposted: newIsReposted
                        }
                    };
                }
            }
            return post;
        };

        // Apply optimistic update (toggle to opposite state)
        const newIsReposted = !isAlreadyReposted;
        if (onUpdatePost) onUpdatePost((post: any) => updateRepostState(post, newIsReposted));

        try {
            const response = await postService.create(user.id, '', 'Yeniden paylaşım', 'Paylaşım', targetUser.username, targetPostId);

            // Check backend response to confirm the action
            if (response.unreposted) {
                // Backend confirmed unrepost - optimistic update was correct (toggled OFF)
                Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Yeniden gönderi geri alındı.' });
            } else {
                // Backend confirmed new repost created - optimistic update was correct (toggled ON)
                Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Yeniden gönderildi.' });
            }

            // Refresh feed to show updated list (new repost added or removed)
            DeviceEventEmitter.emit('refresh_feed');
        } catch (error: any) {
            console.error('Repost error:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: error.message || 'İşlem başarısız.' });
            // Revert: flip back to original state
            if (onUpdatePost) onUpdatePost((post: any) => updateRepostState(post, isAlreadyReposted));
        }
    }, [user, onUpdatePost]);


    const handleQuoteRepost = useCallback((item: any, onCloseMenu?: () => void) => {
        if (!item) return;
        if (onCloseMenu) onCloseMenu();
        (navigation as any).navigate('CreateQuote', { originalPost: item });
    }, [navigation]);

    // VIEW / CONTENT
    const handleContentPress = useCallback((type: 'book' | 'movie' | 'music', id: string) => {
        (navigation as any).navigate('ContentDetail', { id, type });
    }, [navigation]);

    const handleUserPress = useCallback((userId: number) => {
        (navigation as any).navigate('OtherProfile', { userId });
    }, [navigation]);

    return {
        handleLike,
        handleToggleSave,
        handleDirectRepost,
        handleQuoteRepost,
        handleContentPress,
        handleUserPress
    };
};
