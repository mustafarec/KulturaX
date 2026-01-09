import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BaseToast, ErrorToast, ToastConfigParams } from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { CheckCircle2, XCircle, Info, AlertCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface CustomToastProps extends ToastConfigParams<any> {
    type: 'success' | 'error' | 'info';
}

const CustomToast: React.FC<CustomToastProps> = ({ text1, text2, type, props }) => {
    const { theme } = useTheme();

    let backgroundColor = theme.colors.surface;
    let iconColor = theme.colors.primary;
    let IconComponent = Info;
    let sideBarColor = theme.colors.primary;

    switch (type) {
        case 'success':
            iconColor = theme.colors.success;
            IconComponent = CheckCircle2;
            sideBarColor = theme.colors.success;
            break;
        case 'error':
            iconColor = theme.colors.error;
            IconComponent = XCircle;
            sideBarColor = theme.colors.error;
            break;
        case 'info':
        default:
            iconColor = theme.colors.primary;
            IconComponent = Info;
            sideBarColor = theme.colors.primary;
            break;
    }

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                shadowColor: theme.shadows.default.shadowColor,
            }
        ]}>


            <View style={styles.contentContainer}>
                <View style={styles.iconContainer}>
                    <IconComponent size={24} color={iconColor} />
                </View>
                <View style={styles.textContainer}>
                    {text1 && (
                        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.headings }]}>
                            {text1}
                        </Text>
                    )}
                    {text2 && (
                        <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.fonts.main }]}>
                            {text2}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width * 0.9,
        maxWidth: 400,
        minHeight: 60,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
        borderWidth: 1,
        // Shadows
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        marginVertical: 8,
    },
    accentBar: {
        width: 6,
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconContainer: {
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
    }
});

export const toastConfig = {
    success: (props: any) => <CustomToast {...props} type="success" />,
    error: (props: any) => <CustomToast {...props} type="error" />,
    info: (props: any) => <CustomToast {...props} type="info" />,
};
