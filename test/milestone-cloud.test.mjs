import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeSaves} from '../src/cloud.js';
const profile=(coins,ids=[],bank=[])=>({'sq-coins':JSON.stringify(coins),'sq-quests':JSON.stringify(ids),'sq-bank':JSON.stringify(bank)});
for(const row of[
 {name:'shared new quest preserves separate ordinary earnings',base:profile(100),a:profile(265,['goblins']),b:profile(275,['goblins']),want:290},
 {name:'a shared quest converts its base-owned item only once',base:profile(100,[],['Bowler Hat']),a:profile(290,['goblins'],['Bowler Hat']),b:profile(300,['goblins'],['Bowler Hat']),want:315},
 {name:'quest spending back to base balance is retained',base:profile(100),a:profile(100,['goblins']),b:profile(275,['goblins']),want:125},
 {name:'different quest rewards remain independent',base:profile(100),a:profile(265,['goblins']),b:profile(325,['spiders']),want:490},
 {name:'already claimed at base is not deducted from ordinary earnings',base:profile(100,['goblins']),a:profile(115,['goblins']),b:profile(125,['goblins']),want:140},
 {name:'identical copied saves keep their existing idempotent balance',base:profile(100),a:profile(265,['goblins']),b:profile(265,['goblins']),want:265},
 {name:'two new profile quests reconcile their full one-time reward',base:profile(100),a:profile(415,['desert-watch','bandit-patrol']),b:profile(425,['desert-watch','bandit-patrol']),want:440},
 {name:'nonoverlapping new quests and achievement flags do not remove earnings',base:profile(100),a:profile(265,['desert-watch','achievement-first-clear']),b:profile(275,['bandit-patrol','achievement-first-clear']),want:440},
])test(row.name,()=>{const result=mergeSaves(row.base,row.a,row.b);assert.equal(JSON.parse(result['sq-coins']),row.want);assert.deepEqual(new Set(JSON.parse(result['sq-quests'])),new Set([...JSON.parse(row.a['sq-quests']),...JSON.parse(row.b['sq-quests'])]));});

test('cloud longest-run time uses the maximum while independent kill counts add',()=>{
 const base={'sq-stats':'{"bestTime":600,"kills":100}'},a={'sq-stats':'{"bestTime":1000,"kills":125}'},b={'sq-stats':'{"bestTime":1100,"kills":130}'};
 const stats=JSON.parse(mergeSaves(base,a,b)['sq-stats']);assert.equal(stats.bestTime,1100);assert.equal(stats.kills,155);
});
test('merged map progress counts distinct cleared maps instead of adding overlapping counts',()=>{
 const before=['greentown','apache','duel'],after=[...before,'graves'],base={...profile(100),'sq-cleared':JSON.stringify(before),'sq-stats':'{"cleared":3,"kills":0,"bosses":0}'};
 const a={...profile(115),'sq-cleared':JSON.stringify(after),'sq-stats':'{"cleared":4,"kills":1,"bosses":0}'},b={...profile(125),'sq-cleared':JSON.stringify(after),'sq-stats':'{"cleared":4,"kills":0,"bosses":1}'};
 const result=mergeSaves(base,a,b);assert.equal(JSON.parse(result['sq-stats']).cleared,4);assert.deepEqual(JSON.parse(result['sq-cleared']),after);assert.equal(JSON.parse(result['sq-stats']).kills,1);assert.equal(JSON.parse(result['sq-stats']).bosses,1);
});
