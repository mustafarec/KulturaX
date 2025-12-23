import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { goalService } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';

export const ReadingGoalCard = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [goal, setGoal] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [targetInput, setTargetInput] = useState('');

    useEffect(() => {
        if (user) {
            fetchGoal();
        }
    }, [user]);

    const fetchGoal = async () => {
        try {
            const data = await goalService.getGoal(user!.id);
            setGoal(data);
            if (data) {
                setTargetInput(data.target_count.toString());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateGoal = async () => {
        const target = parseInt(targetInput);
        if (isNaN(target) || target <= 0) return;

        setIsLoading(true);
        try {
            await goalService.updateGoal(target);
            fetchGoal();
            setShowModal(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const percentage = goal ? Math.min(100, Math.round((goal.current_count / goal.target_count) * 100)) : 0;

    const styles = React.useMemo(() => StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            ...theme.shadows.soft,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        title: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        editButton: {
            fontSize: 14,
            color: theme.colors.primary,
            fontWeight: '600',
        },
        progressInfo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 8,
        },
        progressText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        currentCount: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        targetCount: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        percentage: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.primary,
        },
        progressBarContainer: {
            height: 8,
            backgroundColor: theme.colors.background,
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressBar: {
            height: '100%',
            backgroundColor: theme.colors.primary,
            borderRadius: 4,
        },
        emptyText: {
            color: theme.colors.textSecondary,
            fontStyle: 'italic',
            marginTop: 8,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 24,
            width: '80%',
            maxWidth: 320,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 8,
            textAlign: 'center',
        },
        modalSubtitle: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginBottom: 20,
            textAlign: 'center',
        },
        input: {
            backgroundColor: theme.colors.background,
            borderRadius: 8,
            padding: 12,
            fontSize: 18,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 20,
        },
        saveButton: {
            backgroundColor: theme.colors.primary,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
        },
        saveButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: 'bold',
        },
    }), [theme]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{new Date().getFullYear()} Okuma Hedefi</Text>
                <TouchableOpacity onPress={() => setShowModal(true)}>
                    <Text style={styles.editButton}>{goal ? 'Düzenle' : 'Hedef Belirle'}</Text>
                </TouchableOpacity>
            </View>

            {goal ? (
                <View>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>
                            <Text style={styles.currentCount}>{goal.current_count}</Text>
                            <Text style={styles.targetCount}> / {goal.target_count} Kitap</Text>
                        </Text>
                        <Text style={styles.percentage}>{percentage}%</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                    </View>
                </View>
            ) : (
                <Text style={styles.emptyText}>Henüz bir okuma hedefi belirlemediniz.</Text>
            )}

            <Modal
                visible={showModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Hedef Belirle</Text>
                        <Text style={styles.modalSubtitle}>Bu yıl kaç kitap okumak istiyorsun?</Text>

                        <TextInput
                            style={styles.input}
                            value={targetInput}
                            onChangeText={setTargetInput}
                            keyboardType="number-pad"
                            placeholder="Örn: 50"
                            placeholderTextColor={theme.colors.textSecondary}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleUpdateGoal}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Kaydet</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};
