// Casual modes share native combat; their schedules and profile eligibility stay separate.
export const VARIANTS = {
  normal: { name: 'Field' },
  boss: { name: 'Boss Trials' },
  raid: { name: 'Survival Raid' },
  fun: { name: 'Slimer Invasion' },
  wizard: { name: 'Wizard Invasion' },
  castle: { name: 'Castle Defence' },
};
export const TRIAL_BOSSES = ['giant', 'sankson', 'ogre', 'colossus', 'reaper', 'dragon'];
export const BOSS_KIT = { label: 'Ranger · Bow 6 · Katana 6 · Boots 3 · Plate Armor 3', adv: 'ranger', weapons: { bow: 6, katana: 6 }, passives: { boots: 3, armor: 3 } };
export const RAID_DURATION = 1500;
export const RAID_WAVES = [180, 360, 540, 720, 900, 1080, 1260, 1440];

// The Greentown Wise Old Man at 374.5, 280.5; a forced role, outside normal unlocks.
export const WISE_OLD_MAN = { id: 'wise-old-man', name: 'Wise Old Man', weapon: 'staff', look: { hair: 'Long', hairColor: 0xe6e6e6, skin: 0xd9b48f, shirt: 0x6b5a45, pants: 0x4a4033, armor: {} } };

// Native Greentown west gate; fan scenario tuning, not a recovered protester prefab.
export const CASTLE = { x: 369.5, z: 340.5, hp: 250, maxHp: 250 };
export const CASTLE_WAVE = { every: 35, cap: 32, contact: 1.2, damage: 4 };
