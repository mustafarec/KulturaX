import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Dimensions, Easing, Platform, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Crown, Check, Sparkles, Zap, BookOpen, MessageCircle, TrendingUp, Eye } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');

interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ visible, onClose }) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

    // Animation states
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.in(Easing.cubic),
            }).start();
        }
    }, [visible]);

    const handleSubscribe = () => {
        Alert.alert('Bilgi', `${selectedPlan === 'monthly' ? 'Aylık' : 'Yıllık'} plan için ödeme sayfasına yönlendiriliyorsunuz...`);
    };

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

    const plans = [
        {
            id: 'monthly',
            name: 'Aylık',
            price: '₺49',
            period: '/ay',
            description: 'İstediğiniz zaman iptal edebilirsiniz',
            popular: false,
        },
        {
            id: 'yearly',
            name: 'Yıllık',
            price: '₺399',
            period: '/yıl',
            description: '2 ay bedava! (₺33/ay)',
            popular: true,
            savings: '%32 tasarruf',
        },
    ];

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingHorizontal: 20,
            paddingBottom: 20,
            paddingTop: insets.top + 10,
        },
        headerContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
        },
        backButton: {
            padding: 8,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 8,
        },
        headerTitle: {
            fontSize: 20,
            color: 'white',
            fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay-Regular' : 'PlayfairDisplay', // Assuming font exists, or fallback
            fontWeight: '600',
        },
        heroSection: {
            paddingHorizontal: 20,
            paddingBottom: 40,
            paddingTop: 10,
            alignItems: 'center',
        },
        heroIconContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255,255,255,0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.2)',
        },
        heroTitle: {
            fontSize: 28,
            color: 'white',
            fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay-Regular' : 'PlayfairDisplay',
            marginBottom: 12,
            textAlign: 'center',
        },
        heroDescription: {
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            lineHeight: 22,
            maxWidth: 300,
        },
        contentContainer: {
            flex: 1,
            backgroundColor: theme.colors.background,
            marginTop: -24,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 24,
            paddingHorizontal: 20,
        },
        sectionCard: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
        },
        benefitsHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: theme.colors.text,
            fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay-Regular' : 'PlayfairDisplay',
        },
        benefitItem: {
            flexDirection: 'row',
            marginBottom: 16,
            gap: 16,
        },
        benefitIconContainer: {
            width: 48,
            height: 48,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
        },
        benefitTextContainer: {
            flex: 1,
        },
        benefitTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 4,
        },
        benefitDescription: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            lineHeight: 18,
        },
        planButton: {
            backgroundColor: theme.colors.surface,
            borderWidth: 2,
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            position: 'relative',
        },
        selectedPlan: {
            borderColor: theme.colors.primary,
            backgroundColor: 'rgba(16, 185, 129, 0.05)', // light version of primary/emerald
        },
        unselectedPlan: {
            borderColor: theme.colors.border,
        },
        popularBadge: {
            position: 'absolute',
            top: -12,
            alignSelf: 'center',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
            zIndex: 1,
        },
        popularText: {
            color: 'white',
            fontSize: 12,
            fontWeight: '600',
        },
        planHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        planPriceContainer: {
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 4,
        },
        planPrice: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.primary,
            fontFamily: Platform.OS === 'ios' ? 'PlayfairDisplay-Regular' : 'PlayfairDisplay',
        },
        planPeriod: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        planName: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginTop: 4,
        },
        radioButton: {
            width: 28,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
        },
        planDescription: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        savingsBadge: {
            marginTop: 12,
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
        },
        savingsText: {
            color: '#10b981', // emerald-500
            fontSize: 12,
            fontWeight: '600',
        },
        comparisonRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        featureName: {
            flex: 1,
            fontSize: 14,
            color: theme.colors.text,
        },
        checkContainer: {
            flexDirection: 'row',
            width: 100,
            justifyContent: 'space-between',
        },
        checkColumn: {
            width: 40,
            alignItems: 'center',
        },
        comparisonHeader: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginBottom: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        trustBadges: {
            alignItems: 'center',
            marginVertical: 24,
            gap: 12,
        },
        trustCheckRow: {
            flexDirection: 'row',
            gap: 24,
        },
        trustItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        trustText: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.surface,
            padding: 20,
            paddingBottom: insets.bottom + 10,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        ctaButton: {
            borderRadius: 16,
            overflow: 'hidden',
        },
        ctaContent: {
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },
        ctaText: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
        },
        footerSubtext: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginTop: 12,
        },
    });

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View style={[
                styles.container,
                { transform: [{ translateY: slideAnim }] }
            ]}>
                <ScrollView contentContainerStyle={{ paddingBottom: 120 }} stickyHeaderIndices={[0]}>
                    <LinearGradient
                        colors={['#10b981', '#0d9488']} // emerald-500 to teal-600
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.header}>
                            <View style={styles.headerContent}>
                                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                                    <ArrowLeft size={24} color="white" />
                                </TouchableOpacity>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Crown size={24} color="#fcd34d" fill="#fcd34d" />
                                    <Text style={styles.headerTitle}>Premium Üyelik</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.heroSection}>
                            <View style={styles.heroIconContainer}>
                                <Crown size={40} color="#fcd34d" fill="#fcd34d" />
                            </View>
                            <Text style={styles.heroTitle}>Premium'a Geçin</Text>
                            <Text style={styles.heroDescription}>
                                Kültür ve sanat deneyiminizi bir üst seviyeye taşıyın. Özel ayrıcalıklardan yararlanın.
                            </Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.contentContainer}>
                        {/* Benefits Section */}
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

                        {/* Pricing Plans */}
                        <View style={{ marginBottom: 24 }}>
                            <Text style={[styles.sectionTitle, { textAlign: 'center', marginBottom: 16 }]}>
                                Planınızı Seçin
                            </Text>

                            {plans.map((plan) => {
                                const isSelected = selectedPlan === plan.id;
                                return (
                                    <TouchableOpacity
                                        key={plan.id}
                                        activeOpacity={0.9}
                                        onPress={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
                                        style={[
                                            styles.planButton,
                                            isSelected ? styles.selectedPlan : styles.unselectedPlan
                                        ]}
                                    >
                                        {plan.popular && (
                                            <LinearGradient
                                                colors={['#10b981', '#14b8a6']}
                                                style={styles.popularBadge}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            >
                                                <Text style={styles.popularText}>En Popüler</Text>
                                            </LinearGradient>
                                        )}

                                        <View style={styles.planHeader}>
                                            <View>
                                                <View style={styles.planPriceContainer}>
                                                    <Text style={styles.planPrice}>{plan.price}</Text>
                                                    <Text style={styles.planPeriod}>{plan.period}</Text>
                                                </View>
                                                <Text style={styles.planName}>{plan.name}</Text>
                                            </View>

                                            <View style={[
                                                styles.radioButton,
                                                { backgroundColor: isSelected ? theme.colors.primary : 'transparent', borderWidth: isSelected ? 0 : 2, borderColor: theme.colors.border }
                                            ]}>
                                                {isSelected && <Check size={16} color="white" />}
                                            </View>
                                        </View>

                                        <Text style={styles.planDescription}>{plan.description}</Text>

                                        {plan.savings && (
                                            <View style={styles.savingsBadge}>
                                                <Text style={styles.savingsText}>{plan.savings}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Comparison Table */}
                        <View style={styles.sectionCard}>
                            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Ücretsiz vs Premium</Text>

                            {/* Features Wrapper */}
                            <View>
                                {[
                                    { feature: 'Temel sosyal özellikler', free: true, premium: true },
                                    { feature: 'Premium rozet', free: false, premium: true },
                                    { feature: 'Öncelikli görünürlük', free: false, premium: true },
                                    { feature: 'Gelişmiş istatistikler', free: false, premium: true },
                                    { feature: 'Sınırsız okuma listeleri', free: false, premium: true },
                                    { feature: 'Özel temalar', free: false, premium: true },
                                    { feature: 'Öncelikli destek', free: false, premium: true },
                                ].map((item, index) => (
                                    <View key={index} style={[styles.comparisonRow, index === 6 && { borderBottomWidth: 0 }]}>
                                        <Text style={styles.featureName}>{item.feature}</Text>
                                        <View style={styles.checkContainer}>
                                            <View style={styles.checkColumn}>
                                                {item.free ? <Check size={16} color="#16a34a" /> : <Text style={{ color: theme.colors.textSecondary }}>-</Text>}
                                            </View>
                                            <View style={styles.checkColumn}>
                                                <Check size={16} color="#059669" />
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.comparisonHeader}>
                                <View style={styles.checkContainer}>
                                    <Text style={[styles.trustText, { width: 40, textAlign: 'center' }]}>Ücretsiz</Text>
                                    <Text style={[styles.trustText, { width: 40, textAlign: 'center' }]}>Premium</Text>
                                </View>
                            </View>
                        </View>

                        {/* Trust Badges */}
                        <View style={styles.trustBadges}>
                            <View style={styles.trustCheckRow}>
                                <View style={styles.trustItem}>
                                    <Check size={14} color="#16a34a" />
                                    <Text style={styles.trustText}>Güvenli ödeme</Text>
                                </View>
                                <View style={styles.trustItem}>
                                    <Check size={14} color="#16a34a" />
                                    <Text style={styles.trustText}>İstediğiniz zaman iptal</Text>
                                </View>
                            </View>
                            <Text style={[styles.trustText, { textAlign: 'center', maxWidth: 200 }]}>
                                İlk 7 gün ücretsiz deneme. İstediğiniz zaman iptal edebilirsiniz.
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Fixed Footer */}
                <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleSubscribe}
                        style={styles.ctaButton}
                    >
                        <LinearGradient
                            colors={['#10b981', '#0d9488']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaContent}
                        >
                            <Zap size={20} color="white" fill="white" />
                            <Text style={styles.ctaText}>Premium'a Başla - 7 Gün Ücretsiz</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.footerSubtext}>
                        {selectedPlan === 'monthly' ? '₺49/ay' : '₺399/yıl (₺33/ay)'}
                    </Text>
                </View>
            </Animated.View>
        </Modal>
    );
};
