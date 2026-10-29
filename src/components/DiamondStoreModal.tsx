import React from 'react';
import { UserProfile, saveUserProfile } from '../game/auth.ts';
import { DIAMOND_PACKS, DiamondPack } from '../game/bundles.ts';
import { soundFx } from '../game/audio.ts';

interface DiamondStoreModalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onClose: () => void;
}

export const DiamondStoreModal: React.FC<DiamondStoreModalProps> = ({ user, onUpdateUser, onClose }) => {
  const handlePurchase = (pack: DiamondPack) => {
    const totalDiamonds = pack.diamonds + pack.bonus;
    const updated = { ...user, diamonds: user.diamonds + totalDiamonds };
    saveUserProfile(updated);
    onUpdateUser(updated);
    soundFx.playVictoryFanfare();
    alert(`Top-Up Successful! +${totalDiamonds} Diamonds added to your balance.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 md:p-6 select-none">
      <div className="w-full max-w-4xl bg-slate-950 border border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 px-6 py-4 flex items-center justify-between text-black">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💎</span>
            <div>
              <h2 className="text-base font-black tracking-wider uppercase">
                FREE FIRE OFFICIAL DIAMOND TOP-UP STORE
              </h2>
              <p className="text-[11px] font-bold text-amber-950">
                INSTANT AIRDROP · SPECIAL OFFERS · 100% SECURE
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

        {/* Special Airdrop Banner */}
        <div className="p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/40 via-slate-950 to-slate-950 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-3xl">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-red-600 text-white font-black px-2 py-0.5 rounded">
                  90% OFF AIRDROP
                </span>
                <span className="text-xs text-amber-400 font-bold">LIMITED TIME</span>
              </div>
              <h3 className="text-base font-black text-white mt-1">Special Airdrop: 300 💎 + Red Criminal Token</h3>
              <p className="text-xs text-slate-400">Exclusive one-time starter offer for your UID: {user.uid}</p>
            </div>
          </div>

          <button
            onClick={() => handlePurchase({ id: 'airdrop', diamonds: 300, bonus: 50, priceInr: '₹29', description: 'Airdrop' })}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase rounded-xl shadow-lg transition active:scale-95"
          >
            CLAIM AIRDROP · ₹29
          </button>
        </div>

        {/* Diamond Packs Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {DIAMOND_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between relative transition ${
                pack.popular
                  ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-950/20'
                  : pack.bestValue
                  ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-cyan-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[9px] font-black px-2 py-0.5 rounded shadow">
                  MOST POPULAR
                </span>
              )}
              {pack.bestValue && (
                <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-[9px] font-black px-2 py-0.5 rounded shadow">
                  BEST VALUE
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💎</span>
                  <span className="text-xl font-black text-white">{pack.diamonds}</span>
                  {pack.bonus > 0 && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                      +{pack.bonus} BONUS
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 font-medium leading-relaxed mt-2">
                  {pack.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Received</p>
                  <p className="text-xs font-black text-amber-400">{pack.diamonds + pack.bonus} Diamonds</p>
                </div>
                <button
                  onClick={() => handlePurchase(pack)}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  {pack.priceInr}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
