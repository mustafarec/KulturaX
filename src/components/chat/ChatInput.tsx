import React from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatInputProps {
    inputText: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    sending: boolean;
    replyToMessage: { id: number; content: string; username: string } | null;
    editingMessageId: number | null;
    onCancelReplyOrEdit: () => void;
    theme: any;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    inputText,
    onChangeText,
    onSend,
    sending,
    replyToMessage,
    editingMessageId,
    onCancelReplyOrEdit,
    theme
}) => {
    const insets = useSafeAreaInsets();

    // Bottom padding for safe area (navigation bar)
    // Android'de navigasyon çubuğu için daha fazla padding gerekli
    const bottomPadding = Platform.OS === 'android'
        ? Math.max(insets.bottom + 8, 24)
        : Math.max(insets.bottom, 12);

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: bottomPadding,
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        input: {
            flex: 1,
            backgroundColor: theme.colors.inputBackground,
            borderRadius: 24,
            paddingHorizontal: 20,
            paddingVertical: 12,
            maxHeight: 120,
            marginRight: 12,
            fontSize: 15,
            color: theme.colors.text,
            fontFamily: theme.fonts.main,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        sendButton: {
            backgroundColor: theme.colors.primary,
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.shadows.soft,
        },
        disabledButton: {
            backgroundColor: theme.colors.muted,
            opacity: 0.5,
        },
        replyBar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        }
    });

    return (
        <>
            {(replyToMessage || editingMessageId) && (
                <View style={styles.replyBar}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 2 }}>
                            {editingMessageId ? 'Mesaj Düzenleniyor' : `Yanıtlanan: ${replyToMessage?.username}`}
                        </Text>
                        <Text numberOfLines={1} style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                            {editingMessageId ? 'Düzenlemek için metni girin...' : replyToMessage?.content}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onCancelReplyOrEdit}>
                        <Text style={{ color: theme.colors.error, fontSize: 13, fontWeight: 'bold' }}>İptal</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={onChangeText}
                    placeholder="Mesaj..."
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !inputText.trim() && styles.disabledButton]}
                    onPress={onSend}
                    disabled={!inputText.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Send size={20} color={!inputText.trim() ? theme.colors.text : "#fff"} />
                    )}
                </TouchableOpacity>
            </View>
        </>
    );
};
