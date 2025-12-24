import backendApi from './backendApi';

// API anahtarları artık backend'de güvenli bir şekilde saklanıyor
// Frontend'den backend proxy üzerinden çağrı yapılıyor

export const tmdbApi = {
    searchMovies: async (query: string) => {
        try {
            const response = await backendApi.get(`/api/tmdb_proxy.php?action=search&query=${encodeURIComponent(query)}`);
            return response.data.results || [];
        } catch (error: any) {
            console.error('TMDB Search Error:', error.response?.data || error.message);
            return [];
        }
    },

    getMovieDetails: async (id: number) => {
        try {
            const response = await backendApi.get(`/api/tmdb_proxy.php?action=details&id=${id}`);
            return response.data;
        } catch (error: any) {
            console.error('TMDB Details Error:', error.response?.data || error.message);
            return null;
        }
    },

    getTrendingMovies: async () => {
        try {
            const response = await backendApi.get(`/api/tmdb_proxy.php?action=trending`);
            return response.data.results || [];
        } catch (error: any) {
            console.error('TMDB Trending Error:', error.response?.data || error.message);
            return [];
        }
    },

    getPopularMovies: async () => {
        try {
            const response = await backendApi.get(`/api/tmdb_proxy.php?action=popular`);
            return response.data.results || [];
        } catch (error: any) {
            console.error('TMDB Popular Error:', error.response?.data || error.message);
            return [];
        }
    },

    searchPerson: async (query: string) => {
        try {
            const response = await backendApi.get(`/api/tmdb_proxy.php?action=person_search&query=${encodeURIComponent(query)}`);
            return response.data.results || [];
        } catch (error: any) {
            console.error('TMDB Person Search Error:', error.response?.data || error.message);
            return [];
        }
    },

    getPersonDetails: async (id: number) => {
        try {
            const response = await backendApi.get(`/api/tmdb_proxy.php?action=person_details&id=${id}`);
            return response.data;
        } catch (error: any) {
            console.error('TMDB Person Details Error:', error.response?.data || error.message);
            return null;
        }
    },

    getPersonCredits: async (id: number) => {
        try {
            const response = await backendApi.get(`/api/tmdb_proxy.php?action=person_credits&id=${id}`);
            return response.data || { cast: [], crew: [] };
        } catch (error: any) {
            console.error('TMDB Person Credits Error:', error.response?.data || error.message);
            return [];
        }
    },

    getMovieCredits: async (id: number) => {
        try {
            const response = await backendApi.get(`/api/tmdb_proxy.php?action=movie_credits&id=${id}`);
            return response.data;
        } catch (error: any) {
            console.error('TMDB Movie Credits Error:', error.response?.data || error.message);
            return null;
        }
    }
};
