import StorageSystem from "./StorageSystem.js";

export const EXTRA_PAINT_SLOT_GOLD_PRICE = 300;

const MIN_GOLD_REWARD = 50;
const MAX_GOLD_REWARD = 100;

/** Коины: только за победу; при поражении не начисляются и не списываются. */
const COINS_PER_MATCH = 50;

let coinAnimEvents = [];
let goldAnimEvents = [];
let coinAnimEventId = 1;
let goldAnimEventId = 1;

function getRandomGoldReward() {
  return Math.floor(Math.random() * (MAX_GOLD_REWARD - MIN_GOLD_REWARD + 1)) + MIN_GOLD_REWARD;
}

const CurrencySystem = {
  getGold() {
    return StorageSystem.getGold();
  },

  addWinReward() {
    const reward = getRandomGoldReward();
    return this.addGold(reward);
  },

  spend(amount) {
    const current = this.getGold();
    if (current < amount) return false;
    StorageSystem.setGold(current - amount);
    return true;
  },

  /** @returns {number} сколько голды реально добавили */
  addGold(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    const add = Math.floor(n);
    if (add > 0) {
      goldAnimEvents.push({ id: goldAnimEventId++, amount: add });
    }
    StorageSystem.setGold(this.getGold() + add);
    return add;
  },

  getCoins() {
    return StorageSystem.getCoins();
  },

  addCoins(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    const add = Math.floor(n);
    if (add > 0) {
      coinAnimEvents.push({ id: coinAnimEventId++, amount: add });
    }
    StorageSystem.setCoins(this.getCoins() + add);
    return add;
  },

  consumeCoinAnimEvents() {
    const out = coinAnimEvents;
    coinAnimEvents = [];
    return out;
  },

  consumeGoldAnimEvents() {
    const out = goldAnimEvents;
    goldAnimEvents = [];
    return out;
  },

  spendCoins(amount) {
    const need = Math.max(0, Math.floor(Number(amount)));
    if (need <= 0) return true;
    const current = this.getCoins();
    if (current < need) return false;
    StorageSystem.setCoins(current - need);
    return true;
  },

  /** Награда коинами за победу в матче; при поражении не вызывается. */
  addMatchCoinsReward() {
    return this.addCoins(COINS_PER_MATCH);
  },

  /**
   * +1 место под нарисованный скин за голду ({@link EXTRA_PAINT_SLOT_GOLD_PRICE}).
   * @returns {{ ok: true } | { ok: false, reason: "GOLD" | "MAX" }}
   */
  buyExtraPaintSlotWithGold() {
    if (!this.spend(EXTRA_PAINT_SLOT_GOLD_PRICE)) return { ok: false, reason: "GOLD" };
    if (!StorageSystem.incrementPaintExtraSlotCount()) {
      this.addGold(EXTRA_PAINT_SLOT_GOLD_PRICE);
      return { ok: false, reason: "MAX" };
    }
    StorageSystem.syncPaintSlotsIntoInventory();
    return { ok: true };
  },
};

export default CurrencySystem;
