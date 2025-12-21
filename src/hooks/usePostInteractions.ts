
import { useCallback } from 'react';
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
        const targetPostId = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post.id : item.id;
        const targetPost = (isRepost && !isQuoteRepost && item.original_post) ? item.original_post : item;

        // Optimistic calcs
        const currentCount = parseInt(targetPost.like_count || '0', 10);
        const newIsLiked = !targetPost.is_liked;
        const newCount = newIsLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

        // Construct updated item (we need to be careful to update the correct nested structure if it's a repost)
        // But the parent responsibility is to merge this update. We typically return the MODIFIED object.
        // Actually, logic is complex for reposts. 
        // Let's defer complexity to the helper: We return the "New State Parameters" or we execute the deep merge locally?
        // To cover all cases, let's replicate the logic:

        const updateLikeState = (post: any) => {
            const isTarget = post.id === targetPostId;
            if (isTarget) {
                return { ...post, is_liked: newIsLiked, like_count: newCount };
            }
            if (post.original_post && post.original_post.id === targetPostId) {
                return { ...post, original_post: { ...post.original_post, is_liked: newIsLiked, like_count: newCount } };
            }
            return post;
        };

        // Trigger Optimistic Update
        if (onUpdatePost) {
            // We pass a function or value. Simple approach: allow parent to map over its list.
            // But onUpdatePost signature is tricky for lists.
            // Let's assume onUpdatePost takes an ID and a generic Update Function? 
            // Or simpler: The hook shouldn't manage the list iteration. The hook manages ONE post interaction.
            // But handleLike needs to update the list.
            // Let's stick to what we have: onUpdatePost passes a specialized "updater".
            // Actually, the previous implementation `updateAllFeeds((list) => list.map(...))` was very specific.

            // Generic Pattern: onUpdatePost takes a (post) => post transformation function.
            onUpdatePost((post: any) => updateLikeState(post));
        }

        try {
            await interactionService.toggleLike(user.id, targetPostId);
        } catch (error) {
            console.error(error);
            // Revert
            if (onUpdatePost) {
                const revertLikeState = (post: any) => {
                    // Just flip it back
                    const isTarget = post.id === targetPostId;
                    if (isTarget) {
                        return { ...post, is_liked: !newIsLiked, like_count: currentCount };
                    }
                    if (post.original_post && post.original_post.id === targetPostId) {
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

        // Check if already reposted (Toggle Logic)
        const isAlreadyReposted = item.is_reposted || (item.original_post && item.original_post.is_reposted);

        // Optimistic Update
        const content = item.content;
        const newSource = 'Paylaşım';
        const newAuthor = item.user.username;
        const originalPostId = item.id;

        const updateRepostState = (post: any) => {
            const isTarget = post.id === item.id;
            const isDirectRepostOfTarget = post.original_post && post.original_post.id === item.id &&
                (post.content === 'Yeniden paylaşım' || post.content === post.original_post.content);

            if (isTarget || isDirectRepostOfTarget) {
                const postToUpdate = isTarget ? post : post.original_post;
                const currentCount = parseInt(postToUpdate.repost_count || '0', 10);
                const newIsReposted = !isAlreadyReposted;
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

        if (onUpdatePost) onUpdatePost((post: any) => updateRepostState(post));

        try {
            await postService.create(user.id, '', 'Yeniden paylaşım', newSource, newAuthor, originalPostId);
            // Success - optimistic update holds
        } catch (error: any) {
            console.error('Repost error:', error);
            Toast.show({ type: 'error', text1: 'Hata', text2: error.message || 'İşlem başarısız.' });
            // Revert interaction if needed. Complex to revert perfectly without fetch, but we can toggle back.
            // Ideally we just fetchFeed, but here we try to revert state.
            if (onUpdatePost) {
                // Reusing the same update logic but flipping the condition would be complex because we derived newIsReposted from closure "isAlreadyReposted".
                // We can just run the same update again? No, "isAlreadyReposted" was fixed at start.
                // We need to invert it.
                const revertRepostState = (post: any) => {
                    // Same logic as updateRepostState but forcing the OLD values?
                    // Easier to just re-fetch normally, but let's try to flip it back.
                    // The "newIsReposted" was !isAlreadyReposted. We want isAlreadyReposted.
                    const isTarget = post.id === item.id;
                    const isDirectRepostOfTarget = post.original_post && post.original_post.id === item.id &&
                        (post.content === 'Yeniden paylaşım' || post.content === post.original_post.content);

                    if (isTarget || isDirectRepostOfTarget) {
                        const postToUpdate = isTarget ? post : post.original_post;
                        const currentCount = parseInt(postToUpdate.repost_count || '0', 10); // accurate enough? No, we might have optimized it.
                        // Let's assume the previous state was passed in item. 
                        const originalState = isAlreadyReposted;
                        const originalCount = isAlreadyReposted ? Math.max(0, parseInt(item.repost_count || 0)) : parseInt(item.repost_count || 0);
                        // This is getting messy. Simplest revert is to map based on the *intended* state.
                        // Force back to !newIsReposted.
                        const targetState = isAlreadyReposted; // Back to initial
                        // If we added 1, subtract 1. If we subtracted 1, add 1.
                        let revertCount = parseInt(postToUpdate.repost_count || '0', 10);
                        if (!isAlreadyReposted) revertCount--; // We added, so subtract
                        else revertCount++; // We removed, so add

                        if (isTarget) {
                            return { ...post, repost_count: revertCount.toString(), is_reposted: targetState };
                        } else {
                            return { ...post, original_post: { ...post.original_post, repost_count: revertCount.toString(), is_reposted: targetState } };
                        }
                    }
                    return post;
                };
                onUpdatePost((post: any) => revertRepostState(post));
            }
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
