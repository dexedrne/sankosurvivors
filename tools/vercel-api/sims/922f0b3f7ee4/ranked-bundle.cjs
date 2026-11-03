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
  RANKED: () => RANKED,
  groundHash: () => groundHash,
  kpmWeek: () => kpmWeek,
  racesOf: () => racesOf,
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
var MAX_WEAPON_LEVEL = 6;
var MAX_PASSIVE_LEVEL = 5;
var MAX_WEAPONS = 4;
var MAX_PASSIVES = 4;
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
  mslimer: { name: "Mutant Slimer", model: "mobs/snail/mutant slimer.glb", h: 2.1, r: 1.5, hp: 260, speed: 2.6, dmg: 22, xp: 15, walk: "walk", idle: "walk" },
  // bosses
  giant: { name: "Lesser Giant", model: "mobs/giant.glb", h: 3.9, r: 1.6, hp: 900, speed: 2.2, dmg: 28, xp: 60, walk: "walk", idle: "idle", boss: true, attacks: ["slam"] },
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
    name: "Shard Staff",
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
  greed: { name: "Rusty Key", item: "Rusty Key", blurb: "+15% coins and more reward caskets per level." }
};
var ARMOR_TIERS = ["Bronze", "Iron", "Steel", "Mithril", "Adamantite", "Runite"];
var PASSIVE_IDS = Object.keys(PASSIVES);
var EVOLUTIONS = {
  katana: { passive: "might", name: "Shadowfang Axe", item: "Shadowfang Axe", blurb: "Spins a full circle, hits harder, and heals on every hit." },
  bow: { passive: "boots", name: "Glacial Bow", item: "Glacial Bow", blurb: "Volleys of arrows that pierce everything." },
  axe: { passive: "vigor", name: "Runite Axe Storm", item: "Runite Axe", blurb: "Twice the axes, bigger and heavier." },
  shield: { passive: "armor", name: "Ogre Shield", item: "Ogre Shield", blurb: "More shields, wider orbit, brutal knockback." },
  staff: { passive: "growth", name: "Void Staff", item: "Void Shard", blurb: "More bolts that burst in huge blasts." },
  pickaxe: { passive: "haste", name: "Earthshaker", item: "Earth Shard", blurb: "Faster, wider quakes." },
  greatsword: { passive: "vigor", name: "Bloodspinner", item: "Adamantite 2hd Sword", blurb: "Spins twice as often, wider, and heals you with every spin." },
  shortsword: { passive: "magnet", name: "Swordstorm", item: "Adamantite Short Sword", blurb: "A ring of swords in every direction that pierces everything." },
  baseball: { passive: "amount", name: "Home Run", item: "Baseball", blurb: "Two balls at once that bounce eight times and knock monsters flying." },
  lighter: { passive: "crit", name: "Inferno", item: "Fire Shard", blurb: "A wide blazing ring that burns twice as hard." }
};
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
    cx: 243,
    cz: 106,
    r: 1e3,
    sky: 13623536,
    fog: 13623536,
    light: 1,
    music: "boss",
    length: RUN_LENGTH,
    finalBoss: "dragon",
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
    finalBoss: "ogre",
    pool: [P(0, "chicken", 6), P(0, "cow", 3), P(30, "goblin", 5), P(90, "dog", 3), P(150, "fox", 3), P(240, "spider", 4), P(330, "skeleton", 4), P(420, "wolf", 3), P(500, "jspider", 3)],
    retire: { chicken: 200, cow: 260 },
    bosses: [{ t: 240, type: "giant" }, { t: 480, type: "ogre" }]
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
Object.assign(GEAR, {
  "Ogre Shield": { slot: "offhand", tier: 4, rarity: "unique", model: "equipment/offhand/shield/ogre_shield.glb", bonus: { armor: 1.2, hp: 25 } },
  "Ranger Helmet": { slot: "head", set: "Ranger", tier: 2, bonus: { dmg: 0.03, magnet: 0.06 } },
  "Ranger Chestplate": { slot: "chest", set: "Ranger", tier: 2, bonus: { dmg: 0.03, armor: 0.2 } },
  "Ranger Gauntlets": { slot: "hands", set: "Ranger", tier: 2, bonus: { dmg: 0.03 } },
  "Ranger Leggings": { slot: "legs", set: "Ranger", tier: 2, bonus: { dmg: 0.03, speed: 0.02 } },
  "Ranger Boots": { slot: "feet", set: "Ranger", tier: 2, bonus: { dmg: 0.03, speed: 0.02 } },
  "Wizard Hat": { slot: "head", set: "Wizard", tier: 1, bonus: { growth: 0.05 } },
  "Wizard Robe": { slot: "chest", set: "Wizard", tier: 1, bonus: { growth: 0.05, hp: 5 } },
  "Wizard Skirt": { slot: "legs", set: "Wizard", tier: 1, bonus: { growth: 0.05 } },
  "Shape Wizard Hat": { slot: "head", set: "Shape", tier: 3, bonus: { haste: 0.03 } },
  "Shape Robe": { slot: "chest", set: "Shape", tier: 3, bonus: { haste: 0.03, hp: 5 } },
  "Shape Skirt": { slot: "legs", set: "Shape", tier: 3, bonus: { haste: 0.03 } },
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
  Bronze: { pieces: 5, bonus: { hp: 15 }, text: "+15 max HP" },
  Iron: { pieces: 5, bonus: { hp: 20 }, text: "+20 max HP" },
  Steel: { pieces: 5, bonus: { hp: 25, armor: 0.5 }, text: "+25 max HP, +0.5 armor" },
  Mithril: { pieces: 5, bonus: { hp: 30, speed: 0.04 }, text: "+30 max HP, +4% speed" },
  Adamantite: { pieces: 5, bonus: { hp: 40, armor: 1 }, text: "+40 max HP, +1 armor" },
  Runite: { pieces: 5, bonus: { hp: 50, armor: 1.5, dmg: 0.05 }, text: "+50 max HP, +1.5 armor, +5% damage" }
};
var GEAR_MAX_LV = 3;
function gearBonus(gear = {}, levels = {}) {
  const out = {};
  const add = (b, m = 1) => {
    for (const [k, v] of Object.entries(b)) out[k] = (out[k] || 0) + v * m;
  };
  const sets = {};
  for (const name of Object.values(gear)) {
    if (!Object.hasOwn(GEAR, name)) continue;
    const g = GEAR[name];
    add(g.bonus, 1 + 0.25 * Math.min(GEAR_MAX_LV, levels[name] || 0));
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
var gearRarity = (name) => GEAR[name].rarity || (ARMOR_TIERS.includes(GEAR[name].set) || / (Kite)?[Ss]hield$/.test(name) ? "common" : "rare");
var ALCH_BY_TIER = [25, 35, 50, 70, 100, 150];
var ALCH_RARITY = { common: 1, rare: 1.5, unique: 2 };
var ALCH_PIECE = (name) => /Chestplate$|Robe$/.test(name) ? 1.5 : /Leggings$|Skirt$|Kiteshield$/.test(name) ? 1.25 : 1;
function alchValue(name) {
  const g = GEAR[name];
  if (!g) return 0;
  return Math.round(ALCH_BY_TIER[Math.min(g.tier, ALCH_BY_TIER.length - 1)] * ALCH_RARITY[gearRarity(name)] * ALCH_PIECE(name) / 5) * 5;
}
var GEAR_SCORE_W = { armor: 10, dmg: 100, haste: 100, speed: 80, magnet: 25, growth: 50, hp: 0.4, regen: 12, coin: 6 };
function gearScore(b) {
  let s = 0;
  for (const [k, v] of Object.entries(b)) if (GEAR_SCORE_W[k]) s += GEAR_SCORE_W[k] * v;
  return s;
}
function compareGear(gear = {}, levels = {}, item) {
  const g = GEAR[item], slot = g.slot, old = gear[slot] || null;
  const before = gearBonus(gear, levels), after = gearBonus({ ...gear, [slot]: item }, levels);
  const delta = {};
  for (const k of /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (k === "sets") continue;
    const d = Math.round(((after[k] || 0) - (before[k] || 0)) * 1e3) / 1e3;
    if (d) delta[k] = d;
  }
  const sb = gearScore(before), sa = gearScore(after);
  const set = g.set && GEAR_SETS[g.set] ? { name: g.set, have: Object.values({ ...gear, [slot]: item }).filter((n) => GEAR[n] && GEAR[n].set === g.set).length, need: GEAR_SETS[g.set].pieces } : null;
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
function casketWeights(rank = 0, hard = false, t = 0) {
  const reach = 1 + rank + (hard ? 1 : 0);
  let top = Math.min(4, reach + (t >= 360 ? 1 : 0));
  if (t < 120) top = Math.min(top, 1 + (hard ? 1 : 0));
  const late = Math.max(0, Math.min(1, t / 900));
  const lift = late + (hard ? 0.5 : 0);
  const runite = t >= 480 && reach >= 3;
  const out = [];
  for (const [n, g] of Object.entries(GEAR)) {
    const base = ARMOR_TIERS.includes(g.set) ? 3 : g.slot === "offhand" && g.rarity !== "unique" ? 2 : 1.4;
    if (g.tier === 5) {
      if (runite) out.push([n, base * 0.25 * (1 + lift)]);
      continue;
    }
    if (g.tier > top) continue;
    out.push([n, base * (1 + top - g.tier + lift * g.tier)]);
  }
  return out;
}
function rollCasket(rng, rank = 0, hard = false, t = 0) {
  const list = casketWeights(rank, hard, t);
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
function createSim({ seed = 1, players = [{ id: "p1", name: "Adventurer" }], startWeapon = "katana", map = MAPS[0], hard = false, meta = {}, ground = null, endless = false, endAt = 0 } = {}) {
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
    t: 0,
    tick: 0,
    nextId: 1,
    mapIndex: Math.max(0, MAPS.findIndex((m) => m.id === map.id)),
    casketRank: casketRank(map),
    killsByType: {},
    bossKills: 0,
    evolves: 0,
    loot: [],
    alched: [],
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
      meta,
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
      gb: gearBonus(p.gear || {}, p.gearLv || {}),
      rerolls: REROLLS_PER_RUN,
      belt: [],
      casketQ: [],
      alch: 0
      // reward caskets waiting for Wear or High alch; coins from high alching this run
    });
  });
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
function noWall(sim, x0, z0, x1, z1) {
  const g = sim.ground;
  if (!g || !g.walls || !g.cell) return true;
  const W = g.walls, n = g.n;
  if (!crossOK(W, n, x0, z0, x1, z1)) return false;
  const sx = Math.sign(x1 - x0), sz = Math.sign(z1 - z0);
  if (sx && !crossOK(W, n, x1, z1, x1 + sx * WALL_GAP, z1)) return false;
  if (sz && !crossOK(W, n, x1, z1, x1, z1 + sz * WALL_GAP)) return false;
  return true;
}
function moveTo(sim, o, nx, nz) {
  if (walkable(sim, nx, nz) && noWall(sim, o.x, o.z, nx, nz)) {
    o.x = nx;
    o.z = nz;
    return;
  }
  if (walkable(sim, nx, o.z) && noWall(sim, o.x, o.z, nx, o.z)) {
    o.x = nx;
    return;
  }
  if (walkable(sim, o.x, nz) && noWall(sim, o.x, o.z, o.x, nz)) o.z = nz;
}
var FLOW_R = 60;
var FLOW_W = FLOW_R * 2 + 1;
var FLOW_NONE = 65535;
function updateFlow(sim) {
  const g = sim.ground;
  if (!g) {
    sim.flow = null;
    return;
  }
  const alive = sim.players.filter((p) => p.alive);
  if (!alive.length) return;
  const x0 = gIdx(g, alive[0].x) - FLOW_R, z0 = gIdx(g, alive[0].z) - FLOW_R;
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
      if (g.walls && g.cell && !stepOK(g.walls, g.n, i + x0, j + z0, wi, wj)) continue;
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
    const d = f.dist[(j + b) * FLOW_W + i + a] + (a && b ? 0.4 : 0);
    if (d < best) {
      best = d;
      bx = a;
      bz = b;
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
  const might = 1 + 0.12 * passiveLevel(p, "might") + 0.04 * m("combat") + (B.dmg || 0) + (G.dmg || 0);
  const haste = Math.max(0.3, 1 - 0.07 * passiveLevel(p, "haste") - 0.03 * m("fletching") - (B.haste || 0) - (G.haste || 0));
  return {
    might,
    haste,
    speed: PLAYER_BASE.speed * (1 + 0.08 * passiveLevel(p, "boots") + 0.03 * m("woodcutting") + (B.speed || 0) + (G.speed || 0)) * (p.buffs && p.buffs.speed > 0 ? 1.35 : 1) * (p.buffs && p.buffs.chill > 0 ? 0.9 : 1),
    // beer speeds you up, a blizzard slows you
    magnet: PLAYER_BASE.magnet * (1 + 0.3 * passiveLevel(p, "magnet") + 0.1 * m("magic") + (B.magnet || 0) + (G.magnet || 0)),
    armor: passiveLevel(p, "armor") + (B.armor || 0) + (G.armor || 0) + (m("mining") >= 2 ? 1 : 0) + (m("mining") >= 4 ? 1 : 0),
    growth: 1 + 0.1 * passiveLevel(p, "growth") + 0.05 * m("herblore") + (B.growth || 0) + (G.growth || 0),
    maxHp: Math.round(PLAYER_BASE.hp + 20 * passiveLevel(p, "vigor") + 8 * m("smithing") + (B.hp || 0) + (G.hp || 0)),
    regen: 0.15 * passiveLevel(p, "vigor") + 0.1 * m("cooking") + (G.regen || 0),
    coin: 1 + (G.coin || 0) + 0.15 * passiveLevel(p, "greed"),
    luck: 1 + 0.15 * m("luck"),
    casket: (1 + 0.25 * passiveLevel(p, "greed")) * (1 + 0.15 * m("luck")),
    coinBonus: 1 + 0.1 * m("coins"),
    weaponSlots: MAX_WEAPONS + m("strength"),
    passiveSlots: MAX_PASSIVES + m("prayer"),
    projectileSpeed: 1 + 0.1 * m("projectileSpeed"),
    rerolls: REROLLS_PER_RUN + m("rerolls"),
    revives: m("revive"),
    area: 1 + 0.1 * passiveLevel(p, "area") + 0.05 * m("area"),
    amount: m("amount") + (passiveLevel(p, "amount") >= 1 ? 1 : 0) + (passiveLevel(p, "amount") >= 4 ? 1 : 0),
    reach: 1 + 0.06 * passiveLevel(p, "amount"),
    // Feather: projectiles fly a little farther every level
    critC: 0.08 + 0.05 * passiveLevel(p, "crit"),
    critM: 1.8 + 0.1 * passiveLevel(p, "crit"),
    thorns: 8 * passiveLevel(p, "thorns"),
    heal: 1 + 0.12 * m("fishing")
  };
}
function nearestEnemy(sim, x, z, maxD = 1e9, skip) {
  let best = null, bd = maxD * maxD;
  for (const e of sim.enemies) {
    if (skip && skip.has(e.id)) continue;
    const dx = e.x - x, dz = e.z - z, d = dx * dx + dz * dz;
    if (d < bd) {
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
function damageEnemy(sim, e, amount, owner, kb = 0, fromX = 0, fromZ = 0) {
  if (e.dead) return;
  const cr = sim.crit && sim.crit[owner] || [0.08, 1.8];
  const crit = sim.rng() < cr[0];
  const dmg = Math.max(1, Math.round(amount * (crit ? cr[1] : 1)));
  e.hp -= dmg;
  e.hit = 0.12;
  const src = sim.src || "other";
  sim.dmgBy[src] = (sim.dmgBy[src] || 0) + dmg;
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
  sim.gems.push({ id: sim.nextId++, x: e.x, z: e.z, v: def.xp, vx: 0, vz: 0 });
  sim.fx.push({ k: "die", x: e.x, z: e.z, boss: def.boss ? 1 : 0, elite: e.elite ? 1 : 0 });
  if (!def.boss) {
    const r = sim.rng(), drop = (kind) => sim.pickups.push({ id: sim.nextId++, x: e.x, z: e.z, kind });
    if (r < 0.01) drop("beer");
    else if (r < 0.016) drop("pumpkin");
    else if (r < 0.022) drop("warp");
    else if (r < 0.034) drop(foodDrop(sim.t, (r - 0.022) / 0.012, e.elite));
    if (sim.rng() < 0.05 * (p ? playerStats(p).coin : 1)) drop("coin");
    if (sim.rng() < 15e-4 * (p ? playerStats(p).casket : 1) || e.elite) drop("casket");
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
  const t = sim.t;
  const hp = def.hp * (1 + t / 300) * (1 + 0.55 * (sim.spawnCount - 1)) * scaleHp * (sim.hard ? 1.7 : 1);
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
    sim.endlessBossT -= dt;
    if (sim.endlessBossT <= 0 && M.bosses.length) {
      sim.endlessBossT = 90;
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
  const cap = 75 + 70 * (sim.spawnCount - 1) + 155 * progress * progress;
  const rate = (1.05 + 1.6 * progress + 6.4 * progress * progress + Math.max(0, t - M.length) / 92) * (0.7 + 0.45 * sim.spawnCount) * (sim.hard ? 1.35 : 1);
  sim.spawnAcc += rate * dt;
  if (sim.event && sim.event.kind === "duel") sim.spawnAcc = Math.min(sim.spawnAcc, 0.5);
  const R = M.world ? regionOf(sim, sim.players.find((p) => p.alive) || sim.players[0]) : M;
  if (M.world && R.id !== sim.region) {
    sim.region = R.id;
    sim.fx.push({ k: "region", id: R.id });
  }
  const pool = R.pool.filter((s) => t >= s.t && !(R.retire && R.retire[s.type] && t >= R.retire[s.type]));
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
    const a = ahead ? anchor.face + (sim.rng() - 0.5) * 1.6 : sim.rng() * 6.283, d = 26 + sim.rng() * 8;
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
    if ((p.weapons[id] || 0) >= MAX_WEAPON_LEVEL && !p.evo[id] && (p.passives[EVOLUTIONS[id].passive] || 0) >= 1) opts.push({ kind: "evolve", id, level: 1, w: 1e3 });
  }
  for (const id of WEAPON_IDS) {
    const lvl = p.weapons[id] || 0;
    if (lvl >= MAX_WEAPON_LEVEL) continue;
    if (!lvl && Object.keys(p.weapons).length >= st.weaponSlots) continue;
    opts.push({ kind: "weapon", id, level: lvl + 1, w: lvl ? 3 : 2 });
  }
  for (const id of PASSIVE_IDS) {
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
  if (!out.length) out.push({ kind: "heal", id: "fish", level: 1 });
  return out.map(({ kind, id, level }) => ({ kind, id, level }));
}
function applyChoice(sim, p, choice) {
  if (choice.kind === "evolve") {
    p.evo[choice.id] = true;
    sim.evolves++;
    sim.fx.push({ k: "evolve", id: choice.id });
    return;
  }
  if (choice.kind === "weapon") p.weapons[choice.id] = Math.min(MAX_WEAPON_LEVEL, (p.weapons[choice.id] || 0) + 1);
  else if (choice.kind === "passive") {
    p.passives[choice.id] = Math.min(MAX_PASSIVE_LEVEL, (p.passives[choice.id] || 0) + 1);
    const st = playerStats(p);
    if (!p.godMode) {
      const gain = st.maxHp - p.maxHp;
      p.maxHp = st.maxHp;
      p.hp = Math.min(p.maxHp, p.hp + Math.max(0, gain));
    }
  } else p.hp = Math.min(p.maxHp, p.hp + 40 * playerStats(p).heal);
}
function choose(sim, playerId, index) {
  const pend = sim.pending[playerId];
  const p = sim.players.find((q) => q.id === playerId);
  if (!pend || !p) return false;
  const c = pend.choices[index] || pend.choices[0];
  if (pend.casket) applyCasket(sim, p, c);
  else applyChoice(sim, p, c);
  delete sim.pending[playerId];
  sim.fx.push({ k: "pick", id: playerId });
  openCasket(sim, p);
  return true;
}
function autoChoice(pend) {
  return pend && pend.casket ? pend.rec : 0;
}
function wearItem(p, item) {
  const before = p.maxHp;
  p.gear = { ...p.gear, [GEAR[item].slot]: item };
  p.gb = gearBonus(p.gear, p.gearLv || {});
  if (!p.godMode) {
    const m = playerStats(p).maxHp;
    p.maxHp = m;
    p.hp = Math.min(m, p.hp + Math.max(0, m - before));
  }
}
function gotCasket(sim, p, item) {
  sim.loot.push(item);
  if (!p.gear[GEAR[item].slot]) {
    wearItem(p, item);
    sim.fx.push({ k: "casket", item, worn: 1 });
    return;
  }
  p.casketQ.push(item);
  sim.fx.push({ k: "casket", item, worn: 0, queued: 1 });
}
function openCasket(sim, p) {
  if (!p || !p.alive || sim.pending[p.id] || !p.casketQ.length || sim.over) return false;
  const item = p.casketQ.shift();
  const card = compareGear(p.gear, p.gearLv || {}, item);
  const rec = card.better ? 0 : 1;
  sim.pending[p.id] = { casket: card, choices: [{ kind: "wear", id: item, level: 1 }, { kind: "alch", id: item, level: card.alch }], rec, more: p.casketQ.length, left: 30 };
  return true;
}
function applyCasket(sim, p, c) {
  if (c.kind === "wear") {
    const old = p.gear[GEAR[c.id].slot] || null;
    wearItem(p, c.id);
    sim.fx.push({ k: "casket", item: c.id, worn: 1, old });
  } else {
    p.alch += c.level;
    sim.alched.push(c.id);
    sim.fx.push({ k: "alch", item: c.id, coins: c.level });
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
  return true;
}
function gainXp(sim, amount) {
  sim.xp += amount;
  while (sim.xp >= sim.xpNeed) {
    sim.xp -= sim.xpNeed;
    sim.level++;
    sim.xpNeed = xpForLevel(sim.level);
    for (const p of sim.players) if (p.alive && !sim.pending[p.id]) sim.pending[p.id] = { choices: rollChoices(sim, p), left: 20 };
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
function fireWeapons(sim, p, dt, st) {
  p.orbit += dt;
  for (const id of Object.keys(p.weapons)) {
    const lvl = p.weapons[id];
    let s = WEAPONS[id].stats(lvl);
    if (p.evo[id]) s = evolveStats(id, s);
    s = withPassives(id, s, st);
    const dmg = (s.dmg || 0) * st.might;
    if (id === "shield" || id === "lighter") continue;
    p.cd[id] = (p.cd[id] ?? 0.2) - dt;
    if (p.cd[id] > 0) continue;
    const reach = id === "pickaxe" ? 7 : id === "katana" || id === "greatsword" ? s.range + 1.5 : id === "shortsword" ? 20 : id === "baseball" ? 14 : 18;
    const target = nearestEnemy(sim, p.x, p.z, reach);
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
        sim.fx.push({ k: "slash", x: p.x, z: p.z, a: dir, range: s.range, arc: s.arc, lvl });
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
        sim.proj.push({ id: sim.nextId++, art: "arrow", evo: !!p.evo.bow, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: s.pierce, life: s.life, r: s.hit || 0.45, hit: [], lvl });
      }
    } else if (id === "axe") {
      for (let i = 0; i < s.count; i++) {
        const a = target ? datan2(target.x - p.x, target.z - p.z) + (sim.rng() - 0.5) * 0.9 + (i - (s.count - 1) / 2) * 0.35 : sim.rng() * 6.283;
        sim.proj.push({ id: sim.nextId++, art: "axe", evo: !!p.evo.axe, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: 99, life: s.life, r: s.r, hit: [], hitAt: {}, lvl });
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
      sim.fx.push({ k: "spin", x: p.x, z: p.z, range: s.range, lvl, evo: p.evo.greatsword ? 1 : 0 });
      for (const e of sim.enemies) if (hyp(e.x - p.x, e.z - p.z) <= s.range + ENEMIES[e.type].r) damageEnemy(sim, e, dmg, p.id, s.kb, p.x, p.z);
      if (s.heal) p.hp = Math.min(p.maxHp, p.hp + s.heal);
    } else if (id === "shortsword") {
      const n = s.count;
      for (let i = 0; i < n; i++) {
        const aim = target ? datan2(target.x - p.x, target.z - p.z) : p.face;
        const a = s.ring ? aim + i / n * Math.PI * 2 : aim + (i - (n - 1) / 2) * 0.13;
        sim.proj.push({ id: sim.nextId++, art: "sword", evo: !!p.evo.shortsword, owner: p.id, x: p.x, z: p.z, vx: dsin(a) * s.speed, vz: dcos(a) * s.speed, dmg, pierce: s.pierce, life: s.life, r: s.hit || 0.45, hit: [], lvl });
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
      if (!sim.enemies.some((e) => hyp(e.x - p.x, e.z - p.z) < s.radius + 2)) {
        p.cd[id] = 0.3;
        continue;
      }
      sim.fx.push({ k: "quake", x: p.x, z: p.z, r: s.radius, lvl });
      for (const e of sim.enemies) if (hyp(e.x - p.x, e.z - p.z) <= s.radius + ENEMIES[e.type].r) damageEnemy(sim, e, dmg, p.id, s.kb, p.x, p.z);
    }
  }
  if (p.weapons.lighter) {
    let s = WEAPONS.lighter.stats(p.weapons.lighter);
    if (p.evo.lighter) s = evolveStats("lighter", s);
    s = withPassives("lighter", s, st);
    p.fire = s.radius;
    p.cd.lighter = (p.cd.lighter ?? 0) - dt;
    if (p.cd.lighter <= 0) {
      p.cd.lighter = s.tick;
      sim.src = "lighter";
      for (const e of sim.enemies) if (!e.dead && hyp(e.x - p.x, e.z - p.z) <= s.radius + ENEMIES[e.type].r * 0.5) damageEnemy(sim, e, s.dmg * st.might, p.id, 0.3, p.x, p.z);
    }
  } else p.fire = 0;
  if (p.weapons.shield) {
    let s = WEAPONS.shield.stats(p.weapons.shield);
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
          sim.fx.push({ k: "burst", x: pr.x, z: pr.z, r: pr.burst, evo: pr.evo ? 1 : 0 });
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
var REGIONS = MAPS.filter((m) => !m.special);
function regionOf(sim, p) {
  let best = REGIONS[0], bd = 1e18;
  for (const m of REGIONS) {
    const dx = m.cx - p.x, dz = m.cz - p.z, d = dx * dx + dz * dz;
    if (d < bd) {
      bd = d;
      best = m;
    }
  }
  return best;
}
var BELT_SIZE = 4;
var BELT_KINDS = ["beer", "pumpkin", "warp"];
var FOOD = { crawdad: { heal: 15, item: "Cooked Crawdad" }, trout: { heal: 25, item: "Cooked Brown Trout" }, catfish: { heal: 35, item: "Cooked Catfish" }, bass: { heal: 50, item: "Cooked Bubba Bass" } };
var FOOD_TIERS = ["crawdad", "trout", "catfish", "bass"];
function foodDrop(t, u, elite = false) {
  let i = t < 180 ? u < 0.7 ? 0 : 1 : t < 480 ? u < 0.35 ? 0 : u < 0.75 ? 1 : 2 : u < 0.3 ? 1 : u < 0.78 ? 2 : 3;
  if (elite) i = Math.min(3, i + 1);
  return FOOD_TIERS[i];
}
function useItem(sim, p, kind) {
  const st = playerStats(p);
  if (FOOD[kind]) p.hp = Math.min(p.maxHp, p.hp + FOOD[kind].heal * st.heal);
  else if (kind === "beer") {
    p.hp = Math.min(p.maxHp, p.hp + 20 * st.heal);
    p.buffs.speed = 8;
  } else if (kind === "pumpkin") {
    sim.src = "pumpkin";
    sim.fx.push({ k: "nuke", x: p.x, z: p.z, r: 20 });
    for (const e of sim.enemies) if (hyp(e.x - p.x, e.z - p.z) < 20) damageEnemy(sim, e, 45 + sim.t * 0.25, p.id, 4, p.x, p.z);
  } else if (kind === "warp") {
    for (const g of sim.gems) g.pulled = true;
    for (const o of sim.pickups) if (o.kind === "coin") o.pulled = true;
  }
  sim.fx.push({ k: "use", kind, x: p.x, z: p.z });
}
function useBelt(sim, playerId, slot) {
  const p = sim.players.find((q) => q.id === playerId);
  if (!p || !p.alive || slot < 0 || slot >= p.belt.length) return false;
  const kind = p.belt.splice(slot, 1)[0];
  useItem(sim, p, kind);
  return true;
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
          sim.hazards.push({ x: p2.x + dcos(a) * d, z: p2.z + dsin(a) * d, r: 2.6, t: 1.1, max: 1.1, dmg: Math.round(12 * (1 + sim.t / 600)), meteor: true });
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
  const kinds = here.events || sim.map.events || ["treasure", "swarm", "meteors"], kind = kinds[Math.floor(sim.rng() * kinds.length)];
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
    const pool = sim.map.pool.filter((s) => sim.t >= s.t), type = (pool[pool.length - 1] || pool[0]).type;
    for (let i = 0, n = N(20); i < n; i++) {
      const a = i / n * 6.283, w = findWalkable(sim, p.x + dcos(a) * 16, p.z + dsin(a) * 16);
      spawnEnemy(sim, type, w[0], w[1], 0.5);
    }
    sim.event = { kind, t: 1 };
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
    const r = 3.5 + def.r * 1.2, t = 1.1 + r * 0.07;
    sim.hazards.push({ x: tp.x, z: tp.z, r, t, max: t, dmg: bossDmg(sim, def, 1.6) });
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
    if (inp.use != null) useBelt(sim, p.id, inp.use);
    const len = hyp(inp.mx, inp.mz);
    p.moving = len > 0.01;
    if (p.moving) {
      const mx = inp.mx / Math.max(1, len), mz = inp.mz / Math.max(1, len);
      moveTo(sim, p, p.x + mx * st.speed * dt, p.z + mz * st.speed * dt);
      p.face = datan2(mx, mz);
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
  const cell = 1.6, grid = /* @__PURE__ */ new Map();
  const key = (x, z) => Math.floor(x / cell) + 4096 << 13 | Math.floor(z / cell) + 4096;
  for (const e of sim.enemies) {
    const k = key(e.x, e.z);
    (grid.get(k) || grid.set(k, []).get(k)).push(e);
  }
  for (const e of sim.enemies) {
    const def = ENEMIES[e.type];
    const tp = nearestPlayer(sim, e.x, e.z);
    e.hit = Math.max(0, e.hit - dt);
    if (e.rise > 0) {
      e.rise -= dt;
      if (tp) e.face = datan2(tp.x - e.x, tp.z - e.z);
      continue;
    }
    if (tp) {
      const dx = tp.x - e.x, dz = tp.z - e.z, d = hyp(dx, dz) || 1;
      let mx = dx / d * e.speed, mz = dz / d * e.speed;
      if (d > 2.5) {
        const fd = flowDir(sim, e.x, e.z);
        if (fd) {
          mx = fd[0] * e.speed;
          mz = fd[1] * e.speed;
        }
      }
      if (def.boss) {
        const m = bossAct(sim, e, def, tp, d, dx, dz, dt);
        if (m) {
          mx = m[0];
          mz = m[1];
        }
      }
      if (e.treasure) {
        mx = -(dx / d) * e.speed;
        mz = -(dz / d) * e.speed;
      }
      const cx = Math.floor(e.x / cell), cz = Math.floor(e.z / cell);
      for (let ix = -1; ix <= 1; ix++) for (let iz = -1; iz <= 1; iz++) {
        const list = grid.get(cx + ix + 4096 << 13 | cz + iz + 4096);
        if (!list) continue;
        for (const o of list) {
          if (o === e) continue;
          const ox = e.x - o.x, oz = e.z - o.z, od = hyp(ox, oz);
          const min = (def.r + ENEMIES[o.type].r) * 0.85;
          if (od < min && od > 1e-3) {
            const push = (min - od) / min;
            mx += ox / od * push * 4;
            mz += oz / od * push * 4;
          }
        }
      }
      moveTo(sim, e, e.x + (mx + e.kx) * dt, e.z + (mz + e.kz) * dt);
      e.kx *= 0.86;
      e.kz *= 0.86;
      e.face = datan2(dx, dz);
      if (d < def.r + PLAYER_BASE.radius && tp.inv <= 0 && !e.treasure) {
        const st = playerStats(tp);
        const dmg = Math.max(1, Math.round(def.dmg * 0.85 * (sim.t < 120 ? 0.7 : 1) * (1 + sim.t / 1200) * (sim.hard ? 1.35 : 1) * (def.boss ? 0.8 : 1) * (e.charge && e.charge.dash > 0 ? 1.5 : 1) * (e.elite ? 1.4 : 1) - st.armor));
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
      const sp = 11 + (st.magnet - d) * 0.5;
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
      const st = playerStats(p);
      if (BELT_KINDS.includes(k.kind) && p.belt.length < BELT_SIZE) p.belt.push(k.kind);
      else if (BELT_KINDS.includes(k.kind) || FOOD[k.kind]) useItem(sim, p, k.kind);
      else if (k.kind === "chest") {
        if (!sim.pending[p.id]) sim.pending[p.id] = { choices: rollChoices(sim, p), left: 25 };
      } else if (k.kind === "casket") gotCasket(sim, p, rollCasket(sim.rng, sim.casketRank, sim.hard, sim.t));
      else p.coins++;
      sim.fx.push({ k: "get", kind: k.kind, x: k.x, z: k.z });
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
  entryDmt: "0.5",
  // DMT per Normal ranked run (kept for older readers; see races)
  // two races each week from week 1: their own entry price, pot and board; the same map, split, house fee and rules
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
  // From this week on runs are scored by kills per minute and the Hard race is open. Runs are endless from this build on
  // (owner 2 Nov: "ranked should be endless mode from now on"), so week 0 ranks by time survived, then kills; its earlier
  // 15:00 runs replay on their own version. tools/supabase/*.sql and the payout bot use the same switch.
  kpmWeek: 1,
  minSeconds: 180,
  // a kills-per-minute run must last 3:00 to place (shorter runs are listed as too short)
  timeLimit: 2 * 3600,
  // owner 2 Nov: "no 45 mins cap, can go 2 hours": the run stops here with its score counted
  maps: MAPS.filter((m) => !m.special).map((m) => m.id),
  // one map per week, in turn
  advs: ADVENTURERS.filter((a) => !a.special).map((a) => a.id)
  // every regular adventurer is open in ranked
};
var weekOf = (ms = Date.now()) => Math.floor((ms - RANKED.weekEpoch) / (7 * 24 * 3600 * 1e3));
var weekStart = (w) => RANKED.weekEpoch + w * 7 * 24 * 3600 * 1e3;
var weekMap = (w) => RANKED.maps[(w % RANKED.maps.length + RANKED.maps.length) % RANKED.maps.length];
var kpmWeek = (w) => Number.isInteger(w) && w >= RANKED.kpmWeek;
var racesOf = (w) => kpmWeek(w) ? ["normal", "hard"] : ["normal"];
var isRace = (w, mode) => racesOf(w).includes(mode);
var runSeconds = () => RANKED.timeLimit + 60;
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
    players: [{ id: PID, name: "You", adv, weapon: a.weapon, gear: {}, gearLv: {} }]
  });
}
function replay(log, params, { maxTicks = Math.ceil(runSeconds(params?.week) * 30) } = {}) {
  if (!log || log.v !== 1 || !Array.isArray(log.runs) || !Array.isArray(log.uses) || !Array.isArray(log.picks)) return { error: "bad log" };
  let total = 0;
  for (const r of log.runs) {
    if (!Array.isArray(r) || r.length !== 3) return { error: "bad input" };
    const [count, x, z] = r;
    if (!Number.isInteger(count) || count < 1 || !Number.isInteger(x) || !Number.isInteger(z) || Math.abs(x) > 100 || Math.abs(z) > 100) return { error: "bad input" };
    total += count;
    if (total > maxTicks) return { error: "run too long" };
  }
  for (const u of log.uses) if (!Array.isArray(u) || u.length !== 2 || !Number.isInteger(u[0]) || !Number.isInteger(u[1]) || u[1] < 0 || u[1] > 3) return { error: "bad item use" };
  let sim;
  try {
    sim = rankedSim(params);
  } catch {
    return { error: "bad ranked run" };
  }
  let pi = 0, ui = 0, tick = 0;
  const resolve = () => {
    let guard = 0;
    while (sim.pending[PID]) {
      if (guard++ > 60) return "too many choices";
      const a = log.picks[pi++];
      if (a === void 0) return "missing a level-up choice";
      if (a === "r") {
        if (!reroll(sim, PID)) return "reroll not allowed";
      } else if (a === "s") {
        if (!skipLevel(sim, PID)) return "skip not allowed";
      } else if (a === "a") choose(sim, PID, autoChoice(sim.pending[PID]));
      else if (a === 0 || a === 1 || a === 2) {
        if (!sim.pending[PID].choices[a]) return "no such choice";
        choose(sim, PID, a);
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
        if (!Number.isInteger(use) || use < 0 || use > 3) return { error: "bad item use" };
      }
      const before = sim.tick;
      step(sim, { [PID]: { mx: x / 100, mz: z / 100, use } }, TICK);
      if (sim.tick === before) return { error: "a step did not run" };
      tick++;
      sim.fx.length = 0;
      if (tick > maxTicks) return { error: "run too long" };
    }
  }
  const err = resolve();
  if (err && !sim.over) return { error: err };
  if (ui !== log.uses.length) return { error: "item uses out of order" };
  if (!sim.over) return { error: "the run had not ended" };
  return { t: Math.floor(sim.t), kills: sim.kills, level: sim.level, won: sim.over === "win", timeUp: sim.over === "time", ticks: tick, picksUsed: pi };
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
  return { n, blocked, cell: true, water, walls };
}
function groundHash({ n, blocked, water, walls }) {
  let h = 2166136261 >>> 0;
  const mix = (v) => {
    h ^= v;
    h = Math.imul(h, 16777619) >>> 0;
  };
  mix(n);
  for (let k = 0; k < blocked.length; k++) mix(blocked[k] ? 1 : 0);
  for (let k = 0; k < (water ? water.length : 0); k++) mix(water[k] === water[k] ? 2 : 0);
  for (let k = 0; k < (walls ? walls.length : 0); k++) if (walls[k]) mix(k * 16 + walls[k]);
  return h.toString(16);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RANKED,
  groundHash,
  kpmWeek,
  racesOf,
  replay,
  runSeconds,
  unpackGround,
  weekMap,
  weekOf,
  weekStart
});
