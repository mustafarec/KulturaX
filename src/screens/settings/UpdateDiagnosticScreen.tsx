import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, RefreshCw, Download, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const UpdateDiagnosticScreen = () => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);

    useEffect(() => {
        refreshInfo();
    }, []);

    const refreshInfo = async () => {
        setLoading(true);
        try {
            const info = {
                // Core Info
                updateId: Updates.updateId,
                runtimeVersion: Updates.runtimeVersion,
                channel: Updates.channel,
                isEmbeddedLaunch: Updates.isEmbeddedLaunch,
                isEnabled: Updates.isEnabled,

                // Manifest Info
                manifest: Updates.manifest,

                // App Config
                expoConfig: Constants.expoConfig,

                // Environment
                isDev: __DEV__,
                platform: Constants.platform,
                nativeAppVersion: Constants.nativeAppVersion || (Constants.expoConfig as any)?.version,
                androidVersionCode: (Constants.expoConfig as any)?.android?.versionCode,
                iosBuildNumber: (Constants.expoConfig as any)?.ios?.buildNumber,
            };
            setDiagnosticInfo(info);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckUpdate = async () => {
        setLoading(true);
        try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                Alert.alert('Güncelleme Mevcut', `Yeni bir güncelleme bulundu (ID: ${update.manifest?.id})`);
            } else {
                Alert.alert('Güncel', 'Yeni bir güncelleme bulunmuyor.');
            }
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchUpdate = async () => {
        setLoading(true);
        try {
            const result = await Updates.fetchUpdateAsync();
            if (result.isNew) {
                Alert.alert('Başarılı', 'Güncelleme indirildi. Uygulama yeniden başlatılacak.', [
                    { text: 'Tamam', onPress: () => Updates.reloadAsync() }
                ]);
            }
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: JSON.stringify(diagnosticInfo, null, 2),
                title: 'EAS Update Diagnostic Report'
            });
        } catch (error) {
            console.error(error);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingTop: insets.top + 10,
            paddingBottom: 16,
            paddingHorizontal: 20,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.text,
        },
        content: {
            padding: 20,
        },
        section: {
            marginBottom: 24,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.primary,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
            paddingBottom: 8,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.border,
        },
        label: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            flex: 1,
        },
        value: {
            fontSize: 14,
            color: theme.colors.text,
            flex: 2,
            textAlign: 'right',
            fontWeight: '500',
        },
        json: {
            fontSize: 12,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            color: theme.colors.text,
            backgroundColor: theme.dark ? '#111' : '#f5f5f5',
            padding: 10,
            borderRadius: 8,
        },
        actions: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 32,
        },
        actionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primary,
            paddingVertical: 12,
            borderRadius: 10,
            gap: 8,
        },
        actionButtonText: {
            color: '#fff',
            fontWeight: '600',
            fontSize: 14,
        }
    });

    const DataRow = ({ label, value }: { label: string, value: any }) => (
        <View style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                {String(value)}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>OTA Diagnostics</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Share2 size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {loading && !diagnosticInfo ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <>
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.actionButton} onPress={handleCheckUpdate}>
                                <RefreshCw size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Check</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={handleFetchUpdate}>
                                <Download size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Fetch</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]} onPress={refreshInfo}>
                                <Info size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Reload UI</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Runtime & Channel</Text>
                            <DataRow label="Channel" value={diagnosticInfo?.channel || 'Unknown'} />
                            <DataRow label="Runtime Version" value={diagnosticInfo?.runtimeVersion || 'Unknown'} />
                            <DataRow label="Update ID" value={diagnosticInfo?.updateId || 'None (Embedded)'} />
                            <DataRow label="Is Embedded" value={diagnosticInfo?.isEmbeddedLaunch ? 'Yes' : 'No'} />
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Native Info</Text>
                            <DataRow label="App Version" value={diagnosticInfo?.nativeAppVersion || 'Unknown'} />
                            {Platform.OS === 'android' ? (
                                <DataRow label="Android Version Code" value={diagnosticInfo?.androidVersionCode || 'Unknown'} />
                            ) : (
                                <DataRow label="iOS Build Number" value={diagnosticInfo?.iosBuildNumber || 'Unknown'} />
                            )}
                            <DataRow label="Platform" value={Platform.OS} />
                        </View>

                        {diagnosticInfo?.manifest && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Current Manifest</Text>
                                <Text style={styles.json}>
                                    {JSON.stringify(diagnosticInfo.manifest, null, 2)}
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};
