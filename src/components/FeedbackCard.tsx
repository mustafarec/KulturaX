import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { X, XCircle, CheckCircle } from 'lucide-react-native';

interface FeedbackCardProps {
    onFeedback: (interested: boolean) => void;
    onDismiss: () => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ onFeedback, onDismiss }) => {
    const { theme } = useTheme();
    const [fadeAnim] = useState(new Animated.Value(1));

    const handlePress = (interested: boolean) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onFeedback(interested);
        });
    };

    const handleClose = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onDismiss();
        });
    };

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface,
            marginHorizontal: 16,
            marginVertical: 8,
            borderRadius: 12, // Slightly less rounded than posts
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: theme.shadows.default.shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        closeButton: {
            padding: 4,
        },
        actionsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
        },
        button: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        buttonText: {
            marginLeft: 8,
            fontSize: 14,
            fontWeight: '500',
            color: theme.colors.text,
        },
        interestedButton: {
            backgroundColor: theme.colors.surface,
        },
        notInterestedButton: {
            backgroundColor: theme.colors.surface,
        }
    }), [theme]);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Bu gönderi ilginizi çekiyor mu?</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <X size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.notInterestedButton]}
                    onPress={() => handlePress(false)}
                    activeOpacity={0.7}
                >
                    <XCircle size={16} color={theme.colors.error} />
                    <Text style={styles.buttonText}>İlgimi çekmiyor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.interestedButton]}
                    onPress={() => handlePress(true)}
                    activeOpacity={0.7}
                >
                    <CheckCircle size={16} color={theme.colors.success || '#4CAF50'} />
                    <Text style={styles.buttonText}>İlgimi çekiyor</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};
