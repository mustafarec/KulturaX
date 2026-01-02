import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Draft } from '../services/DraftService';

interface PostHubContextType {
    isModalVisible: boolean;
    currentDraft: Draft | null;
    openModal: (draft?: Draft | null) => void;
    closeModal: () => void;
}

const PostHubContext = createContext<PostHubContextType | undefined>(undefined);

export const PostHubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);

    const openModal = useCallback((draft: Draft | null = null) => {
        setCurrentDraft(draft);
        setIsModalVisible(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalVisible(false);
        // We delay clearing the current draft slightly to allow animation to finish, 
        // but for now let's just clear it or handle it in the modal's internal logic cleanup
        // Actually, it's safer to keep it until next open or explicitly clear it.
        // But for "new post" flow, we want it empty.
        // We will reset it when opening with null.
    }, []);

    return (
        <PostHubContext.Provider value={{ isModalVisible, currentDraft, openModal, closeModal }}>
            {children}
        </PostHubContext.Provider>
    );
};

export const usePostHub = () => {
    const context = useContext(PostHubContext);
    if (!context) {
        throw new Error('usePostHub must be used within a PostHubProvider');
    }
    return context;
};
