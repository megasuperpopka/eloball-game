import CurrencySystem from "./CurrencySystem.js";
import SkinSystem from "./SkinSystem.js";

const CASES = {
  basic: {
    id: "basic",
    name: "Basic Case",
    price: 100,
    chances: [
      { rarity: "Rare", chance: 62 },
      { rarity: "Epic", chance: 22 },
      { rarity: "Mythic", chance: 10 },
      { rarity: "Legendary", chance: 5 },
      { rarity: "Top", chance: 1 },
    ],
  },
  premium: {
    id: "premium",
    name: "Premium Case",
    price: 500,
    chances: [
      { rarity: "Rare", chance: 45 },
      { rarity: "Epic", chance: 28 },
      { rarity: "Mythic", chance: 15 },
      { rarity: "Legendary", chance: 9 },
      { rarity: "Top", chance: 3 },
    ],
  },
};

function normalizeCaseType(type) {
  const key = String(type || "").toLowerCase();
  return CASES[key] ? key : null;
}

function rollRarity(caseConfig) {
  const roll = Math.random() * 100;
  let threshold = 0;

  for (const item of caseConfig.chances) {
    threshold += item.chance;
    if (roll < threshold) return item.rarity;
  }

  return caseConfig.chances[caseConfig.chances.length - 1].rarity;
}

function pickRandomSkinByRarityAndCase(rarity, caseType) {
  const pool = SkinSystem.getSkinsForCase(caseType).filter((skin) => skin.rarity === rarity);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const CaseSystem = {
  getCases() {
    return Object.values(CASES).map((item) => ({ ...item }));
  },

  getCaseConfig(type) {
    const normalizedType = normalizeCaseType(type);
    return normalizedType ? { ...CASES[normalizedType] } : null;
  },

  /**
   * Группы выпадений: шанс редкости и доля каждого скина внутри неё.
   * @returns {{ rarity: string; rarityChance: number; items: { skin: object; percent: number }[] }[]}
   */
  getDropGroups(type) {
    const caseConfig = this.getCaseConfig(type);
    if (!caseConfig) return [];

    const pool = SkinSystem.getSkinsForCase(type);
    return caseConfig.chances.map(({ rarity, chance }) => {
      const skins = pool.filter((skin) => skin.rarity === rarity);
      const count = skins.length;
      const eachPercent = count > 0 ? chance / count : 0;
      return {
        rarity,
        rarityChance: chance,
        items: skins.map((skin) => ({ skin, percent: eachPercent })),
      };
    });
  },

  canOpenCase(type) {
    const normalizedType = normalizeCaseType(type);
    if (!normalizedType) return false;
    const { price } = CASES[normalizedType];
    return CurrencySystem.getGold() >= price;
  },

  openCase(type) {
    const normalizedType = normalizeCaseType(type);
    if (!normalizedType) {
      return { ok: false, reason: "UNKNOWN_CASE", skin: null };
    }

    const caseConfig = CASES[normalizedType];
    const spent = CurrencySystem.spend(caseConfig.price);
    if (!spent) {
      return { ok: false, reason: "NOT_ENOUGH_GOLD", skin: null };
    }

    const rarity = rollRarity(caseConfig);
    const skin = pickRandomSkinByRarityAndCase(rarity, normalizedType);
    if (!skin) {
      return { ok: false, reason: "NO_SKINS_FOR_RARITY", skin: null };
    }

    const alreadyOwned = SkinSystem.hasSkin(skin.id);
    const unlockedSkin = SkinSystem.unlockSkin(skin.id);
    return {
      ok: true,
      reason: null,
      caseType: normalizedType,
      rarity,
      skin: unlockedSkin,
      isDuplicate: alreadyOwned,
      goldLeft: CurrencySystem.getGold(),
    };
  },
};

export default CaseSystem;
