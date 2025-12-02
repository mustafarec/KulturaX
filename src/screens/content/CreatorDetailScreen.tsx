import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { theme } from '../../theme/theme';
import { tmdbApi } from '../../services/tmdbApi';
import { googleBooksApi } from '../../services/googleBooksApi';
import { useNavigation } from '@react-navigation/native';

export const CreatorDetailScreen = ({ route }: any) => {
    const { id, name, type } = route.params; // type: 'person' (TMDB) or 'author' (Google Books)
    const [details, setDetails] = useState<any>(null);
    const [works, setWorks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (type === 'person') {
                    const [personDetails, personCredits] = await Promise.all([
                        tmdbApi.getPersonDetails(id),
                        tmdbApi.getPersonCredits(id)
                    ]);
                    setDetails(personDetails);

                    // Sadece yönetmenlik veya oyunculuk yaptığı popüler işleri alalım
                    // Şimdilik cast (oyunculuk) ve crew (yönetmenlik) birleştirilebilir veya filtrelenebilir
                    // Basitlik için cast kullanıyoruz, yönetmen ise crew'den çekmek gerekebilir
                    // TMDB getPersonCredits cast ve crew döner.
                    // Bizim tmdbApi.getPersonCredits sadece cast dönüyor şu an, onu düzeltmemiz gerekebilir.
                    // Şimdilik cast varsayalım, ama yönetmen için crew lazım.
                    // API servisini güncellemeden önce burayı cast olarak bırakıyorum, sonra düzeltirim.

                    const formattedWorks = personCredits.map((work: any) => ({
                        id: work.id.toString(),
                        title: work.title,
                        image: work.poster_path ? `https://image.tmdb.org/t/p/w500${work.poster_path}` : null,
                        type: 'Film',
                        year: work.release_date ? work.release_date.split('-')[0] : ''
                    }));
                    setWorks(formattedWorks);

                } else if (type === 'author') {
                    // Google Books yazar araması
                    const books = await googleBooksApi.searchBooks(`inauthor:${name}`);
                    setDetails({ name: name, biography: 'Yazar hakkında bilgi bulunamadı.' }); // Google Books yazar biyografisi vermez

                    const formattedWorks = books.map((book: any) => ({
                        id: book.id,
                        title: book.volumeInfo.title,
                        image: book.volumeInfo.imageLinks?.thumbnail,
                        type: 'Kitap',
                        year: book.volumeInfo.publishedDate ? book.volumeInfo.publishedDate.split('-')[0] : ''
                    }));
                    setWorks(formattedWorks);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, name, type]);

    const handleWorkPress = (work: any) => {
        if (work.type === 'Film') {
            (navigation as any).push('MovieDetail', { movie: work });
        } else if (work.type === 'Kitap') {
            (navigation as any).push('BookDetail', { book: work });
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                {details?.profile_path ? (
                    <Image
                        source={{ uri: `https://image.tmdb.org/t/p/w500${details.profile_path}` }}
                        style={styles.profileImage}
                    />
                ) : (
                    <View style={[styles.profileImage, styles.placeholderImage]}>
                        <Text style={styles.placeholderText}>{name.charAt(0)}</Text>
                    </View>
                )}
                <Text style={styles.name}>{details?.name || name}</Text>
                {details?.birthday && <Text style={styles.info}>{details.birthday} {details.place_of_birth && `• ${details.place_of_birth}`}</Text>}
                {details?.biography && (
                    <Text style={styles.biography} numberOfLines={6}>{details.biography}</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Eserleri ({works.length})</Text>
                <View style={styles.worksGrid}>
                    {works.map((work, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.workCard}
                            onPress={() => handleWorkPress(work)}
                        >
                            {work.image ? (
                                <Image source={{ uri: work.image }} style={styles.workImage} />
                            ) : (
                                <View style={[styles.workImage, styles.placeholderWorkImage]} />
                            )}
                            <Text style={styles.workTitle} numberOfLines={2}>{work.title}</Text>
                            {work.year ? <Text style={styles.workYear}>{work.year}</Text> : null}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    placeholderImage: {
        backgroundColor: theme.colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 40,
        color: '#fff',
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    info: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 12,
    },
    biography: {
        fontSize: 14,
        color: theme.colors.text,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
    },
    worksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    workCard: {
        width: '31%',
        marginBottom: 16,
    },
    workImage: {
        width: '100%',
        aspectRatio: 2 / 3,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: theme.colors.surface,
    },
    placeholderWorkImage: {
        backgroundColor: theme.colors.secondary,
    },
    workTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 2,
    },
    workYear: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
});
