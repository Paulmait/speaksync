/**
 * Test Component to verify new Pacing Meter and Filler Word Detection features
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { 
  PacingMeter, 
  SessionSummary, 
  FillerWordCue, 
  PacingSettings 
} from '../components';
import {
  PacingMeterSettings,
  PacingMeterState,
  FillerWordSettings,
  FillerWordDetection,
  SessionSummaryReport
} from '../types';

export default function FeatureDemo() {
  // Demo state for Pacing Meter
  const [pacingSettings] = useState<PacingMeterSettings>({
    enabled: true,
    targetWPM: 150,
    toleranceRange: 20,
    showVisualMeter: true,
    showSessionSummary: true,
    colorScheme: {
      optimal: '#10B981',
      acceptable: '#F59E0B',
      poor: '#EF4444',
    },
  });

  const [pacingState, setPacingState] = useState<PacingMeterState>({
    currentWPM: 120,
    targetWPM: 150,
    isInOptimalRange: false,
    sessionStartTime: Date.now(),
    averageWPM: 115,
    wpmHistory: [],
    paceAnalysis: [],
  });

  const [showPacingMeter, setShowPacingMeter] = useState(true);

  // Demo state for Filler Words
  const [fillerSettings] = useState<FillerWordSettings>({
    enabled: true,
    fillerWords: ['um', 'uh', 'like', 'you know'],
    visualCueType: 'icon',
    iconType: 'warning',
    cueColor: '#FF9800',
    showInRealTime: true,
    trackInSession: true,
    sensitivity: 'medium',
  });

  const [activeFillers, setActiveFillers] = useState<FillerWordDetection[]>([]);
  const [showPacingSettings, setShowPacingSettings] = useState(false);

  // Demo state for Session Summary
  const [sessionReport] = useState<SessionSummaryReport>({
    sessionId: 'demo-session',
    scriptId: 'demo-script',
    startTime: Date.now() - 300000, // 5 minutes ago
    endTime: Date.now(),
    totalWords: 250,
    averageWPM: 145,
    targetWPM: 150,
    optimalPercentage: 75,
    segments: [
      {
        startWordIndex: 0,
        endWordIndex: 50,
        averageWPM: 120,
        status: 'too-slow',
        duration: 25000,
      },
      {
        startWordIndex: 51,
        endWordIndex: 150,
        averageWPM: 155,
        status: 'optimal',
        duration: 38000,
      },
      {
        startWordIndex: 151,
        endWordIndex: 249,
        averageWPM: 180,
        status: 'too-fast',
        duration: 33000,
      },
    ],
    fillerWords: [
      {
        word: 'um',
        timestamp: Date.now() - 240000,
        wordIndex: 25,
        confidence: 0.9,
        detectionMethod: 'stt',
        position: { start: 25, end: 25 },
      },
      {
        word: 'uh',
        timestamp: Date.now() - 180000,
        wordIndex: 75,
        confidence: 0.8,
        detectionMethod: 'rule-based',
        position: { start: 75, end: 75 },
      },
    ],
    recommendations: [
      'Try to maintain a more consistent pace throughout your delivery.',
      'Practice with shorter segments to improve pacing control.',
      'Good job keeping filler words to a minimum!',
    ],
  });

  const [showSessionSummary, setShowSessionSummary] = useState(false);

  // Demo functions
  const simulateFillerWord = () => {
    const newFiller: FillerWordDetection = {
      word: 'um',
      timestamp: Date.now(),
      wordIndex: Math.floor(Math.random() * 100),
      confidence: 0.8 + Math.random() * 0.2,
      detectionMethod: 'stt',
      position: { start: 50, end: 50 },
    };

    setActiveFillers(prev => [...prev, newFiller]);

    // Remove after 3 seconds
    setTimeout(() => {
      setActiveFillers(prev => prev.filter(f => f.timestamp !== newFiller.timestamp));
    }, 3000);
  };

  const simulatePaceChange = () => {
    const newWPM = 80 + Math.random() * 120; // Random WPM between 80-200
    const isOptimal = newWPM >= (pacingSettings.targetWPM - pacingSettings.toleranceRange) && 
                     newWPM <= (pacingSettings.targetWPM + pacingSettings.toleranceRange);

    setPacingState(prev => ({
      ...prev,
      currentWPM: newWPM,
      isInOptimalRange: isOptimal,
      averageWPM: (prev.averageWPM + newWPM) / 2,
    }));
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.demoPanel}>
        <Text variant="headlineSmall" style={styles.title}>
          Feature Demo: Pacing Meter & Filler Detection
        </Text>

        <View style={styles.buttonRow}>
          <Button 
            mode="contained" 
            onPress={simulatePaceChange}
            style={styles.button}
          >
            Simulate Pace Change
          </Button>
          <Button 
            mode="contained" 
            onPress={simulateFillerWord}
            style={styles.button}
          >
            Simulate Filler Word
          </Button>
        </View>

        <View style={styles.buttonRow}>
          <Button 
            mode="outlined" 
            onPress={() => setShowPacingSettings(true)}
            style={styles.button}
          >
            Pacing Settings
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => setShowSessionSummary(true)}
            style={styles.button}
          >
            Session Summary
          </Button>
        </View>

        <Text variant="bodyMedium" style={styles.instructions}>
          • The pacing meter shows real-time WPM with color-coded zones
          • Filler word cues appear when "um", "uh", etc. are detected
          • Session summary provides comprehensive analysis after each session
        </Text>
      </Surface>

      {/* Pacing Meter Component */}
      <PacingMeter
        state={pacingState}
        settings={pacingSettings}
        isVisible={showPacingMeter}
        onToggleVisibility={() => setShowPacingMeter(!showPacingMeter)}
      />

      {/* Filler Word Cues */}
      {activeFillers.map((detection, index) => (
        <FillerWordCue
          key={`${detection.timestamp}-${index}`}
          detection={detection}
          settings={fillerSettings}
          onDismiss={() => {
            setActiveFillers(prev => 
              prev.filter(cue => cue.timestamp !== detection.timestamp)
            );
          }}
          style={{
            top: 200 + (index * 50),
            right: 20,
          }}
        />
      ))}

      {/* Settings Modal */}
      <PacingSettings
        visible={showPacingSettings}
        onDismiss={() => setShowPacingSettings(false)}
        pacingSettings={pacingSettings}
        fillerSettings={fillerSettings}
        onPacingSettingsChange={(settings) => {
          console.log('Pacing settings changed:', settings);
        }}
        onFillerSettingsChange={(settings) => {
          console.log('Filler settings changed:', settings);
        }}
      />

      {/* Session Summary Modal */}
      <SessionSummary
        report={sessionReport}
        visible={showSessionSummary}
        onDismiss={() => setShowSessionSummary(false)}
        onSaveReport={(report) => {
          console.log('Saving report:', report);
        }}
        onStartNewSession={() => {
          console.log('Starting new session');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  demoPanel: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
  },
  instructions: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
});
