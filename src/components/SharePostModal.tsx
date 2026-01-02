import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Keyboard, Platform } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useTheme } from '../context/ThemeContext';
import { X, Search, XCircle, Send } from 'lucide-react-native';
import { userService, messageService } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SharePostModalProps {
    visible: boolean;
    onClose: () => void;
    post: any;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({ visible, onClose, post }) => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    // Keyboard animation
    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sentUsers, setSentUsers] = useState<number[]>([]);

    // Selection & Comment State
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [comment, setComment] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Animated style for comment sheet
    const commentSheetAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: keyboardHeight.value }],
        };
    });

    // Control visibility via ref
    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            fetchUsers();
        } else {
            bottomSheetRef.current?.dismiss();
            resetState();
        }
    }, [visible]);

    // Search debounce
    useEffect(() => {
        if (visible && searchQuery.trim().length > 0) {
            const timer = setTimeout(() => {
                fetchUsers();
            }, 500);
            return () => clearTimeout(timer);
        } else if (visible && searchQuery.trim().length === 0) {
            fetchUsers();
        }
    }, [searchQuery]);

    const resetState = () => {
        setSearchQuery('');
        setUsers([]);
        setSentUsers([]);
        setSelectedUser(null);
        setComment('');
    };

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

    const handleSelectUser = (userItem: any) => {
        setSelectedUser(userItem);
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

            await messageService.send(selectedUser.id, JSON.stringify(payload));

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

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
                pressBehavior="close"
            />
        ),
        []
    );

    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            onClose();
        }
    }, [onClose]);

    const styles = React.useMemo(() => StyleSheet.create({
        contentContainer: {
            flex: 1,
            backgroundColor: theme.colors.surface,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        title: {
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            fontFamily: theme.fonts.headings,
        },
        searchContainer: {
            paddingHorizontal: 20,
            paddingVertical: 12,
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
            fontFamily: theme.fonts.main,
        },
        list: {
            paddingHorizontal: 20,
            paddingBottom: 160, // Extra space for comment sheet
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
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.secondary,
            marginRight: 12,
        },
        avatarPlaceholder: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.primary,
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
            fontFamily: theme.fonts.main,
        },
        username: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.main,
        },
        selectButton: {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 20,
        },
        selectButtonText: {
            color: '#fff',
            fontWeight: '600',
            fontSize: 14,
            fontFamily: theme.fonts.main,
        },
        sentText: {
            color: theme.colors.success || '#4CAF50',
            fontWeight: '600',
            fontSize: 14,
            fontFamily: theme.fonts.main,
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
            padding: 16,
            paddingBottom: Math.max(insets.bottom + 16, 24),
            ...theme.shadows.default,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
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
            fontFamily: theme.fonts.main,
        },
        commentInputRow: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 12,
        },
        commentInput: {
            flex: 1,
            backgroundColor: theme.colors.background,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 12,
            minHeight: 44,
            maxHeight: 100,
            borderWidth: 1,
            borderColor: theme.colors.border,
            color: theme.colors.text,
            fontFamily: theme.fonts.main,
            fontSize: 15,
        },
        sendButton: {
            backgroundColor: theme.colors.primary,
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.soft,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 60,
        },
        emptyText: {
            textAlign: 'center',
            marginTop: 40,
            color: theme.colors.textSecondary,
            fontFamily: theme.fonts.main,
        },
    }), [theme, insets]);

    const renderItem = useCallback(({ item }: { item: any }) => {
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
                        <Text style={styles.name}>{item.name || item.username} {item.surname || ''}</Text>
                        <Text style={styles.username}>@{item.username}</Text>
                    </View>
                </View>

                {isSent ? (
                    <Text style={styles.sentText}>Gönderildi ✓</Text>
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
    }, [sentUsers, styles]);

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={['85%']}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            handleStyle={{
                backgroundColor: theme.colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
            }}
            handleIndicatorStyle={{
                backgroundColor: theme.colors.border,
                width: 40,
            }}
            backgroundStyle={{ backgroundColor: theme.colors.surface }}
            onChange={handleSheetChanges}
        >
            <BottomSheetView style={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Gönderiyi Paylaş</Text>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <X size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputContainer}>
                        <Search size={20} color={theme.colors.textSecondary} />
                        <BottomSheetTextInput
                            style={styles.searchInput}
                            placeholder="Kişi ara..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                {/* User List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <BottomSheetFlatList
                        data={users}
                        renderItem={renderItem}
                        keyExtractor={(item: any) => item.id.toString()}
                        contentContainerStyle={styles.list}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>
                        }
                    />
                )}

                {/* Comment Input Sheet - Animated with keyboard */}
                {selectedUser && (
                    <Animated.View style={[styles.commentSheet, commentSheetAnimatedStyle]}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>
                                <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>@{selectedUser.username}</Text> ile paylaş
                            </Text>
                            <TouchableOpacity onPress={handleCloseSelection}>
                                <XCircle size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.commentInputRow}>
                            <BottomSheetTextInput
                                style={styles.commentInput}
                                placeholder="Mesaj ekle... (İsteğe bağlı)"
                                placeholderTextColor={theme.colors.textSecondary}
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                autoFocus
                            />
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSend}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Send size={20} color="#fff" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                )}
            </BottomSheetView>
        </BottomSheetModal>
    );
};
