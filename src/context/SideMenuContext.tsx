import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SideMenuContextType {
    isMenuOpen: boolean;
    openMenu: () => void;
    closeMenu: () => void;
    toggleMenu: () => void;
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

export const SideMenuProvider = ({ children }: { children: ReactNode }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const openMenu = () => setIsMenuOpen(true);
    const closeMenu = () => setIsMenuOpen(false);
    const toggleMenu = () => setIsMenuOpen(prev => !prev);

    return (
        <SideMenuContext.Provider value={{ isMenuOpen, openMenu, closeMenu, toggleMenu }}>
            {children}
        </SideMenuContext.Provider>
    );
};

export const useSideMenu = () => {
    const context = useContext(SideMenuContext);
    if (context === undefined) {
        throw new Error('useSideMenu must be used within a SideMenuProvider');
    }
    return context;
};
