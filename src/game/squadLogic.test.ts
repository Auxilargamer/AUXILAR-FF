import test from 'node:test';
import assert from 'node:assert/strict';
import {
  maxSquadCapacity,
  canInviteToSquad,
  createSquadMemberFromFriend,
  createSquadMemberFromRequest,
  formatMatchmakingTimer,
  getEstimatedMatchTime,
  FriendEntry,
  FriendJoinRequest,
} from './squadLogic.ts';

test('maxSquadCapacity returns correct limits for solo, duo, squad', () => {
  assert.equal(maxSquadCapacity('solo'), 1);
  assert.equal(maxSquadCapacity('duo'), 2);
  assert.equal(maxSquadCapacity('squad'), 4);
});

test('canInviteToSquad validates capacity boundaries', () => {
  assert.equal(canInviteToSquad(0, 'solo'), true);
  assert.equal(canInviteToSquad(1, 'solo'), false);
  assert.equal(canInviteToSquad(1, 'duo'), true);
  assert.equal(canInviteToSquad(2, 'duo'), false);
  assert.equal(canInviteToSquad(3, 'squad'), true);
  assert.equal(canInviteToSquad(4, 'squad'), false);
});

test('createSquadMemberFromFriend properly maps friend attributes', () => {
  const friend: FriendEntry = {
    id: 'f101',
    name: 'Aakash_Sniper',
    uid: '77889900',
    level: 60,
    rank: 'Grandmaster',
    status: 'Online',
    invited: false,
    bundleName: 'Sakura Samurai',
    bundleColor: '#3b82f6',
  };

  const member = createSquadMemberFromFriend(friend, 1);
  assert.equal(member.id, 'f101');
  assert.equal(member.name, 'Aakash_Sniper');
  assert.equal(member.rank, 'Grandmaster');
  assert.equal(member.level, 60);
  assert.equal(member.bundleColor, '#3b82f6');
  assert.equal(member.isReady, true);
  assert.equal(member.hp, 100);
});

test('createSquadMemberFromRequest transforms join request into squad member', () => {
  const req: FriendJoinRequest = {
    id: 'req_1',
    friendId: 'f202',
    name: 'Rohan_Pro',
    rank: 'Heroic',
    level: 52,
    bundleName: 'Cobra Rage',
    bundleColor: '#10b981',
    timestamp: Date.now(),
  };

  const member = createSquadMemberFromRequest(req, 2);
  assert.equal(member.id, 'f202');
  assert.equal(member.name, 'Rohan_Pro');
  assert.equal(member.bundleColor, '#10b981');
  assert.equal(member.isReady, true);
});

test('formatMatchmakingTimer formats minutes and seconds with padding', () => {
  assert.equal(formatMatchmakingTimer(0), '00:00');
  assert.equal(formatMatchmakingTimer(5), '00:05');
  assert.equal(formatMatchmakingTimer(65), '01:05');
  assert.equal(formatMatchmakingTimer(120), '02:00');
});

test('getEstimatedMatchTime returns realistic Free Fire queue times', () => {
  assert.equal(getEstimatedMatchTime('solo'), 4);
  assert.equal(getEstimatedMatchTime('duo'), 6);
  assert.equal(getEstimatedMatchTime('squad'), 8);
});
