import { WeaponStats, WeaponType, ZoneCircle, LootType } from './types.ts';

export const WEAPON_PRESETS: Record<WeaponType, WeaponStats> = {
  pistol: {
    id: 'pistol',
    name: 'Tactical Pistol',
    damage: 18,
    fireRateMs: 300,
    currentAmmo: 12,
    maxClip: 12,
    reserveAmmo: 60,
    spread: 0.02,
    pellets: 1,
    range: 50,
    color: '#94a3b8',
    description: 'Reliable sidearm with balanced accuracy',
  },
  rifle: {
    id: 'rifle',
    name: 'Assault Rifle AR-47',
    damage: 26,
    fireRateMs: 130,
    currentAmmo: 30,
    maxClip: 30,
    reserveAmmo: 120,
    spread: 0.04,
    pellets: 1,
    range: 85,
    color: '#38bdf8',
    description: 'High fire rate rapid assault rifle',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Pump Action Shotgun',
    damage: 14, // 14 x 6 pellets = 84 max damage at close range
    fireRateMs: 850,
    currentAmmo: 6,
    maxClip: 6,
    reserveAmmo: 24,
    spread: 0.12,
    pellets: 6,
    range: 30,
    color: '#f97316',
    description: 'Devastating close-quarters multi-pellet blast',
  },
  sniper: {
    id: 'sniper',
    name: 'Heavy Sniper',
    damage: 85,
    fireRateMs: 1200,
    currentAmmo: 5,
    maxClip: 5,
    reserveAmmo: 15,
    spread: 0.005,
    pellets: 1,
    range: 120,
    color: '#a855f7',
    description: 'Long-range pinpoint high-impact rifle',
  },
};

/**
 * Checks if a point is inside the given circular zone
 */
export function isInsideZone(x: number, z: number, zone: ZoneCircle): boolean {
  const dx = x - zone.x;
  const dz = z - zone.z;
  return dx * dx + dz * dz <= zone.radius * zone.radius;
}

/**
 * Distance from a point to the perimeter of the zone (negative if inside, positive if outside)
 */
export function distanceToZonePerimeter(x: number, z: number, zone: ZoneCircle): number {
  const dx = x - zone.x;
  const dz = z - zone.z;
  const distToCenter = Math.sqrt(dx * dx + dz * dz);
  return distToCenter - zone.radius;
}

/**
 * Calculate zone damage over time dt (seconds)
 */
export function calculateZoneDamage(dt: number, dps = 5): number {
  return Math.max(0, dt * dps);
}

/**
 * Interpolate circle position and radius between start and target
 */
export function interpolateZone(
  start: ZoneCircle,
  target: ZoneCircle,
  progress: number
): ZoneCircle {
  const clampedT = Math.min(Math.max(progress, 0), 1);
  return {
    x: start.x + (target.x - start.x) * clampedT,
    z: start.z + (target.z - start.z) * clampedT,
    radius: start.radius + (target.radius - start.radius) * clampedT,
  };
}

/**
 * Compute damage with distance falloff
 */
export function calculateWeaponDamage(
  baseDamage: number,
  distance: number,
  maxRange: number
): number {
  if (distance > maxRange) return 0;
  // Falloff from 1.0 down to 0.5 at max range
  const factor = 1.0 - 0.5 * (distance / maxRange);
  return Math.max(1, Math.round(baseDamage * factor));
}

/**
 * Generates a random safe zone center constrained inside the current circle
 */
export function generateNextZoneCenter(
  current: ZoneCircle,
  nextRadius: number,
  randomFn = Math.random
): ZoneCircle {
  const maxOffset = Math.max(0, current.radius - nextRadius);
  const angle = randomFn() * Math.PI * 2;
  const dist = randomFn() * maxOffset * 0.85; // Stay well inside
  return {
    x: current.x + Math.cos(angle) * dist,
    z: current.z + Math.sin(angle) * dist,
    radius: nextRadius,
  };
}

/**
 * Check if player wins or loses based on alive count and player HP
 */
export function evaluateGameState(
  playerHp: number,
  aliveCount: number
): 'playing' | 'victory' | 'gameover' {
  if (playerHp <= 0) return 'gameover';
  if (aliveCount <= 1 && playerHp > 0) return 'victory';
  return 'playing';
}

/**
 * Clamp HP within bounds
 */
export function applyHealing(currentHp: number, healAmount = 50, maxHp = 100): number {
  return Math.min(maxHp, currentHp + healAmount);
}

/**
 * Apply Shield Potion (+25 shield up to maxShield = 100)
 */
export function applyShieldPotion(currentShield: number, potionAmount = 25, maxShield = 100): number {
  return Math.min(maxShield, currentShield + potionAmount);
}

/**
 * Apply damage that is absorbed by Shield first before health
 */
export function applyDamageToShieldAndHp(
  currentShield: number,
  currentHp: number,
  damage: number
): { newShield: number; newHp: number; absorbedByShield: number } {
  if (damage <= 0) {
    return { newShield: currentShield, newHp: currentHp, absorbedByShield: 0 };
  }

  const absorbed = Math.min(currentShield, damage);
  const remainingDamage = damage - absorbed;
  const newShield = currentShield - absorbed;
  const newHp = Math.max(0, currentHp - remainingDamage);

  return {
    newShield,
    newHp,
    absorbedByShield: absorbed,
  };
}
