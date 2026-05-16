import StorageSystem from "./StorageSystem.js";
import CurrencySystem from "./CurrencySystem.js";

export const DAILY_LOGIN_GOLD = 100;
export const DAILY_LOGIN_COINS = 50;

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DailyLoginBonusSystem = {
  DAILY_LOGIN_GOLD,
  DAILY_LOGIN_COINS,

  /** Уже получали бонус сегодня? */
  wasClaimedToday() {
    return StorageSystem.getDailyLoginLastDate() === todayKey();
  },

  /**
   * Выдать ежедневный бонус один раз за календарный день.
   * @returns {{ granted: true, gold: number, coins: number } | { granted: false }}
   */
  tryGrant() {
    const t = todayKey();
    if (StorageSystem.getDailyLoginLastDate() === t) {
      return { granted: false };
    }
    StorageSystem.setDailyLoginLastDate(t);
    const gold = CurrencySystem.addGold(DAILY_LOGIN_GOLD);
    const coins = CurrencySystem.addCoins(DAILY_LOGIN_COINS);
    return { granted: true, gold, coins };
  },
};

export default DailyLoginBonusSystem;
