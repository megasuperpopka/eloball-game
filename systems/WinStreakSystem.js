import StorageSystem from "./StorageSystem.js";
import CurrencySystem from "./CurrencySystem.js";

/** Каждые N побед подряд — бонус голды. */
export const STREAK_MILESTONE = 3;
export const STREAK_GOLD_BONUS = 35;

function load() {
  let blob = StorageSystem.getWinStreakBlob();
  if (!blob || typeof blob !== "object") {
    blob = { current: 0, best: 0 };
    StorageSystem.setWinStreakBlob(blob);
  }
  blob.current = Math.max(0, Math.floor(Number(blob.current)) || 0);
  blob.best = Math.max(0, Math.floor(Number(blob.best)) || 0);
  return blob;
}

function save(blob) {
  StorageSystem.setWinStreakBlob(blob);
}

const WinStreakSystem = {
  STREAK_MILESTONE,
  STREAK_GOLD_BONUS,

  getCurrent() {
    return load().current;
  },

  getBest() {
    return load().best;
  },

  /**
   * После матча: победа увеличивает серию, поражение сбрасывает.
   * @returns {{ current: number, best: number, bonusGold: number, milestoneHit: boolean }}
   */
  onMatchEnd(won) {
    const blob = load();
    let bonusGold = 0;
    let milestoneHit = false;

    if (won) {
      blob.current += 1;
      if (blob.current > blob.best) blob.best = blob.current;
      if (blob.current > 0 && blob.current % STREAK_MILESTONE === 0) {
        bonusGold = CurrencySystem.addGold(STREAK_GOLD_BONUS);
        milestoneHit = true;
      }
    } else {
      blob.current = 0;
    }

    save(blob);
    return {
      current: blob.current,
      best: blob.best,
      bonusGold,
      milestoneHit,
    };
  },
};

export default WinStreakSystem;
