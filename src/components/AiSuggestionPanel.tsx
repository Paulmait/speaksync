import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  IconButton,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import GeminiAiService, { AiSuggestion, AiPromptingSettings } from '../services/geminiAiService';

interface AiSuggestionPanelProps {
  visible: boolean;
  position?: 'bottom' | 'center' | 'floating';
  style?: any;
  onSuggestionAccept?: (suggestion: AiSuggestion) => void;
  onSuggestionReject?: (suggestion: AiSuggestion) => void;
}

export default function AiSuggestionPanel({
  visible,
  position = 'bottom',
  style,
  onSuggestionAccept,
  onSuggestionReject,
}: AiSuggestionPanelProps) {
  const [currentSuggestion, setCurrentSuggestion] = useState<AiSuggestion | null>(null);
  const [settings, setSettings] = useState<AiPromptingSettings | null>(null);
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const geminiService = GeminiAiService.getInstance();

    const handleSuggestion = (suggestion: AiSuggestion) => {
      setCurrentSuggestion(suggestion);
      showSuggestion();
    };

    // Load settings
    setSettings(geminiService.getSettings());

    geminiService.addSuggestionListener(handleSuggestion);

    return () => {
      geminiService.removeSuggestionListener(handleSuggestion);
    };
  }, []);

  const showSuggestion = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after 10 seconds if no interaction
    setTimeout(() => {
      if (currentSuggestion) {
        hideSuggestion();
      }
    }, 10000);
  };

  const hideSuggestion = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentSuggestion(null);
    });
  };

  const handleAccept = () => {
    if (currentSuggestion && onSuggestionAccept) {
      onSuggestionAccept(currentSuggestion);
    }
    hideSuggestion();
  };

  const handleReject = () => {
    if (currentSuggestion && onSuggestionReject) {
      onSuggestionReject(currentSuggestion);
    }
    hideSuggestion();
  };

  const getSuggestionIcon = (type: AiSuggestion['type']) => {
    switch (type) {
      case 'next_phrase':
        return 'play-arrow';
      case 'transition':
        return 'trending-flat';
      case 'rephrase':
        return 'refresh';
      case 'continuation':
        return 'more-horiz';
      default:
        return 'lightbulb';
    }
  };

  const getSuggestionColor = (type: AiSuggestion['type']) => {
    switch (type) {
      case 'next_phrase':
        return '#10B981';
      case 'transition':
        return '#3B82F6';
      case 'rephrase':
        return '#F59E0B';
      case 'continuation':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      left: 20,
      right: 20,
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom':
        return {
          ...baseStyle,
          bottom: 100,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            },
          ],
        };
      case 'center':
        return {
          ...baseStyle,
          top: '50%',
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, -50],
              }),
            },
          ],
        };
      case 'floating':
        return {
          ...baseStyle,
          bottom: 200,
          transform: [
            {
              scale: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
        };
      default:
        return baseStyle;
    }
  };

  if (!visible || !currentSuggestion || !settings?.enabled) {
    return null;
  }

  return (
    <Animated.View
      style={[
        getPositionStyle(),
        {
          opacity: fadeAnim,
        },
        style,
      ]}
    >
      <Surface style={styles.container} elevation={4}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name={getSuggestionIcon(currentSuggestion.type)}
              size={20}
              color={getSuggestionColor(currentSuggestion.type)}
            />
          </View>
          <View style={styles.headerText}>
            <Text variant="labelSmall" style={styles.aiLabel}>
              AI Assistant
            </Text>
            <Text variant="labelSmall" style={styles.reasoning}>
              {currentSuggestion.reasoning}
            </Text>
          </View>
          <IconButton
            icon="close"
            size={16}
            onPress={handleReject}
            style={styles.closeButton}
          />
        </View>

        <View style={styles.suggestionContainer}>
          <Text variant="bodyMedium" style={styles.suggestionText}>
            "{currentSuggestion.text}"
          </Text>
          
          <View style={styles.confidenceContainer}>
            <Text variant="labelSmall" style={styles.confidenceText}>
              Confidence: {Math.round(currentSuggestion.confidence * 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleReject}
            style={styles.rejectButton}
            labelStyle={styles.buttonLabel}
          >
            Dismiss
          </Button>
          <Button
            mode="contained"
            onPress={handleAccept}
            style={[styles.acceptButton, { backgroundColor: getSuggestionColor(currentSuggestion.type) }]}
            labelStyle={styles.buttonLabel}
          >
            Use Suggestion
          </Button>
        </View>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  aiLabel: {
    fontWeight: 'bold',
    color: '#374151',
  },
  reasoning: {
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    margin: 0,
  },
  suggestionContainer: {
    marginBottom: 16,
  },
  suggestionText: {
    fontStyle: 'italic',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  confidenceContainer: {
    alignSelf: 'flex-start',
  },
  confidenceText: {
    color: '#6B7280',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    borderColor: '#D1D5DB',
  },
  acceptButton: {
    flex: 2,
  },
  buttonLabel: {
    fontSize: 13,
  },
});
