import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { tmdbApi } from '../../services/tmdbApi';
import { googleBooksApi } from '../../services/googleBooksApi';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export const CreatorDetailScreen = ({ route }: any) => {
    const { id, name, type } = route.params; // type: 'person' (TMDB) or 'author' (Google Books)
    const [details, setDetails] = useState<any>(null);
    const [works, setWorks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (type === 'person') {
                    const [personDetails, creditsData] = await Promise.all([
                        tmdbApi.getPersonDetails(id),
                        tmdbApi.getPersonCredits(id)
                    ]);
                    setDetails(personDetails);

                    // Cast ve Crew (Yönetmen) verilerini birleştir
                    const cast = creditsData.cast || [];
                    const crew = creditsData.crew || [];

                    // Sadece Yönetmen olanları al
                    const directed = crew.filter((c: any) => c.job === 'Director');

                    // Hepsini birleştir ve benzersiz yap
                    const allWorks = [...directed, ...cast];

                    // ID'ye göre unique yap
                    const uniqueWorksMap = new Map();
                    allWorks.forEach((work: any) => {
                        if (!uniqueWorksMap.has(work.id)) {
                            uniqueWorksMap.set(work.id, work);
                        }
                    });

                    const uniqueWorks = Array.from(uniqueWorksMap.values());

                    // Popülerliğe göre sorala (opsiyonel, genelde TMDB zaten sıralı verir ama garanti olsun)
                    uniqueWorks.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));

                    const formattedWorks = uniqueWorks.map((work: any) => ({
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

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
        },
        header: {
            alignItems: 'center',
            padding: 20,
            paddingTop: 60,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        backButton: {
            position: 'absolute',
            top: insets.top + 8,
            left: 20,
            zIndex: 10,
            padding: 8,
            backgroundColor: theme.colors.surface + 'CC',
            borderRadius: 20,
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
    }), [theme]);

    const handleWorkPress = (work: any) => {
        if (work.type === 'Film') {
            (navigation as any).push('MovieDetail', { movie: work });
        } else if (work.type === 'Kitap') {
            (navigation as any).push('BookDetail', { book: work });
        }
    };

    // Skeleton Loading Component
    const SkeletonLoading = () => {
        const opacity = React.useRef(new Animated.Value(0.3)).current;

        React.useEffect(() => {
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 0.7,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            animation.start();
            return () => animation.stop();
        }, [opacity]);

        const skeletonStyle = {
            backgroundColor: theme.colors.border,
            opacity: opacity,
        };

        return (
            <ScrollView style={styles.container}>
                <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    {/* Profile Image Skeleton */}
                    <Animated.View style={[styles.profileImage, skeletonStyle]} />
                    {/* Name Skeleton */}
                    <Animated.View style={[{ width: 180, height: 24, borderRadius: 8, marginBottom: 8 }, skeletonStyle]} />
                    {/* Info Skeleton */}
                    <Animated.View style={[{ width: 220, height: 14, borderRadius: 6, marginBottom: 12 }, skeletonStyle]} />
                    {/* Biography Skeleton */}
                    <Animated.View style={[{ width: '90%', height: 12, borderRadius: 4, marginBottom: 6 }, skeletonStyle]} />
                    <Animated.View style={[{ width: '80%', height: 12, borderRadius: 4, marginBottom: 6 }, skeletonStyle]} />
                    <Animated.View style={[{ width: '60%', height: 12, borderRadius: 4 }, skeletonStyle]} />
                </View>

                <View style={styles.section}>
                    {/* Section Title Skeleton */}
                    <Animated.View style={[{ width: 120, height: 18, borderRadius: 6, marginBottom: 16 }, skeletonStyle]} />
                    {/* Works Grid Skeleton */}
                    <View style={styles.worksGrid}>
                        {[1, 2, 3, 4, 5, 6].map((_, index) => (
                            <View key={index} style={styles.workCard}>
                                <Animated.View style={[styles.workImage, skeletonStyle]} />
                                <Animated.View style={[{ width: '80%', height: 12, borderRadius: 4, marginBottom: 4 }, skeletonStyle]} />
                                <Animated.View style={[{ width: '50%', height: 10, borderRadius: 4 }, skeletonStyle]} />
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        );
    };

    if (isLoading) {
        return <SkeletonLoading />;
    }

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
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


