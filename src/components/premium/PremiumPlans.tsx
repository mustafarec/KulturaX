import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import { Check } from 'lucide-react-native';
import { getStyles } from '../styles/PremiumModal.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PremiumPlansProps {
    selectedPlan: 'monthly' | 'yearly';
    onSelectPlan: (plan: 'monthly' | 'yearly') => void;
}

export const PremiumPlans: React.FC<PremiumPlansProps> = ({ selectedPlan, onSelectPlan }) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(theme, insets);

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

    return (
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
                        onPress={() => onSelectPlan(plan.id as 'monthly' | 'yearly')}
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
    );
};
