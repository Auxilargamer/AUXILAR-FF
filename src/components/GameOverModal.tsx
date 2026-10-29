import React from 'react';
import { soundFx } from '../game/audio.ts';

interface GameOverModalProps {
  status: 'victory' | 'gameover';
  kills: number;
  damageDealt: number;
  timeAliveSec: number;
  rank: number;
  onRestart: () => void;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  status,
  kills,
  damageDealt,
  timeAliveSec,
  rank,
  onRestart,
  onReturnToLobby,
}) => {
  const isVictory = status === 'victory';

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 select-none animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl border-2 p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden ${
          isVictory
            ? 'bg-slate-950 border-amber-400 shadow-amber-500/20'
            : 'bg-slate-950 border-red-600/80 shadow-red-600/20'
        }`}
      >
        {/* Glow Halo */}
        <div
          className={`absolute -top-24 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isVictory ? 'bg-amber-500/30' : 'bg-red-600/30'
          }`}
        />

        {/* Big Graphic Header */}
        {isVictory ? (
          <div className="flex flex-col items-center mb-6">
            <div className="text-6xl mb-2 animate-bounce">🏆</div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)]">
              BOOYAH!
            </h1>
            <p className="text-xs font-black uppercase tracking-widest text-amber-300 mt-1">
              CHAMPION #1 SURVIVOR
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-6">
            <div className="text-6xl mb-2">💀</div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-red-500 drop-shadow-[0_4px_16px_rgba(239,68,68,0.6)]">
              ELIMINATED
            </h1>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">
              RANK #{rank} / 6
            </p>
          </div>
        )}

        {/* Match Statistics Card */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 grid grid-cols-3 gap-2 my-2 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Kills</p>
            <p className="text-xl font-black text-amber-400 font-mono">{kills}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Damage</p>
            <p className="text-xl font-black text-white font-mono">{damageDealt}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Time</p>
            <p className="text-xl font-black text-cyan-400 font-mono">{formatTime(timeAliveSec)}</p>
          </div>
        </div>

        {/* EXP & Rank Progress */}
        <div className="w-full bg-slate-900/60 rounded-xl p-3 my-3 border border-slate-800/80 text-left">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="text-slate-300">Rank Points Gained</span>
            <span className="text-emerald-400 font-black">+{isVictory ? '45' : '15'} RP</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
              style={{ width: isVictory ? '90%' : '65%' }}
            />
          </div>
        </div>

        {/* Action CTAs */}
        <div className="w-full flex flex-col gap-2.5 mt-4">
          <button
            onClick={onRestart}
            data-start="true"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm uppercase tracking-wider shadow-xl transform active:scale-95 transition cursor-pointer"
          >
            PLAY AGAIN
          </button>

          <button
            onClick={onReturnToLobby}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase transition cursor-pointer"
          >
            RETURN TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};
