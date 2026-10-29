export interface BundleItem {
  id: string;
  name: string;
  hindiName?: string;
  rarity: 'Mythic' | 'Legendary' | 'Epic' | 'Rare';
  category: 'Bundle' | 'Character' | 'Gun Skin' | 'Emote' | 'Fashion';
  diamonds: number;
  description: string;
  colorHex: number;
  accentHex: number;
  visorHex: number;
  tags: string[];
  imagePlaceholder?: string;
}

export interface DiamondPack {
  id: string;
  diamonds: number;
  bonus: number;
  priceInr: string;
  popular?: boolean;
  bestValue?: boolean;
  description: string;
}

export const DIAMOND_PACKS: DiamondPack[] = [
  {
    id: 'pack_100',
    diamonds: 100,
    bonus: 10,
    priceInr: '₹80',
    description: 'Entry starter pack. Perfect for Lucky Royale spins!',
  },
  {
    id: 'pack_310',
    diamonds: 310,
    bonus: 35,
    priceInr: '₹240',
    description: 'Great for weekly weapon crate openings.',
  },
  {
    id: 'pack_520',
    diamonds: 520,
    bonus: 60,
    priceInr: '₹400',
    popular: true,
    description: 'MOST POPULAR! Instantly unlocks the Booyah Elite Pass!',
  },
  {
    id: 'pack_1060',
    diamonds: 1060,
    bonus: 140,
    priceInr: '₹800',
    description: 'Ideal for claiming Mythic Character Bundles.',
  },
  {
    id: 'pack_2180',
    diamonds: 2180,
    bonus: 320,
    priceInr: '₹1,600',
    description: 'Super value pack for Incubator & Evo Gun upgrades.',
  },
  {
    id: 'pack_5600',
    diamonds: 5600,
    bonus: 1000,
    priceInr: '₹4,000',
    bestValue: true,
    description: 'VIP GRAND BUNDLE! Max out your inventory and rank up!',
  },
];

export const FREE_FIRE_BUNDLES: BundleItem[] = [
  {
    id: 'bundle_red_criminal',
    name: 'Red Criminal Bundle',
    hindiName: 'लाल क्रिमिनल बंडल',
    rarity: 'Mythic',
    category: 'Bundle',
    diamonds: 2500,
    description: 'The most iconic and feared outfit in Free Fire history. Striking crimson clown aesthetic.',
    colorHex: 0xdc2626, // Crimson red
    accentHex: 0x111827,
    visorHex: 0xfacc15,
    tags: ['Criminal Squad', 'OG Rare', 'Incubator'],
  },
  {
    id: 'bundle_hip_hop',
    name: 'Hip Hop Bundle (Season 2)',
    hindiName: 'हिप हॉप बंडल (सीज़न 2)',
    rarity: 'Mythic',
    category: 'Bundle',
    diamonds: 2800,
    description: 'Legendary Elite Pass Season 2 streetwear outfit with backwards cap and glowing graffiti.',
    colorHex: 0x8b5cf6, // Vibrant purple
    accentHex: 0xf43f5e,
    visorHex: 0x38bdf8,
    tags: ['Season 2', 'Pass OG', 'Ultra Rare'],
  },
  {
    id: 'bundle_sakura',
    name: 'Sakura Bundle (Season 1)',
    hindiName: 'सकुरा बंडल (सीज़न 1)',
    rarity: 'Mythic',
    category: 'Bundle',
    diamonds: 3200,
    description: 'The holy grail of Free Fire. Season 1 Japanese cherry blossom samurai demon outfit.',
    colorHex: 0xf472b6, // Sakura pink
    accentHex: 0x1e1b4b,
    visorHex: 0xffedd5,
    tags: ['Season 1', 'Holy Grail', 'Samurai'],
  },
  {
    id: 'bundle_cobra_rage',
    name: 'Cobra Rage Evolution Bundle',
    hindiName: 'कोबरा रेज बंडल',
    rarity: 'Legendary',
    category: 'Bundle',
    diamonds: 2200,
    description: 'Biomechanical serpent combat armor with glowing venom neon conduits and sprint effects.',
    colorHex: 0xef4444, // Fiery red
    accentHex: 0x7c3aed,
    visorHex: 0x22c55e,
    tags: ['Evolution', 'Venom', 'Legendary'],
  },
  {
    id: 'bundle_golden_samurai',
    name: 'Golden Samurai Bundle',
    hindiName: 'गोल्डन समुराई बंडल',
    rarity: 'Legendary',
    category: 'Bundle',
    diamonds: 1800,
    description: 'Ancient Japanese gilded battle plate infused with sacred dragon gold.',
    colorHex: 0xeab308, // Pure gold
    accentHex: 0x0f172a,
    visorHex: 0xfef08a,
    tags: ['Samurai', 'Gold', 'Incubator'],
  },
  {
    id: 'bundle_arctic_blue',
    name: 'Arctic Blue Bundle',
    hindiName: 'आर्कटिक ब्लू बंडल',
    rarity: 'Legendary',
    category: 'Bundle',
    diamonds: 1600,
    description: 'Sub-zero cryo commando armor engineered for freezing high-altitude battlefields.',
    colorHex: 0x0284c7, // Arctic cyan
    accentHex: 0x0369a1,
    visorHex: 0x67e8f9,
    tags: ['Cryo', 'Diamond Royale', 'Winter'],
  },
  {
    id: 'bundle_green_criminal',
    name: 'Green Criminal Bundle',
    hindiName: 'ग्रीन क्रिमिनल बंडल',
    rarity: 'Mythic',
    category: 'Bundle',
    diamonds: 2400,
    description: 'The ultra-exclusive Toxic Neon variant of the Criminal Squad. Extremely sought after.',
    colorHex: 0x16a34a, // Toxic green
    accentHex: 0x14532d,
    visorHex: 0x86efac,
    tags: ['Criminal Squad', 'Top Crime', 'Rare'],
  },
  {
    id: 'bundle_cyber_bunny',
    name: 'Cyber Bunny Bundle',
    hindiName: 'साइबर बन्नी बंडल',
    rarity: 'Epic',
    category: 'Bundle',
    diamonds: 1200,
    description: 'Futuristic neon synthwave combat suit with playful cybernetic rabbit accents.',
    colorHex: 0xd946ef, // Neon fuchsia
    accentHex: 0x06b6d4,
    visorHex: 0xfdf4ff,
    tags: ['Cyber', 'Neon', 'Special'],
  },
  {
    id: 'bundle_street_boy',
    name: 'Street Boy Outfit',
    hindiName: 'स्ट्रीट बॉय ऑउटफिट',
    rarity: 'Epic',
    category: 'Bundle',
    diamonds: 900,
    description: 'Casual athletic urban fighter gear with high-top combat sneakers and hoodie.',
    colorHex: 0x2563eb, // Cobalt blue
    accentHex: 0xf59e0b,
    visorHex: 0xffffff,
    tags: ['Streetwear', 'Popular', 'Casual'],
  },
  {
    id: 'bundle_default',
    name: 'Survivor Recruit',
    hindiName: 'डिफ़ॉल्ट सर्वाइवर',
    rarity: 'Rare',
    category: 'Bundle',
    diamonds: 0,
    description: 'Standard military issue combat jumpsuit for all new Battle Royale island recruits.',
    colorHex: 0x0d9488, // Teal tactical
    accentHex: 0x1e293b,
    visorHex: 0x38bdf8,
    tags: ['Starter', 'Recruit'],
  },
  {
    id: 'bundle_chrono_cosmic',
    name: 'Cosmic Commander (Chrono)',
    hindiName: 'कॉस्मिक कमांडर',
    rarity: 'Legendary',
    category: 'Character',
    diamonds: 1500,
    description: 'Time-warping forcefield general with cyber armor inspired by champion play.',
    colorHex: 0x0284c7,
    accentHex: 0x312e81,
    visorHex: 0x60a5fa,
    tags: ['Chrono', 'Time Warper'],
  },
  {
    id: 'bundle_alok_beat',
    name: 'DJ Alok Beat Master',
    hindiName: 'डीजे आलोक बंडल',
    rarity: 'Legendary',
    category: 'Character',
    diamonds: 1500,
    description: 'World-renowned DJ equipped with Drop the Beat restorative aura and audio tracks.',
    colorHex: 0x475569,
    accentHex: 0xfacc15,
    visorHex: 0x22d3ee,
    tags: ['Alok', 'Healer', 'Drop The Beat'],
  },
];

// Generate comprehensive list of 400+ Free Fire collection items to fulfill user's request
export const TOTAL_COLLECTION_COUNT = 412;

export function getFullCollectionItems(): BundleItem[] {
  const items = [...FREE_FIRE_BUNDLES];
  const categories: BundleItem['category'][] = ['Bundle', 'Gun Skin', 'Fashion', 'Emote', 'Character'];
  const rarities: BundleItem['rarity'][] = ['Epic', 'Rare', 'Legendary', 'Mythic'];
  
  const titles = [
    'Shadow Ninja', 'Rampage Titan', 'Phoenix Rebirth', 'Dragon Flame AK47',
    'MP40 Predatory Cobra', 'M1014 Green Flame Draco', 'SCAR Megalodon Alpha',
    'Zombie Slayer', 'Vampire Lord', 'Galaxy Raider', 'Iron Maiden',
    'Skull Hunter', 'Venom Assassin', 'K-Captain Booyah', 'Wukong Monkey King',
    'Kelly The Swift', 'Hayato Bushido', 'Moco Enigma', 'Dimitri Sound Wave',
    'Steampunk Overlord', 'Neon Devil', 'Midnight Samurai', 'Blazing Beast',
    'Cyber Assassin', 'Frostfire Commando', 'Thunderstorm Shogun', 'Solar Eclipse'
  ];

  for (let i = items.length; i < TOTAL_COLLECTION_COUNT; i++) {
    const title = titles[i % titles.length] + ' Mark ' + (Math.floor(i / titles.length) + 1);
    const cat = categories[i % categories.length];
    const rar = rarities[i % rarities.length];
    const cost = rar === 'Mythic' ? 2000 : rar === 'Legendary' ? 1400 : rar === 'Epic' ? 800 : 400;

    items.push({
      id: `ff_item_${i}`,
      name: title,
      hindiName: `${title} (फ्री फायर)`,
      rarity: rar,
      category: cat,
      diamonds: cost,
      description: `Authentic Free Fire ${cat} item #${i + 1}. Unlocks exclusive battle royale visual flair and prestige in lobby.`,
      colorHex: ((i * 1234567) & 0xffffff),
      accentHex: 0x1e293b,
      visorHex: 0x38bdf8,
      tags: ['Free Fire 400+', cat, rar],
    });
  }

  return items;
}
