import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Book, Film, Music, XCircle, Star } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';

import { ContentSearch } from '../ContentSearch';

interface ReviewFormProps {
    type: 'book' | 'film' | 'music';
    setType: (type: 'book' | 'film' | 'music') => void;
    title: string;
    setTitle: (title: string) => void;
    setContentId: (id: string) => void;
    setImageUrl: (url: string) => void;
    review: string;
    setReview: (review: string) => void;
    rating: number;
    setRating: (rating: number) => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
    type, setType, title, setTitle, setContentId, setImageUrl, review, setReview, rating, setRating
}) => {
    const { theme } = useTheme();

    const types = [
        { id: 'book', label: 'Kitap', icon: Book },
        { id: 'film', label: 'Film', icon: Film },
        { id: 'music', label: 'Müzik', icon: Music },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            <View style={styles.typeRow}>
                {types.map((t) => (
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
                        {React.createElement(t.icon, {
                            size: 16,
                            color: type === t.id ? theme.colors.primary : theme.colors.textSecondary
                        })}
                        <Text style={[
                            styles.typeLabel,
                            { color: type === t.id ? theme.colors.primary : theme.colors.textSecondary }
                        ]}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content Search */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, zIndex: 2000 }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                    {type === 'book' ? 'Kitap Ara' : type === 'film' ? 'Film Ara' : 'Müzik Ara'}
                </Text>

                {title ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 4 }}>
                        <Text style={{ fontSize: 16, color: theme.colors.text, fontWeight: '600' }}>{title}</Text>
                        <TouchableOpacity onPress={() => { setTitle(''); setContentId(''); setImageUrl(''); }}>
                            <XCircle size={20} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ContentSearch
                        type={type}
                        placeholder={type === 'book' ? 'Kitap adını giriniz...' : type === 'film' ? 'Film adını giriniz...' : 'Albüm/Sanatçı adını giriniz...'}
                        onSelect={(item) => {
                            let contentTitle = '';
                            let contentImage = '';
                            let cId = '';

                            if (type === 'book') {
                                contentTitle = item.volumeInfo?.title;
                                contentImage = item.volumeInfo?.imageLinks?.thumbnail;
                                cId = item.id;
                            } else if (type === 'film') {
                                contentTitle = item.title;
                                contentImage = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
                                cId = item.id.toString();
                            } else if (type === 'music') {
                                contentTitle = `${item.name} - ${item.artists?.[0]?.name}`;
                                contentImage = item.album?.images?.[0]?.url;
                                cId = item.id;
                            }

                            setTitle(contentTitle);
                            setContentId(cId);
                            setImageUrl(contentImage);
                        }}
                    />
                )}
            </View>

            {/* Rating */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>Puanınız</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                            <Star
                                size={32}
                                color={star <= rating ? "#f59e0b" : theme.colors.textSecondary}
                                fill={star <= rating ? "#f59e0b" : "transparent"}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Review Text */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>İncelemeniz</Text>
                <TextInput
                    value={review}
                    onChangeText={setReview}
                    placeholder="İncelemenizi yazın..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    style={[
                        styles.textArea,
                        {
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background
                        }
                    ]}
                    maxLength={1000}
                />
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'right' }}>
                    {review.length}/1000 karakter
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    typeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
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
    typeLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
        zIndex: 1,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
    },
    textInput: {
        height: 48,
        borderRadius: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        fontSize: 15,
    },
    textArea: {
        height: 150,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        textAlignVertical: 'top',
        fontSize: 15,
    },
});
