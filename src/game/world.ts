import * as THREE from 'three';
import { ObstacleBox, LootCrate, LootType } from './types.ts';

export interface WorldData {
  islandGroup: THREE.Group;
  waterMesh: THREE.Mesh;
  obstacles: ObstacleBox[];
  collidableMeshes: THREE.Object3D[];
  lootCrates: LootCrate[];
  zoneMesh: THREE.Mesh;
  zoneRingMesh: THREE.Mesh;
  airdropMesh?: THREE.Group;
  smokeFlareGroup?: THREE.Group;
  safeZoneCenter: { x: number; z: number };
  safeZoneRadius: number;
}

const HOUSE_WALL_COLORS = [
  0xd97706, // Pochinok Warm Amber
  0xef4444, // Clock Tower Crimson
  0x2563eb, // Mill Blue
  0x10b981, // Rim Nam Green
  0x7c3aed, // Peak Violet
  0xf59e0b, // Mars Electric Yellow
  0x0284c7, // Hangar Sky Blue
  0xd946ef, // Katulistiwa Magenta
  0x84cc16, // Shipyard Lime
];

const ROOF_TIN_COLORS = [
  0x1e293b, // Weathered Galvanized Blue Steel
  0x78350f, // Red Clay Ceramic Tile
  0x475569, // Industrial Corrugated Iron
  0x831843, // Deep Maroon
  0x14532d, // Camouflage Olive Tin
];

/**
 * Creates a high-fidelity procedural Bermuda terrain canvas texture
 */
function createBermudaTerrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const dummy = document.createElement('canvas');
    dummy.width = 4;
    dummy.height = 4;
    return new THREE.CanvasTexture(dummy);
  }

  // 1. Lush Bermuda Grass Base
  const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 510);
  grad.addColorStop(0, '#4d7c0f'); // vibrant center green
  grad.addColorStop(0.65, '#3f6212'); // deep forest green
  grad.addColorStop(0.88, '#65a30d'); // coastal meadow
  grad.addColorStop(0.94, '#d97706'); // transition earth
  grad.addColorStop(1.0, '#fde047'); // sandy beach ring
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Procedural grass noise mottling
  for (let i = 0; i < 6000; i++) {
    const nx = Math.random() * 1024;
    const ny = Math.random() * 1024;
    const dist = Math.hypot(nx - 512, ny - 512);
    if (dist < 460) {
      ctx.fillStyle = Math.random() > 0.5 ? '#365314' : '#65a30d';
      ctx.fillRect(nx, ny, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
  }

  // 3. Bermuda Military Roads & Dirt Paths
  ctx.lineWidth = 28;
  ctx.strokeStyle = '#78350f'; // Dark earth path
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Cross roads
  ctx.beginPath();
  ctx.moveTo(180, 512);
  ctx.lineTo(840, 512);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(512, 180);
  ctx.lineTo(512, 840);
  ctx.stroke();

  // Diagonal supply roads
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#92400e';
  ctx.beginPath();
  ctx.arc(512, 512, 260, 0, Math.PI * 2);
  ctx.stroke();

  // Tarmac center airstrip
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(340, 480);
  ctx.lineTo(680, 544);
  ctx.stroke();

  // Runway white dashed stripes
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f8fafc';
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(340, 480);
  ctx.lineTo(680, 544);
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Pochinok Town Plaza cobblestone pattern
  ctx.fillStyle = '#475569';
  ctx.fillRect(470, 470, 84, 84);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(476, 476, 72, 72);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates an authentic 2-Story Free Fire Bermuda House (Pochinok / Clock Tower style)
 */
function createFreeFireHouse(
  x: number,
  z: number,
  rotation: number,
  colorIdx: number
): {
  group: THREE.Group;
  box: ObstacleBox;
} {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;

  const w = 7.2 + (colorIdx % 3) * 0.8;
  const d = 7.0 + ((colorIdx + 1) % 3) * 0.8;
  const floor1H = 3.6;
  const floor2H = 3.2;

  // Materials
  const foundationMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.9,
    metalness: 0.1,
  });

  const wall1Mat = new THREE.MeshStandardMaterial({
    color: HOUSE_WALL_COLORS[colorIdx % HOUSE_WALL_COLORS.length],
    roughness: 0.8,
    metalness: 0.05,
    flatShading: true,
  });

  const wall2Mat = new THREE.MeshStandardMaterial({
    color: 0x451a03, // Stained wood siding for 2nd floor
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: ROOF_TIN_COLORS[colorIdx % ROOF_TIN_COLORS.length],
    roughness: 0.45,
    metalness: 0.65, // Corrugated tin sheen
    flatShading: true,
  });

  const woodDeckMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.85,
  });

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.15,
    metalness: 0.7,
  });

  const cautionMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.5,
  });

  // 1. Concrete Foundation Platform
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.5, d + 1.2), foundationMat);
  foundation.position.y = 0.25;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  group.add(foundation);

  // Yellow Hazard Caution Stripes on foundation corners
  [-w / 2 - 0.4, w / 2 + 0.4].forEach((cx) => {
    [-d / 2 - 0.4, d / 2 + 0.4].forEach((cz) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), cautionMat);
      stripe.position.set(cx, 0.35, cz);
      group.add(stripe);
    });
  });

  // 2. Ground Floor Body
  const groundFloor = new THREE.Mesh(new THREE.BoxGeometry(w, floor1H, d), wall1Mat);
  groundFloor.position.y = 0.5 + floor1H / 2;
  groundFloor.castShadow = true;
  groundFloor.receiveShadow = true;
  group.add(groundFloor);

  // Front Porch & Entrance Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.2), woodDeckMat);
  door.position.set(0, 0.5 + 1.25, d / 2 + 0.1);
  group.add(door);

  const doorKnob = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 })
  );
  doorKnob.position.set(0.5, 0.5 + 1.25, d / 2 + 0.22);
  group.add(doorKnob);

  // 3. Second Floor with Wooden Siding
  const secondFloor = new THREE.Mesh(new THREE.BoxGeometry(w - 0.4, floor2H, d - 0.4), wall2Mat);
  secondFloor.position.y = 0.5 + floor1H + floor2H / 2;
  secondFloor.castShadow = true;
  secondFloor.receiveShadow = true;
  group.add(secondFloor);

  // 4. Second Floor Front Veranda / Balcony Platform with Railings
  const balconyW = w * 0.85;
  const balconyD = 2.0;
  const balconyPlatform = new THREE.Mesh(new THREE.BoxGeometry(balconyW, 0.25, balconyD), woodDeckMat);
  balconyPlatform.position.set(0, 0.5 + floor1H, d / 2 + balconyD / 2);
  balconyPlatform.castShadow = true;
  group.add(balconyPlatform);

  // Balcony wooden support posts from ground
  [-balconyW / 2 + 0.2, balconyW / 2 - 0.2].forEach((bx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, floor1H, 0.25), woodDeckMat);
    post.position.set(bx, 0.5 + floor1H / 2, d / 2 + balconyD - 0.2);
    post.castShadow = true;
    group.add(post);
  });

  // Balcony Railings
  const railFront = new THREE.Mesh(new THREE.BoxGeometry(balconyW, 0.9, 0.08), woodDeckMat);
  railFront.position.set(0, 0.5 + floor1H + 0.55, d / 2 + balconyD);
  group.add(railFront);

  // 5. Exterior Wooden Staircase on Side
  const stairSteps = 10;
  const stairWidth = 1.2;
  for (let s = 0; s < stairSteps; s++) {
    const stepH = (floor1H / stairSteps) * (s + 1);
    const stepZ = -d / 2 + (d / stairSteps) * s;
    const step = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.22, 0.6), woodDeckMat);
    step.position.set(-w / 2 - stairWidth / 2, 0.5 + stepH, stepZ);
    step.castShadow = true;
    group.add(step);
  }

  // 6. Corrugated Pitched Roof with Eaves
  const roofH = 2.6;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.82, roofH, 4), roofMat);
  roof.position.y = 0.5 + floor1H + floor2H + roofH / 2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // 7. Windows with white frames
  const winFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  [-w * 0.28, w * 0.28].forEach((wx) => {
    // 1st floor window
    const win1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.15), windowMat);
    win1.position.set(wx, 0.5 + 2.0, d / 2 + 0.1);
    group.add(win1);

    const frame1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.12), winFrameMat);
    frame1.position.set(wx, 0.5 + 2.0, d / 2 + 0.08);
    group.add(frame1);

    // 2nd floor window
    const win2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.15), windowMat);
    win2.position.set(wx, 0.5 + floor1H + 1.6, d / 2 - 0.2 + 0.1);
    group.add(win2);
  });

  // Calculate AABB for bot pathfinding and player collision
  const radius = Math.max(w, d) / 2 + 1.2;
  const box: ObstacleBox = {
    minX: x - radius,
    maxX: x + radius,
    minZ: z - radius,
    maxZ: z + radius,
    height: floor1H + floor2H + roofH + 0.5,
    type: 'building',
  };

  return { group, box };
}

/**
 * Creates an authentic Military Sniper Watchtower (Clock Tower style)
 */
function createMilitaryWatchtower(x: number, z: number): {
  group: THREE.Group;
  box: ObstacleBox;
} {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const stiltMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Steel girder
    roughness: 0.6,
    metalness: 0.7,
  });

  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Heavy timber
    roughness: 0.85,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.65,
  });

  const stiltH = 7.5;
  const span = 2.4;

  // 4 Heavy Corner Stilts
  [-span, span].forEach((sx) => {
    [-span, span].forEach((sz) => {
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, stiltH, 8), stiltMat);
      stilt.position.set(sx, stiltH / 2, sz);
      stilt.castShadow = true;
      group.add(stilt);

      // Concrete footer
      const footer = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.4, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
      );
      footer.position.set(sx, 0.2, sz);
      group.add(footer);
    });
  });

  // X-braces
  const braceL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6.5, 6), stiltMat);
  braceL.position.set(0, stiltH / 2, -span);
  braceL.rotation.z = Math.PI / 4;
  group.add(braceL);

  const braceR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6.5, 6), stiltMat);
  braceR.position.set(0, stiltH / 2, -span);
  braceR.rotation.z = -Math.PI / 4;
  group.add(braceR);

  // Observation Platform Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.35, 6.4), platformMat);
  deck.position.set(0, stiltH, 0);
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // Guardrail surrounding platform
  [-3.0, 3.0].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 6.2), platformMat);
    rail.position.set(rx, stiltH + 0.55, 0);
    group.add(rail);
  });
  [-3.0, 3.0].forEach((rz) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.1, 0.15), platformMat);
    rail.position.set(0, stiltH + 0.55, rz);
    group.add(rail);
  });

  // Watchtower Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 1.8, 4), roofMat);
  roof.position.set(0, stiltH + 2.8, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Rear climbing ladder
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.7, stiltH, 0.12), stiltMat);
  ladder.position.set(0, stiltH / 2, span + 0.15);
  group.add(ladder);

  const box: ObstacleBox = {
    minX: x - 3.2,
    maxX: x + 3.2,
    minZ: z - 3.2,
    maxZ: z + 3.2,
    height: stiltH + 3.5,
    type: 'building',
  };

  return { group, box };
}

/**
 * Creates Military Sandbag Cover Bunkers for tactical firefights
 */
function createSandbagBunker(x: number, z: number, rotation: number): {
  group: THREE.Group;
  box: ObstacleBox;
} {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation;

  const bagMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Burlap sandbag khaki
    roughness: 0.95,
    flatShading: true,
  });

  // 3-tier curved sandbag stack
  const bagGeo = new THREE.BoxGeometry(1.2, 0.35, 0.6);
  for (let row = 0; row < 3; row++) {
    for (let col = -2; col <= 2; col++) {
      const bag = new THREE.Mesh(bagGeo, bagMat);
      const angle = col * 0.18;
      const radius = 3.0;
      bag.position.set(Math.sin(angle) * radius, 0.18 + row * 0.32, Math.cos(angle) * radius - radius);
      bag.rotation.y = angle;
      bag.castShadow = true;
      bag.receiveShadow = true;
      group.add(bag);
    }
  }

  const box: ObstacleBox = {
    minX: x - 2.8,
    maxX: x + 2.8,
    minZ: z - 1.2,
    maxZ: z + 1.2,
    height: 1.2,
    type: 'rock',
  };

  return { group, box };
}

/**
 * Creates Free Fire Red Explosive Oil Drums
 */
function createExplosiveBarrel(x: number, z: number): {
  group: THREE.Group;
  box: ObstacleBox;
} {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Free Fire Crimson
    roughness: 0.45,
    metalness: 0.7,
  });

  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.6,
  });

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.3, 12), barrelMat);
  barrel.position.y = 0.65;
  barrel.castShadow = true;
  group.add(barrel);

  // Black Hazard Ring
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 12), stripeMat);
  ring.position.y = 0.65;
  group.add(ring);

  // Yellow Hazard Flame Icon
  const flame = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.35),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  flame.position.set(0, 0.65, 0.51);
  group.add(flame);

  const box: ObstacleBox = {
    minX: x - 0.6,
    maxX: x + 0.6,
    minZ: z - 0.6,
    maxZ: z + 0.6,
    height: 1.3,
    type: 'rock',
  };

  return { group, box };
}

/**
 * Creates authentic Bermuda Coconut Palm Trees
 */
function createPalmTree(x: number, z: number, scale = 1): {
  group: THREE.Group;
  box: ObstacleBox;
} {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.set(scale, scale, scale);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Ringed palm bark
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });

  const frondMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Lush tropical palm green
    roughness: 0.65,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  const coconutMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.8,
  });

  // Curved Trunk using 5 segmented tilted cylinders
  const segments = 5;
  const segH = 1.3;
  let currentY = 0;
  let currentX = 0;
  const tilt = (Math.sin(x + z) * 0.15) + 0.12;

  for (let s = 0; s < segments; s++) {
    const bottomR = 0.42 - s * 0.04;
    const topR = 0.38 - s * 0.04;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(topR, bottomR, segH, 8), trunkMat);
    seg.position.set(currentX, currentY + segH / 2, 0);
    seg.rotation.z = tilt * (s + 1) * 0.15;
    seg.castShadow = true;
    group.add(seg);

    currentY += segH * 0.95;
    currentX += Math.sin(tilt) * 0.35;
  }

  // Coconut Clusters under the crown
  for (let c = 0; c < 4; c++) {
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), coconutMat);
    const ca = (c / 4) * Math.PI * 2;
    coconut.position.set(currentX + Math.cos(ca) * 0.35, currentY - 0.2, Math.sin(ca) * 0.35);
    group.add(coconut);
  }

  // 8 Sweeping Tropical Palm Fronds
  for (let f = 0; f < 8; f++) {
    const frondAngle = (f / 8) * Math.PI * 2;
    const frondGroup = new THREE.Group();
    frondGroup.position.set(currentX, currentY, 0);
    frondGroup.rotation.y = frondAngle;

    // Curved frond leaf
    const leafGeo = new THREE.PlaneGeometry(0.7, 3.2, 2, 4);
    const leaf = new THREE.Mesh(leafGeo, frondMat);
    leaf.rotation.x = Math.PI / 3;
    leaf.position.set(0, 0.4, 1.4);
    leaf.castShadow = true;
    frondGroup.add(leaf);

    group.add(frondGroup);
  }

  const box: ObstacleBox = {
    minX: x - 0.8 * scale,
    maxX: x + 0.8 * scale,
    minZ: z - 0.8 * scale,
    maxZ: z + 0.8 * scale,
    height: 7 * scale,
    type: 'tree',
  };

  return { group, box };
}

/**
 * Creates low-poly faceted rock
 */
function createRock(x: number, z: number, scale = 1): {
  group: THREE.Group;
  box: ObstacleBox;
} {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.9,
    metalness: 0.15,
    flatShading: true,
  });

  const geo = new THREE.DodecahedronGeometry(1.6 * scale, 0);
  const rock = new THREE.Mesh(geo, rockMat);
  rock.position.y = 0.9 * scale;
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.scale.set(1.1, 0.8, 1.2);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  const box: ObstacleBox = {
    minX: x - 1.4 * scale,
    maxX: x + 1.4 * scale,
    minZ: z - 1.4 * scale,
    maxZ: z + 1.4 * scale,
    height: 1.8 * scale,
    type: 'rock',
  };

  return { group, box };
}

/**
 * Creates the Legendary Free Fire Red Airdrop Crate with a billowing 35m crimson smoke flare!
 */
export function createFreeFireAirdrop(x: number, z: number): {
  group: THREE.Group;
  smokeGroup: THREE.Group;
  box: ObstacleBox;
} {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Red Airdrop Crate
  const airdropMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Free Fire Crimson
    roughness: 0.45,
    metalness: 0.65,
    flatShading: true,
  });

  const tarpMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Blue waterproof top tarp
    roughness: 0.8,
  });

  const cautionMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.3,
    metalness: 0.8,
  });

  // Base container
  const crateMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 2.4), airdropMat);
  crateMesh.position.y = 1.0;
  crateMesh.castShadow = true;
  group.add(crateMesh);

  // Blue weather tarp roof
  const tarp = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.3, 2.5), tarpMat);
  tarp.position.y = 2.1;
  tarp.castShadow = true;
  group.add(tarp);

  // Corner yellow hazard angle brackets
  [-1.22, 1.22].forEach((cx) => {
    [-1.22, 1.22].forEach((cz) => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.0, 0.35), cautionMat);
      bracket.position.set(cx, 1.0, cz);
      group.add(bracket);
    });
  });

  // Parachute attachment rings
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
  [-1.1, 1.1].forEach((px) => {
    [-1.1, 1.1].forEach((pz) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 12), ringMat);
      ring.position.set(px, 2.25, pz);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
    });
  });

  // 35-meter Crimson Smoke Flare Plume Column
  const smokeGroup = new THREE.Group();
  smokeGroup.position.set(x, 2.2, z);

  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });

  // Vertical column of expanding smoke discs/spheres
  for (let s = 0; s < 18; s++) {
    const radius = 0.5 + s * 0.22;
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), smokeMat);
    puff.position.set((Math.sin(s * 1.5) * 0.4), s * 2.0, (Math.cos(s * 1.5) * 0.4));
    smokeGroup.add(puff);
  }

  const box: ObstacleBox = {
    minX: x - 1.5,
    maxX: x + 1.5,
    minZ: z - 1.5,
    maxZ: z + 1.5,
    height: 2.4,
    type: 'building',
  };

  return { group, smokeGroup, box };
}

/**
 * Creates an interactive Loot Crate model with floating 3D hologram icon
 */
export function createLootCrateMesh(crate: LootCrate): THREE.Group {
  const group = new THREE.Group();
  group.position.set(crate.x, 0, crate.z);

  // Main Wooden Crate Body
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0xa16207,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });
  const crateGeo = new THREE.BoxGeometry(1.4, 1.1, 1.4);
  const crateMesh = new THREE.Mesh(crateGeo, crateMat);
  crateMesh.position.y = 0.55;
  crateMesh.castShadow = true;
  group.add(crateMesh);

  // Metal Corner Brackets
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.8,
  });
  const frameGeo = new THREE.BoxGeometry(1.45, 0.2, 1.45);
  const frameMesh = new THREE.Mesh(frameGeo, metalMat);
  frameMesh.position.y = 0.55;
  group.add(frameMesh);

  // Glowing Hologram Icon Above Crate
  let iconColor = 0x38bdf8;
  if (crate.type === 'shotgun') iconColor = 0xf97316;
  if (crate.type === 'medkit') iconColor = 0x22c55e;
  if (crate.type === 'sniper') iconColor = 0xa855f7;
  if (crate.type === 'shield_potion') iconColor = 0x06b6d4;

  const holoMat = new THREE.MeshStandardMaterial({
    color: iconColor,
    emissive: iconColor,
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.5,
    flatShading: true,
  });

  if (crate.type === 'medkit') {
    // Cross shape
    const crossGroup = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 0.28), holoMat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.8, 0.28), holoMat);
    crossGroup.add(b1, b2);
    crossGroup.position.y = 1.7;
    crossGroup.name = 'holoIcon';
    group.add(crossGroup);
  } else if (crate.type === 'shield_potion') {
    // Shield Potion Flask
    const potionGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.65, 8), holoMat);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.25, 8), holoMat);
    neck.position.y = 0.45;
    potionGroup.add(body, neck);
    potionGroup.position.y = 1.7;
    potionGroup.name = 'holoIcon';
    group.add(potionGroup);
  } else {
    // Weapon Hologram Diamond Prism
    const iconGeo = new THREE.OctahedronGeometry(0.44, 0);
    const iconMesh = new THREE.Mesh(iconGeo, holoMat);
    iconMesh.position.y = 1.7;
    iconMesh.name = 'holoIcon';
    group.add(iconMesh);
  }

  // Soft Contact Shadow Disc
  const shadowGeo = new THREE.CircleGeometry(0.9, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  group.add(shadowMesh);

  return group;
}

/**
 * Build the complete Free Fire Bermuda Island World
 */
export function buildWorld(scene: THREE.Scene): WorldData {
  const islandGroup = new THREE.Group();
  scene.add(islandGroup);

  const obstacles: ObstacleBox[] = [];
  const collidableMeshes: THREE.Object3D[] = [];

  // 1. Procedural Bermuda Island Terrain with Roads, Tarmac & Grass
  const islandRadius = 72;
  const terrainTexture = createBermudaTerrainTexture();
  const islandGeo = new THREE.CylinderGeometry(islandRadius, islandRadius + 6, 8, 48);
  const islandMat = new THREE.MeshStandardMaterial({
    map: terrainTexture,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: false,
  });
  const islandMesh = new THREE.Mesh(islandGeo, islandMat);
  islandMesh.position.y = -4; // Surface at Y = 0
  islandMesh.receiveShadow = true;
  islandGroup.add(islandMesh);

  // Shoreline sand & white wave foam ring
  const sandGeo = new THREE.RingGeometry(islandRadius - 4, islandRadius + 4, 48);
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });
  const sandMesh = new THREE.Mesh(sandGeo, sandMat);
  sandMesh.rotation.x = -Math.PI / 2;
  sandMesh.position.y = 0.03;
  sandMesh.receiveShadow = true;
  islandGroup.add(sandMesh);

  // Shore wave foam crest ring
  const foamGeo = new THREE.RingGeometry(islandRadius - 1.5, islandRadius + 0.5, 48);
  const foamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const foamMesh = new THREE.Mesh(foamGeo, foamMat);
  foamMesh.rotation.x = -Math.PI / 2;
  foamMesh.position.y = 0.04;
  islandGroup.add(foamMesh);

  // 2. Surrounding Ocean Water Plane (Vibrant Tropical Turquoise)
  const waterGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Free Fire Tropical Azure
    roughness: 0.12,
    metalness: 0.45,
    transparent: true,
    opacity: 0.9,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -1.2;
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // 3. Generate 16 2-Story Free Fire Bermuda Houses
  const houseCoords = [
    // Pochinok Town Center (North)
    { x: -14, z: -25, rot: 0.2 },
    { x: 14, z: -28, rot: -0.4 },
    { x: 0, z: -38, rot: 0 },
    { x: -28, z: -15, rot: 0.8 },
    // Clock Tower Outpost (East)
    { x: 38, z: 0, rot: -1.2 },
    { x: 42, z: 18, rot: 2.1 },
    { x: 26, z: 24, rot: 0.6 },
    // Rim Nam Village (South)
    { x: 8, z: 36, rot: -0.2 },
    { x: -16, z: 40, rot: 0.5 },
    { x: -26, z: 28, rot: 1.4 },
    { x: 0, z: 18, rot: 3.1 },
    // Mars Electric Fort (West)
    { x: -44, z: 2, rot: -0.7 },
    { x: -38, z: -35, rot: 0.9 },
    { x: 32, z: -22, rot: -2.3 },
    // Central Factory Plaza Buildings
    { x: -18, z: -4, rot: 1.57 },
    { x: 20, z: -6, rot: -1.57 },
  ];

  houseCoords.forEach((coord, i) => {
    const { group, box } = createFreeFireHouse(coord.x, coord.z, coord.rot, i);
    islandGroup.add(group);
    obstacles.push(box);
    collidableMeshes.push(group);
  });

  // 4. Two High-Vantage Military Sniper Watchtowers
  const watchtowers = [
    { x: -30, z: 2 },
    { x: 32, z: -4 },
  ];
  watchtowers.forEach((pos) => {
    const { group, box } = createMilitaryWatchtower(pos.x, pos.z);
    islandGroup.add(group);
    obstacles.push(box);
    collidableMeshes.push(group);
  });

  // 5. Military Sandbag Cover Bunkers
  const sandbagPositions = [
    { x: -6, z: -14, rot: 0 },
    { x: 8, z: -14, rot: 3.14 },
    { x: 12, z: 12, rot: 1.57 },
    { x: -12, z: 14, rot: -1.57 },
  ];
  sandbagPositions.forEach((pos) => {
    const { group, box } = createSandbagBunker(pos.x, pos.z, pos.rot);
    islandGroup.add(group);
    obstacles.push(box);
    collidableMeshes.push(group);
  });

  // 6. Red Explosive Barrels scattered near houses
  const barrelPositions = [
    { x: -8, z: -20 },
    { x: 18, z: -22 },
    { x: 30, z: 6 },
    { x: -22, z: 34 },
    { x: -34, z: -10 },
  ];
  barrelPositions.forEach((pos) => {
    const { group, box } = createExplosiveBarrel(pos.x, pos.z);
    islandGroup.add(group);
    obstacles.push(box);
    collidableMeshes.push(group);
  });

  // 7. Legendary Free Fire Red Airdrop with 35m Smoke Flare in Central Field
  const airdrop = createFreeFireAirdrop(2, 6);
  islandGroup.add(airdrop.group);
  scene.add(airdrop.smokeGroup);
  obstacles.push(airdrop.box);
  collidableMeshes.push(airdrop.group);

  // 8. Generate Bermuda Coconut Palm Trees
  for (let i = 0; i < 46; i++) {
    const angle = (i / 46) * Math.PI * 2 + Math.sin(i * 3) * 0.3;
    const dist = 14 + (Math.sin(i * 7) * 0.5 + 0.5) * 48;
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;

    const tooCloseToHouse = obstacles.some(
      (b) => Math.hypot(tx - (b.minX + b.maxX) / 2, tz - (b.minZ + b.maxZ) / 2) < 5.2
    );
    if (!tooCloseToHouse) {
      const scale = 0.85 + (i % 5) * 0.12;
      const { group, box } = createPalmTree(tx, tz, scale);
      islandGroup.add(group);
      obstacles.push(box);
    }
  }

  // 9. Generate Low-Poly Faceted Rocks
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 + 0.15;
    const dist = 20 + ((i * 13) % 44);
    const rx = Math.cos(angle) * dist;
    const rz = Math.sin(angle) * dist;

    const tooClose = obstacles.some(
      (b) => Math.hypot(rx - (b.minX + b.maxX) / 2, rz - (b.minZ + b.maxZ) / 2) < 4.5
    );
    if (!tooClose) {
      const scale = 0.8 + ((i * 7) % 5) * 0.25;
      const { group, box } = createRock(rx, rz, scale);
      islandGroup.add(group);
      obstacles.push(box);
      collidableMeshes.push(group);
    }
  }

  // 10. Spawn 12 Loot Crates scattered around the map
  const crateConfigs: { x: number; z: number; type: LootType }[] = [
    { x: -5, z: -10, type: 'rifle' },
    { x: 14, z: -16, type: 'shotgun' },
    { x: 0, z: 2, type: 'shield_potion' },
    { x: -6, z: 8, type: 'sniper' },
    { x: -22, z: 12, type: 'medkit' },
    { x: 18, z: 10, type: 'shield_potion' },
    { x: 30, z: -8, type: 'sniper' },
    { x: -10, z: 28, type: 'shotgun' },
    { x: 22, z: 32, type: 'rifle' },
    { x: -35, z: -18, type: 'shield_potion' },
    { x: 36, z: 12, type: 'sniper' },
    { x: 8, z: -25, type: 'shield_potion' },
  ];

  const lootCrates: LootCrate[] = crateConfigs.map((cfg, idx) => {
    const crate: LootCrate = {
      id: `crate-${idx}`,
      x: cfg.x,
      z: cfg.z,
      type: cfg.type,
      collected: false,
    };
    const mesh = createLootCrateMesh(crate);
    islandGroup.add(mesh);
    crate.meshGroup = mesh;
    return crate;
  });

  // 11. Shimmering Electric Blue Zone Cylindrical Dome
  const zoneRadius = 65;
  const zoneGeo = new THREE.CylinderGeometry(zoneRadius, zoneRadius, 40, 48, 1, true);
  const zoneMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
  zoneMesh.position.set(0, 20, 0);
  scene.add(zoneMesh);

  // Pulsing glowing edge ring at ground level
  const ringGeo = new THREE.RingGeometry(zoneRadius - 0.7, zoneRadius + 0.7, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x0284c7,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const zoneRingMesh = new THREE.Mesh(ringGeo, ringMat);
  zoneRingMesh.rotation.x = -Math.PI / 2;
  zoneRingMesh.position.set(0, 0.08, 0);
  scene.add(zoneRingMesh);

  return {
    islandGroup,
    waterMesh,
    obstacles,
    collidableMeshes,
    lootCrates,
    zoneMesh,
    zoneRingMesh,
    airdropMesh: airdrop.group,
    smokeFlareGroup: airdrop.smokeGroup,
    safeZoneCenter: { x: 0, z: 0 },
    safeZoneRadius: zoneRadius,
  };
}
