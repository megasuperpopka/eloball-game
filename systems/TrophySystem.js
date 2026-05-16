import StorageSystem from "./StorageSystem.js";
import CurrencySystem from "./CurrencySystem.js";

/** Каждые N побед дают бонусную голду одним начислением. */
export const MILESTONE_TROPHY_COUNT = 10;
export const MILESTONE_GOLD_BONUS = 500;

/**
 * Одна победа в матче: +1 кубок к профилю; при кратности от MILESTONE — + голда.
 * @returns {{ newTotal: number, milestoneBonusGold: number }}
 */
export function awardTrophyAfterMatchWin() {
  const prev = StorageSystem.getTrophies();
  const newTotal = prev + 1;
  StorageSystem.setTrophies(newTotal);

  let milestoneBonusGold = 0;
  if (newTotal > 0 && newTotal % MILESTONE_TROPHY_COUNT === 0) {
    milestoneBonusGold = MILESTONE_GOLD_BONUS;
    CurrencySystem.addGold(milestoneBonusGold);
  }

  return { newTotal, milestoneBonusGold };
}

const TrophySystem = {
  getTrophies() {
    return StorageSystem.getTrophies();
  },

  awardTrophyAfterMatchWin,
};

export default TrophySystem;
