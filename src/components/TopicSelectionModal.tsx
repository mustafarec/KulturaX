import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { X, ChevronRight, Box, Music, Film, Book, Palette, Globe, Cpu, Gamepad2, Hash } from 'lucide-react-native';
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
    const slideAnim = useRef(new Animated.Value(500)).current;

    useEffect(() => {
        if (visible) {
            if (topics.length === 0) loadTopics();
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            slideAnim.setValue(500);
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

    const getTopicIcon = (iconName: string) => {
        switch (iconName) {
            case 'musical-notes': return Music;
            case 'film': return Film;
            case 'book': return Book;
            case 'easel': return Palette;
            case 'earth': return Globe;
            case 'hardware-chip': return Cpu;
            case 'game-controller': return Gamepad2;
            case 'cube-outline': return Box;
            default: return Hash;
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
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
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Konu Seç</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={topics}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => {
                                const TopicIcon = getTopicIcon(item.icon);
                                return (
                                    <TouchableOpacity
                                        style={styles.item}
                                        onPress={() => {
                                            onSelect(item);
                                            onClose();
                                        }}
                                    >
                                        <View style={styles.iconContainer}>
                                            <TopicIcon size={20} color={theme.colors.primary} />
                                        </View>
                                        <View style={styles.itemContent}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                                        </View>
                                        <ChevronRight size={20} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

