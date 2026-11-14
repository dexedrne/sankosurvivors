// SankoQuest Survivors - game data.
// Names, models and metal tiers come from SankoQuest (client code + wiki). Numbers are ours.
// Model paths are relative to /assets/models/ (downloaded from cdn.sankoquest.com).

export const METAL_TIERS = ['Bronze', 'Iron', 'Steel', 'Mithril', 'Adamantite', 'Runite'];
export const MAX_WEAPON_LEVEL = 6;
export const MAX_PASSIVE_LEVEL = 5;
export const MAX_WEAPONS = 4;
export const MAX_PASSIVES = 4;

// Inspected submerged cells within the two native lower-floor Oasis pools.
// Hash is after the existing pasture correction; walls, void and factory water remain solid.
export const OASIS_WATER_NAV = { hash: '96e51670', cells: [
  242218, 242219, 242220, 242221, 242728, 242729, 242730, 242731, 242732, 242733, 242734, 242735,
  243239, 243240, 243241, 243242, 243243, 243244, 243245, 243246, 243247, 243750, 243751, 243752,
  243753, 243754, 243755, 243756, 243757, 243758, 243759, 244262, 244263, 244264, 244265, 244266,
  244267, 244268, 244269, 244270, 244271, 244774, 244775, 244776, 244777, 244778, 244779, 244780,
  244781, 244782, 244783, 245286, 245287, 245288, 245289, 245290, 245291, 245292, 245293, 245294,
  245295, 245296, 245798, 245799, 245800, 245801, 245802, 245803, 245804, 245805, 245806, 245807,
  245808, 245809, 246311, 246312, 246313, 246314, 246315, 246316, 246317, 246318, 246319, 246320,
  246321, 246322, 246824, 246825, 246826, 246827, 246828, 246831, 246832, 246833, 246834, 246835,
  247344, 247345, 247346, 247347, 247857, 247858, 247859, 248370, 248371, 248882, 248883, 248894,
  249394, 249395, 249396, 249907, 249908, 249914, 249915, 250419, 250420, 250421, 250423, 250425,
  250426, 250427, 250428, 250429, 250931, 250932, 250933, 250934, 250935, 250936, 250937, 250938,
  250939, 250940, 250941, 251444, 251445, 251446, 251447, 251451,
] };

// Known native farm fence footprints whose old nav cells duplicate the thin railing collision.
// Apply only to the matching world on pace2; a changed map must be inspected and rebaked.
export const PASTURE_NAV = { hash: '165cf2df', cells: [
  105269, 105272, 105776, 105777, 105778, 105779, 105780, 105781, 105782, 105783, 105784, 105785,
  105786, 105787, 105788, 105789, 105790, 105791, 105792, 105793, 105794, 106301, 106302, 106304,
  106305, 121132, 121644, 121661, 121662, 121664, 121665, 122156, 122157, 122158, 122159, 122160,
  124716, 124717, 124718, 124719, 124720, 124721, 124722, 124723, 124724, 124725, 124726, 124727,
  124728, 124729, 124730, 124731, 124732, 124737, 124738, 124739, 124740, 124741, 124742, 124743,
  124744, 124745, 124746, 124747, 124748, 124749, 124750, 124751, 124752, 124753, 125228, 125265,
  125740, 125777, 126252, 126289, 126764, 126801, 127276, 127313, 127788, 127825, 128300, 128337,
  128812, 128849, 129324, 129361, 129836, 129873, 130348, 130385, 130860, 130897, 131372, 131409,
  131410, 131884, 132396, 132908, 133420, 133932, 134444, 134956, 134957, 134958, 134959, 134960,
  134961, 134962, 134963, 134964, 134965, 134966, 134967, 134968, 134969, 134970, 134971, 134972,
  134973, 134974, 134975, 134976, 134977, 134978, 134979, 134980, 134981, 134982, 134983, 134984,
  134985, 134986, 135468, 135980, 136492, 137004, 137516, 138028, 138540, 139052, 139564, 140076,
  140588, 141100, 141612, 142124, 142636, 143148, 143660, 144172, 144709, 145196, 145197, 145198,
  145199, 145200, 145201, 145202, 145203, 145204, 145205, 145206, 145207, 145208, 145209, 145210,
  145211, 145212, 145213, 145214, 145215, 145216, 145217, 145218, 145219, 145220, 145221,
] };

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
  spider:    { name: 'Giant Spider', model: 'mobs/Spider.glb',                   h: 0.77, r: 0.8, hp: 40,  speed: 3.0, dmg: 11, xp: 4, walk: 'walk', idle: 'idle' },
  jspider:   { name: 'Jungle Spider',model: 'mobs/Spider2.glb',                  h: 0.75, r: 0.8, hp: 55,  speed: 3.2, dmg: 13, xp: 5, walk: 'walk', idle: 'idle' },
  pspider:   { name: 'Plasma Spider',model: 'mobs/Spider3.glb',                  h: 0.75, r: 0.9, hp: 80,  speed: 3.4, dmg: 16, xp: 7, walk: 'walk', idle: 'idle' },
  slimer:    { name: 'Slimer',       model: 'mobs/snail/Slimer.glb',             h: 2.1, r: 1.3, hp: 60,  speed: 1.8, dmg: 12, xp: 5, walk: 'walk', idle: 'idle' },
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
  protestm:  { name: 'DMT Protester', rig: { body: 'A', hair: 'Short', shirt: 0xb98a45, pants: 0x4a4f63 }, h: 1.6, r: 0.5, hp: 24, speed: 2.5, dmg: 8, xp: 3 },
  protestf:  { name: 'DMT Protester', rig: { body: 'B', hair: 'Short', shirt: 0x637e95, pants: 0x6c493c, hairColor: 0x38271c }, h: 1.6, r: 0.5, hp: 24, speed: 2.5, dmg: 8, xp: 3 },
  bandit:    { name: 'Bandit',       rig: { hair: 'Short', head: 'Ranger Helmet', chest: 'Ranger Chestplate', hands: 'Ranger Gauntlets', legs: 'Ranger Leggings', feet: 'Ranger Boots' }, h: 1.6, r: 0.5, hp: 28, speed: 3.6, dmg: 9, xp: 3 },
  shapewiz:  { name: 'Shape Wizard', rig: { hair: 'Long', head: 'Shape Wizard Hat', chest: 'Shape Robe', legs: 'Shape Skirt', shirt: 0x7a4ac8 }, h: 1.6, r: 0.5, hp: 70, speed: 3.0, dmg: 15, xp: 7 },
  mslimer:   { name: 'Mutant Slimer',model: 'mobs/snail/mutant slimer.glb',      h: 1.85, r: 1.5, hp: 260, speed: 2.6, dmg: 22, xp: 15, walk: 'walk', idle: 'walk' },
  // bosses
  giant:     { name: 'Lesser Giant', model: 'mobs/giant.glb',                    h: 3.9, r: 1.6, hp: 900,  speed: 2.2, dmg: 28, xp: 60, walk: 'walk', idle: 'idle', boss: true, attacks: ['slam'] },
  // Tutorial Island's own boss (owner 3 Nov: "on tutorial island boss should be sankson"): Survival Sankson, grown huge
  sankson:   { name: 'Survival Sankson', model: 'mobs/sankson/sankson.glb', mixamo: true, h: 3.0, r: 1.3, hp: 1800, speed: 2.6, dmg: 30, xp: 110, boss: true, attacks: ['slam', 'charge'] },
  ogre:      { name: 'Fudna the Hoard Keeper', model: 'mobs/snow_biome/ogre.glb',          h: 4.1, r: 1.5, hp: 2200, speed: 2.5, dmg: 34, xp: 120, walk: 'walk', idle: 'idle', boss: true, attacks: ['slam', 'charge'] },
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
  { t: 390, type: 'bandit',   w: 3 }, // (the Star is a friendly townsman in SankoQuest, never a monster)
  { t: 450, type: 'shapewiz', w: 3 },
  { t: 510, type: 'boatman',  w: 2 },
  { t: 570, type: 'starwiz',  w: 2 },
  { t: 630, type: 'lildragon',w: 2 },
  { t: 600, type: 'mslimer',  w: 2 },
];
// Phase out the weakest types as the run goes on.
export const RETIRE = { chicken: 240, goblin: 420, fox: 420, dog: 360 };
export const SNOW_WAVE_AT = 360;
const SNOW_ENEMIES = new Set(['wolf', 'snowman', 'dwarf', 'wight', 'yeti', 'ogre', 'colossus']);
export const isSnowEnemy = type => SNOW_ENEMIES.has(type);

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
    name: 'Spells', icon: 'staff', model: 'equipment/weapons/staff/staff.glb',
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

// Only continuous growth uses quality; projectile counts and unlocks keep the real level.
export function weaponStats(p, id) {
  const level = p.weapons[id] || 0;
  if (!level) return null;
  const stats = WEAPONS[id].stats(level), points = p.quality?.weapons?.[id] || 0;
  if (!points) return stats;
  const stronger = WEAPONS[id].stats(level + points / 100);
  // shortcut: classify new continuous stats here when adding weapons.
  for (const key of ['dmg', 'cd', 'range', 'arc', 'r', 'radius', 'spin', 'burst']) if (typeof stats[key] === 'number') stats[key] = stronger[key];
  return stats;
}
export function passiveStrength(p, id) {
  return (p.passives[id] || 0) + (p.quality?.passives?.[id] || 0) / 100;
}

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
  // owner 3 Nov: "we need item thats like curse to make more monsters": risk for reward. Casual only: in a kills-per-minute
  // race it would multiply the score for whoever happened to be offered the card. Pace 1 (ranked week 0) never sees it.
  curse:   { name: 'Pumpkin Head',  item: 'Pumpkin Head',  pace: 2, casual: true, blurb: 'Cursed: per level, monsters come 15% faster, 8% more of them at once, with 8% more health and 6% more damage. More kills, more experience, more coins.' },
  air:     { name: 'Air Shard',    item: 'Air Shard',    pace: 2, blurb: '+5% projectile speed per level. Ground Air Shards still give experience.' },
  water:   { name: 'Water Shard',  item: 'Water Shard',  pace: 2, blurb: '+10% healing from food, drinks and restoration choices per level.' },
  earth:   { name: 'Earth Shard',  item: 'Earth Shard',  pace: 2, blurb: '+10% attack knockback per level. Bosses remain immune to knockback.' },
  fire:    { name: 'Fire Shard',   item: 'Fire Shard',   pace: 2, blurb: '+6% magic damage per level. Affects Spells and the Lighter.' },
  void:    { name: 'Void Shard',   item: 'Void Shard',   pace: 2, blurb: '+0.20 critical damage multiplier per level. Critical chance stays the same.' },
};
export const ARMOR_TIERS = ['Bronze', 'Iron', 'Steel', 'Mithril', 'Adamantite', 'Runite'];
// Real item name to show for a passive at a level.
export function passiveItem(id, level) {
  if (id === 'armor') return `${ARMOR_TIERS[Math.min(level, 5) - 1] || 'Bronze'} Chestplate`;
  return PASSIVES[id].item;
}
export function passiveTitle(id, level) { return id === 'armor' ? `${ARMOR_TIERS[Math.min(level, 5) - 1]} Armor` : PASSIVES[id].name; }
// Real item name to show for a weapon at a level.
const SHARDS = ['Air', 'Water', 'Earth', 'Fire', 'Spirit', 'Void'];
// Pace 2 (casual, ranked from week 1): the Katana, Axe, Short Swords, Pickaxe, Two-handed Sword and Bow look like the
// metal (or wood) you put on them from a reward casket (`step`: 0 = Bronze / plain Bow). Without a step (pace 1, ranked
// week 0) the name follows the level as before. The Kiteshield weapon always shows its level's tier.
export function weaponItem(id, level, step = null) {
  if (step != null && METAL_FAMILY[id]) return `${METAL_TIERS[clampStep(id, step)]} ${METAL_FAMILY[id]}`;
  if (step != null && id === 'bow') return BOW_NAMES[clampStep('bow', step)];
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
export function weaponTitle(id, level, step = null) { return id === 'staff' ? `Spells · ${SHARDS[Math.min(level, 6) - 1]} Shard` : weaponItem(id, level, step); }
// icons: SankoQuest's file names (trimmed pieces share the plain icon, the Minion set is the Mystic robe and skirt,
// "Magician's Amulet" is item_Magicians_Amulet.png)
export const itemIconFile = (name) => `item_${name.replace(' Short Sword', ' Sword').replace(/ \(t\)$/, '').replace(/^Minion /, 'Mystic ').replace(/^Lighter$/, 'Lighter2').replace(/'/g, '').replace(/ /g, '_')}.png`;

// ---- weapon metals: reward-casket items for a weapon you carry ------------------------------------------------------
// Wearing one sets that weapon's metal for the run: more damage per step, and the new model in hand and in its attacks.
// Arrows go on the Bow: more damage and pierce. Evolved weapons keep their own look (the metal still adds damage).
export const METAL_FAMILY = { katana: 'Katana', axe: 'Axe', shortsword: 'Short Sword', pickaxe: 'Pickaxe', greatsword: '2hd Sword' };
export const BOW_NAMES = ['Bow', 'Oak Bow', 'Cherry Bow', 'Glacial Bow'];
const BOW_FILES = ['bow', 'oak_bow', 'cherry_bow', 'glacial_bow'];
export const ARROW_TIERS = ['Bronze', 'Iron', 'Steel', 'Mithril', 'Adamantite'];
export const METAL_DMG = [1, 1.1, 1.2, 1.32, 1.45, 1.6];   // damage × by tier (Bronze .. Runite)
const BOW_TIER = [0, 1, 3, 4];                             // Bow, Oak, Cherry, Glacial: their tier for damage, odds and alch
export const ARROW_DMG = [1, 1.06, 1.12, 1.18, 1.24];
export const ARROW_PIERCE = [0, 1, 1, 2, 2];
/** name -> { weapon, slot (the key in a player's `wm`: the weapon id, or 'arrow'), kind, step, tier } */
export const WEAPON_ITEMS = {};
for (const [id, fam] of Object.entries(METAL_FAMILY)) METAL_TIERS.forEach((t, i) => { WEAPON_ITEMS[`${t} ${fam}`] = { weapon: id, slot: id, kind: 'metal', step: i, tier: i }; });
BOW_NAMES.forEach((n, i) => { WEAPON_ITEMS[n] = { weapon: 'bow', slot: 'bow', kind: 'bow', step: i, tier: BOW_TIER[i] }; });
ARROW_TIERS.forEach((t, i) => { WEAPON_ITEMS[`${t} Arrow`] = { weapon: 'bow', slot: 'arrow', kind: 'arrow', step: i, tier: i }; });
const STEPS = { bow: BOW_NAMES.length, arrow: ARROW_TIERS.length };
function clampStep(slot, step) { const n = STEPS[slot] || METAL_TIERS.length; const v = Math.floor(Number(step) || 0); return v < 0 ? 0 : v >= n ? n - 1 : v; }
export const isWeaponItem = (name) => typeof name === 'string' && Object.hasOwn(WEAPON_ITEMS, name);
/** the item a weapon slot holds at a step ('katana' 3 -> Mithril Katana, 'arrow' 0 -> Bronze Arrow) */
export function weaponSlotItem(slot, step = 0) {
  const s = clampStep(slot, step);
  return slot === 'arrow' ? `${ARROW_TIERS[s]} Arrow` : slot === 'bow' ? BOW_NAMES[s] : `${METAL_TIERS[s]} ${METAL_FAMILY[slot]}`;
}
/** what a player's weapon metals do to one weapon: damage multiplier and extra pierce */
export function weaponMetal(id, wm = {}) {
  if (METAL_FAMILY[id]) return { dmg: METAL_DMG[clampStep(id, wm[id])], pierce: 0 };
  if (id === 'bow') { const a = clampStep('arrow', wm.arrow); return { dmg: METAL_DMG[BOW_TIER[clampStep('bow', wm.bow)]] * ARROW_DMG[a], pierce: ARROW_PIERCE[a] }; }
  return { dmg: 1, pierce: 0 };
}
/** the model step a weapon shows: its metal, or the evolution's own look (Runite, the Glacial Bow) */
export function weaponLook(id, wm = {}, evo = false) { if (id === 'arrow') return clampStep('arrow', wm.arrow); if (evo) return id === 'bow' ? 3 : 5; return clampStep(id, wm[id]); }
/** the metal step to name and draw a weapon with: null on pace 1 (no metals, the level's look), else its metal */
export const weaponStep = (id, wm) => (wm && (METAL_FAMILY[id] || id === 'bow') ? clampStep(id, wm[id]) : null);
/** a weapon item's stats as short text (for the casket card, the bank and the end of a run) */
export function weaponItemText(name) {
  const w = WEAPON_ITEMS[name]; if (!w) return '';
  const pct = (x) => `${Math.round((x - 1) * 100)}%`;
  if (w.kind === 'arrow') return w.step ? `+${pct(ARROW_DMG[w.step])} bow damage, +${ARROW_PIERCE[w.step]} pierce` : 'Plain arrows';
  const m = METAL_DMG[w.tier]; return m > 1 ? `+${pct(m)} ${WEAPONS[w.weapon].name} damage` : `${WEAPONS[w.weapon].name}, base damage`;
}
export const weaponItemLabel = (name) => { const w = WEAPON_ITEMS[name]; return !w ? '' : w.kind === 'arrow' ? 'Arrows · for the Bow' : `Weapon · ${WEAPONS[w.weapon].name}`; };
// XP gems are shards: bigger kills drop rarer shards.
// experience is always Air Shards; bigger ones are worth more and drawn larger
export function gemItem() { return 'Air Shard'; }
export const GEM_COLORS = { 'Air Shard': 0xb8e4ff, 'Water Shard': 0x4aa8ff, 'Earth Shard': 0x7bd04f, 'Fire Shard': 0xff7a30, 'Void Shard': 0xb25cff };
export const PASSIVE_IDS = Object.keys(PASSIVES);
/** the passives a run can be offered: pace 1 knows only the ones from before the 9 Nov rules, ranked runs skip casual-only ones */
export const passiveIdsAt = (pace, ranked = false) => PASSIVE_IDS.filter((id) => !(PASSIVES[id].pace > (pace || 1)) && !(ranked && PASSIVES[id].casual));
// the Pumpkin Head's curse per level: spawn rate, how many monsters can be out at once, and their health and damage. More
// monsters alone was a free power-up (balance bot, 144 runs: wins 50% -> 67% at level 5, from the extra experience), so
// the cursed ones are tougher too; the reward is the kills (experience, coins, kills per minute)
export const CURSE = { rate: 0.15, cap: 0.08, hp: 0.08, dmg: 0.06 };

// ---- evolutions: a weapon at its last level plus a passive (any level) can evolve ------------------------
export const EVOLUTIONS = {
  katana:  { passive: 'might',  name: 'Shadowfang Axe', item: 'Shadowfang Axe', blurb: 'Spins a full circle, hits harder, and heals on every hit.' },
  bow:     { passive: 'boots',  name: 'Glacial Bow',    item: 'Glacial Bow',    blurb: 'Volleys of arrows that pierce everything.' },
  axe:     { passive: 'vigor',  name: 'Runite Axe Storm', item: 'Runite Axe',   blurb: 'Twice the axes, bigger and heavier.' },
  shield:  { passive: 'armor',  name: 'Ogre Shield',    item: 'Ogre Shield',    blurb: 'More shields, wider orbit, brutal knockback.' },
  staff:   { passive: 'growth', name: 'Void Spells',     item: 'Void Shard',     blurb: 'More bolts that burst in huge blasts.' },
  pickaxe: { passive: 'haste',  name: 'Earthshaker',    item: 'Earth Shard',    blurb: 'Faster, wider quakes.' },
  greatsword: { passive: 'vigor', name: 'Bloodspinner', item: 'Adamantite 2hd Sword', blurb: 'Spins twice as often, wider, and heals you with every spin.' },
  shortsword: { passive: 'magnet', name: 'Swordstorm',  item: 'Adamantite Short Sword', blurb: 'A ring of swords in every direction that pierces everything.' },
  baseball: { passive: 'amount', name: 'Home Run',      item: 'Baseball',       blurb: 'Two balls at once that bounce eight times and knock monsters flying.' },
  lighter:  { passive: 'crit',   name: 'Inferno',       item: 'Fire Shard',     blurb: 'A wide blazing ring that burns twice as hard.' },
};
export const SPELL_EVOLUTIONS = {
  air: { name: 'Air Blast', item: 'Air Shard', passives: ['air'], blurb: 'More bolts that burst in huge blasts.' },
  water: { name: 'Water Blast', item: 'Water Shard', passives: ['water'], blurb: 'More bolts that burst in huge blasts.' },
  earth: { name: 'Earth Blast', item: 'Earth Shard', passives: ['earth'], blurb: 'More bolts that burst in huge blasts.' },
  fire: { name: 'Fire Blast', item: 'Fire Shard', passives: ['fire'], blurb: 'More bolts that burst in huge blasts.' },
  void: { name: EVOLUTIONS.staff.name, item: EVOLUTIONS.staff.item, passives: ['growth', 'area', 'void'], blurb: EVOLUTIONS.staff.blurb },
};
export function spellEvolutions(player, pace) {
  if (!(pace >= 2) || player.evo?.staff || !(player.weapons?.staff >= MAX_WEAPON_LEVEL)) return [];
  return Object.keys(SPELL_EVOLUTIONS).filter(element => SPELL_EVOLUTIONS[element].passives.some(id => player.passives?.[id] >= 1));
}
export function spellEvolutionChoices(player, pace, page = 0) {
  const elements = spellEvolutions(player, pace), pages = Math.ceil(elements.length / 2);
  if (!Number.isInteger(page) || page < 0 || page >= pages) return [];
  const choices = elements.slice(page * 2, page * 2 + 2).map(element => ({ kind: 'evolve', id: 'staff', level: 1, element }));
  if (pages > 1) choices.push({ kind: 'spell-page', id: 'staff', level: (page + 1) % pages });
  return choices;
}
const EVOLUTION_ALTERNATIVES = { katana: 'thorns', bow: 'crit', axe: 'amount', shield: 'thorns', staff: 'area', pickaxe: 'area', greatsword: 'armor', shortsword: 'boots', baseball: 'might', lighter: 'growth' };
export function evolutionPassives(id, pace) {
  if (!Object.hasOwn(EVOLUTIONS, id)) return [];
  if (id === 'staff' && pace >= 2) return [...new Set(Object.values(SPELL_EVOLUTIONS).flatMap(branch => branch.passives))];
  const original = EVOLUTIONS[id].passive, alternative = pace >= 2 && EVOLUTION_ALTERNATIVES[id];
  return alternative ? [original, alternative] : [original];
}
export function weaponDisplay(id, level, evo, step = null, spellElement = null) {
  if (id === 'staff' && evo && Object.hasOwn(SPELL_EVOLUTIONS, spellElement)) { const branch = SPELL_EVOLUTIONS[spellElement]; return { name: branch.name, item: branch.item }; }
  if (evo && EVOLUTIONS[id]) return { name: EVOLUTIONS[id].name, item: EVOLUTIONS[id].item };
  return { name: weaponTitle(id, level, step), item: weaponItem(id, level, step) };
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

// ---- rarity on level-up cards (pace 2: casual, ranked from week 1) -----------------------------------------------------
// One real level per pick; quality retains extra continuous rank strength for this run.
// Evolutions and fixed-risk Curse offers do not roll. Pace1 keeps its original cards.
export const CARD_RARITIES = ['common', 'uncommon', 'rare', 'epic'];
export const CARD_RARITY_NAMES = ['Common', 'Uncommon', 'Rare', 'Epic'];
export const CARD_ODDS = [70, 22, 7, 1];          // percent at no luck
export const CARD_GAIN = [1, 1, 1, 1];           // real levels per rarity
export const CARD_QUALITY = [100, 115, 130, 150]; // continuous rank strength; retain integer bonus points
export const CARD_HEAL = [40, 60, 80, 9999];     // Epic heals to full
/** card luck from the Luck skill (+0.05 per rank) and the Rusty Key passive (+0.04 per level); ranked has no skills */
export function cardLuck(meta = {}, passives = {}) { return 0.05 * (Number(meta.luck) || 0) + 0.04 * (Number(passives.greed) || 0); }
/** percent odds [common, uncommon, rare, epic]: luck lifts the upper tiers */
export function cardOdds(luck = 0) {
  const L = Math.max(0, luck), r = CARD_ODDS[1] * (1 + L), e = CARD_ODDS[2] * (1 + 1.5 * L), l = CARD_ODDS[3] * (1 + 2 * L);
  return [100 - r - e - l, r, e, l];
}
/** a rarity index from one roll in [0, 1) */
export function rarityFromRoll(u, luck = 0) {
  const odds = cardOdds(luck); let x = u * 100;
  for (let i = odds.length - 1; i > 0; i--) { if (x < odds[i]) return i; x -= odds[i]; }
  return 0;
}

// ---- permanent upgrades bought with coins: SankoQuest's skills ----------------------------------------------
export const SKILLS = {
  combat:      { max: 5, name: 'Combat',      icon: 'ui/skills/attack.png',      blurb: '+4% damage per level.' },
  magic:       { max: 5, name: 'Magic',       icon: 'ui/skills/magic.png',       blurb: '+10% pickup range per level.' },
  mining:      { max: 5, name: 'Mining',      icon: 'ui/skills/mining.png',      blurb: '+1 armor at levels 2 and 4.' },
  smithing:    { max: 5, name: 'Smithing',    icon: 'ui/skills/smithing.png',    blurb: '+8 max HP per level.' },
  woodcutting: { max: 5, name: 'Woodcutting', icon: 'ui/skills/woodcutting.png', blurb: '+3% move speed per level.' },
  fletching:   { max: 5, name: 'Fletching',   icon: 'ui/skills/crafting.png',   blurb: '-3% cooldowns per level.' },
  fishing:     { max: 5, name: 'Fishing',     icon: 'ui/skills/fishing.png',     blurb: 'Food heals 12% more per level.' },
  cooking:     { max: 5, name: 'Cooking',     icon: 'ui/skills/cooking.png',     blurb: 'Regenerate 0.1 HP/s per level.' },
  herblore:    { max: 5, name: 'Mixnometry',  icon: 'ui/skills/mixnometry.png',  blurb: '+5% experience per level.' },
  strength: { name: 'Strength', icon: 'ui/skills/strength.png', max: 2, costs: [1500, 4000], blurb: '+1 weapon slot per rank. Start with 4; train up to 6.' },
  prayer: { name: 'Prayer', icon: 'ui/skills/prayer.png', max: 2, costs: [1500, 4000], blurb: '+1 passive slot per rank. Start with 4; train up to 6.' },
  projectileSpeed: { name: 'Projectile speed', icon: 'ui/items/item_Bronze_Arrow.png', max: 2, costs: [300, 800], blurb: '+10% projectile speed per rank.' },
  amount: { name: 'One more projectile', icon: 'ui/items/item_Feather.png', max: 1, costs: [3000], blurb: '+1 projectile for the same weapons as the Feather.' },
  area: { name: 'Area', icon: 'ui/items/item_Cape.png', max: 2, costs: [300, 800], blurb: '+5% attack area per rank, like the Cape.' },
  luck: { name: 'Luck', icon: 'ui/items/item_Rusty_Key.png', max: 3, costs: [250, 600, 1200], blurb: '+15% casket drops and bonus boss chest chance per rank.' },
  coins: { name: 'Coins', icon: 'ui/items/item_Gold.png', max: 5, costs: [150, 400, 800, 1400, 2200], blurb: '+10% coins earned at the end of a run per rank.' },
  rerolls: { name: 'Rerolls', icon: 'ui/items/item_Warp_Shard.png', max: 3, costs: [300, 800, 1600], blurb: '+1 level-up reroll per run per rank.' },
  revive: { name: 'Revive', icon: 'ui/items/item_Power_Amulet.png', max: 1, costs: [5000], blurb: 'Once per run, return at 50% HP with 2 seconds of protection.' },
};
export const SKILL_IDS = Object.keys(SKILLS);
export const skillCost = (id, level) => SKILLS[id].costs ? SKILLS[id].costs[level] : Math.round(60 * (level + 1) ** 1.7);
export function clampSkills(saved) {
  const out = {};
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) for (const id of SKILL_IDS) {
    if (Object.hasOwn(saved, id)) out[id] = Math.max(0, Math.min(SKILLS[id].max, Math.floor(Number(saved[id])) || 0));
  }
  return out;
}


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

export const PLAYER_BASE = { hp: 100, speed: 5.4, magnet: 2.8, radius: 0.5 };
export const TUMBLE = { duration: 0.2, speed: 18, cooldown: 5 };

export function xpForLevel(level) {
  return Math.round(4 + level * 2.6 + level * level * 0.65);
}

export function tierName(level) {
  return METAL_TIERS[Math.min(level, MAX_WEAPON_LEVEL) - 1];
}

// step: the weapon's metal (weaponLook); without it the model follows the level as before (the Kiteshield weapon)
export function weaponModelPath(id, level, key = 'model', step = null) {
  const w = WEAPONS[id]; if (!w || !(w[key] || w.model)) return null;
  if (id === 'bow' && key === 'model') return `equipment/weapons/ranged/bow/${BOW_FILES[clampStep('bow', step)]}.glb`;
  const tier = (step != null ? METAL_TIERS[clampStep(key === 'arrowModel' ? 'arrow' : id, step)] : tierName(level)).toLowerCase();
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
    pool: [P(0, 'scorpion', 6), P(0, 'fox', 4), P(40, 'bandit', 5), P(90, 'camel', 3), P(170, 'spider', 4), P(250, 'alligator', 2), P(300, 'skeleton', 4), P(340, 'jspider', 3), P(420, 'mslimer', 2), P(500, 'boatman', 3), P(560, 'boatman', 3), P(620, 'pspider', 3)],
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
    pool: [P(0, 'skeleton', 8), P(0, 'dog', 2), P(60, 'bandit', 4), P(120, 'wolf', 3), P(180, 'spider', 4), P(260, 'shapewiz', 4), P(340, 'snowman', 3), P(440, 'starwiz', 3), P(540, 'jspider', 3), P(640, 'pspider', 3)],
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
    cx: 240, cz: 144, r: 1000, sky: 0xcfe0f0, fog: 0xcfe0f0, light: 1, music: 'boss', length: RUN_LENGTH, finalBoss: 'dragon', // the village proper (243,106 was a blocked gap on a ridge; audit 3 Nov)
    pool: [P(0, 'dog', 5), P(0, 'chicken', 4), P(50, 'bandit', 4), P(90, 'snowman', 4), P(180, 'camel', 3), P(260, 'dwarf', 4), P(340, 'shapewiz', 4), P(420, 'yeti', 1), P(430, 'starwiz', 3), P(520, 'boatman', 3), P(620, 'lildragon', 3)],
    retire: { chicken: 240, dog: 360 },
    events: ['blizzard', 'blizzard', 'treasure', 'swarm', 'meteors'], // snow country
    bosses: [{ t: 210, type: 'giant' }, { t: 420, type: 'reaper' }, { t: 620, type: 'colossus' }, { t: 720, type: 'dragon' }],
  },
  {
    // SankoQuest's underground area under Apache town (its ground and scene sit in our world's empty south-west corner,
    // see tools/build-world-tiles.py). Opens with Apache Desert, not the map before it in this list.
    id: 'oasis', name: 'Hidden Oasis', after: 'apache', under: true, area: [0, 448, 128, 512], blurb: 'Behind the locked door under Apache town: a cave of alligator pools and the old factory beyond it.',
    cx: 37.5, cz: 485.5, r: 1000, sky: 0x0e0b08, fog: 0x0e0b08, light: 0.6, music: 'final', length: RUN_LENGTH, finalBoss: 'colossus',
    pool: [P(0, 'jspider', 5), P(0, 'slimer', 4), P(40, 'scorpion', 3), P(90, 'alligator', 4), P(200, 'mslimer', 3), P(280, 'skeleton', 3), P(360, 'pspider', 4), P(560, 'boatman', 2), P(640, 'lildragon', 2)],
    retire: { scorpion: 300, jspider: 420 },
    events: ['ambush', 'swarm', 'treasure', 'ambush'], // alligators and slimers out of the pools
    bosses: [{ t: 210, type: 'giant' }, { t: 450, type: 'reaper' }, { t: 720, type: 'colossus' }],
  },
  {
    id: 'tutorial', name: 'Tutorial Island', special: true, forceAdv: 'alex', blurb: 'Where every adventurer washes up. You play as Alex. A gentler ten minutes, open from the start.',
    cx: 82, cz: 248, r: 1000, sky: 0xa8d4f0, fog: 0xa8d4f0, light: 1.05, music: 'early', length: 600, finalBoss: 'sankson',
    pool: [P(0, 'chicken', 6), P(0, 'cow', 3), P(30, 'goblin', 5), P(90, 'dog', 3), P(150, 'fox', 3), P(240, 'spider', 4), P(330, 'skeleton', 4), P(420, 'wolf', 3), P(500, 'jspider', 3)],
    retire: { chicken: 200, cow: 260 },
    bosses: [{ t: 240, type: 'giant' }, { t: 480, type: 'sankson' }],
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
// Every piece is a real SankoQuest item with its own model on the character (amulets and rings have none: they are not
// drawn on the hero). Bonus keys: armor, dmg, haste (cooldown cut), speed, magnet, growth (xp), hp, regen, coin (coin drop
// chance), magic (damage of the magic weapons: the Shard Staff and the Lighter).
// `pace: 2` marks the pieces added with the 9 Nov rules (the trimmed pieces, the Minion set, the Wooden Shield, amulets and
// rings): pace-1 runs (ranked week 0) neither roll them from caskets nor count them, so those runs play exactly as before.
export const GEAR_SLOTS = ['head', 'chest', 'hands', 'legs', 'feet', 'offhand', 'back', 'neck', 'ring'];
export const GEAR_SLOT_NAMES = { head: 'Head', chest: 'Body', hands: 'Hands', legs: 'Legs', feet: 'Feet', offhand: 'Shield', back: 'Back', neck: 'Neck', ring: 'Ring' };
const METAL_PIECES = [['head', 'Helmet'], ['chest', 'Chestplate'], ['hands', 'Gauntlets'], ['legs', 'Leggings'], ['feet', 'Boots']];
const METAL_ARMOR = [0.2, 0.3, 0.4, 0.5, 0.6, 0.75];
export const GEAR = {};
ARMOR_TIERS.forEach((t, i) => {
  for (const [slot, piece] of METAL_PIECES) GEAR[`${t} ${piece}`] = { slot, set: t, tier: i, bonus: { armor: METAL_ARMOR[i] } };
});
// shields for the off hand: a kiteshield is heavy (more armor, a little health), a round shield is light (less armor, a
// little speed). Models are the held items in equipment/offhand/, not clothing.
ARMOR_TIERS.forEach((t, i) => {
  const low = t.toLowerCase();
  GEAR[`${t} Kiteshield`] = { slot: 'offhand', tier: i, model: `equipment/offhand/kiteshield/${low}_kiteshield.glb`, bonus: { armor: [0.3, 0.45, 0.6, 0.75, 0.9, 1.1][i], hp: [4, 6, 8, 10, 12, 15][i] } };
  GEAR[`${t} Shield`] = { slot: 'offhand', tier: i, model: `equipment/offhand/shield/${low}_shield.glb`, bonus: { armor: METAL_ARMOR[i], speed: 0.02 } };
});
// trimmed "(t)" Bronze, Iron and Steel pieces: gold trim, a little better than the plain ones, rarer; they count for
// their metal's set. Their models are SankoQuest's `<name>_trimmed` clothing files; the icons are the plain ones.
['Bronze', 'Iron', 'Steel'].forEach((t, i) => {
  for (const [slot, piece] of METAL_PIECES) GEAR[`${t} ${piece} (t)`] = { slot, set: t, tier: i, rarity: 'rare', trim: true, pace: 2, file: `${t} ${piece}_trimmed`, bonus: { armor: Math.round(METAL_ARMOR[i] * 1.25 * 100) / 100, hp: 3 } };
});
Object.assign(GEAR, {
  // the lowest shield (SankoQuest has no model for it, and its icon is not on the CDN: the Bronze Shield's model in wood
  // brown, and a wooden icon of our own)
  'Wooden Shield':      { slot: 'offhand', tier: 0, pace: 2, model: 'equipment/offhand/shield/bronze_shield.glb', tint: 0x8a5a2b, bonus: { armor: 0.1, speed: 0.02 } },
  // the Minion set (SankoQuest's Mystic robe and skirt models): for magic weapons, the Shard Staff and the Lighter
  'Minion Robe':        { slot: 'chest', set: 'Minion', tier: 3, pace: 2, file: 'Mystic Robe', bonus: { magic: 0.08, hp: 5 } },
  'Minion Skirt':       { slot: 'legs',  set: 'Minion', tier: 3, pace: 2, file: 'Mystic Skirt', bonus: { magic: 0.06, haste: 0.02 } },
  // SankoQuest's three amulets (Magician's: magic attack 10; Warrior's: melee strength 10; Power: +6 to every attack and
  // defence), on the scale of our other pieces: an attack of ~10 is about +5% damage, a defence of 6 about +0.3 armor
  "Magician's Amulet":  { slot: 'neck', tier: 2, pace: 2, rarity: 'rare', bonus: { magic: 0.12, haste: 0.02 } },
  "Warrior's Amulet":   { slot: 'neck', tier: 2, pace: 2, rarity: 'rare', bonus: { dmg: 0.05 } },
  'Power Amulet':       { slot: 'neck', tier: 3, pace: 2, rarity: 'rare', bonus: { dmg: 0.03, magic: 0.03, armor: 0.3, hp: 6 } },
  // rings: SankoQuest has none, so these are ours (icons drawn for this game), one modest bonus each
  'Ember Band':         { slot: 'ring', tier: 1, pace: 2, rarity: 'rare', bonus: { dmg: 0.04 } },
  'Tidewater Ring':     { slot: 'ring', tier: 1, pace: 2, rarity: 'rare', bonus: { regen: 0.2 } },
  'Featherstep Ring':   { slot: 'ring', tier: 1, pace: 2, rarity: 'rare', bonus: { speed: 0.04 } },
  'Lodestone Ring':     { slot: 'ring', tier: 1, pace: 2, rarity: 'rare', bonus: { magnet: 0.15 } },
  'Quickdraw Ring':     { slot: 'ring', tier: 2, pace: 2, rarity: 'rare', bonus: { haste: 0.04 } },
  'Bulwark Band':       { slot: 'ring', tier: 2, pace: 2, rarity: 'rare', bonus: { armor: 0.3, hp: 6 } },
  'Ogre Shield':        { slot: 'offhand', tier: 4, rarity: 'unique', model: 'equipment/offhand/shield/ogre_shield.glb', bonus: { armor: 1.2, hp: 25 } },
  'Ranger Helmet':      { slot: 'head',  set: 'Ranger', tier: 2, bonus: { dmg: 0.03, magnet: 0.06 } },
  'Ranger Chestplate':  { slot: 'chest', set: 'Ranger', tier: 2, bonus: { dmg: 0.03, armor: 0.2 } },
  'Ranger Gauntlets':   { slot: 'hands', set: 'Ranger', tier: 2, bonus: { dmg: 0.03 } },
  'Ranger Leggings':    { slot: 'legs',  set: 'Ranger', tier: 2, bonus: { dmg: 0.03, speed: 0.02 } },
  'Ranger Boots':       { slot: 'feet',  set: 'Ranger', tier: 2, bonus: { dmg: 0.03, speed: 0.02 } },
  'Wizard Hat':         { slot: 'head',  set: 'Wizard', tier: 1, bonus: { growth: 0.05 } },
  'Wizard Robe':        { slot: 'chest', set: 'Wizard', tier: 1, bonus: { growth: 0.05, hp: 5 } },
  'Wizard Skirt':       { slot: 'legs',  set: 'Wizard', tier: 1, bonus: { growth: 0.05 } },
  'Shape Wizard Hat':   { slot: 'head',  set: 'Shape', tier: 3, bonus: { haste: 0.03 }, bonus2: { haste: 0.03, magic: 0.04 } },
  'Shape Robe':         { slot: 'chest', set: 'Shape', tier: 3, bonus: { haste: 0.03, hp: 5 }, bonus2: { haste: 0.03, magic: 0.12, hp: 8 } },
  'Shape Skirt':        { slot: 'legs',  set: 'Shape', tier: 3, bonus: { haste: 0.03 }, bonus2: { haste: 0.03, magic: 0.10 } },
  'Mystic Hat':         { slot: 'head',  tier: 3, bonus: { haste: 0.06 } },
  'Straw Hat':          { slot: 'head',  tier: 0, bonus: { hp: 10 } },
  'Bowler Hat':         { slot: 'head',  tier: 1, bonus: { coin: 0.5 } },
  'Beret':              { slot: 'head',  tier: 1, bonus: { speed: 0.04 } },
  'Hamburger Hat':      { slot: 'head',  tier: 2, bonus: { regen: 0.3 } },
  'Pumpkin Head':       { slot: 'head',  tier: 4, rarity: 'unique', bonus: { dmg: 0.08 } },
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
  Minion:     { pieces: 2, bonus: { magic: 0.15, haste: 0.04 }, text: '+15% magic damage, -4% cooldowns' },
  Bronze:     { pieces: 5, bonus: { hp: 15 },     text: '+15 max HP' },
  Iron:       { pieces: 5, bonus: { hp: 20 },     text: '+20 max HP' },
  Steel:      { pieces: 5, bonus: { hp: 25, armor: 0.5 }, text: '+25 max HP, +0.5 armor' },
  Mithril:    { pieces: 5, bonus: { hp: 30, speed: 0.04 }, text: '+30 max HP, +4% speed' },
  Adamantite: { pieces: 5, bonus: { hp: 40, armor: 1 }, text: '+40 max HP, +1 armor' },
  Runite:     { pieces: 5, bonus: { hp: 50, armor: 1.5, dmg: 0.05 }, text: '+50 max HP, +1.5 armor, +5% damage' },
};
const BONUS_TEXT = { armor: (v) => `+${v} armor`, dmg: (v) => `+${Math.round(v * 100)}% damage`, haste: (v) => `-${Math.round(v * 100)}% cooldowns`, speed: (v) => `+${Math.round(v * 100)}% speed`,
  magnet: (v) => `+${Math.round(v * 100)}% pickup range`, growth: (v) => `+${Math.round(v * 100)}% experience`, hp: (v) => `+${v} max HP`, regen: (v) => `+${v} HP/s`, coin: (v) => `+${Math.round(v * 100)}% coins`,
  magic: (v) => `+${Math.round(v * 100)}% magic damage` };
export const bonusText = (b) => Object.entries(b).filter(([k]) => BONUS_TEXT[k]).map(([k, v]) => BONUS_TEXT[k](Math.round(v * 100) / 100)).join(', ');
// one stat change as short text with its sign ("+0.3 armor", "-4% speed"); haste is a cut, so more haste reads as -x% cooldowns
export const BONUS_NAMES = { armor: 'armor', dmg: 'damage', haste: 'cooldowns', speed: 'speed', magnet: 'pickup range', growth: 'experience', hp: 'max HP', regen: 'HP/s', coin: 'coins', magic: 'magic damage', wdmg: 'weapon damage', pierce: 'pierce' };
// magic weapons: the Minion set's magic damage counts for these
export const MAGIC_WEAPONS = ['staff', 'lighter'];
export function deltaText(k, v) {
  const r = (x) => Math.round(x * 100) / 100, pct = (x) => `${Math.round(Math.abs(x) * 100)}%`;
  if (k === 'haste') return `${v > 0 ? '-' : '+'}${pct(v)} cooldowns`;
  if (['dmg', 'speed', 'magnet', 'growth', 'coin', 'magic', 'wdmg'].includes(k)) return `${v > 0 ? '+' : '-'}${pct(v)} ${BONUS_NAMES[k]}`;
  return `${v > 0 ? '+' : '-'}${r(Math.abs(v))} ${BONUS_NAMES[k]}`;
}
// the Armoury: each piece can be reinforced three times with coins, +25% of its bonus each time
export const GEAR_MAX_LV = 3;
export const gearUpgradeCost = (name, lv) => Math.round((50 + 35 * ((GEAR[name] && GEAR[name].tier) || 0)) * (lv + 1) ** 1.6);
// the Smithy: a metal piece is smithed into the next metal's piece for coins (owner 3 Nov: "when you get bronze helm
// upgraded gives you iron helm"). SMITH_COST[i] makes a piece of ARMOR_TIERS[i] from the one below.
export const SMITH_COST = [0, 400, 900, 1800, 3500, 7000];
const METAL_NAME = /^(Bronze|Iron|Steel|Mithril|Adamantite|Runite) (Helmet|Chestplate|Gauntlets|Leggings|Boots|Kiteshield|Shield)$/;
export function smithNext(name) {
  const m = METAL_NAME.exec(name); if (!m) return null;
  const i = ARMOR_TIERS.indexOf(m[1]); if (i < 0 || i >= ARMOR_TIERS.length - 1) return null;
  const next = `${ARMOR_TIERS[i + 1]} ${m[2]}`;
  return Object.hasOwn(GEAR, next) ? { name: next, cost: SMITH_COST[i + 1] } : null;
}
export function smithPrev(name) { const m = METAL_NAME.exec(name), i = m ? ARMOR_TIERS.indexOf(m[1]) : -1; return i > 0 ? `${ARMOR_TIERS[i - 1]} ${m[2]}` : null; }
// the Gear panel, organised: one slot's pieces in groups, each in order. The metal ladder first (Bronze to Runite, each
// trimmed piece just above its plain one; shields from the Wooden Shield up, kiteshields on their own ladder), then the
// sets (Ranger, Wizard, Shape, Minion), then the specials (hats, boots, the Cape, unique drops, amulets, rings).
const LADDER = /^(Bronze|Iron|Steel|Mithril|Adamantite|Runite) (Helmet|Chestplate|Gauntlets|Leggings|Boots|Kiteshield|Shield)( \(t\))?$/;
const SPECIAL_TITLE = { neck: 'Amulets', ring: 'Rings', back: 'Capes' };
export function gearGroups(slot) {
  const ladders = {}, sets = [], specials = [];
  for (const n of Object.keys(GEAR)) {
    const g = GEAR[n]; if (g.slot !== slot) continue;
    const m = n === 'Wooden Shield' ? [n, null, 'Shield'] : LADDER.exec(n);
    if (m) (ladders[m[2]] || (ladders[m[2]] = [])).push(n);
    else if (g.set && GEAR_SETS[g.set] && !ARMOR_TIERS.includes(g.set)) sets.push(n);
    else specials.push(n);
  }
  const rung = (n) => (n === 'Wooden Shield' ? -1 : ARMOR_TIERS.indexOf(n.split(' ')[0]) + (n.endsWith(' (t)') ? 0.5 : 0));
  const setOrder = Object.keys(GEAR_SETS);
  const out = [];
  const LADDER_TITLE = { Shield: 'Shields', Kiteshield: 'Kiteshields' };
  for (const kind of ['Shield', 'Kiteshield', 'Helmet', 'Chestplate', 'Gauntlets', 'Leggings', 'Boots']) if (ladders[kind]) out.push({ title: LADDER_TITLE[kind] || 'Metal', items: ladders[kind].sort((a, b) => rung(a) - rung(b)) });
  if (sets.length) out.push({ title: 'Sets', items: sets.sort((a, b) => setOrder.indexOf(GEAR[a].set) - setOrder.indexOf(GEAR[b].set) || GEAR[a].tier - GEAR[b].tier || a.localeCompare(b)) });
  if (specials.length) out.push({ title: SPECIAL_TITLE[slot] || 'Specials', items: specials.sort((a, b) => GEAR[a].tier - GEAR[b].tier || a.localeCompare(b)) });
  return out;
}
/** is this a piece of gear at this pace? (pace 1 knows only the pieces from before the 9 Nov rules; unknown names and
 *  prototype keys are never gear) */
export const gearOn = (name, pace = 2) => typeof name === 'string' && Object.hasOwn(GEAR, name) && (GEAR[name].pace || 1) <= pace;
// Week0 keeps the original piece stats; current UI and combat share the newer mage progression.
export const gearPieceBonus = (name, pace = 2) => pace >= 2 && GEAR[name].bonus2 || GEAR[name].bonus;
/** total bonus of a gear loadout {slot: itemName} (with Armoury levels {itemName: 0..3}), with any completed set */
export function gearBonus(gear = {}, levels = {}, pace = 2) {
  const out = {}; const add = (b, m = 1) => { for (const [k, v] of Object.entries(b)) out[k] = (out[k] || 0) + v * m; };
  const sets = {};
  for (const name of Object.values(gear)) { if (!gearOn(name, pace)) continue; const g = GEAR[name]; add(gearPieceBonus(name, pace), 1 + 0.25 * Math.min(GEAR_MAX_LV, levels[name] || 0)); if (g.set) sets[g.set] = (sets[g.set] || 0) + 1; }
  const done = [];
  for (const [s, c] of Object.entries(sets)) if (GEAR_SETS[s] && c >= GEAR_SETS[s].pieces) { add(GEAR_SETS[s].bonus); done.push(s); }
  out.sets = done;
  return out;
}
// ---- reward caskets: what a piece is worth, and how it compares with what you wear --------------------------------
// rarity: metal armour and metal shields are common, the named pieces (Ranger, Wizard, Shape, hats, boots, Cape) rare,
// the Pumpkin Head and the Ogre Shield unique
export const gearRarity = (name) => (isWeaponItem(name) ? 'common' : GEAR[name].rarity) || (ARMOR_TIERS.includes(GEAR[name].set) || / (Kite)?[Ss]hield$/.test(name) ? 'common' : 'rare');
export const ALCH_BY_TIER = [25, 35, 50, 70, 100, 150];
export const ALCH_RARITY = { common: 1, rare: 1.5, unique: 2 };
// the big pieces are worth more, as in SankoQuest (a chestplate takes the most bars)
const ALCH_PIECE = (name) => (/Chestplate( \(t\))?$|Robe$|2hd Sword$/.test(name) ? 1.5 : /Leggings( \(t\))?$|Skirt$|Kiteshield$|Katana$|Axe$|Pickaxe$|Short Sword$|Bow$/.test(name) ? 1.25 : 1);
/** coins for high-alching a casket piece or weapon item (added to this run's coins) */
export function alchValue(name) {
  const g = isWeaponItem(name) ? WEAPON_ITEMS[name] : Object.hasOwn(GEAR, name) ? GEAR[name] : null; if (!g) return 0;
  return Math.round(ALCH_BY_TIER[Math.min(g.tier, ALCH_BY_TIER.length - 1)] * ALCH_RARITY[gearRarity(name)] * ALCH_PIECE(name) / 5) * 5;
}
// one number for "how good is this loadout", to recommend Wear or High alch (the card still shows every stat)
export const GEAR_SCORE_W = { armor: 10, dmg: 100, haste: 100, speed: 80, magnet: 25, growth: 50, hp: 0.4, regen: 12, coin: 6, magic: 40 };
export function gearScore(b) { let s = 0; for (const [k, v] of Object.entries(b)) if (GEAR_SCORE_W[k]) s += GEAR_SCORE_W[k] * v; return s; }
/** what wearing `item` instead of what is in its slot would change: every stat, the sets, and a recommendation */
export function compareGear(gear = {}, levels = {}, item, pace = 2) {
  const g = GEAR[item], slot = g.slot, old = gear[slot] || null;
  const before = gearBonus(gear, levels, pace), after = gearBonus({ ...gear, [slot]: item }, levels, pace);
  const delta = {};
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (k === 'sets') continue;
    const d = Math.round(((after[k] || 0) - (before[k] || 0)) * 1000) / 1000; if (d) delta[k] = d;
  }
  const sb = gearScore(before), sa = gearScore(after);
  const set = g.set && GEAR_SETS[g.set] ? { name: g.set, have: Object.values({ ...gear, [slot]: item }).filter((n) => gearOn(n, pace) && GEAR[n].set === g.set).length, need: GEAR_SETS[g.set].pieces } : null;
  return {
    item, slot, old, delta, set, alch: alchValue(item),
    setsGained: after.sets.filter((s) => !before.sets.includes(s)), setsLost: before.sets.filter((s) => !after.sets.includes(s)),
    better: sa > sb + 1e-9,                       // recommend Wear
    anyUp: Object.values(delta).some((v) => v > 0), // false: nothing improves (a clear downgrade, or the same)
  };
}
/** what putting a weapon item on would change: the weapon's damage (and the Bow's pierce), and a recommendation */
export function compareWeaponItem(wm = {}, item) {
  const w = WEAPON_ITEMS[item], old = weaponSlotItem(w.slot, wm[w.slot]);
  const before = weaponMetal(w.weapon, wm), after = weaponMetal(w.weapon, { ...wm, [w.slot]: w.step });
  const delta = {}, d = Math.round((after.dmg / before.dmg - 1) * 1000) / 1000, pc = after.pierce - before.pierce;
  if (d) delta.wdmg = d; if (pc) delta.pierce = pc;
  return {
    item, slot: 'weapon', wslot: w.slot, weapon: w.weapon, old, delta, set: null, alch: alchValue(item), setsGained: [], setsLost: [],
    better: d > 1e-9 || (d >= 0 && pc > 0), anyUp: Object.values(delta).some((v) => v > 0),
  };
}
/** what a reward casket holds. Higher tiers on later maps, later in the run and in hard mode; Runite only late on the
 *  later maps (or in hard mode), and rare. rank = map progress (0 = Greentown), t = seconds into the run. */
// Pace 2 (opts.pace, default): the pieces added on 9 Nov join the pool (trimmed pieces, amulets and rings rarer than the
// rest), and weapon metals for the weapons the player carries (opts.weapons, { id: level }): a weapon item only ever
// comes for one of them. Pace 1 (ranked week 0) rolls from exactly the pool it had before.
const CASKET_BASE = { trim: 0.6, neck: 0.5, ring: 0.5 };
export function casketWeights(rank = 0, hard = false, t = 0, { pace = 2, weapons = null } = {}) {
  const reach = 1 + rank + (hard ? 1 : 0);               // as before: Greentown reaches Iron, later maps further
  let top = Math.min(4, reach + (t >= 360 ? 1 : 0));     // past 6:00 one tier more
  if (t < 120) top = Math.min(top, 1 + (hard ? 1 : 0));  // the first two minutes stay low
  const late = Math.max(0, Math.min(1, t / 900));        // later in the run the better tiers weigh more
  const lift = late + (hard ? 0.5 : 0);                  // and in hard mode
  const runite = t >= 480 && reach >= 3;
  const out = [];
  const items = Object.entries(GEAR).filter(([n]) => gearOn(n, pace));
  if (weapons && pace >= 2) for (const [n, w] of Object.entries(WEAPON_ITEMS)) if (Object.hasOwn(weapons, w.weapon)) items.push([n, w]);
  for (const [n, g] of items) {
    const base = g.weapon ? (g.kind === 'arrow' ? 1.5 : 2) : g.trim ? CASKET_BASE.trim : CASKET_BASE[g.slot] || (ARMOR_TIERS.includes(g.set) ? 3 : g.slot === 'offhand' && g.rarity !== 'unique' ? 2 : 1.4);
    if (g.tier === 5) { if (runite) out.push([n, base * 0.25 * (1 + lift)]); continue; }
    if (g.tier > top) continue;
    out.push([n, base * ((1 + top - g.tier) + lift * g.tier)]);
  }
  return out;
}
export function rollCasket(rng, rank = 0, hard = false, t = 0, opts = {}) {
  const list = casketWeights(rank, hard, t, opts);
  let total = 0; for (const [, w] of list) total += w;
  let r = rng() * total; for (const [n, w] of list) { if ((r -= w) <= 0) return n; }
  return list[list.length - 1][0];
}
/** map progress for caskets: the campaign map's place in the list; Tutorial Island counts as the first map, the Whole
 *  World as the fourth */
export function casketRank(map) { if (!map) return 0; if (map.special) return map.world ? 3 : 0; return Math.max(0, MAPS.findIndex((m) => m.id === map.id)); }

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
