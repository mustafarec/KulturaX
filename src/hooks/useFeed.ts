import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { postService, userService } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';
import { Post, FeedItem } from '../types/models';

const FEEDBACK_STORAGE_KEY = '@last_feedback_time';
const FEEDBACK_COOLDOWN = 12 * 60 * 60 * 1000; // 12 hours

export interface FeedState {
    trend: FeedItem[];
    following: FeedItem[];
    movie: FeedItem[];
    book: FeedItem[];
    music: FeedItem[];
}

export const useFeed = () => {
    const { user } = useAuth();

    // Feed States
    const [feeds, setFeeds] = useState<FeedState>({
        trend: [],
        following: [],
        movie: [],
        book: [],
        music: []
    });

    const [loadingStates, setLoadingStates] = useState({
        trend: true,
        following: true,
        movie: true,
        book: true,
        music: true
    });

    const [refreshing, setRefreshing] = useState(false);

    // Helpers to update state safely
    const setFeedData = useCallback((tab: keyof FeedState, data: FeedItem[]) => {
        setFeeds(prev => ({ ...prev, [tab]: data }));
    }, []);

    const setLoading = useCallback((tab: keyof FeedState, isLoading: boolean) => {
        setLoadingStates(prev => ({ ...prev, [tab]: isLoading }));
    }, []);

    // Update ALL feeds (for sync like/save status across tabs)
    const updateAllFeeds = useCallback((updater: (feed: FeedItem[]) => FeedItem[]) => {
        setFeeds(prev => ({
            trend: updater(prev.trend),
            following: updater(prev.following),
            movie: updater(prev.movie),
            book: updater(prev.book),
            music: updater(prev.music)
        }));
    }, []);

    const handlePostUpdate = useCallback((updater: (post: FeedItem) => FeedItem) => {
        updateAllFeeds((list) => list.map(updater));
    }, [updateAllFeeds]);


    // Use Ref to access latest feeds without triggering re-creation of fetchFeed
    const feedsRef = useRef(feeds);

    // Sync ref
    useEffect(() => {
        feedsRef.current = feeds;
    }, [feeds]);

    // Fetch Logic
    const fetchFeed = useCallback(async (
        targetTab: keyof FeedState | 'search',
        searchQuery: string = '',
        isRefresh = false
    ) => {
        if (targetTab === 'search') return [];

        const tab = targetTab as keyof FeedState;

        // Cache Logic using Ref
        if (!isRefresh && searchQuery.trim().length === 0 && feedsRef.current[tab].length > 0) {
            setLoading(tab, false);
            return;
        }

        if (!isRefresh) setLoading(tab, true);
        if (isRefresh) setRefreshing(true);

        try {
            const filter = tab === 'trend' ? '' : tab;
            let feedData: FeedItem[] = [];

            if (searchQuery.trim().length > 0) {
                // Search
                const [posts, users] = await Promise.all([
                    postService.getFeed(user?.id, filter, searchQuery),
                    userService.search(searchQuery)
                ]);
                const safePosts = Array.isArray(posts) ? posts : [];
                const safeUsers = Array.isArray(users) ? users : [];

                const markedPosts = safePosts.map((p: any) => ({ ...p, type: 'post' } as FeedItem));
                const markedUsers = safeUsers.map((u: any) => ({ ...u, type: 'user', id: `user_${u.id}`, originalId: u.id } as FeedItem));
                feedData = [...markedUsers, ...markedPosts];
            } else {
                // Normal Feed
                let posts;
                if (tab === 'following') {
                    posts = await postService.getFollowingFeed(user!.id, '', searchQuery);
                } else {
                    posts = await postService.getFeed(user?.id, filter === 'following' ? '' : filter, searchQuery);
                }

                if (!Array.isArray(posts)) {
                    console.error('Feed API Error:', posts);
                    feedData = [];
                } else {
                    feedData = posts.map((p: any) => ({ ...p, type: 'post' } as FeedItem));
                }

                // Injections (Suggested Users & Feedback) - Only for Trend
                if (tab === 'trend' && searchQuery.trim().length === 0) {
                    // Suggested Users
                    if (feedData.length >= 5) {
                        const min = 5;
                        const max = Math.min(feedData.length, 10);
                        const randomIndex = Math.floor(Math.random() * (max - min) + min);
                        feedData.splice(randomIndex, 0, { type: 'suggested_users', id: 'suggested_users_block_1' });
                    }

                    // Smart Feedback
                    const lastFeedbackTimeStr = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
                    const lastFeedbackTime = lastFeedbackTimeStr ? parseInt(lastFeedbackTimeStr, 10) : 0;
                    const now = Date.now();

                    if ((now - lastFeedbackTime) > FEEDBACK_COOLDOWN) {
                        let feedbackInjected = false;
                        for (let i = feedData.length - 1; i >= 0; i--) {
                            if (feedbackInjected) break;
                            const targetPost = feedData[i];
                            if (targetPost && targetPost.type === 'post' && targetPost.user) { // Added implicit check
                                // Note: We need to cast or ensure properties exist. For now trusting FeedItem structure for post type.
                                const postItem = targetPost as unknown as Post; // Safe cast if we knew it was a post but FeedItem is union
                                if (postItem.request_feedback) {
                                    feedData.splice(i + 1, 0, {
                                        type: 'feedback',
                                        id: `feedback_${targetPost.id}_${now}`,
                                        targetPostId: Number(targetPost.id)
                                    });
                                    feedbackInjected = true;
                                    AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, now.toString());
                                }
                            }
                        }
                    }
                }
            }

            setFeedData(tab, feedData);

        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Akış yüklenemedi.' });
        } finally {
            setLoading(tab, false);
            setRefreshing(false);
        }
    }, [user, setLoading, setFeedData]); // Removed 'feeds' dependency

    return {
        feeds,
        loadingStates,
        refreshing,
        fetchFeed,
        updateAllFeeds,
        handlePostUpdate
    };
};
