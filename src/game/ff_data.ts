export interface EvoGunSkin {
  id: string;
  name: string;
  gunType: 'rifle' | 'shotgun' | 'pistol' | 'sniper' | 'smg';
  baseGun: string;
  level: number;
  maxLevel: number;
  rarity: 'Evo' | 'Mythic' | 'Legendary' | 'Epic' | 'Theme';
  diamondsCost: number;
  damageBonus: string;
  fireRateBonus: string;
  reloadSpeedBonus?: string;
  exclusiveEmoteId?: string;
  glowColor: string;
  glowHex: number;
  description: string;
  unlocked: boolean;
  eventExclusive?: boolean;
}

export interface EmoteItem {
  id: string;
  name: string;
  hindiName?: string;
  rarity: 'Mythic' | 'Legendary' | 'Epic' | 'Rare';
  diamonds: number;
  animationType: 'dance' | 'pose' | 'booyah' | 'action' | 'special';
  description: string;
  iconSymbol: string;
  unlocked?: boolean;
}

export interface FreeFireEvent {
  id: string;
  title: string;
  tag: string;
  bannerGradient: string;
  endsInDays: number;
  featuredSkinId: string;
  costPerSpin: number;
  description: string;
  eventType: 'faded_wheel' | 'mystery_shop' | 'top_up' | 'evo_vault';
}

// Iconic Evo Gun Skins
export const EVO_GUN_SKINS: EvoGunSkin[] = [
  {
    id: 'evo_ak47_blue_dragon',
    name: 'AK47 - Blue Flame Draco',
    gunType: 'rifle',
    baseGun: 'AK47',
    level: 7,
    maxLevel: 7,
    rarity: 'Evo',
    diamondsCost: 2499,
    damageBonus: '+2 Damage',
    fireRateBonus: '+1 Fire Rate',
    reloadSpeedBonus: '-1 Reload',
    exclusiveEmoteId: 'emote_draco_summon',
    glowColor: '#38bdf8',
    glowHex: 0x0284c7,
    description: 'The ancient azure dragon resurrected in firearm form. Features wings, dragon aura, and draco summon emote.',
    unlocked: true,
    eventExclusive: true,
  },
  {
    id: 'evo_mp40_cobra',
    name: 'MP40 - Predatory Cobra',
    gunType: 'rifle',
    baseGun: 'MP40',
    level: 7,
    maxLevel: 7,
    rarity: 'Evo',
    diamondsCost: 2499,
    damageBonus: '+2 Damage',
    fireRateBonus: '+1 Rate of Fire',
    exclusiveEmoteId: 'emote_cobra_strike',
    glowColor: '#ef4444',
    glowHex: 0xdc2626,
    description: 'Deadly viper infused submachine gun with glowing red venomous conduits and poison fangs.',
    unlocked: false,
    eventExclusive: true,
  },
  {
    id: 'evo_m1014_green_dragon',
    name: 'M1014 - Green Flame Draco',
    gunType: 'shotgun',
    baseGun: 'M1014',
    level: 7,
    maxLevel: 7,
    rarity: 'Evo',
    diamondsCost: 2499,
    damageBonus: '+2 Rate of Fire',
    fireRateBonus: '+1 Damage',
    exclusiveEmoteId: 'emote_green_dragon_roar',
    glowColor: '#22c55e',
    glowHex: 0x16a34a,
    description: 'Radioactive green dragon shotgun that tears through armor at close range with devastating jade blasts.',
    unlocked: false,
    eventExclusive: true,
  },
  {
    id: 'evo_scar_megalodon',
    name: 'SCAR - Megalodon Alpha',
    gunType: 'rifle',
    baseGun: 'SCAR',
    level: 7,
    maxLevel: 7,
    rarity: 'Evo',
    diamondsCost: 2199,
    damageBonus: '+2 Damage',
    fireRateBonus: '+1 Fire Rate',
    exclusiveEmoteId: 'emote_shark_bite',
    glowColor: '#0ea5e9',
    glowHex: 0x0284c7,
    description: 'Prehistoric apex predator shark rifle that shoots high-velocity hydro-kinetic rounds.',
    unlocked: false,
    eventExclusive: true,
  },
  {
    id: 'evo_xm8_destiny',
    name: 'XM8 - Destiny Guardian',
    gunType: 'rifle',
    baseGun: 'XM8',
    level: 7,
    maxLevel: 7,
    rarity: 'Evo',
    diamondsCost: 2199,
    damageBonus: '+2 Damage',
    fireRateBonus: '+1 Rate of Fire',
    exclusiveEmoteId: 'emote_lightning_wings',
    glowColor: '#eab308',
    glowHex: 0xfacc15,
    description: 'Golden thunder bird armor rifle with electric bolt tracers and celestial feather plumage.',
    unlocked: false,
    eventExclusive: true,
  },
  {
    id: 'evo_ump_booyah',
    name: 'UMP - Booyah Day 2021',
    gunType: 'rifle',
    baseGun: 'UMP',
    level: 7,
    maxLevel: 7,
    rarity: 'Evo',
    diamondsCost: 1999,
    damageBonus: '+2 Damage',
    fireRateBonus: '+1 Reload Speed',
    exclusiveEmoteId: 'emote_trophy_booyah',
    glowColor: '#f97316',
    glowHex: 0xea580c,
    description: 'Commemorative championship firearm forged from pure gold trophies and victorious flames.',
    unlocked: false,
    eventExclusive: false,
  },
  {
    id: 'evo_m4a1_infernal',
    name: 'M4A1 - Infernal Draco',
    gunType: 'rifle',
    baseGun: 'M4A1',
    level: 7,
    maxLevel: 7,
    rarity: 'Evo',
    diamondsCost: 2299,
    damageBonus: '+2 Fire Rate',
    fireRateBonus: '+1 Damage',
    exclusiveEmoteId: 'emote_hellfire_blast',
    glowColor: '#f43f5e',
    glowHex: 0xe11d48,
    description: 'Molten magma dragon rifle forged deep in the volcanic underworld of Bermuda island.',
    unlocked: false,
    eventExclusive: true,
  },
  {
    id: 'evo_thompson_cindered',
    name: 'Thompson - Cindered Colossus',
    gunType: 'rifle',
    baseGun: 'Thompson',
    level: 7,
    maxLevel: 7,
    rarity: 'Evo',
    diamondsCost: 2199,
    damageBonus: '+2 Damage',
    fireRateBonus: '+1 Rate of Fire',
    exclusiveEmoteId: 'emote_magma_punch',
    glowColor: '#fb923c',
    glowHex: 0xc2410c,
    description: 'Colossal lava golem submachine gun with fiery drum magazine and volcanic ember smoke.',
    unlocked: false,
    eventExclusive: true,
  },
];

// Generate 360+ total gun skins across all categories
export const TOTAL_GUN_SKIN_COUNT = 360;

export function getAllGunSkins(): EvoGunSkin[] {
  const list = [...EVO_GUN_SKINS];
  const rarities: EvoGunSkin['rarity'][] = ['Mythic', 'Legendary', 'Epic', 'Theme'];
  const gunTypes: EvoGunSkin['gunType'][] = ['rifle', 'shotgun', 'sniper', 'pistol'];
  const baseGuns = ['AK47', 'M1014', 'AWM', 'Desert Eagle', 'M4A1', 'MP40', 'SCAR', 'SPAS12', 'Kar98k', 'USP'];
  const themes = [
    'Dragon Flame', 'Cupid Bow', 'Water Elemental', 'Cyber Assassin', 'Titanium Force',
    'Golden Glare', 'Neon Rebel', 'Apocalyptic Red', 'Ice Shard', 'Blood Moon',
    'Radioactive Viper', 'Abyssal Deep', 'Solar Flare', 'Phantom Assassin', 'Death Eye'
  ];

  for (let i = list.length; i < TOTAL_GUN_SKIN_COUNT; i++) {
    const base = baseGuns[i % baseGuns.length];
    const theme = themes[i % themes.length];
    const type = gunTypes[i % gunTypes.length];
    const rar = rarities[i % rarities.length];
    const cost = rar === 'Mythic' ? 1800 : rar === 'Legendary' ? 1200 : rar === 'Epic' ? 700 : 350;

    list.push({
      id: `gun_skin_${i}`,
      name: `${base} - ${theme} MK-${Math.floor(i / baseGuns.length) + 1}`,
      gunType: type,
      baseGun: base,
      level: 1,
      maxLevel: 4,
      rarity: rar,
      diamondsCost: cost,
      damageBonus: '+1 Damage',
      fireRateBonus: rar === 'Mythic' ? '+2 Fire Rate' : '+1 Accuracy',
      glowColor: i % 2 === 0 ? '#38bdf8' : '#f59e0b',
      glowHex: (i * 9876543) & 0xffffff,
      description: `Official Free Fire ${rar} skin for ${base}. Increases combat agility and features distinct muzzle flash.`,
      unlocked: i < 15,
      eventExclusive: i % 5 === 0,
    });
  }

  return list;
}

// 200 Free Fire Emotes
export const TOTAL_EMOTE_COUNT = 200;

export const ICONIC_EMOTES: EmoteItem[] = [
  {
    id: 'emote_lol',
    name: 'LOL Emote',
    hindiName: 'लोल इमोट (हंसने वाला)',
    rarity: 'Mythic',
    diamonds: 599,
    animationType: 'action',
    description: 'Point and laugh uncontrollably at defeated opponents. The supreme BM emote.',
    iconSymbol: '😂',
  },
  {
    id: 'emote_throne',
    name: 'Tea Time (Throne)',
    hindiName: 'सिंहासन चाय इमोट',
    rarity: 'Mythic',
    diamonds: 999,
    animationType: 'pose',
    description: 'Summons a floating royal golden throne and gracefully sips tea like a king.',
    iconSymbol: '🪑',
  },
  {
    id: 'emote_flowers_love',
    name: 'Flowers of Love (Propose)',
    hindiName: 'गुलाब प्रपोज़ इमोट',
    rarity: 'Legendary',
    diamonds: 899,
    animationType: 'pose',
    description: 'Kneels down on one knee offering a glowing red rose bouquet to your squad.',
    iconSymbol: '🌹',
  },
  {
    id: 'emote_draco_summon',
    name: 'Draco Draco Summon',
    hindiName: 'ब्लू ड्रैगन समन इमोट',
    rarity: 'Mythic',
    diamonds: 1200,
    animationType: 'special',
    description: 'Summons a colossal ethereal blue dragon that roars and circles around the player.',
    iconSymbol: '🐉',
  },
  {
    id: 'emote_cobra_strike',
    name: 'Predatory Cobra Strike',
    hindiName: 'कोबरा स्ट्राइक इमोट',
    rarity: 'Mythic',
    diamonds: 1200,
    animationType: 'special',
    description: 'Morphs arms into glowing red cobras lunging forward with venom strikes.',
    iconSymbol: '🐍',
  },
  {
    id: 'emote_doggie',
    name: 'Doggie Dance',
    hindiName: 'डॉगी डांस इमोट',
    rarity: 'Legendary',
    diamonds: 699,
    animationType: 'dance',
    description: 'Pulls out the viral Shiba Inu doggie and bops rhythmically together side by side.',
    iconSymbol: '🐶',
  },
  {
    id: 'emote_pirate_flag',
    name: "Pirate's Flag",
    hindiName: 'समुद्री डाकू झंडा इमोट',
    rarity: 'Legendary',
    diamonds: 899,
    animationType: 'pose',
    description: 'Slams a flaming Jolly Roger pirate flag deep into the ground claiming territory.',
    iconSymbol: '🏴‍☠️',
  },
  {
    id: 'emote_booyah',
    name: 'I Heart Booyah',
    hindiName: 'बूयाह इमोट',
    rarity: 'Epic',
    diamonds: 499,
    animationType: 'booyah',
    description: 'Summons golden holographic Booyah letters overhead with celebratory confetti.',
    iconSymbol: '🏆',
  },
  {
    id: 'emote_pushup',
    name: 'Push Up Challenge',
    hindiName: 'पुश अप इमोट',
    rarity: 'Epic',
    diamonds: 399,
    animationType: 'action',
    description: 'Hits the ground and cranks out one-handed diamond pushups effortlessly.',
    iconSymbol: '💪',
  },
  {
    id: 'emote_moonflip',
    name: 'Moon Flip',
    hindiName: 'मून फ्लिप (बैकफ्लिप)',
    rarity: 'Epic',
    diamonds: 499,
    animationType: 'action',
    description: 'Executes an acrobatic zero-gravity backward somersault landing crisply on feet.',
    iconSymbol: '🤸',
  },
  {
    id: 'emote_bhangra',
    name: 'Bhangra Beats',
    hindiName: 'भांगड़ा डांस इमोट',
    rarity: 'Legendary',
    diamonds: 599,
    animationType: 'dance',
    description: 'High energy Punjabi celebratory Bhangra dance with shoulder rolls and foot taps.',
    iconSymbol: '🕺',
  },
  {
    id: 'emote_breakdance',
    name: 'Breakdance Flare',
    hindiName: 'ब्रेकडांस इमोट',
    rarity: 'Legendary',
    diamonds: 699,
    animationType: 'dance',
    description: 'Dynamic floor windmill spin into a crisp freeze pose.',
    iconSymbol: '⚡',
  },
];

export function getAllEmotes(): EmoteItem[] {
  const list = [...ICONIC_EMOTES];
  const names = [
    'Dangerous Game', 'Eat My Dust', 'Slay Emote', 'Mummy Walk', 'Chicken Dance',
    'Baby Shark', 'Kung Fu Master', 'Heartbroken', 'Guitar Solo', 'Selfie Flash',
    'High Five', 'Applause', 'Wave', 'Salute', 'Threaten', 'Provoke',
    'Headbanger', 'Disco Fever', 'Superstar', 'Victory Spin', 'Dab Master',
    'Shadow Boxing', 'Money Rain', 'Laser Dance', 'Fire Breather', 'Soul Shifter'
  ];

  const types: EmoteItem['animationType'][] = ['dance', 'pose', 'booyah', 'action', 'special'];
  const rarities: EmoteItem['rarity'][] = ['Epic', 'Rare', 'Legendary', 'Mythic'];
  const symbols = ['🔥', '✨', '👑', '🎯', '💥', '⭐', '💎', '🚀', '🎸', '🎉', '🥊', '💃'];

  for (let i = list.length; i < TOTAL_EMOTE_COUNT; i++) {
    const name = names[i % names.length] + ' ' + (Math.floor(i / names.length) + 1);
    const rar = rarities[i % rarities.length];
    const cost = rar === 'Mythic' ? 899 : rar === 'Legendary' ? 599 : rar === 'Epic' ? 399 : 199;

    list.push({
      id: `emote_gen_${i}`,
      name,
      hindiName: `${name} (फ्री फायर)`,
      rarity: rar,
      diamonds: cost,
      animationType: types[i % types.length],
      description: `Official Free Fire ${rar} emote #${i + 1}. Express victory, taunt rivals, and show off style.`,
      iconSymbol: symbols[i % symbols.length],
      unlocked: i < 10,
    });
  }

  return list;
}

// Active Free Fire In-Game Events
export const FREE_FIRE_EVENTS: FreeFireEvent[] = [
  {
    id: 'event_faded_wheel_draco',
    title: 'Faded Wheel: Blue Flame Draco AK47',
    tag: 'EVO GUN RETURN',
    bannerGradient: 'from-blue-900 via-sky-800 to-cyan-900',
    endsInDays: 4,
    featuredSkinId: 'evo_ak47_blue_dragon',
    costPerSpin: 9, // Increases 9, 19, 39, 69, 99, 149, 199, 499
    description: 'Eliminate 2 unwanted items and spin with starting 9 Diamonds to guarantee the legendary Evo AK47!',
    eventType: 'faded_wheel',
  },
  {
    id: 'event_mystery_shop',
    title: 'Mystery Shop 90% DISCOUNT',
    tag: 'LUCKY DISCOUNT',
    bannerGradient: 'from-purple-950 via-fuchsia-900 to-indigo-950',
    endsInDays: 6,
    featuredSkinId: 'evo_mp40_cobra',
    costPerSpin: 50,
    description: 'Try your luck to roll up to 90% OFF on Red Criminal Bundle, Predatory Cobra MP40, and Evo Tokens!',
    eventType: 'mystery_shop',
  },
  {
    id: 'event_topup_bonus',
    title: 'Mega Top-Up Bonus Event',
    tag: 'FREE REWARDS',
    bannerGradient: 'from-amber-950 via-yellow-900 to-orange-950',
    endsInDays: 5,
    featuredSkinId: 'evo_m1014_green_dragon',
    costPerSpin: 100,
    description: 'Top-up 100 💎 get Free Gloo Wall Skin. Top-up 500 💎 get Tea Time Throne Emote free!',
    eventType: 'top_up',
  },
  {
    id: 'event_evo_vault',
    title: 'All Evo Guns Grand Vault',
    tag: 'ALL EVOS UNLOCKED',
    bannerGradient: 'from-emerald-950 via-teal-900 to-slate-900',
    endsInDays: 8,
    featuredSkinId: 'evo_scar_megalodon',
    costPerSpin: 40,
    description: 'Special server anniversary event! All 8 Evo weapons are available to claim or upgrade to Level 7!',
    eventType: 'evo_vault',
  },
];
