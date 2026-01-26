import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, BackHandler, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ArrowLeft, FileText, Tag, XCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { postService } from '../../services/backendApi';
import { draftService } from '../../services/DraftService';
import { ThemedDialog } from '../../components/ThemedDialog';
import { TopicSelectionModal } from '../../components/TopicSelectionModal';

export const CreateThoughtScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const draft = route.params?.draft;

    // State
    const [title, setTitle] = useState(draft?.data?.title || '');
    const [text, setText] = useState(draft?.data?.thoughtText || '');
    const [selectedTopic, setSelectedTopic] = useState<any>(draft?.data?.selectedTopic || null);
    const [topicModalVisible, setTopicModalVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);

    const hasUnsavedChanges = title.trim().length > 0 || text.trim().length > 0;

    useFocusEffect(
        useCallback(() => {
            const backAction = () => {
                if (hasUnsavedChanges) {
                    setDialogVisible(true);
                    return true;
                }
                return false;
            };

            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
            return () => backHandler.remove();
        }, [hasUnsavedChanges])
    );

    const handleClose = () => {
        if (hasUnsavedChanges) {
            setDialogVisible(true);
        } else {
            navigation.goBack();
        }
    };

    const handleSaveDraft = async () => {
        try {
            const draftData = { title, thoughtText: text, selectedTopic };
            if (draft) {
                await draftService.updateDraft(draft.id, draftData);
            } else {
                await draftService.saveDraft({ type: 'thought', data: draftData });
            }
            Toast.show({ type: 'info', text1: 'Taslak Kaydedildi' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Taslak kaydedilemedi.' });
        }
        setDialogVisible(false);
    };

    const handleSubmit = async () => {
        if (!text.trim()) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen düşüncenizi yazın.' });
            return;
        }
        if (!selectedTopic) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen bir konu seçin.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (!user) return;

            await postService.create(
                user.id,
                '', // quote
                text, // comment
                'Düşünce', // source
                user.username, // author
                title,
                undefined, // originalPostId
                'thought', // contentType
                undefined, // contentId
                undefined, // imageUrl
                Number(selectedTopic.id)
            );

            if (draft) {
                await draftService.deleteDraft(draft.id);
            }

            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'Paylaşım yapıldı.' });
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Paylaşım yapılamadı.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: insets.top + 10,
            paddingBottom: 16,
        },
        headerTitle: {
            fontSize: 20,
            fontFamily: theme.fonts.headings,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        backButton: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: theme.colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        scrollContent: {
            padding: 24,
            paddingBottom: 100,
        },
        // Preview Styles
        previewCard: {
            width: '100%',
            marginBottom: theme.spacing.m,
            borderBottomWidth: 0,
        },
        previewHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.s,
            paddingRight: 20,
        },
        userInfo: {
            flex: 1,
            marginLeft: theme.spacing.s,
        },
        name: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
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
        },
        dot: {
            marginHorizontal: 4,
            color: theme.colors.textSecondary,
            fontSize: 10,
        },
        time: {
            fontSize: 13,
            color: theme.colors.textSecondary,
        },
        topicBadgePreview: {
            backgroundColor: theme.colors.secondary + '30',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 12,
            marginLeft: 4,
        },
        topicBadgeTextPreview: {
            fontSize: 10,
            color: theme.colors.primary,
            fontWeight: '600',
        },
        previewContent: {
            fontSize: 15,
            lineHeight: 22,
            color: theme.colors.text,
            marginBottom: theme.spacing.m,
        },
        // Input Styles
        singleInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 56,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: 16,
            ...theme.shadows.soft,
        },
        singleInput: {
            flex: 1,
            fontSize: 15,
            color: theme.colors.text,
            marginLeft: 12,
        },
        textInputContainer: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            ...theme.shadows.soft,
        },
        textInput: {
            fontSize: 16,
            color: theme.colors.text,
            fontFamily: theme.fonts.main,
            minHeight: 150,
            textAlignVertical: 'top',
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.textSecondary,
            marginBottom: 8,
            marginTop: 24,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
    }), [theme, insets.top]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                    <ArrowLeft size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Düşünce Paylaş</Text>
                <View style={{ width: 80 }}>
                    <Button
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        size="sm"
                        disabled={!text.trim() || !selectedTopic}
                    >
                        Paylaş
                    </Button>
                </View>
            </View>

            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bottomOffset={20}
            >
                {/* Preview Card */}
                <View style={{ marginBottom: 24 }}>
                    <Card style={styles.previewCard} variant="default" padding="md">
                        <View style={styles.previewHeader}>
                            <Avatar
                                src={user?.avatar_url}
                                alt={user?.username || 'User'}
                                size="md"
                            />
                            <View style={styles.userInfo}>
                                <Text style={styles.name}>{user?.full_name || user?.username || 'Kullanıcı'}</Text>
                                <View style={styles.meta}>
                                    <Text style={styles.username}>@{user?.username || 'username'}</Text>
                                    <Text style={styles.dot}>•</Text>
                                    <Text style={styles.time}>Şimdi</Text>
                                    {selectedTopic && (
                                        <>
                                            <Text style={styles.dot}>•</Text>
                                            <View style={styles.topicBadgePreview}>
                                                <Text style={styles.topicBadgeTextPreview}>{selectedTopic.name.replace(/^#/, '')}</Text>
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>

                        {title.trim() ? (
                            <Text style={[styles.previewContent, { fontWeight: 'bold', marginBottom: 4, fontSize: 17 }]}>
                                {title}
                            </Text>
                        ) : null}

                        {text.trim() ? (
                            <Text style={styles.previewContent}>{text}</Text>
                        ) : (
                            <Text style={[styles.previewContent, { color: theme.colors.textSecondary, fontStyle: 'italic' }]}>
                                Düşüncelerin burada görünecek...
                            </Text>
                        )}
                    </Card>
                </View>

                {/* Title Input */}
                <View style={styles.singleInputContainer}>
                    <FileText size={18} color={theme.colors.primary} />
                    <TextInput
                        style={styles.singleInput}
                        placeholder="Yazı Başlığı (Opsiyonel)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                        maxLength={60}
                    />
                    {title.length > 0 && (
                        <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>{title.length}/60</Text>
                    )}
                </View>

                {/* Thought Input */}
                <View style={styles.textInputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Ne düşünüyorsun?"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={500}
                    />
                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary, textAlign: 'right', marginTop: 8 }}>
                        {text.length}/500
                    </Text>
                </View>

                {/* Topic Selector */}
                <TouchableOpacity
                    style={[styles.singleInputContainer, { marginTop: 24 }]}
                    onPress={() => setTopicModalVisible(true)}
                >
                    <Tag size={20} color={theme.colors.primary} />
                    <Text style={[styles.singleInput, { color: selectedTopic ? theme.colors.primary : theme.colors.textSecondary }]}>
                        {selectedTopic ? `#${selectedTopic.name}` : 'Konu Etiketi Seç *'}
                    </Text>
                    {selectedTopic && (
                        <TouchableOpacity onPress={() => setSelectedTopic(null)}>
                            <XCircle size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </KeyboardAwareScrollView>

            <TopicSelectionModal
                visible={topicModalVisible}
                onClose={() => setTopicModalVisible(false)}
                onSelect={setSelectedTopic}
            />

            <ThemedDialog
                visible={dialogVisible}
                title="Taslak Kaydedilsin mi?"
                message="Yaptığınız değişiklikleri taslak olarak kaydetmek ister misiniz?"
                onClose={() => setDialogVisible(false)}
                actions={[
                    { text: 'Kaydetme', onPress: () => { setDialogVisible(false); navigation.goBack(); }, style: 'cancel' },
                    { text: 'Kaydet', onPress: handleSaveDraft, style: 'default' },
                ]}
            />
        </View>
    );
};
