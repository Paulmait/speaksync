import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { KaraokeState, ScriptAnalysis, KaraokeHighlightSettings, TeleprompterSettings } from '../types';

interface KaraokeTextProps {
  content: string;
  karaokeState: KaraokeState;
  scriptAnalysis: ScriptAnalysis | null;
  settings: KaraokeHighlightSettings;
  teleprompterSettings: TeleprompterSettings;
  onWordLayout?: (wordIndex: number, layout: { x: number; y: number; width: number; height: number }) => void;
  onScrollRequest?: (y: number) => void;
}

interface WordLayoutInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  wordIndex: number;
}

/**
 * High-performance karaoke text component with real-time highlighting
 * Optimized for ultra-low latency visual feedback
 */
export const KaraokeText: React.FC<KaraokeTextProps> = ({
  content,
  karaokeState,
  scriptAnalysis,
  settings,
  teleprompterSettings,
  onWordLayout,
  onScrollRequest,
}) => {
  const wordLayoutsRef = useRef<Map<number, WordLayoutInfo>>(new Map());
  const highlightAnimationsRef = useRef<Map<number, Animated.Value>>(new Map());
  const containerRef = useRef<View>(null);

  // Memoize word components for performance
  const wordComponents = useMemo(() => {
    if (!scriptAnalysis) {
      return renderPlainText();
    }

    return renderHighlightableWords();
  }, [content, scriptAnalysis, teleprompterSettings, settings]);

  // Auto-scroll to highlighted word
  useEffect(() => {
    if (settings.autoScroll && karaokeState.highlightedWords.length > 0) {
      const wordIndex = karaokeState.highlightedWords[0];
      if (wordIndex !== undefined) {
        const layout = wordLayoutsRef.current.get(wordIndex);

        if (layout && onScrollRequest) {
          const scrollY = Math.max(0, layout.y - (settings.scrollOffset ?? 100));
          onScrollRequest(scrollY);
        }
      }
    }
  }, [karaokeState.highlightedWords, settings.autoScroll, settings.scrollOffset, onScrollRequest]);

  // Animate highlights
  useEffect(() => {
    karaokeState.highlightedWords.forEach(wordIndex => {
      let animation = highlightAnimationsRef.current.get(wordIndex);
      if (!animation) {
        animation = new Animated.Value(0);
        highlightAnimationsRef.current.set(wordIndex, animation);
      }

      // Trigger highlight animation
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: settings.animationDuration,
          useNativeDriver: false,
        }),
        Animated.delay(settings.fadeOutDelay),
        Animated.timing(animation, {
          toValue: 0,
          duration: settings.animationDuration,
          useNativeDriver: false,
        }),
      ]).start(() => {
        highlightAnimationsRef.current.delete(wordIndex);
      });
    });
  }, [karaokeState.highlightedWords, settings.animationDuration, settings.fadeOutDelay]);

  /**
   * Render plain text when script analysis is not available
   */
  const renderPlainText = useCallback(() => {
    return (
      <Text style={[styles.text, getTextStyle()]}>
        {content}
      </Text>
    );
  }, [content, teleprompterSettings]);

  /**
   * Render highlightable words with individual components
   */
  const renderHighlightableWords = useCallback(() => {
    if (!scriptAnalysis) return null;

    const paragraphs: React.ReactElement[] = [];
    let currentParagraph = -1;
    let currentParagraphWords: React.ReactElement[] = [];

    scriptAnalysis.words.forEach((wordData, index) => {
      const isHighlighted = karaokeState.highlightedWords.includes(index);
      const isCurrent = karaokeState.currentWordIndex === index;
      
      // Start new paragraph if needed
      if (wordData.paragraph !== currentParagraph) {
        if (currentParagraphWords.length > 0) {
          paragraphs.push(
            <View key={`paragraph-${currentParagraph}`} style={styles.paragraph}>
              <Text style={[styles.text, getTextStyle()]}>
                {currentParagraphWords}
              </Text>
            </View>
          );
        }
        currentParagraph = wordData.paragraph;
        currentParagraphWords = [];
      }

      // Create word component
      const wordComponent = (
        <KaraokeWord
          key={`word-${index}`}
          word={wordData.word}
          wordIndex={index}
          isHighlighted={isHighlighted}
          isCurrent={isCurrent}
          settings={settings}
          textStyle={getTextStyle()}
          onLayout={(layout) => {
            wordLayoutsRef.current.set(index, { ...layout, wordIndex: index });
            onWordLayout?.(index, layout);
          }}
        />
      );

      currentParagraphWords.push(wordComponent);

      // Add space after word (except for last word in sentence)
      const isLastInSentence = index === scriptAnalysis.words.length - 1 || 
        scriptAnalysis.words[index + 1]?.sentence !== wordData.sentence;
      
      if (!isLastInSentence) {
        currentParagraphWords.push(
          <Text key={`space-${index}`} style={[styles.text, getTextStyle()]}>
            {' '}
          </Text>
        );
      }
    });

    // Add final paragraph
    if (currentParagraphWords.length > 0) {
      paragraphs.push(
        <View key={`paragraph-${currentParagraph}`} style={styles.paragraph}>
          <Text style={[styles.text, getTextStyle()]}>
            {currentParagraphWords}
          </Text>
        </View>
      );
    }

    return paragraphs;
  }, [scriptAnalysis, karaokeState, settings, teleprompterSettings, onWordLayout]);

  /**
   * Get text style based on teleprompter settings
   */
  const getTextStyle = useCallback(() => {
    return {
      fontSize: teleprompterSettings.fontSize,
      fontFamily: teleprompterSettings.fontFamily,
      color: teleprompterSettings.textColor,
      lineHeight: teleprompterSettings.fontSize * teleprompterSettings.lineHeight,
      textAlign: teleprompterSettings.textAlign,
      transform: teleprompterSettings.isMirrored ? [{ scaleX: -1 }] : undefined,
    };
  }, [teleprompterSettings]);

  return (
    <View 
      ref={containerRef}
      style={[
        styles.container,
        {
          backgroundColor: teleprompterSettings.backgroundColor,
          paddingHorizontal: teleprompterSettings.padding,
        },
      ]}
    >
      {wordComponents}
    </View>
  );
};

/**
 * Individual word component with highlight animation
 */
interface KaraokeWordProps {
  word: string;
  wordIndex: number;
  isHighlighted: boolean;
  isCurrent: boolean;
  settings: KaraokeHighlightSettings;
  textStyle: any;
  onLayout: (layout: { x: number; y: number; width: number; height: number }) => void;
}

const KaraokeWord: React.FC<KaraokeWordProps> = React.memo(({
  word,
  wordIndex: _wordIndex,
  isHighlighted,
  isCurrent,
  settings,
  textStyle,
  onLayout,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const textRef = useRef<Text>(null);

  useEffect(() => {
    if (isHighlighted) {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: settings.animationDuration,
          useNativeDriver: false,
        }),
        Animated.delay(settings.fadeOutDelay),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: settings.animationDuration,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isHighlighted, settings.animationDuration, settings.fadeOutDelay, animatedValue]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    onLayout({ x, y, width, height });
  }, [onLayout]);

  const getWordStyle = useCallback(() => {
    const baseStyle = [textStyle];

    if (isHighlighted || isCurrent) {
      const highlightOpacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      });

      return [
        ...baseStyle,
        {
          color: settings.highlightColor,
          backgroundColor: settings.highlightBackgroundColor,
          opacity: highlightOpacity,
        },
      ];
    }

    return baseStyle;
  }, [textStyle, isHighlighted, isCurrent, settings, animatedValue]);

  return (
    <Animated.Text
      ref={textRef}
      style={getWordStyle()}
      onLayout={handleLayout}
    >
      {word}
    </Animated.Text>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paragraph: {
    marginBottom: 16,
  },
  text: {
    flexWrap: 'wrap',
  },
});

export default KaraokeText;
