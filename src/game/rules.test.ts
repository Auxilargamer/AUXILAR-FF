import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isInsideZone,
  distanceToZonePerimeter,
  calculateZoneDamage,
  interpolateZone,
  calculateWeaponDamage,
  generateNextZoneCenter,
  evaluateGameState,
  applyHealing,
  applyShieldPotion,
  applyDamageToShieldAndHp,
  WEAPON_PRESETS,
} from './rules.ts';

test('isInsideZone correctly identifies inside and outside points', () => {
  const zone = { x: 0, z: 0, radius: 50 };
  assert.equal(isInsideZone(0, 0, zone), true);
  assert.equal(isInsideZone(30, 40, zone), true); // 30^2 + 40^2 = 2500 = 50^2
  assert.equal(isInsideZone(31, 40, zone), false); // 31^2 + 40^2 = 2561 > 2500
  assert.equal(isInsideZone(60, 0, zone), false);
});

test('distanceToZonePerimeter computes correct signed distance', () => {
  const zone = { x: 10, z: 10, radius: 20 };
  assert.equal(distanceToZonePerimeter(10, 10, zone), -20);
  assert.equal(distanceToZonePerimeter(10, 30, zone), 0);
  assert.equal(distanceToZonePerimeter(10, 40, zone), 10);
});

test('calculateZoneDamage deals correct damage with default DPS', () => {
  assert.equal(calculateZoneDamage(1.0, 5), 5);
  assert.equal(calculateZoneDamage(0.5, 5), 2.5);
  assert.equal(calculateZoneDamage(0, 5), 0);
});

test('interpolateZone computes smooth transitions between circles', () => {
  const start = { x: 0, z: 0, radius: 100 };
  const target = { x: 50, z: -50, radius: 50 };

  const mid = interpolateZone(start, target, 0.5);
  assert.equal(mid.x, 25);
  assert.equal(mid.z, -25);
  assert.equal(mid.radius, 75);

  const done = interpolateZone(start, target, 1.2); // clamped
  assert.equal(done.x, 50);
  assert.equal(done.z, -50);
  assert.equal(done.radius, 50);
});

test('calculateWeaponDamage handles range falloff', () => {
  const closeDmg = calculateWeaponDamage(30, 0, 100);
  assert.equal(closeDmg, 30);

  const midDmg = calculateWeaponDamage(30, 50, 100);
  assert.equal(midDmg, 23); // 30 * (1 - 0.25) = 22.5 rounded to 23

  const maxRangeDmg = calculateWeaponDamage(30, 100, 100);
  assert.equal(maxRangeDmg, 15); // 30 * (1 - 0.5) = 15

  const outOfRangeDmg = calculateWeaponDamage(30, 101, 100);
  assert.equal(outOfRangeDmg, 0);
});

test('generateNextZoneCenter stays bounded within current circle', () => {
  const current = { x: 0, z: 0, radius: 80 };
  const nextRadius = 40;
  const next = generateNextZoneCenter(current, nextRadius, () => 0.5);

  const distToOldCenter = Math.hypot(next.x - current.x, next.z - current.z);
  assert.ok(distToOldCenter <= current.radius - nextRadius);
  assert.equal(next.radius, 40);
});

test('evaluateGameState correctly determines victory, gameover, or ongoing playing', () => {
  assert.equal(evaluateGameState(100, 6), 'playing');
  assert.equal(evaluateGameState(50, 2), 'playing');
  assert.equal(evaluateGameState(0, 3), 'gameover');
  assert.equal(evaluateGameState(-10, 1), 'gameover');
  assert.equal(evaluateGameState(80, 1), 'victory');
});

test('applyHealing caps at maxHp', () => {
  assert.equal(applyHealing(40, 50, 100), 90);
  assert.equal(applyHealing(80, 50, 100), 100);
  assert.equal(applyHealing(100, 50, 100), 100);
});

test('applyShieldPotion adds 25 shield and caps at maxShield', () => {
  assert.equal(applyShieldPotion(0, 25, 100), 25);
  assert.equal(applyShieldPotion(85, 25, 100), 100);
  assert.equal(applyShieldPotion(100, 25, 100), 100);
});

test('applyDamageToShieldAndHp absorbs damage with shield first', () => {
  // Shield absorbs all damage
  const res1 = applyDamageToShieldAndHp(50, 100, 30);
  assert.equal(res1.newShield, 20);
  assert.equal(res1.newHp, 100);
  assert.equal(res1.absorbedByShield, 30);

  // Damage breaks shield and affects HP
  const res2 = applyDamageToShieldAndHp(20, 100, 35);
  assert.equal(res2.newShield, 0);
  assert.equal(res2.newHp, 85);
  assert.equal(res2.absorbedByShield, 20);

  // Lethal damage clamps HP to 0
  const res3 = applyDamageToShieldAndHp(0, 40, 60);
  assert.equal(res3.newShield, 0);
  assert.equal(res3.newHp, 0);
});

test('weapon presets contain valid configurations', () => {
  assert.ok(WEAPON_PRESETS.rifle.fireRateMs < WEAPON_PRESETS.shotgun.fireRateMs);
  assert.ok(WEAPON_PRESETS.shotgun.pellets > 1);
  assert.ok(WEAPON_PRESETS.sniper.damage > WEAPON_PRESETS.pistol.damage);
});
