import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Text as RNText,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  IconButton,
  Surface,
  Switch,
  Menu,
  Divider,
  Portal,
  Modal,
  Button,
  TextInput,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useScriptStore } from '../store/scriptStore';
import { SpeechRecognitionPanel, KaraokeText, KaraokeSettings, AdaptiveScrollSettings as AdaptiveScrollSettingsModal, PacingMeter, SessionSummary, FillerWordCue, PacingSettings } from '../components';
import { speechRecognitionService, karaokeService, pacingMeterService, fillerWordDetectionService } from '../services';

// Import the adaptive scroll service - create temporary instance for now
const adaptiveScrollService = {
  initialize: (
    scriptAnalysis: any,
    settings: any,
    onScrollUpdate?: (position: number, velocity: number, metrics: any) => void,
    onPaceChange?: (metrics: any) => void,
    onScrollStateChange?: (state: any) => void
  ) => {},
  getScrollState: () => ({
    currentPosition: 0,
    velocity: 0,
    isAutoScrolling: false,
    lastUpdateTime: Date.now(),
    targetPosition: 0,
    acceleration: 0,
    adaptiveSpeed: 1,
    isUserControlled: false,
    smoothingBuffer: []
  }),
  stop: () => {},
  processWordTiming: (wordIndex: number, word: string, timestamp: number, confidence: number) => {},
  start: () => {},
  reset: () => {},
  setUserScrollPosition: (position: number) => {},
  updateSettings: (settings: any) => {},
};
import { 
  RootStackParamList, 
  TeleprompterSettings, 
  TeleprompterState, 
  KaraokeState, 
  KaraokeHighlightSettings,
  ScriptAnalysis,
  WordMatch,
  AdaptiveScrollSettings,
  SpeechPaceMetrics,
  ScrollState,
  PacingMeterSettings,
  PacingMeterState,
  FillerWordSettings,
  FillerWordState,
  FillerWordDetection,
  SessionSummaryReport
} from '../types';

type TeleprompterScreenRouteProp = RouteProp<
  RootStackParamList,
  'Teleprompter'
>;

const { width, height } = Dimensions.get('window');

const FONT_FAMILIES = [
  { label: 'System Default', value: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  { label: 'Serif', value: Platform.OS === 'ios' ? 'Times New Roman' : 'serif' },
  { label: 'Monospace', value: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
];

const PRESET_COLORS = [
  { label: 'White on Black', text: '#FFFFFF', background: '#000000' },
  { label: 'Black on White', text: '#000000', background: '#FFFFFF' },
  { label: 'Green on Black', text: '#00FF00', background: '#000000' },
  { label: 'Yellow on Blue', text: '#FFFF00', background: '#000080' },
  { label: 'White on Blue', text: '#FFFFFF', background: '#1E40AF' },
  { label: 'Amber on Dark', text: '#FFC107', background: '#1A1A1A' },
];

const DEFAULT_SETTINGS: TeleprompterSettings = {
  speed: 50,
  fontSize: 24,
  fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  textColor: '#FFFFFF',
  backgroundColor: '#000000',
  isScrolling: false,
  isMirrored: false,
  lineHeight: 1.5,
  textAlign: 'center',
  padding: 24,
};

export default function TeleprompterScreen() {
  const route = useRoute<TeleprompterScreenRouteProp>();
  const navigation = useNavigation();
  const { scriptId } = route.params;
  const { getScriptById } = useScriptStore();
  
  const [script, setScript] = useState(getScriptById(scriptId));
  const [settings, setSettings] = useState<TeleprompterSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<TeleprompterState>({
    currentPosition: 0,
    totalHeight: 0,
    currentParagraph: 0,
    totalParagraphs: 0,
  });
  
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontMenuVisible, setFontMenuVisible] = useState(false);
  const [colorMenuVisible, setColorMenuVisible] = useState(false);
  const [customColorModal, setCustomColorModal] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#FFFFFF');
  const [customBackgroundColor, setCustomBackgroundColor] = useState('#000000');
  
  // Speech recognition state
  const [showSpeechPanel, setShowSpeechPanel] = useState(false);
  const [practiceTranscript, setPracticeTranscript] = useState('');
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  
  // Karaoke highlighting state
  const [karaokeState, setKaraokeState] = useState<KaraokeState>({
    currentWordIndex: 0,
    highlightedWords: [],
    matchedWords: [],
    scriptWords: [],
    isActive: false,
    currentSentence: 0,
    totalSentences: 0,
    accuracy: 0,
    wordsPerMinute: 0,
    sessionStartTime: Date.now(),
  });
  const [karaokeSettings, setKaraokeSettings] = useState<KaraokeHighlightSettings>({
    enabled: true,
    highlightColor: '#FFD700',
    highlightBackgroundColor: 'rgba(255, 215, 0, 0.3)',
    autoScroll: true,
    scrollOffset: 100,
    matchThreshold: 0.7,
    highlightDuration: 1500,
    animationDuration: 200,
    fadeOutDelay: 500,
  });
  const [showKaraokeSettings, setShowKaraokeSettings] = useState(false);
  const [showAdaptiveScrollSettings, setShowAdaptiveScrollSettings] = useState(false);
  const [scriptAnalysis, setScriptAnalysis] = useState<ScriptAnalysis | null>(null);
  
  // Adaptive scrolling state
  const [adaptiveScrollSettings, setAdaptiveScrollSettings] = useState<AdaptiveScrollSettings>({
    enabled: true,
    baseScrollSpeed: 50,
    responsiveness: 0.7,
    smoothingFactor: 0.8,
    pauseThreshold: 2.0,
    accelerationLimit: 3.0,
    decelerationLimit: 0.1,
    lookAheadWords: 5,
    bufferZone: 100,
  });
  const [speechPaceMetrics, setSpeechPaceMetrics] = useState<SpeechPaceMetrics>({
    currentWPM: 0,
    averageWPM: 0,
    instantaneousWPM: 0,
    timeSinceLastWord: 0,
    speechDuration: 0,
    totalWordsSpoken: 0,
    isPaused: false,
    isAccelerating: false,
    paceTrend: 'stable',
    confidenceLevel: 1.0,
  });
  const [scrollState, setScrollState] = useState<ScrollState>({
    currentPosition: 0,
    targetPosition: 0,
    velocity: 0,
    acceleration: 0,
    adaptiveSpeed: 50,
    isUserControlled: false,
    lastUpdateTime: Date.now(),
    smoothingBuffer: [],  // For smoothing the scroll movement
  });
  const [isAdaptiveScrollActive, setIsAdaptiveScrollActive] = useState(false);
  
  // Pacing meter state
  const [pacingMeterSettings, setPacingMeterSettings] = useState<PacingMeterSettings>({
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
  const [pacingMeterState, setPacingMeterState] = useState<PacingMeterState>({
    currentWPM: 0,
    targetWPM: 150,
    isInOptimalRange: false,
    sessionStartTime: Date.now(),
    averageWPM: 0,
    wpmHistory: [],
    paceAnalysis: [],
  });
  const [showPacingMeter, setShowPacingMeter] = useState(true);
  const [showPacingSettings, setShowPacingSettings] = useState(false);
  
  // Filler word detection state
  const [fillerWordSettings, setFillerWordSettings] = useState<FillerWordSettings>({
    enabled: true,
    fillerWords: ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically', 'literally'],
    visualCueType: 'icon',
    iconType: 'warning',
    cueColor: '#FF9800',
    showInRealTime: true,
    trackInSession: true,
    sensitivity: 'medium',
  });
  const [fillerWordState, setFillerWordState] = useState<FillerWordState>({
    detectedFillers: [],
    totalFillerCount: 0,
    fillerRate: 0,
    sessionStartTime: Date.now(),
    commonFillers: {},
  });
  const [activeFillerCues, setActiveFillerCues] = useState<FillerWordDetection[]>([]);
  
  // Session summary state
  const [sessionReport, setSessionReport] = useState<SessionSummaryReport | null>(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef(0);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const paragraphRefs = useRef<{ [key: number]: number }>({});
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse paragraphs from script content
  const paragraphs = script?.content.split(/\n\s*\n/).filter(p => p.trim()) || [];

  useEffect(() => {
    if (!script) {
      navigation.goBack();
      return;
    }
    
    setState(prev => ({ ...prev, totalParagraphs: paragraphs.length }));
  }, [script, navigation, paragraphs.length]);

  useEffect(() => {
    if (settings.isScrolling) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }

    return () => {
      stopAutoScroll();
    };
  }, [settings.isScrolling, settings.speed]);

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (isFullscreen && showControls) {
      resetControlsTimeout();
    }
  }, [isFullscreen, showControls]);

  // Initialize karaoke service when script changes
  useEffect(() => {
    if (script?.content && karaokeSettings.enabled) {
      karaokeService.initialize(
        script.content,
        karaokeSettings,
        (newState) => setKaraokeState(newState),
        (wordIndices) => {
          // Update highlighted words - this triggers re-render of KaraokeText
          setKaraokeState((prev: KaraokeState) => ({ ...prev, highlightedWords: wordIndices }));
        },
        (wordIndex) => {
          // Auto-scroll to highlighted word
          if (karaokeSettings.autoScroll && scrollViewRef.current) {
            const analysis = karaokeService.getScriptAnalysis();
            if (analysis && analysis.words[wordIndex]) {
              // Estimate scroll position based on word index
              const estimatedY = (wordIndex / analysis.totalWords) * state.totalHeight;
              const targetY = Math.max(0, estimatedY - karaokeSettings.scrollOffset);
              
              scrollViewRef.current.scrollTo({
                y: targetY,
                animated: true,
              });
            }
          }
        }
      );
      
      setScriptAnalysis(karaokeService.getScriptAnalysis());
    }
  }, [script?.content, karaokeSettings]);

  // Set up speech recognition for karaoke
  useEffect(() => {
    if (!karaokeSettings.enabled) return;

    const unsubscribeWordListener = speechRecognitionService.onWordRecognized(
      (word, confidence, timestamp) => {
        if (karaokeState.isActive) {
          const match = karaokeService.processSpokenWord(word, confidence, timestamp);
          if (match) {
            // Successful match - update UI with instant feedback
            console.log('Karaoke match:', match);
          }
        }
      }
    );

    return unsubscribeWordListener;
  }, [karaokeSettings.enabled, karaokeState.isActive]);

  // Initialize adaptive scrolling service
  useEffect(() => {
    if (scriptAnalysis && adaptiveScrollSettings.enabled) {
      adaptiveScrollService.initialize(
        scriptAnalysis,
        adaptiveScrollSettings,
        (position: number, velocity: number, metrics: SpeechPaceMetrics) => {
          // Update scroll position from adaptive service
          if (!scrollState.isUserControlled && isAdaptiveScrollActive) {
            scrollViewRef.current?.scrollTo({
              y: position,
              animated: false,
            });
            setScrollState(adaptiveScrollService.getScrollState());
          }
        },
        (metrics: SpeechPaceMetrics) => {
          // Update pace metrics in UI
          setSpeechPaceMetrics(metrics);
        },
        (state: ScrollState) => {
          // Update scroll state in UI
          setScrollState(state);
        }
      );
    }

    return () => {
      adaptiveScrollService.stop();
    };
  }, [scriptAnalysis, adaptiveScrollSettings, isAdaptiveScrollActive]);

  // Set up speech recognition for adaptive scrolling
  useEffect(() => {
    if (!adaptiveScrollSettings.enabled) return;

    const unsubscribeWordListener = speechRecognitionService.onWordRecognized(
      (word, confidence, timestamp) => {
        if (isAdaptiveScrollActive && scriptAnalysis) {
          // Find word index in script
          const wordIndex = scriptAnalysis.words.findIndex(w => 
            w.word.toLowerCase().trim() === word.toLowerCase().trim()
          );
          
          if (wordIndex >= 0) {
            // Feed word timing to adaptive scroll service
            adaptiveScrollService.processWordTiming(wordIndex, word, timestamp, confidence);
          }
        }
      }
    );

    return unsubscribeWordListener;
  }, [adaptiveScrollSettings.enabled, isAdaptiveScrollActive, scriptAnalysis]);

  // Initialize pacing meter service
  useEffect(() => {
    if (scriptAnalysis && pacingMeterSettings.enabled) {
      pacingMeterService.initialize(
        scriptAnalysis,
        pacingMeterSettings,
        (newState) => setPacingMeterState(newState),
        (isOptimal, currentWPM) => {
          // Handle pace change notifications
          console.log(`Pace change: ${currentWPM} WPM - ${isOptimal ? 'Optimal' : 'Off-pace'}`);
        }
      );
    }

    return () => {
      pacingMeterService.reset();
    };
  }, [scriptAnalysis, pacingMeterSettings]);

  // Initialize filler word detection service
  useEffect(() => {
    if (scriptAnalysis && fillerWordSettings.enabled) {
      fillerWordDetectionService.initialize(
        scriptAnalysis,
        fillerWordSettings,
        (detection) => {
          // Handle filler word detection
          setActiveFillerCues(prev => [...prev, detection]);
          
          // Auto-remove after 3 seconds
          setTimeout(() => {
            setActiveFillerCues(prev => prev.filter(cue => cue.timestamp !== detection.timestamp));
          }, 3000);
        },
        (newState) => setFillerWordState(newState)
      );
    }

    return () => {
      fillerWordDetectionService.reset();
    };
  }, [scriptAnalysis, fillerWordSettings]);

  // Set up speech recognition for pacing meter
  useEffect(() => {
    if (!pacingMeterSettings.enabled) return;

    const unsubscribeWordListener = speechRecognitionService.onWordRecognized(
      (word, confidence, timestamp) => {
        if (scriptAnalysis && pacingMeterState.sessionStartTime) {
          // Find word index in script
          const wordIndex = scriptAnalysis.words.findIndex(w => 
            w.word.toLowerCase().trim() === word.toLowerCase().trim()
          );
          
          if (wordIndex >= 0) {
            // Feed word timing to pacing meter service
            pacingMeterService.processWordTiming(wordIndex, word, timestamp, confidence);
          }
        }
      }
    );

    return unsubscribeWordListener;
  }, [pacingMeterSettings.enabled, scriptAnalysis, pacingMeterState.sessionStartTime]);

  // Set up speech recognition for filler word detection
  useEffect(() => {
    if (!fillerWordSettings.enabled) return;

    const unsubscribeWordListener = speechRecognitionService.onWordRecognized(
      (word, confidence, timestamp) => {
        if (scriptAnalysis && fillerWordState.sessionStartTime) {
          // Find word index in script
          const wordIndex = scriptAnalysis.words.findIndex(w => 
            w.word.toLowerCase().trim() === word.toLowerCase().trim()
          );
          
          // Feed word to filler word detection service
          fillerWordDetectionService.processSTTWord(word, confidence, timestamp, wordIndex);
        }
      }
    );

    return unsubscribeWordListener;
  }, [fillerWordSettings.enabled, scriptAnalysis, fillerWordState.sessionStartTime]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullscreen) {
        setShowControls(false);
      }
    }, 3000);
  }, [isFullscreen]);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    
    if (adaptiveScrollSettings.enabled && scriptAnalysis) {
      // Use adaptive scrolling
      setIsAdaptiveScrollActive(true);
      adaptiveScrollService.start();
      console.log('Adaptive scrolling started');
    } else {
      // Use traditional fixed-speed scrolling
      scrollIntervalRef.current = setInterval(() => {
        const scrollSpeed = (settings.speed / 100) * 2; // Normalized speed
        scrollPositionRef.current += scrollSpeed;
        
        scrollViewRef.current?.scrollTo({
          y: scrollPositionRef.current,
          animated: false,
        });
        
        // Update current paragraph based on scroll position
        const currentParagraph = Object.keys(paragraphRefs.current)
          .map(Number)
          .reverse()
          .find(index => scrollPositionRef.current >= paragraphRefs.current[index]) || 0;
        
        setState(prev => ({ ...prev, currentParagraph, currentPosition: scrollPositionRef.current }));
      }, 50);
    }
  }, [settings.speed, adaptiveScrollSettings.enabled, scriptAnalysis]);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    if (isAdaptiveScrollActive) {
      adaptiveScrollService.stop();
      setIsAdaptiveScrollActive(false);
      console.log('Adaptive scrolling stopped');
    }
  }, [isAdaptiveScrollActive]);

  const handleScrollToggle = () => {
    setSettings(prev => ({ ...prev, isScrolling: !prev.isScrolling }));
    if (isFullscreen) {
      resetControlsTimeout();
    }
  };

  const handleSettingChange = <K extends keyof TeleprompterSettings>(
    key: K,
    value: TeleprompterSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetScroll = () => {
    scrollPositionRef.current = 0;
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setSettings(prev => ({ ...prev, isScrolling: false }));
    setState(prev => ({ ...prev, currentPosition: 0, currentParagraph: 0 }));
    
    // Reset adaptive scrolling state
    adaptiveScrollService.reset();
    setIsAdaptiveScrollActive(false);
    setSpeechPaceMetrics({
      currentWPM: 0,
      averageWPM: 0,
      instantaneousWPM: 0,
      timeSinceLastWord: 0,
      speechDuration: 0,
      totalWordsSpoken: 0,
      isPaused: false,
      isAccelerating: false,
      paceTrend: 'stable',
      confidenceLevel: 1.0,
    });
    
    if (isFullscreen) {
      resetControlsTimeout();
    }
  };

  const jumpToParagraph = (paragraphIndex: number) => {
    const targetY = paragraphRefs.current[paragraphIndex] || 0;
    scrollPositionRef.current = targetY;
    scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    setState(prev => ({ ...prev, currentPosition: targetY, currentParagraph: paragraphIndex }));
    if (isFullscreen) {
      resetControlsTimeout();
    }
  };

  const jumpToNextParagraph = () => {
    const nextIndex = Math.min(state.currentParagraph + 1, paragraphs.length - 1);
    jumpToParagraph(nextIndex);
  };

  const jumpToPrevParagraph = () => {
    const prevIndex = Math.max(state.currentParagraph - 1, 0);
    jumpToParagraph(prevIndex);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setShowControls(true);
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
    if (isFullscreen && !showControls) {
      resetControlsTimeout();
    }
  };

  const applyColorPreset = (preset: typeof PRESET_COLORS[0]) => {
    setSettings(prev => ({
      ...prev,
      textColor: preset.text,
      backgroundColor: preset.background,
    }));
    setColorMenuVisible(false);
  };

  const applyCustomColors = () => {
    setSettings(prev => ({
      ...prev,
      textColor: customTextColor,
      backgroundColor: customBackgroundColor,
    }));
    setCustomColorModal(false);
  };

  const startKaraokeSession = () => {
    if (karaokeSettings.enabled) {
      karaokeService.start();
      setKaraokeState((prev: KaraokeState) => ({ ...prev, isActive: true }));
    }
  };

  const stopKaraokeSession = () => {
    karaokeService.stop();
    setKaraokeState((prev: KaraokeState) => ({ ...prev, isActive: false }));
  };

  const resetKaraokeSession = () => {
    karaokeService.reset();
  };

  // Pacing meter handlers
  const startPacingSession = () => {
    if (pacingMeterSettings.enabled && scriptAnalysis) {
      pacingMeterService.startSession();
      // Update state will be handled by the service callback
    }
  };

  const stopPacingSession = () => {
    const report = pacingMeterService.endSession();
    if (report) {
      // Merge with filler word data
      const fillerState = fillerWordDetectionService.getState();
      const completeReport: SessionSummaryReport = {
        ...report,
        fillerWords: fillerState.detectedFillers,
      };
      
      setSessionReport(completeReport);
      if (pacingMeterSettings.showSessionSummary) {
        setShowSessionSummary(true);
      }
    }
  };

  const resetPacingSession = () => {
    pacingMeterService.reset();
    setPacingMeterState({
      currentWPM: 0,
      targetWPM: pacingMeterSettings.targetWPM,
      isInOptimalRange: false,
      sessionStartTime: Date.now(),
      averageWPM: 0,
      wpmHistory: [],
      paceAnalysis: [],
    });
  };

  // Filler word handlers
  const startFillerDetectionSession = () => {
    if (fillerWordSettings.enabled && scriptAnalysis) {
      fillerWordDetectionService.startSession();
      // Update state will be handled by the service callback
    }
  };

  const stopFillerDetectionSession = () => {
    fillerWordDetectionService.endSession();
  };

  const resetFillerDetectionSession = () => {
    fillerWordDetectionService.reset();
    setFillerWordState({
      detectedFillers: [],
      totalFillerCount: 0,
      fillerRate: 0,
      sessionStartTime: Date.now(),
      commonFillers: {},
    });
    setActiveFillerCues([]);
  };

  // Session management
  const startAnalysisSession = () => {
    startPacingSession();
    startFillerDetectionSession();
  };

  const stopAnalysisSession = () => {
    stopPacingSession();
    stopFillerDetectionSession();
  };

  const resetAnalysisSession = () => {
    resetPacingSession();
    resetFillerDetectionSession();
  };

  // Settings handlers
  const handlePacingSettingsChange = (newSettings: PacingMeterSettings) => {
    setPacingMeterSettings(newSettings);
    pacingMeterService.updateSettings(newSettings);
  };

  const handleFillerSettingsChange = (newSettings: FillerWordSettings) => {
    setFillerWordSettings(newSettings);
    fillerWordDetectionService.updateSettings(newSettings);
  };

  // Speech recognition handlers
  const handleSpeechStart = () => {
    setShowSpeechPanel(true);
    if (karaokeSettings.enabled) {
      startKaraokeSession();
    }
    if (pacingMeterSettings.enabled || fillerWordSettings.enabled) {
      startAnalysisSession();
    }
  };

  const handleSpeechStop = () => {
    stopKaraokeSession();
    stopAnalysisSession();
  };

  const renderFormattedText = (text: string, paragraphIndex: number) => {
    // Simple markdown-like formatting
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    
    return (
      <View
        onLayout={(event) => {
          paragraphRefs.current[paragraphIndex] = event.nativeEvent.layout.y;
        }}
        style={styles.paragraphContainer}
      >
        {parts.map((part, index) => {
          const baseStyle = {
            fontSize: settings.fontSize,
            color: settings.textColor,
            fontFamily: settings.fontFamily,
            lineHeight: settings.fontSize * settings.lineHeight,
            textAlign: settings.textAlign as any,
          };

          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text
            return (
              <RNText key={`${paragraphIndex}-${index}`} style={[styles.scriptText, baseStyle, { fontWeight: 'bold' }]}>
                {part.slice(2, -2)}
              </RNText>
            );
          } else if (part.startsWith('*') && part.endsWith('*')) {
            // Italic text
            return (
              <RNText key={`${paragraphIndex}-${index}`} style={[styles.scriptText, baseStyle, { fontStyle: 'italic' }]}>
                {part.slice(1, -1)}
              </RNText>
            );
          } else {
            // Normal text
            return (
              <RNText key={`${paragraphIndex}-${index}`} style={[styles.scriptText, baseStyle]}>
                {part}
              </RNText>
            );
          }
        })}
      </View>
    );
  };

  if (!script) {
    return null;
  }

  const containerStyle = [
    styles.container,
    { backgroundColor: settings.backgroundColor },
    settings.isMirrored && styles.mirrored,
  ];

  const contentContainerStyle = [
    styles.contentContainer,
    { paddingHorizontal: settings.padding },
    isFullscreen && { paddingVertical: height * 0.2 },
  ];

  return (
    <View style={containerStyle}>
      <StatusBar 
        hidden={isFullscreen} 
        barStyle={settings.backgroundColor === '#000000' ? 'light-content' : 'dark-content'} 
      />
      
      {!isFullscreen && (
        <Surface style={styles.header} elevation={4}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            iconColor="#ffffff"
          />
          <Text variant="titleMedium" style={styles.headerTitle}>
            {script.title}
          </Text>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => setShowSettings(true)}
            iconColor="#ffffff"
          />
        </Surface>
      )}

      <View style={styles.teleprompterContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={contentContainerStyle}
          onScroll={(event) => {
            const { y } = event.nativeEvent.contentOffset;
            scrollPositionRef.current = y;
            
            // If adaptive scrolling is active, notify the service about manual scroll
            if (isAdaptiveScrollActive) {
              adaptiveScrollService.setUserScrollPosition(y);
            }
            
            // Update current paragraph based on scroll position
            const currentParagraph = Object.keys(paragraphRefs.current)
              .map(Number)
              .reverse()
              .find(index => y >= paragraphRefs.current[index]) || 0;
            
            setState(prev => ({ 
              ...prev, 
              currentParagraph,
              currentPosition: y,
              totalHeight: event.nativeEvent.contentSize.height,
            }));
          }}
          onLayout={(event) => {
            setState(prev => ({ 
              ...prev, 
              totalHeight: event.nativeEvent.layout.height,
            }));
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onTouchStart={() => {
            if (isFullscreen) {
              setShowControls(true);
              resetControlsTimeout();
            }
          }}
          onTouchEnd={() => {
            if (isFullscreen) {
              resetControlsTimeout();
            }
          }}
          onScrollBeginDrag={() => {
            // User started manual scrolling - this will be handled by main onScroll
          }}
          onScrollEndDrag={() => {
            // User finished manual scrolling - adaptive scroll will resume automatically
          }}
        >
          <View style={styles.textContainer}>
            {karaokeSettings.enabled ? (
              <KaraokeText
                content={script?.content || ''}
                karaokeState={karaokeState}
                scriptAnalysis={scriptAnalysis}
                settings={karaokeSettings}
                teleprompterSettings={settings}
                onWordLayout={(wordIndex, layout) => {
                  // Store word layout for precise scrolling
                }}
                onScrollRequest={(y) => {
                  scrollViewRef.current?.scrollTo({ y, animated: true });
                }}
              />
            ) : (
              <>
                {paragraphs.map((paragraph, index) => 
                  renderFormattedText(paragraph, index)
                )}
              </>
            )}
          </View>
          
          {/* Add extra space at the bottom for complete scrolling */}
          <View style={{ height: height * 0.8 }} />
        </ScrollView>

        {/* Progress indicator */}
        {isFullscreen && (
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${(state.currentPosition / Math.max(state.totalHeight - height, 1)) * 100}%`,
                  backgroundColor: settings.textColor,
                }
              ]} 
            />
          </View>
        )}

        {isFullscreen && (
          <Animated.View style={[styles.fullscreenOverlay, { opacity: fadeAnim }]}>
            <IconButton
              icon={showControls ? 'eye-off' : 'eye'}
              size={20}
              onPress={toggleControls}
              style={styles.toggleButton}
              iconColor={settings.textColor}
              containerColor={`${settings.backgroundColor}80`}
            />
            <Text style={[styles.paragraphIndicator, { color: settings.textColor }]}>
              {state.currentParagraph + 1} / {state.totalParagraphs}
            </Text>
          </Animated.View>
        )}
      </View>

      {showControls && (
        <Surface style={styles.controls} elevation={4}>
          <View style={styles.controlRow}>
            <IconButton
              icon={settings.isScrolling ? 'pause' : 'play'}
              size={32}
              mode="contained"
              onPress={handleScrollToggle}
              iconColor="#ffffff"
              containerColor={settings.isScrolling ? '#ef4444' : '#10b981'}
            />
            
            <IconButton
              icon="restart"
              size={24}
              mode="contained"
              onPress={resetScroll}
              iconColor="#ffffff"
              containerColor="#6366f1"
            />
            
            <IconButton
              icon="skip-previous"
              size={24}
              mode="contained"
              onPress={jumpToPrevParagraph}
              iconColor="#ffffff"
              containerColor="#8b5cf6"
              disabled={state.currentParagraph === 0}
            />
            
            <IconButton
              icon="skip-next"
              size={24}
              mode="contained"
              onPress={jumpToNextParagraph}
              iconColor="#ffffff"
              containerColor="#8b5cf6"
              disabled={state.currentParagraph >= paragraphs.length - 1}
            />

            <IconButton
              icon="microphone"
              size={24}
              mode="contained"
              onPress={handleSpeechStart}
              iconColor="#ffffff"
              containerColor="#f59e0b"
            />

            <IconButton
              icon="karaoke"
              size={24}
              mode="contained"
              onPress={() => setShowKaraokeSettings(true)}
              iconColor="#ffffff"
              containerColor={karaokeSettings.enabled ? "#10B981" : "#6B7280"}
            />

            <IconButton
              icon="speedometer"
              size={24}
              mode="contained"
              onPress={() => setShowPacingSettings(true)}
              iconColor="#ffffff"
              containerColor={pacingMeterSettings.enabled ? "#10B981" : "#6B7280"}
            />

            <IconButton
              icon="alert-circle"
              size={24}
              mode="contained"
              onPress={() => setShowSettings(true)} // Will add dedicated filler settings later
              iconColor="#ffffff"
              containerColor={fillerWordSettings.enabled ? "#F59E0B" : "#6B7280"}
            />

            <IconButton
              icon={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
              size={24}
              mode="contained"
              onPress={toggleFullscreen}
              iconColor="#ffffff"
              containerColor="#374151"
            />
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderRow}>
              <Text variant="labelMedium" style={styles.sliderLabel}>
                Speed: {settings.speed}%
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={200}
                value={settings.speed}
                onValueChange={(value) => handleSettingChange('speed', value)}
                step={10}
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#e5e7eb"
              />
            </View>
            
            <View style={styles.sliderRow}>
              <Text variant="labelMedium" style={styles.sliderLabel}>
                Font Size: {settings.fontSize}px
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={12}
                maximumValue={72}
                value={settings.fontSize}
                onValueChange={(value) => handleSettingChange('fontSize', value)}
                step={2}
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#e5e7eb"
              />
            </View>

            <View style={styles.switchRow}>
              <Text variant="labelMedium" style={styles.sliderLabel}>
                Mirror Text
              </Text>
              <Switch
                value={settings.isMirrored}
                onValueChange={(value) => handleSettingChange('isMirrored', value)}
                color="#6366f1"
              />
            </View>
          </View>

          {/* Speech Pace Metrics Display */}
          {isAdaptiveScrollActive && (
            <View style={styles.metricsContainer}>
              <Text variant="labelMedium" style={styles.metricsTitle}>
                Speech Pace Metrics
              </Text>
              <View style={styles.metricsRow}>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  Current WPM: {speechPaceMetrics.currentWPM.toFixed(0)}
                </Text>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  Average WPM: {speechPaceMetrics.averageWPM.toFixed(0)}
                </Text>
              </View>
              <View style={styles.metricsRow}>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  Pace: {speechPaceMetrics.paceTrend}
                </Text>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  Confidence: {Math.round(speechPaceMetrics.confidenceLevel * 100)}%
                </Text>
              </View>
              <View style={styles.metricsRow}>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  Scroll Speed: {scrollState.adaptiveSpeed.toFixed(0)}
                </Text>
                <Text variant="bodySmall" style={styles.metricLabel}>
                  {speechPaceMetrics.isPaused ? 'Paused' : 'Speaking'}
                </Text>
              </View>
            </View>
          )}
        </Surface>
      )}

      {/* Settings Modal */}
      <Portal>
        <Modal
          visible={showSettings}
          onDismiss={() => setShowSettings(false)}
          contentContainerStyle={styles.settingsModal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Teleprompter Settings
          </Text>

          {/* Font Family Selection */}
          <View style={styles.settingGroup}>
            <Text variant="titleMedium" style={styles.settingTitle}>Font Family</Text>
            <Menu
              visible={fontMenuVisible}
              onDismiss={() => setFontMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setFontMenuVisible(true)}
                  style={styles.settingButton}
                >
                  {FONT_FAMILIES.find(f => f.value === settings.fontFamily)?.label || 'Custom'}
                </Button>
              }
            >
              {FONT_FAMILIES.map((font) => (
                <Menu.Item
                  key={font.value}
                  onPress={() => {
                    handleSettingChange('fontFamily', font.value);
                    setFontMenuVisible(false);
                  }}
                  title={font.label}
                />
              ))}
            </Menu>
          </View>

          {/* Color Presets */}
          <View style={styles.settingGroup}>
            <Text variant="titleMedium" style={styles.settingTitle}>Color Scheme</Text>
            <Menu
              visible={colorMenuVisible}
              onDismiss={() => setColorMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setColorMenuVisible(true)}
                  style={styles.settingButton}
                >
                  Choose Color Scheme
                </Button>
              }
            >
              {PRESET_COLORS.map((preset, index) => (
                <Menu.Item
                  key={index}
                  onPress={() => applyColorPreset(preset)}
                  title={preset.label}
                />
              ))}
              <Divider />
              <Menu.Item
                onPress={() => {
                  setColorMenuVisible(false);
                  setCustomColorModal(true);
                }}
                title="Custom Colors..."
              />
            </Menu>
          </View>

          {/* Text Alignment */}
          <View style={styles.settingGroup}>
            <Text variant="titleMedium" style={styles.settingTitle}>Text Alignment</Text>
            <View style={styles.alignmentButtons}>
              {(['left', 'center', 'right'] as const).map((align) => (
                <Button
                  key={align}
                  mode={settings.textAlign === align ? 'contained' : 'outlined'}
                  onPress={() => handleSettingChange('textAlign', align)}
                  style={styles.alignmentButton}
                  compact
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </Button>
              ))}
            </View>
          </View>

          {/* Line Height */}
          <View style={styles.settingGroup}>
            <Text variant="titleMedium" style={styles.settingTitle}>
              Line Height: {settings.lineHeight.toFixed(1)}
            </Text>
            <Slider
              style={styles.modalSlider}
              minimumValue={1.0}
              maximumValue={3.0}
              value={settings.lineHeight}
              onValueChange={(value) => handleSettingChange('lineHeight', value)}
              step={0.1}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#e5e7eb"
            />
          </View>

          {/* Padding */}
          <View style={styles.settingGroup}>
            <Text variant="titleMedium" style={styles.settingTitle}>
              Padding: {settings.padding}px
            </Text>
            <Slider
              style={styles.modalSlider}
              minimumValue={8}
              maximumValue={64}
              value={settings.padding}
              onValueChange={(value) => handleSettingChange('padding', value)}
              step={8}
              minimumTrackTintColor="#6366f1"
              maximumTrackTintColor="#e5e7eb"
            />
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setSettings(DEFAULT_SETTINGS)}
              style={styles.modalButton}
            >
              Reset to Default
            </Button>
            <Button
              mode="contained"
              onPress={() => setShowSettings(false)}
              style={styles.modalButton}
            >
              Done
            </Button>
          </View>
        </Modal>

        {/* Custom Color Modal */}
        <Modal
          visible={customColorModal}
          onDismiss={() => setCustomColorModal(false)}
          contentContainerStyle={styles.settingsModal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Custom Colors
          </Text>

          <View style={styles.settingGroup}>
            <Text variant="titleMedium" style={styles.settingTitle}>Text Color</Text>
            <TextInput
              value={customTextColor}
              onChangeText={setCustomTextColor}
              placeholder="#FFFFFF"
              style={styles.colorInput}
            />
          </View>

          <View style={styles.settingGroup}>
            <Text variant="titleMedium" style={styles.settingTitle}>Background Color</Text>
            <TextInput
              value={customBackgroundColor}
              onChangeText={setCustomBackgroundColor}
              placeholder="#000000"
              style={styles.colorInput}
            />
          </View>

          <View style={styles.colorPreview}>
            <View
              style={[
                styles.colorPreviewBox,
                {
                  backgroundColor: customBackgroundColor,
                  borderColor: customTextColor,
                },
              ]}
            >
              <Text style={{ color: customTextColor, fontSize: 16 }}>
                Preview Text
              </Text>
            </View>
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setCustomColorModal(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={applyCustomColors}
              style={styles.modalButton}
            >
              Apply
            </Button>
          </View>
        </Modal>

        {/* Karaoke Settings Panel */}
        <KaraokeSettings
          visible={showKaraokeSettings}
          settings={karaokeSettings}
          onClose={() => setShowKaraokeSettings(false)}
          onSave={(newSettings) => {
            setKaraokeSettings(newSettings);
            
            // If karaoke was enabled/disabled, restart the service
            if (newSettings.enabled !== karaokeSettings.enabled) {
              if (newSettings.enabled && script?.content) {
                karaokeService.initialize(
                  script.content,
                  newSettings,
                  (newState) => setKaraokeState(newState),
                  (wordIndices) => {
                    setKaraokeState((prev: KaraokeState) => ({ ...prev, highlightedWords: wordIndices }));
                  }
                );
              } else {
                karaokeService.stop();
              }
            } else {
              karaokeService.updateSettings(newSettings);
            }
          }}
          onReset={() => {
            const defaultSettings: KaraokeHighlightSettings = {
              enabled: true,
              highlightColor: '#FFD700',
              highlightBackgroundColor: 'rgba(255, 215, 0, 0.3)',
              autoScroll: true,
              scrollOffset: 100,
              matchThreshold: 0.7,
              highlightDuration: 1500,
              animationDuration: 200,
              fadeOutDelay: 500,
            };
            setKaraokeSettings(defaultSettings);
          }}
        />

        {/* Adaptive Scroll Settings Panel */}
        <AdaptiveScrollSettingsModal
          visible={showAdaptiveScrollSettings}
          settings={adaptiveScrollSettings}
          onClose={() => setShowAdaptiveScrollSettings(false)}
          onSave={(newSettings) => {
            setAdaptiveScrollSettings(newSettings);
            
            // Update the adaptive scroll service settings
            adaptiveScrollService.updateSettings(newSettings);
            
            // If adaptive scrolling was enabled/disabled, restart if needed
            if (newSettings.enabled !== adaptiveScrollSettings.enabled) {
              if (newSettings.enabled && scriptAnalysis && isAdaptiveScrollActive) {              adaptiveScrollService.initialize(
                scriptAnalysis,
                newSettings,
                (position: number, velocity: number, metrics: SpeechPaceMetrics) => {
                  if (!scrollState.isUserControlled && isAdaptiveScrollActive) {
                    scrollViewRef.current?.scrollTo({
                      y: position,
                      animated: false,
                    });
                    setScrollState(adaptiveScrollService.getScrollState());
                  }
                },
                (metrics: SpeechPaceMetrics) => setSpeechPaceMetrics(metrics),
                (state: ScrollState) => setScrollState(state)
                );
              } else if (!newSettings.enabled) {
                adaptiveScrollService.stop();
                setIsAdaptiveScrollActive(false);
              }
            }
          }}
          onReset={() => {
            const defaultSettings: AdaptiveScrollSettings = {
              enabled: true,
              baseScrollSpeed: 50,
              responsiveness: 0.7,
              smoothingFactor: 0.8,
              pauseThreshold: 2.0,
              accelerationLimit: 3.0,
              decelerationLimit: 0.1,
              lookAheadWords: 5,
              bufferZone: 100,
            };
            setAdaptiveScrollSettings(defaultSettings);
            adaptiveScrollService.updateSettings(defaultSettings);
          }}
        />

        {/* Pacing Settings Panel */}
        <PacingSettings
          visible={showPacingSettings}
          onDismiss={() => setShowPacingSettings(false)}
          pacingSettings={pacingMeterSettings}
          fillerSettings={fillerWordSettings}
          onPacingSettingsChange={(newSettings: PacingMeterSettings) => {
            handlePacingSettingsChange(newSettings);
          }}
          onFillerSettingsChange={(newSettings: FillerWordSettings) => {
            handleFillerSettingsChange(newSettings);
          }}
        />

        {/* Session Summary Modal */}
        {sessionReport && (
          <SessionSummary
            report={sessionReport}
            visible={showSessionSummary}
            onDismiss={() => setShowSessionSummary(false)}
            onSaveReport={(report) => {
              // Could save to local storage or sync service
              console.log('Saving session report:', report);
            }}
            onStartNewSession={() => {
              resetAnalysisSession();
            }}
          />
        )}
      </Portal>

      {/* Speech Recognition Panel */}
      <SpeechRecognitionPanel
        visible={showSpeechPanel}
        onDismiss={() => setShowSpeechPanel(false)}
        onTranscriptUpdate={setPracticeTranscript}
        currentScript={script?.content || ''}
        settings={{
          backgroundColor: '#ffffff',
          textColor: '#374151',
        }}
      />

      {/* Pacing Meter */}
      <PacingMeter
        state={pacingMeterState}
        settings={pacingMeterSettings}
        isVisible={showPacingMeter}
        onToggleVisibility={() => setShowPacingMeter(!showPacingMeter)}
      />

      {/* Filler Word Cues */}
      {activeFillerCues.map((detection, index) => (
        <FillerWordCue
          key={`${detection.timestamp}-${index}`}
          detection={detection}
          settings={fillerWordSettings}
          onDismiss={() => {
            setActiveFillerCues(prev => 
              prev.filter(cue => cue.timestamp !== detection.timestamp)
            );
          }}
          style={{
            top: 100 + (index * 50), // Stack them vertically
            right: 20,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  teleprompterContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 32,
  },
  textContainer: {
    alignItems: 'center',
  },
  paragraphContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  scriptText: {
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  fullscreenOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  toggleButton: {
    zIndex: 10,
  },
  paragraphIndicator: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  controls: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  sliderContainer: {
    gap: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sliderLabel: {
    minWidth: 100,
    color: '#374151',
    fontWeight: '500',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  settingsModal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#374151',
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingTitle: {
    marginBottom: 8,
    color: '#374151',
  },
  settingButton: {
    marginBottom: 8,
  },
  alignmentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  alignmentButton: {
    flex: 1,
  },
  modalSlider: {
    width: '100%',
    height: 40,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
  colorInput: {
    marginBottom: 8,
  },
  colorPreview: {
    alignItems: 'center',
    marginVertical: 16,
  },
  colorPreviewBox: {
    width: 120,
    height: 60,
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#374151',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    color: '#374151',
    fontWeight: '400',
  },
});
