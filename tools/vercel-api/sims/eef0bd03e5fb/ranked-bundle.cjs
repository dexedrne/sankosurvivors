var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// tools/vercel-api/ranked-entry.mjs
var ranked_entry_exports = {};
__export(ranked_entry_exports, {
  CLOSE_MS: () => CLOSE_MS,
  IDLE_MS: () => IDLE_MS,
  RANKED: () => RANKED,
  UPLOAD_MS: () => UPLOAD_MS,
  clockPolicy: () => clockPolicy,
  dmtText: () => dmtText,
  entryRacesOf: () => entryRacesOf,
  groundHash: () => groundHash,
  kpmWeek: () => kpmWeek,
  raceForWeek: () => raceForWeek,
  racesOf: () => racesOf,
  rankedPoints: () => rankedPoints,
  replay: () => replay,
  runSeconds: () => runSeconds,
  unpackGround: () => unpackGround,
  weekMap: () => weekMap,
  weekOf: () => weekOf,
  weekStart: () => weekStart
});
module.exports = __toCommonJS(ranked_entry_exports);

// src/dmath.js
var PI = Math.PI;
var TAU = 2 * PI;
var HALF = PI / 2;
function sinCore(x) {
  const x2 = x * x;
  return x * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880 + x2 * (-1 / 39916800 + x2 * (1 / 6227020800 + x2 * (-1 / 1307674368e3))))))));
}
function dsin(x) {
  if (!Number.isFinite(x)) return NaN;
  x = x - TAU * Math.floor(x / TAU + 0.5);
  if (x > HALF) x = PI - x;
  else if (x < -HALF) x = -PI - x;
  return sinCore(x);
}
function dcos(x) {
  return dsin(x + HALF);
}
function atanUnit(t) {
  let k = 1;
  for (let i = 0; i < 2; i++) {
    t = t / (1 + Math.sqrt(1 + t * t));
    k *= 2;
  }
  const t2 = t * t;
  let s = 0, p = t;
  for (let n = 0; n < 12; n++) {
    s += (n % 2 ? -p : p) / (2 * n + 1);
    p *= t2;
  }
  return k * s;
}
function datan2(y, x) {
  if (x === 0 && y === 0) return 0;
  const ax = Math.abs(x), ay = Math.abs(y);
  let a = ay <= ax ? atanUnit(ay / ax) : HALF - atanUnit(ax / ay);
  if (x < 0) a = PI - a;
  return y < 0 ? -a : a;
}
function dhypot(x, y) {
  return Math.sqrt(x * x + y * y);
}

// src/content.js
var METAL_TIERS = ["Bronze", "Iron", "Steel", "Mithril", "Adamantite", "Runite"];
var MAX_WEAPON_LEVEL = 6;
var MAX_PASSIVE_LEVEL = 5;
var MAX_WEAPONS = 4;
var MAX_PASSIVES = 4;
var OASIS_WATER_NAV = { hash: "96e51670", cells: [
  242218,
  242219,
  242220,
  242221,
  242728,
  242729,
  242730,
  242731,
  242732,
  242733,
  242734,
  242735,
  243239,
  243240,
  243241,
  243242,
  243243,
  243244,
  243245,
  243246,
  243247,
  243750,
  243751,
  243752,
  243753,
  243754,
  243755,
  243756,
  243757,
  243758,
  243759,
  244262,
  244263,
  244264,
  244265,
  244266,
  244267,
  244268,
  244269,
  244270,
  244271,
  244774,
  244775,
  244776,
  244777,
  244778,
  244779,
  244780,
  244781,
  244782,
  244783,
  245286,
  245287,
  245288,
  245289,
  245290,
  245291,
  245292,
  245293,
  245294,
  245295,
  245296,
  245798,
  245799,
  245800,
  245801,
  245802,
  245803,
  245804,
  245805,
  245806,
  245807,
  245808,
  245809,
  246311,
  246312,
  246313,
  246314,
  246315,
  246316,
  246317,
  246318,
  246319,
  246320,
  246321,
  246322,
  246824,
  246825,
  246826,
  246827,
  246828,
  246831,
  246832,
  246833,
  246834,
  246835,
  247344,
  247345,
  247346,
  247347,
  247857,
  247858,
  247859,
  248370,
  248371,
  248882,
  248883,
  248894,
  249394,
  249395,
  249396,
  249907,
  249908,
  249914,
  249915,
  250419,
  250420,
  250421,
  250423,
  250425,
  250426,
  250427,
  250428,
  250429,
  250931,
  250932,
  250933,
  250934,
  250935,
  250936,
  250937,
  250938,
  250939,
  250940,
  250941,
  251444,
  251445,
  251446,
  251447,
  251451
] };
var PASTURE_NAV = { hash: "165cf2df", cells: [
  105269,
  105272,
  105776,
  105777,
  105778,
  105779,
  105780,
  105781,
  105782,
  105783,
  105784,
  105785,
  105786,
  105787,
  105788,
  105789,
  105790,
  105791,
  105792,
  105793,
  105794,
  106301,
  106302,
  106304,
  106305,
  121132,
  121644,
  121661,
  121662,
  121664,
  121665,
  122156,
  122157,
  122158,
  122159,
  122160,
  124716,
  124717,
  124718,
  124719,
  124720,
  124721,
  124722,
  124723,
  124724,
  124725,
  124726,
  124727,
  124728,
  124729,
  124730,
  124731,
  124732,
  124737,
  124738,
  124739,
  124740,
  124741,
  124742,
  124743,
  124744,
  124745,
  124746,
  124747,
  124748,
  124749,
  124750,
  124751,
  124752,
  124753,
  125228,
  125265,
  125740,
  125777,
  126252,
  126289,
  126764,
  126801,
  127276,
  127313,
  127788,
  127825,
  128300,
  128337,
  128812,
  128849,
  129324,
  129361,
  129836,
  129873,
  130348,
  130385,
  130860,
  130897,
  131372,
  131409,
  131410,
  131884,
  132396,
  132908,
  133420,
  133932,
  134444,
  134956,
  134957,
  134958,
  134959,
  134960,
  134961,
  134962,
  134963,
  134964,
  134965,
  134966,
  134967,
  134968,
  134969,
  134970,
  134971,
  134972,
  134973,
  134974,
  134975,
  134976,
  134977,
  134978,
  134979,
  134980,
  134981,
  134982,
  134983,
  134984,
  134985,
  134986,
  135468,
  135980,
  136492,
  137004,
  137516,
  138028,
  138540,
  139052,
  139564,
  140076,
  140588,
  141100,
  141612,
  142124,
  142636,
  143148,
  143660,
  144172,
  144709,
  145196,
  145197,
  145198,
  145199,
  145200,
  145201,
  145202,
  145203,
  145204,
  145205,
  145206,
  145207,
  145208,
  145209,
  145210,
  145211,
  145212,
  145213,
  145214,
  145215,
  145216,
  145217,
  145218,
  145219,
  145220,
  145221
] };
var ENEMIES = {
  chicken: { name: "Chicken", model: "mobs/chicken.glb", h: 0.65, r: 0.4, hp: 4, speed: 2.6, dmg: 3, xp: 1, walk: "Walk", idle: "Idle" },
  goblin: { name: "Goblin", model: "mobs/goblin.glb", h: 1.15, r: 0.5, hp: 9, speed: 2.4, dmg: 5, xp: 1, walk: "walk", idle: "idle" },
  skeleton: { name: "Skeleton", model: "mobs/Skelly.glb", mixamo: true, h: 1.5, r: 0.5, hp: 16, speed: 2.5, dmg: 7, xp: 2 },
  fox: { name: "Fox", model: "mobs/fox.glb", h: 1, r: 0.5, hp: 10, speed: 4.4, dmg: 5, xp: 2, walk: "Run", idle: "Idle" },
  wolf: { name: "Wolf", model: "mobs/wolf.glb", h: 1.3, r: 0.6, hp: 22, speed: 4, dmg: 8, xp: 3, walk: "Walk", idle: "Idle" },
  scorpion: { name: "Scorpion", model: "mobs/Scorpion.glb", h: 1.1, r: 0.7, hp: 30, speed: 2.8, dmg: 10, xp: 3, walk: "Walk", idle: "Idle" },
  spider: { name: "Giant Spider", model: "mobs/Spider.glb", h: 0.77, r: 0.8, hp: 40, speed: 3, dmg: 11, xp: 4, walk: "walk", idle: "idle" },
  jspider: { name: "Jungle Spider", model: "mobs/Spider2.glb", h: 0.75, r: 0.8, hp: 55, speed: 3.2, dmg: 13, xp: 5, walk: "walk", idle: "idle" },
  pspider: { name: "Plasma Spider", model: "mobs/Spider3.glb", h: 0.75, r: 0.9, hp: 80, speed: 3.4, dmg: 16, xp: 7, walk: "walk", idle: "idle" },
  slimer: { name: "Slimer", model: "mobs/snail/Slimer.glb", h: 2.1, r: 1.3, hp: 60, speed: 1.8, dmg: 12, xp: 5, walk: "walk", idle: "idle" },
  dwarf: { name: "Frost Dwarf", model: "mobs/snow_biome/dwarf.glb", h: 1.5, r: 0.6, hp: 70, speed: 2.8, dmg: 14, xp: 6, walk: "walk", idle: "idle" },
  wight: { name: "Frost Wight", model: "mobs/snow_biome/frost_wight.glb", h: 2, r: 0.7, hp: 110, speed: 2.9, dmg: 17, xp: 8, walk: "walk", idle: "idle" },
  yeti: { name: "Yeti", model: "mobs/snow_biome/yeti.glb", h: 2.8, r: 1, hp: 190, speed: 3, dmg: 22, xp: 12, walk: "walk", idle: "idle" },
  // more of the wiki bestiary
  cow: { name: "Cow", model: "mobs/cow.glb", h: 1.3, r: 0.7, hp: 35, speed: 2.2, dmg: 9, xp: 3, walk: "Walk", idle: "Idle" },
  dog: { name: "Dog", model: "mobs/dog.glb", h: 1, r: 0.5, hp: 14, speed: 4.3, dmg: 6, xp: 2, walk: "Walk", idle: "Idle" },
  camel: { name: "Camel", model: "mobs/camel.glb", h: 1.95, r: 0.9, hp: 75, speed: 2.7, dmg: 13, xp: 5, walk: "Walk", idle: "Idle" },
  alligator: { name: "Alligator", model: "mobs/alligator.glb", h: 1, r: 0.9, hp: 90, speed: 2.9, dmg: 15, xp: 6, walk: "walk", idle: "idle" },
  snowman: { name: "Snowman", model: "mobs/snowman.glb", h: 1.8, r: 0.6, hp: 45, speed: 2.3, dmg: 10, xp: 4 },
  star: { name: "Star", model: "mobs/star/Star_tpose.glb", mixamo: true, h: 1.7, r: 0.6, hp: 38, speed: 3.1, dmg: 10, xp: 4 },
  starwiz: { name: "Star Wizard", model: "mobs/star/Star_wizard.glb", mixamo: true, h: 2, r: 0.6, hp: 80, speed: 2.8, dmg: 15, xp: 7 },
  boatman: { name: "Spiky Boatman", model: "mobs/cactus/Spikey_tpose.glb", mixamo: true, h: 2.1, r: 0.7, hp: 100, speed: 2.7, dmg: 17, xp: 8 },
  lildragon: { name: "Lil Dragon", model: "mobs/Dragon.glb", h: 2.6, r: 1, hp: 220, speed: 3.3, dmg: 20, xp: 14, walk: "Walk", idle: "Idle" },
  bandit: { name: "Bandit", rig: { hair: "Short", head: "Ranger Helmet", chest: "Ranger Chestplate", hands: "Ranger Gauntlets", legs: "Ranger Leggings", feet: "Ranger Boots" }, h: 1.6, r: 0.5, hp: 28, speed: 3.6, dmg: 9, xp: 3 },
  shapewiz: { name: "Shape Wizard", rig: { hair: "Long", head: "Shape Wizard Hat", chest: "Shape Robe", legs: "Shape Skirt", shirt: 8014536 }, h: 1.6, r: 0.5, hp: 70, speed: 3, dmg: 15, xp: 7 },
  mslimer: { name: "Mutant Slimer", model: "mobs/snail/mutant slimer.glb", h: 1.85, r: 1.5, hp: 260, speed: 2.6, dmg: 22, xp: 15, walk: "walk", idle: "walk" },
  // bosses
  giant: { name: "Lesser Giant", model: "mobs/giant.glb", h: 3.9, r: 1.6, hp: 900, speed: 2.2, dmg: 28, xp: 60, walk: "walk", idle: "idle", boss: true, attacks: ["slam"] },
  // Tutorial Island's own boss (owner 3 Nov: "on tutorial island boss should be sankson"): Survival Sankson, grown huge
  sankson: { name: "Survival Sankson", model: "mobs/sankson/sankson.glb", mixamo: true, h: 3, r: 1.3, hp: 1800, speed: 2.6, dmg: 30, xp: 110, boss: true, attacks: ["slam", "charge"] },
  ogre: { name: "Fudna the Hoard Keeper", model: "mobs/snow_biome/ogre.glb", h: 4.1, r: 1.5, hp: 2200, speed: 2.5, dmg: 34, xp: 120, walk: "walk", idle: "idle", boss: true, attacks: ["slam", "charge"] },
  colossus: { name: "Rime Colossus", model: "mobs/snow_biome/rime_colossus.glb", h: 6, r: 2, hp: 4200, speed: 2.4, dmg: 40, xp: 200, walk: "walk", idle: "idle", boss: true, attacks: ["slam", "volley"], shot: "ice" },
  reaper: { name: "Pumpkin Reaper", model: "mobs/halloween/pumpkin-reaper/pumpkin-reaper.glb", h: 4.4, r: 1.5, hp: 3600, speed: 3.1, dmg: 38, xp: 160, walk: "walk", idle: "idle", boss: true, attacks: ["charge", "volley"], shot: "fire" },
  dragon: { name: "Dragon", model: "mobs/Dragon.glb", h: 3.8, r: 2.4, hp: 9e3, speed: 3.4, dmg: 50, xp: 500, walk: "Walk", idle: "Idle", boss: true, final: true, attacks: ["volley", "slam", "charge"], shot: "fire" }
};
var SPAWN_POOL = [
  { t: 0, type: "chicken", w: 5 },
  { t: 0, type: "goblin", w: 6 },
  { t: 45, type: "fox", w: 3 },
  { t: 75, type: "skeleton", w: 5 },
  { t: 150, type: "wolf", w: 4 },
  { t: 210, type: "scorpion", w: 4 },
  { t: 270, type: "spider", w: 4 },
  { t: 360, type: "slimer", w: 3 },
  { t: 420, type: "jspider", w: 4 },
  { t: 480, type: "dwarf", w: 3 },
  { t: 540, type: "wight", w: 3 },
  { t: 600, type: "pspider", w: 4 },
  { t: 660, type: "yeti", w: 2 },
  { t: 20, type: "dog", w: 3 },
  { t: 100, type: "bandit", w: 4 },
  { t: 180, type: "cow", w: 2 },
  { t: 240, type: "camel", w: 2 },
  { t: 300, type: "snowman", w: 3 },
  { t: 330, type: "alligator", w: 2 },
  { t: 390, type: "bandit", w: 3 },
  // (the Star is a friendly townsman in SankoQuest, never a monster)
  { t: 450, type: "shapewiz", w: 3 },
  { t: 510, type: "boatman", w: 2 },
  { t: 570, type: "starwiz", w: 2 },
  { t: 630, type: "lildragon", w: 2 },
  { t: 600, type: "mslimer", w: 2 }
];
var RETIRE = { chicken: 240, goblin: 420, fox: 420, dog: 360 };
var SNOW_WAVE_AT = 360;
var SNOW_ENEMIES = /* @__PURE__ */ new Set(["wolf", "snowman", "dwarf", "wight", "yeti", "ogre", "colossus"]);
var isSnowEnemy = (type) => SNOW_ENEMIES.has(type);
var BOSS_SCHEDULE = [
  { t: 180, type: "giant" },
  { t: 360, type: "ogre" },
  { t: 540, type: "reaper" },
  { t: 660, type: "colossus" },
  { t: 720, type: "dragon" }
];
var RUN_LENGTH = 900;
var L = (lvl, base, per) => base + per * (lvl - 1);
var WEAPONS = {
  katana: {
    name: "Katana",
    icon: "katana",
    model: "equipment/weapons/blade/katana/{tier}_katana.glb",
    blurb: "Slashes the nearest foe in a wide arc.",
    stats: (l) => ({ dmg: L(l, 9, 3.2), cd: L(l, 1.05, -0.09), range: L(l, 3, 0.35), arc: L(l, 110, 8), both: l >= 4, kb: 1.2 }),
    next: (l) => ["+damage", "+range", "slashes both sides", "faster", "+arc", "Runite edge"][l - 1] || "max"
  },
  bow: {
    name: "Bow",
    icon: "bow",
    model: "equipment/weapons/ranged/bow/bow.glb",
    arrowModel: "equipment/weapons/ranged/arrow/{tier}_arrow.glb",
    blurb: "Looses arrows at the nearest enemies.",
    stats: (l) => ({ dmg: L(l, 8.5, 2.8), cd: L(l, 1.2, -0.09), count: 1 + Math.floor((l + 0) / 2), speed: 21, pierce: l >= 2 ? 1 + (l >= 5 ? 1 : 0) : 0, life: 1.5 }),
    next: (l) => ["+arrow, pierces", "+damage", "+arrow", "pierces twice", "+arrow", "Runite arrows"][l - 1] || "max"
  },
  axe: {
    name: "Throwing Axe",
    icon: "axe",
    model: "equipment/equipment/axe/{tier}_axe.glb",
    blurb: "Hurls axes that spin through a crowd.",
    stats: (l) => ({ dmg: L(l, 12, 4), cd: L(l, 1.9, -0.15), count: 1 + Math.floor((l - 1) / 2), speed: 8.5, life: 1.7, r: L(l, 0.8, 0.12) }),
    next: (l) => ["+damage", "+axe", "+size", "+axe", "+size", "Runite axe"][l - 1] || "max"
  },
  shield: {
    name: "Kiteshield",
    icon: "shield",
    model: "equipment/offhand/kiteshield/{tier}_kiteshield.glb",
    blurb: "Shields circle you and batter anything near.",
    stats: (l) => ({ dmg: L(l, 6, 2.2), count: 1 + Math.floor((l + 1) / 2), radius: L(l, 2.4, 0.15), spin: L(l, 2.4, 0.25), hitcd: 0.45, r: 0.7 }),
    next: (l) => ["+damage", "+shield", "+speed", "+shield", "+damage", "Runite wall"][l - 1] || "max"
  },
  staff: {
    name: "Spells",
    icon: "staff",
    model: "equipment/weapons/staff/staff.glb",
    blurb: "Fires homing shard bolts that burst on impact.",
    stats: (l) => ({ dmg: L(l, 11, 3.2), cd: L(l, 1.2, -0.09), count: 1 + Math.floor((l + 1) / 3), speed: 14, burst: l >= 2 ? L(l, 1.5, 0.25) : 0, life: 2.2 }),
    next: (l) => ["+bolt, bolts burst", "+burst", "+damage", "+bolt", "+burst", "Void shards"][l - 1] || "max"
  },
  pickaxe: {
    name: "Pickaxe Quake",
    icon: "pickaxe",
    model: "equipment/equipment/pickaxe/{tier}_pickaxe.glb",
    blurb: "Slams the ground, hurting and shoving everything nearby.",
    stats: (l) => ({ dmg: L(l, 18, 5.5), cd: L(l, 2.6, -0.24), radius: L(l, 3.5, 0.5), kb: 3.5 }),
    next: (l) => ["+radius", "+damage", "faster", "+radius", "+damage", "Runite quake"][l - 1] || "max"
  },
  greatsword: {
    name: "Two-handed Sword",
    icon: "2hd",
    model: "equipment/weapons/blade/2hd/{tier}_2hd.glb",
    blurb: "Every few seconds, a full spin that throws everything back.",
    stats: (l) => ({ dmg: L(l, 15, 5), cd: L(l, 2.8, -0.22), range: L(l, 3.3, 0.3), kb: 2.8 }),
    next: (l) => ["+damage", "+range", "faster", "+damage", "+range", "Runite blade"][l - 1] || "max"
  },
  shortsword: {
    name: "Short Swords",
    icon: "shortsword",
    model: "equipment/weapons/blade/shortsword/{tier}_shortsword.glb",
    blurb: "Throws short swords at the nearest monster.",
    stats: (l) => ({ dmg: L(l, 7.5, 2.2), cd: L(l, 0.55, -0.035), count: 1 + Math.floor(l / 2), speed: 22, pierce: l >= 4 ? 1 : 0, life: 1 }),
    next: (l) => ["+sword", "+damage", "+sword, pierces", "+damage", "+sword", "Runite swords"][l - 1] || "max"
  },
  baseball: {
    name: "Baseball",
    icon: "baseball",
    model: null,
    blurb: "A ball that ricochets from monster to monster.",
    stats: (l) => ({ dmg: L(l, 10, 3), cd: L(l, 1.45, -0.08), count: 1, speed: 17, bounces: 2 + Math.floor(l / 2), life: 2.4, r: 0.45, kb: 1.6 }),
    next: (l) => ["+bounce", "+damage", "+bounce", "faster", "+bounce", "Home run ready"][l - 1] || "max"
  },
  lighter: {
    name: "Lighter",
    icon: "lighter",
    model: null,
    blurb: "A ring of fire around you burns anything that comes close.",
    stats: (l) => ({ dmg: L(l, 6.5, 2.2), radius: L(l, 2.6, 0.28), tick: 0.45 }),
    next: (l) => ["+radius", "+damage", "+radius", "+damage", "+radius", "Inferno ready"][l - 1] || "max"
  }
};
var WEAPON_IDS = Object.keys(WEAPONS);
function weaponStats(p, id) {
  const level = p.weapons[id] || 0;
  if (!level) return null;
  const stats = WEAPONS[id].stats(level), points = p.quality?.weapons?.[id] || 0;
  if (!points) return stats;
  const stronger = WEAPONS[id].stats(level + points / 100);
  for (const key of ["dmg", "cd", "range", "arc", "r", "radius", "spin", "burst"]) if (typeof stats[key] === "number") stats[key] = stronger[key];
  return stats;
}
function passiveStrength(p, id) {
  return (p.passives[id] || 0) + (p.quality?.passives?.[id] || 0) / 100;
}
var PASSIVES = {
  might: { name: "Power Amulet", item: "Power Amulet", blurb: "+12% damage per level." },
  haste: { name: "Spirit Shard", item: "Spirit Shard", blurb: "-7% cooldowns per level. Shields and the Lighter hit more often." },
  vigor: { name: "Cooked Meat", item: "Cooked Meat", blurb: "+20 max HP and slow regeneration per level." },
  boots: { name: "Winged Boots", item: "Winged Boots", blurb: "+8% move speed per level." },
  magnet: { name: "Warp Shard", item: "Warp Shard", blurb: "+30% pickup range per level." },
  armor: { name: "Plate Armor", item: "Bronze Chestplate", blurb: "-1 damage taken per level. You wear each new tier." },
  growth: { name: "Wizard Hat", item: "Wizard Hat", blurb: "+10% experience per level." },
  area: { name: "Cape", item: "Cape", blurb: "+10% attack area per level. Arrows and thrown swords hit wider too." },
  amount: { name: "Feather", item: "Feather", blurb: "+1 projectile from every weapon that throws or fires (+2 at level 4), and they fly 6% farther per level." },
  crit: { name: "Amanita", item: "Amanita", blurb: "+5% critical chance per level; critical hits hit harder too." },
  thorns: { name: "Scorpion Carapace", item: "Scorpion Carapace", blurb: "Monsters that hit you take 8 damage per level back." },
  greed: { name: "Rusty Key", item: "Rusty Key", blurb: "+15% coins and more reward caskets per level." },
  // owner 3 Nov: "we need item thats like curse to make more monsters": risk for reward. Casual only: in a kills-per-minute
  // race it would multiply the score for whoever happened to be offered the card. Pace 1 (ranked week 0) never sees it.
  curse: { name: "Pumpkin Head", item: "Pumpkin Head", pace: 2, casual: true, blurb: "Cursed: per level, monsters come 15% faster, 8% more of them at once, with 8% more health and 6% more damage. More kills, more experience, more coins." }
};
var ARMOR_TIERS = ["Bronze", "Iron", "Steel", "Mithril", "Adamantite", "Runite"];
var METAL_FAMILY = { katana: "Katana", axe: "Axe", shortsword: "Short Sword", pickaxe: "Pickaxe", greatsword: "2hd Sword" };
var BOW_NAMES = ["Bow", "Oak Bow", "Cherry Bow", "Glacial Bow"];
var ARROW_TIERS = ["Bronze", "Iron", "Steel", "Mithril", "Adamantite"];
var METAL_DMG = [1, 1.1, 1.2, 1.32, 1.45, 1.6];
var BOW_TIER = [0, 1, 3, 4];
var ARROW_DMG = [1, 1.06, 1.12, 1.18, 1.24];
var ARROW_PIERCE = [0, 1, 1, 2, 2];
var WEAPON_ITEMS = {};
for (const [id, fam] of Object.entries(METAL_FAMILY)) METAL_TIERS.forEach((t, i) => {
  WEAPON_ITEMS[`${t} ${fam}`] = { weapon: id, slot: id, kind: "metal", step: i, tier: i };
});
BOW_NAMES.forEach((n, i) => {
  WEAPON_ITEMS[n] = { weapon: "bow", slot: "bow", kind: "bow", step: i, tier: BOW_TIER[i] };
});
ARROW_TIERS.forEach((t, i) => {
  WEAPON_ITEMS[`${t} Arrow`] = { weapon: "bow", slot: "arrow", kind: "arrow", step: i, tier: i };
});
var STEPS = { bow: BOW_NAMES.length, arrow: ARROW_TIERS.length };
function clampStep(slot, step2) {
  const n = STEPS[slot] || METAL_TIERS.length;
  const v = Math.floor(Number(step2) || 0);
  return v < 0 ? 0 : v >= n ? n - 1 : v;
}
var isWeaponItem = (name) => typeof name === "string" && Object.hasOwn(WEAPON_ITEMS, name);
function weaponSlotItem(slot, step2 = 0) {
  const s = clampStep(slot, step2);
  return slot === "arrow" ? `${ARROW_TIERS[s]} Arrow` : slot === "bow" ? BOW_NAMES[s] : `${METAL_TIERS[s]} ${METAL_FAMILY[slot]}`;
}
function weaponMetal(id, wm = {}) {
  if (METAL_FAMILY[id]) return { dmg: METAL_DMG[clampStep(id, wm[id])], pierce: 0 };
  if (id === "bow") {
    const a = clampStep("arrow", wm.arrow);
    return { dmg: METAL_DMG[BOW_TIER[clampStep("bow", wm.bow)]] * ARROW_DMG[a], pierce: ARROW_PIERCE[a] };
  }
  return { dmg: 1, pierce: 0 };
}
function weaponLook(id, wm = {}, evo = false) {
  if (id === "arrow") return clampStep("arrow", wm.arrow);
  if (evo) return id === "bow" ? 3 : 5;
  return clampStep(id, wm[id]);
}
var PASSIVE_IDS = Object.keys(PASSIVES);
var passiveIdsAt = (pace, ranked = false) => PASSIVE_IDS.filter((id) => !(PASSIVES[id].pace > (pace || 1)) && !(ranked && PASSIVES[id].casual));
var CURSE = { rate: 0.15, cap: 0.08, hp: 0.08, dmg: 0.06 };
var EVOLUTIONS = {
  katana: { passive: "might", name: "Shadowfang Axe", item: "Shadowfang Axe", blurb: "Spins a full circle, hits harder, and heals on every hit." },
  bow: { passive: "boots", name: "Glacial Bow", item: "Glacial Bow", blurb: "Volleys of arrows that pierce everything." },
  axe: { passive: "vigor", name: "Runite Axe Storm", item: "Runite Axe", blurb: "Twice the axes, bigger and heavier." },
  shield: { passive: "armor", name: "Ogre Shield", item: "Ogre Shield", blurb: "More shields, wider orbit, brutal knockback." },
  staff: { passive: "growth", name: "Void Spells", item: "Void Shard", blurb: "More bolts that burst in huge blasts." },
  pickaxe: { passive: "haste", name: "Earthshaker", item: "Earth Shard", blurb: "Faster, wider quakes." },
  greatsword: { passive: "vigor", name: "Bloodspinner", item: "Adamantite 2hd Sword", blurb: "Spins twice as often, wider, and heals you with every spin." },
  shortsword: { passive: "magnet", name: "Swordstorm", item: "Adamantite Short Sword", blurb: "A ring of swords in every direction that pierces everything." },
  baseball: { passive: "amount", name: "Home Run", item: "Baseball", blurb: "Two balls at once that bounce eight times and knock monsters flying." },
  lighter: { passive: "crit", name: "Inferno", item: "Fire Shard", blurb: "A wide blazing ring that burns twice as hard." }
};
var EVOLUTION_ALTERNATIVES = { katana: "thorns", bow: "crit", axe: "amount", shield: "thorns", staff: "area", pickaxe: "area", greatsword: "armor", shortsword: "boots", baseball: "might", lighter: "growth" };
function evolutionPassives(id, pace) {
  if (!Object.hasOwn(EVOLUTIONS, id)) return [];
  const original = EVOLUTIONS[id].passive, alternative = pace >= 2 && EVOLUTION_ALTERNATIVES[id];
  return alternative ? [original, alternative] : [original];
}
function evolveStats(id, s) {
  s = { ...s };
  switch (id) {
    case "katana":
      s.arc = 360;
      s.both = false;
      s.dmg *= 1.6;
      s.range *= 1.25;
      s.lifesteal = 1;
      break;
    case "bow":
      s.count += 3;
      s.pierce = 99;
      s.dmg *= 1.3;
      break;
    case "axe":
      s.count *= 2;
      s.dmg *= 1.5;
      s.r *= 1.4;
      break;
    case "shield":
      s.count += 2;
      s.radius *= 1.3;
      s.dmg *= 1.8;
      s.hitcd *= 0.7;
      break;
    case "staff":
      s.count += 2;
      s.burst = Math.max(s.burst, 2.5) * 1.3;
      s.dmg *= 1.5;
      break;
    case "pickaxe":
      s.radius *= 1.5;
      s.cd *= 0.6;
      s.dmg *= 1.6;
      break;
    case "greatsword":
      s.cd *= 0.5;
      s.dmg *= 1.4;
      s.range *= 1.2;
      s.heal = 4;
      break;
    case "shortsword":
      s.ring = true;
      s.count = 10;
      s.pierce = 99;
      s.dmg *= 1.2;
      break;
    case "baseball":
      s.count += 1;
      s.bounces = 8;
      s.dmg *= 1.4;
      s.kb = 4;
      s.cd *= 0.8;
      break;
    case "lighter":
      s.radius *= 1.5;
      s.dmg *= 2;
      s.tick *= 0.8;
      break;
  }
  return s;
}
var CARD_RARITIES = ["common", "uncommon", "rare", "epic"];
var CARD_ODDS = [70, 22, 7, 1];
var CARD_GAIN = [1, 1, 1, 1];
var CARD_QUALITY = [100, 115, 130, 150];
var CARD_HEAL = [40, 60, 80, 9999];
function cardLuck(meta = {}, passives = {}) {
  return 0.05 * (Number(meta.luck) || 0) + 0.04 * (Number(passives.greed) || 0);
}
function cardOdds(luck = 0) {
  const L2 = Math.max(0, luck), r = CARD_ODDS[1] * (1 + L2), e = CARD_ODDS[2] * (1 + 1.5 * L2), l = CARD_ODDS[3] * (1 + 2 * L2);
  return [100 - r - e - l, r, e, l];
}
function rarityFromRoll(u, luck = 0) {
  const odds = cardOdds(luck);
  let x = u * 100;
  for (let i = odds.length - 1; i > 0; i--) {
    if (x < odds[i]) return i;
    x -= odds[i];
  }
  return 0;
}
var SKILLS = {
  combat: { max: 5, name: "Combat", icon: "ui/skills/attack.png", blurb: "+4% damage per level." },
  magic: { max: 5, name: "Magic", icon: "ui/skills/magic.png", blurb: "+10% pickup range per level." },
  mining: { max: 5, name: "Mining", icon: "ui/skills/mining.png", blurb: "+1 armor at levels 2 and 4." },
  smithing: { max: 5, name: "Smithing", icon: "ui/skills/smithing.png", blurb: "+8 max HP per level." },
  woodcutting: { max: 5, name: "Woodcutting", icon: "ui/skills/woodcutting.png", blurb: "+3% move speed per level." },
  fletching: { max: 5, name: "Fletching", icon: "ui/skills/crafting.png", blurb: "-3% cooldowns per level." },
  fishing: { max: 5, name: "Fishing", icon: "ui/skills/fishing.png", blurb: "Food heals 12% more per level." },
  cooking: { max: 5, name: "Cooking", icon: "ui/skills/cooking.png", blurb: "Regenerate 0.1 HP/s per level." },
  herblore: { max: 5, name: "Mixnometry", icon: "ui/skills/mixnometry.png", blurb: "+5% experience per level." },
  strength: { name: "Strength", icon: "ui/skills/strength.png", max: 2, costs: [1500, 4e3], blurb: "+1 weapon slot per rank. Start with 4; train up to 6." },
  prayer: { name: "Prayer", icon: "ui/skills/prayer.png", max: 2, costs: [1500, 4e3], blurb: "+1 passive slot per rank. Start with 4; train up to 6." },
  projectileSpeed: { name: "Projectile speed", icon: "ui/items/item_Bronze_Arrow.png", max: 2, costs: [300, 800], blurb: "+10% projectile speed per rank." },
  amount: { name: "One more projectile", icon: "ui/items/item_Feather.png", max: 1, costs: [3e3], blurb: "+1 projectile for the same weapons as the Feather." },
  area: { name: "Area", icon: "ui/items/item_Cape.png", max: 2, costs: [300, 800], blurb: "+5% attack area per rank, like the Cape." },
  luck: { name: "Luck", icon: "ui/items/item_Rusty_Key.png", max: 3, costs: [250, 600, 1200], blurb: "+15% casket drops and bonus boss chest chance per rank." },
  coins: { name: "Coins", icon: "ui/items/item_Gold.png", max: 5, costs: [150, 400, 800, 1400, 2200], blurb: "+10% coins earned at the end of a run per rank." },
  rerolls: { name: "Rerolls", icon: "ui/items/item_Warp_Shard.png", max: 3, costs: [300, 800, 1600], blurb: "+1 level-up reroll per run per rank." },
  revive: { name: "Revive", icon: "ui/items/item_Power_Amulet.png", max: 1, costs: [5e3], blurb: "Once per run, return at 50% HP with 2 seconds of protection." }
};
var SKILL_IDS = Object.keys(SKILLS);
function clampSkills(saved) {
  const out = {};
  if (saved && typeof saved === "object" && !Array.isArray(saved)) for (const id of SKILL_IDS) {
    if (Object.hasOwn(saved, id)) out[id] = Math.max(0, Math.min(SKILLS[id].max, Math.floor(Number(saved[id])) || 0));
  }
  return out;
}
var ADVENTURERS = [
  { id: "adventurer", name: "The Adventurer", weapon: "katana", unlock: 0, bonus: { speed: 0.06 }, blurb: "Quick on their feet.", look: { hair: "Short", hairColor: 7029795, skin: 14658187, shirt: 12159557, pants: 4869987, armor: {} } },
  { id: "knight", name: "Bronze Knight", weapon: "shield", unlock: 0, bonus: { armor: 1 }, blurb: "Starts armored and hard to move.", look: { hair: "Shaggy", hairColor: 2759698, skin: 12882539, armor: { head: "Bronze Helmet", chest: "Bronze Chestplate", hands: "Bronze Gauntlets", legs: "Bronze Leggings", feet: "Bronze Boots" } } },
  { id: "ranger", name: "Ranger", weapon: "bow", unlock: 0, bonus: { magnet: 0.3 }, blurb: "Sees loot from further away.", look: { hair: "Pomp", hairColor: 10968089, skin: 14861487, armor: { head: "Ranger Helmet", chest: "Ranger Chestplate", hands: "Ranger Gauntlets", legs: "Ranger Leggings", feet: "Ranger Boots" } } },
  { id: "wizard", name: "Wizard", weapon: "staff", unlock: 1, bonus: { growth: 0.12 }, blurb: "Learns faster.", look: { hair: "Long", hairColor: 14540253, skin: 14658187, armor: { head: "Wizard Hat", chest: "Wizard Robe", legs: "Wizard Skirt" } } },
  { id: "farmer", name: "Farmer", weapon: "axe", unlock: 1, bonus: { hp: 25 }, blurb: "Tough from a life of chores.", look: { hair: "Middle Part", hairColor: 10055519, skin: 13672819, shirt: 7049038, pants: 6967864, armor: { head: "Straw Hat", feet: "Quilted Boots" } } },
  { id: "miner", name: "Miner", weapon: "pickaxe", unlock: 2, bonus: { dmg: 0.1 }, blurb: "Hits the ground running.", look: { hair: "Sideswept", hairColor: 4863014, skin: 12488288, shirt: 9079434, pants: 3883602, armor: { head: "Bowler Hat", feet: "Iron Boots" } } },
  { id: "shape", name: "Shape Wizard", weapon: "staff", unlock: 3, bonus: { haste: 0.1 }, blurb: "Casts a little faster.", look: { hair: "Buns", hairColor: 12882539, skin: 15189161, armor: { head: "Shape Wizard Hat", chest: "Shape Robe", legs: "Shape Skirt" } } },
  { id: "swordsman", name: "Swordsman", weapon: "greatsword", unlock: 2, bonus: { hp: 15, armor: 1 }, blurb: "A great blade and the shoulders for it.", look: { hair: "Shaggy", hairColor: 3877405, skin: 13081203, armor: { head: "Iron Helmet", chest: "Iron Chestplate", hands: "Iron Gauntlets", legs: "Iron Leggings", feet: "Iron Boots" } } },
  { id: "rogue", name: "Rogue", weapon: "shortsword", unlock: 2, bonus: { speed: 0.08 }, blurb: "Quick hands, quicker feet.", look: { hair: "Liberty Spikes", hairColor: 1842210, skin: 14858646, shirt: 3095340, pants: 2501171, armor: { head: "Beret", feet: "Green Boots" } } },
  { id: "alex", name: "Alex", weapon: "greatsword", unlock: 0, special: true, startPassives: { boots: 1 }, bonus: { hp: 40, armor: 1 }, blurb: "Washed up on Tutorial Island in bronze, with winged boots.", look: { hair: "Short", hairColor: 4863014, skin: 14658187, armor: { head: "Bronze Helmet", chest: "Bronze Chestplate", hands: "Bronze Gauntlets", legs: "Bronze Leggings", feet: "Winged Boots" } } },
  { id: "jack", name: "Pumpkin Jack", weapon: "katana", unlock: 4, bonus: { dmg: 0.08, speed: 0.04 }, blurb: "Lost his head, found a pumpkin.", look: { hair: null, skin: 14658187, shirt: 6961690, pants: 2894899, armor: { head: "Pumpkin Head", feet: "Green Boots" } } }
];
var ADVENTURER_BY_ID = Object.fromEntries(ADVENTURERS.map((a) => [a.id, a]));
var PLAYER_BASE = { hp: 100, speed: 5.4, magnet: 2.8, radius: 0.5 };
var TUMBLE = { duration: 0.2, speed: 18, cooldown: 5 };
function xpForLevel(level) {
  return Math.round(4 + level * 2.6 + level * level * 0.65);
}
var P = (t, type, w) => ({ t, type, w });
var MAPS = [
  {
    id: "greentown",
    name: "Greentown",
    blurb: "The village square and the castle, where every run begins.",
    cx: 365,
    cz: 300,
    r: 1e3,
    sky: 10143720,
    fog: 10143720,
    light: 1,
    music: "early",
    length: RUN_LENGTH,
    finalBoss: "dragon",
    pool: SPAWN_POOL,
    retire: RETIRE,
    bosses: BOSS_SCHEDULE,
    events: ["stampede", "treasure", "swarm", "meteors"]
    // the chickens have had enough
  },
  {
    id: "apache",
    name: "Apache Desert",
    blurb: "Scorpions, camels and bandits in the shadow of the sphinx.",
    cx: 192,
    cz: 78,
    r: 1e3,
    sky: 15916196,
    fog: 15916196,
    light: 1.15,
    music: "mid",
    length: RUN_LENGTH,
    finalBoss: "dragon",
    pool: [P(0, "scorpion", 6), P(0, "fox", 4), P(40, "bandit", 5), P(90, "camel", 3), P(170, "spider", 4), P(250, "alligator", 2), P(300, "skeleton", 4), P(340, "jspider", 3), P(420, "mslimer", 2), P(500, "boatman", 3), P(560, "boatman", 3), P(620, "pspider", 3)],
    retire: { fox: 360 },
    events: ["sandstorm", "sandstorm", "treasure", "swarm", "meteors"],
    // desert winds
    bosses: [{ t: 180, type: "giant" }, { t: 360, type: "ogre" }, { t: 600, type: "colossus" }, { t: 720, type: "dragon" }]
  },
  {
    id: "duel",
    name: "Fighting Forum",
    blurb: "The duel arena and its town of bandits, wizards and sword-fighters. Champions step up to fight you.",
    cx: 95,
    cz: 120,
    r: 1e3,
    sky: 15128244,
    fog: 15128244,
    light: 1.1,
    music: "mid",
    length: RUN_LENGTH,
    finalBoss: "colossus",
    pool: [P(0, "bandit", 6), P(0, "goblin", 4), P(60, "skeleton", 5), P(120, "wolf", 4), P(200, "shapewiz", 4), P(300, "scorpion", 3), P(400, "spider", 3), P(500, "starwiz", 3), P(600, "jspider", 3)],
    retire: { goblin: 360 },
    events: ["duel", "duel", "treasure", "swarm", "meteors"],
    // champions of the arena
    bosses: [{ t: 200, type: "giant" }, { t: 420, type: "ogre" }, { t: 600, type: "reaper" }, { t: 720, type: "colossus" }]
  },
  {
    id: "graves",
    name: "Chapel Graves",
    blurb: "The chapel and the cemetery. The dead do not stay down.",
    cx: 255,
    cz: 250,
    r: 1e3,
    sky: 3360335,
    fog: 3360335,
    light: 0.85,
    music: "final",
    length: RUN_LENGTH,
    finalBoss: "reaper",
    pool: [P(0, "skeleton", 8), P(0, "dog", 2), P(60, "bandit", 4), P(120, "wolf", 3), P(180, "spider", 4), P(260, "shapewiz", 4), P(340, "snowman", 3), P(440, "starwiz", 3), P(540, "jspider", 3), P(640, "pspider", 3)],
    retire: { dog: 240 },
    events: ["rising", "rising", "treasure", "swarm", "meteors"],
    // the dead do not stay down
    bosses: [{ t: 240, type: "giant" }, { t: 450, type: "ogre" }, { t: 720, type: "reaper" }]
  },
  {
    id: "swamp",
    name: "The Wilderness",
    blurb: "The swamp west of Greentown: slimers, spiders and things in the water.",
    cx: 195,
    cz: 280,
    r: 1e3,
    sky: 9678986,
    fog: 9678986,
    light: 0.9,
    music: "late",
    length: RUN_LENGTH,
    finalBoss: "ogre",
    pool: [P(0, "fox", 5), P(0, "goblin", 4), P(40, "spider", 4), P(80, "slimer", 4), P(150, "alligator", 3), P(200, "jspider", 4), P(260, "wolf", 3), P(340, "mslimer", 3), P(420, "skeleton", 3), P(520, "pspider", 4), P(620, "lildragon", 2)],
    retire: { fox: 200, goblin: 260, spider: 420 },
    events: ["ambush", "ambush", "treasure", "swarm", "meteors"],
    // things in the water
    bosses: [{ t: 200, type: "giant" }, { t: 480, type: "colossus" }, { t: 720, type: "ogre" }]
  },
  {
    id: "goblins",
    name: "Goblin War",
    blurb: "North of Greentown, where the goblin camps fight over the ruins.",
    cx: 352,
    cz: 108,
    r: 1e3,
    sky: 11125718,
    fog: 11125718,
    light: 1,
    music: "mid",
    length: RUN_LENGTH,
    finalBoss: "ogre",
    pool: [P(0, "goblin", 9), P(40, "bandit", 4), P(100, "wolf", 3), P(180, "dwarf", 3), P(260, "shapewiz", 3), P(340, "jspider", 3), P(440, "wight", 3), P(540, "yeti", 2), P(640, "lildragon", 2)],
    retire: { goblin: 600 },
    events: ["warband", "warband", "treasure", "swarm", "meteors"],
    // the goblin camps send warbands
    bosses: [{ t: 180, type: "giant" }, { t: 420, type: "ogre" }, { t: 660, type: "colossus" }, { t: 780, type: "ogre" }]
  },
  {
    id: "paya",
    name: "Payasan Village",
    blurb: "The snowy village east of the desert lake: stars, wizards, snowmen and a yeti.",
    cx: 240,
    cz: 144,
    r: 1e3,
    sky: 13623536,
    fog: 13623536,
    light: 1,
    music: "boss",
    length: RUN_LENGTH,
    finalBoss: "dragon",
    // the village proper (243,106 was a blocked gap on a ridge; audit 3 Nov)
    pool: [P(0, "dog", 5), P(0, "chicken", 4), P(50, "bandit", 4), P(90, "snowman", 4), P(180, "camel", 3), P(260, "dwarf", 4), P(340, "shapewiz", 4), P(420, "yeti", 1), P(430, "starwiz", 3), P(520, "boatman", 3), P(620, "lildragon", 3)],
    retire: { chicken: 240, dog: 360 },
    events: ["blizzard", "blizzard", "treasure", "swarm", "meteors"],
    // snow country
    bosses: [{ t: 210, type: "giant" }, { t: 420, type: "reaper" }, { t: 620, type: "colossus" }, { t: 720, type: "dragon" }]
  },
  {
    // SankoQuest's underground area under Apache town (its ground and scene sit in our world's empty south-west corner,
    // see tools/build-world-tiles.py). Opens with Apache Desert, not the map before it in this list.
    id: "oasis",
    name: "Hidden Oasis",
    after: "apache",
    under: true,
    area: [0, 448, 128, 512],
    blurb: "Behind the locked door under Apache town: a cave of alligator pools and the old factory beyond it.",
    cx: 37.5,
    cz: 485.5,
    r: 1e3,
    sky: 920328,
    fog: 920328,
    light: 0.6,
    music: "final",
    length: RUN_LENGTH,
    finalBoss: "colossus",
    pool: [P(0, "jspider", 5), P(0, "slimer", 4), P(40, "scorpion", 3), P(90, "alligator", 4), P(200, "mslimer", 3), P(280, "skeleton", 3), P(360, "pspider", 4), P(560, "boatman", 2), P(640, "lildragon", 2)],
    retire: { scorpion: 300, jspider: 420 },
    events: ["ambush", "swarm", "treasure", "ambush"],
    // alligators and slimers out of the pools
    bosses: [{ t: 210, type: "giant" }, { t: 450, type: "reaper" }, { t: 720, type: "colossus" }]
  },
  {
    id: "tutorial",
    name: "Tutorial Island",
    special: true,
    forceAdv: "alex",
    blurb: "Where every adventurer washes up. You play as Alex. A gentler ten minutes, open from the start.",
    cx: 82,
    cz: 248,
    r: 1e3,
    sky: 11064560,
    fog: 11064560,
    light: 1.05,
    music: "early",
    length: 600,
    finalBoss: "sankson",
    pool: [P(0, "chicken", 6), P(0, "cow", 3), P(30, "goblin", 5), P(90, "dog", 3), P(150, "fox", 3), P(240, "spider", 4), P(330, "skeleton", 4), P(420, "wolf", 3), P(500, "jspider", 3)],
    retire: { chicken: 200, cow: 260 },
    bosses: [{ t: 240, type: "giant" }, { t: 480, type: "sankson" }]
  },
  {
    id: "world",
    name: "The Whole World",
    special: true,
    world: true,
    blurb: "All of SankoQuest at once. Thirty minutes, and the monsters change with the land you are in.",
    cx: 365,
    cz: 300,
    r: 1e3,
    sky: 10143720,
    fog: 10143720,
    light: 1,
    music: "early",
    length: 1800,
    finalBoss: "dragon",
    pool: SPAWN_POOL,
    retire: RETIRE,
    bosses: [{ t: 180, type: "giant" }, { t: 420, type: "ogre" }, { t: 660, type: "reaper" }, { t: 900, type: "colossus" }, { t: 1140, type: "ogre" }, { t: 1380, type: "colossus" }, { t: 1560, type: "dragon" }]
  }
];
var MAP_BY_ID = Object.fromEntries(MAPS.map((m) => [m.id, m]));
var METAL_PIECES = [["head", "Helmet"], ["chest", "Chestplate"], ["hands", "Gauntlets"], ["legs", "Leggings"], ["feet", "Boots"]];
var METAL_ARMOR = [0.2, 0.3, 0.4, 0.5, 0.6, 0.75];
var GEAR = {};
ARMOR_TIERS.forEach((t, i) => {
  for (const [slot, piece] of METAL_PIECES) GEAR[`${t} ${piece}`] = { slot, set: t, tier: i, bonus: { armor: METAL_ARMOR[i] } };
});
ARMOR_TIERS.forEach((t, i) => {
  const low = t.toLowerCase();
  GEAR[`${t} Kiteshield`] = { slot: "offhand", tier: i, model: `equipment/offhand/kiteshield/${low}_kiteshield.glb`, bonus: { armor: [0.3, 0.45, 0.6, 0.75, 0.9, 1.1][i], hp: [4, 6, 8, 10, 12, 15][i] } };
  GEAR[`${t} Shield`] = { slot: "offhand", tier: i, model: `equipment/offhand/shield/${low}_shield.glb`, bonus: { armor: METAL_ARMOR[i], speed: 0.02 } };
});
["Bronze", "Iron", "Steel"].forEach((t, i) => {
  for (const [slot, piece] of METAL_PIECES) GEAR[`${t} ${piece} (t)`] = { slot, set: t, tier: i, rarity: "rare", trim: true, pace: 2, file: `${t} ${piece}_trimmed`, bonus: { armor: Math.round(METAL_ARMOR[i] * 1.25 * 100) / 100, hp: 3 } };
});
Object.assign(GEAR, {
  // the lowest shield (SankoQuest has no model for it, and its icon is not on the CDN: the Bronze Shield's model in wood
  // brown, and a wooden icon of our own)
  "Wooden Shield": { slot: "offhand", tier: 0, pace: 2, model: "equipment/offhand/shield/bronze_shield.glb", tint: 9067051, bonus: { armor: 0.1, speed: 0.02 } },
  // the Minion set (SankoQuest's Mystic robe and skirt models): for magic weapons, the Shard Staff and the Lighter
  "Minion Robe": { slot: "chest", set: "Minion", tier: 3, pace: 2, file: "Mystic Robe", bonus: { magic: 0.08, hp: 5 } },
  "Minion Skirt": { slot: "legs", set: "Minion", tier: 3, pace: 2, file: "Mystic Skirt", bonus: { magic: 0.06, haste: 0.02 } },
  // SankoQuest's three amulets (Magician's: magic attack 10; Warrior's: melee strength 10; Power: +6 to every attack and
  // defence), on the scale of our other pieces: an attack of ~10 is about +5% damage, a defence of 6 about +0.3 armor
  "Magician's Amulet": { slot: "neck", tier: 2, pace: 2, rarity: "rare", bonus: { magic: 0.12, haste: 0.02 } },
  "Warrior's Amulet": { slot: "neck", tier: 2, pace: 2, rarity: "rare", bonus: { dmg: 0.05 } },
  "Power Amulet": { slot: "neck", tier: 3, pace: 2, rarity: "rare", bonus: { dmg: 0.03, magic: 0.03, armor: 0.3, hp: 6 } },
  // rings: SankoQuest has none, so these are ours (icons drawn for this game), one modest bonus each
  "Ember Band": { slot: "ring", tier: 1, pace: 2, rarity: "rare", bonus: { dmg: 0.04 } },
  "Tidewater Ring": { slot: "ring", tier: 1, pace: 2, rarity: "rare", bonus: { regen: 0.2 } },
  "Featherstep Ring": { slot: "ring", tier: 1, pace: 2, rarity: "rare", bonus: { speed: 0.04 } },
  "Lodestone Ring": { slot: "ring", tier: 1, pace: 2, rarity: "rare", bonus: { magnet: 0.15 } },
  "Quickdraw Ring": { slot: "ring", tier: 2, pace: 2, rarity: "rare", bonus: { haste: 0.04 } },
  "Bulwark Band": { slot: "ring", tier: 2, pace: 2, rarity: "rare", bonus: { armor: 0.3, hp: 6 } },
  "Ogre Shield": { slot: "offhand", tier: 4, rarity: "unique", model: "equipment/offhand/shield/ogre_shield.glb", bonus: { armor: 1.2, hp: 25 } },
  "Ranger Helmet": { slot: "head", set: "Ranger", tier: 2, bonus: { dmg: 0.03, magnet: 0.06 } },
  "Ranger Chestplate": { slot: "chest", set: "Ranger", tier: 2, bonus: { dmg: 0.03, armor: 0.2 } },
  "Ranger Gauntlets": { slot: "hands", set: "Ranger", tier: 2, bonus: { dmg: 0.03 } },
  "Ranger Leggings": { slot: "legs", set: "Ranger", tier: 2, bonus: { dmg: 0.03, speed: 0.02 } },
  "Ranger Boots": { slot: "feet", set: "Ranger", tier: 2, bonus: { dmg: 0.03, speed: 0.02 } },
  "Wizard Hat": { slot: "head", set: "Wizard", tier: 1, bonus: { growth: 0.05 } },
  "Wizard Robe": { slot: "chest", set: "Wizard", tier: 1, bonus: { growth: 0.05, hp: 5 } },
  "Wizard Skirt": { slot: "legs", set: "Wizard", tier: 1, bonus: { growth: 0.05 } },
  "Shape Wizard Hat": { slot: "head", set: "Shape", tier: 3, bonus: { haste: 0.03 }, bonus2: { haste: 0.03, magic: 0.04 } },
  "Shape Robe": { slot: "chest", set: "Shape", tier: 3, bonus: { haste: 0.03, hp: 5 }, bonus2: { haste: 0.03, magic: 0.12, hp: 8 } },
  "Shape Skirt": { slot: "legs", set: "Shape", tier: 3, bonus: { haste: 0.03 }, bonus2: { haste: 0.03, magic: 0.1 } },
  "Mystic Hat": { slot: "head", tier: 3, bonus: { haste: 0.06 } },
  "Straw Hat": { slot: "head", tier: 0, bonus: { hp: 10 } },
  "Bowler Hat": { slot: "head", tier: 1, bonus: { coin: 0.5 } },
  "Beret": { slot: "head", tier: 1, bonus: { speed: 0.04 } },
  "Hamburger Hat": { slot: "head", tier: 2, bonus: { regen: 0.3 } },
  "Pumpkin Head": { slot: "head", tier: 4, rarity: "unique", bonus: { dmg: 0.08 } },
  "Winged Boots": { slot: "feet", tier: 3, bonus: { speed: 0.08 } },
  "Green Boots": { slot: "feet", tier: 1, bonus: { speed: 0.05 } },
  "Quilted Boots": { slot: "feet", tier: 0, bonus: { hp: 8 } },
  "Uggs Boots": { slot: "feet", tier: 2, bonus: { regen: 0.2, hp: 5 } },
  "Cape": { slot: "back", tier: 2, bonus: { growth: 0.04, speed: 0.03 } }
});
var GEAR_SETS = {
  Ranger: { pieces: 5, bonus: { dmg: 0.12 }, text: "+12% damage" },
  Wizard: { pieces: 3, bonus: { haste: 0.08 }, text: "-8% cooldowns" },
  Shape: { pieces: 3, bonus: { dmg: 0.1 }, text: "+10% damage" },
  Minion: { pieces: 2, bonus: { magic: 0.15, haste: 0.04 }, text: "+15% magic damage, -4% cooldowns" },
  Bronze: { pieces: 5, bonus: { hp: 15 }, text: "+15 max HP" },
  Iron: { pieces: 5, bonus: { hp: 20 }, text: "+20 max HP" },
  Steel: { pieces: 5, bonus: { hp: 25, armor: 0.5 }, text: "+25 max HP, +0.5 armor" },
  Mithril: { pieces: 5, bonus: { hp: 30, speed: 0.04 }, text: "+30 max HP, +4% speed" },
  Adamantite: { pieces: 5, bonus: { hp: 40, armor: 1 }, text: "+40 max HP, +1 armor" },
  Runite: { pieces: 5, bonus: { hp: 50, armor: 1.5, dmg: 0.05 }, text: "+50 max HP, +1.5 armor, +5% damage" }
};
var MAGIC_WEAPONS = ["staff", "lighter"];
var GEAR_MAX_LV = 3;
var gearOn = (name, pace = 2) => typeof name === "string" && Object.hasOwn(GEAR, name) && (GEAR[name].pace || 1) <= pace;
var gearPieceBonus = (name, pace = 2) => pace >= 2 && GEAR[name].bonus2 || GEAR[name].bonus;
function gearBonus(gear = {}, levels = {}, pace = 2) {
  const out = {};
  const add = (b, m = 1) => {
    for (const [k, v] of Object.entries(b)) out[k] = (out[k] || 0) + v * m;
  };
  const sets = {};
  for (const name of Object.values(gear)) {
    if (!gearOn(name, pace)) continue;
    const g = GEAR[name];
    add(gearPieceBonus(name, pace), 1 + 0.25 * Math.min(GEAR_MAX_LV, levels[name] || 0));
    if (g.set) sets[g.set] = (sets[g.set] || 0) + 1;
  }
  const done = [];
  for (const [s, c] of Object.entries(sets)) if (GEAR_SETS[s] && c >= GEAR_SETS[s].pieces) {
    add(GEAR_SETS[s].bonus);
    done.push(s);
  }
  out.sets = done;
  return out;
}
var gearRarity = (name) => (isWeaponItem(name) ? "common" : GEAR[name].rarity) || (ARMOR_TIERS.includes(GEAR[name].set) || / (Kite)?[Ss]hield$/.test(name) ? "common" : "rare");
var ALCH_BY_TIER = [25, 35, 50, 70, 100, 150];
var ALCH_RARITY = { common: 1, rare: 1.5, unique: 2 };
var ALCH_PIECE = (name) => /Chestplate( \(t\))?$|Robe$|2hd Sword$/.test(name) ? 1.5 : /Leggings( \(t\))?$|Skirt$|Kiteshield$|Katana$|Axe$|Pickaxe$|Short Sword$|Bow$/.test(name) ? 1.25 : 1;
function alchValue(name) {
  const g = isWeaponItem(name) ? WEAPON_ITEMS[name] : Object.hasOwn(GEAR, name) ? GEAR[name] : null;
  if (!g) return 0;
  return Math.round(ALCH_BY_TIER[Math.min(g.tier, ALCH_BY_TIER.length - 1)] * ALCH_RARITY[gearRarity(name)] * ALCH_PIECE(name) / 5) * 5;
}
var GEAR_SCORE_W = { armor: 10, dmg: 100, haste: 100, speed: 80, magnet: 25, growth: 50, hp: 0.4, regen: 12, coin: 6, magic: 40 };
function gearScore(b) {
  let s = 0;
  for (const [k, v] of Object.entries(b)) if (GEAR_SCORE_W[k]) s += GEAR_SCORE_W[k] * v;
  return s;
}
function compareGear(gear = {}, levels = {}, item, pace = 2) {
  const g = GEAR[item], slot = g.slot, old = gear[slot] || null;
  const before = gearBonus(gear, levels, pace), after = gearBonus({ ...gear, [slot]: item }, levels, pace);
  const delta = {};
  for (const k of /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (k === "sets") continue;
    const d = Math.round(((after[k] || 0) - (before[k] || 0)) * 1e3) / 1e3;
    if (d) delta[k] = d;
  }
  const sb = gearScore(before), sa = gearScore(after);
  const set = g.set && GEAR_SETS[g.set] ? { name: g.set, have: Object.values({ ...gear, [slot]: item }).filter((n) => gearOn(n, pace) && GEAR[n].set === g.set).length, need: GEAR_SETS[g.set].pieces } : null;
  return {
    item,
    slot,
    old,
    delta,
    set,
    alch: alchValue(item),
    setsGained: after.sets.filter((s) => !before.sets.includes(s)),
    setsLost: before.sets.filter((s) => !after.sets.includes(s)),
    better: sa > sb + 1e-9,
    // recommend Wear
    anyUp: Object.values(delta).some((v) => v > 0)
    // false: nothing improves (a clear downgrade, or the same)
  };
}
function compareWeaponItem(wm = {}, item) {
  const w = WEAPON_ITEMS[item], old = weaponSlotItem(w.slot, wm[w.slot]);
  const before = weaponMetal(w.weapon, wm), after = weaponMetal(w.weapon, { ...wm, [w.slot]: w.step });
  const delta = {}, d = Math.round((after.dmg / before.dmg - 1) * 1e3) / 1e3, pc = after.pierce - before.pierce;
  if (d) delta.wdmg = d;
  if (pc) delta.pierce = pc;
  return {
    item,
    slot: "weapon",
    wslot: w.slot,
    weapon: w.weapon,
    old,
    delta,
    set: null,
    alch: alchValue(item),
    setsGained: [],
    setsLost: [],
    better: d > 1e-9 || d >= 0 && pc > 0,
    anyUp: Object.values(delta).some((v) => v > 0)
  };
}
var CASKET_BASE = { trim: 0.6, neck: 0.5, ring: 0.5 };
function casketWeights(rank = 0, hard = false, t = 0, { pace = 2, weapons = null } = {}) {
  const reach = 1 + rank + (hard ? 1 : 0);
  let top = Math.min(4, reach + (t >= 360 ? 1 : 0));
  if (t < 120) top = Math.min(top, 1 + (hard ? 1 : 0));
  const late = Math.max(0, Math.min(1, t / 900));
  const lift = late + (hard ? 0.5 : 0);
  const runite = t >= 480 && reach >= 3;
  const out = [];
  const items = Object.entries(GEAR).filter(([n]) => gearOn(n, pace));
  if (weapons && pace >= 2) {
    for (const [n, w] of Object.entries(WEAPON_ITEMS)) if (Object.hasOwn(weapons, w.weapon)) items.push([n, w]);
  }
  for (const [n, g] of items) {
    const base = g.weapon ? g.kind === "arrow" ? 1.5 : 2 : g.trim ? CASKET_BASE.trim : CASKET_BASE[g.slot] || (ARMOR_TIERS.includes(g.set) ? 3 : g.slot === "offhand" && g.rarity !== "unique" ? 2 : 1.4);
    if (g.tier === 5) {
      if (runite) out.push([n, base * 0.25 * (1 + lift)]);
      continue;
    }
    if (g.tier > top) continue;
    out.push([n, base * (1 + top - g.tier + lift * g.tier)]);
  }
  return out;
}
function rollCasket(rng, rank = 0, hard = false, t = 0, opts = {}) {
  const list = casketWeights(rank, hard, t, opts);
  let total = 0;
  for (const [, w] of list) total += w;
  let r = rng() * total;
  for (const [n, w] of list) {
    if ((r -= w) <= 0) return n;
  }
  return list[list.length - 1][0];
}
function casketRank(map) {
  if (!map) return 0;
  if (map.special) return map.world ? 3 : 0;
  return Math.max(0, MAPS.findIndex((m) => m.id === map.id));
}
var REROLLS_PER_RUN = 3;

// src/merchant.js
var MERCHANT = { first: 180, firstJitter: 60, every: 240, jitter: 120, life: 75, range: 3 };
var merchantEligible = (sim) => sim.pace === 2 && !sim.ranked && !sim.coop && sim.players.length === 1;
function merchantStock(sim) {
  const pool = casketWeights(sim.casketRank, sim.hard, sim.t, { pace: 2 }).filter(([name]) => Object.hasOwn(GEAR, name));
  const offers = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    let roll = sim.rng() * pool.reduce((total, [, weight]) => total + weight, 0), index = 0;
    while (index < pool.length - 1 && (roll -= pool[index][1]) > 0) index++;
    const [[item]] = pool.splice(index, 1);
    offers.push({ item, price: Math.max(60, 2 * alchValue(item) + 20), sold: false });
  }
  return offers;
}

// src/ground-pack.js
var WATER_LEVEL = Math.fround(0.8);
function unpackGround(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const n = new DataView(u.buffer, u.byteOffset, u.byteLength).getUint32(0, true), W = n + 1, a = n * n, b = W * W;
  const A = 4, B = 4 + Math.ceil(a / 8);
  const blocked = new Uint8Array(a), water = new Float32Array(b).fill(NaN);
  for (let k = 0; k < a; k++) blocked[k] = u[A + (k >> 3)] >> (k & 7) & 1;
  for (let k = 0; k < b; k++) if (u[B + (k >> 3)] >> (k & 7) & 1) water[k] = WATER_LEVEL;
  const C = B + Math.ceil(b / 8), walls = new Uint8Array(a);
  if (u.length >= C + Math.ceil(a / 2)) for (let k = 0; k < a; k++) walls[k] = u[C + (k >> 1)] >> (k & 1) * 4 & 15;
  const D = C + Math.ceil(a / 2);
  let fences = null;
  if (u.length >= D + Math.ceil(a / 2)) {
    fences = new Uint8Array(a);
    for (let k = 0; k < a; k++) fences[k] = u[D + (k >> 1)] >> (k & 1) * 4 & 15;
  }
  const E = D + Math.ceil(a / 2);
  if (fences && u.length >= E + Math.ceil(a / 2)) for (let k = 0; k < a; k++) fences[k] |= (u[E + (k >> 1)] >> (k & 1) * 4 & 15) << 4;
  return { n, blocked, cell: true, water, walls, fences };
}
function groundHash({ n, blocked, water, walls, fences }) {
  let h = 2166136261 >>> 0;
  const mix = (v) => {
    h ^= v;
    h = Math.imul(h, 16777619) >>> 0;
  };
  mix(n);
  for (let k = 0; k < blocked.length; k++) mix(blocked[k] ? 1 : 0);
  for (let k = 0; k < (water ? water.length : 0); k++) mix(water[k] === water[k] ? 2 : 0);
  for (let k = 0; k < (walls ? walls.length : 0); k++) if (walls[k]) mix(k * 16 + walls[k]);
  for (let k = 0; k < (fences ? fences.length : 0); k++) if (fences[k]) mix(1073741824 + k * 16 + fences[k]);
  return h.toString(16);
}

// src/weather.js
var DURATION = Object.freeze({ rainstorm: 20, snowstorm: 20, blizzard: 14, sandstorm: 12 });
function extraStorms(region, snowReady) {
  if (region?.under || region?.id === "paya") return [];
  return snowReady && !["apache", "duel"].includes(region?.id) ? ["rainstorm", "snowstorm"] : ["rainstorm"];
}

// src/sim.js
var TICK = 1 / 30;
function mulberry32(a) {
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var hyp = dhypot;
var pastureGroundCache = /* @__PURE__ */ new WeakMap();
function pastureGround(ground) {
  if (!ground || !ground.cell || ground.n !== 512 || !ground.fences) return ground;
  if (pastureGroundCache.has(ground)) return pastureGroundCache.get(ground);
  let corrected = ground;
  if (groundHash(ground) === PASTURE_NAV.hash) {
    const blocked = ground.blocked.slice();
    for (const k of PASTURE_NAV.cells) blocked[k] = 0;
    corrected = { ...ground, blocked };
  }
  pastureGroundCache.set(ground, corrected);
  return corrected;
}
var oasisGroundCache = /* @__PURE__ */ new WeakMap();
function oasisGround(ground) {
  if (!ground || !ground.cell || ground.n !== 512) return ground;
  if (oasisGroundCache.has(ground)) return oasisGroundCache.get(ground);
  let corrected = ground;
  if (groundHash(ground) === OASIS_WATER_NAV.hash) {
    const blocked = ground.blocked.slice();
    for (const k of OASIS_WATER_NAV.cells) blocked[k] = 0;
    corrected = { ...ground, blocked };
  }
  oasisGroundCache.set(ground, corrected);
  return corrected;
}
function createSim({ seed = 1, players = [{ id: "p1", name: "Adventurer" }], startWeapon = "katana", map = MAPS[0], hard = false, meta = {}, ground = null, endless = false, endAt = 0, pace = 2, ranked = false, coop = false } = {}) {
  if (coop && (ranked || pace !== 2 || players.length !== 2)) throw Error("Co-op requires two casual pace2 players.");
  if (pace >= 2) {
    ground = pastureGround(ground);
    if (map.id === "oasis") ground = oasisGround(ground);
  }
  meta = clampSkills(meta);
  const rng = mulberry32(seed);
  const sim = {
    seed,
    rng,
    map,
    hard,
    meta,
    endless,
    endAt,
    pace,
    ranked: !!ranked,
    t: 0,
    tick: 0,
    nextId: 1,
    // veterans (owner 3 Nov: "regular mode feels too easy"): each permanent skill rank makes casual monsters 1.5% tougher
    // and harder-hitting, to +60% at 40 ranks, with a few more of them. A new player is untouched; ranked has no skills.
    vet: 1,
    // set below once the players (and the gear they wear) are in // pace: 2 the denser crowd of 3 Nov, 1 the 2 Nov one (ranked week 0)
    mapIndex: Math.max(0, MAPS.findIndex((m) => m.id === map.id)),
    casketRank: casketRank(map),
    killsByType: {},
    bossKills: 0,
    evolves: 0,
    loot: [],
    alched: [],
    ...pace >= 2 && !ranked && !coop ? { alchedLootIndices: [] } : {},
    endlessBossT: 0,
    endlessCycle: 0,
    players: [],
    enemies: [],
    proj: [],
    gems: [],
    pickups: [],
    fx: [],
    hazards: [],
    // telegraphed boss attacks on the ground: { x, z, r, t, max, dmg }
    shrines: [],
    // shrines to charge (pace 2): { id, x, z, kind, charge, life }
    eproj: [],
    // monster projectiles: { id, x, z, vx, vz, r, dmg, life, art }
    level: 1,
    xp: 0,
    xpNeed: xpForLevel(1),
    pending: {},
    // playerId -> { choices: [...], left: seconds }; a reward casket card also has { casket: compareGear(...) }
    over: null,
    // null | 'win' | 'dead' | 'time' (an endless ranked run reached its time limit, endAt seconds)
    kills: 0,
    bossIndex: 0,
    spawnAcc: 0,
    spawnCount: players.length,
    region: null,
    eventT: 210,
    event: null,
    dmgBy: {},
    hurtBy: {},
    src: null,
    // random events: treasure goblin, swarm, meteor shower
    ground,
    // optional { n, blocked: Uint8Array, walls?: Uint8Array } one cell per world unit: ridges, mountains, water; thin walls
    flow: null,
    flowT: 0
    // distance-to-player field so monsters find their way around cliffs
  };
  if (pace === 2 && !ranked && !coop && players.length === 1) Object.assign(sim, { merchant: null, merchantSpent: 0, merchantLootIndices: [] });
  if (coop) sim.coop = true;
  players.forEach((p, i) => {
    const a = i / Math.max(players.length, 1) * Math.PI * 2;
    sim.players.push({
      id: p.id,
      name: p.name || "Adventurer",
      slot: i,
      x: map.cx + dcos(a) * 1.5,
      z: map.cz + dsin(a) * 1.5,
      face: 0,
      moving: false,
      hp: PLAYER_BASE.hp,
      maxHp: PLAYER_BASE.hp,
      alive: true,
      inv: 0,
      meta: coop ? clampSkills(p.meta) : meta,
      adv: p.adv || "adventurer",
      weapons: { [p.weapon || (ADVENTURER_BY_ID[p.adv] ? ADVENTURER_BY_ID[p.adv].weapon : startWeapon)]: 1 },
      passives: { ...(ADVENTURER_BY_ID[p.adv] || {}).startPassives || {} },
      evo: {},
      buffs: {},
      cd: {},
      orbit: 0,
      kills: 0,
      coins: 0,
      regen: 0,
      hurt: 0,
      gear: p.gear || {},
      gearLv: p.gearLv || {},
      gb: gearBonus(p.gear || {}, p.gearLv || {}, pace),
      rerolls: REROLLS_PER_RUN,
      belt: [],
      casketQ: [],
      ...pace >= 2 && !ranked && !coop ? { casketLootIndices: [] } : {},
      alch: 0,
      // reward caskets waiting for Wear or High alch; coins from high alching this run
      wm: {},
      // weapon metals from caskets (pace 2): { katana: 0..5, bow: 0..3, arrow: 0..4, ... } (missing = Bronze / plain Bow)
      ...pace >= 2 ? { pace, quality: { weapons: {}, passives: {} }, banished: [] } : {},
      ...coop ? { killsByType: {}, bossKills: 0, evolves: 0, loot: [], alched: [], dmgBy: {} } : {}
    });
  });
  {
    const ranks = Object.values(meta).reduce((a, v) => a + (Number(v) || 0), 0) + 2 * Math.max(0, ...sim.players.map((p) => Object.keys(p.gear || {}).length));
    sim.vet = 1 + 0.015 * Math.min(50, ranks);
  }
  if (coop) sim.vet = 1 + 0.015 * Math.min(50, Math.max(...sim.players.map((p) => Object.values(p.meta).reduce((a, n) => a + n, 0) + 2 * Object.keys(p.gear).length)));
  for (const p of sim.players) {
    const st = playerStats(p);
    p.maxHp = st.maxHp;
    p.hp = st.maxHp;
    p.rerolls = st.rerolls;
    p.revives = st.revives;
    const w = findWalkable(sim, p.x, p.z);
    p.x = w[0];
    p.z = w[1];
  }
  return sim;
}
var gIdx = (g, v) => g.cell ? Math.floor(v) : Math.round(v);
function walkable(sim, x, z) {
  const g = sim.ground;
  if (!g) return true;
  const i = gIdx(g, x), j = gIdx(g, z);
  if (i < 0 || j < 0 || i >= g.n || j >= g.n) return false;
  return !g.blocked[j * g.n + i];
}
function findWalkable(sim, x, z) {
  const reach = (a, b) => walkable(sim, a, b) && flowAt(sim, a, b) !== -2;
  if (reach(x, z)) return [x, z];
  for (let r = 1; r < 30; r++) for (let k = 0; k < 16; k++) {
    const a = k / 16 * 6.2832, nx = x + dcos(a) * r, nz = z + dsin(a) * r;
    if (reach(nx, nz)) return [nx, nz];
  }
  if (walkable(sim, x, z)) return [x, z];
  for (let r = 1; r < 30; r++) for (let k = 0; k < 16; k++) {
    const a = k / 16 * 6.2832, nx = x + dcos(a) * r, nz = z + dsin(a) * r;
    if (walkable(sim, nx, nz)) return [nx, nz];
  }
  return [x, z];
}
var wallX = (W, n, i, j, di) => di > 0 ? W[j * n + i] & 2 || W[j * n + i + 1] & 8 : W[j * n + i] & 8 || W[j * n + i - 1] & 2;
var wallZ = (W, n, i, j, dj) => dj > 0 ? W[j * n + i] & 4 || W[(j + 1) * n + i] & 1 : W[j * n + i] & 1 || W[(j - 1) * n + i] & 4;
function stepOK(W, n, i0, j0, i1, j1) {
  const di = i1 - i0, dj = j1 - j0;
  if (i1 < 0 || j1 < 0 || i1 >= n || j1 >= n) return false;
  if (!dj) return !wallX(W, n, i0, j0, di);
  if (!di) return !wallZ(W, n, i0, j0, dj);
  return !wallX(W, n, i0, j0, di) && !wallZ(W, n, i0 + di, j0, dj) || !wallZ(W, n, i0, j0, dj) && !wallX(W, n, i0, j0 + dj, di);
}
var WALL_GAP = 0.35;
function crossOK(W, n, x0, z0, x1, z1) {
  let i = Math.floor(x0), j = Math.floor(z0);
  const i1 = Math.floor(x1), j1 = Math.floor(z1);
  if (i < 0 || j < 0 || i >= n || j >= n) return true;
  for (let k = 0; k < 8 && (i !== i1 || j !== j1); k++) {
    const ni = i + Math.sign(i1 - i), nj = j + Math.sign(j1 - j);
    if (!stepOK(W, n, i, j, ni, nj)) return false;
    i = ni;
    j = nj;
  }
  return true;
}
var fenceWallCache = /* @__PURE__ */ new WeakMap();
function wallsOf(sim) {
  const g = sim.ground;
  if (!g || !g.walls) return null;
  if (sim._wg !== g) {
    sim._wg = g;
    sim._W = g.walls;
    if (sim.pace >= 2 && g.fences) {
      let c = fenceWallCache.get(g);
      if (!c) {
        c = new Uint8Array(g.walls.length);
        for (let k = 0; k < c.length; k++) c[k] = g.walls[k] | g.fences[k];
        fenceWallCache.set(g, c);
      }
      sim._W = c;
    }
  }
  return sim._W;
}
var tumbleWallCache = /* @__PURE__ */ new WeakMap();
function tumbleWalls(sim) {
  const g = sim.ground;
  if (!g?.walls || sim.pace < 2 || !g.fences) return g?.walls;
  let walls = tumbleWallCache.get(g);
  if (!walls) {
    walls = new Uint8Array(g.walls.length);
    for (let k = 0; k < walls.length; k++) walls[k] = g.walls[k] | g.fences[k] >>> 4;
    tumbleWallCache.set(g, walls);
  }
  return walls;
}
function marginClear(sim, W, x, z, ox, oz) {
  const nx = x + ox, nz = z + oz, n = sim.ground.n;
  return walkable(sim, nx, nz) && crossOK(W, n, x, z, nx, z) && crossOK(W, n, x, z, x, nz) && crossOK(W, n, nx, z, nx, nz) && crossOK(W, n, x, nz, nx, nz);
}
function noWall(sim, x0, z0, x1, z1, tumble = false) {
  const g = sim.ground, W = tumble ? tumbleWalls(sim) : wallsOf(sim);
  if (!g || !W || !g.cell) return true;
  const n = g.n;
  if (!crossOK(W, n, x0, z0, x1, z1)) return false;
  const sx = Math.sign(x1 - x0), sz = Math.sign(z1 - z0);
  if (sx && !crossOK(W, n, x1, z1, x1 + sx * WALL_GAP, z1)) return false;
  if (sz && !crossOK(W, n, x1, z1, x1, z1 + sz * WALL_GAP)) return false;
  if (sim.pace >= 2) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!(dx || dz)) continue;
    const ox = dx * WALL_GAP, oz = dz * WALL_GAP;
    if (!marginClear(sim, W, x1, z1, ox, oz) && marginClear(sim, W, x0, z0, ox, oz)) return false;
  }
  return true;
}
function walkableStep(sim, x, z, nx, nz) {
  if (!walkable(sim, nx, nz)) return false;
  const g = sim.ground;
  if (!(sim.pace >= 2) || !g || gIdx(g, x) === gIdx(g, nx) || gIdx(g, z) === gIdx(g, nz)) return true;
  return walkable(sim, nx, z) && walkable(sim, x, nz);
}
function clearPath(sim, x, z, nx, nz, body = false) {
  const g = sim.ground;
  if (!g) return true;
  const W = wallsOf(sim), parts = Math.max(1, Math.ceil(Math.max(Math.abs(nx - x), Math.abs(nz - z)) / 0.5));
  const dx = (nx - x) / parts, dz = (nz - z) / parts;
  for (let i = 0; i < parts; i++) {
    const tx = x + dx, tz = z + dz;
    if (!walkableStep(sim, x, z, tx, tz) || (body ? !noWall(sim, x, z, tx, tz) : W && g.cell && !crossOK(W, g.n, x, z, tx, tz))) return false;
    x = tx;
    z = tz;
  }
  return true;
}
function reachableFencePath(sim, p) {
  const g = sim.ground;
  if (!g?.cell || !g.fences) return false;
  const W = tumbleWalls(sim);
  const distance = TUMBLE.speed * p.rollT, parts = Math.ceil(distance / 0.5);
  const dx = dsin(p.rollFace) * distance / parts, dz = dcos(p.rollFace) * distance / parts;
  let x = p.x, z = p.z;
  for (let i = 0; i < parts; i++) {
    const nx = x + dx, nz = z + dz, k = gIdx(g, nz) * g.n + gIdx(g, nx);
    if (!walkableStep(sim, x, z, nx, nz) || !noWall(sim, x, z, nx, nz, true)) return false;
    for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
      const bx = x + ox * WALL_GAP, bz = z + oz * WALL_GAP;
      if (!walkableStep(sim, bx, bz, bx + dx, bz + dz) || W && !marginClear(sim, W, bx, bz, dx, dz)) return false;
    }
    if (flowAt(sim, nx, nz) < 0 && (!(g.fences[k] & 15) || g.fences[k] >>> 4 || g.walls?.[k])) return false;
    x = nx;
    z = nz;
  }
  return hyp(x - sim.map.cx, z - sim.map.cz) <= sim.map.r && flowAt(sim, x, z) >= 0;
}
function moveStep(sim, o, nx, nz, tumble, fencePath) {
  if (walkableStep(sim, o.x, o.z, nx, nz) && (!tumble || !sim.ground || fencePath || flowAt(sim, nx, nz) >= 0) && noWall(sim, o.x, o.z, nx, nz, tumble)) {
    o.x = nx;
    o.z = nz;
    return;
  }
  if (walkableStep(sim, o.x, o.z, nx, o.z) && (!tumble || !sim.ground || fencePath || flowAt(sim, nx, o.z) >= 0) && noWall(sim, o.x, o.z, nx, o.z, tumble)) {
    o.x = nx;
    return;
  }
  if (walkableStep(sim, o.x, o.z, o.x, nz) && (!tumble || !sim.ground || fencePath || flowAt(sim, o.x, nz) >= 0) && noWall(sim, o.x, o.z, o.x, nz, tumble)) o.z = nz;
}
function moveTo(sim, o, nx, nz, tumble = false, fencePath = false) {
  if (!(sim.pace >= 2) || !sim.ground) return moveStep(sim, o, nx, nz, tumble, fencePath);
  const parts = Math.max(1, Math.ceil(Math.max(Math.abs(nx - o.x), Math.abs(nz - o.z)) / 0.5));
  const dx = (nx - o.x) / parts, dz = (nz - o.z) / parts;
  for (let i = 0; i < parts; i++) {
    const x = o.x, z = o.z;
    moveStep(sim, o, x + dx, z + dz, tumble, fencePath);
    if (o.x === x && o.z === z) break;
  }
}
var FLOW_R = 60;
var FLOW_W = FLOW_R * 2 + 1;
var FLOW_NONE = 65535;
function updateFlow(sim, anchor = null) {
  const g = sim.ground;
  if (!g) {
    sim.flow = null;
    return;
  }
  const alive = sim.players.filter((p) => p.alive);
  if (!alive.length) return;
  const W = wallsOf(sim);
  const origin = anchor || alive[0];
  const x0 = gIdx(g, origin.x) - FLOW_R, z0 = gIdx(g, origin.z) - FLOW_R;
  const f = sim.flow && sim.flow.dist ? sim.flow : { dist: new Uint16Array(FLOW_W * FLOW_W), queue: new Int32Array(FLOW_W * FLOW_W) };
  f.x0 = x0;
  f.z0 = z0;
  f.dist.fill(FLOW_NONE);
  let qh = 0, qt = 0;
  for (const p of alive) {
    const i = gIdx(g, p.x) - x0, j = gIdx(g, p.z) - z0;
    if (i >= 0 && j >= 0 && i < FLOW_W && j < FLOW_W) {
      f.dist[j * FLOW_W + i] = 0;
      f.queue[qt++] = j * FLOW_W + i;
    }
  }
  while (qh < qt) {
    const k = f.queue[qh++], i = k % FLOW_W, j = (k - i) / FLOW_W, d = f.dist[k] + 1;
    for (let q = 0; q < 4; q++) {
      const ni = i + (q === 0 ? 1 : q === 1 ? -1 : 0), nj = j + (q === 2 ? 1 : q === 3 ? -1 : 0);
      if (ni < 0 || nj < 0 || ni >= FLOW_W || nj >= FLOW_W) continue;
      const nk = nj * FLOW_W + ni;
      if (f.dist[nk] !== FLOW_NONE) continue;
      const wi = ni + x0, wj = nj + z0;
      if (wi < 0 || wj < 0 || wi >= g.n || wj >= g.n || g.blocked[wj * g.n + wi]) continue;
      if (W && g.cell && !stepOK(W, g.n, i + x0, j + z0, wi, wj)) continue;
      f.dist[nk] = d;
      f.queue[qt++] = nk;
    }
  }
  sim.flow = f;
}
function flowAt(sim, x, z) {
  const f = sim.flow;
  if (!f) return -1;
  const i = gIdx(sim.ground, x) - f.x0, j = gIdx(sim.ground, z) - f.z0;
  if (i < 0 || j < 0 || i >= FLOW_W || j >= FLOW_W) return -1;
  const d = f.dist[j * FLOW_W + i];
  return d === FLOW_NONE ? -2 : d;
}
function flowDir(sim, x, z) {
  const f = sim.flow;
  if (!f) return null;
  const i = gIdx(sim.ground, x) - f.x0, j = gIdx(sim.ground, z) - f.z0;
  if (i < 1 || j < 1 || i >= FLOW_W - 1 || j >= FLOW_W - 1) return null;
  let best = f.dist[j * FLOW_W + i], bx = 0, bz = 0;
  for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
    if (!a && !b) continue;
    const nx = sim.pace >= 2 ? i + a + f.x0 + (sim.ground.cell ? 0.5 : 0) : x + a;
    const nz = sim.pace >= 2 ? j + b + f.z0 + (sim.ground.cell ? 0.5 : 0) : z + b;
    if (sim.pace >= 2 && !clearPath(sim, x, z, nx, nz, true)) continue;
    const d = f.dist[(j + b) * FLOW_W + i + a] + (a && b ? 0.4 : 0);
    if (d < best) {
      best = d;
      bx = sim.pace >= 2 ? nx - x : a;
      bz = sim.pace >= 2 ? nz - z : b;
    }
  }
  if (!bx && !bz && sim.pace >= 2 && best > 0 && best < FLOW_NONE) {
    const nx = i + f.x0 + (sim.ground.cell ? 0.5 : 0), nz = j + f.z0 + (sim.ground.cell ? 0.5 : 0);
    if (dhypot(nx - x, nz - z) > 0.05 && clearPath(sim, x, z, nx, nz, true)) {
      bx = nx - x;
      bz = nz - z;
    }
  }
  if (!bx && !bz) return null;
  const l = dhypot(bx, bz);
  return [bx / l, bz / l];
}
function passiveLevel(p, id) {
  return p.passives[id] || 0;
}
function playerStats(p, meta = p.meta || {}) {
  const m = (id) => meta[id] || 0;
  const B = (ADVENTURER_BY_ID[p.adv] || {}).bonus || {};
  const G = p.gb || {};
  const bf = p.buffs || {};
  const might = (1 + 0.12 * passiveStrength(p, "might") + 0.04 * m("combat") + (B.dmg || 0) + (G.dmg || 0)) * (bf.strength > 0 ? 1.3 : 1);
  const haste = Math.max(0.3, 1 - 0.07 * passiveStrength(p, "haste") - 0.03 * m("fletching") - (B.haste || 0) - (G.haste || 0));
  const stats = {
    might,
    haste,
    speed: PLAYER_BASE.speed * (1 + 0.08 * passiveStrength(p, "boots") + 0.03 * m("woodcutting") + (B.speed || 0) + (G.speed || 0)) * (p.buffs && p.buffs.speed > 0 ? 1.35 : 1) * (p.buffs && p.buffs.chill > 0 ? 0.9 : 1) * (bf.agility > 0 ? 1.25 : 1),
    // beer speeds you up, a blizzard slows you
    magnet: (p.pace >= 2 ? 2.5 : PLAYER_BASE.magnet) * (1 + 0.3 * passiveStrength(p, "magnet") + 0.1 * m("magic") + (B.magnet || 0) + (G.magnet || 0)),
    armor: passiveStrength(p, "armor") + (B.armor || 0) + (G.armor || 0) + (m("mining") >= 2 ? 1 : 0) + (m("mining") >= 4 ? 1 : 0),
    growth: (1 + 0.1 * passiveStrength(p, "growth") + 0.05 * m("herblore") + (B.growth || 0) + (G.growth || 0)) * (bf.wisdom > 0 ? 1.4 : 1),
    maxHp: Math.round(PLAYER_BASE.hp + 20 * passiveStrength(p, "vigor") + 8 * m("smithing") + (B.hp || 0) + (G.hp || 0)),
    regen: 0.15 * passiveStrength(p, "vigor") + 0.1 * m("cooking") + (G.regen || 0),
    coin: 1 + (G.coin || 0) + 0.15 * passiveStrength(p, "greed"),
    luck: 1 + 0.15 * m("luck"),
    casket: (1 + 0.25 * passiveStrength(p, "greed")) * (1 + 0.15 * m("luck")),
    coinBonus: 1 + 0.1 * m("coins"),
    weaponSlots: MAX_WEAPONS + m("strength"),
    passiveSlots: MAX_PASSIVES + m("prayer"),
    projectileSpeed: 1 + 0.1 * m("projectileSpeed"),
    rerolls: REROLLS_PER_RUN + m("rerolls"),
    revives: m("revive"),
    area: 1 + 0.1 * passiveStrength(p, "area") + 0.05 * m("area"),
    amount: m("amount") + (passiveLevel(p, "amount") >= 1 ? 1 : 0) + (passiveLevel(p, "amount") >= 4 ? 1 : 0),
    reach: 1 + 0.06 * passiveStrength(p, "amount"),
    // Feather: projectiles fly a little farther every level
    critC: 0.08 + 0.05 * passiveStrength(p, "crit"),
    critM: 1.8 + 0.1 * passiveStrength(p, "crit"),
    thorns: 8 * passiveStrength(p, "thorns"),
    heal: 1 + 0.12 * m("fishing"),
    magic: 1 + (G.magic || 0)
    // the Minion set: magic weapons (Shard Staff, Lighter) hit harder
  };
  if (p.pace >= 2 && p.endlessGrowth) {
    for (const key of ["might", "maxHp", "area"]) stats[key] *= 1 + 0.01 * p.endlessGrowth[key];
    stats.maxHp = Math.round(stats.maxHp);
  }
  return stats;
}
function nearestEnemy(sim, x, z, maxD = 1e9, skip, bodyRange = false) {
  let best = null, bd = bodyRange ? Infinity : maxD * maxD;
  for (const e of sim.enemies) {
    if (skip && skip.has(e.id)) continue;
    const dx = e.x - x, dz = e.z - z, d = dx * dx + dz * dz;
    if (d < bd && (!bodyRange || d <= (maxD + ENEMIES[e.type].r) ** 2)) {
      bd = d;
      best = e;
    }
  }
  return best;
}
function nearestPlayer(sim, x, z) {
  let best = null, bd = 1e18;
  for (const p of sim.players) {
    if (!p.alive) continue;
    const dx = p.x - x, dz = p.z - z, d = dx * dx + dz * dz;
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best;
}
function damageEnemy(sim, e, amount2, owner, kb = 0, fromX = 0, fromZ = 0) {
  if (e.dead) return;
  const cr = sim.crit && sim.crit[owner] || [0.08, 1.8];
  const crit = sim.rng() < cr[0];
  const dmg = Math.max(1, Math.round(amount2 * (crit ? cr[1] : 1)));
  e.hp -= dmg;
  e.hit = 0.12;
  const src = sim.src || "other";
  sim.dmgBy[src] = (sim.dmgBy[src] || 0) + dmg;
  if (sim.coop) {
    const p = sim.players.find((p2) => p2.id === owner);
    if (p) p.dmgBy[src] = (p.dmgBy[src] || 0) + dmg;
  }
  sim.fx.push({ k: "dmg", x: e.x, z: e.z, v: dmg, c: crit ? 1 : 0 });
  if (kb && !ENEMIES[e.type].boss) {
    const dx = e.x - fromX, dz = e.z - fromZ, d = hyp(dx, dz) || 1;
    e.kx += dx / d * kb;
    e.kz += dz / d * kb;
  }
  if (e.hp <= 0) killEnemy(sim, e, owner);
}
function killEnemy(sim, e, owner) {
  e.dead = true;
  sim.kills++;
  sim.killsByType[e.type] = (sim.killsByType[e.type] || 0) + 1;
  const def = ENEMIES[e.type];
  const p = sim.players.find((q) => q.id === owner);
  if (p) p.kills++;
  if (sim.coop && p) {
    p.killsByType[e.type] = (p.killsByType[e.type] || 0) + 1;
    if (def.boss) p.bossKills++;
  }
  sim.gems.push({ id: sim.nextId++, x: e.x, z: e.z, v: def.xp, vx: 0, vz: 0 });
  sim.fx.push({ k: "die", x: e.x, z: e.z, boss: def.boss ? 1 : 0, elite: e.elite ? 1 : 0, ...sim.pace >= 2 ? { type: e.type } : {} });
  if (!def.boss) {
    const r = sim.rng(), drop = (kind) => sim.pickups.push({ id: sim.nextId++, x: e.x, z: e.z, kind });
    if (r < 0.01) drop("beer");
    else if (r < 0.016) drop("pumpkin");
    else if (r < 0.022) drop("warp");
    else if (r < 0.034) drop(foodDrop(sim.t, (r - 0.022) / 0.012, e.elite, sim.pace));
    if (sim.rng() < 0.05 * (p ? playerStats(p).coin : 1)) drop("coin");
    const cs = (p ? playerStats(p).casket : 1) * (sim.pace >= 2 && !sim.ranked ? 2 : 1) / (sim.coop ? Math.max(1, sim.players.filter((p2) => p2.alive).length) : 1);
    if (sim.pace >= 2 ? sim.rng() < 6e-4 * cs || e.elite && sim.rng() < 0.08 * cs : sim.rng() < 15e-4 * cs || e.elite) drop("casket");
    if (e.elite) {
      for (let i = 0; i < 3; i++) sim.pickups.push({ id: sim.nextId++, x: e.x + (i - 1) * 0.8, z: e.z + 0.8, kind: "coin" });
    }
    if (e.champion) {
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.283;
        sim.pickups.push({ id: sim.nextId++, x: e.x + dcos(a) * 1.4, z: e.z + dsin(a) * 1.4, kind: "coin" });
      }
      sim.fx.push({ k: "treasure", x: e.x, z: e.z });
    }
    if (e.treasure) {
      for (let i = 0; i < 2; i++) drop("casket");
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * 6.283;
        sim.pickups.push({ id: sim.nextId++, x: e.x + dcos(a) * 1.6, z: e.z + dsin(a) * 1.6, kind: "coin" });
      }
      sim.fx.push({ k: "treasure", x: e.x, z: e.z });
    }
  }
  if (def.boss) {
    if (sim.pace >= 2) sim.hazards = sim.hazards.filter((h) => h.by !== e.id);
    for (let i = 0; i < 8; i++) {
      const a = sim.rng() * 6.283;
      sim.gems.push({ id: sim.nextId++, x: e.x + dcos(a) * 1.5, z: e.z + dsin(a) * 1.5, v: Math.ceil(def.xp / 8), vx: 0, vz: 0 });
    }
    sim.pickups.push({ id: sim.nextId++, x: e.x, z: e.z, kind: "bass" }, { id: sim.nextId++, x: e.x + 1.2, z: e.z, kind: "chest" }, { id: sim.nextId++, x: e.x - 1.2, z: e.z, kind: "casket" });
    const luck = p ? playerStats(p).luck - 1 : 0;
    if (luck > 0 && sim.rng() < luck) sim.pickups.push({ id: sim.nextId++, x: e.x, z: e.z + 1.2, kind: "chest" });
    sim.bossKills++;
    if (e.final && e.type === sim.map.finalBoss && !sim.endless) sim.over = "win";
  }
}
function spawnEnemy(sim, type, x, z, scaleHp = 1) {
  const def = ENEMIES[type];
  if (sim.pace >= 2 && isSnowEnemy(type)) sim.snowWave = true;
  const t = sim.t;
  const hp = def.hp * (1 + t / (sim.pace >= 2 ? 240 : 300)) * (sim.pace >= 2 ? sim.vet * (1 + CURSE.hp * (sim.curse || 0)) : 1) * (1 + 0.55 * (sim.spawnCount - 1)) * scaleHp * (sim.hard ? 1.7 : 1);
  const elite = !def.boss && scaleHp === 1 && t > 60 && sim.rng() < 0.012;
  sim.enemies.push({
    id: sim.nextId++,
    type,
    x,
    z,
    hp: hp * (elite ? 7 : 1),
    maxHp: hp * (elite ? 7 : 1),
    face: 0,
    hit: 0,
    kx: 0,
    kz: 0,
    cdHit: {},
    // monsters speed up as the run goes on, but only by a fifth (reached at 5:00): the fastest (fox, dog, wolf) stay just
    // under your own base speed, so you can always outrun a chase (it was +45%, and from 4:30 foxes outran you)
    speed: def.speed * 0.95 * (1 + Math.min(0.2, t / 1500)) * (elite ? 0.9 : 1),
    elite,
    atkCd: def.boss ? 3 + sim.rng() * 2 : 0,
    charge: null
  });
}
var spawnReady = (sim, entry) => sim.t >= entry.t && (sim.pace < 2 || sim.t >= SNOW_WAVE_AT || !isSnowEnemy(entry.type));
function spawnTick(sim, dt) {
  const t = sim.t;
  const M = sim.map;
  while (sim.bossIndex < M.bosses.length && t >= M.bosses[sim.bossIndex].t) {
    const b = M.bosses[sim.bossIndex++];
    const p = nearestPlayer(sim, M.cx, M.cz) || sim.players[0];
    const a = sim.rng() * 6.283;
    const w = findWalkable(sim, p.x + dcos(a) * 20, p.z + dsin(a) * 20);
    spawnEnemy(sim, b.type, w[0], w[1]);
    if (sim.bossIndex === M.bosses.length) sim.enemies[sim.enemies.length - 1].final = true;
    sim.fx.push({ k: "boss", type: b.type });
  }
  if (sim.endless && t >= M.length) {
    const casual = sim.pace >= 2 && !sim.ranked;
    sim.endlessBossT = casual ? Math.max(0, sim.endlessBossT - dt) : sim.endlessBossT - dt;
    if (sim.endlessBossT <= 0 && M.bosses.length && (!casual || sim.enemies.filter((e) => !e.dead && e.hp > 0 && ENEMIES[e.type].boss).length < 6)) {
      sim.endlessBossT = casual ? Math.max(45, 90 - 5 * Math.floor((t - M.length) / 120)) : 90;
      const b = M.bosses[sim.endlessCycle % M.bosses.length];
      sim.endlessCycle++;
      const p = nearestPlayer(sim, M.cx, M.cz) || sim.players[0], a = sim.rng() * 6.283;
      const w = findWalkable(sim, p.x + dcos(a) * 20, p.z + dsin(a) * 20);
      spawnEnemy(sim, b.type, w[0], w[1], 1 + 0.5 * sim.endlessCycle);
      sim.fx.push({ k: "boss", type: b.type });
    }
  }
  const alive = sim.enemies.length;
  const progress = Math.min(1, t / M.length);
  const curse = sim.pace >= 2 && !sim.ranked ? sim.players.reduce((a, p) => p.alive ? Math.max(a, passiveLevel(p, "curse")) : a, 0) : 0;
  sim.curse = curse;
  const base = sim.pace >= 2 ? 125 + 70 * (sim.spawnCount - 1) + 150 * progress : 75 + 70 * (sim.spawnCount - 1) + 155 * progress * progress;
  const cap = curse ? Math.min(base * (1 + CURSE.cap * curse), 125 + 70 * (sim.spawnCount - 1) + 150) : base;
  const rate = (1 + CURSE.rate * curse) * ((sim.pace >= 2 ? (1.15 + 6 * progress + 3 * progress * progress) * (1 + 0.55 * (sim.vet - 1)) : 1.05 + 1.6 * progress + 6.4 * progress * progress) + Math.max(0, t - M.length) / 92) * (0.7 + 0.45 * sim.spawnCount) * (sim.hard ? 1.35 : 1);
  sim.spawnAcc += rate * dt;
  if (sim.event && sim.event.kind === "duel") sim.spawnAcc = Math.min(sim.spawnAcc, 0.5);
  const R = M.world ? regionOf(sim, sim.players.find((p) => p.alive) || sim.players[0]) : M;
  if (M.world && R.id !== sim.region) {
    sim.region = R.id;
    sim.fx.push({ k: "region", id: R.id });
  }
  const pool = R.pool.filter((s) => spawnReady(sim, s) && !(R.retire && R.retire[s.type] && t >= R.retire[s.type]));
  const total = pool.reduce((a, s) => a + s.w, 0);
  while (sim.spawnAcc >= 1 && sim.enemies.length < cap) {
    sim.spawnAcc -= 1;
    let r = sim.rng() * total, pick = pool[0];
    for (const s of pool) {
      if ((r -= s.w) <= 0) {
        pick = s;
        break;
      }
    }
    const alivePlayers = sim.players.filter((p) => p.alive);
    if (!alivePlayers.length) break;
    const anchor = alivePlayers[Math.floor(sim.rng() * alivePlayers.length)];
    const at = spawnSpot(sim, anchor);
    if (!at) continue;
    spawnEnemy(sim, pick.type, at[0], at[1]);
  }
  if (alive >= cap) sim.spawnAcc = Math.min(sim.spawnAcc, 2);
}
function spawnSpot(sim, anchor) {
  const M = sim.map;
  for (let tries = 0; tries < 8; tries++) {
    const ahead = anchor.moving && sim.rng() < 0.65;
    const a = ahead ? (sim.pace >= 2 ? anchor.moveFace : anchor.face) + (sim.rng() - 0.5) * 1.6 : sim.rng() * 6.283, d = 26 + sim.rng() * 8;
    let x = anchor.x + (ahead ? dsin(a) : dcos(a)) * d, z = anchor.z + (ahead ? dcos(a) : dsin(a)) * d;
    const off = hyp(x - M.cx, z - M.cz);
    if (off > M.r) {
      x = M.cx + (x - M.cx) * (M.r / off);
      z = M.cz + (z - M.cz) * (M.r / off);
    }
    if (walkable(sim, x, z) && flowAt(sim, x, z) !== -2) return [x, z];
  }
  return null;
}
var STRAY_D = 45;
var STRAY_T = 5;
function recycleStrays(sim, dt) {
  const alive = sim.players.filter((p) => p.alive);
  if (!alive.length) return;
  for (const e of sim.enemies) {
    if (e.dead || e.rise > 0 || e.treasure || e.champion || e.final || ENEMIES[e.type].boss) continue;
    let near = Infinity;
    for (const p of alive) near = Math.min(near, hyp(p.x - e.x, p.z - e.z));
    if (near < STRAY_D) {
      e.far = 0;
      continue;
    }
    e.far = (e.far || 0) + dt;
    if (e.far < STRAY_T) continue;
    const at = spawnSpot(sim, alive[Math.floor(sim.rng() * alive.length)]);
    if (at) {
      e.x = at[0];
      e.z = at[1];
      e.kx = 0;
      e.kz = 0;
    }
    e.far = 0;
  }
}
function rollChoices(sim, p) {
  const opts = [], st = playerStats(p);
  for (const id of Object.keys(EVOLUTIONS)) {
    if ((p.weapons[id] || 0) >= MAX_WEAPON_LEVEL && !p.evo[id] && evolutionPassives(id, sim.pace).some((key) => (p.passives[key] || 0) >= 1)) opts.push({ kind: "evolve", id, level: 1, w: 1e3 });
  }
  for (const id of WEAPON_IDS) {
    if (sim.pace >= 2 && p.banished.includes("weapon:" + id)) continue;
    const lvl = p.weapons[id] || 0;
    if (lvl >= MAX_WEAPON_LEVEL) continue;
    if (!lvl && Object.keys(p.weapons).length >= st.weaponSlots) continue;
    opts.push({ kind: "weapon", id, level: lvl + 1, w: lvl ? 3 : 2 });
  }
  for (const id of passiveIdsAt(sim.pace, sim.ranked)) {
    if (sim.pace >= 2 && p.banished.includes("passive:" + id)) continue;
    const lvl = p.passives[id] || 0;
    if (lvl >= MAX_PASSIVE_LEVEL) continue;
    if (!lvl && Object.keys(p.passives).length >= st.passiveSlots) continue;
    opts.push({ kind: "passive", id, level: lvl + 1, w: lvl ? 2.5 : 2 });
  }
  const out = [];
  opts.sort((a, b) => b.w - a.w);
  while (out.length < 3 && opts.length && opts[0].w >= 1e3) out.push(opts.shift());
  while (out.length < 3 && opts.length) {
    const total = opts.reduce((a, o) => a + o.w, 0);
    let r = sim.rng() * total, i = 0;
    for (; i < opts.length; i++) {
      if ((r -= opts[i].w) <= 0) break;
    }
    out.push(opts.splice(Math.min(i, opts.length - 1), 1)[0]);
  }
  if (out.length && out.every((c) => c.id === "curse")) out.unshift({ kind: "heal", id: "fish", level: 1 });
  else if (out.length > 1 && out.some((c) => c.id === "curse")) out.sort((a, b) => (a.id === "curse") - (b.id === "curse"));
  if (!out.length) out.push({ kind: "heal", id: "fish", level: 1 });
  if (!(sim.pace >= 2)) return out.map(({ kind, id, level }) => ({ kind, id, level }));
  const luck = cardLuck(p.meta || {}, { greed: passiveStrength(p, "greed") });
  return out.map(({ kind, id, level }) => {
    if (kind === "evolve") return { kind, id, level };
    if (id === "curse") return { kind, id, level, from: level - 1 };
    const r = rarityFromRoll(sim.rng(), luck);
    if (kind === "heal") return { kind, id, level, rarity: CARD_RARITIES[r] };
    const from = level - 1, max = kind === "weapon" ? MAX_WEAPON_LEVEL : MAX_PASSIVE_LEVEL;
    return { kind, id, level: Math.min(max, from + CARD_GAIN[r]), from, rarity: CARD_RARITIES[r] };
  });
}
var cardGain = (sim, c) => sim.pace >= 2 ? 1 : c.rarity && typeof c.from === "number" && c.level > c.from ? c.level - c.from : 1;
function openLevel(sim, p) {
  if (!(sim.pace >= 2) || !p.alive || sim.pending[p.id] || !p.levelQ || sim.over) return false;
  p.levelQ--;
  sim.pending[p.id] = { choices: rollChoices(sim, p), left: 20 };
  if (sim.endless && sim.pending[p.id].choices.every((c) => c.kind === "heal" || c.kind === "passive" && c.id === "curse")) {
    const stat = ["might", "maxHp", "area"][Math.floor(sim.rng() * 3)];
    p.endlessGrowth ||= { might: 0, maxHp: 0, area: 0 };
    p.endlessGrowth[stat]++;
    if (stat === "maxHp" && !p.godMode) {
      const maxHp = playerStats(p).maxHp;
      p.hp = Math.min(maxHp, p.hp + Math.max(0, maxHp - p.maxHp));
      p.maxHp = maxHp;
    }
    sim.fx.push({ k: "endless-growth", player: p.id, stat });
  }
  return true;
}
function applyChoice(sim, p, choice) {
  if (choice.kind === "evolve") {
    p.evo[choice.id] = true;
    sim.evolves++;
    if (sim.coop) p.evolves++;
    sim.fx.push({ k: "evolve", id: choice.id, ...sim.coop ? { player: p.id } : {} });
    return;
  }
  if (sim.pace >= 2 && (choice.kind === "weapon" || choice.kind === "passive")) {
    const key = choice.kind === "weapon" ? "weapons" : "passives", max = choice.kind === "weapon" ? MAX_WEAPON_LEVEL : MAX_PASSIVE_LEVEL;
    if ((p[key][choice.id] || 0) >= max) return;
    const bonus = CARD_QUALITY[Math.max(0, CARD_RARITIES.indexOf(choice.rarity))] - 100;
    if (bonus && choice.id !== "curse") {
      p.quality ||= { weapons: {}, passives: {} };
      p.quality[key][choice.id] = (p.quality[key][choice.id] || 0) + bonus;
    }
  }
  if (choice.kind === "weapon") p.weapons[choice.id] = Math.min(MAX_WEAPON_LEVEL, (p.weapons[choice.id] || 0) + cardGain(sim, choice));
  else if (choice.kind === "passive") {
    p.passives[choice.id] = Math.min(MAX_PASSIVE_LEVEL, (p.passives[choice.id] || 0) + cardGain(sim, choice));
    const st = playerStats(p);
    if (!p.godMode) {
      const gain = st.maxHp - p.maxHp;
      p.maxHp = st.maxHp;
      p.hp = Math.min(p.maxHp, p.hp + Math.max(0, gain));
    }
  } else {
    const r = Math.max(0, CARD_RARITIES.indexOf(choice.rarity));
    p.hp = Math.min(p.maxHp, p.hp + CARD_HEAL[r] * playerStats(p).heal);
    return;
  }
  if (sim.pace >= 2 && choice.rarity === "epic" && choice.id !== "curse" && !p.godMode) p.hp = p.maxHp;
}
function choose(sim, playerId, index) {
  const pend = sim.pending[playerId];
  const p = sim.players.find((q) => q.id === playerId);
  if (!pend || !p) return false;
  const c = pend.choices[index] || pend.choices[0];
  if (sim.pace >= 2 && c.banished) return false;
  if (pend.casket) applyCasket(sim, p, c);
  else applyChoice(sim, p, c);
  delete sim.pending[playerId];
  sim.fx.push({ k: "pick", id: playerId });
  if (!openLevel(sim, p)) openCasket(sim, p);
  return true;
}
function autoChoice(pend) {
  return pend && pend.casket ? pend.rec : pend?.choices.findIndex((c) => !c.banished) ?? 0;
}
function canBanish(sim, playerId, index) {
  const p = sim.players.find((p2) => p2.id === playerId), pend = sim.pending[playerId];
  if (!(sim.pace >= 2) || sim.over || !p?.alive || !pend || pend.casket || !Number.isInteger(index) || index < 0 || p.banished.length >= 3) return false;
  const c = pend.choices[index];
  return !!c && !c.banished && (c.kind === "weapon" && !p.weapons[c.id] || c.kind === "passive" && !p.passives[c.id]) && pend.choices.some((other, i) => i !== index && !other.banished);
}
function banish(sim, playerId, index) {
  if (!canBanish(sim, playerId, index)) return false;
  const p = sim.players.find((p2) => p2.id === playerId), c = sim.pending[playerId].choices[index];
  p.banished.push(c.kind + ":" + c.id);
  c.banished = true;
  return true;
}
function wearItem(sim, p, item) {
  const before = p.maxHp;
  p.gear = { ...p.gear, [GEAR[item].slot]: item };
  p.gb = gearBonus(p.gear, p.gearLv || {}, sim.pace);
  if (!p.godMode) {
    const m = playerStats(p).maxHp;
    p.maxHp = m;
    p.hp = Math.min(m, p.hp + Math.max(0, m - before));
  }
}
function gotCasket(sim, p, item) {
  sim.loot.push(item);
  const owner = sim.coop ? { player: p.id } : {};
  if (sim.coop) p.loot.push(item);
  if (isWeaponItem(item)) {
    if (p.casketLootIndices) p.casketLootIndices.push(sim.loot.length - 1);
    p.casketQ.push(item);
    sim.fx.push({ k: "casket", item, worn: 0, queued: 1, ...owner });
    return;
  }
  if (!p.gear[GEAR[item].slot]) {
    wearItem(sim, p, item);
    sim.fx.push({ k: "casket", item, worn: 1, ...owner });
    return;
  }
  if (p.casketLootIndices) p.casketLootIndices.push(sim.loot.length - 1);
  p.casketQ.push(item);
  sim.fx.push({ k: "casket", item, worn: 0, queued: 1, ...owner });
}
function openCasket(sim, p) {
  if (!p || !p.alive || sim.pending[p.id] || !p.casketQ.length || sim.over) return false;
  const item = p.casketQ.shift(), lootIndex = p.casketLootIndices?.shift();
  const card = isWeaponItem(item) ? compareWeaponItem(p.wm, item) : compareGear(p.gear, p.gearLv || {}, item, sim.pace);
  const rec = card.better ? 0 : 1;
  sim.pending[p.id] = { ...Number.isSafeInteger(lootIndex) ? { lootIndex } : {}, casket: card, choices: [{ kind: "wear", id: item, level: 1 }, { kind: "alch", id: item, level: card.alch }], rec, more: p.casketQ.length, left: 30 };
  return true;
}
function applyCasket(sim, p, c) {
  const owner = sim.coop ? { player: p.id } : {};
  if (c.kind === "wear" && isWeaponItem(c.id)) {
    const w = WEAPON_ITEMS[c.id], old = weaponSlotItem(w.slot, p.wm[w.slot]);
    p.wm = { ...p.wm, [w.slot]: w.step };
    sim.fx.push({ k: "casket", item: c.id, worn: 1, old, weapon: w.weapon, ...owner });
  } else if (c.kind === "wear") {
    const old = p.gear[GEAR[c.id].slot] || null;
    wearItem(sim, p, c.id);
    sim.fx.push({ k: "casket", item: c.id, worn: 1, old, ...owner });
  } else {
    p.alch += c.level;
    sim.alched.push(c.id);
    if (sim.alchedLootIndices) sim.alchedLootIndices.push(sim.pending[p.id]?.lootIndex);
    if (sim.coop) p.alched.push(c.id);
    sim.fx.push({ k: "alch", item: c.id, coins: c.level, ...owner });
  }
}
function reroll(sim, playerId) {
  const pend = sim.pending[playerId], p = sim.players.find((q) => q.id === playerId);
  if (!pend || pend.casket || !p || p.rerolls <= 0) return false;
  p.rerolls--;
  pend.choices = rollChoices(sim, p);
  return true;
}
function skipLevel(sim, playerId) {
  const p = sim.players.find((q) => q.id === playerId);
  if (!sim.pending[playerId] || sim.pending[playerId].casket || !p) return false;
  delete sim.pending[playerId];
  p.coins++;
  sim.fx.push({ k: "pick", id: playerId });
  if (sim.pace >= 2 && !openLevel(sim, p)) openCasket(sim, p);
  return true;
}
function gainXp(sim, amount2) {
  sim.xp += amount2;
  while (sim.xp >= sim.xpNeed) {
    sim.xp -= sim.xpNeed;
    sim.level++;
    sim.xpNeed = xpForLevel(sim.level);
    for (const p of sim.players) if (p.alive) {
      if (sim.pace >= 2) {
        p.levelQ = (p.levelQ || 0) + 1;
        openLevel(sim, p);
      } else if (!sim.pending[p.id]) sim.pending[p.id] = { choices: rollChoices(sim, p), left: 20 };
    }
    sim.fx.push({ k: "level", level: sim.level });
  }
}
function withPassives(id, s, st) {
  if (st.haste < 1 && (s.hitcd || s.tick)) {
    s = { ...s };
    if (s.hitcd) s.hitcd *= st.haste;
    if (s.tick) s.tick *= st.haste;
  }
  if (s.speed && st.projectileSpeed !== 1) s = { ...s, speed: s.speed * st.projectileSpeed };
  if (st.area === 1 && !st.amount) return s;
  s = { ...s };
  const A = st.area;
  if (s.range) s.range *= A;
  if (s.radius) s.radius *= id === "shield" ? 1 + (A - 1) * 0.5 : A;
  if (s.burst) s.burst *= A;
  if (s.r && (id === "axe" || id === "baseball")) s.r *= A;
  if (id === "bow" || id === "shortsword") s.hit = 0.45 * A;
  if (s.life && st.reach > 1 && ["bow", "axe", "staff", "shortsword", "baseball"].includes(id)) s.life *= st.reach;
  if (st.amount && ["bow", "axe", "staff", "shortsword", "baseball", "shield"].includes(id) && !s.ring) s.count = (s.count || 1) + st.amount;
  return s;
}
var NO_METAL = { dmg: 1, pierce: 0 };
function fireWeapons(sim, p, dt, st) {
  p.orbit += dt;
  for (const id of Object.keys(p.weapons)) {
    const lvl = p.weapons[id];
    let s = weaponStats(p, id);
    if (p.evo[id]) s = evolveStats(id, s);
    s = withPassives(id, s, st);
    if (id === "shield" || id === "lighter") continue;
    const metal = sim.pace >= 2 ? weaponMetal(id, p.wm) : NO_METAL, mt = sim.pace >= 2 ? weaponLook(id, p.wm, p.evo[id]) : void 0;
    const dmg = (s.dmg || 0) * st.might * metal.dmg * (MAGIC_WEAPONS.includes(id) ? st.magic : 1);
    if (metal.pierce) s = { ...s, pierce: (s.pierce || 0) + metal.pierce };
    p.cd[id] = (p.cd[id] ?? 0.2) - dt;
    if (p.cd[id] > 0) continue;
    const reach = id === "pickaxe" ? 7 : id === "katana" || id === "greatsword" ? s.range + 1.5 : id === "shortsword" ? 20 : id === "baseball" ? 14 : 18;
    const melee = sim.pace >= 2 && (id === "katana" || id === "greatsword");
    const target = nearestEnemy(sim, p.x, p.z, melee ? s.range : reach, void 0, melee);
    if (!target && id !== "pickaxe") {
      p.cd[id] = 0;
      continue;
    }
    sim.src = id;
    p.cd[id] = s.cd * st.haste;
    if (id === "katana") {
      const a = datan2(target.x - p.x, target.z - p.z);
      p.face = a;
      const dirs = s.both ? [a, a + Math.PI] : [a];
      for (const dir of dirs) {
        sim.fx.push({ k: "slash", x: p.x, z: p.z, a: dir, range: s.range, arc: s.arc, lvl, mt, ...sim.coop ? { player: p.id } : {} });
        const half = s.arc * Math.PI / 180 / 2;
        for (const e of sim.enemies) {
          const dx = e.x - p.x, dz = e.z - p.z, d = hyp(dx, dz);
          if (d > s.range + ENEMIES[e.type].r) continue;
          let da = Math.abs((datan2(dx, dz) - dir + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          if (da > half || d < 1e-3) {
            if (d > 0.9) continue;
          }
          damageEnemy(sim, e, dmg, p.id, s.kb, p.x, p.z);
          if (s.lifesteal) p.hp = Math.min(p.maxHp, p.hp + s.lifesteal);
        }
      }
    } else if (id === "bow") {
      const used = /* @__PURE__ */ new Set();
      for (let i = 0; i < s.count; i++) {
        const tg = nearestEnemy(sim, p.x, p.z, 22, used) || target;
        used.add(tg.id);
        const a = datan2(tg.x - p.x, tg.z - p.z) + (i % 2 ? 1 : -1) * Math.floor((i + 1) / 2) * 0.06;
        sim.proj.push({ id: sim.nextId++, art: "arrow", evo: !!p.evo.bow, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: s.pierce, life: s.life, r: s.hit || 0.45, hit: [], lvl, mt: sim.pace >= 2 ? weaponLook("arrow", p.wm) : void 0 });
      }
    } else if (id === "axe") {
      for (let i = 0; i < s.count; i++) {
        const a = target ? datan2(target.x - p.x, target.z - p.z) + (sim.rng() - 0.5) * 0.9 + (i - (s.count - 1) / 2) * 0.35 : sim.rng() * 6.283;
        sim.proj.push({ id: sim.nextId++, art: "axe", evo: !!p.evo.axe, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: 99, life: s.life, r: s.r, hit: [], hitAt: {}, lvl, mt });
      }
    } else if (id === "staff") {
      const used = /* @__PURE__ */ new Set();
      for (let i = 0; i < s.count; i++) {
        const tg = nearestEnemy(sim, p.x, p.z, 20, used) || target;
        used.add(tg.id);
        const a = datan2(tg.x - p.x, tg.z - p.z) + (i - (s.count - 1) / 2) * 0.5;
        sim.proj.push({ id: sim.nextId++, art: "bolt", evo: !!p.evo.staff, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: 0, life: s.life, r: 0.5, hit: [], homing: tg.id, speed: s.speed, burst: s.burst, lvl });
      }
    } else if (id === "greatsword") {
      sim.fx.push({ k: "spin", x: p.x, z: p.z, range: s.range, lvl, evo: p.evo.greatsword ? 1 : 0, ...sim.coop ? { player: p.id } : {} });
      for (const e of sim.enemies) if (hyp(e.x - p.x, e.z - p.z) <= s.range + ENEMIES[e.type].r) damageEnemy(sim, e, dmg, p.id, s.kb, p.x, p.z);
      if (s.heal) p.hp = Math.min(p.maxHp, p.hp + s.heal);
    } else if (id === "shortsword") {
      const n = s.count;
      for (let i = 0; i < n; i++) {
        const aim = target ? datan2(target.x - p.x, target.z - p.z) : p.face;
        const a = s.ring ? aim + i / n * Math.PI * 2 : aim + (i - (n - 1) / 2) * 0.13;
        sim.proj.push({ id: sim.nextId++, art: "sword", evo: !!p.evo.shortsword, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: s.pierce, life: s.life, r: s.hit || 0.45, hit: [], lvl, mt });
      }
    } else if (id === "baseball") {
      const used = /* @__PURE__ */ new Set();
      for (let i = 0; i < s.count; i++) {
        const tg = nearestEnemy(sim, p.x, p.z, 14, used) || target;
        used.add(tg.id);
        const a = datan2(tg.x - p.x, tg.z - p.z);
        sim.proj.push({ id: sim.nextId++, art: "ball", evo: !!p.evo.baseball, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: s.bounces, life: s.life, r: s.r, hit: [], speed: s.speed, kb: s.kb, lvl });
      }
    } else if (id === "pickaxe") {
      if (!sim.enemies.some((e) => sim.pace >= 2 ? hyp(e.x - p.x, e.z - p.z) <= s.radius + ENEMIES[e.type].r : hyp(e.x - p.x, e.z - p.z) < s.radius + 2)) {
        p.cd[id] = 0.3;
        continue;
      }
      sim.fx.push({ k: "quake", x: p.x, z: p.z, r: s.radius, lvl, ...sim.coop ? { player: p.id } : {} });
      for (const e of sim.enemies) if (hyp(e.x - p.x, e.z - p.z) <= s.radius + ENEMIES[e.type].r) damageEnemy(sim, e, dmg, p.id, s.kb, p.x, p.z);
    }
  }
  if (p.weapons.lighter) {
    let s = weaponStats(p, "lighter");
    if (p.evo.lighter) s = evolveStats("lighter", s);
    s = withPassives("lighter", s, st);
    p.fire = s.radius;
    p.cd.lighter = (p.cd.lighter ?? 0) - dt;
    if (p.cd.lighter <= 0) {
      p.cd.lighter = s.tick;
      sim.src = "lighter";
      for (const e of sim.enemies) if (!e.dead && hyp(e.x - p.x, e.z - p.z) <= s.radius + ENEMIES[e.type].r * 0.5) damageEnemy(sim, e, s.dmg * st.might * st.magic, p.id, 0.3, p.x, p.z);
    }
  } else p.fire = 0;
  if (p.weapons.shield) {
    let s = weaponStats(p, "shield");
    if (p.evo.shield) s = evolveStats("shield", s);
    s = withPassives("shield", s, st);
    p.shields = s;
    const dmg = s.dmg * st.might;
    sim.src = "shield";
    for (let i = 0; i < s.count; i++) {
      const a = p.orbit * s.spin + i / s.count * Math.PI * 2;
      const sx = p.x + dsin(a) * s.radius, sz = p.z + dcos(a) * s.radius;
      for (const e of sim.enemies) {
        if (hyp(e.x - sx, e.z - sz) > s.r + ENEMIES[e.type].r) continue;
        const key = `s${p.id}${i}`;
        if ((e.cdHit[key] || 0) > sim.t) continue;
        e.cdHit[key] = sim.t + s.hitcd;
        damageEnemy(sim, e, dmg, p.id, 1.5, p.x, p.z);
      }
    }
  }
}
function stepProjectiles(sim, dt) {
  const ART_SRC = { arrow: "bow", axe: "axe", bolt: "staff", sword: "shortsword", ball: "baseball" };
  for (const pr of sim.proj) {
    pr.life -= dt;
    sim.src = ART_SRC[pr.art] || pr.art;
    if (pr.art === "bolt") {
      const tg = sim.enemies.find((e) => e.id === pr.homing) || nearestEnemy(sim, pr.x, pr.z, 18);
      if (tg) {
        pr.homing = tg.id;
        const want = datan2(tg.x - pr.x, tg.z - pr.z), cur = datan2(pr.vx, pr.vz);
        let d = (want - cur + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        const turn = Math.max(-5 * dt, Math.min(5 * dt, d)), na = cur + turn;
        pr.vx = dsin(na) * pr.speed;
        pr.vz = dcos(na) * pr.speed;
      }
    }
    pr.x += pr.vx * dt;
    pr.z += pr.vz * dt;
    if (pr.art === "axe") {
      pr.spin = (pr.spin || 0) + dt * 14;
    }
    for (const e of sim.enemies) {
      if (e.dead) continue;
      if (hyp(e.x - pr.x, e.z - pr.z) > pr.r + ENEMIES[e.type].r) continue;
      if (pr.art === "axe") {
        if ((pr.hitAt[e.id] || 0) > sim.t) continue;
        pr.hitAt[e.id] = sim.t + 0.35;
      } else if (pr.hit.includes(e.id)) continue;
      pr.hit.push(e.id);
      damageEnemy(sim, e, pr.dmg, pr.owner, pr.kb || 0.8, pr.x - pr.vx, pr.z - pr.vz);
      if (pr.art === "bolt") {
        if (pr.burst) {
          sim.fx.push({ k: "burst", x: pr.x, z: pr.z, r: pr.burst, evo: pr.evo ? 1 : 0, ...sim.pace >= 2 ? { projectile: pr.id, owner: pr.owner, lvl: pr.lvl } : {} });
          for (const o of sim.enemies) if (o !== e && !o.dead && hyp(o.x - pr.x, o.z - pr.z) < pr.burst) damageEnemy(sim, o, pr.dmg * 0.6, pr.owner, 1, pr.x, pr.z);
        }
        pr.life = 0;
        break;
      }
      if (pr.art === "arrow" || pr.art === "sword") {
        if (pr.pierce-- <= 0) {
          pr.life = 0;
          break;
        }
      }
      if (pr.art === "ball") {
        if (pr.pierce-- <= 0) {
          pr.life = 0;
          break;
        }
        const next = nearestEnemy(sim, pr.x, pr.z, 9, new Set(pr.hit));
        if (!next) {
          pr.life = 0;
          break;
        }
        const a = datan2(next.x - pr.x, next.z - pr.z);
        pr.vx = dsin(a) * pr.speed;
        pr.vz = dcos(a) * pr.speed;
        pr.life = Math.max(pr.life, 0.8);
        sim.fx.push({ k: "bounce", x: pr.x, z: pr.z, evo: pr.evo ? 1 : 0 });
        break;
      }
    }
  }
  sim.proj = sim.proj.filter((p) => p.life > 0);
}
var REGIONS = MAPS.filter((m) => !m.special && !m.under);
var DESERT = /* @__PURE__ */ new Set(["apache", "duel", "paya"]);
var onDesert = (x, z) => x < 258 && z < 204;
function regionOf(sim, p) {
  const side = onDesert(p.x, p.z);
  let best = null, bd = 1e18;
  for (const m of REGIONS) {
    if (DESERT.has(m.id) !== side) continue;
    const dx = m.cx - p.x, dz = m.cz - p.z, d = dx * dx + dz * dz;
    if (d < bd) {
      bd = d;
      best = m;
    }
  }
  return best || REGIONS[0];
}
var BELT_SIZE = 4;
var BELT_KINDS = ["beer", "pumpkin", "warp"];
var FOOD = { cheese: { heal: 15, item: "Cheese" }, crawdad: { heal: 15, item: "Cooked Crawdad" }, trout: { heal: 25, item: "Cooked Brown Trout" }, catfish: { heal: 35, item: "Cooked Catfish" }, bass: { heal: 50, item: "Cooked Bubba Bass" } };
var FOOD_TIERS = ["crawdad", "trout", "catfish", "bass"];
function foodDrop(t, u, elite = false, pace = 1) {
  let i = t < 180 ? u < 0.7 ? 0 : 1 : t < 480 ? u < 0.35 ? 0 : u < 0.75 ? 1 : 2 : u < 0.3 ? 1 : u < 0.78 ? 2 : 3;
  if (elite) i = Math.min(3, i + 1);
  if (pace >= 2 && i === 0 && u < (t < 180 ? 0.35 : 0.175)) return "cheese";
  return FOOD_TIERS[i];
}
function useItem(sim, p, kind) {
  const st = playerStats(p);
  if (FOOD[kind]) p.hp = Math.min(p.maxHp, p.hp + FOOD[kind].heal * st.heal);
  else if (kind === "beer") {
    p.hp = Math.min(p.maxHp, p.hp + 20 * st.heal);
    p.buffs.speed = sim.pace >= 2 ? Math.min(60, 8 + Math.max(0, p.buffs.speed || 0)) : 8;
  } else if (kind === "pumpkin") {
    sim.src = "pumpkin";
    sim.fx.push({ k: "nuke", x: p.x, z: p.z, r: 20 });
    for (const e of sim.enemies) if (hyp(e.x - p.x, e.z - p.z) < 20) damageEnemy(sim, e, 45 + sim.t * 0.25, p.id, 4, p.x, p.z);
  } else if (kind === "warp") {
    for (const g of sim.gems) g.pulled = true;
    for (const o of sim.pickups) if (o.kind === "coin") o.pulled = true;
  }
  sim.fx.push({ k: "use", kind, x: p.x, z: p.z, ...sim.coop ? { player: p.id } : {} });
}
function useBelt(sim, playerId, slot) {
  const p = sim.players.find((q) => q.id === playerId);
  if (!p || !p.alive || slot < 0 || slot >= p.belt.length) return false;
  const kind = p.belt.splice(slot, 1)[0];
  useItem(sim, p, kind);
  return true;
}
function merchantTick(sim, dt) {
  if (!merchantEligible(sim) || !sim.players[0].alive) return;
  sim.merchantT = (sim.merchantT ?? MERCHANT.first + sim.rng() * MERCHANT.firstJitter) - dt;
  if (sim.merchant) {
    sim.merchant.life -= dt;
    if (sim.merchant.life <= 0) sim.merchant = null;
  }
  if (sim.merchantT > 0 || sim.merchant) return;
  sim.merchantT = MERCHANT.every + sim.rng() * MERCHANT.jitter;
  const p = sim.players[0], M = sim.map;
  if (sim.ground) updateFlow(sim, p);
  for (let tries = 0; tries < 20; tries++) {
    const a = sim.rng() * 6.283, d = 12 + sim.rng() * 10, x = p.x + dcos(a) * d, z = p.z + dsin(a) * d;
    if (hyp(x - M.cx, z - M.cz) + 1 > M.r || !walkable(sim, x, z) || sim.ground && flowAt(sim, x, z) < 0) continue;
    let clear = true;
    for (let j = Math.floor(z - 1); j <= Math.floor(z + 1) && clear; j++) {
      for (let i = Math.floor(x - 1); i <= Math.floor(x + 1) && clear; i++) {
        clear = walkable(sim, i + 0.5, j + 0.5) && clearPath(sim, x, z, i + 0.5, j + 0.5, true);
      }
    }
    if (!clear) continue;
    sim.merchant = { id: sim.nextId++, x, z, life: MERCHANT.life, offers: merchantStock(sim) };
    break;
  }
}
var SHRINES = {
  strength: { name: "Shrine of Strength", text: "+30% damage for 40 seconds", color: 16734780 },
  prayer: { name: "Shrine of Prayer", text: "full health and 3 seconds of protection", color: 12577023 },
  magic: { name: "Shrine of Magic", text: "every bone flies to you, and +40% experience for 40 seconds", color: 11561727 },
  agility: { name: "Shrine of Agility", text: "+25% speed for 40 seconds", color: 8118378 },
  fortune: { name: "Shrine of Fortune", text: "a treasure chest", color: 16765773 },
  wealth: { name: "Shrine of Wealth", text: "a ring of coins", color: 16756794 }
};
var SHRINE = { first: 75, every: 110, charge: 3.5, r: 2.6, life: 75 };
var SHRINE_KINDS = Object.keys(SHRINES);
function shrineTick(sim, dt) {
  if (sim.pace < 2) return;
  const alive = sim.players.filter((q) => q.alive);
  if (!alive.length) return;
  sim.shrineT = (sim.shrineT ?? SHRINE.first) - dt;
  if (sim.shrineT <= 0) {
    sim.shrineT = sim.shrines.length >= 2 ? 20 : SHRINE.every;
    if (sim.shrines.length < 2) {
      const p = alive[Math.floor(sim.rng() * alive.length)], M = sim.map;
      if (sim.ground && flowAt(sim, p.x, p.z) < 0) updateFlow(sim, p);
      for (let tries = 0; tries < 10; tries++) {
        const a = sim.rng() * 6.283, d = 16 + sim.rng() * 10, x = p.x + dcos(a) * d, z = p.z + dsin(a) * d;
        if (hyp(x - M.cx, z - M.cz) + 2.75 > M.r || !walkable(sim, x, z) || sim.ground && flowAt(sim, x, z) < 0) continue;
        let clear = true;
        for (let j = Math.floor(z - 2.75); j <= Math.floor(z + 2.75) && clear; j++) {
          for (let i = Math.floor(x - 2.75); i <= Math.floor(x + 2.75) && clear; i++) {
            if (hyp(Math.max(i - x, x - i - 1, 0), Math.max(j - z, z - j - 1, 0)) > 2.75) continue;
            clear = walkable(sim, i + 0.5, j + 0.5) && clearPath(sim, x, z, i + 0.5, j + 0.5, true);
          }
        }
        if (!clear) continue;
        const kind = SHRINE_KINDS[Math.floor(sim.rng() * SHRINE_KINDS.length)];
        sim.shrines.push({ id: sim.nextId++, x, z, kind, charge: 0, life: SHRINE.life });
        sim.fx.push({ k: "shrine", kind, x, z });
        break;
      }
    }
  }
  for (const s of sim.shrines) {
    s.life -= dt;
    const p = alive.find((q) => hyp(q.x - s.x, q.z - s.z) < SHRINE.r);
    s.charge = p ? s.charge + dt : Math.max(0, s.charge - dt * 0.5);
    if (p && s.charge >= SHRINE.charge) {
      shrineReward(sim, p, s);
      s.done = true;
      sim.fx.push({ k: "shrine-done", kind: s.kind, x: s.x, z: s.z, id: p.id });
    } else if (s.life <= 0) {
      s.done = true;
      sim.fx.push({ k: "shrine-gone", kind: s.kind, x: s.x, z: s.z });
    }
  }
  if (sim.shrines.some((s) => s.done)) sim.shrines = sim.shrines.filter((s) => !s.done);
}
function shrineReward(sim, p, s) {
  const k = s.kind;
  if (k === "strength") p.buffs.strength = 40;
  else if (k === "prayer") {
    p.hp = p.maxHp;
    p.inv = Math.max(p.inv, 3);
  } else if (k === "magic") {
    for (const g of sim.gems) g.pulled = true;
    p.buffs.wisdom = 40;
  } else if (k === "agility") p.buffs.agility = 40;
  else if (k === "fortune") sim.pickups.push({ id: sim.nextId++, x: s.x, z: s.z, kind: "chest" });
  else for (let i = 0; i < 12; i++) {
    const a = i / 12 * 6.283;
    sim.pickups.push({ id: sim.nextId++, x: s.x + dcos(a) * 1.8, z: s.z + dsin(a) * 1.8, kind: "coin" });
  }
}
function eventTick(sim, dt) {
  const ev = sim.event;
  if (ev) {
    ev.t -= dt;
    if (ev.kind === "meteors") {
      ev.next -= dt;
      if (ev.next <= 0) {
        ev.next = 0.45;
        const p2 = sim.players.find((q) => q.alive);
        if (p2) {
          const a = sim.rng() * 6.283, d = sim.rng() * 11;
          sim.hazards.push({ x: p2.x + dcos(a) * d, z: p2.z + dsin(a) * d, r: 2.6 * (sim.pace >= 2 ? 0.95 : 1), t: 1.1, max: 1.1, dmg: Math.round(12 * (1 + sim.t / 600)), meteor: true });
        }
      }
    }
    if (ev.kind === "treasure" || ev.kind === "duel") {
      const g = sim.enemies.find((e) => e.id === ev.id);
      if (!g) {
        sim.event = null;
        return;
      }
      if (ev.t <= 0) {
        g.dead = true;
        sim.fx.push({ k: "escape", x: g.x, z: g.z });
      }
    }
    if (ev.t <= 0 || (ev.kind === "treasure" || ev.kind === "duel") && !sim.enemies.some((e) => e.id === ev.id && !e.dead)) sim.event = null;
    return;
  }
  sim.eventT -= dt;
  if (sim.eventT > 0) return;
  sim.eventT = 140 + sim.rng() * 50;
  const p = sim.players.find((q) => q.alive);
  if (!p) return;
  const here = sim.map.world ? regionOf(sim, p) : sim.map;
  const grow = Math.max(0.5, Math.min(1, sim.t / 420));
  const N = (n) => Math.max(3, Math.round(n * grow));
  const storms = sim.pace >= 2 ? extraStorms(here, sim.t >= SNOW_WAVE_AT) : [];
  const kinds = (here.events || sim.map.events || ["treasure", "swarm", "meteors"]).filter((kind2) => (kind2 !== "blizzard" || sim.pace < 2 || sim.t >= SNOW_WAVE_AT) && (sim.pace < 2 || !["rainstorm", "snowstorm"].includes(kind2) || storms.includes(kind2)));
  for (const kind2 of storms) if (!kinds.includes(kind2)) kinds.push(kind2);
  const kind = kinds.length ? kinds[Math.floor(sim.rng() * kinds.length)] : "swarm";
  let dir = null;
  if (kind === "treasure") {
    const a = sim.rng() * 6.283, w = findWalkable(sim, p.x + dcos(a) * 12, p.z + dsin(a) * 12);
    spawnEnemy(sim, "goblin", w[0], w[1], 12);
    const g = sim.enemies[sim.enemies.length - 1];
    g.treasure = true;
    g.elite = true;
    g.speed = PLAYER_BASE.speed * 0.82 * 0.95;
    sim.event = { kind, t: 25, id: g.id };
  } else if (kind === "swarm") {
    const pool = here.pool.filter((s) => spawnReady(sim, s)), type = (pool[pool.length - 1] || pool[0]).type;
    for (let i = 0, n = N(20); i < n; i++) {
      const a = i / n * 6.283, w = findWalkable(sim, p.x + dcos(a) * 16, p.z + dsin(a) * 16);
      spawnEnemy(sim, type, w[0], w[1], 0.5);
    }
    sim.event = { kind, t: 1 };
  } else if (sim.pace >= 2 && (kind === "rainstorm" || kind === "snowstorm")) {
    sim.event = { kind, t: 20 };
  } else if (kind === "blizzard") {
    for (const q of sim.players) if (q.alive) q.buffs.chill = 14;
    for (let i = 0, n = N(10); i < n; i++) {
      const a = i / n * 6.283 + sim.rng() * 0.4, w = findWalkable(sim, p.x + dcos(a) * 15, p.z + dsin(a) * 15);
      spawnEnemy(sim, "snowman", w[0], w[1], 0.8);
    }
    sim.event = { kind, t: 14 };
  } else if (kind === "stampede") {
    const a = sim.rng() * 6.283, cx = dcos(a), cz = dsin(a), n = 36;
    dir = Math.abs(cz) > Math.abs(cx) ? cz < 0 ? "north" : "south" : cx > 0 ? "east" : "west";
    for (let i = 0; i < n; i++) {
      const k = i % 12 - 6, d = 17 + Math.floor(i / 12) * 1.4 + sim.rng();
      const w = findWalkable(sim, p.x + cx * d - cz * k * 1.1, p.z + cz * d + cx * k * 1.1);
      spawnEnemy(sim, i % 12 === 5 ? "cow" : "chicken", w[0], w[1], 0.999);
      sim.enemies[sim.enemies.length - 1].speed *= 1.7;
    }
    sim.event = { kind, t: 1 };
  } else if (kind === "duel") {
    const a = sim.rng() * 6.283, w = findWalkable(sim, p.x + dcos(a) * 10, p.z + dsin(a) * 10);
    spawnEnemy(sim, "bandit", w[0], w[1], 16);
    const c = sim.enemies[sim.enemies.length - 1];
    c.elite = true;
    c.champion = true;
    c.speed *= 1.25;
    sim.event = { kind, t: 30, id: c.id };
  } else if (kind === "sandstorm") {
    for (const q of sim.players) if (q.alive) q.buffs.chill = 12;
    for (let i = 0, n = N(9); i < n; i++) {
      const a = i / n * 6.283 + sim.rng() * 0.4, w = findWalkable(sim, p.x + dcos(a) * 14, p.z + dsin(a) * 14);
      spawnEnemy(sim, "scorpion", w[0], w[1], 0.9);
    }
    sim.event = { kind, t: 12 };
  } else if (kind === "ambush") {
    const G = sim.ground, spots = [];
    if (G && G.water && G.cell) {
      const n = G.n, W = n + 1, px = Math.floor(p.x), pz = Math.floor(p.z);
      for (let dz = -14; dz <= 14; dz++) for (let dx = -14; dx <= 14; dx++) {
        const d2 = dx * dx + dz * dz;
        if (d2 < 25 || d2 > 196) continue;
        const x = px + dx, z = pz + dz;
        if (x < 1 || z < 1 || x >= n - 1 || z >= n - 1) continue;
        if (G.blocked[z * n + x]) continue;
        const k = z * W + x;
        if (G.water[k - 1] || G.water[k + 1] || G.water[k - W] || G.water[k + W]) spots.push([x + 0.5, z + 0.5]);
      }
    }
    const want = N(12);
    for (let i = 0; i < want; i++) {
      let w;
      if (spots.length >= 4) w = spots[Math.floor(sim.rng() * spots.length)];
      else {
        const a = i / want * 6.283, f = findWalkable(sim, p.x + dcos(a) * 10, p.z + dsin(a) * 10);
        w = [f[0], f[1]];
      }
      spawnEnemy(sim, i % 2 ? "slimer" : "alligator", w[0], w[1], 0.8);
      const e = sim.enemies[sim.enemies.length - 1];
      e.rise = 0.8 + sim.rng() * 0.5;
      sim.fx.push({ k: "surface", x: w[0], z: w[1] });
    }
    sim.event = { kind, t: 1 };
  } else if (kind === "rising") {
    const n = N(Math.min(14, 8 + Math.floor(sim.t / 90)));
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + sim.rng() * 0.3, d = 4.5 + sim.rng() * 2.5, w = findWalkable(sim, p.x + dcos(a) * d, p.z + dsin(a) * d);
      spawnEnemy(sim, "skeleton", w[0], w[1], 0.9);
      const sk = sim.enemies[sim.enemies.length - 1];
      sk.rise = 1.1 + sim.rng() * 0.4;
      sim.fx.push({ k: "rise", x: w[0], z: w[1] });
    }
    sim.event = { kind, t: 1 };
  } else if (kind === "warband") {
    const a = sim.rng() * 6.283, cx = dcos(a), cz = dsin(a), n = N(Math.min(32, 16 + Math.floor(sim.t / 40)));
    dir = Math.abs(cz) > Math.abs(cx) ? cz < 0 ? "north" : "south" : cx > 0 ? "east" : "west";
    for (let i = 0; i < n; i++) {
      const rank = i % 2, k = Math.floor(i / 2) - n / 4, d = 18 + rank * 1.6;
      const w2 = findWalkable(sim, p.x + cx * d - cz * k * 1.3, p.z + cz * d + cx * k * 1.3);
      spawnEnemy(sim, sim.t > 90 && i % 9 === 4 ? "bandit" : "goblin", w2[0], w2[1], 0.8);
      const g = sim.enemies[sim.enemies.length - 1];
      g.speed *= 1.2;
    }
    const w = findWalkable(sim, p.x + cx * 20, p.z + cz * 20);
    spawnEnemy(sim, "goblin", w[0], w[1], 9);
    const chief = sim.enemies[sim.enemies.length - 1];
    chief.elite = true;
    sim.event = { kind, t: 1 };
  } else sim.event = { kind, t: 10, next: 0 };
  sim.fx.push({ k: "event", kind, dir });
}
function hurtPlayer(sim, tp, dmg, src = "contact") {
  sim.hurtBy[src] = (sim.hurtBy[src] || 0) + dmg;
  tp.hp -= dmg;
  tp.inv = 0.75;
  tp.hurt = 0.25;
  sim.fx.push({ k: "hurt", id: tp.id, v: dmg, x: tp.x, z: tp.z });
  if (tp.hp <= 0 && tp.revives > 0) {
    tp.revives--;
    tp.hp = tp.maxHp * 0.5;
    tp.inv = 2;
    sim.fx.push({ k: "revive", id: tp.id, x: tp.x, z: tp.z });
  } else if (tp.hp <= 0) {
    tp.hp = 0;
    tp.alive = false;
    sim.fx.push({ k: "down", id: tp.id });
  }
}
var bossDmg = (sim, def, mul) => Math.round(def.dmg * mul * (1 + sim.t / 900) * (sim.hard ? 1.35 : 1));
function bossAct(sim, e, def, tp, d, dx, dz, dt) {
  if (sim.pace >= 2 && e.dead) return null;
  const c = e.charge;
  if (c) {
    if (c.wind > 0) {
      c.wind -= dt;
      return [0, 0];
    }
    if (c.dash > 0) {
      c.dash -= dt;
      return [c.dx * e.speed * 3.4, c.dz * e.speed * 3.4];
    }
    e.charge = null;
  }
  e.atkCd -= dt;
  if (e.atkCd > 0 || d > 24) return null;
  const list = def.attacks || ["slam"], kind = list[Math.floor(sim.rng() * list.length)];
  e.atkCd = (4 + sim.rng() * 2.5) * (sim.hard ? 0.8 : 1);
  if (kind === "slam") {
    const baseR = 3.5 + def.r * 1.2, r = baseR * (sim.pace >= 2 ? 0.95 : 1), t = 1.1 + baseR * 0.07;
    sim.hazards.push({ x: tp.x, z: tp.z, r, t, max: t, dmg: bossDmg(sim, def, 1.6), ...sim.pace >= 2 ? { by: e.id } : {} });
  } else if (kind === "charge") {
    const ux = dx / (d || 1), uz = dz / (d || 1);
    e.charge = { wind: 0.8, dash: 0.9, dx: ux, dz: uz };
    sim.fx.push({ k: "aim", id: e.id, x: e.x, z: e.z, a: datan2(ux, uz), len: e.speed * 3.4 * 0.9 + 2, t: 0.8 });
  } else if (kind === "volley") {
    const base = datan2(dx, dz), n = 5;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.22, sp = 8.5;
      sim.eproj.push({ id: sim.nextId++, x: e.x, z: e.z, vx: dsin(a) * sp, vz: dcos(a) * sp, r: 0.55, dmg: bossDmg(sim, def, 0.75), life: 3.2, art: def.shot || "fire" });
    }
    sim.fx.push({ k: "volley", x: e.x, z: e.z, art: def.shot || "fire" });
  }
  return null;
}
function stepBossAttacks(sim, dt) {
  for (const h of sim.hazards) {
    h.t -= dt;
    if (h.t <= 0) {
      h.done = true;
      sim.fx.push({ k: "slam", x: h.x, z: h.z, r: h.r, meteor: h.meteor ? 1 : 0 });
      for (const p of sim.players) if (p.alive && p.inv <= 0 && hyp(p.x - h.x, p.z - h.z) < h.r) hurtPlayer(sim, p, Math.max(1, h.dmg - playerStats(p).armor), h.meteor ? "meteor" : "slam");
    }
  }
  sim.hazards = sim.hazards.filter((h) => !h.done);
  for (const b of sim.eproj) {
    b.x += b.vx * dt;
    b.z += b.vz * dt;
    b.life -= dt;
    if (b.life <= 0 || !walkable(sim, b.x, b.z) && sim.ground && hyp(b.vx, b.vz) > 0) {
      b.dead = true;
      continue;
    }
    for (const p of sim.players) if (p.alive && p.inv <= 0 && hyp(p.x - b.x, p.z - b.z) < b.r + PLAYER_BASE.radius) {
      hurtPlayer(sim, p, Math.max(1, b.dmg - playerStats(p).armor), "volley");
      b.dead = true;
      break;
    }
  }
  sim.eproj = sim.eproj.filter((b) => !b.dead);
}
function step(sim, inputs = {}, dt = TICK) {
  if (sim.over) return;
  const pendIds = Object.keys(sim.pending);
  if (pendIds.length) {
    for (const id of pendIds) {
      const pend = sim.pending[id];
      pend.left -= dt;
      if (pend.left <= 0) choose(sim, id, autoChoice(pend));
    }
    return;
  }
  sim.t += dt;
  sim.tick++;
  for (const p of sim.players) {
    if (!p.alive) continue;
    const st = playerStats(p);
    const inp = inputs[p.id] || { mx: 0, mz: 0 };
    const len = hyp(inp.mx, inp.mz);
    if (sim.pace >= 2) {
      p.rollCd = Math.max(0, (p.rollCd || 0) - dt);
      if (p.rollCd < 1e-9) p.rollCd = 0;
      if (inp.use === 4 && p.rollCd === 0) {
        p.rollCd = TUMBLE.cooldown;
        p.rollT = TUMBLE.duration;
        p.rollFace = len > 0.01 ? datan2(inp.mx, inp.mz) : p.moveFace ?? p.face;
        sim.fx.push({ k: "land-hop", x: p.x, z: p.z });
      }
    }
    if (inp.use != null && !(sim.pace >= 2 && inp.use === 4)) useBelt(sim, p.id, inp.use);
    p.moving = len > 0.01 || sim.pace >= 2 && p.rollT > 1e-9;
    if (sim.pace >= 2 && p.rollT > 1e-9) {
      if (p.rollT === TUMBLE.duration || sim.players.length > 1) updateFlow(sim, p);
      if (p.rollT === TUMBLE.duration) p.rollFencePath = reachableFencePath(sim, p);
      const distance = TUMBLE.speed * Math.min(dt, p.rollT), parts = Math.ceil(distance / 0.5);
      const dx = dsin(p.rollFace) * distance / parts, dz = dcos(p.rollFace) * distance / parts;
      for (let i = 0; i < parts; i++) moveTo(sim, p, p.x + dx, p.z + dz, true, p.rollFencePath);
      p.face = p.moveFace = p.rollFace;
      p.rollT = Math.max(0, p.rollT - dt);
      if (p.rollT < 1e-9) p.rollT = 0;
    } else if (p.moving) {
      const mx = inp.mx / Math.max(1, len), mz = inp.mz / Math.max(1, len);
      moveTo(sim, p, p.x + mx * st.speed * dt, p.z + mz * st.speed * dt);
      p.face = datan2(mx, mz);
      if (sim.pace >= 2) p.moveFace = p.face;
    }
    const off = hyp(p.x - sim.map.cx, p.z - sim.map.cz);
    if (off > sim.map.r) {
      p.x = sim.map.cx + (p.x - sim.map.cx) * sim.map.r / off;
      p.z = sim.map.cz + (p.z - sim.map.cz) * sim.map.r / off;
    }
    p.inv = Math.max(0, p.inv - dt);
    p.hurt = Math.max(0, p.hurt - dt);
    for (const b of Object.keys(p.buffs)) p.buffs[b] = Math.max(0, p.buffs[b] - dt);
    if (!p.godMode) p.maxHp = st.maxHp;
    p.regen += st.regen * dt;
    if (p.regen >= 1) {
      p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.regen));
      p.regen %= 1;
    }
    (sim.crit || (sim.crit = {}))[p.id] = [st.critC, st.critM];
    fireWeapons(sim, p, dt, st);
  }
  sim.flowT -= dt;
  if (sim.flowT <= 0) {
    sim.flowT = 0.3;
    updateFlow(sim);
  }
  spawnTick(sim, dt);
  eventTick(sim, dt);
  shrineTick(sim, dt);
  merchantTick(sim, dt);
  const cell = 1.6, grid = /* @__PURE__ */ new Map();
  const key = (x, z) => Math.floor(x / cell) + 4096 << 13 | Math.floor(z / cell) + 4096;
  for (const e of sim.enemies) {
    if (sim.pace >= 2 && e.dead) continue;
    const k = key(e.x, e.z);
    (grid.get(k) || grid.set(k, []).get(k)).push(e);
  }
  for (const e of sim.enemies) {
    if (sim.pace >= 2 && e.dead) continue;
    const def = ENEMIES[e.type];
    const tp = nearestPlayer(sim, e.x, e.z);
    e.hit = Math.max(0, e.hit - dt);
    if (e.rise > 0) {
      e.rise -= dt;
      if (tp) e.face = datan2(tp.x - e.x, tp.z - e.z);
      continue;
    }
    if (tp) {
      const dx = tp.x - e.x, dz = tp.z - e.z, rawD = hyp(dx, dz), d = rawD || 1;
      const blockedApproach = sim.pace >= 2 && d <= Math.max(2.5, def.r + PLAYER_BASE.radius) && !clearPath(sim, e.x, e.z, tp.x, tp.z);
      const blockedSteering = blockedApproach || sim.pace >= 2 && d <= 2.5 && !clearPath(sim, e.x, e.z, tp.x, tp.z, true);
      let mx = dx / d * e.speed, mz = dz / d * e.speed;
      if (d > 2.5 || blockedSteering) {
        const fd = flowDir(sim, e.x, e.z);
        if (fd) {
          mx = fd[0] * e.speed;
          mz = fd[1] * e.speed;
        }
      }
      let bossMove = false;
      if (def.boss) {
        const m = bossAct(sim, e, def, tp, d, dx, dz, dt);
        if (m) {
          mx = m[0];
          mz = m[1];
          bossMove = true;
        }
      }
      if (e.treasure) {
        mx = -(dx / d) * e.speed;
        mz = -(dz / d) * e.speed;
      }
      if (sim.pace >= 2 && sim.tick <= 7200) {
        mx *= 1.05;
        mz *= 1.05;
      }
      const cx = Math.floor(e.x / cell), cz = Math.floor(e.z / cell);
      for (let ix = -1; ix <= 1; ix++) for (let iz = -1; iz <= 1; iz++) {
        const list = grid.get(cx + ix + 4096 << 13 | cz + iz + 4096);
        if (!list) continue;
        for (const o of list) {
          if (o === e || sim.pace >= 2 && o.dead) continue;
          const ox = e.x - o.x, oz = e.z - o.z, od = hyp(ox, oz);
          const min = (def.r + ENEMIES[o.type].r) * 0.85;
          if (od < min && od > 1e-3) {
            const push = (min - od) / min;
            mx += ox / od * push * 4;
            mz += oz / od * push * 4;
          }
        }
      }
      const oldX = e.x, oldZ = e.z;
      let keepDistance = 0, escape = 0;
      const stop = (def.r + PLAYER_BASE.radius) * 0.95;
      if (sim.pace >= 2 && !bossMove && !e.treasure && !blockedApproach && (!blockedSteering || rawD < stop)) {
        if (rawD < stop + (Math.abs(mx + e.kx) + Math.abs(mz + e.kz)) * dt) {
          const angle = e.id % 16 * Math.PI / 8, ux = rawD ? dx / rawD : dsin(angle), uz = rawD ? dz / rawD : dcos(angle);
          const limit = rawD < stop ? -Math.min(e.speed, (stop - rawD) / dt) : (rawD - stop) / dt;
          const inward = (mx + e.kx) * ux + (mz + e.kz) * uz;
          if (inward > limit) {
            mx -= ux * (inward - limit);
            mz -= uz * (inward - limit);
          }
          keepDistance = Math.min(stop, rawD);
          escape = Math.max(0, Math.min(e.speed * dt, stop - rawD));
        }
      }
      moveTo(sim, e, oldX + (mx + e.kx) * dt, oldZ + (mz + e.kz) * dt);
      if (keepDistance && hyp(e.x - tp.x, e.z - tp.z) < keepDistance - 1e-9) {
        e.x = oldX;
        e.z = oldZ;
        moveTo(sim, e, oldX, oldZ + (mz + e.kz) * dt);
        if (hyp(e.x - tp.x, e.z - tp.z) < keepDistance - 1e-9) {
          e.x = oldX;
          e.z = oldZ;
        }
      }
      if (escape && hyp(e.x - tp.x, e.z - tp.z) <= rawD + 1e-9) {
        let bestX = e.x, bestZ = e.z, bestD = hyp(e.x - tp.x, e.z - tp.z);
        for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          e.x = oldX;
          e.z = oldZ;
          moveTo(sim, e, oldX + sx * escape, oldZ + sz * escape);
          const candidate = hyp(e.x - tp.x, e.z - tp.z);
          if (candidate > bestD + 1e-9) {
            bestD = candidate;
            bestX = e.x;
            bestZ = e.z;
          }
        }
        e.x = bestX;
        e.z = bestZ;
      }
      e.kx *= 0.86;
      e.kz *= 0.86;
      e.face = datan2(dx, dz);
      if ((sim.pace >= 2 ? rawD : d) < def.r + PLAYER_BASE.radius && tp.inv <= 0 && !e.treasure && !blockedApproach) {
        const st = playerStats(tp);
        const dmg = Math.max(1, Math.round(def.dmg * 0.85 * (sim.t < 120 ? sim.pace >= 2 ? 0.8 : 0.7 : 1) * (1 + sim.t / (sim.pace >= 2 ? 750 : 1200)) * (sim.pace >= 2 ? sim.vet * (1 + CURSE.dmg * (sim.curse || 0)) : 1) * (sim.hard ? 1.35 : 1) * (def.boss ? 0.8 : 1) * (e.charge && e.charge.dash > 0 ? 1.5 : 1) * (e.elite ? 1.4 : 1) - st.armor));
        hurtPlayer(sim, tp, dmg, def.boss ? "boss-contact" : "contact");
        if (st.thorns > 0) {
          sim.src = "thorns";
          damageEnemy(sim, e, st.thorns * (1 + sim.t / 600), tp.id, 2.2, tp.x, tp.z);
        }
      }
    }
  }
  stepProjectiles(sim, dt);
  stepBossAttacks(sim, dt);
  sim.enemies = sim.enemies.filter((e) => !e.dead);
  recycleStrays(sim, dt);
  for (const g of sim.gems) {
    const p = nearestPlayer(sim, g.x, g.z);
    if (!p) continue;
    const st = playerStats(p), d = hyp(p.x - g.x, p.z - g.z);
    if (d < st.magnet || g.pulled) {
      g.pulled = true;
      const sp = 11 + (sim.pace >= 2 ? Math.abs(st.magnet - d) : st.magnet - d) * 0.5;
      g.x += (p.x - g.x) / (d || 1) * sp * dt;
      g.z += (p.z - g.z) / (d || 1) * sp * dt;
    }
    if (d < 0.8) {
      g.taken = true;
      gainXp(sim, g.v * st.growth);
    }
  }
  sim.gems = sim.gems.filter((g) => !g.taken);
  for (const k of sim.pickups) {
    const p = nearestPlayer(sim, k.x, k.z);
    if (p && k.kind === "coin" && !k.pulled && hyp(p.x - k.x, p.z - k.z) < playerStats(p).magnet) k.pulled = true;
    if (k.pulled && p) {
      const d = hyp(p.x - k.x, p.z - k.z) || 1;
      k.x += (p.x - k.x) / d * 12 * dt;
      k.z += (p.z - k.z) / d * 12 * dt;
    }
    if (p && hyp(p.x - k.x, p.z - k.z) < 1.1) {
      if (k.kind === "chest" && sim.pending[p.id]) continue;
      k.taken = true;
      const st = playerStats(p), beforeHp = p.hp;
      if (BELT_KINDS.includes(k.kind) && p.belt.length < BELT_SIZE) p.belt.push(k.kind);
      else if (BELT_KINDS.includes(k.kind) || FOOD[k.kind]) useItem(sim, p, k.kind);
      else if (k.kind === "chest") {
        for (const member of sim.coop ? sim.players.filter((p2) => p2.alive) : [p]) if (!sim.pending[member.id]) sim.pending[member.id] = { choices: rollChoices(sim, member), left: 25 };
      } else if (k.kind === "casket") {
        for (const member of sim.coop ? sim.players.filter((p2) => p2.alive) : [p]) gotCasket(sim, member, rollCasket(sim.rng, sim.casketRank, sim.hard, sim.t, { pace: sim.pace, weapons: member.weapons }));
      } else p.coins++;
      sim.fx.push({ k: "get", kind: k.kind, x: k.x, z: k.z, ...sim.pace >= 2 && FOOD[k.kind] ? { heal: Math.max(0, p.hp - beforeHp) } : {} });
    }
  }
  sim.pickups = sim.pickups.filter((k) => !k.taken);
  if (sim.players.every((p) => !p.alive)) sim.over = "dead";
  else if (sim.t >= sim.map.length && !sim.endless) sim.over = "win";
  else if (sim.endAt && sim.t >= sim.endAt) sim.over = "time";
  for (const p of sim.players) openCasket(sim, p);
}

// src/ranked.js
var RANKED = {
  pauseSeconds: 30 * 60,
  // total wall-clock slack per run, shared across pauses, choices and reloads
  entryDmt: "0.5",
  // legacy defaults; current prices use raceForWeek(week, mode)
  // Historical race definitions stay available for signed payments, replays and settlement.
  races: {
    normal: { name: "Normal", entryDmt: "0.5", entryWei: "500000000000000000", hard: false },
    hard: { name: "Hard", entryDmt: "1.5", entryWei: "1500000000000000000", hard: true }
  },
  houseShare: 0.1,
  // to the house wallet; the rest is the race's prize pool
  payouts: [0.4, 0.25, 0.15, 0.12, 0.08],
  // of a race's prize pool, to its week's top 5 wallets
  maxEntriesPerWallet: 1e6,
  // no real cap (owner 3 Nov: "let people play as much as they want, we want volume"); the SQL takes a number
  weekEpoch: Date.UTC(2026, 10, 2),
  // a Monday, 00:00 UTC: weeks run Monday to Sunday (UTC)
  // From this week on runs are scored by kills plus whole seconds survived; the Hard race exists historically. Runs are endless from this build on
  // (owner 2 Nov: "ranked should be endless mode from now on"), so week 0 ranks by time survived, then kills; its earlier
  // 15:00 runs replay on their own version. tools/supabase/*.sql and the payout bot use the same switch.
  kpmWeek: 1,
  minSeconds: 180,
  // a week1+ run must last 3:00 to place (shorter runs are listed as too short)
  timeLimit: 2 * 3600,
  // owner 2 Nov: "no 45 mins cap, can go 2 hours": the run stops here with its score counted
  maps: MAPS.filter((m) => !m.special).map((m) => m.id),
  // one map per week, in turn
  advs: ADVENTURERS.filter((a) => !a.special).map((a) => a.id)
  // every regular adventurer is open in ranked
};
var weekOf = (ms = Date.now()) => Math.floor((ms - RANKED.weekEpoch) / (7 * 24 * 3600 * 1e3));
var weekStart = (w) => RANKED.weekEpoch + w * 7 * 24 * 3600 * 1e3;
var weekMap = (w) => w === 1 ? "apache" : RANKED.maps[(w % RANKED.maps.length + RANKED.maps.length) % RANKED.maps.length];
function raceForWeek(week, mode = "normal") {
  if (!Object.hasOwn(RANKED.races, mode)) return null;
  const race = RANKED.races[mode];
  return week >= 1 ? { ...race, entryDmt: mode === "hard" ? "2" : "1", entryWei: mode === "hard" ? "2000000000000000000" : "1000000000000000000" } : race;
}
var kpmWeek = (w) => Number.isInteger(w) && w >= RANKED.kpmWeek;
var racesOf = (w) => kpmWeek(w) ? ["normal", "hard"] : ["normal"];
var entryRacesOf = () => ["normal"];
var isRace = (w, mode) => racesOf(w).includes(mode);
var runSeconds = () => RANKED.timeLimit + 60;
function rankedPoints(kills, t) {
  const k = Number(kills), s = Number(t);
  return (Number.isFinite(k) ? Math.max(0, Math.floor(k)) : 0) + (Number.isFinite(s) ? Math.max(0, Math.floor(s)) : 0);
}
var PID = "p1";
function rankedSim({ seed, mapId, adv, ground, week, mode = "normal" } = {}) {
  const a = Object.hasOwn(ADVENTURER_BY_ID, adv) ? ADVENTURER_BY_ID[adv] : null;
  if (!a || a.special || !Object.hasOwn(MAP_BY_ID, mapId) || !Number.isInteger(week) || !isRace(week, mode)) throw new Error("bad ranked run");
  const endless = true;
  return createSim({
    seed,
    map: MAP_BY_ID[mapId],
    hard: mode === "hard",
    endless,
    endAt: endless ? RANKED.timeLimit : 0,
    meta: {},
    ground,
    pace: kpmWeek(week) ? 2 : 1,
    ranked: true,
    players: [{ id: PID, name: "You", adv, weapon: a.weapon, gear: {}, gearLv: {} }]
  });
}
function replay(log, params, { maxTicks = Math.ceil(runSeconds(params?.week) * 30), allowPartial = false } = {}) {
  if (!log || log.v !== 1 || !Array.isArray(log.runs) || !Array.isArray(log.uses) || !Array.isArray(log.picks)) return { error: "bad log" };
  let total = 0;
  for (const r of log.runs) {
    if (!Array.isArray(r) || r.length !== 3) return { error: "bad input" };
    const [count, x, z] = r;
    if (!Number.isInteger(count) || count < 1 || !Number.isInteger(x) || !Number.isInteger(z) || Math.abs(x) > 100 || Math.abs(z) > 100) return { error: "bad input" };
    total += count;
    if (total > maxTicks) return { error: "run too long" };
  }
  for (const u of log.uses) if (!Array.isArray(u) || u.length !== 2 || !Number.isInteger(u[0]) || !Number.isInteger(u[1]) || u[1] < 0 || u[1] > 4) return { error: "bad item use" };
  let sim;
  try {
    sim = rankedSim(params);
  } catch {
    return { error: "bad ranked run" };
  }
  let pi = 0, ui = 0, tick = 0;
  const resolve = (partial = false) => {
    let guard = 0;
    while (sim.pending[PID]) {
      if (sim.pace < 2 && guard++ > 60) return "too many choices";
      if (partial && pi === log.picks.length) return null;
      const a = log.picks[pi++];
      if (a === void 0) return "missing a level-up choice";
      if (a === "r") {
        if (!reroll(sim, PID)) return "reroll not allowed";
      } else if (a === "s") {
        if (!skipLevel(sim, PID)) return "skip not allowed";
      } else if (typeof a === "string" && /^b[0-2]$/.test(a)) {
        if (!banish(sim, PID, Number(a[1]))) return "banish not allowed";
      } else if (a === "a") choose(sim, PID, autoChoice(sim.pending[PID]));
      else if (a === 0 || a === 1 || a === 2) {
        if (!sim.pending[PID].choices[a]) return "no such choice";
        if (!choose(sim, PID, a)) return "choice not allowed";
      } else return "bad choice";
    }
    return null;
  };
  for (const r of log.runs) {
    if (!Array.isArray(r) || r.length !== 3) return { error: "bad input" };
    const [count, x, z] = r;
    if (!Number.isInteger(count) || count < 1 || !Number.isInteger(x) || !Number.isInteger(z) || Math.abs(x) > 100 || Math.abs(z) > 100) return { error: "bad input" };
    for (let k = 0; k < count; k++) {
      if (sim.over) return { error: "inputs after the run ended" };
      const err2 = resolve();
      if (err2) return { error: err2 };
      let use = null;
      if (ui < log.uses.length && log.uses[ui][0] === tick) {
        use = log.uses[ui][1];
        ui++;
        if (!Number.isInteger(use) || use < 0 || use > 4) return { error: "bad item use" };
      }
      const before = sim.tick;
      step(sim, { [PID]: { mx: x / 100, mz: z / 100, use } }, TICK);
      if (sim.tick === before) return { error: "a step did not run" };
      tick++;
      sim.fx.length = 0;
      if (tick > maxTicks) return { error: "run too long" };
    }
  }
  const err = resolve(allowPartial);
  if (err && !sim.over) return { error: err };
  if (ui !== log.uses.length) return { error: "item uses out of order" };
  if (!sim.over && !allowPartial) return { error: "the run had not ended" };
  return { t: Math.floor(sim.t), kills: sim.kills, level: sim.level, won: sim.over === "win", timeUp: sim.over === "time", ticks: tick, picksUsed: pi };
}

// src/prize-display.js
var amount = (value) => typeof value === "string" && /^(0|[1-9]\d{0,77})$/.test(value) && BigInt(value) < 1n << 256n ? BigInt(value) : null;
function dmtText(value) {
  const n = amount(value);
  if (n === null) return "\u2014";
  return `${n / 10n ** 18n}.${(n % 10n ** 18n).toString().padStart(18, "0")}`.replace(/\.?0+$/, "");
}

// src/ranked-clock.js
var CLOSE_MS = 18e5;
var UPLOAD_MS = 3e5;
var IDLE_MS = 3e4;
function clockPolicy(week, now = Date.now()) {
  const deadline = weekStart(week + 1), closesAt = deadline - CLOSE_MS;
  return { deadline, closesAt, admissionOpen: now < closesAt, remainingMs: Math.max(0, deadline - now) };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CLOSE_MS,
  IDLE_MS,
  RANKED,
  UPLOAD_MS,
  clockPolicy,
  dmtText,
  entryRacesOf,
  groundHash,
  kpmWeek,
  raceForWeek,
  racesOf,
  rankedPoints,
  replay,
  runSeconds,
  unpackGround,
  weekMap,
  weekOf,
  weekStart
});
