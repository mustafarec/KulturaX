import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MessageSquare, Pencil, BookOpen, Calendar, Quote } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../ui/Card';

export type CreateTab = 'thought' | 'review' | 'book' | 'event' | 'quote';

interface PostTypeSelectorProps {
    onSelectType: (type: CreateTab) => void;
}

export const PostTypeSelector: React.FC<PostTypeSelectorProps> = ({ onSelectType }) => {
    const { theme } = useTheme();

    const contentTypes = [
        {
            id: 'thought' as CreateTab,
            label: 'Düşünce Paylaş',
            description: 'Fikirlerinizi hızlıca paylaşın',
            icon: MessageSquare,
            gradientColors: [theme.colors.primary, theme.colors.primary + 'CC'], // Primary to Primary/80
        },
        {
            id: 'review' as CreateTab,
            label: 'İnceleme Yaz',
            description: 'Kitap, film veya müzik inceleyin',
            icon: Pencil,
            gradientColors: [theme.colors.secondary, theme.colors.secondary + 'CC'],
        },
        {
            id: 'book' as CreateTab,
            label: 'Kitap Kaydet',
            description: 'Okuma listenize ekleyin',
            icon: BookOpen,
            gradientColors: ['#d97706', '#d97706CC'], // Amber-600
        },
        {
            id: 'event' as CreateTab,
            label: 'Etkinlik Ekle',
            description: 'Konser veya tiyatro kaydı',
            icon: Calendar,
            gradientColors: ['#059669', '#059669CC'], // Emerald-600
        },
        {
            id: 'quote' as CreateTab,
            label: 'Alıntı Ekle',
            description: 'Kitap, film veya müzikten alıntı',
            icon: Quote,
            gradientColors: ['#0ea5e9', '#0ea5e9CC'], // Sky-500
        },
    ];

    const { width, height } = Dimensions.get('window');

    // More comprehensive breakpoints
    const isVerySmallDevice = width < 340; // Very small phones
    const isSmallDevice = width < 380; // Small phones
    const isMediumDevice = width >= 380 && width < 420; // Medium phones
    // Large devices are >= 420

    // Dynamic Sizing based on screen width
    const getResponsiveSizes = () => {
        if (isVerySmallDevice) {
            return {
                cardHeight: 110,
                padding: 10,
                iconSize: 40,
                iconInnerSize: 18,
                labelSize: 12,
                descSize: 9,
                iconMarginBottom: 8,
            };
        } else if (isSmallDevice) {
            return {
                cardHeight: 125,
                padding: 12,
                iconSize: 46,
                iconInnerSize: 20,
                labelSize: 13,
                descSize: 10,
                iconMarginBottom: 10,
            };
        } else if (isMediumDevice) {
            return {
                cardHeight: 145,
                padding: 14,
                iconSize: 52,
                iconInnerSize: 22,
                labelSize: 14,
                descSize: 11,
                iconMarginBottom: 12,
            };
        } else {
            return {
                cardHeight: 160,
                padding: 16,
                iconSize: 56,
                iconInnerSize: 24,
                labelSize: 15,
                descSize: 11,
                iconMarginBottom: 12,
            };
        }
    };

    const sizes = getResponsiveSizes();

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {contentTypes.map((type) => (
                    <TouchableOpacity
                        key={type.id}
                        activeOpacity={0.9}
                        onPress={() => onSelectType(type.id)}
                        style={styles.gridItem}
                    >
                        {/* Custom Card Styling to ensure full fit */}
                        <View style={[
                            styles.card,
                            {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.border,
                                borderWidth: 1,
                                height: sizes.cardHeight,
                                padding: sizes.padding
                            }
                        ]}>


                            <LinearGradient
                                colors={type.gradientColors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.iconBox, { width: sizes.iconSize, height: sizes.iconSize, borderRadius: sizes.iconSize / 2, marginBottom: sizes.iconMarginBottom }]}
                            >
                                {React.createElement(type.icon, { size: sizes.iconInnerSize, color: "#FFFFFF" })}
                            </LinearGradient>

                            <View style={styles.contentBox}>
                                <Text style={[styles.label, { color: theme.colors.text, fontSize: sizes.labelSize }]}>{type.label}</Text>
                                <Text style={[styles.description, { color: theme.colors.textSecondary, fontSize: sizes.descSize }]}>
                                    {type.description}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        // gap removed to prevent layout shift on some devices
    },
    gridItem: {
        width: '48%',
        marginBottom: 12,
    },
    card: {
        // Padding and Height are now inline dynamic
        borderRadius: 24, // Match theme.borderRadius.l
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconBox: {
        // Dimensions and margins are now inline dynamic
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentBox: {
        alignItems: 'center',
    },
    label: {
        // Font size is now inline dynamic
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    description: {
        // Font size is now inline dynamic
        textAlign: 'center',
        lineHeight: 14,
    },
});
