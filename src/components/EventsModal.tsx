import React, { useState } from 'react';
import { UserProfile, saveUserProfile } from '../game/auth.ts';
import { soundFx } from '../game/audio.ts';

interface EventsModalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onClose: () => void;
}

const FADED_WHEEL_ITEMS = [
  { id: 'evo_ak47_blue_dragon', name: 'AK47 Blue Flame Draco', icon: '🐉', isGrand: true },
  { id: 'bundle_red_criminal', name: 'Red Criminal Onesie', icon: '🤡', isGrand: true },
  { id: 'loot_box_draco', name: 'Draco Death Loot Box', icon: '📦' },
  { id: 'tokens_50', name: '50x Draco Evo Tokens', icon: '💎' },
  { id: 'parachute_draco', name: 'Azure Flame Parachute', icon: '🪂' },
  { id: 'surfboard_draco', name: 'Hydro Sky Surfboard', icon: '🏄' },
  { id: 'voucher_weapon', name: '3x Weapon Royale Vouchers', icon: '🎟️' },
  { id: 'cube_frag', name: '10x Magic Cube Fragments', icon: '🧩' },
];

const SPIN_COSTS = [9, 19, 39, 69, 99, 149, 199, 499];

export const EventsModal: React.FC<EventsModalProps> = ({ user, onUpdateUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'faded_wheel' | 'mystery_shop' | 'evo_vault' | 'top_up'>('faded_wheel');

  // Faded Wheel state
  const [eliminatedIds, setEliminatedIds] = useState<string[]>([]);
  const [obtainedIds, setObtainedIds] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState<number | null>(null);
  const [wonItem, setWonItem] = useState<any | null>(null);

  // Mystery Shop state
  const [luckyDiscount, setLuckyDiscount] = useState<number | null>(84); // 84% OFF!
  const [isRollingDiscount, setIsRollingDiscount] = useState(false);

  // Top up event state
  const [claimedTopups, setClaimedTopups] = useState<number[]>([]);

  // Toggle eliminate item in Faded wheel
  const handleToggleEliminate = (id: string) => {
    if (eliminatedIds.includes(id)) {
      setEliminatedIds(eliminatedIds.filter((item) => item !== id));
    } else {
      if (eliminatedIds.length < 2) {
        setEliminatedIds([...eliminatedIds, id]);
        soundFx.playHitSound();
      }
    }
  };

  // Spin Faded Wheel
  const currentSpinCost = SPIN_COSTS[obtainedIds.length] || 499;
  const canSpin = eliminatedIds.length === 2 && !isSpinning && user.diamonds >= currentSpinCost;

  const handleFadedWheelSpin = () => {
    if (!canSpin) return;

    // Deduct diamonds
    const updated = { ...user, diamonds: user.diamonds - currentSpinCost };
    saveUserProfile(updated);
    onUpdateUser(updated);

    setIsSpinning(true);
    setWonItem(null);
    soundFx.playLootPickup();

    // Eligible items
    const availableItems = FADED_WHEEL_ITEMS.filter(
      (item) => !eliminatedIds.includes(item.id) && !obtainedIds.includes(item.id)
    );

    // Guaranteed grand prize on last remaining, or high probability
    const targetItem =
      availableItems.length === 1
        ? availableItems[0]
        : availableItems[Math.floor(Math.random() * availableItems.length)];

    let currentIdx = 0;
    let ticks = 0;
    const maxTicks = 24 + Math.floor(Math.random() * 8);

    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % FADED_WHEEL_ITEMS.length;
      setHighlightedIdx(currentIdx);
      ticks++;

      if (ticks >= maxTicks) {
        clearInterval(interval);
        setIsSpinning(false);
        const finalIdx = FADED_WHEEL_ITEMS.findIndex((item) => item.id === targetItem.id);
        setHighlightedIdx(finalIdx);
        setObtainedIds([...obtainedIds, targetItem.id]);
        setWonItem(targetItem);
        soundFx.playVictoryFanfare();

        // If won gun or bundle, equip/unlock
        if (targetItem.id === 'evo_ak47_blue_dragon') {
          const userWithGun = { ...updated, equippedWeaponSkin: 'evo_ak47_blue_dragon' };
          saveUserProfile(userWithGun);
          onUpdateUser(userWithGun);
        } else if (targetItem.id === 'bundle_red_criminal') {
          const userWithBundle = {
            ...updated,
            unlockedBundles: Array.from(new Set([...updated.unlockedBundles, 'bundle_red_criminal'])),
            equippedBundle: 'bundle_red_criminal',
          };
          saveUserProfile(userWithBundle);
          onUpdateUser(userWithBundle);
        }
      }
    }, 90);
  };

  // Mystery Shop Buy
  const handleMysteryBuy = (costOriginal: number, itemId: string, name: string) => {
    const discounted = Math.round(costOriginal * (1 - (luckyDiscount || 80) / 100));
    if (user.diamonds < discounted) {
      alert('Not enough Diamonds! Top-up or use Admin Panel.');
      return;
    }
    const updated = {
      ...user,
      diamonds: user.diamonds - discounted,
      unlockedBundles: Array.from(new Set([...user.unlockedBundles, itemId])),
      equippedBundle: itemId,
    };
    saveUserProfile(updated);
    onUpdateUser(updated);
    soundFx.playVictoryFanfare();
    alert(`Congratulations! You purchased ${name} for ${discounted} 💎 with ${luckyDiscount}% OFF!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 md:p-6 select-none">
      <div className="w-full max-w-4xl bg-slate-950 border border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 px-6 py-3.5 flex items-center justify-between text-black">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="text-base font-black tracking-wider uppercase text-black">
                FREE FIRE · OFFICIAL SPECIAL EVENTS
              </h2>
              <p className="text-[11px] font-bold text-amber-950">
                LUCK ROYALE · FADED WHEEL · MYSTERY SHOP · EVO VAULT
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

        {/* Tab Navigation */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 flex items-center gap-2 overflow-x-auto py-2">
          {[
            { id: 'faded_wheel', label: '🎡 FADED WHEEL (EVO AK47)', tag: 'HOT' },
            { id: 'mystery_shop', label: '🛍️ MYSTERY SHOP (90% OFF)', tag: 'LIMITED' },
            { id: 'evo_vault', label: '⚡ EVO GUNS VAULT', tag: 'ALL EVOS' },
            { id: 'top_up', label: '🎁 TOP-UP BONUS EVENT', tag: 'FREE' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded">
                {tab.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950 to-slate-950">
          {/* TAB 1: FADED WHEEL */}
          {activeTab === 'faded_wheel' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full items-center">
              {/* Left: Featured Grand Prize Showcase */}
              <div className="w-full lg:w-1/3 bg-slate-900/90 border border-blue-500/40 rounded-2xl p-5 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                  GRAND PRIZE
                </div>
                <div className="text-6xl my-4 animate-bounce">🐉</div>
                <h3 className="text-base font-black text-amber-400 uppercase tracking-tight">
                  AK47 - Blue Flame Draco
                </h3>
                <span className="text-[10px] text-cyan-300 font-bold">EVO LEVEL 7 MAX</span>
                <p className="text-[11px] text-slate-400 mt-2">
                  Summons glowing blue dragon aura wings, custom firing flame effect, and Draco Roar emote.
                </p>

                <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800 mt-4 text-left">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Attributes:</p>
                  <p className="text-xs font-bold text-emerald-400">++ Damage</p>
                  <p className="text-xs font-bold text-emerald-400">+ Rate of Fire</p>
                  <p className="text-xs font-bold text-red-400">- Reload Speed</p>
                </div>
              </div>

              {/* Right: 8 Items Grid & Elimination */}
              <div className="w-full lg:w-2/3 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-amber-300 font-bold">
                    {eliminatedIds.length < 2
                      ? `Select ${2 - eliminatedIds.length} unwanted prizes to remove from wheel:`
                      : `2 Items Removed! Ready to spin for ${currentSpinCost} 💎`}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    Spins: {obtainedIds.length} / 6
                  </span>
                </div>

                {/* 8 Items Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FADED_WHEEL_ITEMS.map((item, idx) => {
                    const isEliminated = eliminatedIds.includes(item.id);
                    const isObtained = obtainedIds.includes(item.id);
                    const isHighlighted = highlightedIdx === idx;

                    return (
                      <div
                        key={item.id}
                        onClick={() => !isObtained && !isSpinning && handleToggleEliminate(item.id)}
                        className={`relative p-3.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition select-none ${
                          isHighlighted
                            ? 'ring-4 ring-amber-400 bg-amber-500/20 scale-105'
                            : isEliminated
                            ? 'bg-slate-950/90 border-red-900/60 opacity-40'
                            : isObtained
                            ? 'bg-emerald-950/40 border-emerald-600 opacity-60'
                            : 'bg-slate-900/90 border-slate-800 hover:border-amber-500'
                        }`}
                      >
                        {isEliminated && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl font-black text-red-500 text-lg">
                            REMOVED
                          </div>
                        )}
                        {isObtained && (
                          <div className="absolute top-1 right-1 text-emerald-400 font-black text-[10px] bg-emerald-950 px-1 rounded">
                            OBTAINED
                          </div>
                        )}
                        <span className="text-3xl mb-1">{item.icon}</span>
                        <p className="text-xs font-bold text-white line-clamp-1">{item.name}</p>
                        {item.isGrand && (
                          <span className="text-[9px] text-amber-400 font-black uppercase mt-0.5">
                            MYTHIC
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Won Reward Banner */}
                {wonItem && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-xl font-black text-center flex items-center justify-center gap-2">
                    <span className="text-xl">{wonItem.icon}</span>
                    <span>CONGRATULATIONS! YOU OBTAINED {wonItem.name.toUpperCase()}!</span>
                  </div>
                )}

                {/* Spin Button */}
                <div className="mt-5 flex items-center justify-center">
                  <button
                    onClick={handleFadedWheelSpin}
                    disabled={!canSpin}
                    className={`px-10 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition flex items-center gap-3 ${
                      canSpin
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:scale-105 text-black cursor-pointer shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>SPIN NOW</span>
                    <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-lg text-black font-black">
                      <span>💎</span>
                      <span>{currentSpinCost}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MYSTERY SHOP */}
          {activeTab === 'mystery_shop' && (
            <div className="flex flex-col gap-6">
              {/* Discount Banner */}
              <div className="bg-gradient-to-r from-purple-900 via-fuchsia-900 to-indigo-950 border border-fuchsia-500/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-fuchsia-300">
                    SEASON SPECIAL
                  </span>
                  <h3 className="text-2xl font-black text-white">MYSTERY SHOP GRAND BAZAAR</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Your lucky spin unlocked a massive discount for all exclusive bundles and items!
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-black/40 border border-fuchsia-400/40 p-4 rounded-2xl text-center">
                  <div>
                    <span className="text-3xl md:text-4xl font-black text-amber-400">
                      {luckyDiscount}%
                    </span>
                    <p className="text-[10px] font-bold text-fuchsia-300">YOUR DISCOUNT</p>
                  </div>
                </div>
              </div>

              {/* Mystery Shop Deals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'bundle_red_criminal',
                    name: 'Red Criminal Bundle',
                    orig: 2500,
                    icon: '🤡',
                    rarity: 'Mythic',
                  },
                  {
                    id: 'bundle_hip_hop',
                    name: 'Hip Hop Season 2 Bundle',
                    orig: 2800,
                    icon: '🧢',
                    rarity: 'Mythic',
                  },
                  {
                    id: 'bundle_sakura',
                    name: 'Sakura Season 1 Bundle',
                    orig: 3200,
                    icon: '🌸',
                    rarity: 'Mythic',
                  },
                  {
                    id: 'bundle_cobra_rage',
                    name: 'Cobra Rage Evo Bundle',
                    orig: 2200,
                    icon: '🐍',
                    rarity: 'Legendary',
                  },
                  {
                    id: 'bundle_golden_samurai',
                    name: 'Golden Samurai Battle Armor',
                    orig: 1800,
                    icon: '⚔️',
                    rarity: 'Legendary',
                  },
                  {
                    id: 'bundle_arctic_blue',
                    name: 'Arctic Blue Cryo Armor',
                    orig: 1600,
                    icon: '❄️',
                    rarity: 'Legendary',
                  },
                ].map((deal) => {
                  const discounted = Math.round(deal.orig * (1 - (luckyDiscount || 80) / 100));
                  const isOwned = user.unlockedBundles.includes(deal.id);

                  return (
                    <div
                      key={deal.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700 font-bold px-2 py-0.5 rounded">
                            {deal.rarity}
                          </span>
                          <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded">
                            -{luckyDiscount}%
                          </span>
                        </div>
                        <div className="text-4xl text-center my-3">{deal.icon}</div>
                        <h4 className="font-bold text-white text-sm text-center">{deal.name}</h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500 line-through">
                            💎 {deal.orig}
                          </span>
                          <p className="text-sm font-black text-amber-400">
                            💎 {discounted}
                          </p>
                        </div>
                        <button
                          onClick={() => handleMysteryBuy(deal.orig, deal.id, deal.name)}
                          disabled={isOwned}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition ${
                            isOwned
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black cursor-pointer shadow-md'
                          }`}
                        >
                          {isOwned ? 'OWNED' : 'BUY NOW'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: TOP-UP BONUS EVENT */}
          {activeTab === 'top_up' && (
            <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-r from-amber-950 via-yellow-950 to-orange-950 border border-amber-600/50 rounded-2xl p-6">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  TOP-UP MILESTONES
                </span>
                <h3 className="text-2xl font-black text-white">RELOAD DIAMONDS GET FREE GIFTS</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Accumulate top-up diamond milestones to claim exclusive permanent skins and emotes!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    req: 100,
                    name: 'Gloo Wall - Chrono Shield',
                    icon: '🛡️',
                    desc: 'High-tech neon tactical barricade.',
                  },
                  {
                    req: 300,
                    name: 'Katana - Blood Moon Edge',
                    icon: '🗡️',
                    desc: 'Flaming crimson melee blade with dash trail.',
                  },
                  {
                    req: 500,
                    name: 'Tea Time (Throne) Emote',
                    icon: '🪑',
                    desc: 'Royal floating gold throne tea sip.',
                  },
                ].map((tier) => {
                  const isClaimed = claimedTopups.includes(tier.req);

                  return (
                    <div
                      key={tier.req}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs bg-amber-500/20 text-amber-400 font-black px-2 py-0.5 rounded">
                            TOP-UP {tier.req} 💎
                          </span>
                          <span className="text-xs text-emerald-400 font-bold">100% FREE</span>
                        </div>
                        <div className="text-5xl text-center my-3">{tier.icon}</div>
                        <h4 className="font-bold text-white text-sm text-center">{tier.name}</h4>
                        <p className="text-[11px] text-slate-400 text-center mt-1">{tier.desc}</p>
                      </div>

                      <button
                        onClick={() => {
                          if (!isClaimed) {
                            setClaimedTopups([...claimedTopups, tier.req]);
                            soundFx.playVictoryFanfare();
                            alert(`Claimed ${tier.name}! Added to your inventory.`);
                          }
                        }}
                        className={`mt-4 w-full py-2.5 rounded-xl text-xs font-black uppercase transition ${
                          isClaimed
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer'
                        }`}
                      >
                        {isClaimed ? 'CLAIMED' : 'CLAIM REWARD'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: EVO VAULT */}
          {activeTab === 'evo_vault' && (
            <div className="flex flex-col gap-4">
              <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border border-emerald-500/40 rounded-2xl p-6">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                  GRAND RE-OPENING
                </span>
                <h3 className="text-2xl font-black text-white">ALL 8 EVO GUNS GRAND VAULT</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Blue Flame Draco AK47, Predatory Cobra MP40, Megalodon Alpha SCAR & Green Draco M1014!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'AK47 - Blue Flame Draco (Lv 7)',
                    cost: 2499,
                    icon: '🐉',
                    color: 'text-cyan-400',
                  },
                  {
                    name: 'MP40 - Predatory Cobra (Lv 7)',
                    cost: 2499,
                    icon: '🐍',
                    color: 'text-red-400',
                  },
                  {
                    name: 'M1014 - Green Flame Draco (Lv 7)',
                    cost: 2499,
                    icon: '🦎',
                    color: 'text-emerald-400',
                  },
                  {
                    name: 'SCAR - Megalodon Alpha (Lv 7)',
                    cost: 2199,
                    icon: '🦈',
                    color: 'text-sky-400',
                  },
                ].map((evo) => (
                  <div
                    key={evo.name}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{evo.icon}</span>
                      <div>
                        <h4 className={`text-sm font-black ${evo.color}`}>{evo.name}</h4>
                        <p className="text-[11px] text-slate-400">Max Attributes + Exclusive Emote</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (user.diamonds < evo.cost) {
                          alert('Not enough diamonds! Use Admin Panel or Diamond Top-Up.');
                          return;
                        }
                        const updated = { ...user, diamonds: user.diamonds - evo.cost };
                        saveUserProfile(updated);
                        onUpdateUser(updated);
                        soundFx.playVictoryFanfare();
                        alert(`Unlocked ${evo.name}!`);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs rounded-xl hover:scale-105 transition"
                    >
                      💎 {evo.cost}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
