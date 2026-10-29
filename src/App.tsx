/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, loadUserProfile, saveUserProfile, ADMIN_EMAIL, getAdminProfile } from './game/auth.ts';
import { GameEngine } from './game/GameEngine.ts';
import { WeaponStats } from './game/types.ts';
import { WEAPON_PRESETS } from './game/rules.ts';
import { soundFx } from './game/audio.ts';
import { SquadMember } from './game/squadLogic.ts';

// Components
import { LoginScreen } from './components/LoginScreen.tsx';
import { Lobby } from './components/Lobby.tsx';
import { InGameHUD } from './components/InGameHUD.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { AdminPanelModal } from './components/AdminPanelModal.tsx';
import { EventsModal } from './components/EventsModal.tsx';
import { VaultModal } from './components/VaultModal.tsx';
import { WeaponLabModal } from './components/WeaponLabModal.tsx';
import { EmotesModal } from './components/EmotesModal.tsx';
import { DiamondStoreModal } from './components/DiamondStoreModal.tsx';

type AppState = 'lobby' | 'playing' | 'paused' | 'victory' | 'gameover';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => loadUserProfile());
  const [gameState, setGameState] = useState<AppState>('lobby');
  const [activeSquad, setActiveSquad] = useState<SquadMember[]>([]);

  // Active Modals
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isWeaponLabOpen, setIsWeaponLabOpen] = useState(false);
  const [isEmotesOpen, setIsEmotesOpen] = useState(false);
  const [isDiamondStoreOpen, setIsDiamondStoreOpen] = useState(false);

  // In-Game Live State
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [shield, setShield] = useState(50);
  const [maxShield, setMaxShield] = useState(100);
  const [shieldPotions, setShieldPotions] = useState(2);
  const [ammo, setAmmo] = useState({ current: 30, maxClip: 30, reserve: 120 });
  const [weapon, setWeapon] = useState<WeaponStats>(WEAPON_PRESETS.rifle);
  const [aliveCount, setAliveCount] = useState(6);
  const [kills, setKills] = useState(0);
  const [medkits, setMedkits] = useState(2);
  const [zoneTimer, setZoneTimer] = useState({ remainingSec: 30, phase: 1, isShrinking: false });
  const [isOutsideZone, setIsOutsideZone] = useState(false);
  const [hitmarker, setHitmarker] = useState(false);
  const [pickupPrompt, setPickupPrompt] = useState<string | null>(null);
  const [minimapData, setMinimapData] = useState<any | null>(null);

  const [flightStage, setFlightStage] = useState<'plane' | 'skydive' | 'parachute' | 'ground'>('ground');
  const [altitude, setAltitude] = useState(0);

  // End of match stats
  const [matchStats, setMatchStats] = useState({
    kills: 0,
    damageDealt: 0,
    timeAliveSec: 0,
    rank: 1,
  });

  const canvasMountRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);

  // Autostart query parameter support (?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      if (!user) {
        const adminUser = getAdminProfile(ADMIN_EMAIL);
        setUser(adminUser);
        saveUserProfile(adminUser);
      }
      setGameState('playing');
    }
  }, []);

  // Sync state machine to document.body.dataset.state for ultra mode
  useEffect(() => {
    document.body.dataset.state = gameState === 'lobby' ? 'title' : gameState;
  }, [gameState]);

  // Handle Game Engine Mount & Teardown
  useEffect(() => {
    if (gameState === 'playing' && canvasMountRef.current && user) {
      // Initialize Three.js Game Engine
      const engine = new GameEngine(
        canvasMountRef.current,
        {
          onHpChange: (newHp, newMaxHp) => {
            setHp(newHp);
            setMaxHp(newMaxHp);
          },
          onShieldChange: (newShield, newMaxShield, newPotions) => {
            setShield(newShield);
            setMaxShield(newMaxShield);
            setShieldPotions(newPotions);
          },
          onAmmoChange: (current, maxClip, reserve) => {
            setAmmo({ current, maxClip, reserve });
          },
          onWeaponChange: (newWeapon) => {
            setWeapon(newWeapon);
          },
          onAliveChange: (alive) => {
            setAliveCount(alive);
          },
          onKillsChange: (k) => {
            setKills(k);
          },
          onMedkitsChange: (m) => {
            setMedkits(m);
          },
          onZoneTimerChange: (remainingSec, phase, isShrinking) => {
            setZoneTimer({ remainingSec, phase, isShrinking });
          },
          onOutsideZoneChange: (isOutside) => {
            setIsOutsideZone(isOutside);
          },
          onHitmarker: () => {
            setHitmarker(true);
            setTimeout(() => setHitmarker(false), 80);
          },
          onPickupPrompt: (prompt) => {
            setPickupPrompt(prompt);
          },
          onFlightStageChange: (stage, alt) => {
            setFlightStage(stage);
            setAltitude(alt);
          },
          onGameStateChange: (finalState) => {
            if (engine) {
              setMatchStats({
                kills: engine.kills,
                damageDealt: engine.damageDealt,
                timeAliveSec: Math.round(engine.timeAlive),
                rank: finalState === 'victory' ? 1 : engine.aliveCount || 2,
              });
            }
            setGameState(finalState);
          },
          onMinimapUpdate: (data) => {
            setMinimapData(data);
          },
        },
        user
      );

      gameEngineRef.current = engine;

      return () => {
        engine.dispose();
        gameEngineRef.current = null;
      };
    }
  }, [gameState]);

  // Keep engine profile settings in sync
  useEffect(() => {
    if (gameEngineRef.current && user) {
      gameEngineRef.current.updateProfileSettings(user);
    }
  }, [user]);

  // Start Battle Royale Match
  const handleStartMatch = (squad?: SquadMember[]) => {
    soundFx.playLootPickup();
    if (squad && squad.length > 0) {
      setActiveSquad(squad);
    }
    setGameState('playing');
  };

  // Restart match
  const handleRestartMatch = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.dispose();
      gameEngineRef.current = null;
    }
    setGameState('lobby');
    setTimeout(() => {
      setGameState('playing');
    }, 50);
  };

  // Return to Lobby
  const handleReturnToLobby = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.dispose();
      gameEngineRef.current = null;
    }
    setGameState('lobby');
  };

  // Log Out & Switch Account
  const handleLogout = () => {
    localStorage.removeItem('mini_br_user_profile');
    setUser(null);
    setGameState('lobby');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 1. LOGIN SCREEN (If not authenticated) */}
      {!user && (
        <LoginScreen
          onLoginSuccess={(profile) => {
            setUser(profile);
            saveUserProfile(profile);
            soundFx.playVictoryFanfare();
          }}
        />
      )}

      {/* 2. FREE FIRE LOBBY (If in lobby state) */}
      {user && gameState === 'lobby' && (
        <Lobby
          user={user}
          onStartGame={handleStartMatch}
          onOpenVault={() => setIsVaultOpen(true)}
          onOpenWeaponLab={() => setIsWeaponLabOpen(true)}
          onOpenEmotes={() => setIsEmotesOpen(true)}
          onOpenEvents={() => setIsEventsOpen(true)}
          onOpenDiamondStore={() => setIsDiamondStoreOpen(true)}
          onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* 3. 3D BATTLE ROYALE SIMULATION CANVAS */}
      {user && (gameState === 'playing' || gameState === 'paused') && (
        <div className="absolute inset-0 z-0">
          <div ref={canvasMountRef} className="w-full h-full" />
        </div>
      )}

      {/* 4. IN-GAME HUD */}
      {user && (gameState === 'playing' || gameState === 'paused') && (
        <InGameHUD
          hp={hp}
          maxHp={maxHp}
          shield={shield}
          maxShield={maxShield}
          shieldPotions={shieldPotions}
          ammo={ammo}
          weapon={weapon}
          aliveCount={aliveCount}
          kills={kills}
          medkits={medkits}
          zoneTimer={zoneTimer}
          isOutsideZone={isOutsideZone}
          hitmarker={hitmarker}
          pickupPrompt={pickupPrompt}
          flightStage={flightStage}
          altitude={altitude}
          activeSquad={activeSquad}
          minimapData={minimapData}
          onUseMedkit={() => gameEngineRef.current?.useMedkit()}
          onUseShieldPotion={() => gameEngineRef.current?.useShieldPotion()}
          onSwitchWeapon={(idx) => gameEngineRef.current?.switchWeapon(idx)}
          onPause={() => setGameState('paused')}
          onVirtualMove={(x, z) => gameEngineRef.current?.setVirtualMovement(x, z)}
          onAimDelta={(dx, dy) => gameEngineRef.current?.setAimDelta(dx, dy)}
          onJump={() => gameEngineRef.current?.triggerJump()}
          onCrouch={() => gameEngineRef.current?.toggleCrouch()}
          onScope={() => gameEngineRef.current?.toggleScope()}
          onShootStart={() => gameEngineRef.current?.triggerShootStart()}
          onShootEnd={() => gameEngineRef.current?.triggerShootEnd()}
          onReload={() => gameEngineRef.current?.triggerReload()}
          onActiveSkill={() => gameEngineRef.current?.triggerActiveSkill()}
          onEjectPlane={() => gameEngineRef.current?.ejectFromPlane()}
          onDeployParachute={() => gameEngineRef.current?.deployParachute()}
        />
      )}

      {/* 5. PAUSED MODAL */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col gap-4 text-white">
            <h2 className="text-2xl font-black uppercase text-amber-400">GAME PAUSED</h2>
            <p className="text-xs text-slate-400">Bermuda Battle Royale Simulation Paused</p>

            <button
              onClick={() => setGameState('playing')}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase rounded-xl transition cursor-pointer"
            >
              RESUME MATCH
            </button>
            <button
              onClick={handleRestartMatch}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer"
            >
              RESTART MATCH
            </button>
            <button
              onClick={handleReturnToLobby}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl transition cursor-pointer"
            >
              LEAVE TO LOBBY
            </button>
          </div>
        </div>
      )}

      {/* 6. GAME OVER / VICTORY MODAL (BOOYAH!) */}
      {(gameState === 'victory' || gameState === 'gameover') && (
        <GameOverModal
          status={gameState}
          kills={matchStats.kills}
          damageDealt={matchStats.damageDealt}
          timeAliveSec={matchStats.timeAliveSec}
          rank={matchStats.rank}
          onRestart={handleRestartMatch}
          onReturnToLobby={handleReturnToLobby}
        />
      )}

      {/* 7. ALL INTERACTIVE MODALS */}
      {isAdminPanelOpen && user && (
        <AdminPanelModal
          user={user}
          onUpdateUser={(u) => setUser(u)}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}

      {isEventsOpen && user && (
        <EventsModal
          user={user}
          onUpdateUser={(u) => setUser(u)}
          onClose={() => setIsEventsOpen(false)}
        />
      )}

      {isVaultOpen && user && (
        <VaultModal
          user={user}
          onUpdateUser={(u) => setUser(u)}
          onClose={() => setIsVaultOpen(false)}
        />
      )}

      {isWeaponLabOpen && user && (
        <WeaponLabModal
          user={user}
          onUpdateUser={(u) => setUser(u)}
          onClose={() => setIsWeaponLabOpen(false)}
        />
      )}

      {isEmotesOpen && user && (
        <EmotesModal
          user={user}
          onUpdateUser={(u) => setUser(u)}
          onClose={() => setIsEmotesOpen(false)}
        />
      )}

      {isDiamondStoreOpen && user && (
        <DiamondStoreModal
          user={user}
          onUpdateUser={(u) => setUser(u)}
          onClose={() => setIsDiamondStoreOpen(false)}
        />
      )}
    </div>
  );
}
