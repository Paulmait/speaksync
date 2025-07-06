import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  FAB,
  IconButton,
  Searchbar,
  Surface,
  Banner,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useScriptStore } from '../store/scriptStore';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';
import { FeatureGate } from '../components/subscription/FeatureGate';
import { UsageTracker } from '../components/subscription/UsageTracker';
import BrandedHeader from '../components/ui/BrandedHeader';
import { RootStackParamList, Script } from '../types';
import { SubscriptionTier, CtaType } from '../types/subscriptionTypes';
import { BRAND_COLORS } from '../constants/branding';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { scripts, deleteScript, syncState, syncScripts } = useScriptStore();
  const { 
    checkFeatureAccess, 
    checkFreeLimit, 
    getCurrentTier, 
    getFreeTierUsage,
    getCtaMessage 
  } = useSubscriptionContext();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  // Filter out deleted scripts and apply search
  const visibleScripts = scripts.filter(script => !script.isDeleted);
  const filteredScripts = visibleScripts.filter((script) =>
    script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    script.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get usage info for free tier users
  const currentTier = getCurrentTier();
  const freeTierUsage = getFreeTierUsage();
  const isFreeTier = currentTier === SubscriptionTier.FREE;
  const hasReachedScriptLimit = checkFreeLimit('scripts');

  const handleAddScript = () => {
    // Check if free user has reached script limit
    if (isFreeTier && hasReachedScriptLimit) {
      const ctaMessage = getCtaMessage(CtaType.SCRIPT_LIMIT);
      Alert.alert(
        ctaMessage.title,
        ctaMessage.description,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: ctaMessage.buttonText,
            onPress: () => navigation.navigate('Subscription'),
          },
        ]
      );
      return;
    }
    
    navigation.navigate('ScriptEditor', {});
  };

  const handleEditScript = (scriptId: string) => {
    navigation.navigate('ScriptEditor', { scriptId });
  };

  const handleOpenTeleprompter = (scriptId: string) => {
    navigation.navigate('Teleprompter', { scriptId });
  };

  const handleDeleteScript = (script: Script) => {
    Alert.alert(
      'Delete Script',
      `Are you sure you want to delete "${script.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteScript(script.id),
        },
      ]
    );
  };

  const handleManualSync = async () => {
    try {
      await syncScripts();
    } catch (error) {
      Alert.alert('Sync Failed', 'Unable to sync scripts. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSyncStatusIcon = (syncStatus: Script['syncStatus']) => {
    switch (syncStatus) {
      case 'synced': return 'check-circle';
      case 'pending': return 'clock-outline';
      case 'conflict': return 'alert-circle';
      case 'error': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getSyncStatusColor = (syncStatus: Script['syncStatus']) => {
    switch (syncStatus) {
      case 'synced': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'conflict': return '#f97316';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderScript = ({ item }: { item: Script }) => (
    <Card style={styles.scriptCard} mode="elevated">
      <Card.Content>
        <View style={styles.scriptHeader}>
          <View style={styles.scriptTitleContainer}>
            <Text variant="titleMedium" style={styles.scriptTitle}>
              {item.title}
            </Text>
            <View style={styles.scriptMetadata}>
              <IconButton
                icon={getSyncStatusIcon(item.syncStatus)}
                size={16}
                iconColor={getSyncStatusColor(item.syncStatus)}
                style={styles.syncIcon}
              />
              {item.syncStatus !== 'synced' && (
                <Chip 
                  mode="outlined" 
                  compact 
                  style={[styles.statusChip, { borderColor: getSyncStatusColor(item.syncStatus) }]}
                  textStyle={{ color: getSyncStatusColor(item.syncStatus), fontSize: 10 }}
                >
                  {item.syncStatus}
                </Chip>
              )}
            </View>
          </View>
          <View style={styles.scriptActions}>
            <IconButton
              icon="play"
              mode="contained"
              iconColor="#ffffff"
              containerColor="#10b981"
              size={20}
              onPress={() => handleOpenTeleprompter(item.id)}
            />
            <IconButton
              icon="pencil"
              mode="contained"
              iconColor="#ffffff"
              containerColor="#6366f1"
              size={20}
              onPress={() => handleEditScript(item.id)}
            />
            <IconButton
              icon="delete"
              mode="contained"
              iconColor="#ffffff"
              containerColor="#ef4444"
              size={20}
              onPress={() => handleDeleteScript(item)}
            />
          </View>
        </View>
        <Text variant="bodyMedium" style={styles.scriptPreview} numberOfLines={2}>
          {item.content || 'No content'}
        </Text>
        <Text variant="bodySmall" style={styles.scriptDate}>
          Last updated: {formatDate(item.updatedAt)}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <Surface style={styles.emptyState}>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No scripts yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Create your first script to get started with teleprompter practice
      </Text>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <BrandedHeader
        title="SpeakSync"
        showLogo={true}
        rightAction={{
          icon: "account-circle",
          onPress: () => navigation.navigate('Profile'),
          testID: "profile-button"
        }}
      />
      
      {/* Offline Banner */}
      {!syncState.isOnline && (
        <Banner
          visible={true}
          actions={[]}
          icon="wifi-off"
          style={styles.offlineBanner}
        >
          You're offline. Changes will sync when connection is restored.
        </Banner>
      )}

      {/* Sync Status Banner */}
      {syncState.pendingOperations > 0 && syncState.isOnline && (
        <Banner
          visible={true}
          actions={[
            {
              label: 'Sync Now',
              onPress: handleManualSync,
            },
          ]}
          icon="sync"
          style={styles.syncBanner}
        >
          {syncState.pendingOperations} changes waiting to sync
        </Banner>
      )}

      {/* Sync Errors Banner */}
      {syncState.syncErrors.length > 0 && (
        <Banner
          visible={true}
          actions={[
            {
              label: 'View',
              onPress: () => navigation.navigate('Profile'),
            },
          ]}
          icon="alert-circle"
          style={styles.errorBanner}
        >
          Some changes failed to sync
        </Banner>
      )}

      {/* Header with Analytics button */}
      <Surface style={styles.headerSurface}>
        <View style={styles.headerContainer}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            My Scripts
          </Text>
          <FeatureGate 
            feature="analytics"
            onUpgrade={() => navigation.navigate('Subscription')}
            fallback={
              <IconButton
                icon="chart-line"
                mode="contained-tonal"
                iconColor="#9ca3af"
                containerColor="#e5e7eb"
                size={20}
                onPress={() => {
                  const ctaMessage = getCtaMessage(CtaType.FEATURE_LOCKED);
                  Alert.alert(
                    ctaMessage.title,
                    ctaMessage.description,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: ctaMessage.buttonText, 
                        onPress: () => navigation.navigate('Subscription') 
                      }
                    ]
                  );
                }}
              />
            }
          >
            <IconButton
              icon="chart-line"
              mode="contained"
              iconColor="#ffffff"
              containerColor="#6366f1"
              size={20}
              onPress={() => navigation.navigate('Analytics')}
            />
          </FeatureGate>
        </View>
      </Surface>

      {/* Usage Tracker for Free Tier */}
      {isFreeTier && (
        <UsageTracker 
          type="scripts"
          onUpgrade={() => navigation.navigate('Subscription')}
        />
      )}

      <Searchbar
        placeholder="Search scripts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {filteredScripts.length === 0 && searchQuery === '' ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredScripts}
          renderItem={renderScript}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddScript}
        label="New Script"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  offlineBanner: {
    backgroundColor: '#fef3c7',
  },
  syncBanner: {
    backgroundColor: '#dbeafe',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  scriptCard: {
    marginBottom: 12,
    elevation: 3,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scriptTitleContainer: {
    flex: 1,
  },
  scriptTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  scriptMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncIcon: {
    margin: 0,
    padding: 0,
  },
  statusChip: {
    height: 20,
  },
  scriptActions: {
    flexDirection: 'row',
    gap: 4,
  },
  scriptPreview: {
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  scriptDate: {
    color: '#9ca3af',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    padding: 32,
    borderRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6366f1',
  },
  headerSurface: {
    elevation: 2,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
});
