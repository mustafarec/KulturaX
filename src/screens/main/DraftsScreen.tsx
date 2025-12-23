import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { draftService, Draft } from '../../services/DraftService';
import { usePostHub } from '../../context/PostHubContext';
import { ArrowLeft, Trash2, FileText, Book, Music, Film, Calendar } from 'lucide-react-native';

export const DraftsScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { openModal } = usePostHub();
    const [drafts, setDrafts] = useState<Draft[]>([]);

    const loadDrafts = async () => {
        const loadedDrafts = await draftService.getDrafts();
        // Sort by newest first
        loadedDrafts.sort((a, b) => b.createdAt - a.createdAt);
        setDrafts(loadedDrafts);
    };

    useFocusEffect(
        useCallback(() => {
            loadDrafts();
        }, [])
    );

    const handleDelete = (id: string) => {
        Alert.alert(
            "Taslağı Sil",
            "Bu taslağı silmek istediğinize emin misiniz?",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: async () => {
                        await draftService.deleteDraft(id);
                        loadDrafts();
                    }
                }
            ]
        );
    };

    const handleOpenDraft = (draft: Draft) => {
        openModal(draft);
        // We might want to go back to feed, or stay here?
        // If we stay here, when modal closes (after post), we should probably reload listing?
        // But post creation usually stays on current screen or navigates.
        // If post succeeds, modal closes. We are still on DraftsScreen.
        // We probably want to refresh the list if the draft was deleted upon posting.
        // The modal logic deletes the draft on success.
        // So we just need to refresh the list when we regain focus (which happens if modal closes? No modal is over current screen).
        // If modal is separate, focus doesn't change?
        // Actually, if modal is just a View overlay, simple state change doesn't trigger focus effect.
        // But loadDrafts is cheap. We can listen to a global event or just refresh if possible.
        // Since we don't have a sophisticated event bus for "post_created", we might just need to rely on the user refreshing or
        // maybe openModal could take a callback? But openModal is from context.
        // Let's assume user manually navigates or swipes to refresh if needed, but optimally, we should update.
        // For now standard focus effect handles navigation back/forth.
        // But if modal closes, we are still here.
        // We can pass a callback to openModal?
        // No, openModal just takes data.
    };

    // Listen to modal close? We don't have that exposed easily in context yet. 
    // But since DraftsScreen is visible behind the modal, maybe we can poll or use interval? No.
    // Let's add a "onModalClose" callback to context? Too complex for now.
    // Simple workaround: Refresh button? Or Pull to Refresh.
    // Better: Add pull to refresh.

    const getIcon = (type: string) => {
        switch (type) {
            case 'thought': return <FileText size={24} color={theme.colors.primary} />;
            case 'book': return <Book size={24} color={theme.colors.primary} />;
            case 'review': return <Film size={24} color={theme.colors.primary} />; // Reuse Film for review generic, or specific logic
            case 'event': return <Calendar size={24} color={theme.colors.primary} />;
            default: return <FileText size={24} color={theme.colors.primary} />;
        }
    };

    const getTitle = (draft: Draft) => {
        const d = draft.data;
        switch (draft.type) {
            case 'thought': return d.thoughtText ? d.thoughtText.substring(0, 30) + (d.thoughtText.length > 30 ? '...' : '') : 'Düşünce';
            case 'review': return d.reviewTitle || 'İnceleme';
            case 'book': return d.bookTitle || 'Kitap';
            case 'event': return d.eventTitle || 'Etkinlik';
            default: return 'Taslak';
        }
    };

    const renderItem = ({ item }: { item: Draft }) => (
        <TouchableOpacity
            style={[styles.itemContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => handleOpenDraft(item)}
        >
            <View style={styles.iconContainer}>
                {getIcon(item.type)}
            </View>
            <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: theme.colors.text }]}>{getTitle(item)}</Text>
                <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                    {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                <Trash2 size={20} color={theme.colors.error} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.colors.border, paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Taslaklar</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={drafts}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Henüz kaydedilmiş bir taslak yok.</Text>
                    </View>
                }
                refreshing={false}
                onRefresh={loadDrafts}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        justifyContent: 'space-between'
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    iconContainer: {
        marginRight: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 16,
    }
});
