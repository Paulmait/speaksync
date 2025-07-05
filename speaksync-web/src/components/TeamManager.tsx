'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserGroupIcon,
  PlusIcon,
  CogIcon,
  UserIcon,
  EnvelopeIcon,
  TrashIcon,
  ClockIcon,
  ShieldCheckIcon,
  PencilIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Team, TeamMember, TeamInvitation, TeamRole } from '../types';
// import { teamService } from '../services/teamService';

// Placeholder teamService for now
const teamService = {
  getUserTeams: async (userId: string): Promise<Team[]> => {
    // Placeholder implementation
    return [];
  },
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    // Placeholder implementation
    return [];
  },
  createTeam: async (data: any): Promise<string> => {
    // Placeholder implementation
    return 'team-id';
  },
  getTeam: async (teamId: string): Promise<Team | null> => {
    // Placeholder implementation
    return null;
  },
  inviteMember: async (...args: any[]): Promise<void> => {
    // Placeholder implementation
  },
  removeMember: async (...args: any[]): Promise<void> => {
    // Placeholder implementation
  },
  updateMemberRole: async (...args: any[]): Promise<void> => {
    // Placeholder implementation
  },
};

interface TeamManagerProps {
  currentUserId: string;
  onTeamSelect: (team: Team | null) => void;
}

export default function TeamManager({ currentUserId, onTeamSelect }: TeamManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teams' | 'members' | 'invitations'>('teams');
  
  // Modals
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showTeamSettings, setShowTeamSettings] = useState(false);
  
  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer');
  const [inviteMessage, setInviteMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTeams();
  }, [currentUserId]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers();
      loadInvitations();
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const userTeams = await teamService.getUserTeams(currentUserId);
      setTeams(userTeams);
      if (userTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(userTeams[0]);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    if (!selectedTeam) return;
    
    try {
      const members = await teamService.getTeamMembers(selectedTeam.id);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadInvitations = async () => {
    if (!selectedTeam) return;
    
    try {
      // This would need to be implemented in teamService
      setInvitations([]);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      setSubmitting(true);
      const teamId = await teamService.createTeam({
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined,
        ownerId: currentUserId,
        subscriptionTier: 'business', // This should come from user's subscription
      });

      const newTeam = await teamService.getTeam(teamId);
      if (newTeam) {
        setTeams([...teams, newTeam]);
        setSelectedTeam(newTeam);
        onTeamSelect(newTeam);
      }

      setShowCreateTeam(false);
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !inviteEmail.trim()) return;

    try {
      setSubmitting(true);
      await teamService.inviteMember(
        selectedTeam.id,
        inviteEmail.trim(),
        inviteRole,
        currentUserId,
        'Current User', // This should come from user data
        inviteMessage.trim() || undefined
      );

      alert('Invitation sent successfully!');
      setShowInviteMember(false);
      setInviteEmail('');
      setInviteMessage('');
      setInviteRole('viewer');
      loadInvitations();
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!selectedTeam) return;
    
    const isCurrentUser = member.userId === currentUserId;
    const action = isCurrentUser ? 'leave' : 'remove';
    const confirmMessage = isCurrentUser 
      ? 'Are you sure you want to leave this team?'
      : `Are you sure you want to remove ${member.displayName || member.email} from the team?`;

    if (confirm(confirmMessage)) {
      try {
        await teamService.removeMember(selectedTeam.id, member.userId, currentUserId);
        loadTeamMembers();
        
        if (isCurrentUser) {
          // If user left the team, reload teams and select another
          loadTeams();
          setSelectedTeam(null);
        }
      } catch (error) {
        console.error(`Error ${action} member:`, error);
        alert(`Failed to ${action} member. Please try again.`);
      }
    }
  };

  const handleChangeRole = async (member: TeamMember, newRole: TeamRole) => {
    if (!selectedTeam) return;

    if (confirm(`Change ${member.displayName || member.email}'s role to ${newRole}?`)) {
      try {
        await teamService.updateMemberRole(selectedTeam.id, member.userId, newRole, currentUserId);
        loadTeamMembers();
      } catch (error) {
        console.error('Error changing role:', error);
        alert('Failed to change member role. Please try again.');
      }
    }
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case 'owner': return <UserIcon className="w-4 h-4" />; // Crown icon not available, using User icon
      case 'admin': return <ShieldCheckIcon className="w-4 h-4" />;
      case 'editor': return <PencilIcon className="w-4 h-4" />;
      case 'viewer': return <EyeIcon className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: TeamRole) => {
    switch (role) {
      case 'owner': return 'text-red-600 bg-red-50';
      case 'admin': return 'text-blue-600 bg-blue-50';
      case 'editor': return 'text-green-600 bg-green-50';
      case 'viewer': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const canManageMembers = (userRole: TeamRole) => {
    return userRole === 'owner' || userRole === 'admin';
  };

  const getCurrentUserRole = (): TeamRole | null => {
    const currentMember = teamMembers.find(m => m.userId === currentUserId);
    return currentMember?.role || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading teams...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <button
          onClick={() => setShowCreateTeam(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team List Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Your Teams</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {teams.map((team) => (
                  <motion.div
                    key={team.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedTeam(team);
                      onTeamSelect(team);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTeam?.id === team.id
                        ? 'bg-blue-50 border-blue-200 border'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {team.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{team.name}</h3>
                          <p className="text-sm text-gray-500">
                            {team.stats.memberCount} members
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${'bg-gray-100 text-gray-700'}`}>
                          BASIC
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedTeam.name}</h2>
                    {selectedTeam.description && (
                      <p className="text-gray-600 mt-1">{selectedTeam.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowTeamSettings(true)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <CogIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-4 mt-6">
                  {(['teams', 'members', 'invitations'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'members' && (
                    <motion.div
                      key="members"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Team Members ({teamMembers.length})
                        </h3>
                        {canManageMembers(getCurrentUserRole() || 'viewer') && (
                          <button
                            onClick={() => setShowInviteMember(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Invite Member
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {teamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {(member.displayName || member.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {member.displayName || member.email}
                                  {member.userId === currentUserId && (
                                    <span className="text-sm text-gray-500 ml-2">(You)</span>
                                  )}
                                </h4>
                                <p className="text-sm text-gray-500">{member.email}</p>
                                <p className="text-xs text-gray-400">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getRoleColor(member.role)}`}>
                                {getRoleIcon(member.role)}
                                {member.role.toUpperCase()}
                              </div>
                              {canManageMembers(getCurrentUserRole() || 'viewer') && (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={member.role}
                                    onChange={(e) => handleChangeRole(member, e.target.value as TeamRole)}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                    disabled={member.role === 'owner' || member.userId === currentUserId}
                                  >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <button
                                    onClick={() => handleRemoveMember(member)}
                                    className="text-red-600 hover:text-red-700 p-1"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'invitations' && (
                    <motion.div
                      key="invitations"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">
                        Pending Invitations ({invitations.length})
                      </h3>

                      {invitations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <EnvelopeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No pending invitations</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {invitations.map((invitation) => (
                            <div
                              key={invitation.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                  <EnvelopeIcon className="w-6 h-6 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{invitation.email}</h4>
                                  <p className="text-sm text-gray-500">
                                    Invited as {invitation.role} by {invitation.invitedBy}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(invitation.invitedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                  <ClockIcon className="w-3 h-3" />
                                  PENDING
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Team Selected</h2>
              <p className="text-gray-600 mb-4">Select a team from the sidebar to manage members and settings</p>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <form onSubmit={handleCreateTeam}>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Team</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter team name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Describe your team's purpose"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTeamName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
          >
            <form onSubmit={handleInviteMember}>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Invite Team Member</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Welcome to our team!"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setShowInviteMember(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !inviteEmail.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
