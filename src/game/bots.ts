import * as THREE from 'three';
import { BotEntity, WeaponType, ZoneCircle, LootType } from './types.ts';
import { createCharacter, CharacterRig, animateCharacterGait, triggerHitFlash } from './character.ts';
import { WEAPON_PRESETS, isInsideZone, calculateWeaponDamage } from './rules.ts';
import { soundFx } from './audio.ts';
import { NavGrid } from './pathfinding.ts';

const BOT_NAMES = ['Viper_Pro', 'Ghost_Rider', 'Apex_Sniper', 'Nova_Strike', 'Reaper_07', 'Titan_Slayer', 'Cobra_Kill', 'Shadow_Hawk'];
const BOT_COLORS = [0xef4444, 0xf59e0b, 0x8b5cf6, 0x10b981, 0xec4899, 0x06b6d4, 0x84cc16];

export interface BotManager {
  bots: BotEntity[];
  botRigs: Map<string, CharacterRig>;
  update: (
    dt: number,
    time: number,
    playerPos: { x: number; y: number; z: number },
    safeZone: ZoneCircle,
    onPlayerHit: (damage: number) => void,
    onBotDeath: (bot: BotEntity) => void,
    triggerMuzzleFlash: (pos: THREE.Vector3, dir: THREE.Vector3) => void
  ) => void;
  damageBot: (botId: string, damage: number, attackerIsPlayer: boolean) => { dead: boolean; bot?: BotEntity };
  dispose: () => void;
}

export function createBotManager(
  scene: THREE.Scene,
  count = 5,
  initialLootTypes: LootType[] = ['rifle', 'shotgun', 'medkit', 'sniper', 'shield_potion'],
  navGrid?: NavGrid
): BotManager {
  const bots: BotEntity[] = [];
  const botRigs = new Map<string, CharacterRig>();

  // Spawn bots at perimeter locations on the island (>40m from player at 0,0)
  const spawnPositions = [
    { x: -45, z: -38 },
    { x: 45, z: -38 },
    { x: -42, z: 38 },
    { x: 42, z: 38 },
    { x: 0, z: -52 },
    { x: -50, z: 0 },
    { x: 50, z: 0 },
    { x: 0, z: 52 },
  ];

  for (let i = 0; i < count; i++) {
    const pos = spawnPositions[i % spawnPositions.length];
    const botId = `bot_${i}_${Date.now()}`;
    const name = BOT_NAMES[i % BOT_NAMES.length];
    const color = BOT_COLORS[i % BOT_COLORS.length];
    const weapon: WeaponType = i % 2 === 0 ? 'rifle' : i % 3 === 0 ? 'shotgun' : 'pistol';

    const bot: BotEntity = {
      id: botId,
      name,
      color: '#' + color.toString(16).padStart(6, '0'),
      x: pos.x + (Math.random() * 4 - 2),
      z: pos.z + (Math.random() * 4 - 2),
      y: 0,
      vx: 0,
      vz: 0,
      rotationY: Math.random() * Math.PI * 2,
      hp: 100,
      maxHp: 100,
      alive: true,
      weapon,
      state: 'wander',
      targetEntityId: null,
      lastShotTime: 0,
      fireCooldown: WEAPON_PRESETS[weapon].fireRateMs / 1000 + 0.3,
      lootDropType: initialLootTypes[i % initialLootTypes.length],
    };

    const botBundleIds = [
      'bundle_red_criminal',
      'bundle_sakura',
      'bundle_cobra_rage',
      'bundle_hip_hop',
      'bundle_golden_samurai',
      'bundle_arctic_blue',
    ];
    const bundleId = botBundleIds[i % botBundleIds.length];
    const rig = createCharacter(color, weapon, bundleId);
    rig.group.position.set(bot.x, bot.y, bot.z);
    rig.group.name = `botGroup_${botId}`;
    scene.add(rig.group);

    // Floating HP bar above bot head
    const hpBarGroup = new THREE.Group();
    hpBarGroup.position.set(0, 2.5, 0);
    hpBarGroup.name = 'hpBar';

    const bgBar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.16),
      new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide })
    );
    const fgBar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    fgBar.position.z = 0.01;
    fgBar.name = 'fgBar';

    hpBarGroup.add(bgBar);
    hpBarGroup.add(fgBar);
    rig.group.add(hpBarGroup);

    bots.push(bot);
    botRigs.set(botId, rig);
  }

  function update(
    dt: number,
    time: number,
    playerPos: { x: number; y: number; z: number },
    safeZone: ZoneCircle,
    onPlayerHit: (damage: number) => void,
    onBotDeath: (bot: BotEntity) => void,
    triggerMuzzleFlash: (pos: THREE.Vector3, dir: THREE.Vector3) => void
  ) {
    const camera = scene.getObjectByName('mainCamera') as THREE.Camera | undefined;

    bots.forEach((bot) => {
      if (!bot.alive) return;
      const rig = botRigs.get(bot.id);
      if (!rig) return;

      // 1. Zone Damage Check
      const inZone = isInsideZone(bot.x, bot.z, safeZone);
      if (!inZone) {
        bot.hp -= dt * 5;
        if (bot.hp <= 0) {
          bot.alive = false;
          bot.hp = 0;
          onBotDeath(bot);
          scene.remove(rig.group);
          return;
        }
      }

      // 2. State & Target Evaluation
      const distToPlayer = Math.hypot(playerPos.x - bot.x, playerPos.z - bot.z);
      // Give player initial 6 seconds grace period before bots enter combat
      const isPlayerVisible = time > 6.0 && distToPlayer < 18;

      // Helper function to navigate bot towards a world target using A* pathfinding
      const navigateTowards = (targetX: number, targetZ: number, moveSpeed: number) => {
        if (!navGrid) {
          const dx = targetX - bot.x;
          const dz = targetZ - bot.z;
          const dist = Math.hypot(dx, dz) || 1;
          bot.vx = (dx / dist) * moveSpeed;
          bot.vz = (dz / dist) * moveSpeed;
          bot.rotationY = Math.atan2(dx, dz);
          return;
        }

        const directLOS = navGrid.hasLineOfSight(bot.x, bot.z, targetX, targetZ);
        if (directLOS) {
          // Direct straight line is clear
          bot.currentPath = [{ x: targetX, z: targetZ }];
          bot.pathIndex = 0;
        } else {
          // Obstacle blocks direct line: recalculate A* path periodically (every 0.6s)
          const needsNewPath =
            !bot.currentPath ||
            bot.currentPath.length === 0 ||
            time - (bot.lastPathTime || 0) > 0.6;

          if (needsNewPath) {
            bot.lastPathTime = time;
            bot.currentPath = navGrid.findPath({ x: bot.x, z: bot.z }, { x: targetX, z: targetZ });
            bot.pathIndex = 0;
          }
        }

        // Follow current waypoint in A* path
        if (bot.currentPath && bot.currentPath.length > 0) {
          let currIdx = bot.pathIndex || 0;
          let wp = bot.currentPath[currIdx];

          // If reached waypoint, advance to next
          if (wp && Math.hypot(wp.x - bot.x, wp.z - bot.z) < 1.8 && currIdx < bot.currentPath.length - 1) {
            currIdx++;
            bot.pathIndex = currIdx;
            wp = bot.currentPath[currIdx];
          }

          if (wp) {
            const dx = wp.x - bot.x;
            const dz = wp.z - bot.z;
            const dist = Math.hypot(dx, dz) || 1;
            bot.vx = (dx / dist) * moveSpeed;
            bot.vz = (dz / dist) * moveSpeed;
            bot.rotationY = Math.atan2(dx, dz);
          }
        }
      };

      if (!inZone) {
        // High priority: flee towards safe zone center using A* pathfinding around buildings
        bot.state = 'flee_zone';
        navigateTowards(safeZone.x, safeZone.z, 3.8);
      } else if (isPlayerVisible) {
        // Combat mode with player
        bot.state = 'combat';
        const dist = distToPlayer;

        // If far or line of sight is obstructed by a house, navigate around obstacles
        const hasLOS = navGrid ? navGrid.hasLineOfSight(bot.x, bot.z, playerPos.x, playerPos.z) : true;

        if (!hasLOS || dist > 12) {
          navigateTowards(playerPos.x, playerPos.z, 2.8);
        } else if (dist < 4.5) {
          const dx = playerPos.x - bot.x;
          const dz = playerPos.z - bot.z;
          bot.vx = -(dx / dist) * 2.0;
          bot.vz = -(dz / dist) * 2.0;
          bot.rotationY = Math.atan2(dx, dz);
        } else {
          // Strafe left/right when in open combat line of sight
          const dx = playerPos.x - bot.x;
          const dz = playerPos.z - bot.z;
          const strafeDir = Math.sin(time * 2 + bot.x) > 0 ? 1 : -1;
          bot.vx = (-dz / dist) * 2.0 * strafeDir;
          bot.vz = (dx / dist) * 2.0 * strafeDir;
          bot.rotationY = Math.atan2(dx, dz);
        }

        // Paced shooting at player (cooldown 1.8s - 2.4s)
        const attackInterval = 1.8 + (parseInt(bot.id.slice(-2), 10) % 5) * 0.15;
        if (time - bot.lastShotTime > attackInterval && hasLOS) {
          bot.lastShotTime = time;
          const weapon = WEAPON_PRESETS[bot.weapon];

          // Audio
          if (bot.weapon === 'shotgun') soundFx.playShotgunShot();
          else if (bot.weapon === 'rifle') soundFx.playRifleShot();
          else soundFx.playPistolShot();

          // Muzzle flash
          const muzzlePos = new THREE.Vector3();
          rig.muzzleAnchor.getWorldPosition(muzzlePos);
          const aimDir = new THREE.Vector3(playerPos.x - bot.x, 0.4, playerPos.z - bot.z).normalize();
          triggerMuzzleFlash(muzzlePos, aimDir);

          // Hit chance & calibrated fair damage
          const hitChance = Math.max(0.25, 0.55 - distToPlayer * 0.02);
          if (Math.random() < hitChance) {
            const rawDmg = calculateWeaponDamage(weapon.damage, distToPlayer, weapon.range);
            const fairDamage = Math.max(5, Math.round(rawDmg * 0.45)); // 8-12 damage per burst
            onPlayerHit(fairDamage);
          }
        }
      } else {
        // Peaceful wander / patrol
        bot.state = 'wander';
        if (Math.random() < 0.02 || !bot.targetPos) {
          const wanderAngle = Math.random() * Math.PI * 2;
          const wanderDist = 8 + Math.random() * 16;
          bot.targetPos = {
            x: bot.x + Math.cos(wanderAngle) * wanderDist,
            z: bot.z + Math.sin(wanderAngle) * wanderDist,
          };
        }

        navigateTowards(bot.targetPos.x, bot.targetPos.z, 2.2);
      }

      // Apply movement
      bot.x += bot.vx * dt;
      bot.z += bot.vz * dt;

      // Keep within island bounds (radius 68m)
      const distFromIslandCenter = Math.hypot(bot.x, bot.z);
      if (distFromIslandCenter > 68) {
        const pull = 68 / distFromIslandCenter;
        bot.x *= pull;
        bot.z *= pull;
      }

      // Update 3D Mesh
      rig.group.position.set(bot.x, 0, bot.z);
      rig.group.rotation.y = bot.rotationY;

      // Animate gait
      const currentSpeed = Math.hypot(bot.vx, bot.vz);
      animateCharacterGait(rig, currentSpeed, time);

      // Billboarding HP bar towards camera
      const hpBar = rig.group.getObjectByName('hpBar');
      if (hpBar && camera) {
        hpBar.quaternion.copy(camera.quaternion);
        const fgBar = hpBar.getObjectByName('fgBar') as THREE.Mesh | undefined;
        if (fgBar) {
          const hpPercent = Math.max(0, bot.hp / bot.maxHp);
          fgBar.scale.x = hpPercent;
          fgBar.position.x = -(1 - hpPercent) * 0.58;
        }
      }
    });
  }

  function damageBot(botId: string, damage: number, attackerIsPlayer: boolean) {
    const bot = bots.find((b) => b.id === botId);
    if (!bot || !bot.alive) return { dead: false };

    bot.hp -= damage;
    const rig = botRigs.get(botId);
    if (rig) {
      triggerHitFlash(rig);
    }

    if (bot.hp <= 0) {
      bot.alive = false;
      bot.hp = 0;
      if (rig) {
        // Dramatic death topple
        rig.group.rotation.x = -Math.PI / 2;
        rig.group.position.y = 0.2;
        setTimeout(() => {
          scene.remove(rig.group);
        }, 1500);
      }
      return { dead: true, bot };
    }

    return { dead: false, bot };
  }

  function dispose() {
    bots.forEach((bot) => {
      const rig = botRigs.get(bot.id);
      if (rig) scene.remove(rig.group);
    });
    bots.length = 0;
    botRigs.clear();
  }

  return {
    bots,
    botRigs,
    update,
    damageBot,
    dispose,
  };
}
