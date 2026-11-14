// Owner-funded20DMT, separate from entry fees and the normal pool allocation.
export const FIRST_BONUS=Object.freeze({week:1,mode:'normal',fundedAt:1794590545000,amountWei:'20000000000000000000',tx:'0x008748b63201e11cc463d08aa6f1bdd1ac0bc48845894cdd330119da875de425'});
export const firstBonusFor=(week,mode='normal')=>week===FIRST_BONUS.week&&mode===FIRST_BONUS.mode?FIRST_BONUS:null;
