// SankoQuest Survivors - game data.
// Names, models and metal tiers come from SankoQuest (client code + wiki). Numbers are ours.
// Model paths are relative to /assets/models/ (downloaded from cdn.sankoquest.com).

export const METAL_TIERS = ['Bronze', 'Iron', 'Steel', 'Mithril', 'Adamantite', 'Runite'];
export const MAX_WEAPON_LEVEL = 6;
export const MAX_PASSIVE_LEVEL = 5;
export const MAX_WEAPONS = 6;
export const MAX_PASSIVES = 6;

// ---- enemies ------------------------------------------------------------
// h = rendered height in world units, r = body radius, speed in units/s.
// h is each monster's drawn height, measured from SankoQuest's own scene (2026-11-02, reference/live-capture)
export const ENEMIES = {
  chicken:   { name: 'Chicken',      model: 'mobs/chicken.glb',                  h: 0.65, r: 0.4, hp: 4,   speed: 2.6, dmg: 3,  xp: 1, walk: 'Walk', idle: 'Idle' },
  goblin:    { name: 'Goblin',       model: 'mobs/goblin.glb',                   h: 1.15, r: 0.5, hp: 9,   speed: 2.4, dmg: 5,  xp: 1, walk: 'walk', idle: 'idle' },
  skeleton:  { name: 'Skeleton',     model: 'mobs/Skelly.glb', mixamo: true,     h: 1.5, r: 0.5, hp: 16,  speed: 2.5, dmg: 7,  xp: 2 },
  fox:       { name: 'Fox',          model: 'mobs/fox.glb',                      h: 1.0, r: 0.5, hp: 10,  speed: 4.4, dmg: 5,  xp: 2, walk: 'Run', idle: 'Idle' },
  wolf:      { name: 'Wolf',         model: 'mobs/wolf.glb',                     h: 1.3, r: 0.6, hp: 22,  speed: 4.0, dmg: 8,  xp: 3, walk: 'Walk', idle: 'Idle' },
  scorpion:  { name: 'Scorpion',     model: 'mobs/Scorpion.glb',                 h: 1.1, r: 0.7, hp: 30,  speed: 2.8, dmg: 10, xp: 3, walk: 'Walk', idle: 'Idle' },
  spider:    { name: 'Giant Spider', model: 'mobs/Spider.glb',                   h: 0.8, r: 0.8, hp: 40,  speed: 3.0, dmg: 11, xp: 4, walk: 'walk', idle: 'idle' },
  jspider:   { name: 'Jungle Spider',model: 'mobs/Spider2.glb',                  h: 0.85, r: 0.8, hp: 55,  speed: 3.2, dmg: 13, xp: 5, walk: 'walk', idle: 'idle' },
  pspider:   { name: 'Plasma Spider',model: 'mobs/Spider3.glb',                  h: 0.9, r: 0.9, hp: 80,  speed: 3.4, dmg: 16, xp: 7, walk: 'walk', idle: 'idle' },
  slimer:    { name: 'Slimer',       model: 'mobs/snail/Slimer.glb',             h: 1.3, r: 0.8, hp: 60,  speed: 1.8, dmg: 12, xp: 5, walk: 'walk', idle: 'idle' },
  dwarf:     { name: 'Frost Dwarf',  model: 'mobs/snow_biome/dwarf.glb',         h: 1.5, r: 0.6, hp: 70,  speed: 2.8, dmg: 14, xp: 6, walk: 'walk', idle: 'idle' },
  wight:     { name: 'Frost Wight',  model: 'mobs/snow_biome/frost_wight.glb',   h: 2.0, r: 0.7, hp: 110, speed: 2.9, dmg: 17, xp: 8, walk: 'walk', idle: 'idle' },
  yeti:      { name: 'Yeti',         model: 'mobs/snow_biome/yeti.glb',          h: 2.8, r: 1.0, hp: 190, speed: 3.0, dmg: 22, xp: 12, walk: 'walk', idle: 'idle' },
  // more of the wiki bestiary
  cow:       { name: 'Cow',          model: 'mobs/cow.glb',                      h: 1.3, r: 0.7, hp: 35,  speed: 2.2, dmg: 9,  xp: 3, walk: 'Walk', idle: 'Idle' },
  dog:       { name: 'Dog',          model: 'mobs/dog.glb',                      h: 1.0, r: 0.5, hp: 14,  speed: 4.3, dmg: 6,  xp: 2, walk: 'Walk', idle: 'Idle' },
  camel:     { name: 'Camel',        model: 'mobs/camel.glb',                    h: 1.95, r: 0.9, hp: 75,  speed: 2.7, dmg: 13, xp: 5, walk: 'Walk', idle: 'Idle' },
  alligator: { name: 'Alligator',    model: 'mobs/alligator.glb',                h: 1.0, r: 0.9, hp: 90,  speed: 2.9, dmg: 15, xp: 6, walk: 'walk', idle: 'idle' },
  snowman:   { name: 'Snowman',      model: 'mobs/snowman.glb',                  h: 1.8, r: 0.6, hp: 45,  speed: 2.3, dmg: 10, xp: 4 },
  star:      { name: 'Star',         model: 'mobs/star/Star_tpose.glb', mixamo: true,          h: 1.7, r: 0.6, hp: 38,  speed: 3.1, dmg: 10, xp: 4 },
  starwiz:   { name: 'Star Wizard',  model: 'mobs/star/Star_wizard.glb', mixamo: true,         h: 2.0, r: 0.6, hp: 80,  speed: 2.8, dmg: 15, xp: 7 },
  boatman:   { name: 'Spiky Boatman',model: 'mobs/cactus/Spikey_tpose.glb', mixamo: true,      h: 2.1, r: 0.7, hp: 100, speed: 2.7, dmg: 17, xp: 8 },
  lildragon: { name: 'Lil Dragon',   model: 'mobs/Dragon.glb',                   h: 2.6, r: 1.0, hp: 220, speed: 3.3, dmg: 20, xp: 14, walk: 'Walk', idle: 'Idle' },
  bandit:    { name: 'Bandit',       rig: { hair: 'Short', head: 'Ranger Helmet', chest: 'Ranger Chestplate', hands: 'Ranger Gauntlets', legs: 'Ranger Leggings', feet: 'Ranger Boots' }, h: 1.6, r: 0.5, hp: 28, speed: 3.6, dmg: 9, xp: 3 },
  shapewiz:  { name: 'Shape Wizard', rig: { hair: 'Long', head: 'Shape Wizard Hat', chest: 'Shape Robe', legs: 'Shape Skirt', shirt: 0x7a4ac8 }, h: 1.6, r: 0.5, hp: 70, speed: 3.0, dmg: 15, xp: 7 },
  mslimer:   { name: 'Mutant Slimer',model: 'mobs/snail/mutant slimer.glb',      h: 2.4, r: 1.1, hp: 260, speed: 2.6, dmg: 22, xp: 15, walk: 'walk', idle: 'walk' },
  // bosses
  giant:     { name: 'Lesser Giant', model: 'mobs/giant.glb',                    h: 3.9, r: 1.6, hp: 900,  speed: 2.2, dmg: 28, xp: 60, walk: 'walk', idle: 'idle', boss: true, attacks: ['slam'] },
  ogre:      { name: 'Ogre Warlord', model: 'mobs/snow_biome/ogre.glb',          h: 4.1, r: 1.5, hp: 2200, speed: 2.5, dmg: 34, xp: 120, walk: 'walk', idle: 'idle', boss: true, attacks: ['slam', 'charge'] },
  colossus:  { name: 'Rime Colossus',model: 'mobs/snow_biome/rime_colossus.glb', h: 6.0, r: 2.0, hp: 4200, speed: 2.4, dmg: 40, xp: 200, walk: 'walk', idle: 'idle', boss: true, attacks: ['slam', 'volley'], shot: 'ice' },
  reaper:    { name: 'Pumpkin Reaper', model: 'mobs/halloween/pumpkin-reaper/pumpkin-reaper.glb', h: 4.4, r: 1.5, hp: 3600, speed: 3.1, dmg: 38, xp: 160, walk: 'walk', idle: 'idle', boss: true, attacks: ['charge', 'volley'], shot: 'fire' },
  dragon:    { name: 'Dragon',       model: 'mobs/Dragon.glb',                   h: 3.8, r: 2.4, hp: 9000, speed: 3.4, dmg: 50, xp: 500, walk: 'Walk', idle: 'Idle', boss: true, final: true, attacks: ['volley', 'slam', 'charge'], shot: 'fire' },
};

// Spawn table: from `t` seconds on, these types join the random pool (weight).
export const SPAWN_POOL = [
  { t: 0,   type: 'chicken',  w: 5 },
  { t: 0,   type: 'goblin',   w: 6 },
  { t: 45,  type: 'fox',      w: 3 },
  { t: 75,  type: 'skeleton', w: 5 },
  { t: 150, type: 'wolf',     w: 4 },
  { t: 210, type: 'scorpion', w: 4 },
  { t: 270, type: 'spider',   w: 4 },
  { t: 360, type: 'slimer',   w: 3 },
  { t: 420, type: 'jspider',  w: 4 },
  { t: 480, type: 'dwarf',    w: 3 },
  { t: 540, type: 'wight',    w: 3 },
  { t: 600, type: 'pspider',  w: 4 },
  { t: 660, type: 'yeti',     w: 2 },
  { t: 20,  type: 'dog',      w: 3 },
  { t: 100, type: 'bandit',   w: 4 },
  { t: 180, type: 'cow',      w: 2 },
  { t: 240, type: 'camel',    w: 2 },
  { t: 300, type: 'snowman',  w: 3 },
  { t: 330, type: 'alligator',w: 2 },
  { t: 390, type: 'star',     w: 3 },
  { t: 450, type: 'shapewiz', w: 3 },
  { t: 510, type: 'boatman',  w: 2 },
  { t: 570, type: 'starwiz',  w: 2 },
  { t: 630, type: 'lildragon',w: 2 },
  { t: 600, type: 'mslimer',  w: 2 },
];
// Phase out the weakest types as the run goes on.
export const RETIRE = { chicken: 240, goblin: 420, fox: 420, dog: 360 };

export const BOSS_SCHEDULE = [
  { t: 180, type: 'giant' },
  { t: 360, type: 'ogre' },
  { t: 540, type: 'reaper' },
  { t: 660, type: 'colossus' },
  { t: 720, type: 'dragon' },
];
export const RUN_LENGTH = 900; // 15 minutes: survive, or kill the Dragon to win early

// ---- weapons ------------------------------------------------------------
// stats(level) -> numbers used by the sim. Level 1..6 maps onto METAL_TIERS.
const L = (lvl, base, per) => base + per * (lvl - 1);

export const WEAPONS = {
  katana: {
    name: 'Katana', icon: 'katana', model: 'equipment/weapons/blade/katana/{tier}_katana.glb',
    blurb: 'Slashes the nearest foe in a wide arc.',
    stats: (l) => ({ dmg: L(l, 9, 3.2), cd: L(l, 1.05, -0.09), range: L(l, 3.0, 0.35), arc: L(l, 110, 8), both: l >= 4, kb: 1.2 }),
    next: (l) => ['+damage', '+range', 'slashes both sides', 'faster', '+arc', 'Runite edge'][l - 1] || 'max',
  },
  bow: {
    name: 'Bow', icon: 'bow', model: 'equipment/weapons/ranged/bow/bow.glb', arrowModel: 'equipment/weapons/ranged/arrow/{tier}_arrow.glb',
    blurb: 'Looses arrows at the nearest enemies.',
    stats: (l) => ({ dmg: L(l, 8.5, 2.8), cd: L(l, 1.2, -0.09), count: 1 + Math.floor((l + 0) / 2), speed: 21, pierce: l >= 2 ? 1 + (l >= 5 ? 1 : 0) : 0, life: 1.5 }),
    next: (l) => ['+arrow, pierces', '+damage', '+arrow', 'pierces twice', '+arrow', 'Runite arrows'][l - 1] || 'max',
  },
  axe: {
    name: 'Throwing Axe', icon: 'axe', model: 'equipment/equipment/axe/{tier}_axe.glb',
    blurb: 'Hurls axes that spin through a crowd.',
    stats: (l) => ({ dmg: L(l, 12, 4), cd: L(l, 1.9, -0.15), count: 1 + Math.floor((l - 1) / 2), speed: 8.5, life: 1.7, r: L(l, 0.8, 0.12) }),
    next: (l) => ['+damage', '+axe', '+size', '+axe', '+size', 'Runite axe'][l - 1] || 'max',
  },
  shield: {
    name: 'Kiteshield', icon: 'shield', model: 'equipment/offhand/kiteshield/{tier}_kiteshield.glb',
    blurb: 'Shields circle you and batter anything near.',
    stats: (l) => ({ dmg: L(l, 6, 2.2), count: 1 + Math.floor((l + 1) / 2), radius: L(l, 2.4, 0.15), spin: L(l, 2.4, 0.25), hitcd: 0.45, r: 0.7 }),
    next: (l) => ['+damage', '+shield', '+speed', '+shield', '+damage', 'Runite wall'][l - 1] || 'max',
  },
  staff: {
    name: 'Shard Staff', icon: 'staff', model: 'equipment/weapons/staff/staff.glb',
    blurb: 'Fires homing shard bolts that burst on impact.',
    stats: (l) => ({ dmg: L(l, 11, 3.2), cd: L(l, 1.2, -0.09), count: 1 + Math.floor((l + 1) / 3), speed: 14, burst: l >= 2 ? L(l, 1.5, 0.25) : 0, life: 2.2 }),
    next: (l) => ['+bolt, bolts burst', '+burst', '+damage', '+bolt', '+burst', 'Void shards'][l - 1] || 'max',
  },
  pickaxe: {
    name: 'Pickaxe Quake', icon: 'pickaxe', model: 'equipment/equipment/pickaxe/{tier}_pickaxe.glb',
    blurb: 'Slams the ground, hurting and shoving everything nearby.',
    stats: (l) => ({ dmg: L(l, 18, 5.5), cd: L(l, 2.6, -0.24), radius: L(l, 3.5, 0.5), kb: 3.5 }),
    next: (l) => ['+radius', '+damage', 'faster', '+radius', '+damage', 'Runite quake'][l - 1] || 'max',
  },
  greatsword: {
    name: 'Two-handed Sword', icon: '2hd', model: 'equipment/weapons/blade/2hd/{tier}_2hd.glb',
    blurb: 'Every few seconds, a full spin that throws everything back.',
    stats: (l) => ({ dmg: L(l, 15, 5), cd: L(l, 2.8, -0.22), range: L(l, 3.3, 0.3), kb: 2.8 }),
    next: (l) => ['+damage', '+range', 'faster', '+damage', '+range', 'Runite blade'][l - 1] || 'max',
  },
  shortsword: {
    name: 'Short Swords', icon: 'shortsword', model: 'equipment/weapons/blade/shortsword/{tier}_shortsword.glb',
    blurb: 'Throws short swords at the nearest monster.',
    stats: (l) => ({ dmg: L(l, 7.5, 2.2), cd: L(l, 0.55, -0.035), count: 1 + Math.floor(l / 2), speed: 22, pierce: l >= 4 ? 1 : 0, life: 1.0 }),
    next: (l) => ['+sword', '+damage', '+sword, pierces', '+damage', '+sword', 'Runite swords'][l - 1] || 'max',
  },
  baseball: {
    name: 'Baseball', icon: 'baseball', model: null,
    blurb: 'A ball that ricochets from monster to monster.',
    stats: (l) => ({ dmg: L(l, 10, 3), cd: L(l, 1.45, -0.08), count: 1, speed: 17, bounces: 2 + Math.floor(l / 2), life: 2.4, r: 0.45, kb: 1.6 }),
    next: (l) => ['+bounce', '+damage', '+bounce', 'faster', '+bounce', 'Home run ready'][l - 1] || 'max',
  },
  lighter: {
    name: 'Lighter', icon: 'lighter', model: null,
    blurb: 'A ring of fire around you burns anything that comes close.',
    stats: (l) => ({ dmg: L(l, 6.5, 2.2), radius: L(l, 2.6, 0.28), tick: 0.45 }),
    next: (l) => ['+radius', '+damage', '+radius', '+damage', '+radius', 'Inferno ready'][l - 1] || 'max',
  },
};
export const WEAPON_IDS = Object.keys(WEAPONS);

// ---- passives -----------------------------------------------------------
// Each passive is a real SankoQuest item (names and icons from the item catalog).
export const PASSIVES = {
  might:   { name: 'Power Amulet',  item: 'Power Amulet',  blurb: '+12% damage per level.' },
  haste:   { name: 'Spirit Shard',  item: 'Spirit Shard',    blurb: '-7% cooldowns per level. Shields and the Lighter hit more often.' },
  vigor:   { name: 'Cooked Meat',   item: 'Cooked Meat',   blurb: '+20 max HP and slow regeneration per level.' },
  boots:   { name: 'Winged Boots',  item: 'Winged Boots',  blurb: '+8% move speed per level.' },
  magnet:  { name: 'Warp Shard',    item: 'Warp Shard',    blurb: '+30% pickup range per level.' },
  armor:   { name: 'Plate Armor',   item: 'Bronze Chestplate', blurb: '-1 damage taken per level. You wear each new tier.' },
  growth:  { name: 'Wizard Hat',    item: 'Wizard Hat',    blurb: '+10% experience per level.' },
  area:    { name: 'Cape',          item: 'Cape',          blurb: '+10% attack area per level. Arrows and thrown swords hit wider too.' },
  amount:  { name: 'Feather',       item: 'Feather',       blurb: '+1 projectile from every weapon that throws or fires (+2 at level 4), and they fly 6% farther per level.' },
  crit:    { name: 'Amanita',       item: 'Amanita',       blurb: '+5% critical chance per level; critical hits hit harder too.' },
  thorns:  { name: 'Scorpion Carapace', item: 'Scorpion Carapace', blurb: 'Monsters that hit you take 8 damage per level back.' },
  greed:   { name: 'Rusty Key',     item: 'Rusty Key',     blurb: '+15% coins and more reward caskets per level.' },
};
export const ARMOR_TIERS = ['Bronze', 'Iron', 'Steel', 'Mithril', 'Adamantite'];
// Real item name to show for a passive at a level.
export function passiveItem(id, level) {
  if (id === 'armor') return `${ARMOR_TIERS[Math.min(level, 5) - 1] || 'Bronze'} Chestplate`;
  return PASSIVES[id].item;
}
export function passiveTitle(id, level) { return id === 'armor' ? `${ARMOR_TIERS[Math.min(level, 5) - 1]} Armor` : PASSIVES[id].name; }
// Real item name to show for a weapon at a level.
const SHARDS = ['Air', 'Water', 'Earth', 'Fire', 'Spirit', 'Void'];
export function weaponItem(id, level) {
  const t = METAL_TIERS[Math.min(level, 6) - 1];
  switch (id) {
    case 'katana': return `${t} Katana`;
    case 'axe': return `${t} Axe`;
    case 'pickaxe': return `${t} Pickaxe`;
    case 'shield': return `${t} Kiteshield`;
    case 'greatsword': return `${METAL_TIERS[Math.min(level, 5) - 1]} 2hd Sword`;
    case 'shortsword': return `${METAL_TIERS[Math.min(level, 5) - 1]} Short Sword`;
    case 'bow': return ['Bow', 'Oak Bow', 'Oak Bow', 'Cherry Bow', 'Cherry Bow', 'Glacial Bow'][level - 1] || 'Bow';
    case 'baseball': return 'Baseball';
    case 'lighter': return 'Lighter';
    default: return 'Staff';
  }
}
export function weaponTitle(id, level) { return id === 'staff' ? `Staff · ${SHARDS[Math.min(level, 6) - 1]} Shard` : weaponItem(id, level); }
export const itemIconFile = (name) => `item_${name.replace(' Short Sword', ' Sword').replace(/^Lighter$/, 'Lighter2').replace(/ /g, '_')}.png`;
// XP gems are shards: bigger kills drop rarer shards.
// experience is always Air Shards; bigger ones are worth more and drawn larger
export function gemItem() { return 'Air Shard'; }
export const GEM_COLORS = { 'Air Shard': 0xb8e4ff, 'Water Shard': 0x4aa8ff, 'Earth Shard': 0x7bd04f, 'Fire Shard': 0xff7a30, 'Void Shard': 0xb25cff };
export const PASSIVE_IDS = Object.keys(PASSIVES);

// ---- evolutions: a weapon at its last level plus a passive (any level) can evolve ------------------------
export const EVOLUTIONS = {
  katana:  { passive: 'might',  name: 'Shadowfang Axe', item: 'Shadowfang Axe', blurb: 'Spins a full circle, hits harder, and heals on every hit.' },
  bow:     { passive: 'boots',  name: 'Glacial Bow',    item: 'Glacial Bow',    blurb: 'Volleys of arrows that pierce everything.' },
  axe:     { passive: 'vigor',  name: 'Runite Axe Storm', item: 'Runite Axe',   blurb: 'Twice the axes, bigger and heavier.' },
  shield:  { passive: 'armor',  name: 'Ogre Shield',    item: 'Ogre Shield',    blurb: 'More shields, wider orbit, brutal knockback.' },
  staff:   { passive: 'growth', name: 'Void Staff',     item: 'Void Shard',     blurb: 'More bolts that burst in huge blasts.' },
  pickaxe: { passive: 'haste',  name: 'Earthshaker',    item: 'Earth Shard',    blurb: 'Faster, wider quakes.' },
  greatsword: { passive: 'vigor', name: 'Bloodspinner', item: 'Adamantite 2hd Sword', blurb: 'Spins twice as often, wider, and heals you with every spin.' },
  shortsword: { passive: 'magnet', name: 'Swordstorm',  item: 'Adamantite Short Sword', blurb: 'A ring of swords in every direction that pierces everything.' },
  baseball: { passive: 'amount', name: 'Home Run',      item: 'Baseball',       blurb: 'Two balls at once that bounce eight times and knock monsters flying.' },
  lighter:  { passive: 'crit',   name: 'Inferno',       item: 'Fire Shard',     blurb: 'A wide blazing ring that burns twice as hard.' },
};
export function weaponDisplay(id, level, evo) {
  if (evo && EVOLUTIONS[id]) return { name: EVOLUTIONS[id].name, item: EVOLUTIONS[id].item };
  return { name: weaponTitle(id, level), item: weaponItem(id, level) };
}
export function evolveStats(id, s) {
  s = { ...s };
  switch (id) {
    case 'katana': s.arc = 360; s.both = false; s.dmg *= 1.6; s.range *= 1.25; s.lifesteal = 1; break;
    case 'bow': s.count += 3; s.pierce = 99; s.dmg *= 1.3; break;
    case 'axe': s.count *= 2; s.dmg *= 1.5; s.r *= 1.4; break;
    case 'shield': s.count += 2; s.radius *= 1.3; s.dmg *= 1.8; s.hitcd *= 0.7; break;
    case 'staff': s.count += 2; s.burst = Math.max(s.burst, 2.5) * 1.3; s.dmg *= 1.5; break;
    case 'pickaxe': s.radius *= 1.5; s.cd *= 0.6; s.dmg *= 1.6; break;
    case 'greatsword': s.cd *= 0.5; s.dmg *= 1.4; s.range *= 1.2; s.heal = 4; break;
    case 'shortsword': s.ring = true; s.count = 10; s.pierce = 99; s.dmg *= 1.2; break;
    case 'baseball': s.count += 1; s.bounces = 8; s.dmg *= 1.4; s.kb = 4; s.cd *= 0.8; break;
    case 'lighter': s.radius *= 1.5; s.dmg *= 2; s.tick *= 0.8; break;
  }
  return s;
}

// ---- permanent upgrades bought with coins: SankoQuest's skills ----------------------------------------------
export const SKILLS = {
  combat:      { name: 'Combat',      icon: 'attack',      blurb: '+4% damage per level.' },
  magic:       { name: 'Magic',       icon: 'magic',       blurb: '+10% pickup range per level.' },
  mining:      { name: 'Mining',      icon: 'mining',      blurb: '+1 armor at levels 2 and 4.' },
  smithing:    { name: 'Smithing',    icon: 'smithing',    blurb: '+8 max HP per level.' },
  woodcutting: { name: 'Woodcutting', icon: 'woodcutting', blurb: '+3% move speed per level.' },
  fletching:   { name: 'Fletching',   icon: 'crafting',   blurb: '-3% cooldowns per level.' },
  fishing:     { name: 'Fishing',     icon: 'fishing',     blurb: 'Food heals 12% more per level.' },
  cooking:     { name: 'Cooking',     icon: 'cooking',     blurb: 'Regenerate 0.1 HP/s per level.' },
  herblore:    { name: 'Mixnometry',  icon: 'mixnometry',  blurb: '+5% experience per level.' },
};
export const SKILL_IDS = Object.keys(SKILLS);
export const SKILL_MAX = 5;
export const skillCost = (level) => Math.round(60 * (level + 1) ** 1.7);

// ---- adventurers: different people, each with a look, a starting weapon and a small bonus ----------------------
// look uses the real modular character parts (hair, skin, shirt colours, worn armor pieces by item name).
export const ADVENTURERS = [
  { id: 'adventurer', name: 'The Adventurer', weapon: 'katana',  unlock: 0, bonus: { speed: 0.06 },  blurb: 'Quick on their feet.',               look: { hair: 'Short', hairColor: 0x6b4423, skin: 0xdfaa8b, shirt: 0xb98a45, pants: 0x4a4f63, armor: {} } },
  { id: 'knight',     name: 'Bronze Knight',  weapon: 'shield',  unlock: 0, bonus: { armor: 1 },     blurb: 'Starts armored and hard to move.',    look: { hair: 'Shaggy', hairColor: 0x2a1c12, skin: 0xc4926b, armor: { head: 'Bronze Helmet', chest: 'Bronze Chestplate', hands: 'Bronze Gauntlets', legs: 'Bronze Leggings', feet: 'Bronze Boots' } } },
  { id: 'ranger',     name: 'Ranger',         weapon: 'bow',     unlock: 0, bonus: { magnet: 0.3 },  blurb: 'Sees loot from further away.',        look: { hair: 'Pomp', hairColor: 0xa75c19, skin: 0xe2c4af, armor: { head: 'Ranger Helmet', chest: 'Ranger Chestplate', hands: 'Ranger Gauntlets', legs: 'Ranger Leggings', feet: 'Ranger Boots' } } },
  { id: 'wizard',     name: 'Wizard',         weapon: 'staff',   unlock: 1, bonus: { growth: 0.12 }, blurb: 'Learns faster.',                      look: { hair: 'Long', hairColor: 0xdddddd, skin: 0xdfaa8b, armor: { head: 'Wizard Hat', chest: 'Wizard Robe', legs: 'Wizard Skirt' } } },
  { id: 'farmer',     name: 'Farmer',         weapon: 'axe',     unlock: 1, bonus: { hp: 25 },       blurb: 'Tough from a life of chores.',         look: { hair: 'Middle Part', hairColor: 0x996f5f, skin: 0xd0a173, shirt: 0x6b8f4e, pants: 0x6a5238, armor: { head: 'Straw Hat', feet: 'Quilted Boots' } } },
  { id: 'miner',      name: 'Miner',          weapon: 'pickaxe', unlock: 2, bonus: { dmg: 0.1 },     blurb: 'Hits the ground running.',            look: { hair: 'Sideswept', hairColor: 0x4a3426, skin: 0xbe8e60, shirt: 0x8a8a8a, pants: 0x3b4252, armor: { head: 'Bowler Hat', feet: 'Iron Boots' } } },
  { id: 'shape',      name: 'Shape Wizard',   weapon: 'staff',   unlock: 3, bonus: { haste: 0.1 },   blurb: 'Casts a little faster.',              look: { hair: 'Buns', hairColor: 0xc4926b, skin: 0xe7c4a9, armor: { head: 'Shape Wizard Hat', chest: 'Shape Robe', legs: 'Shape Skirt' } } },
  { id: 'swordsman',  name: 'Swordsman',      weapon: 'greatsword', unlock: 2, bonus: { hp: 15, armor: 1 }, blurb: 'A great blade and the shoulders for it.', look: { hair: 'Shaggy', hairColor: 0x3b2a1d, skin: 0xc79a73, armor: { head: 'Iron Helmet', chest: 'Iron Chestplate', hands: 'Iron Gauntlets', legs: 'Iron Leggings', feet: 'Iron Boots' } } },
  { id: 'rogue',      name: 'Rogue',          weapon: 'shortsword', unlock: 2, bonus: { speed: 0.08 },  blurb: 'Quick hands, quicker feet.',          look: { hair: 'Liberty Spikes', hairColor: 0x1c1c22, skin: 0xe2b996, shirt: 0x2f3b2c, pants: 0x262a33, armor: { head: 'Beret', feet: 'Green Boots' } } },
  { id: 'alex',       name: 'Alex',           weapon: 'greatsword', unlock: 0, special: true, startPassives: { boots: 1 }, bonus: { hp: 40, armor: 1 }, blurb: 'Washed up on Tutorial Island in bronze, with winged boots.', look: { hair: 'Short', hairColor: 0x4a3426, skin: 0xdfaa8b, armor: { head: 'Bronze Helmet', chest: 'Bronze Chestplate', hands: 'Bronze Gauntlets', legs: 'Bronze Leggings', feet: 'Winged Boots' } } },
  { id: 'jack',       name: 'Pumpkin Jack',   weapon: 'katana',  unlock: 4, bonus: { dmg: 0.08, speed: 0.04 }, blurb: 'Lost his head, found a pumpkin.', look: { hair: null, skin: 0xdfaa8b, shirt: 0x6a3a1a, pants: 0x2c2c33, armor: { head: 'Pumpkin Head', feet: 'Green Boots' } } },
];
export const ADVENTURER_BY_ID = Object.fromEntries(ADVENTURERS.map((a) => [a.id, a]));

export const PLAYER_BASE = { hp: 120, speed: 5.4, magnet: 2.8, radius: 0.5 };

export function xpForLevel(level) {
  return Math.round(4 + level * 2.6 + level * level * 0.65);
}

export function tierName(level) {
  return METAL_TIERS[Math.min(level, MAX_WEAPON_LEVEL) - 1];
}

export function weaponModelPath(id, level, key = 'model') {
  const w = WEAPONS[id]; if (!w || !(w[key] || w.model)) return null;
  const tier = tierName(level).toLowerCase().replace('adamantite', 'adamantite');
  return (w[key] || w.model).replace('{tier}', tier);
}

// ---- maps: real regions of the SankoQuest world ---------------------------------------------------------
// cx/cz = centre in world units (the minimap is 4 px per unit), r = how far you can run. Props come from the real world scene.
const P = (t, type, w) => ({ t, type, w });
export const MAPS = [
  {
    id: 'greentown', name: 'Greentown', blurb: 'The village square and the castle, where every run begins.',
    cx: 365, cz: 300, r: 1000, sky: 0x9ac7e8, fog: 0x9ac7e8, light: 1, music: 'early', length: RUN_LENGTH, finalBoss: 'dragon',
    pool: SPAWN_POOL, retire: RETIRE, bosses: BOSS_SCHEDULE,
    events: ['stampede', 'treasure', 'swarm', 'meteors'], // the chickens have had enough
  },
  {
    id: 'apache', name: 'Apache Desert', blurb: 'Scorpions, camels and bandits in the shadow of the sphinx.',
    cx: 192, cz: 78, r: 1000, sky: 0xf2dca4, fog: 0xf2dca4, light: 1.15, music: 'mid', length: RUN_LENGTH, finalBoss: 'dragon',
    pool: [P(0, 'scorpion', 6), P(0, 'fox', 4), P(40, 'bandit', 5), P(90, 'camel', 3), P(170, 'spider', 4), P(250, 'alligator', 2), P(300, 'skeleton', 4), P(340, 'jspider', 3), P(420, 'mslimer', 2), P(500, 'boatman', 3), P(560, 'star', 3), P(620, 'pspider', 3)],
    retire: { fox: 360 },
    events: ['sandstorm', 'sandstorm', 'treasure', 'swarm', 'meteors'], // desert winds
    bosses: [{ t: 180, type: 'giant' }, { t: 360, type: 'ogre' }, { t: 600, type: 'colossus' }, { t: 720, type: 'dragon' }],
  },
  {
    id: 'duel', name: 'Fighting Forum', blurb: 'The duel arena and its town of bandits, wizards and sword-fighters. Champions step up to fight you.',
    cx: 95, cz: 120, r: 1000, sky: 0xe6d6b4, fog: 0xe6d6b4, light: 1.1, music: 'mid', length: RUN_LENGTH, finalBoss: 'colossus',
    pool: [P(0, 'bandit', 6), P(0, 'goblin', 4), P(60, 'skeleton', 5), P(120, 'wolf', 4), P(200, 'shapewiz', 4), P(300, 'scorpion', 3), P(400, 'spider', 3), P(500, 'starwiz', 3), P(600, 'jspider', 3)],
    retire: { goblin: 360 },
    events: ['duel', 'duel', 'treasure', 'swarm', 'meteors'], // champions of the arena
    bosses: [{ t: 200, type: 'giant' }, { t: 420, type: 'ogre' }, { t: 600, type: 'reaper' }, { t: 720, type: 'colossus' }],
  },
  {
    id: 'graves', name: 'Chapel Graves', blurb: 'The chapel and the cemetery. The dead do not stay down.',
    cx: 255, cz: 250, r: 1000, sky: 0x33464f, fog: 0x33464f, light: 0.85, music: 'final', length: RUN_LENGTH, finalBoss: 'reaper',
    pool: [P(0, 'skeleton', 8), P(0, 'dog', 2), P(60, 'star', 4), P(120, 'wolf', 3), P(180, 'spider', 4), P(260, 'shapewiz', 4), P(340, 'snowman', 3), P(440, 'starwiz', 3), P(540, 'jspider', 3), P(640, 'pspider', 3)],
    retire: { dog: 240 },
    events: ['rising', 'rising', 'treasure', 'swarm', 'meteors'], // the dead do not stay down
    bosses: [{ t: 240, type: 'giant' }, { t: 450, type: 'ogre' }, { t: 720, type: 'reaper' }],
  },
  {
    id: 'swamp', name: 'The Wilderness', blurb: 'The swamp west of Greentown: slimers, spiders and things in the water.',
    cx: 195, cz: 280, r: 1000, sky: 0x93b08a, fog: 0x93b08a, light: 0.9, music: 'late', length: RUN_LENGTH, finalBoss: 'ogre',
    pool: [P(0, 'fox', 5), P(0, 'goblin', 4), P(40, 'spider', 4), P(80, 'slimer', 4), P(150, 'alligator', 3), P(200, 'jspider', 4), P(260, 'wolf', 3), P(340, 'mslimer', 3), P(420, 'skeleton', 3), P(520, 'pspider', 4), P(620, 'lildragon', 2)],
    retire: { fox: 200, goblin: 260, spider: 420 },
    events: ['ambush', 'ambush', 'treasure', 'swarm', 'meteors'], // things in the water
    bosses: [{ t: 200, type: 'giant' }, { t: 480, type: 'colossus' }, { t: 720, type: 'ogre' }],
  },
  {
    id: 'goblins', name: 'Goblin War', blurb: 'North of Greentown, where the goblin camps fight over the ruins.',
    cx: 352, cz: 108, r: 1000, sky: 0xa9c3d6, fog: 0xa9c3d6, light: 1, music: 'mid', length: RUN_LENGTH, finalBoss: 'ogre',
    pool: [P(0, 'goblin', 9), P(40, 'bandit', 4), P(100, 'wolf', 3), P(180, 'dwarf', 3), P(260, 'shapewiz', 3), P(340, 'jspider', 3), P(440, 'wight', 3), P(540, 'yeti', 2), P(640, 'lildragon', 2)],
    retire: { goblin: 600 },
    events: ['warband', 'warband', 'treasure', 'swarm', 'meteors'], // the goblin camps send warbands
    bosses: [{ t: 180, type: 'giant' }, { t: 420, type: 'ogre' }, { t: 660, type: 'colossus' }, { t: 780, type: 'ogre' }],
  },
  {
    id: 'paya', name: 'Payasan Village', blurb: 'The snowy village east of the desert lake: stars, wizards, snowmen and a yeti.',
    cx: 243, cz: 106, r: 1000, sky: 0xcfe0f0, fog: 0xcfe0f0, light: 1, music: 'boss', length: RUN_LENGTH, finalBoss: 'dragon',
    pool: [P(0, 'dog', 5), P(0, 'chicken', 4), P(50, 'bandit', 4), P(90, 'snowman', 4), P(180, 'camel', 3), P(260, 'star', 4), P(340, 'shapewiz', 4), P(420, 'yeti', 1), P(430, 'starwiz', 3), P(520, 'boatman', 3), P(620, 'lildragon', 3)],
    retire: { chicken: 240, dog: 360 },
    events: ['blizzard', 'blizzard', 'treasure', 'swarm', 'meteors'], // snow country
    bosses: [{ t: 210, type: 'giant' }, { t: 420, type: 'reaper' }, { t: 620, type: 'colossus' }, { t: 720, type: 'dragon' }],
  },
  {
    id: 'tutorial', name: 'Tutorial Island', special: true, forceAdv: 'alex', blurb: 'Where every adventurer washes up. You play as Alex. A gentler ten minutes, open from the start.',
    cx: 82, cz: 248, r: 1000, sky: 0xa8d4f0, fog: 0xa8d4f0, light: 1.05, music: 'early', length: 600, finalBoss: 'ogre',
    pool: [P(0, 'chicken', 6), P(0, 'cow', 3), P(30, 'goblin', 5), P(90, 'dog', 3), P(150, 'fox', 3), P(240, 'spider', 4), P(330, 'skeleton', 4), P(420, 'wolf', 3), P(500, 'jspider', 3)],
    retire: { chicken: 200, cow: 260 },
    bosses: [{ t: 240, type: 'giant' }, { t: 480, type: 'ogre' }],
  },
  {
    id: 'world', name: 'The Whole World', special: true, world: true,
    blurb: 'All of SankoQuest at once. Thirty minutes, and the monsters change with the land you are in.',
    cx: 365, cz: 300, r: 1000, sky: 0x9ac7e8, fog: 0x9ac7e8, light: 1, music: 'early', length: 1800, finalBoss: 'dragon',
    pool: SPAWN_POOL, retire: RETIRE,
    bosses: [{ t: 180, type: 'giant' }, { t: 420, type: 'ogre' }, { t: 660, type: 'reaper' }, { t: 900, type: 'colossus' }, { t: 1140, type: 'ogre' }, { t: 1380, type: 'colossus' }, { t: 1560, type: 'dragon' }],
  },
];
export const MAP_BY_ID = Object.fromEntries(MAPS.map((m) => [m.id, m]));

// ---- gear: worn items won from reward caskets and quests, kept between runs ---------------------------------------
// Every piece is a real SankoQuest item with its own model on the character. Bonus keys: armor, dmg, haste (cooldown cut),
// speed, magnet, growth (xp), hp, regen, coin (coin drop chance).
export const GEAR_SLOTS = ['head', 'chest', 'hands', 'legs', 'feet', 'back'];
export const GEAR_SLOT_NAMES = { head: 'Head', chest: 'Body', hands: 'Hands', legs: 'Legs', feet: 'Feet', back: 'Back' };
const METAL_PIECES = [['head', 'Helmet'], ['chest', 'Chestplate'], ['hands', 'Gauntlets'], ['legs', 'Leggings'], ['feet', 'Boots']];
export const GEAR = {};
ARMOR_TIERS.forEach((t, i) => {
  for (const [slot, piece] of METAL_PIECES) GEAR[`${t} ${piece}`] = { slot, set: t, tier: i, bonus: { armor: [0.2, 0.3, 0.4, 0.5, 0.6][i] } };
});
Object.assign(GEAR, {
  'Ranger Helmet':      { slot: 'head',  set: 'Ranger', tier: 2, bonus: { dmg: 0.03, magnet: 0.06 } },
  'Ranger Chestplate':  { slot: 'chest', set: 'Ranger', tier: 2, bonus: { dmg: 0.03, armor: 0.2 } },
  'Ranger Gauntlets':   { slot: 'hands', set: 'Ranger', tier: 2, bonus: { dmg: 0.03 } },
  'Ranger Leggings':    { slot: 'legs',  set: 'Ranger', tier: 2, bonus: { dmg: 0.03, speed: 0.02 } },
  'Ranger Boots':       { slot: 'feet',  set: 'Ranger', tier: 2, bonus: { dmg: 0.03, speed: 0.02 } },
  'Wizard Hat':         { slot: 'head',  set: 'Wizard', tier: 1, bonus: { growth: 0.05 } },
  'Wizard Robe':        { slot: 'chest', set: 'Wizard', tier: 1, bonus: { growth: 0.05, hp: 5 } },
  'Wizard Skirt':       { slot: 'legs',  set: 'Wizard', tier: 1, bonus: { growth: 0.05 } },
  'Shape Wizard Hat':   { slot: 'head',  set: 'Shape', tier: 3, bonus: { haste: 0.03 } },
  'Shape Robe':         { slot: 'chest', set: 'Shape', tier: 3, bonus: { haste: 0.03, hp: 5 } },
  'Shape Skirt':        { slot: 'legs',  set: 'Shape', tier: 3, bonus: { haste: 0.03 } },
  'Mystic Hat':         { slot: 'head',  tier: 3, bonus: { haste: 0.06 } },
  'Straw Hat':          { slot: 'head',  tier: 0, bonus: { hp: 10 } },
  'Bowler Hat':         { slot: 'head',  tier: 1, bonus: { coin: 0.5 } },
  'Beret':              { slot: 'head',  tier: 1, bonus: { speed: 0.04 } },
  'Hamburger Hat':      { slot: 'head',  tier: 2, bonus: { regen: 0.3 } },
  'Pumpkin Head':       { slot: 'head',  tier: 4, bonus: { dmg: 0.08 } },
  'Winged Boots':       { slot: 'feet',  tier: 3, bonus: { speed: 0.08 } },
  'Green Boots':        { slot: 'feet',  tier: 1, bonus: { speed: 0.05 } },
  'Quilted Boots':      { slot: 'feet',  tier: 0, bonus: { hp: 8 } },
  'Uggs Boots':         { slot: 'feet',  tier: 2, bonus: { regen: 0.2, hp: 5 } },
  'Cape':               { slot: 'back',  tier: 2, bonus: { growth: 0.04, speed: 0.03 } },
});
export const GEAR_SETS = {
  Ranger:     { pieces: 5, bonus: { dmg: 0.12 },  text: '+12% damage' },
  Wizard:     { pieces: 3, bonus: { haste: 0.08 }, text: '-8% cooldowns' },
  Shape:      { pieces: 3, bonus: { dmg: 0.1 },   text: '+10% damage' },
  Bronze:     { pieces: 5, bonus: { hp: 15 },     text: '+15 max HP' },
  Iron:       { pieces: 5, bonus: { hp: 20 },     text: '+20 max HP' },
  Steel:      { pieces: 5, bonus: { hp: 25, armor: 0.5 }, text: '+25 max HP, +0.5 armor' },
  Mithril:    { pieces: 5, bonus: { hp: 30, speed: 0.04 }, text: '+30 max HP, +4% speed' },
  Adamantite: { pieces: 5, bonus: { hp: 40, armor: 1 }, text: '+40 max HP, +1 armor' },
};
const BONUS_TEXT = { armor: (v) => `+${v} armor`, dmg: (v) => `+${Math.round(v * 100)}% damage`, haste: (v) => `-${Math.round(v * 100)}% cooldowns`, speed: (v) => `+${Math.round(v * 100)}% speed`,
  magnet: (v) => `+${Math.round(v * 100)}% pickup range`, growth: (v) => `+${Math.round(v * 100)}% experience`, hp: (v) => `+${v} max HP`, regen: (v) => `+${v} HP/s`, coin: (v) => `+${Math.round(v * 100)}% coins` };
export const bonusText = (b) => Object.entries(b).map(([k, v]) => BONUS_TEXT[k](Math.round(v * 100) / 100)).join(', ');
// the Armoury: each piece can be reinforced three times with coins, +25% of its bonus each time
export const GEAR_MAX_LV = 3;
export const gearUpgradeCost = (name, lv) => Math.round((50 + 35 * ((GEAR[name] && GEAR[name].tier) || 0)) * (lv + 1) ** 1.6);
/** total bonus of a gear loadout {slot: itemName} (with Armoury levels {itemName: 0..3}), with any completed set */
export function gearBonus(gear = {}, levels = {}) {
  const out = {}; const add = (b, m = 1) => { for (const [k, v] of Object.entries(b)) out[k] = (out[k] || 0) + v * m; };
  const sets = {};
  for (const name of Object.values(gear)) { const g = GEAR[name]; if (!g) continue; add(g.bonus, 1 + 0.25 * Math.min(GEAR_MAX_LV, levels[name] || 0)); if (g.set) sets[g.set] = (sets[g.set] || 0) + 1; }
  const done = [];
  for (const [s, c] of Object.entries(sets)) if (GEAR_SETS[s] && c >= GEAR_SETS[s].pieces) { add(GEAR_SETS[s].bonus); done.push(s); }
  out.sets = done;
  return out;
}
/** what a reward casket holds: better tiers on later maps and in hard mode */
export function rollCasket(rng, mapIndex = 0, hard = false) {
  const top = Math.min(4, 1 + mapIndex + (hard ? 1 : 0));
  const names = Object.keys(GEAR).filter((n) => GEAR[n].tier <= top);
  const weight = (n) => { const g = GEAR[n]; return (g.set && ARMOR_TIERS.includes(g.set) ? 3 : 1.4) * (1 + top - g.tier); };
  let total = 0; for (const n of names) total += weight(n);
  let r = rng() * total; for (const n of names) { if ((r -= weight(n)) <= 0) return n; }
  return names[names.length - 1];
}

// ---- quests: long tasks over many runs, paid in coins and gear -----------------------------------------------------
// stat: a counter kept across runs (kills.<type>, kills, bosses, bestTime, evolves, caskets, cleared, dragons)
export const QUESTS = [
  { id: 'goblins',  name: 'Goblin War',    text: 'Slay 300 goblins.',                stat: 'kills.goblin',   goal: 300,  coins: 150, item: 'Bowler Hat' },
  { id: 'spiders',  name: 'Webs of the Wilderness',     text: 'Slay 400 spiders of any kind.',    stat: 'kills.spiders',  goal: 400,  coins: 200, item: 'Green Boots' },
  { id: 'bones',    name: 'Chapel Graves Cleanup',    text: 'Slay 250 skeletons.',              stat: 'kills.skeleton', goal: 250,  coins: 200, item: 'Beret' },
  { id: 'survivor', name: "Sankson's Survival Test",       text: 'Survive 10:00 in a single run.',   stat: 'bestTime',       goal: 600,  coins: 200, item: 'Cape' },
  { id: 'giants',   name: 'Big Game Hunt',      text: 'Defeat 5 bosses.',                 stat: 'bosses',         goal: 5,    coins: 250, item: 'Mystic Hat' },
  { id: 'smith',    name: 'Air Shard Smithing', text: 'Evolve 3 weapons.',               stat: 'evolves',        goal: 3,    coins: 300, item: 'Winged Boots' },
  { id: 'caskets',  name: 'Casket Cracker',   text: 'Open 10 reward caskets.',          stat: 'caskets',        goal: 10,   coins: 200, item: 'Hamburger Hat' },
  { id: 'tour',     name: 'Desert Adventure',        text: 'Clear 3 different maps, from Greentown to the desert.',          stat: 'cleared',        goal: 3,    coins: 500, item: 'Uggs Boots' },
  { id: 'horde',    name: 'The Horde',     text: 'Slay 5,000 monsters.',             stat: 'kills',          goal: 5000, coins: 400 },
  { id: 'dragon',   name: "Dragon's End",     text: 'Defeat the Dragon.',               stat: 'dragons',        goal: 1,    coins: 600, item: 'Adamantite Helmet' },
];
export const REROLLS_PER_RUN = 3;
