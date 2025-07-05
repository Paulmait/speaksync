import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { Script } from '../types';

interface ConflictResolutionProps {
  localScript: Script;
  remoteScript: Script;
  onResolve: (resolution: 'local' | 'remote') => void;
  onCancel: () => void;
}

export default function ConflictResolution({
  localScript,
  remoteScript,
  onResolve,
  onCancel
}: ConflictResolutionProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Sync Conflict Detected
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            This script has been modified both locally and remotely. 
            Please choose which version to keep:
          </Text>

          <View style={styles.versionsContainer}>
            {/* Local Version */}
            <Card style={styles.versionCard} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium" style={styles.versionTitle}>
                  📱 Local Version
                </Text>
                <Text variant="bodySmall" style={styles.versionDate}>
                  Modified: {formatDate(localScript.updatedAt)}
                </Text>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.contentTitle}>
                  Title:
                </Text>
                <Text variant="bodyMedium" style={styles.contentText}>
                  {localScript.title}
                </Text>
                <Text variant="titleSmall" style={styles.contentTitle}>
                  Content Preview:
                </Text>
                <Text 
                  variant="bodyMedium" 
                  style={styles.contentText}
                  numberOfLines={3}
                >
                  {localScript.content || 'No content'}
                </Text>
              </Card.Content>
            </Card>

            {/* Remote Version */}
            <Card style={styles.versionCard} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium" style={styles.versionTitle}>
                  ☁️ Cloud Version
                </Text>
                <Text variant="bodySmall" style={styles.versionDate}>
                  Modified: {formatDate(remoteScript.updatedAt)}
                </Text>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.contentTitle}>
                  Title:
                </Text>
                <Text variant="bodyMedium" style={styles.contentText}>
                  {remoteScript.title}
                </Text>
                <Text variant="titleSmall" style={styles.contentTitle}>
                  Content Preview:
                </Text>
                <Text 
                  variant="bodyMedium" 
                  style={styles.contentText}
                  numberOfLines={3}
                >
                  {remoteScript.content || 'No content'}
                </Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => onResolve('local')}
              style={[styles.button, styles.localButton]}
              labelStyle={styles.localButtonText}
            >
              Keep Local
            </Button>
            <Button
              mode="outlined"
              onPress={() => onResolve('remote')}
              style={[styles.button, styles.remoteButton]}
              labelStyle={styles.remoteButtonText}
            >
              Keep Cloud
            </Button>
          </View>

          <Button
            mode="text"
            onPress={onCancel}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonText}
          >
            Cancel
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    elevation: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b7280',
    lineHeight: 20,
  },
  versionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  versionCard: {
    borderWidth: 2,
  },
  versionTitle: {
    marginBottom: 4,
    fontWeight: 'bold',
    color: '#374151',
  },
  versionDate: {
    marginBottom: 12,
    color: '#9ca3af',
  },
  divider: {
    marginBottom: 12,
  },
  contentTitle: {
    marginBottom: 4,
    marginTop: 8,
    fontWeight: '600',
    color: '#374151',
  },
  contentText: {
    marginBottom: 8,
    color: '#6b7280',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
  },
  localButton: {
    borderColor: '#6366f1',
  },
  localButtonText: {
    color: '#6366f1',
  },
  remoteButton: {
    borderColor: '#10b981',
  },
  remoteButtonText: {
    color: '#10b981',
  },
  cancelButton: {
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#6b7280',
  },
});
