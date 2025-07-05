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
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Team,
  TeamMember,
  TeamInvitation,
  TeamActivity,
  TeamRole,
  TeamPermissions,
  ScriptFolder,
  SubscriptionTier,
} from '@/types';

export class TeamService {
  // Team Management
  static async createTeam(
    name: string,
    description: string,
    ownerId: string,
    plan: SubscriptionTier = 'business'
  ): Promise<Team> {
    const teamData = {
      name,
      description,
      ownerId,
      plan,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      settings: {
        allowGuestAccess: false,
        defaultScriptPermissions: {
          canEdit: true,
          canDelete: false,
          canShare: true,
          canMove: true,
        },
        requireApprovalForNewMembers: false,
        allowMemberInvites: true,
        dataRetentionDays: 365,
      },
      stats: {
        memberCount: 1,
        scriptCount: 0,
        totalWordCount: 0,
        storageUsed: 0,
        lastActivityAt: Timestamp.now(),
      },
    };

    const teamRef = await addDoc(collection(db, 'teams'), teamData);
    
    // Add owner as team member
    await this.addTeamMember(teamRef.id, ownerId, 'owner');
    
    // Log activity
    await this.logActivity(teamRef.id, ownerId, 'created', 'team', teamRef.id, name);

    return {
      id: teamRef.id,
      ...teamData,
      createdAt: teamData.createdAt.toDate().toISOString(),
      updatedAt: teamData.updatedAt.toDate().toISOString(),
      stats: {
        ...teamData.stats,
        lastActivityAt: teamData.stats.lastActivityAt.toDate().toISOString(),
      },
    };
  }

  static async updateTeam(
    teamId: string,
    updates: Partial<Team>,
    userId: string
  ): Promise<void> {
    const teamRef = doc(db, 'teams', teamId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(teamRef, updateData);
    await this.logActivity(teamId, userId, 'team_settings_updated', 'team', teamId, updates.name || 'Team');
  }

  static async deleteTeam(teamId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // Delete team
    const teamRef = doc(db, 'teams', teamId);
    batch.delete(teamRef);
    
    // Delete all team members
    const membersQuery = query(collection(db, 'teams', teamId, 'members'));
    const membersSnapshot = await getDocs(membersQuery);
    membersSnapshot.docs.forEach((memberDoc) => {
      batch.delete(memberDoc.ref);
    });
    
    // Delete all team scripts
    const scriptsQuery = query(
      collection(db, 'scripts'),
      where('teamId', '==', teamId)
    );
    const scriptsSnapshot = await getDocs(scriptsQuery);
    scriptsSnapshot.docs.forEach((scriptDoc) => {
      batch.update(scriptDoc.ref, { isDeleted: true });
    });
    
    await batch.commit();
  }

  // Team Member Management
  static async addTeamMember(
    teamId: string,
    userId: string,
    role: TeamRole,
    invitedBy?: string
  ): Promise<void> {
    const memberData = {
      userId,
      teamId,
      role,
      joinedAt: Timestamp.now(),
      permissions: this.getRolePermissions(role),
    };

    await addDoc(collection(db, 'teams', teamId, 'members'), memberData);
    
    // Update team stats
    await this.updateTeamStats(teamId, { memberCount: 1 });
    
    if (invitedBy) {
      await this.logActivity(teamId, invitedBy, 'member_joined', 'member', userId, 'New Member');
    }
  }

  static async updateMemberRole(
    teamId: string,
    memberId: string,
    newRole: TeamRole,
    updatedBy: string
  ): Promise<void> {
    const memberRef = doc(db, 'teams', teamId, 'members', memberId);
    await updateDoc(memberRef, {
      role: newRole,
      permissions: this.getRolePermissions(newRole),
    });
    
    await this.logActivity(teamId, updatedBy, 'role_changed', 'member', memberId, 'Member');
  }

  static async removeMember(
    teamId: string,
    memberId: string,
    removedBy: string
  ): Promise<void> {
    const memberRef = doc(db, 'teams', teamId, 'members', memberId);
    await deleteDoc(memberRef);
    
    // Update team stats
    await this.updateTeamStats(teamId, { memberCount: -1 });
    
    await this.logActivity(teamId, removedBy, 'member_removed', 'member', memberId, 'Member');
  }

  // Team Invitations
  static async createInvitation(
    teamId: string,
    email: string,
    role: TeamRole,
    invitedBy: string,
    message?: string
  ): Promise<TeamInvitation> {
    const invitationData = {
      teamId,
      email,
      role,
      invitedBy,
      message,
      invitedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
      status: 'pending' as const,
    };

    const invitationRef = await addDoc(collection(db, 'teamInvitations'), invitationData);
    
    await this.logActivity(teamId, invitedBy, 'member_invited', 'member', email, email);

    return {
      id: invitationRef.id,
      ...invitationData,
      invitedAt: invitationData.invitedAt.toDate().toISOString(),
      expiresAt: invitationData.expiresAt.toDate().toISOString(),
    };
  }

  static async acceptInvitation(invitationId: string, userId: string): Promise<void> {
    const invitationRef = doc(db, 'teamInvitations', invitationId);
    const invitationDoc = await getDoc(invitationRef);
    
    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }
    
    const invitation = invitationDoc.data() as TeamInvitation;
    
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }
    
    if (new Date(invitation.expiresAt) < new Date()) {
      throw new Error('Invitation has expired');
    }
    
    // Add user to team
    await this.addTeamMember(invitation.teamId, userId, invitation.role, invitation.invitedBy);
    
    // Update invitation status
    await updateDoc(invitationRef, { status: 'accepted' });
  }

  // Folder Management
  static async createFolder(
    name: string,
    teamId: string,
    userId: string,
    parentId?: string
  ): Promise<ScriptFolder> {
    const folderData = {
      name,
      teamId,
      userId,
      parentId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      scriptCount: 0,
    };

    const folderRef = await addDoc(collection(db, 'scriptFolders'), folderData);
    
    await this.logActivity(teamId, userId, 'created', 'folder', folderRef.id, name);

    return {
      id: folderRef.id,
      ...folderData,
      createdAt: folderData.createdAt.toDate().toISOString(),
      updatedAt: folderData.updatedAt.toDate().toISOString(),
    };
  }

  // Activity Logging
  static async logActivity(
    teamId: string,
    userId: string,
    action: TeamActivity['action'],
    targetType: TeamActivity['targetType'],
    targetId: string,
    targetName: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const activityData = {
      teamId,
      userId,
      action,
      targetType,
      targetId,
      targetName,
      metadata,
      timestamp: Timestamp.now(),
    };

    await addDoc(collection(db, 'teamActivity'), activityData);
  }

  // Real-time subscriptions
  static subscribeToTeam(teamId: string, callback: (team: Team) => void) {
    const teamRef = doc(db, 'teams', teamId);
    return onSnapshot(teamRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          stats: {
            ...data.stats,
            lastActivityAt: data.stats?.lastActivityAt?.toDate?.()?.toISOString() || data.stats?.lastActivityAt,
          },
        } as Team);
      }
    });
  }

  static subscribeToTeamMembers(teamId: string, callback: (members: TeamMember[]) => void) {
    const membersQuery = query(
      collection(db, 'teams', teamId, 'members'),
      orderBy('joinedAt', 'desc')
    );
    
    return onSnapshot(membersQuery, (snapshot) => {
      const members: TeamMember[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          ...data,
          joinedAt: data.joinedAt?.toDate?.()?.toISOString() || data.joinedAt,
          lastActiveAt: data.lastActiveAt?.toDate?.()?.toISOString() || data.lastActiveAt,
        } as TeamMember);
      });
      callback(members);
    });
  }

  static subscribeToTeamActivity(teamId: string, callback: (activities: TeamActivity[]) => void) {
    const activityQuery = query(
      collection(db, 'teamActivity'),
      where('teamId', '==', teamId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    return onSnapshot(activityQuery, (snapshot) => {
      const activities: TeamActivity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        } as TeamActivity);
      });
      callback(activities);
    });
  }

  // Helper methods
  private static getRolePermissions(role: TeamRole): TeamPermissions {
    const basePermissions = {
      canInviteMembers: false,
      canRemoveMembers: false,
      canEditTeamSettings: false,
      canCreateScripts: false,
      canEditScripts: false,
      canDeleteScripts: false,
      canCreateFolders: false,
      canManageFolders: false,
      canViewAnalytics: false,
      canExportData: false,
    };

    switch (role) {
      case 'owner':
        return {
          ...basePermissions,
          canInviteMembers: true,
          canRemoveMembers: true,
          canEditTeamSettings: true,
          canCreateScripts: true,
          canEditScripts: true,
          canDeleteScripts: true,
          canCreateFolders: true,
          canManageFolders: true,
          canViewAnalytics: true,
          canExportData: true,
        };
      case 'admin':
        return {
          ...basePermissions,
          canInviteMembers: true,
          canRemoveMembers: true,
          canCreateScripts: true,
          canEditScripts: true,
          canDeleteScripts: true,
          canCreateFolders: true,
          canManageFolders: true,
          canViewAnalytics: true,
          canExportData: true,
        };
      case 'editor':
        return {
          ...basePermissions,
          canCreateScripts: true,
          canEditScripts: true,
          canCreateFolders: true,
        };
      case 'viewer':
        return basePermissions;
      default:
        return basePermissions;
    }
  }

  private static async updateTeamStats(teamId: string, changes: Partial<TeamStats>): Promise<void> {
    const teamRef = doc(db, 'teams', teamId);
    const updateData: Record<string, unknown> = {};
    
    Object.entries(changes).forEach(([key, value]) => {
      if (typeof value === 'number') {
        updateData[`stats.${key}`] = value > 0 ? 
          { increment: value } : 
          { increment: value };
      } else {
        updateData[`stats.${key}`] = value;
      }
    });
    
    updateData['stats.lastActivityAt'] = Timestamp.now();
    
    await updateDoc(teamRef, updateData);
  }
}

export default TeamService;
