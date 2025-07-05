import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  List,
  Switch,
  Button,
  Divider,
  Surface,
  Badge,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useScriptStore } from '../store/scriptStore';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { authState, syncState, signOut, syncScripts, retryFailedOperations } = useScriptStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Any unsynced changes will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled by auth state listener
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to sign out. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    try {
      await syncScripts();
      Alert.alert('Success', 'Scripts synced successfully!');
    } catch (error) {
      Alert.alert('Sync Failed', 'Failed to sync scripts. Please try again.');
    }
  };

  const handleRetryFailedOperations = async () => {
    try {
      await retryFailedOperations();
      Alert.alert('Success', 'Retry completed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to retry operations. Please try again.');
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Profile & Settings
        </Text>
      </Surface>

      {/* User Info */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text variant="headlineMedium" style={styles.avatarText}>
                {authState.user?.displayName?.[0]?.toUpperCase() || 
                 authState.user?.email?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text variant="titleMedium" style={styles.userName}>
                {authState.user?.displayName || 'User'}
              </Text>
              <Text variant="bodyMedium" style={styles.userEmail}>
                {authState.user?.email}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Sync Status */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Sync Status
          </Text>
          
          <List.Item
            title="Connection Status"
            description={syncState.isOnline ? 'Online' : 'Offline'}
            left={() => (
              <List.Icon 
                icon={syncState.isOnline ? 'wifi' : 'wifi-off'} 
                color={syncState.isOnline ? '#10b981' : '#ef4444'}
              />
            )}
            right={() => (
              <Badge 
                style={[
                  styles.statusBadge,
                  { backgroundColor: syncState.isOnline ? '#10b981' : '#ef4444' }
                ]}
              >
                {syncState.isOnline ? 'Online' : 'Offline'}
              </Badge>
            )}
          />

          <List.Item
            title="Last Sync"
            description={formatLastSync(syncState.lastSyncAt)}
            left={() => <List.Icon icon="sync" />}
            right={() => 
              syncState.isSyncing ? (
                <Badge style={[styles.statusBadge, { backgroundColor: '#f59e0b' }]}>
                  Syncing...
                </Badge>
              ) : null
            }
          />

          {syncState.pendingOperations > 0 && (
            <List.Item
              title="Pending Operations"
              description={`${syncState.pendingOperations} changes waiting to sync`}
              left={() => <List.Icon icon="clock-outline" color="#f59e0b" />}
              right={() => (
                <Badge style={[styles.statusBadge, { backgroundColor: '#f59e0b' }]}>
                  {syncState.pendingOperations}
                </Badge>
              )}
            />
          )}

          {syncState.syncErrors.length > 0 && (
            <List.Item
              title="Sync Errors"
              description={`${syncState.syncErrors.length} failed operations`}
              left={() => <List.Icon icon="alert-circle" color="#ef4444" />}
              right={() => (
                <Badge style={[styles.statusBadge, { backgroundColor: '#ef4444' }]}>
                  {syncState.syncErrors.length}
                </Badge>
              )}
            />
          )}
        </Card.Content>
      </Card>

      {/* Sync Actions */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Sync Actions
          </Text>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleManualSync}
              disabled={syncState.isSyncing || !syncState.isOnline}
              loading={syncState.isSyncing}
              style={styles.actionButton}
              icon="sync"
            >
              Manual Sync
            </Button>

            {syncState.syncErrors.length > 0 && (
              <Button
                mode="outlined"
                onPress={handleRetryFailedOperations}
                disabled={syncState.isSyncing}
                style={styles.actionButton}
                icon="refresh"
              >
                Retry Failed Operations
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* App Info */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            About
          </Text>
          
          <List.Item
            title="Version"
            description="1.0.0"
            left={() => <List.Icon icon="information" />}
          />
          
          <List.Item
            title="Storage"
            description="Local + Cloud Sync"
            left={() => <List.Icon icon="database" />}
          />
        </Card.Content>
      </Card>

      {/* Sign Out */}
      <View style={styles.signOutContainer}>
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          labelStyle={styles.signOutButtonLabel}
          icon="logout"
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#6366f1',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#1f2937',
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#6b7280',
  },
  sectionTitle: {
    color: '#1f2937',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'center',
  },
  actionButtons: {
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 4,
  },
  signOutContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  signOutButton: {
    borderColor: '#ef4444',
    paddingVertical: 8,
  },
  signOutButtonLabel: {
    color: '#ef4444',
  },
});
