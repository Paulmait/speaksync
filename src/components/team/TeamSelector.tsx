import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Chip, 
  IconButton, 
  Menu, 
  Avatar,
  useTheme,
  ActivityIndicator,
  Button,
  Divider
} from 'react-native-paper';
import { Team, TeamMember, TeamRole } from '../../types';
import { teamService } from '../../services';

interface TeamSelectorProps {
  currentTeam: Team | null;
  onTeamSelect: (team: Team | null) => void;
  userId: string;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  currentTeam,
  onTeamSelect,
  userId,
}) => {
  const theme = useTheme();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadTeams();
  }, [userId]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const userTeams = await teamService.getUserTeams(userId);
      setTeams(userTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: TeamRole) => {
    switch (role) {
      case 'owner': return theme.colors.error;
      case 'admin': return theme.colors.primary;
      case 'editor': return theme.colors.tertiary;
      case 'viewer': return theme.colors.outline;
      default: return theme.colors.outline;
    }
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner': return 'crown';
      case 'admin': return 'shield-account';
      case 'editor': return 'pencil';
      case 'viewer': return 'eye';
      default: return 'account';
    }
  };

  const renderTeamItem = ({ item }: { item: Team }) => (
    <TouchableOpacity
      onPress={() => onTeamSelect(item)}
      style={[
        styles.teamItem,
        currentTeam?.id === item.id && {
          backgroundColor: theme.colors.primaryContainer,
          borderColor: theme.colors.primary,
        },
      ]}
    >
      <View style={styles.teamHeader}>
        <Avatar.Text
          size={40}
          label={item.name.charAt(0).toUpperCase()}
          style={{ backgroundColor: theme.colors.secondary }}
        />
        <View style={styles.teamInfo}>
          <Title style={styles.teamName}>{item.name}</Title>
          {item.description && (
            <Paragraph style={styles.teamDescription} numberOfLines={2}>
              {item.description}
            </Paragraph>
          )}
        </View>
      </View>
      
      <View style={styles.teamStats}>
        <Chip 
          icon="account-group" 
          style={styles.statChip}
          textStyle={styles.statText}
        >
          {item.stats.memberCount} members
        </Chip>
        <Chip 
          icon="file-document" 
          style={styles.statChip}
          textStyle={styles.statText}
        >
          {item.stats.scriptCount} scripts
        </Chip>
        <Chip 
          icon="folder" 
          style={styles.statChip}
          textStyle={styles.statText}
        >
          {item.stats.folderCount} folders
        </Chip>
      </View>

      <View style={styles.subscriptionBadge}>
        <Chip 
          style={[
            styles.tierChip,
            { backgroundColor: getTierColor(item.subscriptionTier) }
          ]}
          textStyle={[styles.tierText, { color: theme.colors.onPrimary }]}
        >
          {item.subscriptionTier.toUpperCase()}
        </Chip>
      </View>
    </TouchableOpacity>
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return theme.colors.outline;
      case 'personal': return theme.colors.primary;
      case 'business': return theme.colors.tertiary;
      case 'enterprise': return theme.colors.secondary;
      default: return theme.colors.outline;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>Loading teams...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title>Select Team</Title>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              onTeamSelect(null);
            }}
            title="Personal Scripts"
            leadingIcon="account"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              loadTeams();
            }}
            title="Refresh"
            leadingIcon="refresh"
          />
        </Menu>
      </View>

      <Divider />

      <TouchableOpacity
        onPress={() => onTeamSelect(null)}
        style={[
          styles.personalOption,
          !currentTeam && {
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <Avatar.Icon
          size={40}
          icon="account"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <View style={styles.teamInfo}>
          <Title style={styles.teamName}>Personal Scripts</Title>
          <Paragraph style={styles.teamDescription}>
            Your private scripts
          </Paragraph>
        </View>
      </TouchableOpacity>

      <Divider style={styles.divider} />

      {teams.length === 0 ? (
        <View style={styles.emptyState}>
          <Paragraph style={styles.emptyText}>
            No teams found. Create or join a team to collaborate!
          </Paragraph>
          <Button 
            mode="contained" 
            onPress={loadTeams}
            style={styles.refreshButton}
          >
            Refresh
          </Button>
        </View>
      ) : (
        <FlatList
          data={teams}
          renderItem={renderTeamItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.teamsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  personalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  teamsList: {
    padding: 16,
  },
  teamItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  teamStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statChip: {
    height: 28,
  },
  statText: {
    fontSize: 12,
  },
  subscriptionBadge: {
    alignItems: 'flex-end',
  },
  tierChip: {
    height: 24,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.7,
  },
  refreshButton: {
    marginTop: 8,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
});

export default TeamSelector;
