import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

export const createPlaceholderScreen = (name: string) => {
    return () => (
        <View style= { styles.container } >
        <Text style={ styles.text }> { name } Screen </Text>
            </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    text: {
        color: theme.colors.text,
        fontSize: 20,
    },
});
