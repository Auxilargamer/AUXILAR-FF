import React, { useState } from 'react';
import {
  UserProfile,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  verifyUserCredentials,
  createGuestProfile,
} from '../game/auth.ts';
import { soundFx } from '../game/audio.ts';

interface LoginScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'facebook' | 'guest'>('google');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [guestName, setGuestName] = useState('Survivor_789');
  const [isEditingGuest, setIsEditingGuest] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  // 1. Direct Guest Login (Instant enter, no password)
  const handleGuestLogin = () => {
    soundFx.playVictoryFanfare();
    const guestUser = createGuestProfile(guestName.trim() || 'Survivor_789');
    onLoginSuccess(guestUser);
  };

  // 2. Start Google Login Flow (Requires Password)
  const handleStartGoogleAuth = (email: string) => {
    setSelectedEmail(email);
    setSelectedProvider('google');
    setPassword('');
    setLoginError(null);
    setShowGoogleModal(false);
    setShowPasswordModal(true);
  };

  // 3. Start Facebook Login Flow (Requires Password)
  const handleStartFacebookAuth = () => {
    setSelectedEmail('fb_survivor@facebook.com');
    setSelectedProvider('facebook');
    setPassword('');
    setLoginError(null);
    setShowPasswordModal(true);
  };

  // 4. Verify Password & Complete Login
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const result = verifyUserCredentials(selectedEmail, password, selectedProvider);
    if (!result.success || !result.profile) {
      soundFx.playDefeatSound();
      setLoginError(result.error || 'गलत पासवर्ड! (Incorrect Password).');
      return;
    }

    soundFx.playVictoryFanfare();
    setShowPasswordModal(false);
    onLoginSuccess(result.profile);
  };

  const isAdminSelected = selectedEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none">
      {/* Background Hero Battle Royale Visual */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/20 via-transparent to-transparent z-10" />
        <div className="w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Bar: Compact Free Fire Version Badge & Server Ping */}
      <div className="relative z-20 w-full px-3 sm:px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-black shadow text-xs">
            FF
          </div>
          <div>
            <h2 className="text-[11px] sm:text-xs tracking-widest font-black uppercase text-amber-400 leading-tight">
              Garena Free Fire MAX
            </h2>
            <p className="text-[9px] text-slate-400 leading-tight">Horizontal Phone Edition</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-full shadow">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-emerald-400">INDIA SERVER · 18ms</span>
        </div>
      </div>

      {/* Center 2-Column Horizontal Phone Layout */}
      <div className="relative z-20 flex-1 min-h-0 flex items-center justify-center w-full px-4 py-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 items-center w-full max-w-3xl">
          {/* Left Column: Flame Logo + Title + Manager Callout */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-amber-500/20 to-red-600/30 blur-lg absolute" />
                <svg
                  className="w-10 h-10 text-amber-400 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C9.5 6 7 8.5 7 12a5 5 0 0010 0c0-2-1-4-2-5.5.5 1.5 0 3-1.5 3.5-1.5.5-2.5-1-2.5-2.5 0-1.8 1-3.5 1-5.5z" />
                </svg>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 leading-none">
                  FREE FIRE MAX
                </h1>
                <span className="text-[10px] font-black tracking-widest uppercase text-amber-300">
                  OFFICIAL BATTLE ROYALE
                </span>
              </div>
            </div>

            {/* Manager ID Alert Callout Banner */}
            <div className="mt-2 p-2 rounded-xl bg-amber-950/70 border border-amber-500/80 w-full text-left flex items-start gap-2 shadow-lg">
              <span className="text-base shrink-0">👑</span>
              <div className="text-[10px] leading-tight">
                <p className="font-black text-amber-400 uppercase tracking-wide">
                  मैनेजर एडमिन आईडी (Manager Login):
                </p>
                <p className="text-slate-200 mt-0.5">
                  ईमेल: <span className="font-mono text-amber-300 font-bold">{ADMIN_EMAIL}</span> · पासवर्ड: <span className="font-mono text-emerald-400 font-bold">{ADMIN_PASSWORD}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Mobile Login Options */}
          <div className="flex flex-col gap-2 w-full max-w-sm mx-auto">
            {/* 1. Google Login Button */}
            <button
              onClick={() => setShowGoogleModal(true)}
              className="w-full h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-between px-3 shadow transition active:scale-[0.98] border border-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>SIGN IN WITH GOOGLE</span>
              </div>
              <span className="text-[8px] bg-amber-500/20 text-amber-700 font-black px-1.5 py-0.5 rounded">
                MANAGER READY
              </span>
            </button>

            {/* 2. Facebook Login Button */}
            <button
              onClick={handleStartFacebookAuth}
              className="w-full h-9 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>SIGN IN WITH FACEBOOK</span>
            </button>

            {/* 3. Direct Guest Login Button */}
            <div className="w-full flex items-center gap-1.5">
              <button
                onClick={handleGuestLogin}
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-[0.98] cursor-pointer"
              >
                <span>🎮</span>
                <span>PLAY AS GUEST (सीधा खेलें)</span>
              </button>
              <button
                onClick={() => setIsEditingGuest(!isEditingGuest)}
                title="Edit Guest Nickname"
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition cursor-pointer text-xs shrink-0"
              >
                ✏️
              </button>
            </div>

            {/* Nickname Editor for Guest */}
            {isEditingGuest && (
              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Guest Nickname..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="flex-1 bg-slate-800 text-white text-[11px] px-2 py-1 rounded outline-none border border-slate-700 focus:border-amber-400"
                />
                <button
                  onClick={handleGuestLogin}
                  className="px-2.5 py-1 bg-amber-500 text-black text-[10px] font-bold rounded hover:bg-amber-400 cursor-pointer shrink-0"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="relative z-20 w-full text-center py-1 text-[9px] text-slate-500 shrink-0">
        GARENA FREE FIRE MAX · 100% HORIZONTAL ANDROID PHONE COMPATIBLE
      </div>

      {/* Compact Google Account Picker Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2">
          <div className="w-full max-w-sm max-h-[92dvh] bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-3 sm:p-4 shadow-2xl relative text-left overflow-y-auto">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-1.5">
              <span className="text-base font-black text-blue-400">G</span> Choose Google Account
            </h3>
            <p className="text-[10px] text-slate-400 mb-2">to sign in to Garena Free Fire MAX</p>

            <div className="flex flex-col gap-2">
              {/* MANAGER ADMIN ACCOUNT */}
              <button
                onClick={() => handleStartGoogleAuth(ADMIN_EMAIL)}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-950/70 to-slate-800 border-2 border-amber-500 hover:border-amber-400 flex items-center gap-2.5 transition text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-black text-black text-sm shadow shrink-0">
                  👑
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-amber-400 group-hover:text-amber-300">
                      MANAGER / ADMIN
                    </span>
                    <span className="bg-amber-500 text-black text-[8px] font-black px-1 rounded uppercase">
                      VIP
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate font-mono">{ADMIN_EMAIL}</p>
                </div>
              </button>

              {/* Standard Demo Account */}
              <button
                onClick={() => handleStartGoogleAuth('player.pro@gmail.com')}
                className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 flex items-center gap-2.5 transition text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs shrink-0">
                  P
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white leading-tight">Pro Booyah Player (Normal)</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">player.pro@gmail.com</p>
                </div>
              </button>

              {/* Custom Email Input */}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-slate-400">
                  Or enter any custom Gmail:
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white text-[11px] px-2.5 py-1 rounded-lg outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => customEmail.trim() && handleStartGoogleAuth(customEmail.trim())}
                    disabled={!customEmail.trim()}
                    className="px-3 py-1 bg-amber-500 disabled:opacity-50 text-black font-bold text-[11px] rounded-lg hover:bg-amber-400 cursor-pointer shrink-0"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-2">
          <div className="w-full max-w-sm max-h-[92dvh] bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-3 sm:p-4 shadow-2xl relative text-left overflow-y-auto">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setLoginError(null);
              }}
              className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${
                  isAdminSelected ? 'bg-amber-500 text-black shadow' : 'bg-blue-600 text-white'
                }`}
              >
                {isAdminSelected ? '👑' : selectedProvider === 'facebook' ? 'f' : 'G'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider leading-tight">
                  {isAdminSelected ? 'MANAGER SECURITY CHECK' : 'ACCOUNT VERIFICATION'}
                </h3>
                <p className="text-[10px] text-amber-400 font-mono truncate">{selectedEmail}</p>
              </div>
            </div>

            {isAdminSelected ? (
              <div className="p-2 bg-amber-950/60 border border-amber-500/60 rounded-xl mb-2 text-[10px] text-amber-300 leading-tight">
                <p className="font-bold">🔐 Official Manager Password Required:</p>
                <p className="mt-0.5">
                  Admin पासवर्ड: <span className="font-mono font-black text-white bg-black/60 px-1.5 py-0.5 rounded">{ADMIN_PASSWORD}</span>
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 mb-2">
                सुरक्षा के लिए कृपया इस आईडी का पासवर्ड दर्ज करें:
              </p>
            )}

            <form onSubmit={handleVerifyPassword} className="flex flex-col gap-2">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  Password (पासवर्ड)
                </label>
                <div className="relative mt-0.5">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    placeholder="Enter password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-xl outline-none focus:border-amber-400 pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPasswordText ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-1.5 bg-red-950/80 border border-red-500/80 rounded-lg text-red-300 text-[10px] font-bold">
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs uppercase rounded-xl shadow transition active:scale-95 cursor-pointer mt-0.5"
              >
                VERIFY & ENTER GAME (लॉगिन करें)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
