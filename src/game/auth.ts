export type AuthProvider = 'guest' | 'google' | 'facebook';

export interface UserProfile {
  uid: string;
  nickname: string;
  email: string | null;
  provider: AuthProvider;
  level: number;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Heroic' | 'Grandmaster';
  diamonds: number;
  gold: number;
  avatar: string;
  unlockedBundles: string[];
  equippedBundle: string;
  equippedWeaponSkin: string;
  isAdmin: boolean;
  godMode?: boolean;
  speedMultiplier?: number;
  oneShotKill?: boolean;
  customBotCount?: number;
}

const STORAGE_KEY = 'mini_br_user_profile';

export const ADMIN_EMAIL = 'elightgamer1@gmail.com';

export function getDefaultGuestProfile(): UserProfile {
  const randomUid = Math.floor(10000000 + Math.random() * 90000000).toString();
  return {
    uid: randomUid,
    nickname: `Survivor_${randomUid.slice(-4)}`,
    email: null,
    provider: 'guest',
    level: 18,
    rank: 'Diamond',
    diamonds: 500,
    gold: 8500,
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
    unlockedBundles: ['bundle_default', 'bundle_street_boy'],
    equippedBundle: 'bundle_default',
    equippedWeaponSkin: 'skin_default',
    isAdmin: false,
    godMode: false,
    speedMultiplier: 1.0,
    oneShotKill: false,
    customBotCount: 5,
  };
}

export function getAdminProfile(email = ADMIN_EMAIL): UserProfile {
  return {
    uid: '77788899',
    nickname: 'ELIGHT_GAMER_VIP',
    email: email,
    provider: 'google',
    level: 99,
    rank: 'Grandmaster',
    diamonds: 999999,
    gold: 5000000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    unlockedBundles: [
      'bundle_default',
      'bundle_red_criminal',
      'bundle_hip_hop',
      'bundle_sakura',
      'bundle_cobra_rage',
      'bundle_golden_samurai',
      'bundle_arctic_blue',
      'bundle_green_criminal',
      'bundle_cyber_bunny',
      'bundle_street_boy',
    ],
    equippedBundle: 'bundle_red_criminal',
    equippedWeaponSkin: 'skin_evo_dragon',
    isAdmin: true,
    godMode: false,
    speedMultiplier: 1.0,
    oneShotKill: false,
    customBotCount: 5,
  };
}

export const ADMIN_PASSWORD = 'elight123';
export const DEMO_USER_PASSWORD = 'user123';

export function verifyUserCredentials(
  email: string,
  pass: string,
  provider: 'google' | 'facebook'
): { success: boolean; error?: string; profile?: UserProfile } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
    if (cleanPass === ADMIN_PASSWORD || cleanPass === 'admin777') {
      return { success: true, profile: getAdminProfile(ADMIN_EMAIL) };
    } else {
      return {
        success: false,
        error: 'गलत पासवर्ड! (Incorrect Password). Manager ID elightgamer1@gmail.com का सही पासवर्ड दर्ज करें।',
      };
    }
  }

  // Normal users
  if (!cleanPass || cleanPass.length < 4) {
    return {
      success: false,
      error: 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए! (Password must be at least 4 characters).',
    };
  }

  // Allow login as normal user (Admin panel will NOT be granted)
  const randomUid = Math.floor(20000000 + Math.random() * 80000000).toString();
  const username = cleanEmail.split('@')[0].toUpperCase();
  const normalUser: UserProfile = {
    uid: randomUid,
    nickname: username,
    email: cleanEmail,
    provider: provider,
    level: 32,
    rank: 'Heroic',
    diamonds: 1200,
    gold: 24000,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    unlockedBundles: ['bundle_default', 'bundle_street_boy', 'bundle_cyber_bunny'],
    equippedBundle: 'bundle_street_boy',
    equippedWeaponSkin: 'evo_ak47_blue_dragon',
    isAdmin: false,
    godMode: false,
    speedMultiplier: 1.0,
    oneShotKill: false,
    customBotCount: 5,
  };

  return { success: true, profile: normalUser };
}

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Ensure admin status is strictly maintained for elightgamer1@gmail.com
      if (data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        data.isAdmin = true;
      }
      return data;
    }
  } catch (e) {
    console.error('Failed to load profile:', e);
  }
  return null;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}

