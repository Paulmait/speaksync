import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Text,
  Surface,
  ProgressBar,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { PacingMeterState, PacingMeterSettings } from '../types';

interface PacingMeterProps {
  state: PacingMeterState;
  settings: PacingMeterSettings;
  isVisible: boolean;
  onToggleVisibility: () => void;
  style?: any;
}

const { width } = Dimensions.get('window');
const METER_WIDTH = Math.min(width * 0.9, 320);

export default function PacingMeter({
  state,
  settings,
  isVisible,
  onToggleVisibility,
  style,
}: PacingMeterProps) {
  const theme = useTheme();
  const slideAnim = useRef(new Animated.Value(isVisible ? 0 : -80)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -80,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, slideAnim]);

  // Pulse animation for non-optimal pace
  useEffect(() => {
    if (!state.isInOptimalRange && state.currentWPM > 0) {
      const pulseSequence = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
      
      Animated.loop(pulseSequence, { iterations: 3 }).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.isInOptimalRange, state.currentWPM, pulseAnim]);

  if (!settings.enabled || !settings.showVisualMeter) {
    return null;
  }

  const { targetWPM, toleranceRange, colorScheme } = settings;
  const { currentWPM, averageWPM } = state;

  // Calculate pace zones
  const minOptimal = targetWPM - toleranceRange;
  const maxOptimal = targetWPM + toleranceRange;
  const maxScale = Math.max(targetWPM * 1.5, currentWPM * 1.2, 200);

  // Determine current pace zone color
  const getCurrentColor = () => {
    if (currentWPM >= minOptimal && currentWPM <= maxOptimal) {
      return colorScheme.optimal;
    } else if (currentWPM > maxOptimal * 1.5 || currentWPM < minOptimal * 0.5) {
      return colorScheme.poor;
    } else {
      return colorScheme.acceptable;
    }
  };

  // Calculate progress values for the gauge
  const currentProgress = Math.min(currentWPM / maxScale, 1);
  const targetProgress = targetWPM / maxScale;
  const optimalZoneStart = minOptimal / maxScale;
  const optimalZoneEnd = maxOptimal / maxScale;

  const renderGauge = () => (
    <View style={styles.gaugeContainer}>
      {/* Background track */}
      <View style={[styles.gaugeTrack, { width: METER_WIDTH }]}>
        {/* Optimal zone indicator */}
        <View
          style={[
            styles.optimalZone,
            {
              left: `${optimalZoneStart * 100}%`,
              width: `${(optimalZoneEnd - optimalZoneStart) * 100}%`,
              backgroundColor: colorScheme.optimal + '30',
            },
          ]}
        />
        
        {/* Target marker */}
        <View
          style={[
            styles.targetMarker,
            {
              left: `${targetProgress * 100}%`,
              backgroundColor: theme.colors.primary,
            },
          ]}
        />
        
        {/* Current WPM progress */}
        <Animated.View
          style={[
            styles.gaugeProgress,
            {
              width: `${currentProgress * 100}%`,
              backgroundColor: getCurrentColor(),
              transform: [{ scaleY: pulseAnim }],
            },
          ]}
        />
      </View>
      
      {/* Scale markers */}
      <View style={styles.scaleContainer}>
        {[0, Math.round(maxScale * 0.25), Math.round(maxScale * 0.5), Math.round(maxScale * 0.75), Math.round(maxScale)].map((value, index) => (
          <Text key={index} style={styles.scaleLabel}>
            {value}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      <Surface style={styles.surface}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleSmall" style={styles.title}>
              Speaking Pace
            </Text>
            <IconButton
              icon={isVisible ? 'chevron-up' : 'chevron-down'}
              size={16}
              onPress={onToggleVisibility}
              style={styles.toggleButton}
            />
          </View>
        </View>
        
        {isVisible && (
          <View style={styles.content}>
            {/* Current WPM display */}
            <View style={styles.wpmDisplay}>
              <Text variant="headlineMedium" style={[styles.currentWpm, { color: getCurrentColor() }]}>
                {Math.round(currentWPM)}
              </Text>
              <Text variant="bodySmall" style={styles.wpmLabel}>
                WPM
              </Text>
              <Text variant="bodySmall" style={styles.targetLabel}>
                Target: {targetWPM}
              </Text>
            </View>
            
            {/* Gauge visualization */}
            {renderGauge()}
            
            {/* Status indicators */}
            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <View style={[styles.statusDot, { backgroundColor: getCurrentColor() }]} />
                <Text variant="bodySmall" style={styles.statusText}>
                  {state.isInOptimalRange ? 'Optimal Pace' : 
                   currentWPM > maxOptimal ? 'Too Fast' : 
                   currentWPM < minOptimal ? 'Too Slow' : 'Acceptable'}
                </Text>
              </View>
              
              <View style={styles.statusItem}>
                <Text variant="bodySmall" style={styles.averageLabel}>
                  Avg: {Math.round(averageWPM)} WPM
                </Text>
              </View>
            </View>
          </View>
        )}
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  surface: {
    margin: 8,
    borderRadius: 12,
    elevation: 4,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
  },
  toggleButton: {
    margin: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  wpmDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentWpm: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  wpmLabel: {
    opacity: 0.7,
    marginTop: -4,
  },
  targetLabel: {
    opacity: 0.6,
    marginTop: 4,
  },
  gaugeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  gaugeTrack: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  optimalZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  targetMarker: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 3,
    borderRadius: 1.5,
    zIndex: 2,
  },
  gaugeProgress: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 12,
    zIndex: 1,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: METER_WIDTH,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  scaleLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontWeight: '500',
  },
  averageLabel: {
    opacity: 0.7,
  },
});
