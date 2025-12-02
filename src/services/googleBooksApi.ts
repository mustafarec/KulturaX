import backendApi from './backendApi';

// API anahtarları artık backend'de güvenli bir şekilde saklanıyor
// Frontend'den backend proxy üzerinden çağrı yapılıyor

export const googleBooksApi = {
    searchBooks: async (query: string, orderBy?: string) => {
        try {
            let url = `/api/google_books_proxy.php?action=search&query=${encodeURIComponent(query)}`;
            if (orderBy) {
                url += `&orderBy=${encodeURIComponent(orderBy)}`;
            }
            const response = await backendApi.get(url);
            return response.data.items || [];
        } catch (error: any) {
            console.error('Google Books Search Error:', error.response?.data || error.message);
            return [];
        }
    },

    getBookDetails: async (id: string) => {
        try {
            const response = await backendApi.get(`/api/google_books_proxy.php?action=details&id=${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Google Books Details Error:', error.response?.data || error.message);
            return null;
        }
    }
};
