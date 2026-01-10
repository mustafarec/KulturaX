import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Animated, Dimensions, Easing, Platform, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Crown, Check, Zap } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStyles } from './styles/PremiumModal.styles';

// Sub-components
import { PremiumBenefits } from './premium/PremiumBenefits';
import { PremiumPlans } from './premium/PremiumPlans';
import { PremiumComparison } from './premium/PremiumComparison';

const { height } = Dimensions.get('window');

interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ visible, onClose }) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

    const styles = getStyles(theme, insets);

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
                        <PremiumBenefits />

                        {/* Pricing Plans */}
                        <PremiumPlans selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} />

                        {/* Comparison Table */}
                        <PremiumComparison />

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
