// Frozen migrations 6/16 predate participation; exercise their original plan format.
import {makePlan as currentPlan} from '../../tools/payout/core.mjs';
import {placeable} from '../../src/ranked.js';
export const makePlan=(report,incoming='0',week=report.week??0)=>currentPlan({...report,week:0,top:report.top.filter(r=>placeable(week,r))},incoming,0);
export {HOUSE,COLLECT} from '../../tools/payout/core.mjs';
