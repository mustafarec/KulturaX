import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Image, Animated, Keyboard, Platform, KeyboardAvoidingView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { X, Search, XCircle } from 'lucide-react-native';
import { userService, messageService } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

interface SharePostModalProps {
    visible: boolean;
    onClose: () => void;
    post: any;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({ visible, onClose, post }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sentUsers, setSentUsers] = useState<number[]>([]);

    // Selection & Comment State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [comment, setComment] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Animation
    const slideAnim = useRef(new Animated.Value(0)).current; // 0: hidden, 1: visible

    useEffect(() => {
        if (visible && user) {
            fetchUsers();
            resetState();
        } else {
            resetState();
        }
    }, [visible, user]);

    const resetState = () => {
        setSearchQuery('');
        setUsers([]);
        setSentUsers([]);
        setSelectedUser(null);
        setComment('');
        slideAnim.setValue(0);
    };

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                fetchUsers();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [searchQuery]);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: selectedUser ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [selectedUser]);

    const fetchUsers = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            if (searchQuery.trim().length > 0) {
                const results = await userService.search(searchQuery);
                setUsers(results.filter((u: any) => u.id !== user.id));
            } else {
                const connections = await userService.getConnections(user.id, 'following');
                setUsers(connections);
            }
        } catch (error) {
            console.error('Fetch users error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectUser = (user: any) => {
        setSelectedUser(user);
    };

    const handleCloseSelection = () => {
        setSelectedUser(null);
        setComment('');
        Keyboard.dismiss();
    };

    const handleSend = async () => {
        if (!user || !post || !selectedUser) return;

        setIsSending(true);
        try {
            const payload = {
                type: 'post_share',
                post: post,
                comment: comment.trim()
            };

            await messageService.send(user.id, selectedUser.id, JSON.stringify(payload));

            setSentUsers(prev => [...prev, selectedUser.id]);
            Toast.show({
                type: 'success',
                text1: 'Gönderildi',
                text2: `Mesaj ${selectedUser.username} kişisine iletildi.`
            });
            handleCloseSelection();
        } catch (error) {
            console.error('Send message error:', error);
            Toast.show({
                type: 'error',
                text1: 'Hata',
                text2: 'Mesaj gönderilemedi.'
            });
        } finally {
            setIsSending(false);
        }
    };

    const styles = React.useMemo(() => StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        container: {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: '85%', // Slightly taller to accommodate keyboard view well
            overflow: 'hidden',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        searchContainer: {
            padding: 20,
            paddingBottom: 10,
        },
        searchInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 44,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        searchInput: {
            flex: 1,
            marginLeft: 8,
            fontSize: 14,
            color: theme.colors.text,
            height: '100%',
        },
        list: {
            paddingHorizontal: 20,
            paddingBottom: 40, // Space for bottom sheet
        },
        userItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        userInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        avatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.secondary,
            marginRight: 12,
        },
        avatarPlaceholder: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        avatarText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 18,
        },
        userDetails: {
            flex: 1,
        },
        name: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.text,
        },
        username: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        selectButton: {
            backgroundColor: theme.colors.background,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.colors.primary,
        },
        selectButtonAccepted: {
            backgroundColor: 'transparent',
            borderColor: theme.colors.success || '#4CAF50',
            borderWidth: 0,
        },
        selectButtonText: {
            color: theme.colors.primary,
            fontWeight: '600',
            fontSize: 13,
        },
        sentText: {
            color: theme.colors.success || '#4CAF50',
            fontWeight: '600',
            fontSize: 13,
        },
        // Comment Input Sheet Styles
        commentSheet: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: Platform.OS === 'ios' ? 40 : 20,
            ...theme.shadows.default,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            zIndex: 100,
        },
        sheetHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        sheetTitle: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontWeight: '600',
        },
        commentInput: {
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            padding: 12,
            minHeight: 60,
            maxHeight: 120,
            borderWidth: 1,
            borderColor: theme.colors.primary, // Highlight focus
            color: theme.colors.text,
            marginBottom: 12,
            textAlignVertical: 'top',
        },
        sendButton: {
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        sendButtonText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
        },
        cancelButton: {
            padding: 4,
        },
        emptyText: {
            textAlign: 'center',
            marginTop: 40,
            color: theme.colors.textSecondary,
        },
    }), [theme]);

    const renderItem = ({ item }: { item: any }) => {
        const isSent = sentUsers.includes(item.id);

        return (
            <View style={styles.userItem}>
                <View style={styles.userInfo}>
                    {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {item.username ? item.username.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.userDetails}>
                        <Text style={styles.name}>{item.name} {item.surname}</Text>
                        <Text style={styles.username}>@{item.username}</Text>
                    </View>
                </View>

                {isSent ? (
                    <Text style={styles.sentText}>Gönderildi</Text>
                ) : (
                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => handleSelectUser(item)}
                    >
                        <Text style={styles.selectButtonText}>Seç</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const translateY = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0], // Move from bottom (300px down) to original position (0)
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.container}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Gönderiyi Paylaş</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <X size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Search size={20} color={theme.colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Kişi ara..."
                                placeholderTextColor={theme.colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={users}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.list}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>
                            }
                        />
                    )}

                    {/* Animated Comment Sheet */}
                    <Animated.View style={[styles.commentSheet, { transform: [{ translateY }] }]}>
                        {selectedUser && (
                            <>
                                <View style={styles.sheetHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.sheetTitle}>
                                            <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>@{selectedUser.username}</Text> ile paylaş
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={handleCloseSelection} style={styles.cancelButton}>
                                        <XCircle size={24} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    style={styles.commentInput}
                                    placeholder="Mesaj ekle... (İsteğe bağlı)"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                    autoFocus={true}
                                />

                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={handleSend}
                                    disabled={isSending}
                                >
                                    {isSending ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.sendButtonText}>Gönder</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};
