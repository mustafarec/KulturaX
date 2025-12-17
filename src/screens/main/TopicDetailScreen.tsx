import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { topicService } from '../../services/backendApi';
import { PostCard } from '../../components/PostCard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';

export const TopicDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const { user } = useAuth();

    // Check if params exists, if not handle gracefully or redirect
    const { topic } = route.params as { topic: any } || {};

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(topic?.is_followed || false);
    const [followerCount, setFollowerCount] = useState(topic?.follower_count || 0);

    // If topic is missing, go back
    useEffect(() => {
        if (!topic) {
            navigation.goBack();
        }
    }, [topic]);

    useEffect(() => {
        if (topic) {
            loadPosts();
        }
    }, [topic]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await topicService.getPostsByTopic(topic.id);
            setPosts(data.map((p: any) => ({ ...p, type: 'post' })));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!user) return;
        // Optimistic update
        const newStatus = !isFollowing;
        setIsFollowing(newStatus);
        setFollowerCount(prev => newStatus ? prev + 1 : prev - 1);

        try {
            await topicService.followTopic(topic.id);
        } catch (error) {
            // Revert
            setIsFollowing(!newStatus);
            setFollowerCount(prev => !newStatus ? prev + 1 : prev - 1);
        }
    };

    if (!topic) return null;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            padding: 24,
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
        },
        iconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.secondary + '20', // 20% opacity
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 8,
            textAlign: 'center',
        },
        description: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: 16,
            paddingHorizontal: 20,
        },
        stats: {
            flexDirection: 'row',
            gap: 16,
            marginBottom: 16,
        },
        statText: {
            color: theme.colors.textSecondary,
            fontSize: 13,
        },
        followButton: {
            backgroundColor: isFollowing ? theme.colors.surface : theme.colors.primary,
            paddingHorizontal: 32,
            paddingVertical: 10,
            borderRadius: 20,
            borderWidth: isFollowing ? 1 : 0,
            borderColor: theme.colors.border,
        },
        followButtonText: {
            color: isFollowing ? theme.colors.text : '#fff',
            fontWeight: '600',
        },
        backButton: {
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            padding: 8,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        }
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={topic.icon || 'cube-outline'} size={40} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.title}>{topic.name}</Text>
                        {topic.description && <Text style={styles.description}>{topic.description}</Text>}

                        <View style={styles.stats}>
                            <Text style={styles.statText}>{followerCount} takipçi</Text>
                            <Text style={styles.statText}>•</Text>
                            <Text style={styles.statText}>{topic.post_count} gönderi</Text>
                        </View>

                        <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
                            <Text style={styles.followButtonText}>{isFollowing ? 'Takip Ediliyor' : 'Takip Et'}</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onPress={() => (navigation as any).navigate('PostDetail', { postId: item.id })}
                        onUserPress={(userId) => (navigation as any).navigate('OtherProfile', { userId })}
                        currentUserId={user?.id}
                    />
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Text style={{ color: theme.colors.textSecondary }}>Henüz bu konuda paylaşım yok.</Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 20 }} color={theme.colors.primary} /> : null}
            />
        </View>
    );
};
