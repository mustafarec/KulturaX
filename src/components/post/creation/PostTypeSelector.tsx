import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MessageSquare, Pencil, BookOpen, Calendar } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { Card } from '../../ui/Card';

export type CreateTab = 'thought' | 'review' | 'book' | 'event';

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
    ];

    const { width } = Dimensions.get('window');
    const isSmallDevice = width < 380;

    // Dynamic Sizing
    const cardHeight = isSmallDevice ? 130 : 160;
    const padding = isSmallDevice ? 12 : 16;
    const iconSize = isSmallDevice ? 48 : 56;
    const iconInnerSize = isSmallDevice ? 20 : 24;
    const labelSize = isSmallDevice ? 13 : 15;
    const descSize = isSmallDevice ? 10 : 11;

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
                                height: cardHeight,
                                padding: padding
                            }
                        ]}>


                            <LinearGradient
                                colors={type.gradientColors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.iconBox, { width: iconSize, height: iconSize, borderRadius: iconSize / 2 }]}
                            >
                                {React.createElement(type.icon, { size: iconInnerSize, color: "#FFFFFF" })}
                            </LinearGradient>

                            <View style={styles.contentBox}>
                                <Text style={[styles.label, { color: theme.colors.text, fontSize: labelSize }]}>{type.label}</Text>
                                <Text style={[styles.description, { color: theme.colors.textSecondary, fontSize: descSize }]}>
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
        // Dimensions are now inline dynamic
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
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
