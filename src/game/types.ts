export type GameState = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

export type WeaponType = 'rifle' | 'shotgun' | 'pistol' | 'sniper';

export interface WeaponStats {
  id: WeaponType;
  name: string;
  damage: number;
  fireRateMs: number;
  currentAmmo: number;
  maxClip: number;
  reserveAmmo: number;
  spread: number;
  pellets: number;
  range: number;
  color: string;
  description: string;
}

export type LootType = 'rifle' | 'shotgun' | 'medkit' | 'sniper' | 'shield_potion' | 'ammo';

export interface LootCrate {
  id: string;
  x: number;
  z: number;
  type: LootType;
  collected: boolean;
  meshGroup?: any;
}

export interface ZoneCircle {
  x: number;
  z: number;
  radius: number;
}

export interface SafeZoneState {
  current: ZoneCircle;
  target: ZoneCircle;
  phase: number;
  phaseTotalTime: number;
  phaseTimeRemaining: number;
  isShrinking: boolean;
  shrinkDuration: number;
  shrinkElapsed: number;
  damagePerSec: number;
}

export interface BotEntity {
  id: string;
  name: string;
  color: string;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  rotationY: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  weapon: WeaponType;
  state: 'wander' | 'combat' | 'flee_zone' | 'loot';
  targetEntityId: string | null;
  lastShotTime: number;
  fireCooldown: number;
  meshGroup?: any;
  targetPos?: { x: number; z: number };
  currentPath?: { x: number; z: number }[];
  pathIndex?: number;
  lastPathTime?: number;
  lootDropType: LootType;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldPotions: number;
  medkits: number;
  kills: number;
  shotsFired: number;
  shotsHit: number;
  damageDealt: number;
  rank: number;
  timeAliveSec: number;
}

export interface ObstacleBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
  type: 'building' | 'rock' | 'tree';
}
