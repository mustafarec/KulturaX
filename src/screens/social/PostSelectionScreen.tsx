import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { MessageCircle, BookOpen } from 'lucide-react-native';

export const PostSelectionScreen = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();

    return (
        <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
            <View style={styles.container}>
                <TouchableWithoutFeedback>
                    <View style={[styles.menu, { backgroundColor: theme.colors.surface, ...theme.shadows.soft }]}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                navigation.goBack();
                                (navigation as any).navigate('CreateQuote', { mode: 'thought' });
                            }}
                        >
                            <MessageCircle size={24} color={theme.colors.primary} style={{ marginRight: 16 }} />
                            <Text style={[styles.text, { color: theme.colors.text }]}>Düşünceni paylaş</Text>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => {
                                navigation.goBack();
                                (navigation as any).navigate('CreateQuote', { mode: 'quote' });
                            }}
                        >
                            <BookOpen size={24} color={theme.colors.primary} style={{ marginRight: 16 }} />
                            <Text style={[styles.text, { color: theme.colors.text }]}>Alıntı/İnceleme yap</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 110, // Adjusted to sit above the center tab button
    },
    menu: {
        width: '90%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    text: {
        fontSize: 18,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        width: '100%',
    }
});
