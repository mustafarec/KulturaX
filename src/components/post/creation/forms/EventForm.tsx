import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Music, Users, XCircle, MapPin, Calendar, Star } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';

import { ContentSearch } from '../ContentSearch';

interface EventFormProps {
    type: 'concert' | 'theater';
    setType: (type: 'concert' | 'theater') => void;
    title: string;
    setTitle: (text: string) => void;
    setContentId: (id: string) => void;
    setImageUrl: (url: string) => void;
    location: string;
    setLocation: (text: string) => void;
    date: string;
    setDate: (text: string) => void;
    notes: string;
    setNotes: (text: string) => void;
    rating: number;
    setRating: (rating: number) => void;
}

export const EventForm: React.FC<EventFormProps> = ({
    type, setType, title, setTitle, setContentId, setImageUrl, location, setLocation, date, setDate, notes, setNotes, rating, setRating
}) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            {/* Type Selector */}
            <View style={styles.typeRow}>
                <TouchableOpacity
                    onPress={() => setType('concert')}
                    style={[
                        styles.typeButton,
                        {
                            borderColor: type === 'concert' ? '#8b5cf6' : theme.colors.border,
                            backgroundColor: type === 'concert' ? '#8b5cf615' : 'transparent',
                        }
                    ]}
                >
                    <Music
                        size={16}
                        color={type === 'concert' ? '#7c3aed' : theme.colors.textSecondary} // Purple
                    />
                    <Text style={[styles.typeLabel, { color: type === 'concert' ? '#7c3aed' : theme.colors.textSecondary }]}>
                        Konser
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setType('theater')}
                    style={[
                        styles.typeButton,
                        {
                            borderColor: type === 'theater' ? '#10b981' : theme.colors.border,
                            backgroundColor: type === 'theater' ? '#10b98115' : 'transparent',
                        }
                    ]}
                >
                    <Users
                        size={16}
                        color={type === 'theater' ? '#047857' : theme.colors.textSecondary} // Emerald
                    />
                    <Text style={[styles.typeLabel, { color: type === 'theater' ? '#047857' : theme.colors.textSecondary }]}>
                        Tiyatro
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Title */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, zIndex: 2000 }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                    {type === 'concert' ? 'Sanatçı/Konser Adı *' : 'Oyun/Tiyatro Adı *'}
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
                        placeholder={type === 'concert' ? 'Örn: Radiohead' : 'Örn: Hamlet'}
                        onSelect={(item) => {
                            setTitle(item.name || '');
                            setContentId(item.id);
                            setImageUrl(item.images?.[0]?.url || '');
                            // Auto fill date/venue if available
                            if (item.dates?.start?.localDate) {
                                // Simple format YYYY-MM-DD -> DD.MM.YYYY
                                const parts = item.dates.start.localDate.split('-');
                                if (parts.length === 3) setDate(`${parts[2]}.${parts[1]}.${parts[0]}`);
                            }
                            if (item._embedded?.venues?.[0]?.name) {
                                setLocation(item._embedded.venues[0].name);
                            }
                        }}
                    />
                )}
            </View>

            {/* Location */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Mekan</Text>
                <View style={{ justifyContent: 'center' }}>
                    <MapPin size={18} color={theme.colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Örn: Zorlu PSM"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={[
                            styles.textInput,
                            {
                                paddingLeft: 36,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.background
                            }
                        ]}
                    />
                </View>
            </View>

            {/* Date */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Tarih</Text>
                <View style={{ justifyContent: 'center' }}>
                    <Calendar size={18} color={theme.colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                        value={date}
                        onChangeText={setDate}
                        placeholder="GG.AA.YYYY"
                        placeholderTextColor={theme.colors.textSecondary}
                        style={[
                            styles.textInput,
                            {
                                paddingLeft: 36,
                                color: theme.colors.text,
                                borderColor: theme.colors.border,
                                backgroundColor: theme.colors.background
                            }
                        ]}
                    />
                </View>
            </View>

            {/* Notes */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Notlar</Text>
                <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Deneyiminizi paylaşın..."
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
                    maxLength={500}
                />
                <Text style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'right' }}>
                    {notes.length}/500 karakter
                </Text>
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
        </View>
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
    inputIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    textArea: {
        height: 120,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        textAlignVertical: 'top',
        fontSize: 15,
    },
});
