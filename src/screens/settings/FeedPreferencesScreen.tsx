import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Trash2, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { interactionService } from '../../services/backendApi';

interface Preference {
    id: number;
    type: 'report' | 'not_interested' | 'show_more';
    created_at: string;
    post_id: number;
    content_preview: string;
    content_type: 'book' | 'movie' | 'music';
    username: string;
    full_name: string;
    image_url?: string;
}

export const FeedPreferencesScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'hidden' | 'prioritized'>('hidden');

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const data = await interactionService.getFeedPreferences();
            setPreferences(data);
        } catch (error) {
            console.error(error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Tercihler yüklenemedi.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        Alert.alert(
            "Emin misiniz?",
            "Bu tercihi kaldırmak istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Kaldır",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await interactionService.deleteFeedPreference(id);
                            setPreferences(prev => prev.filter(p => p.id !== id));
                            Toast.show({
                                type: 'success',
                                text1: 'Başarılı',
                                text2: 'Tercih kaldırıldı.',
                            });
                        } catch (error) {
                            Toast.show({
                                type: 'error',
                                text1: 'Hata',
                                text2: 'İşlem başarısız.',
                            });
                        }
                    }
                }
            ]
        );
    };

    const filteredPreferences = preferences.filter(p => {
        if (activeTab === 'hidden') {
            return p.type === 'report' || p.type === 'not_interested';
        } else {
            return p.type === 'show_more';
        }
    });

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingTop: insets.top + 10,
            paddingBottom: 16,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
        },
        backButton: {
            marginRight: 16,
        },
        title: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        tabs: {
            flexDirection: 'row',
            padding: 16,
            backgroundColor: theme.colors.background,
        },
        tab: {
            flex: 1,
            paddingVertical: 8,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        activeTab: {
            borderBottomColor: theme.colors.primary,
        },
        tabText: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        activeTabText: {
            color: theme.colors.primary,
        },
        list: {
            padding: 16,
        },
        card: {
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
        },
        typeBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: theme.colors.background,
        },
        typeText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            fontWeight: '600',
        },
        postContent: {
            fontSize: 14,
            color: theme.colors.text,
            marginBottom: 12,
            lineHeight: 20,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingTop: 8,
        },
        userInfo: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        username: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        deleteButton: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        deleteText: {
            color: theme.colors.error,
            fontSize: 12,
            fontWeight: '600',
            marginLeft: 4,
        },
        emptyState: {
            alignItems: 'center',
            marginTop: 50,
        },
        emptyText: {
            color: theme.colors.textSecondary,
            fontSize: 16,
        },
    });

    const renderItem = ({ item }: { item: Preference }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>
                        {item.type === 'report' ? 'Bildirilen' :
                            item.type === 'not_interested' ? 'İlgilenmiyorum' : 'Daha Çok Göster'}
                    </Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                    {new Date(item.created_at).toLocaleDateString('tr-TR')}
                </Text>
            </View>

            <Text style={styles.postContent}>
                {item.content_preview || "İçerik önizlemesi yok"}
            </Text>

            <View style={styles.footer}>
                <Text style={styles.username}>@{item.username}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Trash2 size={16} color={theme.colors.error} />
                    <Text style={styles.deleteText}>Kaldır</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Akış Tercihleri</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'hidden' && styles.activeTab]}
                    onPress={() => setActiveTab('hidden')}
                >
                    <Text style={[styles.tabText, activeTab === 'hidden' && styles.activeTabText]}>
                        Gizlenenler
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'prioritized' && styles.activeTab]}
                    onPress={() => setActiveTab('prioritized')}
                >
                    <Text style={[styles.tabText, activeTab === 'prioritized' && styles.activeTabText]}>
                        Öncelikliler
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredPreferences}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Bu kategoride tercih bulunamadı.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};
