import * as THREE from 'three';
import { WeaponType } from './types.ts';

export interface CharacterRig {
  group: THREE.Group;
  head: THREE.Mesh;
  visor: THREE.Mesh;
  body: THREE.Mesh;
  armorVest: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  backpack: THREE.Group;
  gunMesh: THREE.Group;
  muzzleAnchor: THREE.Object3D;
  shadowDisc: THREE.Mesh;
  baseColor: number;
  bundleId?: string;
}

/**
 * Creates an authentic Free Fire 3D weapon model
 */
export function createWeaponMesh(weaponType: WeaponType): THREE.Group {
  const gunGroup = new THREE.Group();

  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.85,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.25,
    metalness: 0.95,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x3b1c09,
    roughness: 0.8,
  });

  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.9,
    emissive: 0xd97706,
    emissiveIntensity: 0.3,
  });

  const scopeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
  });

  if (weaponType === 'rifle') {
    // AK47 / SCAR Assault Rifle
    // Receiver & Upper housing
    const rec = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.75), gunMetalMat);
    gunGroup.add(rec);

    // Barrel & Gas Tube
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.65, 8), chromeMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, -0.65);
    gunGroup.add(barrel);

    // Gas tube upper
    const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), gunMetalMat);
    gasTube.rotation.x = Math.PI / 2;
    gasTube.position.set(0, 0.09, -0.55);
    gunGroup.add(gasTube);

    // Muzzle flash hider
    const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.04, 0.12, 8), gunMetalMat);
    flashHider.rotation.x = Math.PI / 2;
    flashHider.position.set(0, 0.04, -1.0);
    gunGroup.add(flashHider);

    // Curved Banana Magazine (AK style)
    const magGroup = new THREE.Group();
    const mag1 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.16), goldAccentMat);
    magGroup.add(mag1);
    const mag2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.14), gunMetalMat);
    mag2.position.set(0, -0.16, 0.04);
    mag2.rotation.x = 0.25;
    magGroup.add(mag2);
    magGroup.position.set(0, -0.18, -0.1);
    gunGroup.add(magGroup);

    // Wooden / Tactical Handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 0.38), gripMat);
    handguard.position.set(0, 0.02, -0.45);
    gunGroup.add(handguard);

    // Rear Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.42), gripMat);
    stock.position.set(0, -0.04, 0.52);
    gunGroup.add(stock);

    // Iron sights
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.04), gunMetalMat);
    frontSight.position.set(0, 0.11, -0.9);
    gunGroup.add(frontSight);

    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.08), gunMetalMat);
    rearSight.position.set(0, 0.14, 0.15);
    gunGroup.add(rearSight);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.12), gripMat);
    grip.position.set(0, -0.18, 0.18);
    grip.rotation.x = 0.25;
    gunGroup.add(grip);
  } else if (weaponType === 'shotgun') {
    // M1014 Combat Shotgun
    const rec = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.62), gunMetalMat);
    gunGroup.add(rec);

    // Heavy Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.72, 8), chromeMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, -0.6);
    gunGroup.add(barrel);

    // Magazine tube underneath
    const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.65, 8), gunMetalMat);
    magTube.rotation.x = Math.PI / 2;
    magTube.position.set(0, -0.04, -0.58);
    gunGroup.add(magTube);

    // Pump slide with tactical grip ridges
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.25), gripMat);
    pump.position.set(0, -0.04, -0.52);
    gunGroup.add(pump);

    // Side shell carrier with red shells
    const shellCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.28), gunMetalMat);
    shellCarrier.position.set(0.1, 0.04, 0.02);
    gunGroup.add(shellCarrier);

    const shellMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    for (let s = 0; s < 3; s++) {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 6), shellMat);
      shell.rotation.x = Math.PI / 2;
      shell.position.set(0.13, 0.02, -0.08 + s * 0.08);
      gunGroup.add(shell);
    }

    // Heavy tactical stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.2, 0.44), gripMat);
    stock.position.set(0, -0.05, 0.48);
    gunGroup.add(stock);

    // Pistol grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.14), gripMat);
    grip.position.set(0, -0.18, 0.15);
    grip.rotation.x = 0.22;
    gunGroup.add(grip);
  } else if (weaponType === 'sniper') {
    // AWM-50 Sniper Rifle
    const rec = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.88), gunMetalMat);
    gunGroup.add(rec);

    // Long fluted barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 8), chromeMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.05, -0.95);
    gunGroup.add(barrel);

    // Heavy Muzzle Brake
    const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.16), goldAccentMat);
    muzzleBrake.position.set(0, 0.05, -1.55);
    gunGroup.add(muzzleBrake);

    // Large High-Magnification Scope with Dual Turrets & Sunshade
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.52, 10), gunMetalMat);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.22, -0.15);
    gunGroup.add(scopeTube);

    // Scope front bell
    const scopeBell = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.16, 10), gunMetalMat);
    scopeBell.rotation.x = Math.PI / 2;
    scopeBell.position.set(0, 0.22, -0.46);
    gunGroup.add(scopeBell);

    // Scope front lens with optical cyan reflection
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), scopeGlassMat);
    lens.position.set(0, 0.22, -0.54);
    lens.rotation.y = Math.PI;
    gunGroup.add(lens);

    // Scope mounts
    const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), gunMetalMat);
    mount1.position.set(0, 0.14, -0.25);
    gunGroup.add(mount1);

    const mount2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), gunMetalMat);
    mount2.position.set(0, 0.14, -0.02);
    gunGroup.add(mount2);

    // Bolt handle
    const boltKnob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), chromeMat);
    boltKnob.position.set(0.12, 0.12, 0.1);
    gunGroup.add(boltKnob);

    // Folded Bipod under barrel
    const bipod = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.05), gunMetalMat);
    bipod.position.set(0, -0.09, -0.7);
    bipod.rotation.x = -0.5;
    gunGroup.add(bipod);

    // Precision Sniper Stock with Cheek Rest
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.48), gripMat);
    stock.position.set(0, -0.04, 0.65);
    gunGroup.add(stock);

    const cheekRest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.22), gunMetalMat);
    cheekRest.position.set(0, 0.1, 0.58);
    gunGroup.add(cheekRest);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.13), gripMat);
    grip.position.set(0, -0.18, 0.2);
    grip.rotation.x = 0.25;
    gunGroup.add(grip);
  } else {
    // Tactical Desert Eagle Pistol
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.44), chromeMat);
    slide.position.set(0, 0.06, -0.12);
    gunGroup.add(slide);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.36), gunMetalMat);
    frame.position.set(0, -0.02, -0.1);
    gunGroup.add(frame);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.26, 0.15), gripMat);
    grip.position.set(0, -0.14, 0.02);
    grip.rotation.x = 0.22;
    gunGroup.add(grip);

    // Trigger guard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.12), gunMetalMat);
    guard.position.set(0, -0.08, -0.08);
    gunGroup.add(guard);
  }

  // Muzzle anchor point for bullet spawn and flash
  const muzzleAnchor = new THREE.Object3D();
  muzzleAnchor.name = 'muzzleAnchor';
  muzzleAnchor.position.set(0, 0.04, weaponType === 'sniper' ? -1.65 : weaponType === 'shotgun' ? -1.0 : -1.08);
  gunGroup.add(muzzleAnchor);

  gunGroup.scale.set(1.15, 1.15, 1.15);
  return gunGroup;
}

/**
 * Creates an authentic Free Fire composite humanoid character with custom bundle styling
 */
export function createCharacter(
  colorHex: number,
  weaponType: WeaponType = 'rifle',
  bundleId?: string
): CharacterRig {
  const group = new THREE.Group();

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf5d0b5, // Warm skin tone
    roughness: 0.7,
    flatShading: true,
  });

  const suitMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.55,
    metalness: 0.2,
    flatShading: true,
  });

  const blackTacticalMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.65,
    metalness: 0.35,
    flatShading: true,
  });

  const armorKevlarMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.7,
    metalness: 0.4,
    flatShading: true,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.25,
    emissive: 0xd97706,
    emissiveIntensity: 0.3,
  });

  const neonVisorMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.9,
  });

  // 1. Torso / Combat Body
  const bodyGeo = new THREE.BoxGeometry(0.72, 0.82, 0.44);
  const body = new THREE.Mesh(bodyGeo, suitMat);
  body.position.y = 1.25;
  body.castShadow = true;
  group.add(body);

  // 2. Free Fire Level 3 Kevlar Armor Vest with Molle Webbing & Pouches
  const vestGeo = new THREE.BoxGeometry(0.8, 0.68, 0.52);
  const armorVest = new THREE.Mesh(vestGeo, armorKevlarMat);
  armorVest.position.y = 1.32;
  armorVest.castShadow = true;
  group.add(armorVest);

  // Vest Shoulder Armor Guards
  const leftShoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.34), armorKevlarMat);
  leftShoulderPad.position.set(-0.46, 1.62, 0);
  leftShoulderPad.rotation.z = -0.2;
  group.add(leftShoulderPad);

  const rightShoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.34), armorKevlarMat);
  rightShoulderPad.position.set(0.46, 1.62, 0);
  rightShoulderPad.rotation.z = 0.2;
  group.add(rightShoulderPad);

  // 3 Ammo Magazine Pouches across chest
  for (let p = 0; p < 3; p++) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.1), blackTacticalMat);
    pouch.position.set(-0.22 + p * 0.22, 1.25, 0.28);
    group.add(pouch);
  }

  // Cross-body tactical belt
  const beltHarness = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.54), blackTacticalMat);
  beltHarness.position.y = 0.94;
  group.add(beltHarness);

  // Belt buckle
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.08), goldTrimMat);
  buckle.position.set(0, 0.94, 0.28);
  group.add(buckle);

  // 3. Head & Bundle Headgear (Red Criminal / Sakura / Hip Hop / Cobra / Standard)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.95, 0);

  // Base Head
  const headGeo = new THREE.BoxGeometry(0.46, 0.46, 0.46);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Visor / Mask / Headwear based on Bundle
  let visor: THREE.Mesh;

  const isCriminal = bundleId === 'bundle_red_criminal' || colorHex === 0xdc2626;
  const isSakura = bundleId === 'bundle_sakura' || colorHex === 0xf472b6;
  const isHipHop = bundleId === 'bundle_hip_hop' || colorHex === 0x8b5cf6;
  const isCobra = bundleId === 'bundle_cobra_rage' || colorHex === 0xef4444;
  const isGoldSamurai = bundleId === 'bundle_golden_samurai' || colorHex === 0xeab308;

  if (isCriminal) {
    // Red Criminal Hood & Iconic White Jester Mask
    const hoodGeo = new THREE.BoxGeometry(0.54, 0.54, 0.54);
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    headGroup.add(hood);

    // White Clown Mask Faceplate
    const maskMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.12), maskMat);
    mask.position.set(0, 0, -0.24);
    headGroup.add(mask);

    // Red Flame Eye Marks
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const leftFlame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.04), flameMat);
    leftFlame.position.set(-0.11, 0.04, -0.31);
    headGroup.add(leftFlame);

    const rightFlame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.04), flameMat);
    rightFlame.position.set(0.11, 0.04, -0.31);
    headGroup.add(rightFlame);

    // Sinister Clown Smile
    const smile = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.04), flameMat);
    smile.position.set(0, -0.12, -0.31);
    headGroup.add(smile);

    visor = mask;
  } else if (isSakura) {
    // Sakura Straw Samurai Kasa Hat & Demon Oni Mask
    const hatGeo = new THREE.ConeGeometry(0.56, 0.22, 16);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 0.32;
    headGroup.add(hat);

    // Demon Oni Half-mask
    const oniMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
    const oniMask = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.24, 0.14), oniMat);
    oniMask.position.set(0, -0.1, -0.2);
    headGroup.add(oniMask);

    // White fangs
    const fangMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const fangL = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 4), fangMat);
    fangL.position.set(-0.1, -0.16, -0.26);
    fangL.rotation.x = Math.PI;
    headGroup.add(fangL);

    const fangR = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 4), fangMat);
    fangR.position.set(0.1, -0.16, -0.26);
    fangR.rotation.x = Math.PI;
    headGroup.add(fangR);

    visor = oniMask;
  } else if (isHipHop) {
    // Backwards Snapback Cap & Golden Chain
    const capGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 12);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.6 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.24;
    headGroup.add(cap);

    // Brim pointing backward
    const brimGeo = new THREE.BoxGeometry(0.26, 0.04, 0.22);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 0.16, 0.26);
    headGroup.add(brim);

    // Dark Streetwear Sunglasses
    const shadeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1, metalness: 0.9 });
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.1), shadeMat);
    shades.position.set(0, 0.04, -0.23);
    headGroup.add(shades);

    // Chunky Gold Cuban Chain around collar
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 16), goldTrimMat);
    chain.position.set(0, -0.25, 0);
    chain.rotation.x = Math.PI / 2;
    headGroup.add(chain);

    visor = shades;
  } else if (isCobra) {
    // Cobra Rage Cyber Serpent Mask
    const cobraHelmGeo = new THREE.BoxGeometry(0.52, 0.52, 0.52);
    const cobraHelmMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.4,
      metalness: 0.8,
    });
    const cobraHelm = new THREE.Mesh(cobraHelmGeo, cobraHelmMat);
    headGroup.add(cobraHelm);

    // Glowing Neon Slit Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.08), eyeMat);
    eyeL.position.set(-0.11, 0.04, -0.26);
    eyeL.rotation.z = -0.3;
    headGroup.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.08), eyeMat);
    eyeR.position.set(0.11, 0.04, -0.26);
    eyeR.rotation.z = 0.3;
    headGroup.add(eyeR);

    // Cobra fangs
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), goldTrimMat);
    fang.position.set(0, -0.16, -0.26);
    fang.rotation.x = Math.PI;
    headGroup.add(fang);

    visor = cobraHelm;
  } else if (isGoldSamurai) {
    // Golden Samurai Kabuto with Horned Crest
    const kabuto = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.48, 0.52), goldTrimMat);
    headGroup.add(kabuto);

    // V-shaped Golden Crest Horns
    const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), goldTrimMat);
    hornL.position.set(-0.16, 0.32, -0.2);
    hornL.rotation.z = -0.4;
    headGroup.add(hornL);

    const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.06), goldTrimMat);
    hornR.position.set(0.16, 0.32, -0.2);
    hornR.rotation.z = 0.4;
    headGroup.add(hornR);

    visor = kabuto;
  } else {
    // Tactical Combat Helmet with NVG Mount & Visor
    const helmGeo = new THREE.CylinderGeometry(0.28, 0.27, 0.24, 12);
    const helmMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.3,
    });
    const helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 0.18;
    headGroup.add(helm);

    // Tactical Visor
    const visorGeo = new THREE.BoxGeometry(0.42, 0.14, 0.14);
    visor = new THREE.Mesh(visorGeo, neonVisorMat);
    visor.position.set(0, 0.02, -0.22);
    headGroup.add(visor);

    // Comms Headset with Mic
    const earpiece = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8), blackTacticalMat);
    earpiece.rotation.z = Math.PI / 2;
    earpiece.position.set(0.26, 0, 0);
    headGroup.add(earpiece);

    const boomMic = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), blackTacticalMat);
    boomMic.rotation.x = Math.PI / 3;
    boomMic.position.set(0.24, -0.1, -0.12);
    headGroup.add(boomMic);
  }

  group.add(headGroup);

  // 4. Free Fire Level 3 Tactical Backpack on Back
  const backpackGroup = new THREE.Group();
  backpackGroup.position.set(0, 1.35, 0.3);

  const packMain = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.64, 0.28), blackTacticalMat);
  packMain.castShadow = true;
  backpackGroup.add(packMain);

  // Rolled Bedroll on top of backpack
  const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.54, 8), suitMat);
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 0.38, 0);
  backpackGroup.add(bedroll);

  // Side pouches
  const sidePouchL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.18), armorKevlarMat);
  sidePouchL.position.set(-0.31, -0.05, 0);
  backpackGroup.add(sidePouchL);

  const sidePouchR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.18), armorKevlarMat);
  sidePouchR.position.set(0.31, -0.05, 0);
  backpackGroup.add(sidePouchR);

  // Radio Antenna with blinking red beacon
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 6), blackTacticalMat);
  antenna.position.set(0.22, 0.45, -0.08);
  backpackGroup.add(antenna);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  beacon.position.set(0.22, 0.78, -0.08);
  backpackGroup.add(beacon);

  group.add(backpackGroup);

  // 5. Tactical Arms with Elbow Pads and Wrist Gadget
  const armGeo = new THREE.BoxGeometry(0.22, 0.68, 0.22);

  // Left Arm Group (Pivoted at shoulder)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.48, 1.55, 0);

  const leftArmMesh = new THREE.Mesh(armGeo, suitMat);
  leftArmMesh.position.set(0, -0.3, 0);
  leftArmMesh.castShadow = true;
  leftArmGroup.add(leftArmMesh);

  // Elbow pad
  const elbowPadL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.12), armorKevlarMat);
  elbowPadL.position.set(0, -0.3, 0.12);
  leftArmGroup.add(elbowPadL);

  // Free Fire Wrist Smartwatch Hologram Gadget
  const watch = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.24), blackTacticalMat);
  watch.position.set(0, -0.48, 0);
  leftArmGroup.add(watch);

  const watchScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
  );
  watchScreen.position.set(0, -0.48, 0.13);
  leftArmGroup.add(watchScreen);

  // Glove
  const gloveL = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.16, 0.23), blackTacticalMat);
  gloveL.position.set(0, -0.58, 0);
  leftArmGroup.add(gloveL);

  // Ready pose angles
  leftArmGroup.rotation.x = -Math.PI / 4;
  leftArmGroup.rotation.y = 0.35;
  leftArmGroup.rotation.z = -0.15;
  group.add(leftArmGroup);

  // Right Arm Group (Pivoted at shoulder)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.48, 1.55, 0);

  const rightArmMesh = new THREE.Mesh(armGeo, suitMat);
  rightArmMesh.position.set(0, -0.3, 0);
  rightArmMesh.castShadow = true;
  rightArmGroup.add(rightArmMesh);

  // Elbow pad
  const elbowPadR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.12), armorKevlarMat);
  elbowPadR.position.set(0, -0.3, 0.12);
  rightArmGroup.add(elbowPadR);

  // Glove
  const gloveR = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.16, 0.23), blackTacticalMat);
  gloveR.position.set(0, -0.58, 0);
  rightArmGroup.add(gloveR);

  rightArmGroup.rotation.x = -Math.PI / 3.8;
  rightArmGroup.rotation.y = -0.25;
  rightArmGroup.rotation.z = 0.15;
  group.add(rightArmGroup);

  // 6. Tactical Legs with Thigh Holster, Knee Pads & Combat Boots
  const legUpperGeo = new THREE.BoxGeometry(0.26, 0.52, 0.26);
  const legLowerGeo = new THREE.BoxGeometry(0.24, 0.44, 0.24);

  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-0.2, 0.88, 0);

  const leftUpper = new THREE.Mesh(legUpperGeo, suitMat);
  leftUpper.position.set(0, -0.24, 0);
  leftUpper.castShadow = true;
  leftLegGroup.add(leftUpper);

  // Left Thigh Tactical Pouch
  const thighPouch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.16), blackTacticalMat);
  thighPouch.position.set(-0.15, -0.22, 0);
  leftLegGroup.add(thighPouch);

  const leftLower = new THREE.Mesh(legLowerGeo, blackTacticalMat);
  leftLower.position.set(0, -0.66, 0);
  leftLower.castShadow = true;
  leftLegGroup.add(leftLower);

  // Knee pad
  const kneePadL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.12), armorKevlarMat);
  kneePadL.position.set(0, -0.48, 0.14);
  leftLegGroup.add(kneePadL);

  // Combat Boot with Lug Sole
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.36), blackTacticalMat);
  bootL.position.set(0, -0.84, -0.04);
  leftLegGroup.add(bootL);

  group.add(leftLegGroup);

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(0.2, 0.88, 0);

  const rightUpper = new THREE.Mesh(legUpperGeo, suitMat);
  rightUpper.position.set(0, -0.24, 0);
  rightUpper.castShadow = true;
  rightLegGroup.add(rightUpper);

  // Right Thigh Drop Holster with Sidearm
  const holster = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.26, 0.18), blackTacticalMat);
  holster.position.set(0.16, -0.22, 0);
  rightLegGroup.add(holster);

  const sidearmGrip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.08), goldTrimMat);
  sidearmGrip.position.set(0.16, -0.12, 0.04);
  sidearmGrip.rotation.x = 0.3;
  rightLegGroup.add(sidearmGrip);

  const rightLower = new THREE.Mesh(legLowerGeo, blackTacticalMat);
  rightLower.position.set(0, -0.66, 0);
  rightLower.castShadow = true;
  rightLegGroup.add(rightLower);

  // Knee pad
  const kneePadR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.12), armorKevlarMat);
  kneePadR.position.set(0, -0.48, 0.14);
  rightLegGroup.add(kneePadR);

  // Combat Boot with Lug Sole
  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.36), blackTacticalMat);
  bootR.position.set(0, -0.84, -0.04);
  rightLegGroup.add(bootR);

  group.add(rightLegGroup);

  // 7. Weapon Mesh mounted in front of character
  const gunMesh = createWeaponMesh(weaponType);
  gunMesh.position.set(0.24, 1.15, -0.52);
  group.add(gunMesh);

  const muzzleAnchor = gunMesh.getObjectByName('muzzleAnchor') || gunMesh;

  // 8. Ground Soft Contact Shadow
  const shadowGeo = new THREE.CircleGeometry(0.85, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  group.add(shadowDisc);

  return {
    group,
    head,
    visor,
    body,
    armorVest,
    leftArm: leftArmGroup,
    rightArm: rightArmGroup,
    leftLeg: leftLegGroup,
    rightLeg: rightLegGroup,
    backpack: backpackGroup,
    gunMesh,
    muzzleAnchor,
    shadowDisc,
    baseColor: colorHex,
    bundleId,
  };
}

/**
 * Animate character with Free Fire tactical sprint lean and gait
 */
export function animateCharacterGait(rig: CharacterRig, speed: number, time: number) {
  if (speed > 0.1) {
    // Sprint cycle
    const freq = speed > 8 ? 14 : 11;
    const legSwing = Math.sin(time * freq) * 0.65;
    rig.leftLeg.rotation.x = legSwing;
    rig.rightLeg.rotation.x = -legSwing;

    // Tactical forward lean
    rig.body.rotation.x = 0.22;
    rig.head.rotation.x = -0.1;
    rig.armorVest.rotation.x = 0.22;
    rig.backpack.rotation.x = 0.22;

    // Body bobbing
    const bob = Math.abs(Math.sin(time * freq)) * 0.09;
    rig.body.position.y = 1.25 + bob;
    rig.armorVest.position.y = 1.32 + bob;
    rig.head.parent!.position.y = 1.95 + bob;

    // Dynamic weapon & arm sway
    rig.gunMesh.position.y = 1.15 + Math.sin(time * freq) * 0.04;
    rig.gunMesh.rotation.z = Math.sin(time * (freq / 2)) * 0.06;
  } else {
    // Idle breathing stance
    rig.leftLeg.rotation.x = 0;
    rig.rightLeg.rotation.x = 0;
    rig.body.rotation.x = 0;
    rig.head.rotation.x = 0;
    rig.armorVest.rotation.x = 0;
    rig.backpack.rotation.x = 0;

    const breath = Math.sin(time * 2.5) * 0.02;
    rig.body.position.y = 1.25 + breath;
    rig.armorVest.position.y = 1.32 + breath;
    rig.head.parent!.position.y = 1.95 + breath;
    rig.gunMesh.position.y = 1.15 + breath * 0.5;
    rig.gunMesh.rotation.z = 0;
  }
}

/**
 * Trigger hit flash on character rig
 */
export function triggerHitFlash(rig: CharacterRig) {
  const origMat = rig.body.material as THREE.MeshStandardMaterial;
  const origColor = rig.baseColor;
  origMat.emissive.setHex(0xffffff);
  origMat.emissiveIntensity = 0.95;

  setTimeout(() => {
    origMat.emissive.setHex(origColor);
    origMat.emissiveIntensity = 0;
  }, 75);
}
