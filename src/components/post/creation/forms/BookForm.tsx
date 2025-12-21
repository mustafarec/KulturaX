import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Book, BookOpen, CheckCircle, Bookmark, Star } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';

import { Image } from 'react-native';
import { ContentSearch } from '../ContentSearch';

interface BookFormProps {
    title: string;
    setTitle: (text: string) => void;
    author: string;
    setAuthor: (text: string) => void;
    setContentId: (id: string) => void;
    imageUrl: string;
    setImageUrl: (url: string) => void;
    status: 'reading' | 'read' | 'want_to_read';
    setStatus: (status: 'reading' | 'read' | 'want_to_read') => void;
    rating: number;
    setRating: (rating: number) => void;
}

export const BookForm: React.FC<BookFormProps> = ({
    title, setTitle, author, setAuthor, setContentId, imageUrl, setImageUrl, status, setStatus, rating, setRating
}) => {
    const { theme } = useTheme();

    const handleRemoveBook = () => {
        setTitle('');
        setAuthor('');
        setContentId('');
        setImageUrl('');
        setStatus('reading'); // Reset status default
    };

    return (
        <View style={styles.container}>
            {/* Search or Selected Book Display */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, zIndex: 2000 }]}>
                {!title ? (
                    <View>
                        <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Kitap Ara</Text>
                        <ContentSearch
                            type="book"
                            placeholder="Kitabın adını yazın..."
                            onSelect={(item) => {
                                setTitle(item.volumeInfo?.title || '');
                                setAuthor(item.volumeInfo?.authors?.join(', ') || '');
                                setContentId(item.id);
                                setImageUrl(item.volumeInfo?.imageLinks?.thumbnail || '');
                            }}
                        />
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={styles.bookCoverContainer}>
                            {imageUrl ? (
                                <Image source={{ uri: imageUrl }} style={styles.bookCover} resizeMode="cover" />
                            ) : (
                                <View style={[styles.bookCover, { backgroundColor: theme.colors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Book size={32} color="#fff" />
                                </View>
                            )}
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 4 }}>{title}</Text>
                            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginBottom: 12 }}>{author}</Text>
                            <TouchableOpacity onPress={handleRemoveBook} style={styles.changeButton}>
                                <Text style={{ color: theme.colors.error, fontSize: 13, fontWeight: '600' }}>Kitabı Değiştir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Status Selection - Only visible if a book is selected */}
            {title ? (
                <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>Okuma Durumu</Text>
                    <View style={styles.statusGrid}>
                        <TouchableOpacity
                            onPress={() => setStatus('reading')}
                            style={[
                                styles.statusButton,
                                {
                                    borderColor: status === 'reading' ? '#10b981' : theme.colors.border,
                                    backgroundColor: status === 'reading' ? '#10b98115' : 'transparent',
                                }
                            ]}
                        >
                            <BookOpen size={20} color={status === 'reading' ? '#047857' : theme.colors.textSecondary} style={{ marginBottom: 4 }} />
                            <Text style={[styles.statusLabel, { color: status === 'reading' ? '#047857' : theme.colors.textSecondary }]}>
                                Okuyorum
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setStatus('read')}
                            style={[
                                styles.statusButton,
                                {
                                    borderColor: status === 'read' ? theme.colors.primary : theme.colors.border,
                                    backgroundColor: status === 'read' ? theme.colors.primary + '15' : 'transparent',
                                }
                            ]}
                        >
                            <CheckCircle size={20} color={status === 'read' ? theme.colors.primary : theme.colors.textSecondary} style={{ marginBottom: 4 }} />
                            <Text style={[styles.statusLabel, { color: status === 'read' ? theme.colors.primary : theme.colors.textSecondary }]}>
                                Okudum
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setStatus('want_to_read')}
                            style={[
                                styles.statusButton,
                                {
                                    borderColor: status === 'want_to_read' ? '#f59e0b' : theme.colors.border,
                                    backgroundColor: status === 'want_to_read' ? '#f59e0b15' : 'transparent',
                                }
                            ]}
                        >
                            <Bookmark size={20} color={status === 'want_to_read' ? '#b45309' : theme.colors.textSecondary} style={{ marginBottom: 4 }} />
                            <Text style={[styles.statusLabel, { color: status === 'want_to_read' ? '#b45309' : theme.colors.textSecondary }]}>
                                Okuyacağım
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Rating (Conditional) */}
                    {status === 'read' && (
                        <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                            <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>Puanınız</Text>
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
                        </View>
                    )}
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    section: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
    },
    bookCoverContainer: {
        width: 100,
        height: 150,
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    bookCover: {
        width: '100%',
        height: '100%',
    },
    changeButton: {
        paddingVertical: 6,
        paddingHorizontal: 0,
    },
    statusGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    statusButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
});
