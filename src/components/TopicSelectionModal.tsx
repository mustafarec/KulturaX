import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { topicService } from '../services/backendApi';

interface TopicSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (topic: any) => void;
}

export const TopicSelectionModal: React.FC<TopicSelectionModalProps> = ({ visible, onClose, onSelect }) => {
    const { theme } = useTheme();
    const [topics, setTopics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible && topics.length === 0) {
            loadTopics();
        }
    }, [visible]);

    const loadTopics = async () => {
        setLoading(true);
        try {
            const data = await topicService.getPopular();
            setTopics(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: '70%',
            paddingTop: 20,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            paddingBottom: 16,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        closeButton: {
            padding: 4,
        },
        item: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 20,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
        },
        iconContainer: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.secondary + '20',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
        },
        itemContent: {
            flex: 1,
        },
        itemName: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: 4,
        },
        itemDesc: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        }
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Konu Seç</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={topics}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.item}
                                    onPress={() => {
                                        onSelect(item);
                                        onClose();
                                    }}
                                >
                                    <View style={styles.iconContainer}>
                                        <Ionicons name={item.icon || 'cube-outline'} size={20} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};
