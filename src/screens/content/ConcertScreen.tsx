import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ticketmasterService } from '../../services/backendApi';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Event {
    id: string;
    name: string;
    dates: {
        start: {
            localDate: string;
            localTime: string;
        };
    };
    images: { url: string }[];
    _embedded?: {
        venues?: {
            name: string;
            city: { name: string };
        }[];
    };
    url: string;
}

export const ConcertScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [city, setCity] = useState('');

    const searchEvents = async () => {
        setLoading(true);
        try {
            const data = await ticketmasterService.searchEvents(keyword, city);
            if (data._embedded && data._embedded.events) {
                setEvents(data._embedded.events);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        searchEvents();
    }, []);

    const renderItem = ({ item }: { item: Event }) => {
        const image = item.images && item.images.length > 0 ? item.images[0].url : null;
        const venue = item._embedded?.venues?.[0];
        const date = item.dates.start.localDate;

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => Linking.openURL(item.url)}
            >
                {image && <Image source={{ uri: image }} style={styles.image} />}
                <View style={styles.info}>
                    <Text style={[styles.eventName, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.eventDate, { color: theme.colors.textSecondary }]}>{date}</Text>
                    {venue && (
                        <Text style={[styles.venue, { color: theme.colors.textSecondary }]}>
                            {venue.name}, {venue.city.name}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            flexDirection: 'row',
            alignItems: 'center',
        },
        backButton: {
            marginRight: 16,
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        searchContainer: {
            padding: 16,
        },
        input: {
            backgroundColor: theme.colors.surface,
            padding: 12,
            borderRadius: 8,
            marginBottom: 8,
            color: theme.colors.text,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        searchButton: {
            backgroundColor: theme.colors.primary,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
        },
        searchButtonText: {
            color: '#fff',
            fontWeight: 'bold',
        },
        list: {
            padding: 16,
        },
        card: {
            flexDirection: 'row',
            marginBottom: 16,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
        },
        image: {
            width: 100,
            height: 100,
        },
        info: {
            flex: 1,
            padding: 12,
            justifyContent: 'center',
        },
        eventName: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 4,
        },
        eventDate: {
            fontSize: 14,
            marginBottom: 2,
        },
        venue: {
            fontSize: 12,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Konserler</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Etkinlik ara..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={keyword}
                    onChangeText={setKeyword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Şehir..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={city}
                    onChangeText={setCity}
                />
                <TouchableOpacity style={styles.searchButton} onPress={searchEvents}>
                    <Text style={styles.searchButtonText}>Ara</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={events}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginTop: 20 }}>
                            Etkinlik bulunamadı.
                        </Text>
                    }
                />
            )}
        </View>
    );
};
