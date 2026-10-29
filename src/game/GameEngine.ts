import * as THREE from 'three';
import { buildWorld, WorldData, createLootCrateMesh } from './world.ts';
import { createCharacter, CharacterRig, animateCharacterGait, triggerHitFlash } from './character.ts';
import { createBotManager, BotManager } from './bots.ts';
import {
  WeaponType,
  WeaponStats,
  SafeZoneState,
  LootCrate,
  LootType,
  PlayerStats,
} from './types.ts';
import {
  WEAPON_PRESETS,
  isInsideZone,
  interpolateZone,
  generateNextZoneCenter,
  evaluateGameState,
  applyHealing,
  applyShieldPotion,
  applyDamageToShieldAndHp,
  calculateWeaponDamage,
} from './rules.ts';
import { soundFx } from './audio.ts';
import { UserProfile } from './auth.ts';
import { FREE_FIRE_BUNDLES } from './bundles.ts';
import { NavGrid } from './pathfinding.ts';

export interface GameEngineCallbacks {
  onHpChange: (hp: number, maxHp: number) => void;
  onShieldChange: (shield: number, maxShield: number, shieldPotions: number) => void;
  onAmmoChange: (current: number, maxClip: number, reserve: number) => void;
  onWeaponChange: (weapon: WeaponStats) => void;
  onAliveChange: (alive: number) => void;
  onKillsChange: (kills: number) => void;
  onMedkitsChange: (medkits: number) => void;
  onZoneTimerChange: (remainingSec: number, phase: number, isShrinking: boolean) => void;
  onOutsideZoneChange: (isOutside: boolean) => void;
  onHitmarker: () => void;
  onPickupPrompt: (promptText: string | null) => void;
  onGameStateChange: (state: 'playing' | 'victory' | 'gameover') => void;
  onFlightStageChange: (stage: 'plane' | 'skydive' | 'parachute' | 'ground', altitude: number) => void;
  onMinimapUpdate: (data: {
    playerPos: { x: number; z: number; angle: number };
    safeZone: { x: number; z: number; radius: number };
    nextSafeZone: { x: number; z: number; radius: number };
    bots: { x: number; z: number }[];
    crates: { x: number; z: number; collected: boolean }[];
  }) => void;
}

export class GameEngine {
  private mount: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private userProfile: UserProfile;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private frameId: number = 0;
  private clock = new THREE.Clock();
  private isSoftwareGl: boolean = false;

  private worldData!: WorldData;
  private botManager!: BotManager;
  private playerRig!: CharacterRig;
  public navGrid!: NavGrid;

  // Flight & Skydive Sequence
  public flightStage: 'plane' | 'skydive' | 'parachute' | 'ground' = 'plane';
  public altitude = 135;
  private planeMesh!: THREE.Group;
  private parachuteMesh!: THREE.Group;
  private planeTime = 0;

  // Player State
  public playerPos = new THREE.Vector3(0, 0, 0);
  public playerVelocity = new THREE.Vector3();
  public playerYaw = 0;
  public playerPitch = 0.2;
  public isGrounded = false;
  public playerHp = 100;
  public maxHp = 100;
  public shield = 50;
  public maxShield = 100;
  public shieldPotions = 2;
  public medkits = 2;
  public kills = 0;
  public shotsFired = 0;
  public shotsHit = 0;
  public damageDealt = 0;
  public timeAlive = 0;
  public aliveCount = 6;

  // Weapons
  public inventory: WeaponStats[] = [];
  public activeWeaponIndex = 0;
  public lastShotTime = 0;

  // Safe Zone
  public safeZoneState: SafeZoneState = {
    current: { x: 0, z: 0, radius: 68 },
    target: { x: 0, z: 0, radius: 45 },
    phase: 1,
    phaseTotalTime: 30,
    phaseTimeRemaining: 30,
    isShrinking: false,
    shrinkDuration: 15,
    shrinkElapsed: 0,
    damagePerSec: 5,
  };

  // Input states
  private keysHeld = new Set<string>();
  private isPointerLocked = false;
  private isMouseDown = false;
  private nearbyCrate: LootCrate | null = null;

  // Mobile Touch Virtual Controls State
  public virtualMoveX = 0;
  public virtualMoveZ = 0;
  public isAutoSprinting = false;
  public isCrouched = false;
  public isScoped = false;
  public isSkillActive = false;
  public skillCooldownRemaining = 0;

  // Floating Free Fire Damage Popups
  private damagePopups: {
    sprite: THREE.Sprite;
    birthTime: number;
    lifespan: number;
    initialY: number;
  }[] = [];

  // Particles & Tracers
  private tracerLines: { line: THREE.Line; expireAt: number }[] = [];
  private sparksPool: THREE.InstancedMesh | null = null;

  constructor(mount: HTMLElement, callbacks: GameEngineCallbacks, profile: UserProfile) {
    this.mount = mount;
    this.callbacks = callbacks;
    this.userProfile = profile;
    this.init();
  }

  private init() {
    // 1. Detect software WebGL from GPU renderer string
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc); // Sky blue
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.007);

    const width = this.mount.clientWidth || window.innerWidth;
    const height = this.mount.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 500);
    this.camera.name = 'mainCamera';

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.mount.appendChild(this.renderer.domElement);

    // 4. Studio & Outdoor Lighting Contrast
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.85);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.3);
    sunLight.position.set(45, 60, 30);
    sunLight.castShadow = !this.isSoftwareGl;
    if (sunLight.castShadow) {
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 160;
      const d = 60;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(sunLight);

    // 5. Build Island World & Obstacles
    this.worldData = buildWorld(this.scene);
    this.navGrid = new NavGrid(this.worldData.obstacles);

    // 6. Spawn Cargo Plane and Parachute
    this.planeMesh = this.createCargoPlane();
    this.planeMesh.position.set(-65, 135, -65);
    this.planeMesh.rotation.y = -Math.PI / 4;
    this.scene.add(this.planeMesh);

    this.parachuteMesh = this.createParachute();

    // Check if headless autostart parameter
    const isAutostart =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('autostart') === '1';

    if (isAutostart) {
      this.flightStage = 'ground';
      this.isGrounded = true;
      this.playerPos.set(0, 0, 0);
    } else {
      this.flightStage = 'plane';
      this.isGrounded = false;
      this.playerPos.set(-65, 134, -65);
    }

    // 7. Spawn Player Character with Equipped Bundle & Weapon
    const bundle = FREE_FIRE_BUNDLES.find((b) => b.id === this.userProfile.equippedBundle) || FREE_FIRE_BUNDLES[0];
    this.playerRig = createCharacter(bundle.colorHex, 'rifle', bundle.id);
    this.playerRig.group.position.copy(this.playerPos);
    this.scene.add(this.playerRig.group);

    // Give starter weapon loadout: Assault Rifle & Tactical Pistol
    this.inventory = [
      { ...WEAPON_PRESETS.rifle },
      { ...WEAPON_PRESETS.pistol },
    ];
    this.activeWeaponIndex = 0;

    // 8. Spawn Bots with NavGrid Pathfinding
    const botCount = this.userProfile.customBotCount || 5;
    this.botManager = createBotManager(
      this.scene,
      botCount,
      ['rifle', 'shotgun', 'medkit', 'sniper', 'shield_potion'],
      this.navGrid
    );

    // Start background island ocean & wind ambience
    soundFx.startIslandAmbience();

    // 9. Event Listeners
    this.bindEvents();

    // 10. Initial Callbacks
    this.callbacks.onHpChange(this.playerHp, this.maxHp);
    this.callbacks.onShieldChange(this.shield, this.maxShield, this.shieldPotions);
    this.callbacks.onFlightStageChange(this.flightStage, this.flightStage === 'ground' ? 0 : 135);
    this.callbacks.onAmmoChange(
      this.inventory[0].currentAmmo,
      this.inventory[0].maxClip,
      this.inventory[0].reserveAmmo
    );
    this.callbacks.onWeaponChange(this.inventory[0]);
    this.callbacks.onAliveChange(botCount + 1);
    this.callbacks.onKillsChange(0);
    this.callbacks.onMedkitsChange(this.medkits);

    // 11. Start Animation Loop
    this.tick = this.tick.bind(this);
    this.startLoop();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('mousemove', this.handleMouseMove);

    // Pointer lock request
    canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.().catch(() => {});
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
    });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysHeld.add(e.code);

    // Weapon slot hotkeys [1], [2], [3]
    if (e.code === 'Digit1' && this.inventory.length > 0) this.switchWeapon(0);
    if (e.code === 'Digit2' && this.inventory.length > 1) this.switchWeapon(1);
    if (e.code === 'Digit3' && this.inventory.length > 2) this.switchWeapon(2);

    // Medkit Heal [KeyH] or [KeyE] when not near crate
    if (e.code === 'KeyH') {
      this.useMedkit();
    }

    // Shield Potion [KeyU]
    if (e.code === 'KeyU') {
      this.useShieldPotion();
    }

    // Interact / Loot [KeyE] or [KeyF]
    if ((e.code === 'KeyE' || e.code === 'KeyF') && this.nearbyCrate) {
      this.collectLootCrate(this.nearbyCrate);
    } else if (e.code === 'KeyE' && !this.nearbyCrate && this.playerHp < this.maxHp && this.medkits > 0) {
      this.useMedkit();
    }

    // Jump [Space]
    if (e.code === 'Space' && this.isGrounded) {
      this.playerVelocity.y = 9.2;
      this.isGrounded = false;
      soundFx.playJumpSound();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private handleBlur = () => {
    this.keysHeld.clear();
    this.isMouseDown = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = true;
      this.tryShoot();
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = false;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.isPointerLocked) {
      const sensitivity = 0.0022;
      this.playerYaw -= e.movementX * sensitivity;
      this.playerPitch -= e.movementY * sensitivity;
      this.playerPitch = Math.max(-0.65, Math.min(0.85, this.playerPitch));
    }
  };

  private handleResize = () => {
    if (!this.mount) return;
    const width = this.mount.clientWidth || window.innerWidth;
    const height = this.mount.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public switchWeapon(index: number) {
    if (index >= 0 && index < this.inventory.length) {
      this.activeWeaponIndex = index;
      const weapon = this.inventory[index];
      this.callbacks.onWeaponChange(weapon);
      this.callbacks.onAmmoChange(weapon.currentAmmo, weapon.maxClip, weapon.reserveAmmo);

      // Re-create gun mesh on player rig
      if (this.playerRig.gunMesh) {
        this.playerRig.group.remove(this.playerRig.gunMesh);
      }
      const newGun = createCharacter(this.playerRig.baseColor, weapon.id).gunMesh;
      newGun.position.set(0.28, 1.15, -0.55);
      this.playerRig.group.add(newGun);
      this.playerRig.gunMesh = newGun;
      this.playerRig.muzzleAnchor = newGun.getObjectByName('muzzleAnchor') || newGun;
    }
  }

  public useMedkit() {
    if (this.medkits <= 0) return;
    if (this.playerHp >= this.maxHp) return;

    this.medkits -= 1;
    this.playerHp = applyHealing(this.playerHp, 50, this.maxHp);
    soundFx.playMedkitUse();
    this.callbacks.onHpChange(this.playerHp, this.maxHp);
    this.callbacks.onMedkitsChange(this.medkits);
  }

  public useShieldPotion() {
    if (this.shieldPotions <= 0) return;
    if (this.shield >= this.maxShield) return;

    this.shieldPotions -= 1;
    this.shield = applyShieldPotion(this.shield, 25, this.maxShield);
    soundFx.playLootPickup();
    this.callbacks.onShieldChange(this.shield, this.maxShield, this.shieldPotions);
  }

  // Mobile Controls API
  public setVirtualMovement(x: number, z: number) {
    this.virtualMoveX = x;
    this.virtualMoveZ = z;
  }

  public setAimDelta(dx: number, dy: number) {
    const sensitivity = 0.0038;
    this.playerYaw -= dx * sensitivity;
    this.playerPitch -= dy * sensitivity;
    this.playerPitch = Math.max(-0.65, Math.min(0.85, this.playerPitch));
  }

  public triggerJump() {
    if (this.isGrounded) {
      this.playerVelocity.y = 9.2;
      this.isGrounded = false;
      soundFx.playJumpSound();
    }
  }

  public toggleCrouch() {
    this.isCrouched = !this.isCrouched;
  }

  public toggleScope() {
    this.isScoped = !this.isScoped;
    this.camera.fov = this.isScoped ? 28 : 65;
    this.camera.updateProjectionMatrix();
  }

  public triggerShootStart() {
    this.isMouseDown = true;
    this.tryShoot();
  }

  public triggerShootEnd() {
    this.isMouseDown = false;
  }

  public triggerReload() {
    const weapon = this.inventory[this.activeWeaponIndex];
    if (weapon) this.reloadWeapon(weapon);
  }

  public setAutoSprint(sprint: boolean) {
    this.isAutoSprinting = sprint;
  }

  public ejectFromPlane() {
    if (this.flightStage === 'plane') {
      this.flightStage = 'skydive';
      this.callbacks.onFlightStageChange('skydive', this.playerPos.y);
      soundFx.playZoneAlarm();
    }
  }

  public deployParachute() {
    if (this.flightStage === 'skydive') {
      this.flightStage = 'parachute';
      this.playerRig.group.add(this.parachuteMesh);
      this.callbacks.onFlightStageChange('parachute', this.playerPos.y);
      soundFx.playLootPickup();
    }
  }

  private createCargoPlane(): THREE.Group {
    const group = new THREE.Group();
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Military slate
      roughness: 0.4,
      metalness: 0.8,
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.7,
    });
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Fuselage
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.8, 16, 12), planeMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Nose cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(2.0, 4.0, 12), planeMat);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -10.0;
    group.add(nose);

    // Wings
    const wings = new THREE.Mesh(new THREE.BoxGeometry(26, 0.35, 4.0), wingMat);
    wings.position.set(0, 0.4, -2.0);
    group.add(wings);

    // Jet Turbines
    [-6.5, 6.5].forEach((tx) => {
      const turbine = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3.2, 10), planeMat);
      turbine.rotation.x = Math.PI / 2;
      turbine.position.set(tx, -0.6, -1.8);
      group.add(turbine);
    });

    // Vertical Tail Fin
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.2, 3.2), wingMat);
    tail.position.set(0, 2.5, 7.0);
    group.add(tail);

    // Red wing tips
    [-13, 13].forEach((wx) => {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 3.8), stripeMat);
      tip.position.set(wx, 0.4, -2.0);
      group.add(tip);
    });

    return group;
  }

  private createParachute(): THREE.Group {
    const group = new THREE.Group();
    const chuteMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // High-vis military orange
      roughness: 0.8,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
      side: THREE.DoubleSide,
      flatShading: true,
    });

    // Parachute canopy dome
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      chuteMat
    );
    canopy.position.y = 3.6;
    group.add(canopy);

    // White stripes
    const stripe = new THREE.Mesh(
      new THREE.SphereGeometry(3.82, 12, 8, 0, Math.PI * 0.4, 0, Math.PI / 2),
      stripeMat
    );
    stripe.position.y = 3.6;
    group.add(stripe);

    // Rigging cords
    const cordMat = new THREE.LineBasicMaterial({ color: 0x1e293b });
    for (let c = 0; c < 6; c++) {
      const angle = (c / 6) * Math.PI * 2;
      const topPt = new THREE.Vector3(Math.cos(angle) * 3.6, 3.6, Math.sin(angle) * 3.6);
      const btmPt = new THREE.Vector3(0, 0.4, 0);
      const geo = new THREE.BufferGeometry().setFromPoints([topPt, btmPt]);
      const line = new THREE.Line(geo, cordMat);
      group.add(line);
    }

    return group;
  }

  public triggerActiveSkill() {
    if (this.skillCooldownRemaining > 0) return;
    this.isSkillActive = true;
    this.skillCooldownRemaining = 25;
    this.playerHp = Math.min(this.maxHp, this.playerHp + 20);
    this.shield = Math.min(this.maxShield, this.shield + 20);
    soundFx.playVictoryFanfare();
    this.callbacks.onHpChange(this.playerHp, this.maxHp);
    this.callbacks.onShieldChange(this.shield, this.maxShield, this.shieldPotions);
    setTimeout(() => {
      this.isSkillActive = false;
    }, 6000);
  }

  private createDamageSprite(damage: number, isHeadshot: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isHeadshot) {
        ctx.font = 'bold 50px Impact, sans-serif';
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeText(`💥 ${damage}`, 128, 64);
        ctx.fillText(`💥 ${damage}`, 128, 64);
      } else {
        ctx.font = 'bold 46px Impact, sans-serif';
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 7;
        ctx.strokeText(`${damage}`, 128, 64);
        ctx.fillText(`${damage}`, 128, 64);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(isHeadshot ? 2.6 : 1.9, isHeadshot ? 1.3 : 0.95, 1);
    return sprite;
  }

  public spawnDamagePopup(pos: THREE.Vector3, damage: number, isHeadshot: boolean) {
    const sprite = this.createDamageSprite(damage, isHeadshot);
    sprite.position.copy(pos);
    sprite.position.y += 1.8;
    this.scene.add(sprite);
    this.damagePopups.push({
      sprite,
      birthTime: performance.now(),
      lifespan: 750,
      initialY: sprite.position.y,
    });
  }

  private tryShoot() {
    const weapon = this.inventory[this.activeWeaponIndex];
    if (!weapon) return;

    const now = performance.now();
    if (now - this.lastShotTime < weapon.fireRateMs) return;
    if (weapon.currentAmmo <= 0) {
      // Auto reload if reserves available
      this.reloadWeapon(weapon);
      return;
    }

    this.lastShotTime = now;
    weapon.currentAmmo -= 1;
    this.shotsFired += 1;
    this.callbacks.onAmmoChange(weapon.currentAmmo, weapon.maxClip, weapon.reserveAmmo);

    // Audio
    if (weapon.id === 'shotgun') soundFx.playShotgunShot();
    else if (weapon.id === 'rifle') soundFx.playRifleShot();
    else if (weapon.id === 'sniper') soundFx.playSniperShot();
    else soundFx.playPistolShot();

    // Muzzle flash
    const muzzleWorldPos = new THREE.Vector3();
    this.playerRig.muzzleAnchor.getWorldPosition(muzzleWorldPos);

    // Forward ray direction from camera center
    const rayDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    // Handle Shotgun multi-pellets vs single projectile
    const pellets = weapon.pellets || 1;
    let hitAny = false;

    for (let p = 0; p < pellets; p++) {
      const spreadDir = rayDir.clone();
      if (weapon.spread > 0) {
        spreadDir.x += (Math.random() - 0.5) * weapon.spread;
        spreadDir.y += (Math.random() - 0.5) * weapon.spread;
        spreadDir.z += (Math.random() - 0.5) * weapon.spread;
        spreadDir.normalize();
      }

      // Spawn visual bullet tracer line
      this.spawnTracer(muzzleWorldPos, spreadDir, weapon.range, weapon.color);

      // Perform Raycast against bots and obstacles
      const raycaster = new THREE.Raycaster(this.camera.position, spreadDir, 0.5, weapon.range);
      const hit = this.performShootingRaycast(raycaster);

      if (hit.botId) {
        hitAny = true;
        this.shotsHit += 1;
        let damage = calculateWeaponDamage(weapon.damage, hit.distance, weapon.range);
        if (hit.isHeadshot) {
          damage = Math.round(damage * 2.2);
        }
        const finalDamage = this.userProfile.oneShotKill ? 999 : damage;
        this.damageDealt += finalDamage;

        // Spawn Free Fire 3D floating damage popup!
        if (hit.hitPoint) {
          this.spawnDamagePopup(hit.hitPoint, finalDamage, hit.isHeadshot);
        }

        const result = this.botManager.damageBot(hit.botId, finalDamage, true);
        soundFx.playHitSound();
        this.callbacks.onHitmarker();

        if (result.dead && result.bot) {
          this.kills += 1;
          this.callbacks.onKillsChange(this.kills);
          soundFx.playEliminationSound();
          this.spawnDropLoot(result.bot.x, result.bot.z, result.bot.lootDropType);
          this.updateAliveCount();
        }
      }
    }
  }

  private reloadWeapon(weapon: WeaponStats) {
    if (weapon.reserveAmmo <= 0 || weapon.currentAmmo >= weapon.maxClip) return;
    const needed = weapon.maxClip - weapon.currentAmmo;
    const take = Math.min(needed, weapon.reserveAmmo);
    weapon.currentAmmo += take;
    weapon.reserveAmmo -= take;
    this.callbacks.onAmmoChange(weapon.currentAmmo, weapon.maxClip, weapon.reserveAmmo);
  }

  private performShootingRaycast(raycaster: THREE.Raycaster): {
    botId: string | null;
    distance: number;
    hitPoint: THREE.Vector3 | null;
    isHeadshot: boolean;
  } {
    let closestBotId: string | null = null;
    let closestDist = Infinity;
    let hitPoint: THREE.Vector3 | null = null;
    let isHeadshot = false;

    // Check against bots
    this.botManager.bots.forEach((bot) => {
      if (!bot.alive) return;
      const rig = this.botManager.botRigs.get(bot.id);
      if (!rig) return;

      const intersects = raycaster.intersectObjects(rig.group.children, true);
      if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.distance < closestDist) {
          closestDist = hit.distance;
          closestBotId = bot.id;
          hitPoint = hit.point.clone();
          isHeadshot = hit.point.y > (bot.y + 1.55);
        }
      }
    });

    return { botId: closestBotId, distance: closestDist, hitPoint, isHeadshot };
  }

  private spawnTracer(start: THREE.Vector3, dir: THREE.Vector3, maxDist: number, colorHex: string) {
    const end = start.clone().add(dir.clone().multiplyScalar(Math.min(maxDist, 45)));
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(colorHex),
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracerLines.push({ line, expireAt: performance.now() + 85 });
  }

  private spawnDropLoot(x: number, z: number, type: LootType) {
    const crate: LootCrate = {
      id: `loot_${Date.now()}_${Math.random()}`,
      x,
      z,
      type,
      collected: false,
    };
    const mesh = createLootCrateMesh(crate);
    this.scene.add(mesh);
    crate.meshGroup = mesh;
    this.worldData.lootCrates.push(crate);
  }

  private collectLootCrate(crate: LootCrate) {
    if (crate.collected) return;
    crate.collected = true;

    if (crate.meshGroup) {
      this.scene.remove(crate.meshGroup);
      this.worldData.islandGroup.remove(crate.meshGroup);
    }

    soundFx.playLootPickup();

    if (crate.type === 'medkit') {
      this.medkits += 2;
      this.callbacks.onMedkitsChange(this.medkits);
    } else if (crate.type === 'shield_potion') {
      this.shieldPotions += 2;
      this.callbacks.onShieldChange(this.shield, this.maxShield, this.shieldPotions);
    } else {
      // Weapon crate: Add to inventory or refill ammo
      const weaponPreset = WEAPON_PRESETS[crate.type as WeaponType];
      if (weaponPreset) {
        const existingIdx = this.inventory.findIndex((w) => w.id === weaponPreset.id);
        if (existingIdx >= 0) {
          this.inventory[existingIdx].reserveAmmo += weaponPreset.maxClip * 2;
          if (existingIdx === this.activeWeaponIndex) {
            this.callbacks.onAmmoChange(
              this.inventory[existingIdx].currentAmmo,
              this.inventory[existingIdx].maxClip,
              this.inventory[existingIdx].reserveAmmo
            );
          }
        } else {
          this.inventory.push({ ...weaponPreset });
          this.switchWeapon(this.inventory.length - 1);
        }
      }
    }

    this.nearbyCrate = null;
    this.callbacks.onPickupPrompt(null);
  }

  private updateAliveCount() {
    const aliveBots = this.botManager.bots.filter((b) => b.alive).length;
    const totalAlive = (this.playerHp > 0 ? 1 : 0) + aliveBots;
    this.aliveCount = totalAlive;
    this.callbacks.onAliveChange(totalAlive);

    const state = evaluateGameState(this.playerHp, totalAlive);
    if (state === 'victory') {
      soundFx.playVictoryFanfare();
      this.callbacks.onGameStateChange('victory');
    } else if (state === 'gameover') {
      soundFx.playDefeatSound();
      this.callbacks.onGameStateChange('gameover');
    }
  }

  // Main Simulation Step
  private tick() {
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const time = this.clock.getElapsedTime();

    this.timeAlive += dt;

    // A. Handle Cargo Airplane Flight Stage
    if (this.flightStage === 'plane') {
      this.planeTime += dt;
      const speed = 24;
      this.planeMesh.position.x += speed * dt * 0.707;
      this.planeMesh.position.z += speed * dt * 0.707;
      this.playerPos.set(this.planeMesh.position.x, 134, this.planeMesh.position.z);
      this.playerRig.group.position.copy(this.playerPos);

      // Camera positioned behind cargo plane looking down over Bermuda
      this.camera.position.set(
        this.planeMesh.position.x - 14,
        this.planeMesh.position.y + 6,
        this.planeMesh.position.z - 14
      );
      this.camera.lookAt(
        this.planeMesh.position.x + 8,
        this.planeMesh.position.y - 4,
        this.planeMesh.position.z + 8
      );

      this.callbacks.onFlightStageChange('plane', 135);

      if (this.planeTime > 7.0) {
        this.ejectFromPlane();
      }
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // B. Handle Skydive Free-Fall Stage
    if (this.flightStage === 'skydive') {
      this.playerVelocity.y = -19; // fast free-fall speed
      this.playerPos.y += this.playerVelocity.y * dt;

      // Freefall steering
      const joyX = this.virtualMoveX;
      const joyZ = this.virtualMoveZ;
      this.playerPos.x += joyX * 9 * dt;
      this.playerPos.z += -joyZ * 9 * dt;

      this.playerRig.group.position.copy(this.playerPos);
      this.camera.position.set(this.playerPos.x, this.playerPos.y + 3.8, this.playerPos.z + 5.5);
      this.camera.lookAt(this.playerPos.x, this.playerPos.y, this.playerPos.z);

      this.callbacks.onFlightStageChange('skydive', Math.max(0, this.playerPos.y));

      if (this.playerPos.y < 35) {
        this.deployParachute();
      }
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // C. Handle Parachute Glide Stage
    if (this.flightStage === 'parachute') {
      this.playerVelocity.y = -5.0; // gentle glide descent
      this.playerPos.y += this.playerVelocity.y * dt;

      // Glide steering
      const joyX = this.virtualMoveX;
      const joyZ = this.virtualMoveZ;
      this.playerPos.x += joyX * 9 * dt;
      this.playerPos.z += -joyZ * 9 * dt;

      this.playerRig.group.position.copy(this.playerPos);
      this.camera.position.set(this.playerPos.x, this.playerPos.y + 4.5, this.playerPos.z + 6.0);
      this.camera.lookAt(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z);

      this.callbacks.onFlightStageChange('parachute', Math.max(0, this.playerPos.y));

      if (this.playerPos.y <= 0) {
        this.playerPos.y = 0;
        this.playerVelocity.set(0, 0, 0);
        this.flightStage = 'ground';
        this.isGrounded = true;
        this.playerRig.group.remove(this.parachuteMesh);
        soundFx.playLootPickup();
        this.callbacks.onFlightStageChange('ground', 0);
      }
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 1. Automatic Gunfire when holding Mouse Button
    if (this.isMouseDown) {
      this.tryShoot();
    }

    // 2. Player Movement relative to Camera Yaw (Keyboard + Mobile Virtual Joystick)
    let joyX = this.virtualMoveX;
    let joyZ = this.virtualMoveZ;
    if (this.isAutoSprinting && Math.hypot(joyX, joyZ) < 0.1) {
      joyZ = -1.0; // Auto-sprint forward
    }

    const isSprint = this.keysHeld.has('ShiftLeft') || this.isAutoSprinting || Math.hypot(joyX, joyZ) > 0.8;
    const baseSpeed = this.isCrouched ? 3.6 : isSprint ? 9.8 : 6.8;
    const speedMult = (this.userProfile.speedMultiplier || 1.0) * (this.isSkillActive ? 1.25 : 1.0);
    const moveSpeed = baseSpeed * speedMult;

    const forward = new THREE.Vector3(-Math.sin(this.playerYaw), 0, -Math.cos(this.playerYaw));
    const right = new THREE.Vector3(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw));

    const moveDir = new THREE.Vector3();
    if (this.keysHeld.has('KeyW')) moveDir.add(forward);
    if (this.keysHeld.has('KeyS')) moveDir.sub(forward);
    if (this.keysHeld.has('KeyD')) moveDir.add(right);
    if (this.keysHeld.has('KeyA')) moveDir.sub(right);

    // Apply mobile virtual joystick
    if (Math.hypot(joyX, joyZ) > 0.05) {
      moveDir.add(right.clone().multiplyScalar(joyX));
      moveDir.add(forward.clone().multiplyScalar(-joyZ));
    }

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      this.playerPos.x += moveDir.x * moveSpeed * dt;
      this.playerPos.z += moveDir.z * moveSpeed * dt;
    }

    // Gravity & Ground Check
    this.playerVelocity.y -= 22 * dt;
    this.playerPos.y += this.playerVelocity.y * dt;
    if (this.playerPos.y <= 0) {
      this.playerPos.y = 0;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Island boundary clamp (keep on island or plunge into water)
    const distFromIslandCenter = Math.hypot(this.playerPos.x, this.playerPos.z);
    if (distFromIslandCenter > 70) {
      const pull = 70 / distFromIslandCenter;
      this.playerPos.x *= pull;
      this.playerPos.z *= pull;
    }

    // Obstacle Collisions (Boxes & Rocks)
    this.worldData.obstacles.forEach((box) => {
      const padding = 0.8;
      if (
        this.playerPos.x >= box.minX - padding &&
        this.playerPos.x <= box.maxX + padding &&
        this.playerPos.z >= box.minZ - padding &&
        this.playerPos.z <= box.maxZ + padding
      ) {
        // Push out on shallowest penetration axis
        const dx1 = Math.abs(this.playerPos.x - (box.minX - padding));
        const dx2 = Math.abs(this.playerPos.x - (box.maxX + padding));
        const dz1 = Math.abs(this.playerPos.z - (box.minZ - padding));
        const dz2 = Math.abs(this.playerPos.z - (box.maxZ + padding));
        const minVal = Math.min(dx1, dx2, dz1, dz2);

        if (minVal === dx1) this.playerPos.x = box.minX - padding;
        else if (minVal === dx2) this.playerPos.x = box.maxX + padding;
        else if (minVal === dz1) this.playerPos.z = box.minZ - padding;
        else if (minVal === dz2) this.playerPos.z = box.maxZ + padding;
      }
    });

    // Update Player Rig
    this.playerRig.group.position.copy(this.playerPos);
    this.playerRig.group.rotation.y = this.playerYaw;
    const currentSpeed = moveDir.lengthSq() > 0 ? moveSpeed : 0;
    animateCharacterGait(this.playerRig, currentSpeed, time);

    // 3. Smooth Third-Person Camera Follow (Adaptive for Scope and Crouch)
    const cameraDist = this.isScoped ? 1.6 : 4.2;
    const cameraHeight = this.isCrouched ? 1.35 : 1.95;
    const targetCamX = this.playerPos.x + Math.sin(this.playerYaw) * Math.cos(this.playerPitch) * cameraDist;
    const targetCamY = this.playerPos.y + cameraHeight + Math.sin(this.playerPitch) * cameraDist;
    const targetCamZ = this.playerPos.z + Math.cos(this.playerYaw) * Math.cos(this.playerPitch) * cameraDist;

    this.camera.position.set(targetCamX, targetCamY, targetCamZ);
    const lookTarget = new THREE.Vector3(
      this.playerPos.x - Math.sin(this.playerYaw) * 10,
      this.playerPos.y + (this.isCrouched ? 0.9 : 1.4) + Math.sin(-this.playerPitch) * 10,
      this.playerPos.z - Math.cos(this.playerYaw) * 10
    );
    this.camera.lookAt(lookTarget);

    // 4. Shrinking Safe Zone Logic
    this.updateSafeZone(dt);

    // 5. Update Bots
    this.botManager.update(
      dt,
      time,
      this.playerPos,
      this.safeZoneState.current,
      (damage) => {
        if (!this.userProfile.godMode && this.timeAlive > 4.0) {
          const result = applyDamageToShieldAndHp(this.shield, this.playerHp, damage);
          this.shield = result.newShield;
          this.playerHp = result.newHp;
          triggerHitFlash(this.playerRig);
          soundFx.playPlayerHurt();
          this.callbacks.onHpChange(this.playerHp, this.maxHp);
          this.callbacks.onShieldChange(this.shield, this.maxShield, this.shieldPotions);
          if (this.playerHp <= 0) {
            this.playerHp = 0;
            this.updateAliveCount();
          }
        }
      },
      (bot) => {
        this.spawnDropLoot(bot.x, bot.z, bot.lootDropType);
        this.updateAliveCount();
      },
      (pos, dir) => {
        this.spawnTracer(pos, dir, 35, '#ef4444');
      }
    );

    // 6. Check Proximity to Loot Crates
    this.checkNearbyLootCrates();

    // 7. Cleanup Bullet Tracers
    const now = performance.now();
    for (let i = this.tracerLines.length - 1; i >= 0; i--) {
      if (now > this.tracerLines[i].expireAt) {
        this.scene.remove(this.tracerLines[i].line);
        this.tracerLines[i].line.geometry.dispose();
        this.tracerLines.splice(i, 1);
      }
    }

    // 8. Rotating hologram icons on loot crates
    this.worldData.lootCrates.forEach((crate) => {
      if (!crate.collected && crate.meshGroup) {
        const holo = crate.meshGroup.getObjectByName('holoIcon');
        if (holo) {
          holo.rotation.y = time * 2;
          holo.position.y = 1.7 + Math.sin(time * 3 + crate.x) * 0.12;
        }
      }
    });

    // Update Free Fire 3D Floating Damage Numbers
    const nowMs = performance.now();
    for (let i = this.damagePopups.length - 1; i >= 0; i--) {
      const popup = this.damagePopups[i];
      const elapsed = nowMs - popup.birthTime;
      if (elapsed > popup.lifespan) {
        this.scene.remove(popup.sprite);
        popup.sprite.material.map?.dispose();
        popup.sprite.material.dispose();
        this.damagePopups.splice(i, 1);
      } else {
        const progress = elapsed / popup.lifespan;
        popup.sprite.position.y = popup.initialY + progress * 1.8;
        (popup.sprite.material as THREE.SpriteMaterial).opacity = 1 - progress * 0.95;
      }
    }

    // Airdrop Smoke Flare Wave Animation
    if (this.worldData.smokeFlareGroup) {
      this.worldData.smokeFlareGroup.rotation.y = time * 0.4;
      this.worldData.smokeFlareGroup.children.forEach((child, idx) => {
        child.position.x = Math.sin(time * 2 + idx) * 0.35;
        child.position.z = Math.cos(time * 2 + idx) * 0.35;
      });
    }

    // Active skill cooldown tick
    if (this.skillCooldownRemaining > 0) {
      this.skillCooldownRemaining = Math.max(0, this.skillCooldownRemaining - dt);
    }

    // 9. Minimap Update (Throttled)
    if (Math.floor(time * 10) % 2 === 0) {
      this.callbacks.onMinimapUpdate({
        playerPos: { x: this.playerPos.x, z: this.playerPos.z, angle: this.playerYaw },
        safeZone: this.safeZoneState.current,
        nextSafeZone: this.safeZoneState.target,
        bots: this.botManager.bots.filter((b) => b.alive).map((b) => ({ x: b.x, z: b.z })),
        crates: this.worldData.lootCrates.map((c) => ({ x: c.x, z: c.z, collected: c.collected })),
      });
    }

    // 10. Render
    this.renderer.render(this.scene, this.camera);
  }

  private updateSafeZone(dt: number) {
    const s = this.safeZoneState;

    if (!s.isShrinking) {
      s.phaseTimeRemaining -= dt;
      if (s.phaseTimeRemaining <= 0) {
        // Start shrinking phase
        s.isShrinking = true;
        s.shrinkElapsed = 0;
        soundFx.playZoneAlarm();
      }
    } else {
      // In shrinking transition
      s.shrinkElapsed += dt;
      const progress = s.shrinkElapsed / s.shrinkDuration;
      s.current = interpolateZone(s.current, s.target, progress);

      if (progress >= 1) {
        // Shrink complete, prep next phase
        s.isShrinking = false;
        s.phase += 1;
        s.phaseTimeRemaining = 25; // 25s until next shrink

        const nextRadii = [45, 26, 14, 6];
        const nextRadius = nextRadii[Math.min(s.phase - 1, nextRadii.length - 1)];
        s.target = generateNextZoneCenter(s.current, nextRadius);
      }
    }

    // Update 3D Safe Zone Cylinder Mesh & Floor Ring
    if (this.worldData.zoneMesh && this.worldData.zoneRingMesh) {
      const radius = s.current.radius;
      this.worldData.zoneMesh.position.set(s.current.x, 20, s.current.z);
      this.worldData.zoneMesh.scale.set(radius / 65, 1, radius / 65);

      this.worldData.zoneRingMesh.position.set(s.current.x, 0.08, s.current.z);
      this.worldData.zoneRingMesh.scale.set(radius / 65, radius / 65, 1);
    }

    // Zone Damage for Player
    const inZone = isInsideZone(this.playerPos.x, this.playerPos.z, s.current);
    this.callbacks.onOutsideZoneChange(!inZone);

    if (!inZone && !this.userProfile.godMode) {
      this.playerHp -= dt * s.damagePerSec;
      this.callbacks.onHpChange(this.playerHp, this.maxHp);
      if (this.playerHp <= 0) {
        this.playerHp = 0;
        this.updateAliveCount();
      }
    }

    this.callbacks.onZoneTimerChange(
      Math.max(0, Math.ceil(s.isShrinking ? s.shrinkDuration - s.shrinkElapsed : s.phaseTimeRemaining)),
      s.phase,
      s.isShrinking
    );
  }

  private checkNearbyLootCrates() {
    let closestCrate: LootCrate | null = null;
    let closestDist = 3.2;

    this.worldData.lootCrates.forEach((crate) => {
      if (crate.collected) return;
      const dist = Math.hypot(this.playerPos.x - crate.x, this.playerPos.z - crate.z);
      if (dist < closestDist) {
        closestDist = dist;
        closestCrate = crate;
      }
    });

    this.nearbyCrate = closestCrate;
    if (closestCrate) {
      const c = closestCrate as LootCrate;
      const name = c.type === 'medkit' ? 'Medkit (+50 HP)' : WEAPON_PRESETS[c.type as WeaponType]?.name || c.type;
      this.callbacks.onPickupPrompt(`[E] LOOT ${name.toUpperCase()}`);
    } else {
      this.callbacks.onPickupPrompt(null);
    }
  }

  private startLoop() {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const animate = () => {
      this.tick();
      if (this.isSoftwareGl) {
        afterDraw(animate);
      } else {
        this.frameId = requestAnimationFrame(animate);
      }
    };

    if (this.isSoftwareGl) {
      afterDraw(animate);
    } else {
      this.frameId = requestAnimationFrame(animate);
    }
  }

  public updateProfileSettings(profile: UserProfile) {
    this.userProfile = profile;
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    soundFx.stopIslandAmbience();

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);

    if (this.botManager) this.botManager.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
