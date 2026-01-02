import React from 'react';
import { View, Text, TouchableOpacity, Pressable, Modal, StyleSheet } from 'react-native';
import Animated, { ZoomIn, FadeOut } from 'react-native-reanimated';
import { Reply, Pencil, Undo2, Copy, CheckSquare } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

const EMOJI_OPTIONS = ['❤️', '👍', '👎', '😂', '‼️', '❓', '😍', '🔥'];

interface ContextMenuProps {
    visible: boolean;
    onClose: () => void;
    selectedMessageContent: string;
    selectedMessageIsOwn: boolean;
    onEmojiSelect: (emoji: string) => void;
    onReply: () => void;
    onEdit: () => void;
    onUnsend: () => void;
    onCopy: () => void;
    theme: any;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    visible,
    onClose,
    selectedMessageContent,
    selectedMessageIsOwn,
    onEmojiSelect,
    onReply,
    onEdit,
    onUnsend,
    onCopy,
    theme
}) => {
    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        messagePreview: {
            maxWidth: '85%',
            padding: 14,
            borderRadius: 16,
            marginBottom: 20,
            ...theme.shadows.default,
        },
        messageText: {
            fontSize: 15,
            lineHeight: 22,
            fontFamily: theme.fonts.main,
        },
        emojiBar: {
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            paddingHorizontal: 12,
            paddingVertical: 12,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            width: '90%',
            maxWidth: 360,
            marginBottom: 12,
            ...theme.shadows.default,
        },
        actionsMenu: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            overflow: 'hidden',
            width: '70%',
            maxWidth: 280,
            ...theme.shadows.default,
        },
        actionItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
        },
        actionText: {
            marginLeft: 12,
            fontSize: 16,
            color: theme.colors.text,
            fontFamily: theme.fonts.main,
        }
    });

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={{
                flex: 1,
                backgroundColor: theme.dark ? 'rgba(0,0,0,0.7)' : 'rgba(128,128,128,0.6)',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <Pressable style={styles.overlay} onPress={onClose}>
                    {/* Message Preview */}
                    <Animated.View
                        entering={ZoomIn.duration(200)}
                        exiting={FadeOut.duration(150)}
                        style={[styles.messagePreview, {
                            backgroundColor: selectedMessageIsOwn ? theme.colors.primary : theme.colors.surface,
                        }]}
                    >
                        <Text style={[styles.messageText, {
                            color: selectedMessageIsOwn ? '#fff' : theme.colors.text
                        }]} numberOfLines={3}>
                            {selectedMessageContent}
                        </Text>
                    </Animated.View>

                    {/* Emoji Reaction Bar */}
                    <Animated.View
                        entering={ZoomIn.delay(50).duration(250).springify()}
                        exiting={FadeOut.duration(150)}
                        style={styles.emojiBar}
                    >
                        {EMOJI_OPTIONS.map((emoji, index) => (
                            <TouchableOpacity
                                key={index}
                                style={{ padding: 8, margin: 2 }}
                                onPress={() => onEmojiSelect(emoji)}
                            >
                                <Text style={{ fontSize: 28 }}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>

                    {/* Context Menu Actions */}
                    <Animated.View
                        entering={ZoomIn.delay(100).duration(250).springify()}
                        exiting={FadeOut.duration(150)}
                        style={styles.actionsMenu}
                    >
                        <TouchableOpacity style={styles.actionItem} onPress={onReply}>
                            <Reply size={20} color={theme.colors.text} />
                            <Text style={styles.actionText}>Yanıtla</Text>
                        </TouchableOpacity>

                        {selectedMessageIsOwn && (
                            <TouchableOpacity style={styles.actionItem} onPress={onEdit}>
                                <Pencil size={20} color={theme.colors.text} />
                                <Text style={styles.actionText}>Düzenle</Text>
                            </TouchableOpacity>
                        )}

                        {selectedMessageIsOwn && (
                            <TouchableOpacity style={styles.actionItem} onPress={onUnsend}>
                                <Undo2 size={20} color={theme.colors.text} />
                                <Text style={styles.actionText}>Gönderiyi Geri Al</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.actionItem} onPress={onCopy}>
                            <Copy size={20} color={theme.colors.text} />
                            <Text style={styles.actionText}>Kopyala</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionItem, { borderBottomWidth: 0 }]}
                            onPress={() => {
                                onClose();
                                Toast.show({ type: 'info', text1: 'Seç', text2: 'Bu özellik yakında eklenecek.' });
                            }}
                        >
                            <CheckSquare size={20} color={theme.colors.text} />
                            <Text style={styles.actionText}>Seç</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Pressable>
            </View>
        </Modal>
    );
};
