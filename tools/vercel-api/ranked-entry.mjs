// What the game server needs from the game itself to check ranked runs (bundled to ranked-bundle.cjs by deploy.sh)
// racesOf / runSeconds / kpmWeek: the week's rules (endless kills-per-minute runs and the Hard race from week 1)
export { replay, RANKED, weekOf, weekMap, weekStart, racesOf, entryRacesOf, runSeconds, kpmWeek, raceForWeek, rankedPoints } from '../../src/ranked.js';
export { unpackGround, groundHash } from '../../src/ground-pack.js';

export { dmtText } from '../../src/prize-display.js';

export { clockPolicy, CLOSE_MS, UPLOAD_MS, IDLE_MS } from '../../src/ranked-clock.js';
export {entryForWeek,entryOptions,entryMessage} from '../../src/ranked-entry-price.js';
export {rewardPolicy} from '../../src/reward-policy.js';
