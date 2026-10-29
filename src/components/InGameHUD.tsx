import React, { useState, useRef, useEffect } from 'react';
import { WeaponStats } from '../game/types.ts';
import { soundFx } from '../game/audio.ts';

interface InGameHUDProps {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldPotions: number;
  ammo: { current: number; maxClip: number; reserve: number };
  weapon: WeaponStats;
  inventory?: WeaponStats[];
  activeWeaponIndex?: number;
  aliveCount: number;
  kills: number;
  medkits: number;
  zoneTimer: { remainingSec: number; phase: number; isShrinking: boolean };
  isOutsideZone: boolean;
  hitmarker: boolean;
  pickupPrompt: string | null;
  flightStage?: 'plane' | 'skydive' | 'parachute' | 'ground';
  altitude?: number;
  activeSquad?: { id: string; name: string; rank: string; bundleColor: string; hp?: number }[];
  minimapData: {
    playerPos: { x: number; z: number; angle: number };
    safeZone: { x: number; z: number; radius: number };
    nextSafeZone: { x: number; z: number; radius: number };
    bots: { x: number; z: number }[];
    crates: { x: number; z: number; collected: boolean }[];
  } | null;
  onUseMedkit: () => void;
  onUseShieldPotion: () => void;
  onSwitchWeapon: (idx: number) => void;
  onPause: () => void;
  onVirtualMove?: (x: number, z: number) => void;
  onAimDelta?: (dx: number, dy: number) => void;
  onJump?: () => void;
  onCrouch?: () => void;
  onScope?: () => void;
  onShootStart?: () => void;
  onShootEnd?: () => void;
  onReload?: () => void;
  onActiveSkill?: () => void;
  onEjectPlane?: () => void;
  onDeployParachute?: () => void;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({
  hp,
  maxHp,
  shield,
  maxShield,
  shieldPotions,
  ammo,
  weapon,
  inventory = [],
  activeWeaponIndex = 0,
  aliveCount,
  kills,
  medkits,
  zoneTimer,
  isOutsideZone,
  hitmarker,
  pickupPrompt,
  flightStage = 'ground',
  altitude = 0,
  activeSquad = [],
  minimapData,
  onUseMedkit,
  onUseShieldPotion,
  onSwitchWeapon,
  onPause,
  onVirtualMove,
  onAimDelta,
  onJump,
  onCrouch,
  onScope,
  onShootStart,
  onShootEnd,
  onReload,
  onActiveSkill,
  onEjectPlane,
  onDeployParachute,
}) => {
  const [isMuted, setIsMuted] = useState(soundFx.isMuted());
  const [activeEmoteText, setActiveEmoteText] = useState<string | null>(null);
  const [isAutoSprint, setIsAutoSprint] = useState(false);
  const [isCrouched, setIsCrouched] = useState(false);
  const [isScoped, setIsScoped] = useState(false);
  const [killfeed, setKillfeed] = useState<string[]>([
    'Bermuda Island Battle Royale live!',
  ]);

  // Virtual Joystick Touch Tracking
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickNubPos, setJoystickNubPos] = useState({ x: 0, y: 0 });
  const [isJoystickDragging, setIsJoystickDragging] = useState(false);

  // Right-side Touch Aim Tracking
  const touchAimRef = useRef<{ lastX: number; lastY: number; active: boolean }>({
    lastX: 0,
    lastY: 0,
    active: false,
  });

  const toggleSound = () => {
    const next = soundFx.toggleMute();
    setIsMuted(next);
  };

  const handleQuickEmote = (emoteName: string) => {
    setActiveEmoteText(`🕺 ${emoteName}`);
    soundFx.playVictoryFanfare();
    setTimeout(() => setActiveEmoteText(null), 2500);
  };

  // Joystick handlers
  const handleJoystickStart = (clientX: number, clientY: number) => {
    setIsJoystickDragging(true);
    updateJoystick(clientX, clientY);
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2 - 10;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const dist = Math.hypot(deltaX, deltaY);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(deltaY, deltaX);

    const nubX = Math.cos(angle) * clampedDist;
    const nubY = Math.sin(angle) * clampedDist;
    setJoystickNubPos({ x: nubX, y: nubY });

    // Normalized move vector (-1 to 1)
    const normX = nubX / maxRadius;
    const normY = nubY / maxRadius;
    onVirtualMove?.(normX, normY);

    // Sprint lock trigger if dragged all the way up
    if (normY < -0.85) {
      setIsAutoSprint(true);
    }
  };

  const handleJoystickEnd = () => {
    setIsJoystickDragging(false);
    setJoystickNubPos({ x: 0, y: 0 });
    onVirtualMove?.(0, 0);
  };

  // Touch Aim Surface Handlers
  const handleAimTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchAimRef.current = {
      lastX: touch.clientX,
      lastY: touch.clientY,
      active: true,
    };
  };

  const handleAimTouchMove = (e: React.TouchEvent) => {
    if (!touchAimRef.current.active) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchAimRef.current.lastX;
    const dy = touch.clientY - touchAimRef.current.lastY;
    touchAimRef.current.lastX = touch.clientX;
    touchAimRef.current.lastY = touch.clientY;
    onAimDelta?.(dx, dy);
  };

  const handleAimTouchEnd = () => {
    touchAimRef.current.active = false;
  };

  return (
    <div className="fixed inset-0 select-none z-30 flex flex-col justify-between p-3 md:p-5 overflow-hidden font-sans pointer-events-none">
      {/* Red Peripheral Screen Vignette when outside safe zone */}
      {isOutsideZone && (
        <div className="absolute inset-0 pointer-events-none border-8 border-red-600/70 bg-red-950/20 animate-pulse z-0 flex items-center justify-center">
          <div className="bg-red-600 text-white font-black text-xs uppercase px-4 py-1.5 rounded-full shadow-2xl tracking-widest mt-24">
            ⚠️ WARNING: OUTSIDE SAFE ZONE! (-5 HP/S)
          </div>
        </div>
      )}

      {/* Scope Zoom Overlay when Scope is active */}
      {isScoped && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="w-[320px] h-[320px] md:w-[420px] md:h-[420px] rounded-full border-4 border-black/80 bg-cyan-950/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] flex items-center justify-center relative">
            <div className="w-full h-[1px] bg-red-500/80" />
            <div className="h-full w-[1px] bg-red-500/80 absolute" />
            <div className="w-16 h-16 rounded-full border border-red-500/60 absolute" />
            <div className="w-2 h-2 rounded-full bg-red-500 absolute" />
            <span className="absolute bottom-6 text-[10px] font-mono text-cyan-400 font-black">
              4X OPTICAL SCOPE
            </span>
          </div>
        </div>
      )}

      {/* Touch Aim Surface on Right Half of Screen */}
      <div
        className="absolute right-0 top-0 w-1/2 h-full pointer-events-auto z-0"
        onTouchStart={handleAimTouchStart}
        onTouchMove={handleAimTouchMove}
        onTouchEnd={handleAimTouchEnd}
      />

      {/* TOP HEADER CLUSTER: MINIMAP, FLIGHT BANNER, WEAPON SLOTS */}
      <div className="relative z-20 w-full flex items-start justify-between gap-3">
        {/* Top Left: Free Fire Minimap Radar */}
        <div className="flex items-start gap-2.5">
          <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-amber-500/80 bg-slate-950/90 shadow-2xl overflow-hidden pointer-events-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-slate-700/60" />
              <div className="w-10 h-10 rounded-full border border-slate-800/80" />

              {minimapData && (
                <div
                  className="absolute rounded-full border-2 border-cyan-400 bg-cyan-500/10"
                  style={{
                    width: `${Math.max(16, (minimapData.safeZone.radius / 72) * 95)}px`,
                    height: `${Math.max(16, (minimapData.safeZone.radius / 72) * 95)}px`,
                    transform: `translate(${minimapData.safeZone.x * 0.6}px, ${minimapData.safeZone.z * 0.6}px)`,
                  }}
                />
              )}

              {minimapData?.bots.map((bot, idx) => (
                <div
                  key={idx}
                  className="absolute w-2 h-2 rounded-full bg-red-500 shadow-sm"
                  style={{
                    transform: `translate(${(bot.x - minimapData.playerPos.x) * 1.1}px, ${(bot.z - minimapData.playerPos.z) * 1.1}px)`,
                  }}
                />
              ))}

              <div
                className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-amber-400 z-10"
                style={{
                  transform: `rotate(${minimapData ? (-minimapData.playerPos.angle * 180) / Math.PI + 180 : 0}deg)`,
                }}
              />
            </div>

            <span className="absolute bottom-1 left-2 text-[8px] font-black text-amber-400">
              BERMUDA
            </span>
            <span className="absolute top-1 right-2 text-[8px] font-bold text-slate-400">N</span>
          </div>

          <div className="flex flex-col gap-1 mt-0.5">
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-0.5 rounded-lg shadow">
              <span className="text-[11px]">👥</span>
              <span className="text-[11px] font-black text-white">{aliveCount} ALIVE</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-0.5 rounded-lg shadow">
              <span className="text-[11px]">🎯</span>
              <span className="text-[11px] font-black text-amber-400">{kills} KILLS</span>
            </div>

            {/* Squad Members Roster (Free Fire In-Game Squad Widget) */}
            {activeSquad && activeSquad.length > 1 && (
              <div className="flex flex-col gap-1 bg-black/80 border border-amber-500/40 p-1.5 rounded-xl backdrop-blur-sm shadow-xl max-w-[150px] mt-0.5">
                <div className="flex items-center justify-between text-[8px] font-black text-amber-400 border-b border-slate-800 pb-0.5">
                  <span>🛡️ SQUAD</span>
                  <span className="text-emerald-400">{activeSquad.length}P</span>
                </div>
                {activeSquad.map((m, idx) => (
                  <div key={m.id} className="flex flex-col text-[9px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[90px]">
                        {idx + 1}. {m.name}
                      </span>
                      <span className="text-[7px] text-amber-400 font-bold">★</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-0.5 border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${m.hp ?? 100}%`,
                          backgroundColor: m.bundleColor || '#10b981',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Center: Flight / Skydive Alerts or Zone Countdown */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
          {flightStage === 'plane' && (
            <div className="flex flex-col items-center gap-2">
              <div className="px-4 py-1.5 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
                <span>✈️</span>
                <span>PLANE FLYING OVER BERMUDA ISLAND</span>
              </div>
              <button
                onClick={onEjectPlane}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase rounded-2xl shadow-2xl tracking-wider active:scale-95 transition cursor-pointer flex items-center gap-2 border-2 border-amber-400"
              >
                <span>🪂</span>
                <span>EJECT / JUMP OUT (कूदें)</span>
              </button>
            </div>
          )}

          {flightStage === 'skydive' && (
            <div className="flex flex-col items-center gap-2">
              <div className="px-4 py-1.5 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2">
                <span>🪂</span>
                <span>FREE-FALLING · ALTITUDE: {Math.round(altitude)}M · 140 KM/H</span>
              </div>
              <button
                onClick={onDeployParachute}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs uppercase rounded-2xl shadow-2xl tracking-wider active:scale-95 transition cursor-pointer flex items-center gap-2 border-2 border-white"
              >
                <span>🪂</span>
                <span>DEPLOY PARACHUTE (पैराशूट खोलें)</span>
              </button>
            </div>
          )}

          {flightStage === 'parachute' && (
            <div className="px-4 py-1.5 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2">
              <span>🪂</span>
              <span>GLIDING TO BERMUDA · ALTITUDE: {Math.round(altitude)}M</span>
            </div>
          )}

          {flightStage === 'ground' && (
            <div
              className={`px-4 py-1.5 rounded-2xl border font-black text-xs tracking-wider uppercase shadow-2xl flex items-center gap-2 ${
                zoneTimer.isShrinking
                  ? 'bg-red-950/90 border-red-500 text-red-300 animate-pulse'
                  : 'bg-slate-900/90 border-amber-500/60 text-amber-300'
              }`}
            >
              <span>⏱️</span>
              <span>
                {zoneTimer.isShrinking
                  ? `ZONE COLLAPSING! (0:${zoneTimer.remainingSec.toString().padStart(2, '0')})`
                  : `ZONE SHRINKING IN 0:${zoneTimer.remainingSec.toString().padStart(2, '0')}`}
              </span>
            </div>
          )}
        </div>

        {/* Top Right: Free Fire 3-Slot Weapon Strip & Controls */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* Audio, Ping & Pause */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-emerald-400 font-mono bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded-lg">
              📶 18ms
            </span>
            <button
              onClick={toggleSound}
              className="p-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={onPause}
              className="px-2 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 cursor-pointer"
            >
              PAUSE
            </button>
          </div>

          {/* Free Fire Weapon Slots Ribbon */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1 rounded-2xl shadow-xl">
            {/* Slot 1: Primary Weapon */}
            <button
              onClick={() => onSwitchWeapon(0)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                activeWeaponIndex === 0
                  ? 'bg-amber-500/20 border-amber-400 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-sm">🔫</span>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-amber-400">
                  {inventory[0]?.name || 'PRIMARY'}
                </p>
                <p className="text-[10px] font-mono font-black text-white leading-none">
                  {inventory[0] ? `${inventory[0].currentAmmo}/${inventory[0].reserveAmmo}` : '-'}
                </p>
              </div>
            </button>

            {/* Slot 2: Secondary Weapon */}
            <button
              onClick={() => onSwitchWeapon(1)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition cursor-pointer ${
                activeWeaponIndex === 1
                  ? 'bg-amber-500/20 border-amber-400 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-sm">🎯</span>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-cyan-400">
                  {inventory[1]?.name || 'SECONDARY'}
                </p>
                <p className="text-[10px] font-mono font-black text-white leading-none">
                  {inventory[1] ? `${inventory[1].currentAmmo}/${inventory[1].reserveAmmo}` : '-'}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* CENTER RETICLE & PROMPTS */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Reticle */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow" />
          <div className="absolute w-3 h-[2px] -left-4 bg-white/80" />
          <div className="absolute w-3 h-[2px] -right-4 bg-white/80" />
          <div className="absolute h-3 w-[2px] -top-4 bg-white/80" />
          <div className="absolute h-3 w-[2px] -bottom-4 bg-white/80" />

          {/* Hitmarker Flash */}
          {hitmarker && (
            <div className="absolute inset-0 flex items-center justify-center text-red-500 font-black text-2xl animate-ping">
              ✕
            </div>
          )}
        </div>

        {/* Pickup Prompt Toast */}
        {pickupPrompt && (
          <div className="absolute bottom-32 bg-amber-500 text-black font-black text-xs px-4 py-1.5 rounded-xl shadow-2xl tracking-wider uppercase animate-bounce pointer-events-auto">
            {pickupPrompt}
          </div>
        )}

        {/* Active Emote Text Display */}
        {activeEmoteText && (
          <div className="absolute top-1/3 bg-purple-600 text-white font-black text-sm px-4 py-1.5 rounded-full shadow-2xl animate-bounce">
            {activeEmoteText}
          </div>
        )}
      </div>

      {/* BOTTOM CLUSTER: LEFT JOYSTICK & RIGHT COMBAT CLUSTER */}
      <div className="relative z-20 w-full flex items-end justify-between gap-4 pointer-events-none">
        {/* BOTTOM LEFT: VIRTUAL ANALOG JOYSTICK & STATUS BARS */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          {/* Health & Shield Bar Card */}
          <div className="flex flex-col gap-1 bg-slate-950/90 border border-slate-800 p-2.5 rounded-2xl shadow-2xl min-w-[210px]">
            {/* Shield Bar */}
            <div className="flex items-center justify-between text-[10px] font-black">
              <span className="text-cyan-300 flex items-center gap-1">🛡️ SHIELD</span>
              <span className="text-cyan-400 font-mono">
                {Math.max(0, Math.round(shield))} / {maxShield}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-cyan-800/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm transition-all duration-150"
                style={{ width: `${Math.max(0, (shield / maxShield) * 100)}%` }}
              />
            </div>

            {/* HP Bar */}
            <div className="flex items-center justify-between text-[10px] font-black mt-0.5">
              <span className="text-white flex items-center gap-1">❤️ HP</span>
              <span className="text-emerald-400 font-mono">
                {Math.max(0, Math.round(hp))} / {maxHp}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  hp > 50
                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                    : hp > 25
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse'
                }`}
                style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
              />
            </div>

            {/* EP Bar */}
            <div className="flex items-center justify-between text-[9px] font-black mt-0.5">
              <span className="text-yellow-400">⚡ EP</span>
              <span className="text-yellow-400 font-mono">200 / 200</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-full h-full bg-yellow-400 rounded-full" />
            </div>
          </div>

          {/* Quick Item Buttons (Medkit & Shield Potion & Sprint) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onUseShieldPotion}
              disabled={shieldPotions <= 0 || shield >= maxShield}
              className={`p-2 rounded-2xl border flex items-center gap-1.5 shadow-xl transition active:scale-95 ${
                shieldPotions > 0 && shield < maxShield
                  ? 'bg-slate-900 border-cyan-500/80 hover:border-cyan-400 text-white cursor-pointer'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="text-lg">🧪</span>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-cyan-400">POTION</p>
                <p className="text-[10px] font-bold text-white leading-none">x{shieldPotions}</p>
              </div>
            </button>

            <button
              onClick={onUseMedkit}
              disabled={medkits <= 0 || hp >= maxHp}
              className={`p-2 rounded-2xl border flex items-center gap-1.5 shadow-xl transition active:scale-95 ${
                medkits > 0 && hp < maxHp
                  ? 'bg-slate-900 border-emerald-500/80 hover:border-emerald-400 text-white cursor-pointer'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span className="text-lg">🩹</span>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-emerald-400">MEDKIT</p>
                <p className="text-[10px] font-bold text-white leading-none">x{medkits}</p>
              </div>
            </button>

            <button
              onClick={() => setIsAutoSprint(!isAutoSprint)}
              className={`p-2 rounded-2xl border flex items-center gap-1.5 shadow-xl transition active:scale-95 cursor-pointer ${
                isAutoSprint
                  ? 'bg-amber-500 text-black border-amber-300 font-black'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <span className="text-lg">🏃‍♂️</span>
              <p className="text-[9px] font-black uppercase">
                {isAutoSprint ? 'SPRINT ON' : 'SPRINT'}
              </p>
            </button>
          </div>

          {/* Free Fire 360° Virtual Analog Joystick */}
          <div
            ref={joystickBaseRef}
            onMouseDown={(e) => handleJoystickStart(e.clientX, e.clientY)}
            onMouseMove={(e) => isJoystickDragging && updateJoystick(e.clientX, e.clientY)}
            onMouseUp={handleJoystickEnd}
            onMouseLeave={handleJoystickEnd}
            onTouchStart={(e) =>
              handleJoystickStart(e.touches[0].clientX, e.touches[0].clientY)
            }
            onTouchMove={(e) =>
              isJoystickDragging &&
              updateJoystick(e.touches[0].clientX, e.touches[0].clientY)
            }
            onTouchEnd={handleJoystickEnd}
            className="relative w-32 h-32 rounded-full border-2 border-white/20 bg-slate-950/60 shadow-2xl flex items-center justify-center cursor-pointer select-none touch-none"
          >
            {/* Sprint Lock Arrow Top */}
            <div className="absolute top-1 flex flex-col items-center">
              <span className="text-[10px] text-amber-400 font-bold">▲</span>
              <span className="text-[8px] font-black text-amber-400 tracking-tighter uppercase">
                LOCK SPRINT
              </span>
            </div>

            {/* Inner Movement Boundaries */}
            <div className="w-16 h-16 rounded-full border border-white/10" />

            {/* Draggable Thumb Nub */}
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white shadow-xl flex items-center justify-center transition-transform duration-75 text-base"
              style={{
                transform: `translate(${joystickNubPos.x}px, ${joystickNubPos.y}px)`,
              }}
            >
              🕹️
            </div>
          </div>
        </div>

        {/* BOTTOM RIGHT: AUTHENTIC FREE FIRE MOBILE COMBAT CLUSTER */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {/* Upper Action Row: Skill, Gloo Wall, Emote, Reload */}
          <div className="flex items-center gap-2">
            {/* Active Character Ability Skill (DJ Alok / Chrono) */}
            <button
              onClick={onActiveSkill}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 border-2 border-amber-300 text-black flex flex-col items-center justify-center shadow-2xl active:scale-95 transition cursor-pointer"
              title="Active Character Skill"
            >
              <span className="text-base leading-none">⚡</span>
              <span className="text-[8px] font-black uppercase">SKILL</span>
            </button>

            {/* Gloo Wall Shield Button */}
            <button
              onClick={() => {
                soundFx.playLootPickup();
                setKillfeed((prev) => ['🛡️ Gloo Wall deployed!', ...prev.slice(0, 3)]);
              }}
              className="w-12 h-12 rounded-full bg-slate-900 border-2 border-cyan-400 text-cyan-300 flex flex-col items-center justify-center shadow-xl active:scale-95 transition cursor-pointer"
              title="Deploy Gloo Wall"
            >
              <span className="text-base leading-none">🛡️</span>
              <span className="text-[8px] font-black uppercase">GLOO</span>
            </button>

            {/* Reload Button */}
            <button
              onClick={onReload}
              className="w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-500 text-amber-400 flex flex-col items-center justify-center shadow-xl active:scale-95 transition cursor-pointer"
              title="Reload Weapon"
            >
              <span className="text-base leading-none">🔄</span>
              <span className="text-[8px] font-black uppercase">RELOAD</span>
            </button>

            {/* Emote Button */}
            <button
              onClick={() => handleQuickEmote('LOL EMOTE!')}
              className="w-12 h-12 rounded-full bg-slate-900 border-2 border-purple-400 text-purple-300 flex flex-col items-center justify-center shadow-xl active:scale-95 transition cursor-pointer"
              title="Emote"
            >
              <span className="text-base leading-none">🕺</span>
              <span className="text-[8px] font-black uppercase">EMOTE</span>
            </button>
          </div>

          {/* Main Free Fire Combat Controls: Stance + Big Fire + Jump + Scope */}
          <div className="relative flex items-center justify-end gap-3 mt-1">
            {/* Stance Buttons: Crouch & Prone */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsCrouched(!isCrouched);
                  onCrouch?.();
                }}
                className={`w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center shadow-xl active:scale-95 transition cursor-pointer ${
                  isCrouched
                    ? 'bg-amber-500 text-black border-white'
                    : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
                title="Crouch"
              >
                <span className="text-sm">🧎</span>
                <span className="text-[7px] font-black uppercase">CROUCH</span>
              </button>

              <button
                onClick={onScope}
                className={`w-11 h-11 rounded-full border-2 flex flex-col items-center justify-center shadow-xl active:scale-95 transition cursor-pointer ${
                  isScoped
                    ? 'bg-cyan-500 text-black border-white'
                    : 'bg-slate-900 border-cyan-500/80 text-cyan-300'
                }`}
                title="Aim Down Sights (ADS)"
              >
                <span className="text-sm">🎯</span>
                <span className="text-[7px] font-black uppercase">SCOPE</span>
              </button>
            </div>

            {/* Jump Button */}
            <button
              onClick={onJump}
              className="w-14 h-14 rounded-full bg-slate-900/95 border-2 border-amber-400 hover:border-amber-300 text-amber-400 flex flex-col items-center justify-center shadow-2xl active:scale-90 transition cursor-pointer"
              title="Jump"
            >
              <span className="text-xl leading-none">🦘</span>
              <span className="text-[8px] font-black uppercase mt-0.5">JUMP</span>
            </button>

            {/* Big Circular Free Fire FIRE Button */}
            <button
              onMouseDown={onShootStart}
              onMouseUp={onShootEnd}
              onTouchStart={onShootStart}
              onTouchEnd={onShootEnd}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 via-red-600 to-amber-700 border-4 border-amber-300 hover:border-white text-white flex flex-col items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.6)] active:scale-95 transition cursor-pointer select-none"
              title="Primary Fire Button"
            >
              <span className="text-2xl leading-none">🎯</span>
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-200 mt-1">
                FIRE
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
