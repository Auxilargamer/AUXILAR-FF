export interface FriendEntry {
  id: string;
  name: string;
  uid: string;
  level: number;
  rank: string;
  status: 'In Lobby' | 'Online' | 'In Squad';
  invited: boolean;
  bundleName: string;
  bundleColor: string;
}

export interface SquadMember {
  id: string;
  name: string;
  level: number;
  rank: string;
  bundleName: string;
  bundleColor: string;
  isReady: boolean;
  avatar: string;
  hp?: number;
}

export interface FriendJoinRequest {
  id: string;
  friendId: string;
  name: string;
  rank: string;
  level: number;
  bundleName: string;
  bundleColor: string;
  timestamp: number;
}

export const SQUAD_COLORS = ['#dc2626', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ec4899'];

export function maxSquadCapacity(teamType: 'solo' | 'duo' | 'squad'): number {
  if (teamType === 'solo') return 1;
  if (teamType === 'duo') return 2;
  return 4;
}

export function canInviteToSquad(squadLength: number, teamType: 'solo' | 'duo' | 'squad'): boolean {
  return squadLength < maxSquadCapacity(teamType);
}

export function createSquadMemberFromFriend(friend: FriendEntry, slotIndex: number): SquadMember {
  const color = friend.bundleColor || SQUAD_COLORS[slotIndex % SQUAD_COLORS.length];
  return {
    id: friend.id,
    name: friend.name,
    level: friend.level,
    rank: friend.rank,
    bundleName: friend.bundleName || 'Cobra Rage',
    bundleColor: color,
    isReady: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    hp: 100,
  };
}

export function createSquadMemberFromRequest(request: FriendJoinRequest, slotIndex: number): SquadMember {
  const color = request.bundleColor || SQUAD_COLORS[slotIndex % SQUAD_COLORS.length];
  return {
    id: request.friendId,
    name: request.name,
    level: request.level,
    rank: request.rank,
    bundleName: request.bundleName || 'Sakura Samurai',
    bundleColor: color,
    isReady: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    hp: 100,
  };
}

export function formatMatchmakingTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getEstimatedMatchTime(teamType: 'solo' | 'duo' | 'squad'): number {
  if (teamType === 'solo') return 4;
  if (teamType === 'duo') return 6;
  return 8;
}
