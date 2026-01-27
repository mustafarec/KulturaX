import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, ActivityIndicator, Image, NativeModules, TextInput } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { messageService } from '../../services/backendApi';
import { ArrowLeft, ChevronRight, Search, ChevronUp, ChevronDown, X } from 'lucide-react-native';

// Native module for Android notification suppression
const { ChatPrefs } = NativeModules;

// Chat components
import { MessageBubble, ChatInput, ContextMenu, TypingIndicator } from '../../components/chat';
import { createChatStyles } from '../../components/chat/chatStyles';

// Hooks
import { useMessages, useTypingIndicator as useTyping, useMessageActions } from '../../hooks/chat';

interface Message {
    id: number;
    _internalId?: string;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    is_read?: number | boolean;
    reactions?: { user_id: number; emoji: string; username: string }[];
    reply_to?: { id: number; username: string; content: string } | null;
}

export const ChatDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { otherUserId, username: initialUsername, avatarUrl: initialAvatarUrl, isRequest: initialIsRequest, unreadCount: initialUnreadCount } = route.params as {
        otherUserId: number; username?: string; avatarUrl?: string; isRequest?: boolean; unreadCount?: number
    };

    const { user } = useAuth();
    const { markAsRead, setCurrentChatUserId, dismissNotifications } = useMessage();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    // Styles
    const styles = useMemo(() => createChatStyles(theme, insets), [theme, insets]);

    // State
    const [isRequest, setIsRequest] = useState(initialIsRequest || false);
    const [hasViewedMessages, setHasViewedMessages] = useState(false);

    // Search State
    const [isSearching, setIsSearching] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchMatches, setSearchMatches] = useState<number[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const searchInputRef = useRef<any>(null);

    // Track current chat for notification suppression and clear status bar notifications
    useEffect(() => {
        setCurrentChatUserId(otherUserId);

        // Set active chat ID for Android native notification suppression
        if (Platform.OS === 'android' && ChatPrefs?.setActiveChatUserId) {
            ChatPrefs.setActiveChatUserId(String(otherUserId));
        }

        dismissNotifications(); // Clear existing notifications when entering chat

        return () => {
            setCurrentChatUserId(null);
            // Clear active chat ID when leaving
            if (Platform.OS === 'android' && ChatPrefs?.clearActiveChatUserId) {
                ChatPrefs.clearActiveChatUserId();
            }
        };
    }, [otherUserId, setCurrentChatUserId, dismissNotifications]);

    // Mark messages as viewed after initial render - hides unread divider
    useEffect(() => {
        const timer = setTimeout(() => {
            setHasViewedMessages(true);
        }, 2000); // Hide divider after 2 seconds
        return () => clearTimeout(timer);
    }, []);

    // Custom Hooks
    const { messages, setMessages, isLoading, chatUser, fetchMessages, addOptimisticMessage, removeOptimisticMessage, updateOptimisticMessage, loadMoreMessages, isMoreLoading, hasMore } = useMessages({
        userId: user?.id,
        otherUserId,
        initialUsername,
        initialAvatarUrl,
        markAsRead
    });

    const { isTyping, sendTypingIndicator } = useTyping({ otherUserId });

    const {
        inputText, setInputText, sending, newMessageId,
        editingMessageId, replyToMessage,
        selectedMessageContent, selectedMessageIsOwn, showContextMenu,
        handleSend, handleLongPress, handleEmojiSelect, handleCopy,
        handleUnsend, handleEdit, handleReply, handleReplyFromSwipe,
        closeContextMenu, cancelEditOrReply
    } = useMessageActions({
        otherUserId,
        fetchMessages,
        addOptimisticMessage,
        removeOptimisticMessage,
        updateOptimisticMessage,
        userId: user?.id,
        chatUsername: chatUser?.username || 'Kullanıcı'
    });



    // Handle input change with typing indicator
    const onInputChange = useCallback((text: string) => {
        setInputText(text);
        if (text.trim()) sendTypingIndicator();
    }, [setInputText, sendTypingIndicator]);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    // Accept/Decline request handlers
    const handleAccept = async () => {
        if (!user) return;
        try {
            await messageService.acceptRequest(user.id, otherUserId);
            setIsRequest(false);
            Toast.show({ type: 'success', text1: 'İstek kabul edildi' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İstek kabul edilemedi.' });
        }
    };

    const handleDecline = async () => {
        if (!user) return;
        try {
            await messageService.declineRequest(user.id, otherUserId);
            navigation.goBack();
            Toast.show({ type: 'success', text1: 'İstek reddedildi' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Hata', text2: 'İstek reddedilemedi.' });
        }
    };

    // Date helpers
    const parseDate = (dateStr: string): Date => {
        if (!dateStr) return new Date();

        // Handle ISO format
        if (dateStr.includes('T')) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d;
        }

        // Handle SQL format YYYY-MM-DD HH:mm:ss
        try {
            const [datePart, timePart] = dateStr.split(' ');
            if (!datePart) return new Date();

            const [yStr, mStr, dStr] = datePart.split('-');
            const year = parseInt(yStr, 10);
            const month = parseInt(mStr, 10);
            const day = parseInt(dStr, 10);

            let hours = 0, minutes = 0, seconds = 0;
            if (timePart) {
                const parts = timePart.split(':');
                if (parts[0]) hours = parseInt(parts[0], 10);
                if (parts[1]) minutes = parseInt(parts[1], 10);
                if (parts[2]) seconds = parseInt(parts[2], 10);
            }

            const d = new Date(year, month - 1, day, hours, minutes, seconds);
            if (!isNaN(d.getTime())) return d;

            // Fallback for native parsing if manual fails
            return new Date(dateStr);
        } catch (e) {
            return new Date();
        }
    };
    const isSameDay = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

    const getDateLabel = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (isSameDay(date, today)) return 'Bugün';
        if (isSameDay(date, yesterday)) return 'Dün';
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    };

    // Backend now returns messages DESC (Newest First), and our hook appends older messages to the end.
    // So 'messages' array is already [Newest, ..., Oldest]. 
    // This is exactly what Inverted FlatList expects.
    const reversedMessages = messages;

    // OPTIMIZED: Pre-compute lowercase content for search
    const searchableMessages = useMemo(() =>
        reversedMessages.map((msg, index) => ({
            index,
            lowerContent: msg.content.toLowerCase()
        })),
        [reversedMessages]
    );

    // OPTIMIZED: Debounced search text
    const [debouncedSearchText, setDebouncedSearchText] = useState('');

    useEffect(() => {
        if (!searchText.trim()) {
            setDebouncedSearchText('');
            setSearchMatches([]);
            setCurrentMatchIndex(-1);
            return;
        }

        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchText]);

    // OPTIMIZED: Memoized search results
    useEffect(() => {
        if (!debouncedSearchText.trim()) return;

        const lowerSearch = debouncedSearchText.toLowerCase();
        const matches = searchableMessages
            .filter(m => m.lowerContent.includes(lowerSearch))
            .map(m => m.index);

        setSearchMatches(matches);
        if (matches.length > 0) {
            scrollToMatch(matches[0]);
            setCurrentMatchIndex(0);
        } else {
            setCurrentMatchIndex(-1);
        }
    }, [debouncedSearchText, searchableMessages]);

    // Simple text change handler (no heavy processing)
    const handleSearchTextChange = useCallback((text: string) => {
        setSearchText(text);
    }, []);

    const scrollToMatch = (index: number) => {
        flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
        });
    };

    const nextMatch = () => {
        if (searchMatches.length === 0) return;
        const nextIndex = currentMatchIndex + 1 >= searchMatches.length ? 0 : currentMatchIndex + 1;
        setCurrentMatchIndex(nextIndex);
        scrollToMatch(searchMatches[nextIndex]);
    };

    const prevMatch = () => {
        if (searchMatches.length === 0) return;
        const prevIndex = currentMatchIndex - 1 < 0 ? searchMatches.length - 1 : currentMatchIndex - 1;
        setCurrentMatchIndex(prevIndex);
        scrollToMatch(searchMatches[prevIndex]);
    };

    const closeSearch = () => {
        setIsSearching(false);
        setSearchText('');
        setSearchMatches([]);
        setCurrentMatchIndex(-1);
    };

    // Auto-focus search input when opening
    useEffect(() => {
        if (isSearching && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isSearching]);

    const initialScrollDone = useRef(false);

    // Scroll to unread messages on initial load
    useEffect(() => {
        if (!initialScrollDone.current && !isLoading && (initialUnreadCount || 0) > 0 && reversedMessages.length > 0) {
            const unreadIndex = (initialUnreadCount || 0) - 1;
            if (unreadIndex >= 0 && unreadIndex < reversedMessages.length) {
                initialScrollDone.current = true;
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index: unreadIndex,
                        animated: true,
                        viewPosition: 0.5,
                    });
                }, 300);
            }
        }
    }, [isLoading, initialUnreadCount, reversedMessages.length]);

    // Render message item
    const renderItem = useCallback(({ item, index }: { item: Message; index: number }) => {
        // Fix: Cast sender_id to Number to handle string/number mismatch from backend vs local
        const isMyMessage = Number(item.sender_id) === Number(user?.id);

        const prevMessage = reversedMessages[index + 1];
        const nextMessage = reversedMessages[index - 1];

        // Fix: Ensure safe comparison for grouping
        const isSameSenderAsPrev = prevMessage ? Number(prevMessage.sender_id) === Number(item.sender_id) : false;
        const isSameSenderAsNext = nextMessage ? Number(nextMessage.sender_id) === Number(item.sender_id) : false;

        const messageDate = parseDate(item.created_at);
        const prevMessageDate = prevMessage ? parseDate(prevMessage.created_at) : null;
        const showDateSeparator = !prevMessage || !!(prevMessageDate && !isSameDay(messageDate, prevMessageDate));

        const showUnreadDivider = !hasViewedMessages && (initialUnreadCount || 0) > 0 && index === (initialUnreadCount || 0) - 1;

        return (
            <View>
                {/* Date Separator (Rendered visually above because Inverted list logic usually keeps item content top-down, but item stacking is reversed) */}
                {/* ACTUALLY: In an inverted list, item N is below item N+1. 
                    If we want separator visually ABOVE Item N, we should render it 'after' the bubble if the content is inverted? 
                    NO. Standard View behavior: Children are Top->Bottom.
                    Item N contains [Separator, Bubble].
                    It appears as Separator
                                  Bubble
                    Item N+1 (Older) is ABOVE Item N.
                    So:
                    [Item N+1 Bubble]
                    [Item N Separator]
                    [Item N Bubble]
                    This is correct.
                */}
                {showDateSeparator && (
                    <View style={{ alignItems: 'center', marginVertical: 16 }}>
                        <Text style={{
                            color: theme.colors.textSecondary,
                            fontSize: 12,
                            fontWeight: '500',
                            backgroundColor: theme.colors.background,
                            paddingHorizontal: 12,
                            paddingVertical: 4,
                            borderRadius: 12,
                        }}>
                            {getDateLabel(messageDate)}
                        </Text>
                    </View>
                )}

                <MessageBubble
                    item={item}
                    isMyMessage={isMyMessage}
                    isFirstInGroup={!isSameSenderAsPrev}
                    isLastInGroup={!isSameSenderAsNext}
                    isNewMessage={item.id === newMessageId}
                    showUnreadDivider={showUnreadDivider}
                    // showDateSeparator prop removed
                    showDateSeparator={false}
                    dateLabel={getDateLabel(messageDate)}
                    chatUsername={chatUser?.username || 'Kullanıcı'}
                    theme={theme}
                    highlightText={searchText}
                    isFocusedMatch={searchMatches[currentMatchIndex] === index}
                    onLongPress={handleLongPress}
                    onSwipeReply={handleReplyFromSwipe}
                />
            </View>
        );
    }, [reversedMessages, user?.id, newMessageId, initialUnreadCount, chatUser, theme, handleLongPress, handleReplyFromSwipe]);

    // Stable key extractor
    const keyExtractor = useCallback((item: Message) => item._internalId || item.id.toString(), []);

    // Stable Header/Footer
    const listHeader = useMemo(() => <TypingIndicator isTyping={isTyping} theme={theme} />, [isTyping, theme]);
    const listFooter = useMemo(() => (
        isMoreLoading ? (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
        ) : null
    ), [isMoreLoading, theme]);

    // Memoized Message List to prevent re-renders on input change
    const messageList = useMemo(() => (
        <Animated.FlatList
            ref={flatListRef}
            data={reversedMessages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.list}
            inverted
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            itemLayoutAnimation={LinearTransition.duration(300)}

            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            initialNumToRender={15}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
        />
    ), [reversedMessages, renderItem, keyExtractor, styles, loadMoreMessages, listHeader, listFooter]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'android' ? -insets.bottom : 0}
        >
            {/* Header */}
            {isSearching ? (
                <View style={[styles.header, styles.searchHeader]}>
                    <TouchableOpacity onPress={closeSearch} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.searchInput}
                        ref={searchInputRef}
                        placeholder="Mesajlarda ara..."
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchText}
                        onChangeText={handleSearchTextChange}
                        returnKeyType="search"
                        autoCorrect={false}
                    />
                    <View style={styles.searchControls}>
                        <Text style={styles.matchCounter}>
                            {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : '0/0'}
                        </Text>
                        <TouchableOpacity onPress={nextMatch} style={styles.searchButton} disabled={searchMatches.length === 0}>
                            <ChevronDown size={24} color={searchMatches.length === 0 ? theme.colors.textSecondary : theme.colors.text} style={{ opacity: searchMatches.length === 0 ? 0.3 : 1 }} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={prevMatch} style={styles.searchButton} disabled={searchMatches.length === 0}>
                            <ChevronUp size={24} color={searchMatches.length === 0 ? theme.colors.textSecondary : theme.colors.text} style={{ opacity: searchMatches.length === 0 ? 0.3 : 1 }} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSearchText('')} style={[styles.searchButton, { marginLeft: 4 }]}>
                            <X size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerInfo}
                        onPress={() => (navigation as any).navigate('OtherProfile', { userId: otherUserId })}
                    >
                        {chatUser?.avatar_url ? (
                            <Image source={{ uri: chatUser.avatar_url }} style={styles.headerAvatar} />
                        ) : (
                            <View style={styles.headerAvatarPlaceholder}>
                                <Text style={styles.headerAvatarText}>
                                    {chatUser?.username?.charAt(0).toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                        <Text style={styles.headerTitle}>{chatUser?.username || 'Yükleniyor...'}</Text>
                        <ChevronRight size={20} color={theme.colors.textSecondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsSearching(true)} style={styles.backButton}>
                        <Search size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Messages List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                messageList
            )}

            {/* Input or Request Controls */}
            {isRequest ? (
                <View style={styles.requestContainer}>
                    <Text style={styles.requestText}>
                        Bu kullanıcı size mesaj göndermek istiyor. İsteği kabul etmek ister misiniz?
                    </Text>
                    <View style={styles.requestButtons}>
                        <TouchableOpacity style={[styles.requestButton, styles.declineButton]} onPress={handleDecline}>
                            <Text style={styles.declineButtonText}>Reddet</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.requestButton, styles.acceptButton]} onPress={handleAccept}>
                            <Text style={styles.acceptButtonText}>Kabul Et</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <ChatInput
                    inputText={inputText}
                    onChangeText={onInputChange}
                    onSend={() => handleSend(scrollToBottom)}
                    sending={sending}
                    replyToMessage={replyToMessage}
                    editingMessageId={editingMessageId}
                    onCancelReplyOrEdit={cancelEditOrReply}
                    theme={theme}
                />
            )}

            {/* Context Menu */}
            <ContextMenu
                visible={showContextMenu}
                onClose={closeContextMenu}
                selectedMessageContent={selectedMessageContent}
                selectedMessageIsOwn={selectedMessageIsOwn}
                onEmojiSelect={handleEmojiSelect}
                onReply={handleReply}
                onEdit={handleEdit}
                onUnsend={handleUnsend}
                onCopy={handleCopy}
                theme={theme}
            />
        </KeyboardAvoidingView>
    );
};
