import React, { useState, useEffect } from 'react';
import { UserProfile, ADMIN_EMAIL } from '../game/auth.ts';
import { soundFx } from '../game/audio.ts';
import {
  FriendEntry,
  SquadMember,
  FriendJoinRequest,
  canInviteToSquad,
  maxSquadCapacity,
  createSquadMemberFromFriend,
  createSquadMemberFromRequest,
  formatMatchmakingTimer,
  getEstimatedMatchTime,
} from '../game/squadLogic.ts';

export type { FriendEntry, SquadMember, FriendJoinRequest };

const DEFAULT_FRIENDS: FriendEntry[] = [
  { id: 'f1', name: 'Aakash_Sniper', uid: '71249102', level: 64, rank: 'Grandmaster', status: 'In Lobby', invited: false, bundleName: 'Sakura Samurai', bundleColor: '#3b82f6' },
  { id: 'f2', name: 'Rohan_Pro', uid: '88129410', level: 52, rank: 'Heroic', status: 'Online', invited: false, bundleName: 'Cobra Rage', bundleColor: '#10b981' },
  { id: 'f3', name: 'Kelly_Swift', uid: '66201948', level: 48, rank: 'Diamond', status: 'Online', invited: false, bundleName: 'Hip Hop', bundleColor: '#a855f7' },
  { id: 'f4', name: 'Kabir_Gamer', uid: '55910239', level: 58, rank: 'Master', status: 'In Lobby', invited: false, bundleName: 'Golden Samurai', bundleColor: '#f59e0b' },
  { id: 'f5', name: 'Queen_Fire', uid: '44109284', level: 41, rank: 'Platinum', status: 'Online', invited: false, bundleName: 'Red Criminal', bundleColor: '#ef4444' },
];

const RECOMMENDED_SURVIVORS = [
  { name: 'Total_Gaming_Ajju', uid: '94949494', level: 78, rank: 'Grandmaster', bundleName: 'Golden Samurai', bundleColor: '#f59e0b' },
  { name: 'Desi_Amit_Bhai', uid: '11223344', level: 72, rank: 'Grandmaster', bundleName: 'Sakura Samurai', bundleColor: '#ec4899' },
  { name: 'Badge99_Pro', uid: '99999999', level: 70, rank: 'Heroic', bundleName: 'Cobra Rage', bundleColor: '#8b5cf6' },
  { name: 'Raistar_Headshot', uid: '77712399', level: 75, rank: 'Grandmaster', bundleName: 'Red Criminal', bundleColor: '#ef4444' },
  { name: 'Gyan_Sujjan_YT', uid: '44556677', level: 68, rank: 'Master', bundleName: 'Hip Hop', bundleColor: '#06b6d4' },
  { name: 'Pagal_M1014_King', uid: '33445566', level: 65, rank: 'Heroic', bundleName: 'Sakura Samurai', bundleColor: '#10b981' },
];

interface LobbyProps {
  user: UserProfile;
  onStartGame: (squad?: SquadMember[]) => void;
  onOpenVault: () => void;
  onOpenWeaponLab: () => void;
  onOpenEmotes: () => void;
  onOpenEvents: () => void;
  onOpenDiamondStore: () => void;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  user,
  onStartGame,
  onOpenVault,
  onOpenWeaponLab,
  onOpenEmotes,
  onOpenEvents,
  onOpenDiamondStore,
  onOpenAdminPanel,
  onLogout,
}) => {
  const [teamType, setTeamType] = useState<'solo' | 'duo' | 'squad'>('squad');
  const [activeEmoteText, setActiveEmoteText] = useState<string | null>(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [teamCodeCopied, setTeamCodeCopied] = useState(false);
  const [micActive, setMicActive] = useState(true);

  // Online Friends List with LocalStorage Persistence
  const [onlineFriends, setOnlineFriends] = useState<FriendEntry[]>(() => {
    try {
      const saved = localStorage.getItem('freefire_user_friends');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_FRIENDS;
  });

  // Friend Modal Active Tab & Form State
  const [friendsTab, setFriendsTab] = useState<'my_friends' | 'requests' | 'add_friend' | 'team_code'>('my_friends');
  const [searchFriendQuery, setSearchFriendQuery] = useState('');
  const [newFriendNameInput, setNewFriendNameInput] = useState('');
  const [newFriendUidInput, setNewFriendUidInput] = useState('');
  const [newFriendRankInput, setNewFriendRankInput] = useState('Heroic');
  const [friendToast, setFriendToast] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Pending outgoing invite status per friend
  const [pendingInvites, setPendingInvites] = useState<Record<string, 'pending' | 'accepted' | 'declined'>>({});

  // Incoming Friend Join Requests (Bidirectional invite mechanism)
  const [incomingRequests, setIncomingRequests] = useState<FriendJoinRequest[]>([
    {
      id: 'req_rohan',
      friendId: 'f2',
      name: 'Rohan_Pro',
      rank: 'Heroic',
      level: 52,
      bundleName: 'Cobra Rage',
      bundleColor: '#10b981',
      timestamp: Date.now(),
    },
  ]);

  // Squad Matchmaking State
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingSec, setMatchmakingSec] = useState(0);

  // Squad Members on Podium
  const [squad, setSquad] = useState<SquadMember[]>([
    {
      id: user.uid,
      name: user.nickname,
      level: user.level,
      rank: user.rank,
      bundleName: 'Red Criminal',
      bundleColor: '#dc2626',
      isReady: true,
      avatar: user.avatar,
      hp: 100,
    },
  ]);

  // Handle Matchmaking Timer and Auto-Match Transition
  useEffect(() => {
    let interval: any;
    if (isMatchmaking) {
      interval = setInterval(() => {
        setMatchmakingSec((prev) => {
          if (prev >= 4) {
            clearInterval(interval);
            setIsMatchmaking(false);
            soundFx.playVictoryFanfare();
            onStartGame(squad);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setMatchmakingSec(0);
    }
    return () => clearInterval(interval);
  }, [isMatchmaking, squad, onStartGame]);

  const playLobbyEmote = () => {
    setActiveEmoteText('🕺 LOL EMOTE PLAYING!');
    soundFx.playVictoryFanfare();
    setTimeout(() => setActiveEmoteText(null), 2500);
  };

  const saveFriendsList = (updated: FriendEntry[]) => {
    setOnlineFriends(updated);
    try {
      localStorage.setItem('freefire_user_friends', JSON.stringify(updated));
    } catch {}
  };

  const handleAddFriend = (
    name: string,
    uid?: string,
    rank: string = 'Heroic',
    bundleName: string = 'Sakura Samurai',
    bundleColor: string = '#3b82f6'
  ) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFriendToast('⚠️ Kripya player name ya UID enter karein');
      setTimeout(() => setFriendToast(null), 2500);
      return;
    }

    const exists = onlineFriends.some(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase() || (uid && f.uid === uid)
    );
    if (exists) {
      setFriendToast(`ℹ️ "${trimmed}" pehle se aapke friend list mein hain!`);
      setTimeout(() => setFriendToast(null), 2500);
      return;
    }

    const newFriend: FriendEntry = {
      id: `f_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: trimmed,
      uid: uid || Math.floor(10000000 + Math.random() * 90000000).toString(),
      level: 45 + Math.floor(Math.random() * 30),
      rank: rank,
      status: 'Online',
      invited: false,
      bundleName,
      bundleColor,
    };

    const updated = [newFriend, ...onlineFriends];
    saveFriendsList(updated);
    soundFx.playLootPickup();
    setFriendToast(`✅ ${trimmed} (UID: ${newFriend.uid}) ko friend add kar liya gaya!`);
    setNewFriendNameInput('');
    setNewFriendUidInput('');
    setTimeout(() => setFriendToast(null), 3000);
  };

  const handleRemoveFriend = (friendId: string) => {
    const friend = onlineFriends.find((f) => f.id === friendId);
    const updated = onlineFriends.filter((f) => f.id !== friendId);
    saveFriendsList(updated);
    setFriendToast(`🗑️ ${friend?.name || 'Friend'} ko friend list se hata diya gaya.`);
    setTimeout(() => setFriendToast(null), 2500);
  };

  // SEND SQUAD INVITE TO A FRIEND
  const handleInviteFriend = (friendId: string) => {
    const friend = onlineFriends.find((f) => f.id === friendId);
    if (!friend) return;

    if (!canInviteToSquad(squad.length, teamType)) {
      setFriendToast(`⚠️ Squad full hai! Max ${maxSquadCapacity(teamType)} players.`);
      setTimeout(() => setFriendToast(null), 3000);
      return;
    }

    setPendingInvites((prev) => ({ ...prev, [friendId]: 'pending' }));
    soundFx.playLootPickup();
    setFriendToast(`📨 Invite sent to ${friend.name}!`);

    setTimeout(() => {
      setPendingInvites((prev) => ({ ...prev, [friendId]: 'accepted' }));
      const newMember = createSquadMemberFromFriend(friend, squad.length);

      setSquad((prev) => {
        if (prev.some((m) => m.id === friend.id)) return prev;
        if (!canInviteToSquad(prev.length, teamType)) return prev;
        return [...prev, newMember];
      });

      const updated = onlineFriends.map((f) =>
        f.id === friendId ? { ...f, invited: true, status: 'In Squad' as const } : f
      );
      saveFriendsList(updated);

      soundFx.playVictoryFanfare();
      setFriendToast(`🎉 ${friend.name} squad mein shamil ho gaye!`);
      setActiveEmoteText(`🎉 ${friend.name} joined!`);
      setTimeout(() => setActiveEmoteText(null), 2500);
      setTimeout(() => setFriendToast(null), 3000);
    }, 1200);
  };

  // SEND JOIN REQUEST TO A FRIEND'S SQUAD
  const handleSendJoinRequest = (friend: FriendEntry) => {
    soundFx.playLootPickup();
    setFriendToast(`📨 Join request sent to ${friend.name}'s squad!`);

    setTimeout(() => {
      soundFx.playVictoryFanfare();
      setFriendToast(`🎉 ${friend.name} accepted your join request!`);

      if (canInviteToSquad(squad.length, teamType)) {
        const newMember = createSquadMemberFromFriend(friend, squad.length);
        setSquad((prev) => (prev.some((m) => m.id === friend.id) ? prev : [...prev, newMember]));
        const updated = onlineFriends.map((f) =>
          f.id === friend.id ? { ...f, invited: true, status: 'In Squad' as const } : f
        );
        saveFriendsList(updated);
      }
      setTimeout(() => setFriendToast(null), 2500);
    }, 1500);
  };

  // ACCEPT INCOMING JOIN REQUEST FROM A FRIEND
  const handleAcceptRequest = (request: FriendJoinRequest) => {
    if (!canInviteToSquad(squad.length, teamType)) {
      setFriendToast(`⚠️ Squad already at maximum capacity.`);
      setTimeout(() => setFriendToast(null), 3000);
      return;
    }

    soundFx.playVictoryFanfare();
    const newMember = createSquadMemberFromRequest(request, squad.length);
    setSquad((prev) => (prev.some((m) => m.id === request.friendId) ? prev : [...prev, newMember]));

    setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));

    const updated = onlineFriends.map((f) =>
      f.id === request.friendId ? { ...f, invited: true, status: 'In Squad' as const } : f
    );
    saveFriendsList(updated);

    setFriendToast(`✅ ${request.name} squad mein shamil hue!`);
    setActiveEmoteText(`🎉 ${request.name} joined squad!`);
    setTimeout(() => setActiveEmoteText(null), 2500);
    setTimeout(() => setFriendToast(null), 3000);
  };

  // DECLINE INCOMING JOIN REQUEST
  const handleDeclineRequest = (requestId: string) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    setFriendToast('❌ Request declined.');
    setTimeout(() => setFriendToast(null), 2000);
  };

  // REMOVE MEMBER FROM SQUAD PODIUM
  const handleRemoveSquadMember = (memberId: string) => {
    const member = squad.find((m) => m.id === memberId);
    setSquad((prev) => prev.filter((m) => m.id !== memberId));
    const updated = onlineFriends.map((f) =>
      f.id === memberId ? { ...f, invited: false, status: 'Online' as const } : f
    );
    saveFriendsList(updated);
    setFriendToast(`ℹ️ ${member?.name || 'Member'} squad se nikal gaye.`);
    setTimeout(() => setFriendToast(null), 2000);
  };

  const handleSimulateNewRequest = () => {
    const names = ['Aakash_Sniper', 'Kelly_Swift', 'Kabir_Gamer', 'Queen_Fire', 'Desi_Amit_Bhai'];
    const ranks = ['Grandmaster', 'Heroic', 'Master', 'Diamond'];
    const chosenName = names[Math.floor(Math.random() * names.length)];
    const chosenRank = ranks[Math.floor(Math.random() * ranks.length)];

    const newReq: FriendJoinRequest = {
      id: `req_${Date.now()}`,
      friendId: `f_${Date.now()}`,
      name: chosenName,
      rank: chosenRank,
      level: 45 + Math.floor(Math.random() * 30),
      bundleName: 'Sakura Samurai',
      bundleColor: '#3b82f6',
      timestamp: Date.now(),
    };

    setIncomingRequests((prev) => [newReq, ...prev]);
    soundFx.playLootPickup();
    setFriendToast(`🔔 Squad Request from ${newReq.name}!`);
    setTimeout(() => setFriendToast(null), 2500);
  };

  const handleJoinSquadByCode = () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    soundFx.playLootPickup();
    setFriendToast(`✅ Squad code "${code}" connected!`);
    setTimeout(() => setFriendToast(null), 2000);
  };

  const copyTeamCode = () => {
    setTeamCodeCopied(true);
    soundFx.playLootPickup();
    setTimeout(() => setTeamCodeCopied(false), 2000);
  };

  // TRIGGER SQUAD MATCHMAKING OR START GAME
  const handleStartButtonClick = () => {
    soundFx.playLootPickup();
    if (teamType === 'squad' || teamType === 'duo') {
      setIsMatchmaking(true);
    } else {
      onStartGame(squad);
    }
  };

  const handleCancelMatchmaking = () => {
    setIsMatchmaking(false);
    setMatchmakingSec(0);
    setFriendToast('🛑 Matchmaking cancelled.');
    setTimeout(() => setFriendToast(null), 2000);
  };

  const handleFastDeployNow = () => {
    setIsMatchmaking(false);
    soundFx.playVictoryFanfare();
    onStartGame(squad);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none">
      {/* Background Live World Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/70 to-transparent z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/15 via-transparent to-transparent z-10" />
        <div className="w-full h-full bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />
      </div>

      {/* TOP HEADER CLUSTER - COMPACT FOR MOBILE LANDSCAPE */}
      <div className="relative z-20 w-full px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2 bg-gradient-to-b from-black/85 to-transparent border-b border-white/5 shrink-0">
        {/* Left: Player Profile Card */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 sm:p-1.5 rounded-xl shadow">
          <div className="relative">
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-amber-500 shadow"
            />
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-black text-[8px] font-black px-0.5 rounded shadow">
              {user.level}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-[11px] sm:text-xs text-white leading-tight">{user.nickname}</span>
              {user.isAdmin && (
                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[8px] font-black px-1 rounded shadow">
                  👑 VIP
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[9px] text-amber-400 font-bold">
                ⭐ {user.rank.toUpperCase()}
              </span>
              <span className="text-[8px] text-slate-400 font-mono hidden sm:inline">UID:{user.uid}</span>
            </div>
          </div>
        </div>

        {/* Center: Team Code & Voice Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-xl">
          <button
            onClick={copyTeamCode}
            className="flex items-center gap-1 text-[10px] font-mono text-amber-400 font-bold cursor-pointer"
            title="Click to copy Team Code"
          >
            <span>👥 CODE:</span>
            <span className="bg-black/60 px-1.5 py-0.2 rounded border border-amber-500/40 text-white">
              FF-89241
            </span>
            <span>{teamCodeCopied ? '✓' : '📋'}</span>
          </button>
          <div className="h-3 w-[1px] bg-slate-700" />
          <button
            onClick={() => setMicActive(!micActive)}
            className="text-[10px] p-0.5 text-slate-300 hover:text-white cursor-pointer"
            title="Toggle Mic"
          >
            {micActive ? '🎙️' : '🔇'}
          </button>
        </div>

        {/* Right: Currency Bar (Diamonds & Gold) + Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Diamonds Cluster */}
          <div
            onClick={onOpenDiamondStore}
            className="flex items-center gap-1 bg-slate-900/90 border border-amber-500/50 px-2 py-1 rounded-xl shadow cursor-pointer group"
          >
            <span className="text-xs">💎</span>
            <span className="text-[10px] sm:text-xs font-black text-amber-400">
              {user.diamonds.toLocaleString()}
            </span>
          </div>

          {/* Gold Coins Cluster */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-xl shadow">
            <span className="text-xs">🪙</span>
            <span className="text-[10px] sm:text-xs font-black text-yellow-300">
              {user.gold.toLocaleString()}
            </span>
          </div>

          {/* Logout / Switch Account */}
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* FLOATING SQUAD JOIN REQUEST BANNER - COMPACT */}
      {incomingRequests.length > 0 && !isMatchmaking && (
        <div className="relative z-30 px-3 -mt-0.5 flex justify-center shrink-0">
          <div className="bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border border-amber-400 rounded-xl py-1 px-3 shadow-lg flex items-center gap-2 backdrop-blur-md">
            <span className="text-xs">⚡</span>
            <span className="text-[9px] font-black text-amber-400 uppercase">REQUEST:</span>
            <p className="text-[10px] font-bold text-white leading-tight">
              <span className="text-amber-300">{incomingRequests[0].name}</span> wants to join!
            </p>
            <div className="flex items-center gap-1 ml-1.5">
              <button
                onClick={() => handleAcceptRequest(incomingRequests[0])}
                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase rounded transition cursor-pointer shadow"
              >
                ✓ ACCEPT
              </button>
              <button
                onClick={() => handleDeclineRequest(incomingRequests[0].id)}
                className="px-1.5 py-0.5 bg-slate-800 hover:bg-red-900 text-slate-300 text-[9px] uppercase rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQUAD MATCHMAKING ACTIVE BANNER & QUEUE RADAR */}
      {isMatchmaking && (
        <div className="relative z-30 px-3 my-1 flex justify-center shrink-0">
          <div className="w-full max-w-lg bg-slate-900/95 border-2 border-amber-400 rounded-2xl p-2.5 shadow-xl backdrop-blur-md text-center flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-between w-full border-b border-slate-800 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-wider">
                  MATCHMAKING IN PROGRESS
                </span>
              </div>
              <span className="text-[10px] font-mono font-black text-white bg-black/60 px-2 py-0.2 rounded border border-amber-500/40">
                ⏱️ {formatMatchmakingTimer(matchmakingSec)} / EST. {formatMatchmakingTimer(getEstimatedMatchTime(teamType))}
              </span>
            </div>

            <p className="text-[10px] text-amber-300 font-bold leading-tight">
              {matchmakingSec < 2 && '🔍 Searching 48 balanced survivors in Bermuda...'}
              {matchmakingSec >= 2 && matchmakingSec < 4 && '⚡ 12 squads found! Syncing Bermuda server (IND-48)...'}
              {matchmakingSec >= 4 && '🚀 Boarding airplane!'}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelMatchmaking}
                className="px-3 py-1 bg-slate-800 hover:bg-red-900 text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer border border-slate-700"
              >
                ✕ CANCEL
              </button>
              <button
                onClick={handleFastDeployNow}
                className="px-4 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[10px] uppercase rounded-lg shadow cursor-pointer active:scale-95"
              >
                ⚡ FAST DEPLOY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CENTER STAGE: 4-PLAYER SQUAD PODIUM - SCALED FOR HORIZONTAL PHONES */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center text-center px-2 py-1">
        {/* Active Emote Banner */}
        {activeEmoteText && (
          <div className="mb-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-black px-3 py-0.5 rounded-full shadow animate-bounce">
            {activeEmoteText}
          </div>
        )}

        {/* Toast Notification Banner */}
        {friendToast && (
          <div className="mb-1 px-3 py-0.5 rounded-full bg-slate-900/90 border border-amber-400 text-amber-300 text-[10px] font-bold shadow animate-fadeIn">
            {friendToast}
          </div>
        )}

        {/* 4-Player Squad Podium Lineup */}
        <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-6 w-full max-w-3xl my-0.5">
          {[0, 1, 2, 3].map((slotIdx) => {
            const member = squad[slotIdx];
            const maxSlots = maxSquadCapacity(teamType);
            if (slotIdx >= maxSlots) return null;

            if (member) {
              const isLeader = slotIdx === 0;
              return (
                <div key={member.id} className="flex flex-col items-center relative group">
                  {!isLeader && (
                    <button
                      onClick={() => handleRemoveSquadMember(member.id)}
                      title="Remove"
                      className="absolute -top-1.5 -right-1.5 z-20 w-4 h-4 rounded-full bg-red-600 hover:bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow cursor-pointer"
                    >
                      ✕
                    </button>
                  )}

                  {/* Player Name & Tag */}
                  <div className="mb-1 flex items-center gap-1 bg-black/70 border border-slate-700 px-2 py-0.2 rounded-full shadow">
                    {isLeader && <span className="text-[8px]">👑</span>}
                    <span className="text-[10px] sm:text-xs font-black text-white truncate max-w-[70px] sm:max-w-[90px]">
                      {member.name}
                    </span>
                    <span className="text-[8px] text-amber-400 font-bold">★</span>
                  </div>

                  {/* Standee Avatar */}
                  <div
                    className="w-16 h-28 sm:w-20 sm:h-34 md:w-24 md:h-38 rounded-2xl border-2 sm:border-3 shadow-xl flex flex-col items-center justify-between p-1.5 relative overflow-hidden transition"
                    style={{
                      borderColor: member.bundleColor,
                      backgroundColor: `${member.bundleColor}22`,
                    }}
                  >
                    <div className="text-xl sm:text-2xl mt-0.5">🪖</div>
                    <div className="text-base sm:text-lg">🥋</div>
                    <div className="text-lg sm:text-xl mb-0.5">⚡</div>
                  </div>

                  {/* Podium Base */}
                  <div
                    className="w-18 sm:w-22 h-4 sm:h-5 rounded-full border shadow mt-0.5 flex items-center justify-center"
                    style={{
                      borderColor: member.bundleColor,
                      backgroundColor: `${member.bundleColor}44`,
                    }}
                  >
                    <span className="text-[7px] sm:text-[8px] font-black tracking-widest text-white uppercase">
                      {isMatchmaking ? 'MATCHING...' : 'READY'}
                    </span>
                  </div>
                </div>
              );
            }

            // Empty Slot with Invite Button
            return (
              <div key={slotIdx} className="flex flex-col items-center">
                <button
                  onClick={() => {
                    setShowFriendsModal(true);
                    setFriendsTab('my_friends');
                  }}
                  className="w-16 h-28 sm:w-20 sm:h-34 md:w-24 md:h-38 rounded-2xl border border-dashed border-slate-700 hover:border-amber-400 bg-slate-900/40 hover:bg-slate-900/80 flex flex-col items-center justify-center gap-1 transition cursor-pointer group shadow"
                >
                  <span className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-amber-500 group-hover:text-black text-slate-400 text-sm flex items-center justify-center transition">
                    +
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-400 group-hover:text-amber-400 uppercase tracking-tight">
                    INVITE
                  </span>
                </button>
                <div className="w-18 sm:w-22 h-4 sm:h-5 rounded-full border border-slate-800 bg-slate-950/60 mt-0.5 flex items-center justify-center">
                  <span className="text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase">EMPTY</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Emote Trigger Button */}
        <button
          onClick={playLobbyEmote}
          className="mt-1 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-purple-500/60 rounded-full text-[10px] font-bold text-purple-300 hover:text-white flex items-center gap-1.5 shadow transition active:scale-95 cursor-pointer"
        >
          <span>🕺</span>
          <span>EMOTE</span>
        </button>
      </div>

      {/* LEFT SIDEBAR MENU: COMPACT FREE FIRE MOBILE DOCK */}
      <div className="absolute left-2 top-12 bottom-14 z-30 flex flex-col justify-center gap-1">
        {/* 1. EVENTS */}
        <button
          onClick={onOpenEvents}
          className="px-2 py-0.5 sm:py-1 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-tight flex items-center gap-1 shadow cursor-pointer active:scale-95"
        >
          <span>🔥</span>
          <span className="hidden sm:inline">EVENTS</span>
        </button>

        {/* 2. ROYALE */}
        <button
          onClick={onOpenEvents}
          className="px-2 py-0.5 sm:py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-amber-500 text-amber-400 font-bold text-[9px] sm:text-[10px] uppercase flex items-center gap-1 shadow cursor-pointer active:scale-95"
        >
          <span>🎰</span>
          <span className="hidden sm:inline">ROYALE</span>
        </button>

        {/* 3. STORE */}
        <button
          onClick={onOpenDiamondStore}
          className="px-2 py-0.5 sm:py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-amber-500 text-white font-bold text-[9px] sm:text-[10px] uppercase flex items-center gap-1 shadow cursor-pointer active:scale-95"
        >
          <span>🏬</span>
          <span className="hidden sm:inline">STORE</span>
        </button>

        {/* 4. VAULT (400+ Dresses) */}
        <button
          onClick={onOpenVault}
          className="px-2 py-0.5 sm:py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-amber-500 text-amber-300 font-black text-[9px] sm:text-[10px] uppercase flex items-center gap-1 shadow cursor-pointer active:scale-95 ring-1 ring-amber-500/30"
        >
          <span>👕</span>
          <span>VAULT</span>
        </button>

        {/* 5. WEAPON */}
        <button
          onClick={onOpenWeaponLab}
          className="px-2 py-0.5 sm:py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-400 text-cyan-400 font-bold text-[9px] sm:text-[10px] uppercase flex items-center gap-1 shadow cursor-pointer active:scale-95"
        >
          <span>⚡</span>
          <span className="hidden sm:inline">WEAPONS</span>
        </button>

        {/* 6. EMOTES */}
        <button
          onClick={onOpenEmotes}
          className="px-2 py-0.5 sm:py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-purple-400 text-purple-300 font-bold text-[9px] sm:text-[10px] uppercase flex items-center gap-1 shadow cursor-pointer active:scale-95"
        >
          <span>🕺</span>
          <span className="hidden sm:inline">EMOTES</span>
        </button>

        {/* 7. ADMIN PANEL (Manager only) */}
        {(user.isAdmin || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) && (
          <button
            onClick={onOpenAdminPanel}
            className="px-2 py-0.5 sm:py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-[9px] sm:text-[10px] uppercase flex items-center gap-1 shadow-lg border border-amber-300 cursor-pointer active:scale-95"
          >
            <span>👑</span>
            <span>ADMIN</span>
          </button>
        )}
      </div>

      {/* RIGHT SIDEBAR: ONLINE FRIENDS BUTTON */}
      <div className="absolute right-2 top-12 z-30 flex flex-col items-end gap-1">
        <button
          onClick={() => {
            setShowFriendsModal(true);
            setFriendsTab('my_friends');
          }}
          className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/60 rounded-xl flex items-center gap-1.5 text-[10px] font-black text-amber-400 shadow cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>FRIENDS ({onlineFriends.length})</span>
        </button>

        {incomingRequests.length > 0 && (
          <button
            onClick={() => {
              setShowFriendsModal(true);
              setFriendsTab('requests');
            }}
            className="px-2 py-0.5 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase shadow flex items-center gap-1 cursor-pointer"
          >
            <span>🔔</span>
            <span>{incomingRequests.length} REQ</span>
          </button>
        )}
      </div>

      {/* BOTTOM FOOTER: MODE SELECTOR + BIG START BUTTON */}
      <div className="relative z-20 w-full px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2 bg-gradient-to-t from-black via-black/85 to-transparent border-t border-white/5 shrink-0">
        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 sm:p-1.5 rounded-xl shadow">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-red-600 flex items-center justify-center text-sm shadow">
            🗺️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-amber-400 font-black tracking-wider uppercase leading-none">
                RANKED
              </span>
              <span className="text-[10px] font-black text-white leading-none">BERMUDA</span>
            </div>
            <div className="flex gap-1 mt-0.5">
              {(['solo', 'duo', 'squad'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTeamType(t);
                    soundFx.playLootPickup();
                  }}
                  className={`px-2 py-0.2 rounded text-[9px] font-black uppercase transition cursor-pointer ${
                    teamType === t
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStartButtonClick}
          disabled={isMatchmaking}
          className={`px-6 sm:px-10 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-amber-500/40 active:scale-95 transition flex items-center gap-2 cursor-pointer ${
            isMatchmaking ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          <span className="text-base sm:text-lg">✈️</span>
          <div className="text-left">
            <span className="block leading-none font-black text-xs sm:text-sm">
              {isMatchmaking ? 'MATCHING...' : 'START MATCH'}
            </span>
            <span className="text-[8px] font-bold tracking-widest text-amber-950 uppercase">
              {teamType.toUpperCase()} · SKYDIVE
            </span>
          </div>
        </button>
      </div>

      {/* Online Friends Modal (Free Fire Friends System) */}
      {showFriendsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2">
          <div className="w-full max-w-lg h-full max-h-[94dvh] bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-3 sm:p-4 shadow-2xl relative text-left flex flex-col overflow-hidden">
            <button
              onClick={() => setShowFriendsModal(false)}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xs font-bold cursor-pointer transition"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <span className="text-base">👥</span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider leading-tight">
                  FREE FIRE FRIENDS & SQUADS
                </h3>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Dosto ko squad mein invite karein ya request bhejein
                </p>
              </div>
            </div>

            {/* Toast Feedback */}
            {friendToast && (
              <div className="mb-2 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-300 text-[10px] font-bold shrink-0">
                {friendToast}
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1.5 mb-2 border-b border-slate-800 pb-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setFriendsTab('my_friends')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition cursor-pointer ${
                  friendsTab === 'my_friends'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                MY FRIENDS ({onlineFriends.length})
              </button>

              <button
                onClick={() => setFriendsTab('requests')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  friendsTab === 'requests'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <span>📬</span>
                <span>REQUESTS ({incomingRequests.length})</span>
              </button>

              <button
                onClick={() => setFriendsTab('add_friend')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition cursor-pointer ${
                  friendsTab === 'add_friend'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-slate-800/80 text-amber-400 hover:bg-slate-800'
                }`}
              >
                <span>➕</span>
                <span>ADD FRIEND</span>
              </button>

              <button
                onClick={() => setFriendsTab('team_code')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap transition cursor-pointer ${
                  friendsTab === 'team_code'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                TEAM CODE
              </button>
            </div>

            {/* TAB 1: MY FRIENDS */}
            {friendsTab === 'my_friends' && (
              <div className="flex flex-col flex-1 min-h-0">
                <input
                  type="text"
                  value={searchFriendQuery}
                  onChange={(e) => setSearchFriendQuery(e.target.value)}
                  placeholder="Search in friends..."
                  className="w-full px-2.5 py-1 bg-slate-950/80 border border-slate-700 focus:border-amber-500 rounded-lg text-[11px] text-white placeholder-slate-500 outline-none mb-2 shrink-0"
                />

                <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
                  {onlineFriends
                    .filter(
                      (f) =>
                        !searchFriendQuery ||
                        f.name.toLowerCase().includes(searchFriendQuery.toLowerCase()) ||
                        f.uid.includes(searchFriendQuery)
                    )
                    .map((friend) => {
                      const isInSquad = squad.some((m) => m.id === friend.id);
                      const isPending = pendingInvites[friend.id] === 'pending';

                      return (
                        <div
                          key={friend.id}
                          className="p-2 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow shrink-0">
                              {friend.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-white leading-tight">{friend.name}</p>
                              <p className="text-[9px] text-amber-400 font-bold leading-tight">
                                ★ {friend.rank} · Lv {friend.level}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {isInSquad ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-600/30 text-emerald-300 border border-emerald-500/50">
                                IN SQUAD ✓
                              </span>
                            ) : isPending ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 animate-pulse">
                                INVITED ⏳
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleInviteFriend(friend.id)}
                                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 hover:bg-amber-400 text-black active:scale-95 cursor-pointer"
                                >
                                  + INVITE
                                </button>
                                <button
                                  onClick={() => handleSendJoinRequest(friend)}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-700 text-slate-200 active:scale-95 cursor-pointer"
                                >
                                  JOIN
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleRemoveFriend(friend.id)}
                              className="w-5 h-5 rounded bg-slate-900 text-slate-400 hover:text-red-300 flex items-center justify-center text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 2: REQUESTS */}
            {friendsTab === 'requests' && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <span className="text-[10px] font-black text-white uppercase">
                    PENDING REQUESTS ({incomingRequests.length})
                  </span>
                  <button
                    onClick={handleSimulateNewRequest}
                    className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold rounded cursor-pointer"
                  >
                    + SIMULATE REQUEST
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto pr-1">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2 bg-slate-800/90 border border-amber-500/50 rounded-xl flex items-center justify-between gap-2 shadow"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center font-black text-black text-xs shrink-0">
                          {req.name[0]}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white leading-tight">{req.name}</p>
                          <p className="text-[9px] text-amber-400">★ {req.rank} · Lv {req.level}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAcceptRequest(req)}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-black text-[10px] uppercase rounded cursor-pointer"
                        >
                          ACCEPT
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id)}
                          className="px-2 py-1 bg-slate-700 text-slate-300 text-[10px] rounded cursor-pointer"
                        >
                          DECLINE
                        </button>
                      </div>
                    </div>
                  ))}

                  {incomingRequests.length === 0 && (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      📭 Koi pending join request nahi hai
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: ADD FRIEND */}
            {friendsTab === 'add_friend' && (
              <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="bg-slate-950/70 border border-amber-500/40 rounded-xl p-2.5 mb-2 shrink-0">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={newFriendNameInput}
                        onChange={(e) => setNewFriendNameInput(e.target.value)}
                        placeholder="Player name..."
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                        UID (Optional)
                      </label>
                      <input
                        type="text"
                        value={newFriendUidInput}
                        onChange={(e) => setNewFriendUidInput(e.target.value)}
                        placeholder="77889901"
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={newFriendRankInput}
                      onChange={(e) => setNewFriendRankInput(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-amber-400 text-[10px] font-bold rounded px-1.5 py-1 outline-none"
                    >
                      <option value="Grandmaster">Grandmaster</option>
                      <option value="Heroic">Heroic</option>
                      <option value="Master">Master</option>
                      <option value="Diamond">Diamond</option>
                    </select>

                    <button
                      onClick={() => handleAddFriend(newFriendNameInput, newFriendUidInput, newFriendRankInput)}
                      className="px-4 py-1 bg-amber-500 text-black font-black text-[10px] uppercase rounded-lg cursor-pointer shadow"
                    >
                      + ADD FRIEND
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-white uppercase mb-1">RECOMMENDED SURVIVORS</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {RECOMMENDED_SURVIVORS.map((rec) => {
                      const isAlreadyFriend = onlineFriends.some(
                        (f) => f.name.toLowerCase() === rec.name.toLowerCase() || f.uid === rec.uid
                      );
                      return (
                        <div key={rec.uid} className="p-1.5 bg-slate-800/80 border border-slate-700 rounded-lg flex items-center justify-between">
                          <div className="truncate pr-1">
                            <p className="text-[10px] font-bold text-white truncate">{rec.name}</p>
                            <p className="text-[8px] text-amber-400 truncate">★ {rec.rank}</p>
                          </div>
                          <button
                            onClick={() => handleAddFriend(rec.name, rec.uid, rec.rank, rec.bundleName, rec.bundleColor)}
                            disabled={isAlreadyFriend}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                              isAlreadyFriend ? 'bg-slate-700 text-slate-400' : 'bg-amber-500 text-black'
                            }`}
                          >
                            {isAlreadyFriend ? '✓' : '+ ADD'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TEAM CODE */}
            {friendsTab === 'team_code' && (
              <div className="flex flex-col gap-2 py-1">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-300 mb-1.5">Share your team code:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-1 bg-slate-900 border border-amber-500/50 rounded-lg font-mono text-sm font-black text-amber-400 tracking-widest text-center">
                      FF-89241
                    </div>
                    <button
                      onClick={copyTeamCode}
                      className="px-3 py-1 bg-amber-500 text-black font-black text-[10px] uppercase rounded-lg"
                    >
                      {teamCodeCopied ? 'COPIED!' : 'COPY'}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                  <p className="text-[10px] text-slate-300 mb-1.5">Enter friend squad code:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value)}
                      placeholder="e.g. FF-89241"
                      className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white uppercase font-mono"
                    />
                    <button
                      onClick={handleJoinSquadByCode}
                      className="px-3 py-1 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-lg"
                    >
                      JOIN
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
