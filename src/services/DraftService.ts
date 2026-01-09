import AsyncStorage from '@react-native-async-storage/async-storage';
// import { v4 as uuidv4 } from 'uuid'; // Removed due to missing dependency

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export interface Draft {
    id: string;
    type: 'thought' | 'review' | 'book' | 'event' | 'quote';
    data: any;
    createdAt: number;
}

const DRAFTS_KEY = '@drafts_v1';

export const draftService = {
    async saveDraft(draft: Omit<Draft, 'id' | 'createdAt'>): Promise<void> {
        try {
            const existingDraftsJson = await AsyncStorage.getItem(DRAFTS_KEY);
            const existingDrafts: Draft[] = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];

            const newDraft: Draft = {
                ...draft,
                id: generateId(),
                createdAt: Date.now(),
            };

            const updatedDrafts = [newDraft, ...existingDrafts];
            await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
        } catch (error) {
            console.error('Failed to save draft:', error);
            throw error;
        }
    },

    async updateDraft(id: string, data: any): Promise<void> {
        try {
            const existingDraftsJson = await AsyncStorage.getItem(DRAFTS_KEY);
            let existingDrafts: Draft[] = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];

            const index = existingDrafts.findIndex(d => d.id === id);
            if (index !== -1) {
                existingDrafts[index] = { ...existingDrafts[index], data, createdAt: Date.now() };
                await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(existingDrafts));
            }
        } catch (error) {
            console.error('Failed to update draft:', error);
            throw error;
        }
    },

    async getDrafts(): Promise<Draft[]> {
        try {
            const draftsJson = await AsyncStorage.getItem(DRAFTS_KEY);
            return draftsJson ? JSON.parse(draftsJson) : [];
        } catch (error) {
            console.error('Failed to get drafts:', error);
            return [];
        }
    },

    async deleteDraft(id: string): Promise<void> {
        try {
            const existingDraftsJson = await AsyncStorage.getItem(DRAFTS_KEY);
            if (!existingDraftsJson) return;

            const existingDrafts: Draft[] = JSON.parse(existingDraftsJson);
            const updatedDrafts = existingDrafts.filter(draft => draft.id !== id);

            await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
        } catch (error) {
            console.error('Failed to delete draft:', error);
            throw error;
        }
    },

    async clearAllDrafts(): Promise<void> {
        try {
            await AsyncStorage.removeItem(DRAFTS_KEY);
        } catch (error) {
            console.error('Failed to clear drafts:', error);
        }
    }
};
