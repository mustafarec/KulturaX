import { apiClient } from './client';

export const topicService = {
    getPopular: async () => {
        try {
            const response = await apiClient.get('/topics/get_popular.php');
            return response.data;
        } catch (error: any) {
            console.error('getPopular error', error);
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },

    followTopic: async (topicId: number) => {
        try {
            const response = await apiClient.post('/topics/follow.php', { topic_id: topicId });
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },

    getPostsByTopic: async (topicId: number) => {
        try {
            const response = await apiClient.get(`/topics/get_by_topic.php?topic_id=${topicId}`);
            return response.data;
        } catch (error: any) {
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};

export const spotifyService = {
    searchTracks: async (query: string) => {
        try {
            const response = await apiClient.get(`/integrations/spotify_search.php?query=${encodeURIComponent(query)}`);
            return response.data.results;
        } catch (error) {
            console.error('Spotify Search Error:', error);
            return [];
        }
    },

    getTrack: async (id: string) => {
        try {
            const response = await apiClient.get(`/integrations/spotify_track.php?id=${id}`);
            return response.data;
        } catch (error) {
            console.error('Spotify Get Track Error:', error);
            return null;
        }
    },

    getTop50Tracks: async () => {
        try {
            const response = await apiClient.get('/integrations/spotify_top50.php');
            return response.data.results;
        } catch (error: any) {
            console.error('Spotify Top 50 Error:', error);
            return [];
        }
    }
};

export const lyricsService = {
    getLyrics: async (artist: string, title: string) => {
        try {
            const response = await apiClient.get(`/integrations/lyrics_proxy.php?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`);
            return response.data.lyrics || null;
        } catch (error) {
            console.error('getLyrics error:', error);
            return null;
        }
    }
};

export const ticketmasterService = {
    searchEvents: async (keyword: string = '', city: string = '', page: number = 0) => {
        try {
            const response = await apiClient.get(`/integrations/ticketmaster.php?keyword=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city)}&page=${page}`);
            return response.data;
        } catch (error: any) {
            console.error('Ticketmaster Search Error:', error);
            throw error.response ? error.response.data : new Error('Network Error');
        }
    },

    getEventDetails: async (id: string) => {
        try {
            const response = await apiClient.get(`/integrations/ticketmaster_event.php?id=${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Ticketmaster Detail Error:', error);
            throw error.response ? error.response.data : new Error('Network Error');
        }
    }
};
