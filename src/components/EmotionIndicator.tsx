import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text as RNText,
} from 'react-native';
import {
  Text,
  Surface,
  ProgressBar,
} from 'react-native-paper';
import HumeEmotionService, { EmotionIndicatorState, EmotionAnalysis } from '../services/humeEmotionService';

interface EmotionIndicatorProps {
  visible: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style?: any;
  onEmotionChange?: (emotion: EmotionAnalysis) => void;
}

export default function EmotionIndicator({
  visible,
  position = 'top-right',
  style,
  onEmotionChange,
}: EmotionIndicatorProps) {
  const [indicator, setIndicator] = useState<EmotionIndicatorState>({
    emoji: '😐',
    color: '#9CA3AF',
    confidence: 0,
    description: 'Neutral',
  });
  const [isActive, setIsActive] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const humeService = HumeEmotionService.getInstance();

    const handleIndicatorUpdate = (newIndicator: EmotionIndicatorState) => {
      setIndicator(newIndicator);
      setIsActive(true);
      
      // Pulse animation for new emotion
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after inactivity
      setTimeout(() => setIsActive(false), 3000);
    };

    const handleEmotionUpdate = (emotion: EmotionAnalysis) => {
      if (onEmotionChange) {
        onEmotionChange(emotion);
      }
    };

    humeService.addIndicatorListener(handleIndicatorUpdate);
    humeService.addEmotionListener(handleEmotionUpdate);

    return () => {
      humeService.removeIndicatorListener(handleIndicatorUpdate);
      humeService.removeEmotionListener(handleEmotionUpdate);
    };
  }, [onEmotionChange, pulseAnim]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible && isActive ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, isActive, fadeAnim]);

  const getPositionStyle = () => {
    const styles: any = {
      position: 'absolute',
      zIndex: 1000,
    };

    switch (position) {
      case 'top-left':
        return { ...styles, top: 20, left: 20 };
      case 'top-right':
        return { ...styles, top: 20, right: 20 };
      case 'bottom-left':
        return { ...styles, bottom: 20, left: 20 };
      case 'bottom-right':
        return { ...styles, bottom: 20, right: 20 };
      default:
        return { ...styles, top: 20, right: 20 };
    }
  };

  return (
    <Animated.View
      style={[
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Surface style={[styles.container, { borderColor: indicator.color }]} elevation={3}>
        <View style={styles.header}>
          <RNText style={styles.emoji}>{indicator.emoji}</RNText>
          <View style={styles.textContainer}>
            <Text variant="labelSmall" style={[styles.description, { color: indicator.color }]}>
              {indicator.description}
            </Text>
            <Text variant="labelSmall" style={styles.confidence}>
              {Math.round(indicator.confidence * 100)}% confident
            </Text>
          </View>
        </View>
        
        <ProgressBar
          progress={indicator.confidence}
          color={indicator.color}
          style={styles.progressBar}
        />
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 24,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  description: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  confidence: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
});
