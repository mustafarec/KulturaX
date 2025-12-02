import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const ReviewsTab = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Henüz inceleme yok.</Text>
    </View>
);

export const QuotesTab = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Henüz kaydedilen alıntı yok.</Text>
    </View>
);

export const ListsTab = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Henüz liste oluşturulmadı.</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.m,
        alignItems: 'center',
    },
    text: {
        color: theme.colors.textSecondary,
    },
});
