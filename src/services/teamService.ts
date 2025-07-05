import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Team,
  TeamMember,
  TeamInvitation,
  TeamActivity,
  ScriptFolder,
  TeamRole,
  TeamSettings,
  TeamStats,
  TeamActivityAction,
  SubscriptionTier,
} from '../types';

class TeamService {
  // Team CRUD Operations
  async createTeam(teamData: {
    name: string;
    description?: string;
    ownerId: string;
    subscriptionTier: SubscriptionTier;
    settings?: Partial<TeamSettings>;
  }): Promise<string> {
    try {
      const defaultSettings: TeamSettings = {
        allowMemberInvites: true,
        defaultMemberRole: 'viewer',
        requireApprovalForJoining: false,
        allowPublicScripts: false,
        maxMembers: this.getMaxMembersForTier(teamData.subscriptionTier),
        enableActivityLog: true,
        enableRealTimeCollaboration: teamData.subscriptionTier !== 'free',
      };

      const defaultStats: TeamStats = {
        memberCount: 1,
        scriptCount: 0,
        folderCount: 0,
        totalStorageUsed: 0,
        lastActivityAt: new Date(),
        activeMembers: 1,
      };

      const team: Omit<Team, 'id'> = {
        name: teamData.name,
        description: teamData.description,
        ownerId: teamData.ownerId,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: { ...defaultSettings, ...teamData.settings },
        stats: defaultStats,
        subscriptionTier: teamData.subscriptionTier,
      };

      // Use batch write to create team and add owner as member
      const batch = writeBatch(db);
      
      const teamRef = doc(collection(db, 'teams'));
      batch.set(teamRef, {
        ...team,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        'stats.lastActivityAt': serverTimestamp(),
      });

      const memberRef = doc(collection(db, 'teams', teamRef.id, 'members'));
      batch.set(memberRef, {
        id: memberRef.id,
        teamId: teamRef.id,
        userId: teamData.ownerId,
        email: '', // Will be populated from user data
        role: 'owner' as TeamRole,
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        invitedBy: teamData.ownerId,
      });

      await batch.commit();

      // Log team creation activity
      await this.logActivity({
        teamId: teamRef.id,
        userId: teamData.ownerId,
        userDisplayName: 'Team Owner',
        action: 'created',
        targetType: 'team',
        targetId: teamRef.id,
        targetName: teamData.name,
      });

      return teamRef.id;
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error('Failed to update team');
    }
  }

  async deleteTeam(teamId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Delete team document
      const teamRef = doc(db, 'teams', teamId);
      batch.delete(teamRef);

      // Delete all members
      const membersSnapshot = await getDocs(collection(db, 'teams', teamId, 'members'));
      membersSnapshot.docs.forEach((memberDoc) => {
        batch.delete(memberDoc.ref);
      });

      // Delete all invitations
      const invitationsSnapshot = await getDocs(
        query(collection(db, 'teamInvitations'), where('teamId', '==', teamId))
      );
      invitationsSnapshot.docs.forEach((invitationDoc) => {
        batch.delete(invitationDoc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting team:', error);
      throw new Error('Failed to delete team');
    }
  }

  async getTeam(teamId: string): Promise<Team | null> {
    try {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      if (!teamDoc.exists()) {
        return null;
      }

      const data = teamDoc.data();
      return {
        id: teamDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        stats: {
          ...data.stats,
          lastActivityAt: data.stats?.lastActivityAt?.toDate() || new Date(),
        },
      } as Team;
    } catch (error) {
      console.error('Error getting team:', error);
      throw new Error('Failed to get team');
    }
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      // Get all teams where user is a member
      const teamsWithMembership = await getDocs(
        query(
          collection(db, 'teams'),
          orderBy('updatedAt', 'desc')
        )
      );

      const teams: Team[] = [];
      
      for (const teamDoc of teamsWithMembership.docs) {
        // Check if user is a member of this team
        const memberDoc = await getDoc(
          doc(db, 'teams', teamDoc.id, 'members', userId)
        );
        
        if (memberDoc.exists()) {
          const data = teamDoc.data();
          teams.push({
            id: teamDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            stats: {
              ...data.stats,
              lastActivityAt: data.stats?.lastActivityAt?.toDate() || new Date(),
            },
          } as Team);
        }
      }

      return teams;
    } catch (error) {
      console.error('Error getting user teams:', error);
      throw new Error('Failed to get user teams');
    }
  }

  // Member Management
  async inviteMember(
    teamId: string,
    email: string,
    role: TeamRole,
    invitedBy: string,
    invitedByName: string,
    message?: string
  ): Promise<string> {
    try {
      // Check if invitation already exists
      const existingInvitation = await getDocs(
        query(
          collection(db, 'teamInvitations'),
          where('teamId', '==', teamId),
          where('email', '==', email),
          where('status', '==', 'pending')
        )
      );

      if (!existingInvitation.empty) {
        throw new Error('Invitation already sent to this email');
      }

      // Get team info
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const invitation: Omit<TeamInvitation, 'id'> = {
        teamId,
        teamName: team.name,
        email,
        role,
        invitedBy,
        invitedByName,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending',
        message,
      };

      const invitationRef = await addDoc(collection(db, 'teamInvitations'), {
        ...invitation,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Log invitation activity
      await this.logActivity({
        teamId,
        userId: invitedBy,
        userDisplayName: invitedByName,
        action: 'invited',
        targetType: 'member',
        targetId: email,
        targetName: email,
        metadata: { role, message },
      });

      return invitationRef.id;
    } catch (error) {
      console.error('Error inviting member:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to invite member');
    }
  }

  async acceptInvitation(invitationId: string, userId: string, userEmail: string, userDisplayName: string): Promise<void> {
    try {
      const invitationRef = doc(db, 'teamInvitations', invitationId);
      const invitationDoc = await getDoc(invitationRef);
      
      if (!invitationDoc.exists()) {
        throw new Error('Invitation not found');
      }

      const invitationData = invitationDoc.data();
      const invitation = {
        ...invitationData,
        createdAt: invitationData.createdAt?.toDate ? invitationData.createdAt.toDate() : new Date(invitationData.createdAt),
        expiresAt: invitationData.expiresAt?.toDate ? invitationData.expiresAt.toDate() : new Date(invitationData.expiresAt),
      } as TeamInvitation;
      
      if (invitation.status !== 'pending') {
        throw new Error('Invitation is no longer valid');
      }

      if (invitation.expiresAt < new Date()) {
        throw new Error('Invitation has expired');
      }

      if (invitation.email !== userEmail) {
        throw new Error('Invitation email does not match user email');
      }

      const batch = writeBatch(db);

      // Update invitation status
      batch.update(invitationRef, {
        status: 'accepted',
      });

      // Add user as team member
      const memberRef = doc(collection(db, 'teams', invitation.teamId, 'members'));
      batch.set(memberRef, {
        id: memberRef.id,
        teamId: invitation.teamId,
        userId,
        email: userEmail,
        displayName: userDisplayName,
        role: invitation.role,
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        invitedBy: invitation.invitedBy,
      });

      // Update team stats
      const teamRef = doc(db, 'teams', invitation.teamId);
      batch.update(teamRef, {
        'stats.memberCount': increment(1),
        'stats.lastActivityAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      // Log join activity
      await this.logActivity({
        teamId: invitation.teamId,
        userId,
        userDisplayName: userDisplayName || userEmail,
        action: 'joined',
        targetType: 'team',
        targetId: invitation.teamId,
        targetName: invitation.teamName,
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to accept invitation');
    }
  }

  async declineInvitation(invitationId: string): Promise<void> {
    try {
      const invitationRef = doc(db, 'teamInvitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'declined',
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw new Error('Failed to decline invitation');
    }
  }

  async updateMemberRole(teamId: string, userId: string, newRole: TeamRole, updatedBy: string): Promise<void> {
    try {
      const memberRef = doc(db, 'teams', teamId, 'members', userId);
      const memberDoc = await getDoc(memberRef);
      
      if (!memberDoc.exists()) {
        throw new Error('Member not found');
      }

      const oldRole = memberDoc.data().role;
      
      await updateDoc(memberRef, {
        role: newRole,
        lastActiveAt: serverTimestamp(),
      });

      // Log role change activity
      await this.logActivity({
        teamId,
        userId: updatedBy,
        userDisplayName: 'Team Admin',
        action: 'role_changed',
        targetType: 'member',
        targetId: userId,
        targetName: memberDoc.data().displayName || memberDoc.data().email,
        metadata: { oldRole, newRole },
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      throw new Error('Failed to update member role');
    }
  }

  async removeMember(teamId: string, userId: string, removedBy: string): Promise<void> {
    try {
      const memberRef = doc(db, 'teams', teamId, 'members', userId);
      const memberDoc = await getDoc(memberRef);
      
      if (!memberDoc.exists()) {
        throw new Error('Member not found');
      }

      const memberData = memberDoc.data();
      
      const batch = writeBatch(db);

      // Remove member
      batch.delete(memberRef);

      // Update team stats
      const teamRef = doc(db, 'teams', teamId);
      batch.update(teamRef, {
        'stats.memberCount': increment(-1),
        'stats.lastActivityAt': serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      // Log removal activity
      await this.logActivity({
        teamId,
        userId: removedBy,
        userDisplayName: 'Team Admin',
        action: 'left',
        targetType: 'member',
        targetId: userId,
        targetName: memberData.displayName || memberData.email,
      });
    } catch (error) {
      console.error('Error removing member:', error);
      throw new Error('Failed to remove member');
    }
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const membersSnapshot = await getDocs(
        query(
          collection(db, 'teams', teamId, 'members'),
          orderBy('joinedAt', 'asc')
        )
      );

      return membersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          joinedAt: data.joinedAt?.toDate() || new Date(),
          lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
        } as TeamMember;
      });
    } catch (error) {
      console.error('Error getting team members:', error);
      throw new Error('Failed to get team members');
    }
  }

  async getUserRole(teamId: string, userId: string): Promise<TeamRole | null> {
    try {
      const memberDoc = await getDoc(doc(db, 'teams', teamId, 'members', userId));
      if (!memberDoc.exists()) {
        return null;
      }
      return memberDoc.data().role as TeamRole;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Folder Management
  async createFolder(folderData: {
    name: string;
    description?: string;
    parentId?: string;
    teamId?: string;
    userId: string;
    color?: string;
    icon?: string;
  }): Promise<string> {
    try {
      const folder: Omit<ScriptFolder, 'id'> = {
        name: folderData.name,
        description: folderData.description,
        parentId: folderData.parentId,
        teamId: folderData.teamId,
        userId: folderData.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        scriptIds: [],
        color: folderData.color,
        icon: folderData.icon,
      };

      const folderRef = await addDoc(collection(db, 'scriptFolders'), {
        ...folder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update team stats if it's a team folder
      if (folderData.teamId) {
        const teamRef = doc(db, 'teams', folderData.teamId);
        await updateDoc(teamRef, {
          'stats.folderCount': increment(1),
          'stats.lastActivityAt': serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Log folder creation activity
        await this.logActivity({
          teamId: folderData.teamId,
          userId: folderData.userId,
          userDisplayName: 'Team Member',
          action: 'created',
          targetType: 'folder',
          targetId: folderRef.id,
          targetName: folderData.name,
        });
      }

      return folderRef.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  async updateFolder(folderId: string, updates: Partial<ScriptFolder>): Promise<void> {
    try {
      const folderRef = doc(db, 'scriptFolders', folderId);
      await updateDoc(folderRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating folder:', error);
      throw new Error('Failed to update folder');
    }
  }

  async deleteFolder(folderId: string): Promise<void> {
    try {
      const folderRef = doc(db, 'scriptFolders', folderId);
      const folderDoc = await getDoc(folderRef);
      
      if (!folderDoc.exists()) {
        throw new Error('Folder not found');
      }

      const folderData = folderDoc.data() as ScriptFolder;
      
      await deleteDoc(folderRef);

      // Update team stats if it's a team folder
      if (folderData.teamId) {
        const teamRef = doc(db, 'teams', folderData.teamId);
        await updateDoc(teamRef, {
          'stats.folderCount': increment(-1),
          'stats.lastActivityAt': serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw new Error('Failed to delete folder');
    }
  }

  // Activity Logging
  async logActivity(activityData: {
    teamId: string;
    userId: string;
    userDisplayName: string;
    action: TeamActivityAction;
    targetType: 'script' | 'folder' | 'member' | 'team' | 'invitation';
    targetId: string;
    targetName: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const activity: Omit<TeamActivity, 'id'> = {
        ...activityData,
        timestamp: new Date(),
      };

      await addDoc(collection(db, 'teamActivity'), {
        ...activity,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw error for activity logging failures
    }
  }

  async getTeamActivity(teamId: string, limit: number = 50): Promise<TeamActivity[]> {
    try {
      const activitySnapshot = await getDocs(
        query(
          collection(db, 'teamActivity'),
          where('teamId', '==', teamId),
          orderBy('timestamp', 'desc')
        )
      );

      return activitySnapshot.docs.slice(0, limit).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as TeamActivity;
      });
    } catch (error) {
      console.error('Error getting team activity:', error);
      throw new Error('Failed to get team activity');
    }
  }

  // Real-time Subscriptions
  subscribeToTeamUpdates(teamId: string, callback: (team: Team | null) => void): Unsubscribe {
    return onSnapshot(
      doc(db, 'teams', teamId),
      (doc) => {
        if (!doc.exists()) {
          callback(null);
          return;
        }

        const data = doc.data();
        const team: Team = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          stats: {
            ...data.stats,
            lastActivityAt: data.stats?.lastActivityAt?.toDate() || new Date(),
          },
        } as Team;

        callback(team);
      },
      (error) => {
        console.error('Error subscribing to team updates:', error);
        callback(null);
      }
    );
  }

  subscribeToTeamMembers(teamId: string, callback: (members: TeamMember[]) => void): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, 'teams', teamId, 'members'),
        orderBy('joinedAt', 'asc')
      ),
      (snapshot) => {
        const members = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            joinedAt: data.joinedAt?.toDate() || new Date(),
            lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
          } as TeamMember;
        });
        callback(members);
      },
      (error) => {
        console.error('Error subscribing to team members:', error);
        callback([]);
      }
    );
  }

  subscribeToUserInvitations(userEmail: string, callback: (invitations: TeamInvitation[]) => void): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, 'teamInvitations'),
        where('email', '==', userEmail),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const invitations = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate() || new Date(),
          } as TeamInvitation;
        });
        callback(invitations);
      },
      (error) => {
        console.error('Error subscribing to user invitations:', error);
        callback([]);
      }
    );
  }

  // Utility Methods
  private getMaxMembersForTier(tier: SubscriptionTier): number {
    switch (tier) {
      case 'free': return 3;
      case 'personal': return 5;
      case 'business': return 50;
      case 'enterprise': return 500;
      default: return 3;
    }
  }

  async checkTeamLimits(teamId: string, userId: string): Promise<{
    canAddMembers: boolean;
    canCreateFolders: boolean;
    canUseRealTimeCollaboration: boolean;
    maxMembersReached: boolean;
  }> {
    try {
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const members = await this.getTeamMembers(teamId);
      const maxMembersReached = members.length >= team.settings.maxMembers;

      return {
        canAddMembers: !maxMembersReached,
        canCreateFolders: true,
        canUseRealTimeCollaboration: team.settings.enableRealTimeCollaboration,
        maxMembersReached,
      };
    } catch (error) {
      console.error('Error checking team limits:', error);
      return {
        canAddMembers: false,
        canCreateFolders: false,
        canUseRealTimeCollaboration: false,
        maxMembersReached: true,
      };
    }
  }
}

export const teamService = new TeamService();
export default teamService;
