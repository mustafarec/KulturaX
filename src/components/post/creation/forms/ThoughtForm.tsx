import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Tag, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { topicService } from '../../../../services/backendApi';

interface ThoughtFormProps {
    text: string;
    setText: (text: string) => void;
    selectedTopic: string;
    setSelectedTopic: (topic: string) => void;
}

export const ThoughtForm: React.FC<ThoughtFormProps> = ({ text, setText, selectedTopic, setSelectedTopic }) => {
    const { theme } = useTheme();
    const [topics, setTopics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTopics();
    }, []);

    const loadTopics = async () => {
        try {
            const data = await topicService.getPopular();
            setTopics(data || []);
        } catch (error) {
            console.error('Failed to load topics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTopicStyle = (topicId: string, color: string = theme.colors.primary) => {
        const isSelected = selectedTopic === topicId;
        return {
            borderColor: isSelected ? color : theme.colors.border,
            backgroundColor: isSelected ? color + '15' : 'transparent',
            borderWidth: 1,
        };
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Topic Selector */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Tag size={14} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Konu Seçin *</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                    <View style={styles.topicGrid}>
                        {topics.map((topic) => (
                            <TouchableOpacity
                                key={topic.id}
                                onPress={() => setSelectedTopic(topic.id.toString())}
                                style={[
                                    styles.topicChip,
                                    getTopicStyle(topic.id.toString())
                                ]}
                            >
                                <MessageCircle
                                    size={14}
                                    color={selectedTopic === topic.id.toString() ? theme.colors.primary : theme.colors.textSecondary}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={{
                                    fontSize: 12,
                                    color: selectedTopic === topic.id.toString() ? theme.colors.primary : theme.colors.textSecondary,
                                    fontWeight: selectedTopic === topic.id.toString() ? '600' : '400'
                                }}>
                                    {topic.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {!selectedTopic && (
                    <Text style={{ fontSize: 11, color: '#d97706', marginTop: 8 }}>
                        Paylaşım yapmak için bir konu seçmelisiniz
                    </Text>
                )}
            </View>

            {/* Text Input */}
            <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, flex: 1 }]}>
                <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Düşüncelerinizi paylaşın</Text>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Ne düşünüyorsunuz?"
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                    style={[
                        styles.input,
                        {
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                            backgroundColor: theme.colors.background
                        }
                    ]}
                    maxLength={500}
                />
                <View style={styles.footer}>
                    <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                        {text.length}/500 karakter
                    </Text>

                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
    },
    section: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
    },
    topicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    topicChip: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '30%',
        flexGrow: 1,
    },
    input: {
        flex: 1,
        minHeight: 150, // Changed from fixed height to minHeight
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        textAlignVertical: 'top',
        fontSize: 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
});
