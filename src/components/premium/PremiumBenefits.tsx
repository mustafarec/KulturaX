import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import { Crown, Sparkles, BookOpen, MessageCircle, TrendingUp, Eye } from 'lucide-react-native';
import { getStyles } from '../styles/PremiumModal.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const PremiumBenefits: React.FC = () => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(theme, insets);

    const benefits = [
        {
            icon: Crown,
            title: 'Premium Rozet',
            description: 'Profil ve gönderilerinizde emerald-teal gradient taç ikonu',
            colors: ['#10b981', '#14b8a6'], // emerald-500, teal-500
        },
        {
            icon: Eye,
            title: 'Öncelikli Görünürlük',
            description: 'Gönderileriniz daha fazla kişiye ulaşır',
            colors: ['#a855f7', '#ec4899'], // purple-500, pink-500
        },
        {
            icon: TrendingUp,
            title: 'Gelişmiş İstatistikler',
            description: 'Detaylı içerik analizi ve takipçi istatistikleri',
            colors: ['#3b82f6', '#06b6d4'], // blue-500, cyan-500
        },
        {
            icon: BookOpen,
            title: 'Sınırsız Okuma Listeleri',
            description: 'İstediğiniz kadar okuma listesi ve koleksiyon oluşturun',
            colors: ['#f59e0b', '#f97316'], // amber-500, orange-500
        },
        {
            icon: MessageCircle,
            title: 'Öncelikli Destek',
            description: '7/24 premium destek ekibimize erişim',
            colors: ['#ef4444', '#f97316'], // red-500, orange-500
        },
        {
            icon: Sparkles,
            title: 'Özel Temalar',
            description: 'Sadece premium üyelere özel renk temaları',
            colors: ['#6366f1', '#a855f7'], // indigo-500, purple-500
        },
    ];

    return (
        <View style={styles.sectionCard}>
            <View style={styles.benefitsHeader}>
                <Sparkles size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Premium Avantajlar</Text>
            </View>

            {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                    <LinearGradient
                        colors={benefit.colors}
                        style={styles.benefitIconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <benefit.icon size={24} color="white" />
                    </LinearGradient>
                    <View style={styles.benefitTextContainer}>
                        <Text style={styles.benefitTitle}>{benefit.title}</Text>
                        <Text style={styles.benefitDescription}>{benefit.description}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};
