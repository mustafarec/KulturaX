import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface PasswordStrengthIndicatorProps {
    password: string;
}

interface StrengthResult {
    score: number;
    label: string;
    color: string;
}

const getPasswordStrength = (password: string, colors: any): StrengthResult => {
    if (!password) {
        return { score: 0, label: '', color: colors.border };
    }

    let score = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    if (score <= 2) {
        return { score, label: 'Zayıf', color: colors.error };
    } else if (score <= 3) {
        return { score, label: 'Orta', color: colors.warning };
    } else {
        return { score, label: 'Güçlü', color: colors.success };
    }
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
    const { theme } = useTheme();
    const strength = getPasswordStrength(password, theme.colors);

    const styles = StyleSheet.create({
        container: {
            marginTop: 4,
            marginBottom: 8,
        },
        barContainer: {
            flexDirection: 'row',
            gap: 4,
            marginBottom: 4,
        },
        bar: {
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.colors.border,
        },
        barFilled: {
            backgroundColor: strength.color,
        },
        label: {
            fontSize: 12,
            color: strength.color,
            fontWeight: '500',
        },
        hint: {
            fontSize: 11,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
    });

    if (!password) return null;

    return (
        <View style={styles.container}>
            <View style={styles.barContainer}>
                {[1, 2, 3, 4, 5].map((level) => (
                    <View
                        key={level}
                        style={[
                            styles.bar,
                            level <= strength.score && styles.barFilled,
                        ]}
                    />
                ))}
            </View>
            <Text style={styles.label}>{strength.label}</Text>
            {strength.score < 4 && (
                <Text style={styles.hint}>
                    Büyük harf, rakam ve özel karakter kullanın
                </Text>
            )}
        </View>
    );
};
