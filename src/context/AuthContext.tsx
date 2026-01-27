import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { AppState } from 'react-native';
import Toast from 'react-native-toast-message';
import { onUnauthorized } from '../services/api/client';
import { authService } from '../services/api/authApi';
import { secureSetObject, secureGetObject, secureDelete, secureGet, secureSet, SECURE_KEYS, migrateToSecureStorage } from '../services/SecureStorageService';
import { registerFCMToken, unregisterFCMToken } from '../services/PushNotificationService';
import { User } from '../types/models';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string, surname: string, username: string, birthDate?: string, gender?: string) => Promise<any>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    resendEmailCode: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (userData: Partial<User>) => Promise<void>;
    isLoading: boolean;
    isFirstLaunch: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFirstLaunch, setIsFirstLaunch] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Oturum yenileme (Heartbeat) fonksiyonu
    const refreshSession = async () => {
        try {
            // Aktif kullanıcıyı kontrol et (SecureStore'dan)
            const currentUser = await secureGetObject<any>(SECURE_KEYS.USER_DATA);

            // Eğer kullanıcı varsa ve ID'si mevcutsa
            if (currentUser?.id) {
                // Profil endpoint'ine istek atarak backend'deki "Sliding Expiration" süresini uzat
                await authService.getProfile(currentUser.id);
                console.log(`Heartbeat: Session refreshed for user ${currentUser.id}`);
            }
        } catch (e) {
            // Sessiz hata - kullanıcıyı rahatsız etme
            // Eğer token gerçekten expire olduysa, 401 interceptor bunu yakalayacak
            console.log('Heartbeat failed (expected if offline):', e);
        }
    };

    const logout = useCallback(async () => {
        setError(null);
        try {
            // Remove token from backend and storage
            await authService.logout();
            await unregisterFCMToken();

            await secureDelete(SECURE_KEYS.USER_DATA);
            setUser(null);
        } catch (e: any) {
            setError(e.message);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // 1. 401 Unauthorized Global Listener
        // Sadece pasif kullanıcılarda (token expired) çalışır
        onUnauthorized(() => {
            console.log('Session expired (401), logging out...');
            // Loop'a girmemek için mevcut user varsa logout yap
            logout();
            Toast.show({
                type: 'error',
                text1: 'Oturum Süresi Doldu',
                text2: 'Güvenliğiniz için çıkış yapıldı. Lütfen tekrar giriş yapın.',
                visibilityTime: 4000
            });
        });

        // 2. Heartbeat Mechanism (Keep Active Users Alive)
        // Uygulama öne geldiğinde token süresini uzat
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                refreshSession();
            }
        });

        // Periyodik kontrol (Her 1 saatte bir)
        const interval = setInterval(() => {
            refreshSession();
        }, 60 * 60 * 1000);

        // Check for stored user data on app start
        const loadUser = async () => {
            try {
                // Run migration from AsyncStorage to SecureStore (one-time)
                await migrateToSecureStorage();

                // Check if it's first launch
                const hasLaunched = await secureGet(SECURE_KEYS.HAS_LAUNCHED);
                if (!hasLaunched) {
                    setIsFirstLaunch(true);
                }

                const userData = await secureGetObject<User>(SECURE_KEYS.USER_DATA);
                if (userData) {
                    setUser(userData);

                    // Register FCM Token on auto-login
                    try {
                        if (userData.id) {
                            registerFCMToken(userData.id);
                        }
                    } catch (e) {
                        console.log('FCM auto-registration error:', e);
                    }

                    // Initial Refresh
                    refreshSession();
                }
            } catch (e) {
                console.error('Failed to load user', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();

        return () => {
            subscription.remove();
            clearInterval(interval);
        };
    }, []);

    const login = async (email: string, password: string) => {
        setError(null);
        try {
            const data = await authService.login(email, password);
            const userData = data.user || data; // Handle different response structures

            setUser(userData);
            await secureSetObject(SECURE_KEYS.USER_DATA, userData);

            // Register FCM Token
            try {
                if (userData.id) {
                    registerFCMToken(userData.id);
                }
            } catch (e) {
                console.log('FCM registration error:', e);
            }

            // Mark as launched
            await secureSet(SECURE_KEYS.HAS_LAUNCHED, 'true');
            setIsFirstLaunch(false);

            // Login sonrası hemen heartbeat
            refreshSession();

        } catch (e: any) {
            setError(e.message || 'Login failed');
            console.error(e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (email: string, password: string, name: string, surname: string, username: string, birthDate?: string, gender?: string) => {
        setError(null);
        try {
            const data = await authService.register(email, password, name, surname, username, birthDate, gender);

            // If verification is not required (legacy or changed logic), auto login
            if (data.token) {
                await login(email, password);
            }
            return data;
        } catch (e: any) {
            setError(e.message || 'Signup failed');
            console.error(e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const verifyEmail = async (email: string, code: string) => {
        setError(null);
        try {
            const data = await authService.verifyEmail(email, code);
            const userData = data.user || data;

            setUser(userData);
            await secureSetObject(SECURE_KEYS.USER_DATA, userData);

            // Mark as launched
            await secureSet(SECURE_KEYS.HAS_LAUNCHED, 'true');
            setIsFirstLaunch(false);

            // Register FCM Token
            try {
                if (userData.id) {
                    registerFCMToken(userData.id);
                }
            } catch (e) {
                console.log('FCM registration error:', e);
            }

            refreshSession();

        } catch (e: any) {
            setError(e.message || 'Verification failed');
            console.error(e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const resendEmailCode = async (email: string) => {
        setError(null);
        try {
            await authService.resendVerificationCode(email);
        } catch (e: any) {
            setError(e.message || 'Resend failed');
            console.error(e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const updateUser = async (userData: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        await secureSetObject(SECURE_KEYS.USER_DATA, updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, verifyEmail, resendEmailCode, logout, updateUser, isLoading, isFirstLaunch, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
