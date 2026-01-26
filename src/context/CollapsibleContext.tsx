import React, { createContext, useContext, ReactNode } from 'react';
import { useSharedValue, SharedValue, withTiming, Easing } from 'react-native-reanimated';

interface CollapsibleContextType {
    translateY: SharedValue<number>;
    hideBars: () => void;
    showBars: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

export const CollapsibleProvider = ({ children }: { children: ReactNode }) => {
    // 0 = fully visible, 1 = fully hidden
    const translateY = useSharedValue(0);

    const hideBars = () => {
        translateY.value = withTiming(1, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
        });
    };

    const showBars = () => {
        translateY.value = withTiming(0, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
        });
    };

    return (
        <CollapsibleContext.Provider value={{ translateY, hideBars, showBars }}>
            {children}
        </CollapsibleContext.Provider>
    );
};

export const useCollapsible = () => {
    const context = useContext(CollapsibleContext);
    if (!context) {
        throw new Error('useCollapsible must be used within a CollapsibleProvider');
    }
    return context;
};
