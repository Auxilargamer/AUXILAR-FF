import React, { useState } from 'react';
import { UserProfile, saveUserProfile, ADMIN_EMAIL } from '../game/auth.ts';
import { FREE_FIRE_BUNDLES } from '../game/bundles.ts';
import { EVO_GUN_SKINS } from '../game/ff_data.ts';
import { soundFx } from '../game/audio.ts';

interface AdminPanelModalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onClose: () => void;
}

interface ModerationRecord {
  uid: string;
  name: string;
  avatar: string;
  rank: string;
  level: number;
  kdRatio: number;
  headshotRate: number;
  status: 'IN_MATCH' | 'IN_LOBBY' | 'SUSPENDED';
  isBanned: boolean;
  banReason?: string;
  banDuration?: string;
  hwidBlocked: boolean;
  ping: number;
}

const INITIAL_PLAYERS: ModerationRecord[] = [
  {
    uid: '84920194',
    name: 'Viper_Pro_X',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80',
    rank: 'Grandmaster',
    level: 78,
    kdRatio: 4.8,
    headshotRate: 64.2,
    status: 'IN_MATCH',
    isBanned: false,
    hwidBlocked: false,
    ping: 21,
  },
  {
    uid: '39201948',
    name: 'Apex_Sniper99',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    rank: 'Heroic',
    level: 64,
    kdRatio: 3.2,
    headshotRate: 48.5,
    status: 'IN_MATCH',
    isBanned: false,
    hwidBlocked: false,
    ping: 34,
  },
  {
    uid: '99201482',
    name: 'SpeedHacker_God',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    rank: 'Bronze I',
    level: 9,
    kdRatio: 18.4, // Suspicious
    headshotRate: 98.2, // Suspicious!
    status: 'IN_MATCH',
    isBanned: false,
    hwidBlocked: false,
    ping: 112,
  },
  {
    uid: '49201492',
    name: 'Ghost_Rider_FF',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    rank: 'Diamond IV',
    level: 52,
    kdRatio: 2.7,
    headshotRate: 38.1,
    status: 'IN_LOBBY',
    isBanned: false,
    hwidBlocked: false,
    ping: 28,
  },
  {
    uid: '77291048',
    name: 'Toxic_Flames',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    rank: 'Platinum II',
    level: 41,
    kdRatio: 1.9,
    headshotRate: 28.0,
    status: 'IN_LOBBY',
    isBanned: false,
    hwidBlocked: false,
    ping: 42,
  },
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ user, onUpdateUser, onClose }) => {
  const [activeModule, setActiveModule] = useState<'dispenser' | 'tribunal' | 'events' | 'godtools' | 'broadcast'>('dispenser');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Currency Dispenser state
  const [targetUid, setTargetUid] = useState<string>(user.uid);
  const [inputDiamonds, setInputDiamonds] = useState<string>('100000');
  const [inputCoins, setInputCoins] = useState<string>('500000');
  const [mailSubject, setMailSubject] = useState<string>('Garena GM Official Compensation Package');
  const [mailBody, setMailBody] = useState<string>('Dear Survivor, congratulations on participating in the Garena Master Server!');

  // Tribunal State
  const [playersList, setPlayersList] = useState<ModerationRecord[]>(INITIAL_PLAYERS);
  const [selectedPlayer, setSelectedPlayer] = useState<ModerationRecord>(INITIAL_PLAYERS[2]);
  const [selectedReason, setSelectedReason] = useState<string>('Auto-Aim / Silent Aim Hack (Code 403)');
  const [selectedBanDuration, setSelectedBanDuration] = useState<string>('10_YEARS');
  const [auditLogs, setAuditLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] GM console initialized by operator elightgamer1@gmail.com`,
    `[${new Date().toLocaleTimeString()}] Anti-Cheat Sentinel v8.2 connected to ASIA-SOUTH-1 cluster`,
  ]);

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState<string>('[OFFICIAL GM NOTICE]: Double Diamond Weekend Event is now live!');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    soundFx.playVictoryFanfare();
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Dispatch Currency
  const handleDispatchCurrency = () => {
    const dVal = parseInt(inputDiamonds, 10) || 0;
    const cVal = parseInt(inputCoins, 10) || 0;

    const updated = {
      ...user,
      diamonds: user.diamonds + dVal,
      gold: user.gold + cVal,
    };
    saveUserProfile(updated);
    onUpdateUser(updated);

    const log = `[${new Date().toLocaleTimeString()}] DISPATCH: Injected ${dVal.toLocaleString()} 💎 + ${cVal.toLocaleString()} 🪙 into account [UID: ${targetUid}]`;
    setAuditLogs([log, ...auditLogs]);
    showToast(`Successfully credited ${dVal.toLocaleString()} 💎 & ${cVal.toLocaleString()} 🪙!`);
  };

  // Instant Max Out
  const handleInstantMaxOut = () => {
    const allBundles = FREE_FIRE_BUNDLES.map((b) => b.id);
    const updated: UserProfile = {
      ...user,
      diamonds: 999999,
      gold: 5000000,
      level: 99,
      rank: 'Grandmaster',
      unlockedBundles: Array.from(new Set([...user.unlockedBundles, ...allBundles])),
      equippedBundle: 'bundle_red_criminal',
      equippedWeaponSkin: 'evo_ak47_blue_dragon',
    };
    saveUserProfile(updated);
    onUpdateUser(updated);
    showToast('MASTER OVERRIDE: Account Maxed to 999K 💎 + Level 99 + Grandmaster!');
  };

  // Ban Player
  const handleBanPlayer = (permanent: boolean) => {
    const duration = permanent ? '3650 Days (Permanent)' : '30 Days';
    setPlayersList(
      playersList.map((p) =>
        p.uid === selectedPlayer.uid
          ? {
              ...p,
              isBanned: true,
              status: 'SUSPENDED',
              banReason: selectedReason,
              banDuration: duration,
              hwidBlocked: true,
            }
          : p
      )
    );
    setSelectedPlayer({
      ...selectedPlayer,
      isBanned: true,
      status: 'SUSPENDED',
      banReason: selectedReason,
      banDuration: duration,
      hwidBlocked: true,
    });

    const log = `[${new Date().toLocaleTimeString()}] ACTION: Player ${selectedPlayer.name} [UID: ${selectedPlayer.uid}] was BANNED (${duration}) by GM elightgamer1. Reason: ${selectedReason}. Device IMEI blocked.`;
    setAuditLogs([log, ...auditLogs]);
    showToast(`BANNED ${selectedPlayer.name} [UID: ${selectedPlayer.uid}] (${duration})`);
  };

  // Unban Player
  const handleUnbanPlayer = () => {
    setPlayersList(
      playersList.map((p) =>
        p.uid === selectedPlayer.uid
          ? { ...p, isBanned: false, status: 'IN_LOBBY', banReason: undefined, hwidBlocked: false }
          : p
      )
    );
    setSelectedPlayer({
      ...selectedPlayer,
      isBanned: false,
      status: 'IN_LOBBY',
      banReason: undefined,
      hwidBlocked: false,
    });

    const log = `[${new Date().toLocaleTimeString()}] ACTION: Player ${selectedPlayer.name} [UID: ${selectedPlayer.uid}] was UNBANNED by GM elightgamer1.`;
    setAuditLogs([log, ...auditLogs]);
    showToast(`Player ${selectedPlayer.name} has been pardoned and UNBANNED.`);
  };

  // Send Broadcast
  const handleSendBroadcast = () => {
    if (!broadcastText.trim()) return;
    const log = `[${new Date().toLocaleTimeString()}] BROADCAST: Sent server-wide banner: "${broadcastText}"`;
    setAuditLogs([log, ...auditLogs]);
    showToast('Broadcast sent to all active servers!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2 md:p-6 select-none font-mono">
      <div className="w-full max-w-5xl bg-slate-950 border-2 border-red-600/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh] text-slate-200">
        {/* GM CONSOLE TOP BAR */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-black px-6 py-3 border-b-2 border-red-600/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm shadow">
              GM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black tracking-widest uppercase text-white">
                  GARENA GAME OPERATIONS CENTER (GOC)
                </h2>
                <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded">
                  LVL 5 CLEARANCE
                </span>
              </div>
              <p className="text-[10px] text-red-400 font-semibold">
                Operator: <span className="text-white">{ADMIN_EMAIL}</span> · Server: IND-DEL-04 (MUMBAI CLOUD)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full border border-red-600/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold">ONLINE · SECURE</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* MODERATOR TABS */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'dispenser', label: '💳 RESOURCE INJECTOR', desc: 'Diamonds & Coins' },
            { id: 'tribunal', label: '🛡️ BAN TRIBUNAL & ANTI-CHEAT', desc: 'Hardware Ban' },
            { id: 'godtools', label: '⚡ IN-GAME GOD OVERRIDE', desc: 'HP & Speed' },
            { id: 'events', label: '🎪 EVENT DROP MANIPULATOR', desc: 'Faded Wheel & Drops' },
            { id: 'broadcast', label: '📢 GLOBAL MARQUEE', desc: 'Server Alerts' },
          ].map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 whitespace-nowrap ${
                activeModule === mod.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 font-black'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{mod.label}</span>
            </button>
          ))}
        </div>

        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div className="bg-gradient-to-r from-red-600 to-amber-600 text-black font-black text-xs px-6 py-2 flex items-center justify-between">
            <span>⚡ {toastMsg}</span>
            <span className="text-[10px] text-black/70">EXECUTED ON MAIN SERVER</span>
          </div>
        )}

        {/* MODULE BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex flex-col gap-6">
          {/* 1. RESOURCE INJECTOR MODULE */}
          {activeModule === 'dispenser' && (
            <div className="flex flex-col gap-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span className="text-amber-400">💎</span> Garena Mailbox Injector & Direct Wallet Credit
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Instantly overwrite diamond and gold ledger tables for any target player UID or self account.
                    </p>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold">
                    Target UID: {targetUid}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Target UID */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Target Player UID</label>
                    <input
                      type="text"
                      value={targetUid}
                      onChange={(e) => setTargetUid(e.target.value)}
                      placeholder="e.g. 77788899"
                      className="w-full mt-1 bg-slate-800 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl outline-none focus:border-red-500 text-xs"
                    />
                  </div>

                  {/* Diamonds Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Diamonds to Credit (💎)</label>
                    <input
                      type="number"
                      value={inputDiamonds}
                      onChange={(e) => setInputDiamonds(e.target.value)}
                      placeholder="Amount..."
                      className="w-full mt-1 bg-slate-800 border border-slate-700 text-amber-400 font-mono font-bold px-3 py-2 rounded-xl outline-none focus:border-amber-400 text-xs"
                    />
                  </div>

                  {/* Gold Input */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Gold Coins to Credit (🪙)</label>
                    <input
                      type="number"
                      value={inputCoins}
                      onChange={(e) => setInputCoins(e.target.value)}
                      placeholder="Amount..."
                      className="w-full mt-1 bg-slate-800 border border-slate-700 text-yellow-300 font-mono font-bold px-3 py-2 rounded-xl outline-none focus:border-yellow-400 text-xs"
                    />
                  </div>
                </div>

                {/* Mail Attachments & Message */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Official Mail Subject</label>
                    <input
                      type="text"
                      value={mailSubject}
                      onChange={(e) => setMailSubject(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Official Mail Description</label>
                    <input
                      type="text"
                      value={mailBody}
                      onChange={(e) => setMailBody(e.target.value)}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={handleDispatchCurrency}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase rounded-xl shadow-lg transition active:scale-95"
                  >
                    🚀 EXECUTE DIRECT CREDIT TO WALLET
                  </button>

                  <button
                    onClick={handleInstantMaxOut}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-xs uppercase rounded-xl shadow-lg transition active:scale-95"
                  >
                    👑 FULL ACCOUNT OVERRIDE (999K 💎 + LV 99 + ALL BUNDLES)
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '50,000 💎 Starter Stash', d: 50000, c: 100000 },
                  { label: '250,000 💎 Whale Stash', d: 250000, c: 500000 },
                  { label: '500,000 💎 Tournament Pool', d: 500000, c: 1000000 },
                  { label: '999,999 💎 Max Server Cap', d: 999999, c: 5000000 },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputDiamonds(preset.d.toString());
                      setInputCoins(preset.c.toString());
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-xl text-left transition flex flex-col"
                  >
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Preset {idx + 1}</span>
                    <span className="text-xs font-bold text-white mt-1">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. BAN TRIBUNAL & ANTI-CHEAT */}
          {activeModule === 'tribunal' && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column: Player Investigation Table */}
              <div className="w-full lg:w-3/5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-white">Live Match Telemetry & Threat Monitor</h4>
                  <span className="text-[10px] text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-800">
                    ANTI-CHEAT AI: ACTIVE
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="p-3">Player</th>
                        <th className="p-3">Rank / K/D</th>
                        <th className="p-3">Headshot %</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {playersList.map((player) => (
                        <tr
                          key={player.uid}
                          onClick={() => setSelectedPlayer(player)}
                          className={`cursor-pointer transition ${
                            selectedPlayer.uid === player.uid
                              ? 'bg-red-950/40 border-l-4 border-red-500'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <span className="text-base">{player.isBanned ? '🚫' : '👤'}</span>
                            <div>
                              <p className="line-clamp-1">{player.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">UID: {player.uid}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="text-amber-400 font-bold">{player.rank}</p>
                            <p className="text-[10px] text-slate-400">K/D: {player.kdRatio}</p>
                          </td>
                          <td className="p-3">
                            <span
                              className={`font-bold ${
                                player.headshotRate > 80 ? 'text-red-400 font-black' : 'text-emerald-400'
                              }`}
                            >
                              {player.headshotRate}% {player.headshotRate > 80 && '⚠️ FLAGGED'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                player.isBanned
                                  ? 'bg-red-600 text-white'
                                  : player.status === 'IN_MATCH'
                                  ? 'bg-blue-950 text-blue-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {player.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button className="text-[11px] font-bold text-slate-400 hover:text-white">
                              Select →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Sentence & Enforcement Console */}
              <div className="w-full lg:w-2/5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <span className="text-xs font-black uppercase text-red-400">PUNISHMENT ENGINE</span>
                    <span className="text-[10px] font-mono text-slate-400">DEVICE HWID TRACER</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4">
                    <p className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{selectedPlayer.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">UID: {selectedPlayer.uid}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Suspicion Score: {selectedPlayer.headshotRate > 80 ? 'CRITICAL (99.8%)' : 'NORMAL (12%)'}
                    </p>
                    {selectedPlayer.isBanned && (
                      <div className="mt-2 text-[10px] bg-red-950 border border-red-800 text-red-300 p-2 rounded-lg">
                        <p className="font-bold">STATUS: BANNED / SUSPENDED</p>
                        <p>Reason: {selectedPlayer.banReason}</p>
                        <p>Hardware IMEI Blocked: YES</p>
                      </div>
                    )}
                  </div>

                  {/* Violation Reason */}
                  <div className="flex flex-col gap-1.5 mb-3">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Violation Category</label>
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="Auto-Aim / Silent Aim Hack (Code 403)">Auto-Aim / Silent Aim Hack (Code 403)</option>
                      <option value="Wallhack / Transparent Obstacle ESP">Wallhack / Transparent Obstacle ESP</option>
                      <option value="Speed Acceleration / Teleport Glitch">Speed Acceleration / Teleport Glitch</option>
                      <option value="Diamond Refund Abuse / Illicit Topup">Diamond Refund Abuse / Illicit Topup</option>
                      <option value="Hate Speech / Toxic Comms in Squad">Hate Speech / Toxic Comms in Squad</option>
                    </select>
                  </div>

                  {/* Duration Selector */}
                  <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Penalty Duration</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        onClick={() => setSelectedBanDuration('30_DAYS')}
                        className={`p-2 rounded-lg border font-bold ${
                          selectedBanDuration === '30_DAYS'
                            ? 'bg-red-600 text-white border-red-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        30 Days Suspension
                      </button>
                      <button
                        onClick={() => setSelectedBanDuration('10_YEARS')}
                        className={`p-2 rounded-lg border font-bold ${
                          selectedBanDuration === '10_YEARS'
                            ? 'bg-red-600 text-white border-red-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        10-Year Permanent Ban
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ban Action Buttons */}
                <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                  {selectedPlayer.isBanned ? (
                    <button
                      onClick={handleUnbanPlayer}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase rounded-xl transition"
                    >
                      ✅ PARDON & UNBAN THIS PLAYER
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBanPlayer(selectedBanDuration === '10_YEARS')}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase rounded-xl transition active:scale-95 shadow-lg shadow-red-600/30"
                    >
                      🚫 ENFORCE BAN & BLOCK HARDWARE (HWID)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. IN-GAME GOD OVERRIDE */}
          {activeModule === 'godtools' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">GM God Mode (Invincible 9999 HP)</h4>
                  <p className="text-[11px] text-slate-400">Player cannot take bullet, storm, or fall damage</p>
                </div>
                <button
                  onClick={() => {
                    const next = !user.godMode;
                    const u = { ...user, godMode: next };
                    saveUserProfile(u);
                    onUpdateUser(u);
                    showToast(`God Mode: ${next ? 'ENABLED' : 'DISABLED'}`);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${
                    user.godMode ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {user.godMode ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">One-Shot Raycast Kill</h4>
                  <p className="text-[11px] text-slate-400">999 damage lethal bullets on any hit</p>
                </div>
                <button
                  onClick={() => {
                    const next = !user.oneShotKill;
                    const u = { ...user, oneShotKill: next };
                    saveUserProfile(u);
                    onUpdateUser(u);
                    showToast(`One-Shot Kill: ${next ? 'ENABLED' : 'DISABLED'}`);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${
                    user.oneShotKill ? 'bg-red-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {user.oneShotKill ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Speed Multiplier</h4>
                  <p className="text-[11px] text-slate-400">Current: {user.speedMultiplier || 1.0}x velocity</p>
                </div>
                <div className="flex gap-1.5">
                  {[1.0, 1.5, 2.0, 3.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        const u = { ...user, speedMultiplier: s };
                        saveUserProfile(u);
                        onUpdateUser(u);
                        showToast(`Speed set to ${s}x`);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        (user.speedMultiplier || 1.0) === s
                          ? 'bg-amber-400 text-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Island Bot Density</h4>
                  <p className="text-[11px] text-slate-400">Spawn count in Bermuda match (Current: {user.customBotCount || 5})</p>
                </div>
                <div className="flex gap-1.5">
                  {[3, 5, 8, 12, 16].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => {
                        const u = { ...user, customBotCount: cnt };
                        saveUserProfile(u);
                        onUpdateUser(u);
                        showToast(`Bot Count set to ${cnt}`);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        (user.customBotCount || 5) === cnt
                          ? 'bg-amber-400 text-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. EVENT DROP MANIPULATOR */}
          {activeModule === 'events' && (
            <div className="flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h4 className="text-amber-400 font-bold uppercase text-xs mb-2">Luck Royale RNG Modifier</h4>
                <p className="text-xs text-slate-400 mb-4">
                  Force 100% Guaranteed Grand Prize on the 1st Spin of Faded Wheel & Weapon Royale!
                </p>
                <button
                  onClick={() => showToast('RNG OVERRIDE: Luck rate set to 100% Guaranteed Grand Prize!')}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs uppercase rounded-xl transition"
                >
                  ⚡ FORCE 100% GRAND PRIZE ON 1ST SPIN
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h4 className="text-fuchsia-400 font-bold uppercase text-xs mb-2">Mystery Shop 90% Discount Force</h4>
                <p className="text-xs text-slate-400 mb-4">
                  Lock all player mystery shop discount wheels to maximum 90% discount!
                </p>
                <button
                  onClick={() => showToast('STORE OVERRIDE: Mystery Shop locked to 90% Discount!')}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-xs uppercase rounded-xl transition"
                >
                  🛍️ SET MYSTERY SHOP TO 90% OFF
                </button>
              </div>
            </div>
          )}

          {/* 5. GLOBAL BROADCAST MARQUEE */}
          {activeModule === 'broadcast' && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Server-Wide Marquee Broadcast
                </h4>
                <p className="text-xs text-slate-400">
                  Broadcasts a scrolling golden announcement across the screen of all players in Bermuda and Lobby.
                </p>
              </div>

              <textarea
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-amber-300 font-bold p-3 rounded-xl outline-none focus:border-amber-400 text-xs"
              />

              <button
                onClick={handleSendBroadcast}
                className="self-start px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs uppercase rounded-xl shadow-lg transition active:scale-95"
              >
                📢 SEND BROADCAST TO ALL PLAYERS
              </button>
            </div>
          )}

          {/* AUDIT LOG TERMINAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
              <span>LIVE GARENA GM AUDIT LOGS</span>
              <span className="text-emerald-400">SYNCED</span>
            </div>
            <div className="max-h-24 overflow-y-auto font-mono text-[11px] text-slate-400 flex flex-col gap-1">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-red-500">›</span>
                  <span className="text-slate-300">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GM CONSOLE FOOTER */}
        <div className="bg-black px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <span>GARENA OPERATIONS CONSOLE V4.88-PROD · AUTHORIZED GM ONLY</span>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs"
          >
            EXIT GM CONSOLE
          </button>
        </div>
      </div>
    </div>
  );
};
