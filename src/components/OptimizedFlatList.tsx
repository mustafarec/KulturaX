import React, { useCallback, memo } from 'react';
import { FlatList, FlatListProps, ViewToken } from 'react-native';

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'removeClippedSubviews'> {
    itemHeight?: number;
}

function OptimizedFlatListComponent<T>({
    itemHeight,
    ...props
}: OptimizedFlatListProps<T>) {
    // Optimized getItemLayout if itemHeight is provided
    const getItemLayout = itemHeight
        ? useCallback((_: any, index: number) => ({
            length: itemHeight,
            offset: itemHeight * index,
            index,
        }), [itemHeight])
        : undefined;

    return (
        <FlatList
            {...props}
            getItemLayout={props.getItemLayout || getItemLayout}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            initialNumToRender={10}
            // Memory optimizations
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        />
    );
}

export const OptimizedFlatList = memo(OptimizedFlatListComponent) as typeof OptimizedFlatListComponent;
