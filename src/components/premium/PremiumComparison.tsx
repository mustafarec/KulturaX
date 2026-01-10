import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Check } from 'lucide-react-native';
import { getStyles } from '../styles/PremiumModal.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const PremiumComparison: React.FC = () => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(theme, insets);

    const comparisonItems = [
        { feature: 'Temel sosyal özellikler', free: true, premium: true },
        { feature: 'Premium rozet', free: false, premium: true },
        { feature: 'Öncelikli görünürlük', free: false, premium: true },
        { feature: 'Gelişmiş istatistikler', free: false, premium: true },
        { feature: 'Sınırsız okuma listeleri', free: false, premium: true },
        { feature: 'Özel temalar', free: false, premium: true },
        { feature: 'Öncelikli destek', free: false, premium: true },
    ];

    return (
        <View style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Ücretsiz vs Premium</Text>

            {/* Features Wrapper */}
            <View>
                {comparisonItems.map((item, index) => (
                    <View key={index} style={[styles.comparisonRow, index === comparisonItems.length - 1 && { borderBottomWidth: 0 }]}>
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
    );
};
