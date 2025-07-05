import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import {
  IconButton,
  useTheme,
} from 'react-native-paper';
import { FillerWordDetection, FillerWordSettings } from '../types';

interface FillerWordCueProps {
  detection: FillerWordDetection;
  settings: FillerWordSettings;
  onDismiss?: () => void;
  style?: any;
}

export default function FillerWordCue({
  detection,
  settings,
  onDismiss,
  style,
}: FillerWordCueProps) {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Shake animation for visual attention
    if (settings.visualCueType === 'shake') {
      const shakeSequence = Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]);
      
      shakeSequence.start();
    }

    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 3000);

    return () => clearTimeout(dismissTimer);
  }, [detection.timestamp]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getIconName = () => {
    switch (settings.iconType) {
      case 'warning': return 'alert';
      case 'alert': return 'alert-circle';
      case 'circle': return 'circle';
      case 'dot': return 'circle-small';
      default: return 'alert';
    }
  };

  const renderIcon = () => (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          backgroundColor: settings.cueColor + '20',
          borderColor: settings.cueColor,
          transform: [
            { scale: scaleAnim },
            { translateX: shakeAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <IconButton
        icon={getIconName()}
        iconColor={settings.cueColor}
        size={16}
        style={styles.icon}
        onPress={handleDismiss}
      />
    </Animated.View>
  );

  const renderHighlight = () => (
    <Animated.View
      style={[
        styles.highlightContainer,
        {
          backgroundColor: settings.cueColor + '30',
          borderBottomColor: settings.cueColor,
          transform: [
            { scale: scaleAnim },
            { translateX: shakeAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    />
  );

  const renderUnderline = () => (
    <Animated.View
      style={[
        styles.underlineContainer,
        {
          backgroundColor: settings.cueColor,
          transform: [
            { scaleX: scaleAnim },
            { translateX: shakeAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    />
  );

  if (!settings.enabled || !settings.showInRealTime) {
    return null;
  }

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {settings.visualCueType === 'icon' && renderIcon()}
      {settings.visualCueType === 'highlight' && renderHighlight()}
      {settings.visualCueType === 'underline' && renderUnderline()}
      {settings.visualCueType === 'shake' && renderIcon()}
    </View>
  );
}

// Component for inline text highlighting
interface FillerWordHighlightProps {
  word: string;
  isFillerWord: boolean;
  settings: FillerWordSettings;
  textStyle?: any;
}

export function FillerWordHighlight({
  word,
  isFillerWord,
  settings,
  textStyle,
}: FillerWordHighlightProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFillerWord && settings.enabled && settings.showInRealTime) {
      // Pulse animation for detected filler words
      const pulseSequence = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]);
      
      Animated.loop(pulseSequence, { iterations: 2 }).start();
    }
  }, [isFillerWord]);

  if (!isFillerWord || !settings.enabled) {
    return null;
  }

  const getHighlightStyle = () => {
    switch (settings.visualCueType) {
      case 'highlight':
        return {
          backgroundColor: settings.cueColor + '40',
          borderRadius: 4,
          paddingHorizontal: 2,
        };
      case 'underline':
        return {
          borderBottomWidth: 2,
          borderBottomColor: settings.cueColor,
        };
      default:
        return {};
    }
  };

  return (
    <Animated.View
      style={[
        getHighlightStyle(),
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* This would be integrated into the text rendering component */}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  iconContainer: {
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  icon: {
    margin: 0,
  },
  highlightContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
    borderBottomWidth: 2,
  },
  underlineContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
});
