// Casual modes share native combat; their schedules and profile eligibility stay separate.
export const VARIANTS = {
  normal: { name: 'Field' },
  boss: { name: 'Boss Trials' },
  raid: { name: 'Survival Raid' },
  fun: { name: 'Slimer Invasion' },
};
export const TRIAL_BOSSES = ['giant', 'sankson', 'ogre', 'colossus', 'reaper', 'dragon'];
export const BOSS_KIT = { label: 'Ranger · Bow 6 · Katana 6 · Boots 3 · Plate Armor 3', adv: 'ranger', weapons: { bow: 6, katana: 6 }, passives: { boots: 3, armor: 3 } };
export const RAID_DURATION = 1500;
export const RAID_WAVES = [180, 360, 540, 720, 900, 1080, 1260, 1440];
