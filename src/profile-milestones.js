import {QUESTS as LEGACY_QUESTS} from './content.js';

export const DUPLICATE_GEAR_COINS = 25;
export const QUESTS = [
  ...LEGACY_QUESTS,
  {id:'desert-watch',name:'Desert Watch',text:'Slay 150 Scorpions.',stat:'kills.scorpion',goal:150,coins:150},
  {id:'bandit-patrol',name:'Bandit Patrol',text:'Slay 250 Bandits.',stat:'kills.bandit',goal:250,coins:150},
  {id:'wilderness-tracker',name:'Wilderness Tracker',text:'Slay 150 Wolves.',stat:'kills.wolf',goal:150,coins:150},
  {id:'slime-duty',name:'Slime Duty',text:'Slay 200 Slimers.',stat:'kills.slimer',goal:200,coins:150},
  {id:'winter-watch',name:'Winter Watch',text:'Slay 100 Snowmen.',stat:'kills.snowman',goal:100,coins:150},
  {id:'dragon-rematch',name:'Dragon Rematch',text:'Defeat 5 Dragons.',stat:'dragons',goal:5,coins:250},
];
export const ACHIEVEMENTS = [
  {id:'achievement-first-clear',name:'First Clear',text:'Clear your first map.',stat:'cleared',goal:1,coins:0,achievement:true},
  {id:'achievement-world-tour',name:'World Tour',text:'Clear five different maps.',stat:'cleared',goal:5,coins:0,achievement:true},
  {id:'achievement-veteran',name:'Veteran Survivor',text:'Survive 20:00 in a single run.',stat:'bestTime',goal:1200,coins:0,achievement:true},
  {id:'achievement-last-stand',name:'The Last Stand',text:'Survive 30:00 in a single run.',stat:'bestTime',goal:1800,coins:0,achievement:true},
  {id:'achievement-horde-breaker',name:'Horde Breaker',text:'Slay 25,000 monsters.',stat:'kills',goal:25000,coins:0,achievement:true},
  {id:'achievement-weapon-scholar',name:'Weapon Scholar',text:'Evolve 25 weapons.',stat:'evolves',goal:25,coins:0,achievement:true},
  {id:'achievement-treasure-keeper',name:'Treasure Keeper',text:'Open 100 reward caskets.',stat:'caskets',goal:100,coins:0,achievement:true},
  {id:'achievement-boss-hunter',name:'Boss Hunter',text:'Defeat 50 bosses.',stat:'bosses',goal:50,coins:0,achievement:true},
];
export const MILESTONES = [...QUESTS,...ACHIEVEMENTS];
