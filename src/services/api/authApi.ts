import { apiClient, setAuthToken, clearAuthToken, handleApiError } from './client';

export const authService = {
    login: async (email: string, password: string) => {
        try {
            const response = await apiClient.post('/auth/login.php', { email, password });
            if (response.data.token) {
                await setAuthToken(response.data.token);
            }
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    register: async (
        email: string,
        password: string,
        name: string,
        surname: string,
        username: string,
        birthDate?: string,
        gender?: string
    ) => {
        try {
            const response = await apiClient.post('/auth/register.php', {
                email,
                password,
                name,
                surname,
                username,
                birth_date: birthDate,
                gender
            });
            if (response.data.token) {
                await setAuthToken(response.data.token);
            }
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    verifyEmail: async (email: string, code: string) => {
        try {
            const response = await apiClient.post('/auth/verify.php', { email, code });
            if (response.data.token) {
                await setAuthToken(response.data.token);
            }
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    resendVerificationCode: async (email: string) => {
        try {
            const response = await apiClient.post('/auth/resend_code.php', { email });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        try {
            const response = await apiClient.post('/auth/change_password.php', {
                current_password: currentPassword,
                new_password: newPassword
            });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    getProfile: async (userId: number) => {
        try {
            // Using existing endpoint if available or minimal profile fetch
            // Ideally we should have a specific endpoint for session refreshment or profile fetch
            const response = await apiClient.get('/users/profile.php', { params: { user_id: userId } });
            return response.data;
        } catch (error: any) {
            handleApiError(error);
        }
    },

    logout: async () => {
        await clearAuthToken();
    },
};
