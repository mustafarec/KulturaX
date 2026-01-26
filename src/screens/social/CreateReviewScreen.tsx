import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, BackHandler, TextInput, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ArrowLeft, Book, Film, Music, Star, Search, XCircle } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { reviewService } from '../../services/backendApi';
import { draftService } from '../../services/DraftService';
import { ThemedDialog } from '../../components/ThemedDialog';
import { ContentSearch } from '../../components/post/creation/ContentSearch';
import { ensureHttps } from '../../utils/urlUtils';

export const CreateReviewScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { theme } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const draft = route.params?.draft;

    // State
    const [type, setType] = useState<'book' | 'film' | 'music'>(draft?.data?.reviewType || 'book');
    const [postTitle, setPostTitle] = useState(draft?.data?.postTitle || '');
    const [title, setTitle] = useState(draft?.data?.reviewTitle || '');
    const [contentId, setContentId] = useState(draft?.data?.reviewContentId || '');
    const [imageUrl, setImageUrl] = useState(draft?.data?.reviewImage || '');
    const [review, setReview] = useState(draft?.data?.reviewText || '');
    const [rating, setRating] = useState(draft?.data?.reviewRating || 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);

    const hasUnsavedChanges = title.trim().length > 0 || review.trim().length > 0;

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
            const draftData = { reviewType: type, postTitle, reviewTitle: title, reviewContentId: contentId, reviewImage: imageUrl, reviewText: review, reviewRating: rating };
            if (draft) {
                await draftService.updateDraft(draft.id, draftData);
            } else {
                await draftService.saveDraft({ type: 'review', data: draftData });
            }
            Toast.show({ type: 'info', text1: 'Taslak Kaydedildi' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Taslak kaydedilemedi.' });
        }
        setDialogVisible(false);
    };

    const handleSubmit = async () => {
        if (!title || !review.trim()) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'Lütfen içerik seçin ve inceleme yazın.' });
            return;
        }

        setIsSubmitting(true);
        try {
            if (!user) return;

            await reviewService.addReview(
                user.id,
                type === 'film' ? 'movie' : type,
                contentId,
                rating,
                review,
                title,
                imageUrl,
                postTitle // Passing postTitle as new argument
            );

            if (draft) {
                await draftService.deleteDraft(draft.id);
            }

            Toast.show({ type: 'success', text1: 'Başarılı', text2: 'İnceleme paylaşıldı.' });
            navigation.goBack();
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İnceleme paylaşılamadı.' });
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
        previewContent: {
            fontSize: 15,
            lineHeight: 22,
            color: theme.colors.text,
            marginBottom: theme.spacing.m,
        },
        contentMiniCard: {
            flexDirection: 'row',
            backgroundColor: theme.colors.muted,
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
        },
        miniCover: {
            width: 40,
            height: 60,
            borderRadius: 4,
            backgroundColor: theme.colors.secondary + '20',
        },
        miniInfo: {
            flex: 1,
            marginLeft: 12,
            justifyContent: 'center',
        },
        miniTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        ratingRow: {
            flexDirection: 'row',
            marginTop: 4,
        },
        // Form Styles
        typeRow: {
            flexDirection: 'row',
            gap: 8,
            marginBottom: 20,
        },
        typeButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            gap: 8,
        },
        section: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: 16,
            ...theme.shadows.soft,
        },
        label: {
            fontSize: 13,
            fontWeight: 'bold',
            color: theme.colors.textSecondary,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        textArea: {
            fontSize: 16,
            color: theme.colors.text,
            minHeight: 120,
            textAlignVertical: 'top',
        },
        selectedContentHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
    }), [theme, insets.top]);

    const reviewTypes = [
        { id: 'book', label: 'Kitap', icon: Book },
        { id: 'film', label: 'Film', icon: Film },
        { id: 'music', label: 'Müzik', icon: Music },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                    <ArrowLeft size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>İnceleme Yaz</Text>
                <View style={{ width: 80 }}>
                    <Button
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        size="sm"
                        disabled={!title || !review.trim()}
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
                {/* Live Preview */}
                <View style={{ marginBottom: 24 }}>
                    <Card style={styles.previewCard} variant="default" padding="md">
                        <View style={styles.previewHeader}>
                            <Avatar src={user?.avatar_url} size="md" />
                            <View style={styles.userInfo}>
                                <Text style={styles.name}>{user?.full_name || user?.username || 'Kullanıcı'}</Text>
                                <Text style={{ fontSize: 13, color: theme.colors.textSecondary }}>Bir inceleme yazdı</Text>
                            </View>
                        </View>

                        {title ? (
                            <View style={styles.contentMiniCard}>
                                <Image
                                    source={{ uri: imageUrl || 'https://via.placeholder.com/60' }}
                                    style={styles.miniCover}
                                    resizeMode="cover"
                                />
                                <View style={styles.miniInfo}>
                                    <Text style={styles.miniTitle} numberOfLines={1}>{title}</Text>
                                    <View style={styles.ratingRow}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                size={14}
                                                color={s <= rating ? "#f59e0b" : theme.colors.textSecondary}
                                                fill={s <= rating ? "#f59e0b" : "transparent"}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={[styles.contentMiniCard, { backgroundColor: theme.colors.surface, borderWidth: 1, borderStyle: 'dashed' }]}>
                                <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>Henüz içerik seçilmedi...</Text>
                            </View>
                        )}

                        <Text style={styles.previewContent}>
                            {postTitle ? (
                                <Text style={{ fontWeight: 'bold' }}>{postTitle}{'\n'}</Text>
                            ) : null}
                            {review.trim() ? review : "İncelemen burada görünecek..."}
                        </Text>
                    </Card>
                </View>

                {/* Type Selector */}
                <View style={styles.typeRow}>
                    {reviewTypes.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            onPress={() => {
                                setType(t.id as any);
                                setTitle('');
                                setContentId('');
                                setImageUrl('');
                            }}
                            style={[
                                styles.typeButton,
                                {
                                    borderColor: type === t.id ? theme.colors.primary : theme.colors.border,
                                    backgroundColor: type === t.id ? theme.colors.primary + '15' : 'transparent',
                                }
                            ]}
                        >
                            <t.icon size={16} color={type === t.id ? theme.colors.primary : theme.colors.textSecondary} />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: type === t.id ? theme.colors.primary : theme.colors.textSecondary }}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Post Title */}
                <View style={styles.section}>
                    <Text style={styles.label}>İnceleme Başlığı</Text>
                    <TextInput
                        value={postTitle}
                        onChangeText={setPostTitle}
                        placeholder="Başlık Yazın (Opsiyonel)"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={{ fontSize: 16, color: theme.colors.text }}
                        maxLength={60}
                    />
                </View>

                {/* Content Search */}
                <View style={styles.section}>
                    <Text style={styles.label}>{type === 'book' ? 'Kitap Seç' : type === 'film' ? 'Film Seç' : 'Müzik Seç'}</Text>
                    {title ? (
                        <View style={styles.selectedContentHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                <Image source={{ uri: imageUrl }} style={{ width: 32, height: 48, borderRadius: 4, marginRight: 12 }} />
                                <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>{title}</Text>
                            </View>
                            <TouchableOpacity onPress={() => { setTitle(''); setContentId(''); setImageUrl(''); }}>
                                <XCircle size={22} color={theme.colors.error} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ContentSearch
                            type={type}
                            placeholder={type === 'book' ? 'Kitap adını giriniz...' : type === 'film' ? 'Film adını giriniz...' : 'Albüm/Sanatçı adını giriniz...'}
                            onSelect={(item) => {
                                if (type === 'book') {
                                    setTitle(item.volumeInfo?.title);
                                    setImageUrl(ensureHttps(item.volumeInfo?.imageLinks?.thumbnail));
                                    setContentId(item.id);
                                } else if (type === 'film') {
                                    setTitle(item.title);
                                    setImageUrl(ensureHttps(item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : ''));
                                    setContentId(item.id.toString());
                                } else if (type === 'music') {
                                    const musicTitle = item.title || item.name;
                                    const musicArtist = item.artist || item.artists?.[0]?.name;
                                    setTitle(musicTitle && musicArtist ? `${musicTitle} - ${musicArtist}` : musicTitle);
                                    setImageUrl(ensureHttps(item.image || item.album?.images?.[0]?.url));
                                    setContentId(item.id);
                                }
                            }}
                        />
                    )}
                </View>

                {/* Rating */}
                <View style={styles.section}>
                    <Text style={styles.label}>Puanın</Text>
                    <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Star
                                    size={36}
                                    color={star <= rating ? "#f59e0b" : theme.colors.textSecondary}
                                    fill={star <= rating ? "#f59e0b" : "transparent"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={{ textAlign: 'center', marginTop: 8, color: theme.colors.textSecondary, fontSize: 13, fontWeight: '500' }}>
                        {rating > 0 ? `${rating} / 5 Yıldız` : 'Lütfen puanlayın'}
                    </Text>
                </View>

                {/* Review Text */}
                <View style={styles.section}>
                    <Text style={styles.label}>İncelemen</Text>
                    <TextInput
                        value={review}
                        onChangeText={setReview}
                        placeholder="İncelemenizi buraya yazın..."
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                        style={styles.textArea}
                        maxLength={1000}
                    />
                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary, textAlign: 'right', marginTop: 8 }}>
                        {review.length}/1000
                    </Text>
                </View>
            </KeyboardAwareScrollView>

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
