import React, { useState } from 'react';
import { UserProfile, saveUserProfile } from '../game/auth.ts';
import { FREE_FIRE_BUNDLES, getFullCollectionItems, BundleItem } from '../game/bundles.ts';
import { soundFx } from '../game/audio.ts';

interface VaultModalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onClose: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({ user, onUpdateUser, onClose }) => {
  const [filter, setFilter] = useState<'all' | 'mythic' | 'legendary' | 'owned'>('all');
  const [search, setSearch] = useState('');
  const [vaultToast, setVaultToast] = useState<string | null>(null);
  const allItems = getFullCollectionItems();

  const filteredItems = allItems.filter((item) => {
    if (filter === 'mythic' && item.rarity !== 'Mythic') return false;
    if (filter === 'legendary' && item.rarity !== 'Legendary') return false;
    if (filter === 'owned' && !user.unlockedBundles.includes(item.id)) return false;
    if (search.trim() && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleEquip = (itemId: string) => {
    const updated = { ...user, equippedBundle: itemId };
    saveUserProfile(updated);
    onUpdateUser(updated);
    soundFx.playLootPickup();
    setVaultToast('✅ Outfit equipped! (ड्रेस पहन ली गई)');
    setTimeout(() => setVaultToast(null), 2000);
  };

  const handleBuy = (item: BundleItem) => {
    if (user.diamonds < item.diamonds) {
      soundFx.playDefeatSound();
      setVaultToast('⚠️ पर्याप्त डायमंड नहीं हैं! Admin Panel या Store से डायमंड लें।');
      setTimeout(() => setVaultToast(null), 2500);
      return;
    }
    const updated = {
      ...user,
      diamonds: user.diamonds - item.diamonds,
      unlockedBundles: Array.from(new Set([...user.unlockedBundles, item.id])),
      equippedBundle: item.id,
    };
    saveUserProfile(updated);
    onUpdateUser(updated);
    soundFx.playVictoryFanfare();
    setVaultToast(`🎉 ${item.name} अनलॉक और पहन ली गई!`);
    setTimeout(() => setVaultToast(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-1 sm:p-2.5 select-none">
      <div className="w-full max-w-4xl h-full max-h-[96dvh] bg-slate-950 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Compact Free Fire Mobile Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 px-3 sm:px-4 py-1.5 flex items-center justify-between text-black shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">👕</span>
            <div>
              <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase leading-tight">
                FREE FIRE VAULT · 400+ BUNDLES
              </h2>
              <p className="text-[9px] font-bold text-amber-950 hidden sm:block leading-tight">
                CRIMINAL · SAKURA · HIP HOP · COBRA RAGE · SAMURAI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full text-amber-300 text-[10px] sm:text-xs font-black">
              <span>💎</span>
              <span>{user.diamonds.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center font-black text-xs cursor-pointer transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Toast Alert Feedback */}
        {vaultToast && (
          <div className="bg-amber-500/20 border-b border-amber-500/50 text-amber-300 text-[11px] font-bold px-3 py-1 text-center shrink-0 animate-fadeIn">
            {vaultToast}
          </div>
        )}

        {/* Compact Single-Row Filter & Search Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-2 sm:px-3 py-1 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'all', label: `ALL (${allItems.length})` },
              { id: 'mythic', label: 'MYTHIC' },
              { id: 'legendary', label: 'LEGEND' },
              { id: 'owned', label: `OWNED (${user.unlockedBundles.length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase whitespace-nowrap transition cursor-pointer ${
                  filter === f.id
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search dress..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded outline-none focus:border-amber-400 w-28 sm:w-40 shrink-0"
          />
        </div>

        {/* Fully Scrollable Items Grid (Fits 100% inside phone viewport) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5 sm:gap-2">
          {filteredItems.map((item) => {
            const isOwned = user.unlockedBundles.includes(item.id);
            const isEquipped = user.equippedBundle === item.id;

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-xl p-1.5 flex flex-col justify-between relative transition group ${
                  isEquipped
                    ? 'border-amber-400 ring-1 ring-amber-400/50 bg-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  {isEquipped ? (
                    <span className="bg-amber-500 text-black text-[8px] font-black px-1 rounded shadow">
                      IN USE
                    </span>
                  ) : isOwned ? (
                    <span className="bg-emerald-600/60 text-emerald-300 text-[8px] font-bold px-1 rounded">
                      OWNED
                    </span>
                  ) : <span />}
                  <span className="text-[8px] font-bold px-1 rounded bg-slate-800 text-slate-400">
                    {item.rarity}
                  </span>
                </div>

                {/* Bundle Color Preview Orb */}
                <div className="flex items-center justify-center my-1">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-lg flex items-center justify-center text-xl sm:text-2xl border border-white/20 transform group-hover:scale-105 transition"
                    style={{ backgroundColor: '#' + item.colorHex.toString(16).padStart(6, '0') }}
                  >
                    👕
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-[10px] sm:text-[11px] font-bold text-white truncate leading-tight">
                    {item.name}
                  </h4>
                  {item.hindiName && (
                    <p className="text-[8px] text-amber-400/90 truncate leading-tight">
                      {item.hindiName}
                    </p>
                  )}
                </div>

                <div className="mt-1 pt-1 border-t border-slate-800/80">
                  {isOwned ? (
                    <button
                      onClick={() => handleEquip(item.id)}
                      disabled={isEquipped}
                      className={`w-full py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-black uppercase transition cursor-pointer ${
                        isEquipped
                          ? 'bg-slate-800 text-amber-400 cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95'
                      }`}
                    >
                      {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      className="w-full py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow"
                    >
                      <span>💎</span>
                      <span>{item.diamonds}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
