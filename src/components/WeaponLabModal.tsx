import React, { useState } from 'react';
import { UserProfile, saveUserProfile } from '../game/auth.ts';
import { EVO_GUN_SKINS, getAllGunSkins, EvoGunSkin } from '../game/ff_data.ts';
import { soundFx } from '../game/audio.ts';

interface WeaponLabModalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onClose: () => void;
}

export const WeaponLabModal: React.FC<WeaponLabModalProps> = ({ user, onUpdateUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'evo_lab' | 'all_skins'>('evo_lab');
  const [selectedEvo, setSelectedEvo] = useState<EvoGunSkin>(EVO_GUN_SKINS[0]);
  const [evoLevel, setEvoLevel] = useState<number>(7);
  const allSkins = getAllGunSkins();

  const handleEquipWeapon = (skinId: string) => {
    const updated = { ...user, equippedWeaponSkin: skinId };
    saveUserProfile(updated);
    onUpdateUser(updated);
    soundFx.playLootPickup();
  };

  const handleUpgradeEvo = () => {
    if (evoLevel < 7) {
      setEvoLevel(evoLevel + 1);
      soundFx.playVictoryFanfare();
      alert(`Upgraded to Level ${evoLevel + 1}! Unlocked new kill effect & exclusive emote!`);
    }
  };

  const handleBuySkin = (skin: EvoGunSkin) => {
    if (user.diamonds < skin.diamondsCost) {
      alert('Not enough Diamonds! Use Diamond Top-Up or Admin Panel.');
      return;
    }
    const updated = {
      ...user,
      diamonds: user.diamonds - skin.diamondsCost,
      equippedWeaponSkin: skin.id,
    };
    saveUserProfile(updated);
    onUpdateUser(updated);
    soundFx.playVictoryFanfare();
    alert(`Unlocked & Equipped ${skin.name}!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 md:p-6 select-none">
      <div className="w-full max-w-5xl bg-slate-950 border border-blue-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-800 px-6 py-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="text-base font-black tracking-wider uppercase">
                FREE FIRE WEAPON ARMORY & EVO GUNS LAB
              </h2>
              <p className="text-[11px] font-bold text-sky-200">
                LEVEL 1 TO 7 EVOLUTION · ATTRIBUTES · 360+ GUN SKINS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full text-amber-300 text-xs font-black">
              <span>💎</span>
              <span>{user.diamonds.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center font-black text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('evo_lab')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              activeTab === 'evo_lab'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔥 EVO GUNS EVOLUTION LAB (ALL 8 EVOS)
          </button>
          <button
            onClick={() => setActiveTab('all_skins')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              activeTab === 'all_skins'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🔫 ALL GUN SKINS CATALOG ({allSkins.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'evo_lab' ? (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Left Column: Evo Gun Selector */}
              <div className="w-full lg:w-1/3 flex flex-col gap-2.5 overflow-y-auto max-h-[65vh]">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Select Evo Firearm:</p>
                {EVO_GUN_SKINS.map((evo) => (
                  <button
                    key={evo.id}
                    onClick={() => setSelectedEvo(evo)}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-left transition ${
                      selectedEvo.id === evo.id
                        ? 'bg-blue-950/60 border-cyan-400 ring-2 ring-cyan-400/40'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-black"
                      style={{ backgroundColor: evo.glowColor + '33', color: evo.glowColor }}
                    >
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{evo.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-cyan-300 font-bold">LV 7 MAX</span>
                        <span className="text-[10px] text-emerald-400">{evo.damageBonus}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right Column: Evo Gun Showcase & Level 1-7 Progression */}
              <div className="w-full lg:w-2/3 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-cyan-400 bg-cyan-950 border border-cyan-800 px-2.5 py-1 rounded-full">
                      EVO LEVEL {evoLevel} / 7
                    </span>
                    <span className="text-xs font-bold text-slate-400">{selectedEvo.baseGun} FIREARM</span>
                  </div>

                  <h3 className="text-2xl font-black text-white">{selectedEvo.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{selectedEvo.description}</p>

                  {/* Attributes Box */}
                  <div className="grid grid-cols-3 gap-3 my-5 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Damage</p>
                      <p className="text-sm font-black text-emerald-400">{selectedEvo.damageBonus}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Rate of Fire</p>
                      <p className="text-sm font-black text-emerald-400">{selectedEvo.fireRateBonus}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Special Emote</p>
                      <p className="text-sm font-black text-amber-400">UNLOCKED</p>
                    </div>
                  </div>

                  {/* Level Progression Track (1 to 7) */}
                  <div className="flex items-center justify-between gap-1 my-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
                      <div
                        key={lvl}
                        className={`flex-1 py-2 rounded-lg text-center font-bold text-[11px] border transition ${
                          lvl <= evoLevel
                            ? 'bg-gradient-to-b from-cyan-500 to-blue-600 text-black border-cyan-400 shadow-md'
                            : 'bg-slate-950 text-slate-600 border-slate-800'
                        }`}
                      >
                        Lv {lvl}
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <p className="font-bold text-cyan-300">Level 7 Ultimate Perks:</p>
                    <p>• Exclusive Emote: Draco Summoning Aura</p>
                    <p>• Custom Muzzle Flash & High-Velocity Tracer Bullets</p>
                    <p>• Elimination Broadcast Announcement Banner in killfeed</p>
                  </div>
                </div>

                {/* Equip / Upgrade Actions */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleEquipWeapon(selectedEvo.id)}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black uppercase text-xs rounded-xl shadow-lg transition"
                  >
                    {user.equippedWeaponSkin === selectedEvo.id ? 'EQUIPPED IN MATCH' : 'EQUIP THIS EVO GUN'}
                  </button>

                  {evoLevel < 7 && (
                    <button
                      onClick={handleUpgradeEvo}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs rounded-xl shadow-lg transition"
                    >
                      UPGRADE TO LV {evoLevel + 1}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ALL GUN SKINS GRID (360+ SKINS) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allSkins.map((skin) => {
                const isEquipped = user.equippedWeaponSkin === skin.id;

                return (
                  <div
                    key={skin.id}
                    className={`bg-slate-900 border rounded-2xl p-3.5 flex flex-col justify-between relative transition ${
                      isEquipped ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-cyan-950/20' : 'border-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 self-end">
                      {skin.rarity}
                    </span>

                    <div className="text-3xl text-center my-3">🔫</div>
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{skin.name}</h4>
                      <p className="text-[10px] text-emerald-400 mt-0.5">{skin.damageBonus}</p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{skin.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleBuySkin(skin)}
                        className={`w-full py-1.5 rounded-lg text-xs font-black uppercase transition ${
                          isEquipped
                            ? 'bg-slate-800 text-cyan-400 cursor-default'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-black hover:scale-105 cursor-pointer'
                        }`}
                      >
                        {isEquipped ? 'IN USE' : `EQUIP · 💎 ${skin.diamondsCost}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
