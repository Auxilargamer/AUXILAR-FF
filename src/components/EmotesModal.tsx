import React, { useState } from 'react';
import { UserProfile, saveUserProfile } from '../game/auth.ts';
import { getAllEmotes, ICONIC_EMOTES, EmoteItem } from '../game/ff_data.ts';
import { soundFx } from '../game/audio.ts';

interface EmotesModalProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onClose: () => void;
  onPlayEmote?: (emote: EmoteItem) => void;
}

export const EmotesModal: React.FC<EmotesModalProps> = ({ user, onUpdateUser, onClose, onPlayEmote }) => {
  const [activeEmote, setActiveEmote] = useState<EmoteItem>(ICONIC_EMOTES[0]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [search, setSearch] = useState('');
  const allEmotes = getAllEmotes();

  const filtered = allEmotes.filter((e) => {
    if (search.trim() && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handlePreviewEmote = (emote: EmoteItem) => {
    setActiveEmote(emote);
    setIsPlayingPreview(true);
    soundFx.playLootPickup();
    if (onPlayEmote) onPlayEmote(emote);

    setTimeout(() => {
      setIsPlayingPreview(false);
    }, 2500);
  };

  const handleBuyOrEquip = (emote: EmoteItem) => {
    soundFx.playVictoryFanfare();
    alert(`Equipped ${emote.name} to your active Emote Wheel!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 md:p-6 select-none">
      <div className="w-full max-w-5xl bg-slate-950 border border-purple-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-800 px-6 py-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕺</span>
            <div>
              <h2 className="text-base font-black tracking-wider uppercase">
                FREE FIRE EMOTE VAULT · 200+ OFFICIAL EMOTES
              </h2>
              <p className="text-[11px] font-bold text-purple-200">
                LOL · TEA TIME THRONE · FLOWERS OF LOVE · BHANGRA · DOGGIE · DRACO
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

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Emotes Grid */}
          <div className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                Total Emotes: {allEmotes.length}
              </span>
              <input
                type="text"
                placeholder="Search emotes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-purple-400 w-44"
              />
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((emote) => {
                const isSelected = activeEmote.id === emote.id;

                return (
                  <button
                    key={emote.id}
                    onClick={() => handlePreviewEmote(emote)}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between transition ${
                      isSelected
                        ? 'bg-purple-950/60 border-fuchsia-400 ring-2 ring-fuchsia-400/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-3xl my-2">{emote.iconSymbol}</span>
                    <p className="text-xs font-bold text-white line-clamp-1">{emote.name}</p>
                    <span className="text-[9px] text-fuchsia-300 uppercase font-black mt-1">
                      {emote.rarity}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Emote Stage & Preview */}
          <div className="w-full md:w-80 bg-slate-900/90 p-6 flex flex-col justify-between items-center text-center">
            <div className="flex flex-col items-center">
              <span className="text-xs font-black uppercase text-fuchsia-400 bg-fuchsia-950 px-3 py-1 rounded-full border border-fuchsia-800 mb-4">
                EMOTE PREVIEW
              </span>

              {/* Animated Emote Stage */}
              <div
                className={`w-36 h-36 rounded-full bg-gradient-to-b from-purple-500/20 to-fuchsia-600/30 border-2 border-fuchsia-500/50 flex items-center justify-center text-6xl shadow-2xl ${
                  isPlayingPreview ? 'scale-110 animate-bounce' : ''
                }`}
              >
                {activeEmote.iconSymbol}
              </div>

              <h3 className="text-lg font-black text-white mt-4">{activeEmote.name}</h3>
              {activeEmote.hindiName && (
                <p className="text-xs text-amber-400 font-bold mt-0.5">{activeEmote.hindiName}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">{activeEmote.description}</p>
            </div>

            <div className="w-full flex flex-col gap-2.5 mt-6">
              <button
                onClick={() => handlePreviewEmote(activeEmote)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <span>▶️</span> Play Preview
              </button>

              <button
                onClick={() => handleBuyOrEquip(activeEmote)}
                className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-black text-xs uppercase rounded-xl shadow-lg transition"
              >
                EQUIP TO EMOTE WHEEL
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
