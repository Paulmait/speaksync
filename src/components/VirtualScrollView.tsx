import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { performanceOptimizer } from '../services/performanceOptimizer';

interface VirtualScrollViewProps<T> {
  data: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactElement;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  keyExtractor: (item: T, index: number) => string;
  containerStyle?: any;
  contentContainerStyle?: any;
  overscan?: number;
}

export function VirtualScrollView<T>({
  data,
  itemHeight,
  renderItem,
  onEndReached,
  onEndReachedThreshold = 0.7,
  keyExtractor,
  containerStyle,
  contentContainerStyle,
  overscan = 5,
}: VirtualScrollViewProps<T>) {
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastEndReachedCall = useRef(0);

  // Throttled scroll handler for performance
  const handleScroll = useCallback(
    performanceOptimizer.throttle((event: any) => {
      const newScrollTop = event.nativeEvent.contentOffset.y;
      setScrollTop(newScrollTop);

      // Check if we need to load more data
      if (onEndReached && data.length > 0) {
        const totalHeight = data.length * itemHeight;
        const scrollPosition = newScrollTop + containerHeight;
        const threshold = totalHeight * onEndReachedThreshold;

        if (scrollPosition >= threshold) {
          const now = Date.now();
          if (now - lastEndReachedCall.current > 1000) { // Debounce by 1 second
            lastEndReachedCall.current = now;
            onEndReached();
          }
        }
      }
    }, 16), // ~60fps
    [containerHeight, itemHeight, data.length, onEndReached, onEndReachedThreshold]
  );

  // Calculate visible items using the performance optimizer
  const visibleItems = useMemo(() => {
    if (!containerHeight || !itemHeight || data.length === 0) {
      return { items: [], offsetY: 0, totalHeight: 0 };
    }

    const scrollData = performanceOptimizer.calculateVirtualScrollItems(
      containerHeight,
      itemHeight,
      scrollTop,
      data.length,
      overscan
    );

    const items = data
      .slice(scrollData.start, scrollData.end + 1)
      .map((item, index) => ({
        item,
        index: scrollData.start + index,
        key: keyExtractor(item, scrollData.start + index),
      }));

    return {
      items,
      offsetY: scrollData.offsetY,
      totalHeight: data.length * itemHeight,
    };
  }, [data, itemHeight, scrollTop, containerHeight, overscan, keyExtractor]);

  const handleLayout = useCallback((event: any) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  return (
    <View style={[styles.container, containerStyle]} onLayout={handleLayout}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          {
            height: visibleItems.totalHeight,
            paddingTop: visibleItems.offsetY,
          },
          contentContainerStyle,
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={true}
      >
        <View style={{ height: visibleItems.totalHeight - visibleItems.offsetY }}>
          {visibleItems.items.map(({ item, index, key }) => (
            <View key={key} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Memoized version for better performance
export const MemoizedVirtualScrollView = React.memo(VirtualScrollView) as typeof VirtualScrollView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
