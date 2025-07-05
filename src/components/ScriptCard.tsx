import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { Script } from '../types';

interface ScriptCardProps {
  script: Script;
  onEdit: (scriptId: string) => void;
  onDelete: (script: Script) => void;
  onOpenTeleprompter: (scriptId: string) => void;
}

export default function ScriptCard({ 
  script, 
  onEdit, 
  onDelete, 
  onOpenTeleprompter 
}: ScriptCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {script.title}
          </Text>
          <View style={styles.actions}>
            <IconButton
              icon="play"
              mode="contained"
              iconColor="#ffffff"
              containerColor="#10b981"
              size={20}
              onPress={() => onOpenTeleprompter(script.id)}
            />
            <IconButton
              icon="pencil"
              mode="contained"
              iconColor="#ffffff"
              containerColor="#6366f1"
              size={20}
              onPress={() => onEdit(script.id)}
            />
            <IconButton
              icon="delete"
              mode="contained"
              iconColor="#ffffff"
              containerColor="#ef4444"
              size={20}
              onPress={() => onDelete(script)}
            />
          </View>
        </View>
        <Text variant="bodyMedium" style={styles.preview} numberOfLines={2}>
          {script.content || 'No content'}
        </Text>
        <Text variant="bodySmall" style={styles.date}>
          Last updated: {formatDate(script.updatedAt)}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  preview: {
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  date: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
