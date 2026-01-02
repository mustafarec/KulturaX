import backendApi from './backendApi';

// API anahtarları artık backend'de güvenli bir şekilde saklanıyor
// Frontend'den backend proxy üzerinden çağrı yapılıyor

// Gelişmiş arama seçenekleri için interface
interface SearchOptions {
    langRestrict?: string; // 'tr' or 'en'
    maxResults?: number;
    printType?: 'all' | 'books' | 'magazines';
    orderBy?: 'relevance' | 'newest';
    startIndex?: number;
}

export const googleBooksApi = {
    searchBooks: async (query: string, orderByOrOptions?: string | SearchOptions) => {
        try {
            let url = `/api/google_books_proxy.php?action=search&query=${encodeURIComponent(query)}`;

            // Geriye dönük uyumluluk ve yeni options desteği
            if (typeof orderByOrOptions === 'string') {
                url += `&orderBy=${encodeURIComponent(orderByOrOptions)}`;
                // Varsayılan dil kısıtlaması (eski davranış)
                url += `&langRestrict=tr`;
            } else if (typeof orderByOrOptions === 'object') {
                const { langRestrict = 'tr', maxResults = 20, printType = 'books', orderBy = 'relevance', startIndex = 0 } = orderByOrOptions;

                url += `&langRestrict=${encodeURIComponent(langRestrict)}`;
                url += `&maxResults=${maxResults}`;
                url += `&startIndex=${startIndex}`;
                url += `&printType=${encodeURIComponent(printType)}`;
                if (orderBy) {
                    url += `&orderBy=${encodeURIComponent(orderBy)}`;
                }
            } else {
                // Hiçbir parametre gelmezse varsayılan tr
                url += `&langRestrict=tr`;
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
