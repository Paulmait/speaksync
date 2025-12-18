import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Appbar, 
  useTheme,
  Portal,
  Dialog,
  Button,
  TextInput,
  ActivityIndicator,
  Paragraph,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TeamSelector, TeamMembers, SubscriptionManager } from '../components/team';
import { Team, TeamRole } from '../types';
import { UserSubscription, TierFeatureMapping, SubscriptionTier } from '../types/subscriptionTypes';
import { teamService, subscriptionService } from '../services';

export const TeamManagementScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  
  // For now, using a placeholder user until store is properly set up
  const user = { uid: 'placeholder-user-id', email: 'user@example.com' };
  
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [createTeamDialogVisible, setCreateTeamDialogVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('teams');

  const tabs = [
    { value: 'teams', label: 'Teams', icon: 'account-group' },
    { value: 'members', label: 'Members', icon: 'account-multiple' },
    { value: 'subscription', label: 'Subscription', icon: 'credit-card' },
  ];

  useEffect(() => {
    loadInitialData();
  }, [user]);

  useEffect(() => {
    if (currentTeam && user) {
      loadUserRole();
    }
  }, [currentTeam, user]);

  const loadInitialData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load subscription
      const userSubscription = await subscriptionService.getSubscription(user.uid);
      setSubscription(userSubscription);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = async () => {
    if (!currentTeam || !user) return;
    
    try {
      const role = await teamService.getUserRole(currentTeam.id, user.uid);
      setCurrentUserRole(role);
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !subscription) return;
    
    if (!newTeamName.trim()) {
      return;
    }

    try {
      setCreating(true);
      
      const teamId = await teamService.createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined,
        ownerId: user.uid,
        subscriptionTier: subscription.subscriptionTier as any,
      });

      const newTeam = await teamService.getTeam(teamId);
      if (newTeam) {
        setCurrentTeam(newTeam);
        setCurrentUserRole('owner');
      }

      setCreateTeamDialogVisible(false);
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setCreating(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'teams':
        return (
          <TeamSelector
            currentTeam={currentTeam}
            onTeamSelect={setCurrentTeam}
            userId={user?.uid || ''}
          />
        );
      case 'members':
        return currentTeam && currentUserRole ? (
          <TeamMembers
            team={currentTeam}
            currentUserId={user?.uid || ''}
            currentUserRole={currentUserRole}
          />
        ) : (
          <View style={[styles.emptyState, styles.centered]}>
            <Paragraph style={styles.emptyText}>
              Select a team to manage members
            </Paragraph>
          </View>
        );
      case 'subscription':
        return (
          <SubscriptionManager
            userId={user?.uid || ''}
            subscription={subscription}
            onSubscriptionUpdate={setSubscription}
          />
        );
      default:
        return null;
    }
  };

  const canCreateTeam = subscription
    ? TierFeatureMapping[subscription.subscriptionTier]?.teamCollaboration
    : false;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>Loading team data...</Paragraph>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Team Management" />
        {activeTab === 'teams' && canCreateTeam && (
          <Appbar.Action
            icon="plus"
            onPress={() => setCreateTeamDialogVisible(true)}
          />
        )}
      </Appbar.Header>

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={tabs}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>

      <Portal>
        <Dialog
          visible={createTeamDialogVisible}
          onDismiss={() => setCreateTeamDialogVisible(false)}
        >
          <Dialog.Title>Create New Team</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Team Name"
              value={newTeamName}
              onChangeText={setNewTeamName}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
            />
            <TextInput
              label="Description (Optional)"
              value={newTeamDescription}
              onChangeText={setNewTeamDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateTeamDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleCreateTeam}
              loading={creating}
              disabled={creating || !newTeamName.trim()}
            >
              Create Team
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
});

export default TeamManagementScreen;
