import React, { useMemo, forwardRef } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getStyles } from '../styles/CommentModal.styles';
import { CommentReply } from '../../types/models';

interface CommentInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onSend: () => void;
    replyTo: CommentReply | null;
    onCancelReply: () => void;
}

export const CommentInput = forwardRef<TextInput, CommentInputProps>(({ value, onChangeText, onSend, replyTo, onCancelReply }, ref) => {
    const { theme } = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    return (
        <View style={styles.footer}>
            {replyTo && (
                <View style={styles.replyBar}>
                    <Text style={styles.replyText}>@{replyTo.username} kişisine yanıt veriliyor</Text>
                    <TouchableOpacity onPress={onCancelReply}>
                        <Text style={styles.cancelReply}>İptal</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.inputContainer}>
                <TextInput
                    ref={ref}
                    style={styles.input}
                    placeholder="Yorum yaz..."
                    placeholderTextColor="#95A5A6"
                    value={value}
                    onChangeText={onChangeText}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !value.trim() && styles.disabledButton]}
                    onPress={onSend}
                    disabled={!value.trim()}
                >
                    <Text style={styles.sendButtonText}>Gönder</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});
