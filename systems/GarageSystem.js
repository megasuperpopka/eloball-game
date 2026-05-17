import CurrencySystem from "./CurrencySystem.js";
import SkinSystem from "./SkinSystem.js";
import { resolveGameAssetUrl } from "./AssetUrl.js";

export const GARAGE_PRICE = 1500;
export const GARAGE_IMAGE_PATH = "assets/images/skins/garaz.png";
export const GARAGE_DROP_COUNT = 5;

/** Top / Legendary / Mythic в гараже выпадают в 2 раза реже Rare / Epic. */
const GARAGE_HIGH_RARITY_WEIGHT = 0.5;
const GARAGE_NORMAL_RARITY_WEIGHT = 1;

const GARAGE_DOWNWEIGHTED_RARITIES = new Set(["Mythic", "Legendary", "Top"]);

/** @type {HTMLImageElement | null} */
let garageImage = null;

function getGarageSkinPool() {
  return SkinSystem.getAllSkins().filter(
    (s) => s.id !== "default" && (s.type === "image" || s.type === "color" || s.type === "dual"),
  );
}

function skinGarageWeight(skin) {
  return GARAGE_DOWNWEIGHTED_RARITIES.has(skin.rarity)
    ? GARAGE_HIGH_RARITY_WEIGHT
    : GARAGE_NORMAL_RARITY_WEIGHT;
}

function pickWeightedGarageSkin(pool) {
  let total = 0;
  for (let i = 0; i < pool.length; i += 1) {
    total += skinGarageWeight(pool[i]);
  }
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i += 1) {
    roll -= skinGarageWeight(pool[i]);
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

function pickRandomSkins(pool, count) {
  const drops = [];
  for (let i = 0; i < count; i += 1) {
    drops.push(pickWeightedGarageSkin(pool));
  }
  return drops;
}

const GarageSystem = {
  getPrice() {
    return GARAGE_PRICE;
  },

  canOpen() {
    return CurrencySystem.getGold() >= GARAGE_PRICE;
  },

  getGarageImage() {
    if (!garageImage) {
      garageImage = new Image();
      garageImage.src = resolveGameAssetUrl(GARAGE_IMAGE_PATH);
    }
    return garageImage;
  },

  preloadGarageImage() {
    this.getGarageImage();
  },

  /**
   * @returns {{ ok: true, drops: { skin: object, isDuplicate: boolean }[], goldLeft: number } | { ok: false, reason: string, drops: [] }}
   */
  open() {
    if (!this.canOpen()) {
      return { ok: false, reason: "NOT_ENOUGH_GOLD", drops: [] };
    }
    const spent = CurrencySystem.spend(GARAGE_PRICE);
    if (!spent) {
      return { ok: false, reason: "NOT_ENOUGH_GOLD", drops: [] };
    }

    const pool = getGarageSkinPool();
    if (pool.length === 0) {
      return { ok: false, reason: "NO_SKINS", drops: [] };
    }

    const rolled = pickRandomSkins(pool, GARAGE_DROP_COUNT);
    const drops = rolled.map((skin) => {
      const wasOwned = SkinSystem.hasSkin(skin.id);
      const unlocked = SkinSystem.unlockSkin(skin.id);
      return { skin: unlocked, isDuplicate: wasOwned };
    });

    return { ok: true, drops, goldLeft: CurrencySystem.getGold() };
  },
};

export default GarageSystem;
