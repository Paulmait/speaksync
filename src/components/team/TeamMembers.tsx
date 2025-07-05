import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Share } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Avatar,
  Chip,
  IconButton,
  Menu,
  Button,
  Dialog,
  Portal,
  TextInput,
  List,
  Divider,
  ActivityIndicator,
  useTheme,
  FAB,
} from 'react-native-paper';
import { TeamMember, TeamRole, TeamInvitation, Team } from '../../types';
import { teamService } from '../../services';

interface TeamMembersProps {
  team: Team;
  currentUserId: string;
  currentUserRole: TeamRole;
}

export const TeamMembers: React.FC<TeamMembersProps> = ({
  team,
  currentUserId,
  currentUserRole,
}) => {
  const theme = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberMenuVisible, setMemberMenuVisible] = useState(false);

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, [team.id]);

  const loadMembers = async () => {
    try {
      const teamMembers = await teamService.getTeamMembers(team.id);
      setMembers(teamMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      Alert.alert('Error', 'Failed to load team members');
    }
  };

  const loadInvitations = async () => {
    try {
      // This would need to be implemented in teamService
      // const teamInvitations = await teamService.getTeamInvitations(team.id);
      // setInvitations(teamInvitations);
      setInvitations([]);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canInviteMembers = canManageMembers || team.settings.allowMemberInvites;

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setInviting(true);
      await teamService.inviteMember(
        team.id,
        inviteEmail.trim(),
        inviteRole,
        currentUserId,
        'Team Member', // This should come from user data
        inviteMessage.trim() || undefined
      );

      Alert.alert('Success', 'Invitation sent successfully!');
      setInviteDialogVisible(false);
      setInviteEmail('');
      setInviteMessage('');
      setInviteRole('viewer');
      loadInvitations();
    } catch (error) {
      console.error('Error inviting member:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (member.userId === currentUserId) {
      Alert.alert(
        'Leave Team',
        'Are you sure you want to leave this team?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => removeMember(member),
          },
        ]
      );
    } else {
      Alert.alert(
        'Remove Member',
        `Are you sure you want to remove ${member.displayName || member.email} from the team?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeMember(member),
          },
        ]
      );
    }
  };

  const removeMember = async (member: TeamMember) => {
    try {
      await teamService.removeMember(team.id, member.userId, currentUserId);
      Alert.alert('Success', 'Member removed successfully');
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Error', 'Failed to remove member');
    }
  };

  const handleChangeRole = (member: TeamMember, newRole: TeamRole) => {
    Alert.alert(
      'Change Role',
      `Change ${member.displayName || member.email}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: () => changeRole(member, newRole),
        },
      ]
    );
  };

  const changeRole = async (member: TeamMember, newRole: TeamRole) => {
    try {
      await teamService.updateMemberRole(team.id, member.userId, newRole, currentUserId);
      Alert.alert('Success', 'Member role updated successfully');
      loadMembers();
    } catch (error) {
      console.error('Error changing role:', error);
      Alert.alert('Error', 'Failed to change member role');
    }
  };

  const shareInviteLink = async () => {
    try {
      const shareUrl = `speaksync://invite/${team.id}`;
      await Share.share({
        message: `Join my team "${team.name}" on SpeakSync! ${shareUrl}`,
        title: 'Join my SpeakSync team',
        url: shareUrl,
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
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

  const canModifyMember = (member: TeamMember) => {
    if (member.userId === currentUserId) return true; // Can always leave
    if (currentUserRole === 'owner') return true;
    if (currentUserRole === 'admin' && member.role !== 'owner') return true;
    return false;
  };

  const renderMember = ({ item }: { item: TeamMember }) => (
    <Card style={styles.memberCard}>
      <Card.Content>
        <View style={styles.memberHeader}>
          <Avatar.Text
            size={50}
            label={(item.displayName || item.email).charAt(0).toUpperCase()}
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <View style={styles.memberInfo}>
            <Title style={styles.memberName}>
              {item.displayName || item.email}
              {item.userId === currentUserId && ' (You)'}
            </Title>
            <Paragraph style={styles.memberEmail}>{item.email}</Paragraph>
            <Paragraph style={styles.memberDate}>
              Joined {item.joinedAt.toLocaleDateString()}
            </Paragraph>
          </View>
          <View style={styles.memberActions}>
            <Chip
              icon={getRoleIcon(item.role)}
              style={[styles.roleChip, { backgroundColor: getRoleColor(item.role) }]}
              textStyle={[styles.roleText, { color: theme.colors.onPrimary }]}
            >
              {item.role.toUpperCase()}
            </Chip>
            {canModifyMember(item) && (
              <Menu
                visible={memberMenuVisible && selectedMember?.id === item.id}
                onDismiss={() => setMemberMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => {
                      setSelectedMember(item);
                      setMemberMenuVisible(true);
                    }}
                  />
                }
              >
                {canManageMembers && item.role !== 'owner' && item.userId !== currentUserId && (
                  <>
                    <Menu.Item
                      onPress={() => {
                        setMemberMenuVisible(false);
                        handleChangeRole(item, 'admin');
                      }}
                      title="Make Admin"
                      leadingIcon="shield-account"
                    />
                    <Menu.Item
                      onPress={() => {
                        setMemberMenuVisible(false);
                        handleChangeRole(item, 'editor');
                      }}
                      title="Make Editor"
                      leadingIcon="pencil"
                    />
                    <Menu.Item
                      onPress={() => {
                        setMemberMenuVisible(false);
                        handleChangeRole(item, 'viewer');
                      }}
                      title="Make Viewer"
                      leadingIcon="eye"
                    />
                    <Divider />
                  </>
                )}
                <Menu.Item
                  onPress={() => {
                    setMemberMenuVisible(false);
                    handleRemoveMember(item);
                  }}
                  title={item.userId === currentUserId ? 'Leave Team' : 'Remove Member'}
                  leadingIcon="account-remove"
                />
              </Menu>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderInvitation = ({ item }: { item: TeamInvitation }) => (
    <Card style={styles.invitationCard}>
      <Card.Content>
        <View style={styles.invitationHeader}>
          <Avatar.Icon
            size={40}
            icon="email"
            style={{ backgroundColor: theme.colors.outline }}
          />
          <View style={styles.invitationInfo}>
            <Title style={styles.invitationEmail}>{item.email}</Title>
            <Paragraph style={styles.invitationStatus}>
              Invited as {item.role} • {item.createdAt.toLocaleDateString()}
            </Paragraph>
            {item.message && (
              <Paragraph style={styles.invitationMessage}>"{item.message}"</Paragraph>
            )}
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: theme.colors.outline }]}
            textStyle={{ color: theme.colors.onSurface }}
          >
            PENDING
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Paragraph style={styles.loadingText}>Loading team members...</Paragraph>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title>Team Members ({members.length})</Title>
        {canInviteMembers && (
          <Button
            mode="outlined"
            icon="share"
            onPress={shareInviteLink}
            style={styles.shareButton}
          >
            Share
          </Button>
        )}
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.membersList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          invitations.length > 0 ? (
            <View>
              <Title style={styles.sectionTitle}>Pending Invitations</Title>
              <FlatList
                data={invitations}
                renderItem={renderInvitation}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
              <Title style={styles.sectionTitle}>Members</Title>
            </View>
          ) : null
        }
      />

      {canInviteMembers && (
        <FAB
          icon="account-plus"
          style={styles.fab}
          onPress={() => setInviteDialogVisible(true)}
        />
      )}

      <Portal>
        <Dialog visible={inviteDialogVisible} onDismiss={() => setInviteDialogVisible(false)}>
          <Dialog.Title>Invite Team Member</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Email Address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            
            <View style={styles.roleSelector}>
              <Paragraph style={styles.roleLabel}>Role:</Paragraph>
              <View style={styles.roleOptions}>
                {(['viewer', 'editor', 'admin'] as TeamRole[]).map((role) => (
                  <Chip
                    key={role}
                    selected={inviteRole === role}
                    onPress={() => setInviteRole(role)}
                    style={styles.roleOption}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Chip>
                ))}
              </View>
            </View>

            <TextInput
              label="Personal Message (Optional)"
              value={inviteMessage}
              onChangeText={setInviteMessage}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="Welcome to our team!"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setInviteDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleInviteMember}
              loading={inviting}
              disabled={inviting || !inviteEmail.trim()}
            >
              Send Invite
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shareButton: {
    marginLeft: 8,
  },
  membersList: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  memberCard: {
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  memberDate: {
    fontSize: 12,
    opacity: 0.5,
  },
  memberActions: {
    alignItems: 'flex-end',
  },
  roleChip: {
    marginBottom: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  invitationCard: {
    marginBottom: 12,
    opacity: 0.8,
  },
  invitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invitationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  invitationStatus: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  invitationMessage: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.6,
  },
  statusChip: {
    height: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 16,
  },
  roleSelector: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    marginRight: 8,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
});

export default TeamMembers;
