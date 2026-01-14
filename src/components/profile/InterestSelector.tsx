import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Check } from 'lucide-react-native';

// Predefined interest categories
export const INTEREST_OPTIONS = [
    { id: 'music', label: 'Müzik', emoji: '🎵' },
    { id: 'cinema', label: 'Sinema', emoji: '🎬' },
    { id: 'theater', label: 'Tiyatro', emoji: '🎭' },
    { id: 'literature', label: 'Edebiyat', emoji: '📚' },
    { id: 'photography', label: 'Fotoğrafçılık', emoji: '📷' },
    { id: 'art', label: 'Sanat', emoji: '🎨' },
    { id: 'dance', label: 'Dans', emoji: '💃' },
    { id: 'sports', label: 'Spor', emoji: '⚽' },
    { id: 'travel', label: 'Seyahat', emoji: '✈️' },
    { id: 'food', label: 'Yemek', emoji: '🍕' },
    { id: 'technology', label: 'Teknoloji', emoji: '💻' },
    { id: 'gaming', label: 'Oyun', emoji: '🎮' },
    { id: 'nature', label: 'Doğa', emoji: '🌿' },
    { id: 'history', label: 'Tarih', emoji: '🏛️' },
    { id: 'science', label: 'Bilim', emoji: '🔬' },
];

interface InterestSelectorProps {
    selectedInterests: string[];
    onInterestsChange: (interests: string[]) => void;
    maxSelections?: number;
}

export const InterestSelector: React.FC<InterestSelectorProps> = ({
    selectedInterests,
    onInterestsChange,
    maxSelections = 10,
}) => {
    const { theme } = useTheme();

    const toggleInterest = (interestId: string) => {
        if (selectedInterests.includes(interestId)) {
            // Remove interest
            onInterestsChange(selectedInterests.filter(id => id !== interestId));
        } else {
            // Add interest (if under max)
            if (selectedInterests.length < maxSelections) {
                onInterestsChange([...selectedInterests, interestId]);
            }
        }
    };

    const styles = StyleSheet.create({
        container: {
            marginVertical: 8,
        },
        chipsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        chip: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
        },
        chipSelected: {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary + '15',
        },
        chipEmoji: {
            fontSize: 16,
            marginRight: 6,
        },
        chipLabel: {
            fontSize: 14,
            fontWeight: '500',
            color: theme.colors.text,
        },
        chipLabelSelected: {
            color: theme.colors.primary,
            fontWeight: '600',
        },
        checkIcon: {
            marginLeft: 6,
        },
        helperText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginTop: 8,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.chipsContainer}>
                {INTEREST_OPTIONS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.id);
                    return (
                        <TouchableOpacity
                            key={interest.id}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                            onPress={() => toggleInterest(interest.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.chipEmoji}>{interest.emoji}</Text>
                            <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                                {interest.label}
                            </Text>
                            {isSelected && (
                                <Check size={16} color={theme.colors.primary} style={styles.checkIcon} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Text style={styles.helperText}>
                {selectedInterests.length}/{maxSelections} seçildi
            </Text>
        </View>
    );
};

// Helper function to get label from interest ID
export const getInterestLabel = (interestId: string): string => {
    const interest = INTEREST_OPTIONS.find(i => i.id === interestId);
    return interest ? interest.label : interestId;
};

// Helper function to get emoji from interest ID
export const getInterestEmoji = (interestId: string): string => {
    const interest = INTEREST_OPTIONS.find(i => i.id === interestId);
    return interest ? interest.emoji : '';
};
