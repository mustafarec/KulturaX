import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService } from '../services/backendApi';
import { secureSetObject, secureGetObject, secureDelete, SECURE_KEYS, migrateToSecureStorage } from '../services/SecureStorageService';
import { registerFCMToken, unregisterFCMToken } from '../services/PushNotificationService';

interface AuthContextType {
    user: any | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string, surname: string, username: string, birthDate?: string, gender?: string) => Promise<any>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    resendEmailCode: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (userData: any) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for stored user data on app start
        const loadUser = async () => {
            try {
                // Run migration from AsyncStorage to SecureStore (one-time)
                await migrateToSecureStorage();

                const userData = await secureGetObject<any>(SECURE_KEYS.USER_DATA);
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
                }
            } catch (e) {
                console.error('Failed to load user', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
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

            // Register FCM Token
            try {
                if (userData.id) {
                    registerFCMToken(userData.id);
                }
            } catch (e) {
                console.log('FCM registration error:', e);
            }
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

    const logout = async () => {
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
    };

    const updateUser = async (userData: any) => {
        setUser(userData);
        await secureSetObject(SECURE_KEYS.USER_DATA, userData);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, verifyEmail, resendEmailCode, logout, updateUser, isLoading, error }}>
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
