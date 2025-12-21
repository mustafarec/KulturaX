import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { interactionService } from '../../services/backendApi';
import { PostCard } from '../../components/PostCard';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { PostOptionsModal } from '../../components/PostOptionsModal';
import { ThemedDialog } from '../../components/ThemedDialog';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SavedPostsScreen = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { theme } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

    const fetchSavedPosts = async () => {
        if (!user) return;
        try {
            const data = await interactionService.getBookmarks(user.id);
            // Ensure data is array
            setPosts(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Fetch Saved Posts Error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Kaydedilenler yüklenemedi.';
            Toast.show({ type: 'error', text1: 'Hata', text2: errorMessage });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSavedPosts();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSavedPosts();
    };

    const handleOptionsPress = (item: any, position: any) => {
        setSelectedPost(item);
        setMenuPosition(position);
        setOptionsVisible(true);
    };

    const handleRemoveBookmark = async () => {
        if (!selectedPost || !user) return;
        try {
            await interactionService.toggleBookmark(user.id, selectedPost.id);
            setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Kaydedilenlerden çıkarıldı.' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İşlem başarısız.' });
        } finally {
            setOptionsVisible(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <PostCard
            post={item}
            onPress={() => (navigation as any).navigate('PostDetail', { postId: item.id })}
            onComment={() => (navigation as any).navigate('PostDetail', { postId: item.id })}
            onOptions={(pos) => handleOptionsPress(item, pos)}
            onUserPress={(userId) => (navigation as any).navigate('OtherProfile', { userId: userId || item.user.id })}
            currentUserId={user?.id}
            onTopicPress={(topicId, topicName) => (navigation as any).navigate('TopicDetail', { topic: { id: topicId, name: topicName } })}
            onUpdatePost={(updater) => setPosts(prev => prev.map(updater))}
        />
    );

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            paddingTop: insets.top + 10, // Add safe area + a bit extra for breathing room
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginLeft: 16,
        },
        backButton: {
            padding: 8,
        },
        center: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyText: {
            color: theme.colors.textSecondary,
            fontSize: 16,
            marginTop: 16,
        }
    }), [theme]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kaydedilenler</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Bookmark size={48} color={theme.colors.textSecondary} />
                            <Text style={styles.emptyText}>Henüz kaydedilmiş gönderi yok.</Text>
                        </View>
                    }
                />
            )}

            {/* Re-using PostOptionsModal but we might need a custom menu for saved items or extend the existing one */}
            {/* Note: The existing PostOptionsModal usually has Delete/Report. For Saved screen, we specifically want 'Remove from Saved'. 
                 Pass a special prop or handle it differently. For now, let's use a custom small dialog or extend the modal later.
                 But actually, the user typically wants to see the SAME menu as Feed + "Remove from Saved".
                 For this MVP, I will just implement a simple action sheet or rely on the fact that toggle save is an option.
             */}

            {/* Re-using PostOptionsModal */}
            <PostOptionsModal
                visible={optionsVisible}
                onClose={() => setOptionsVisible(false)}
                // In Saved items, we usually just want to remove (toggle save) or maybe report.
                // Since this is a list of SAVED items, the 'isSaved' is implicitly true, but correct prop is good practice.
                onToggleSave={handleRemoveBookmark}
                isSaved={true}
                // Only show delete if owner, though strictly speaking you can't see others' saved posts here anyway.
                // But let's keep logic safe.
                isOwner={selectedPost?.user?.id === user?.id}
                onDelete={() => {
                    // Optional: Allow deleting your own post from here?
                    // For now let's just support Removing from Saved via the bookmark icon in modal.
                    // If user invokes delete, we might need a delete dialog too.
                    // Let's stick to simple "Remove from Saved" for now.
                    Toast.show({ type: 'info', text1: 'Bilgi', text2: 'Silmek için profilinizden işlem yapınız.' });
                }}
                targetPosition={menuPosition}
            />
        </View>
    );
};
