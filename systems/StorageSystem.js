import { AccountAuth } from "./AccountAuth.js";

const STORAGE_PREFIX = "eloball.";

export const BASE_PAINT_SLOT_COUNT = 5;

export const MAX_PAINT_SLOTS = 40;

const KEYS = {
  elo: "elo",
  gold: "gold",
  coins: "coins",
  inventory: "inventory",
  activeSkin: "activeSkin",
  trophies: "trophies",
  paintedSkinData: "paintedSkinData",
  paintExtraSlots: "paintExtraSlots",
  paintedSlots: "paintedSlots",
  megaCoinsBonusFor: "megaCoinsBonusFor",
  dailyQuests: "dailyQuests",
  achievements: "achievements",
  winStreak: "winStreak",
  dailyLoginLast: "dailyLoginLast",
  weeklyQuest: "weeklyQuest",
  rewardCalendar: "rewardCalendar",
  tournament: "tournament",
};

const LEGACY_KEYS = {
  elo: `${STORAGE_PREFIX}elo`,
  gold: `${STORAGE_PREFIX}gold`,
  inventory: `${STORAGE_PREFIX}inventory`,
  activeSkin: `${STORAGE_PREFIX}activeSkin`,
};

const PROFILE_GUEST = "guest";

const DEFAULTS = {
  elo: 0,
  gold: 0,
  coins: 0,
  inventory: ["default"],
  activeSkin: "default",
  trophies: 0,
  paintedSkinData: "",
  paintExtraSlots: 0,
  paintedSlots: [],
  megaCoinsBonusFor: "",
  dailyQuests: null,
  achievements: null,
  winStreak: null,
  dailyLoginLast: "",
  weeklyQuest: null,
  rewardCalendar: null,
  tournament: null,
};

const fallbackMemory = new Map();

function getStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch (error) {
    // игнорируем
  }

  return {
    getItem(key) {
      return fallbackMemory.has(key) ? fallbackMemory.get(key) : null;
    },
    setItem(key, value) {
      fallbackMemory.set(key, String(value));
    },
  };
}

function readLiteralKey(key, defaultValue) {
  const storage = getStorage();
  const raw = storage.getItem(key);
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return defaultValue;
  }
}

function writeLiteralKey(key, value) {
  const storage = getStorage();
  storage.setItem(key, JSON.stringify(value));
}

function readProfileField(userSlug, shortKey, defaultValue) {
  const k = `${STORAGE_PREFIX}profile.${userSlug}.${shortKey}`;
  const storage = getStorage();
  const raw = storage.getItem(k);
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return defaultValue;
  }
}

function profileRawExists(userSlug, shortKey) {
  return getStorage().getItem(`${STORAGE_PREFIX}profile.${userSlug}.${shortKey}`) !== null;
}

function sanitizeNumber(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

function sanitizeInventory(value) {
  if (!Array.isArray(value)) return [...DEFAULTS.inventory];

  const uniqueIds = [...new Set(value.filter((item) => typeof item === "string" && item.length > 0))];
  if (uniqueIds.length === 0) return [...DEFAULTS.inventory];
  return uniqueIds;
}

function bundleScore(bundle) {
  if (!bundle) return 0;
  const inv = bundle.inventoryArray || [];
  return bundle.gold + bundle.elo * 2 + inv.length * 80;
}

function legacyAnyKeyPresent() {
  return Object.values(LEGACY_KEYS).some((fullKey) => getStorage().getItem(fullKey) !== null);
}

function readLegacyFlatBundle() {
  if (!legacyAnyKeyPresent()) return null;
  const elo = sanitizeNumber(readLiteralKey(LEGACY_KEYS.elo, DEFAULTS.elo), DEFAULTS.elo);
  const gold = sanitizeNumber(readLiteralKey(LEGACY_KEYS.gold, DEFAULTS.gold), DEFAULTS.gold);
  const inventoryArray = sanitizeInventory(readLiteralKey(LEGACY_KEYS.inventory, DEFAULTS.inventory));
  let activeSkin = readLiteralKey(LEGACY_KEYS.activeSkin, DEFAULTS.activeSkin);
  if (typeof activeSkin !== "string") activeSkin = DEFAULTS.activeSkin;
  if (gold <= 0 && elo <= 0 && inventoryArray.length <= 1) return null;
  return { elo, gold, inventoryArray, activeSkin };
}

function readProfileSlugBundle(slug) {
  const elo = sanitizeNumber(readProfileField(slug, KEYS.elo, DEFAULTS.elo), DEFAULTS.elo);
  const gold = sanitizeNumber(readProfileField(slug, KEYS.gold, DEFAULTS.gold), DEFAULTS.gold);
  const inventoryArray = sanitizeInventory(readProfileField(slug, KEYS.inventory, DEFAULTS.inventory));
  let activeSkin = readProfileField(slug, KEYS.activeSkin, DEFAULTS.activeSkin);
  if (typeof activeSkin !== "string") activeSkin = DEFAULTS.activeSkin;
  const hasAnySaved =
    profileRawExists(slug, KEYS.elo) ||
    profileRawExists(slug, KEYS.gold) ||
    profileRawExists(slug, KEYS.inventory) ||
    profileRawExists(slug, KEYS.activeSkin);
  if (!hasAnySaved && gold <= 0 && elo <= 0 && inventoryArray.length <= 1) return null;

  return { elo, gold, inventoryArray, activeSkin };
}

function writeProfileSlugBundle(slug, bundle) {
  const elo = sanitizeNumber(bundle.elo, DEFAULTS.elo);
  const gold = sanitizeNumber(bundle.gold, DEFAULTS.gold);
  const inventoryArray = sanitizeInventory(bundle.inventoryArray);
  let activeSkin = typeof bundle.activeSkin === "string" ? bundle.activeSkin : DEFAULTS.activeSkin;
  if (!inventoryArray.includes(activeSkin)) {
    activeSkin = inventoryArray[0] || DEFAULTS.activeSkin;
  }
  writeLiteralKey(`${STORAGE_PREFIX}profile.${slug}.${KEYS.elo}`, elo);
  writeLiteralKey(`${STORAGE_PREFIX}profile.${slug}.${KEYS.gold}`, gold);
  writeLiteralKey(`${STORAGE_PREFIX}profile.${slug}.${KEYS.inventory}`, inventoryArray);
  writeLiteralKey(`${STORAGE_PREFIX}profile.${slug}.${KEYS.activeSkin}`, activeSkin);
}

function migrateAuthLegacyTargetLocked() {
  const session = AccountAuth.getSessionInfo();
  const legacyTarget = AccountAuth.getLegacyTargetUserId();
  if (!session?.userId || !legacyTarget || legacyTarget !== session.userId) return;

  const slug = AccountAuth.getProfileStorageSlug();
  if (!slug) return;
  if (
    profileRawExists(slug, KEYS.elo) ||
    profileRawExists(slug, KEYS.gold) ||
    profileRawExists(slug, KEYS.inventory)
  ) {
    AccountAuth.markLegacyMigrated();
    return;
  }

  const flat = readLegacyFlatBundle();
  if (!flat || (flat.gold <= 0 && flat.elo <= 0 && flat.inventoryArray.length <= 1)) {
    AccountAuth.markLegacyMigrated();
    return;
  }

  writeProfileSlugBundle(slug, flat);
  AccountAuth.markLegacyMigrated();
}

/**
 * После входа: один раз на userId допускает слияние старого прогресса только если аккаунт
 * явно помечен как получатель legacy-миграции ({@link AccountAuth#getLegacyTargetUserId}).
 * Иначе новый аккаунт не «подтягивает» профиль гостя и плоские legacy-ключи с этого браузера.
 */
export function hydrateProfileEconomyOnce() {
  const session = AccountAuth.getSessionInfo();
  if (!session?.userId) return;

  const profileSlug = AccountAuth.getProfileStorageSlug();
  if (!profileSlug) return;

  const userId = session.userId;
  const markKey = `${STORAGE_PREFIX}economyHydrated.v4.${profileSlug}`;
  if (readLiteralKey(markKey, false) === true) return;

  const legacyTargetId = AccountAuth.getLegacyTargetUserId();
  const allowLegacyPull = typeof legacyTargetId === "string" && legacyTargetId === userId;

  migrateAuthLegacyTargetLocked();

  const targetBundle = readProfileSlugBundle(profileSlug);

  const flat = readLegacyFlatBundle();
  const guestBundle = userId !== PROFILE_GUEST ? readProfileSlugBundle(PROFILE_GUEST) : null;

  const candidates = [];
  if (allowLegacyPull) {
    if (flat) candidates.push(flat);
    if (guestBundle) candidates.push(guestBundle);
  }

  if (candidates.length === 0) {
    writeLiteralKey(markKey, true);
    return;
  }

  candidates.sort((a, b) => bundleScore(b) - bundleScore(a));
  const best = candidates[0];
  const bestScore = bundleScore(best);

  if (!targetBundle) {
    writeProfileSlugBundle(profileSlug, best);
    if (guestBundle && best === guestBundle) {
      wipeProfileSlug(PROFILE_GUEST);
    }
    writeLiteralKey(markKey, true);
    return;
  }

  const targetScore = bundleScore(targetBundle);
  const targetLooksEmpty =
    targetBundle.gold <= 0 && targetBundle.elo <= 0 && targetBundle.inventoryArray.length <= 1;

  const shouldHeal = targetLooksEmpty ? bestScore > 0 : bestScore >= targetScore + 500;

  if (shouldHeal && bestScore >= targetScore) {
    writeProfileSlugBundle(profileSlug, best);
    if (guestBundle && best === guestBundle && userId !== PROFILE_GUEST) {
      wipeProfileSlug(PROFILE_GUEST);
    }
  }

  writeLiteralKey(markKey, true);
}

const MAX_PAINT_DATA_URL_CHARS = 1_600_000;

function wipeProfileSlug(slug) {
  for (const k of Object.values(KEYS)) {
    try {
      getStorage().removeItem(`${STORAGE_PREFIX}profile.${slug}.${k}`);
    } catch (_) {
      /* ignore */
    }
  }
}

function profileKey(shortKey) {
  const slot = AccountAuth.getProfileStorageSlug();
  const slug = typeof slot === "string" && slot.length > 0 ? slot : PROFILE_GUEST;
  return `${STORAGE_PREFIX}profile.${slug}.${shortKey}`;
}

const StorageSystem = {
  get(key) {
    if (!(key in DEFAULTS)) return null;
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    return readLiteralKey(profileKey(KEYS[key]), DEFAULTS[key]);
  },

  set(key, value) {
    if (!(key in DEFAULTS)) return;
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    writeLiteralKey(profileKey(KEYS[key]), value);
  },

  getElo() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const elo = sanitizeNumber(readLiteralKey(profileKey(KEYS.elo), DEFAULTS.elo), DEFAULTS.elo);
    writeLiteralKey(profileKey(KEYS.elo), elo);
    return elo;
  },

  setElo(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    writeLiteralKey(profileKey(KEYS.elo), sanitizeNumber(value, DEFAULTS.elo));
  },

  getGold() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const gold = sanitizeNumber(readLiteralKey(profileKey(KEYS.gold), DEFAULTS.gold), DEFAULTS.gold);
    writeLiteralKey(profileKey(KEYS.gold), gold);
    return gold;
  },

  setGold(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    writeLiteralKey(profileKey(KEYS.gold), sanitizeNumber(value, DEFAULTS.gold));
  },

  getInventory() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const inventory = sanitizeInventory(readLiteralKey(profileKey(KEYS.inventory), DEFAULTS.inventory));
    writeLiteralKey(profileKey(KEYS.inventory), inventory);
    return inventory;
  },

  setInventory(skinIds) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    writeLiteralKey(profileKey(KEYS.inventory), sanitizeInventory(skinIds));
  },

  addToInventory(skinId) {
    if (typeof skinId !== "string" || skinId.length === 0) return;

    const inventory = this.getInventory();
    if (!inventory.includes(skinId)) {
      inventory.push(skinId);
      writeLiteralKey(profileKey(KEYS.inventory), inventory);
    }
  },

  getActiveSkin() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const activeSkinRaw = readLiteralKey(profileKey(KEYS.activeSkin), DEFAULTS.activeSkin);
    let activeSkin = typeof activeSkinRaw === "string" ? activeSkinRaw : DEFAULTS.activeSkin;
    const inventory = this.getInventory();
    if (typeof activeSkin !== "string" || !inventory.includes(activeSkin)) {
      activeSkin = inventory[0] || DEFAULTS.activeSkin;
      writeLiteralKey(profileKey(KEYS.activeSkin), activeSkin);
    }
    return activeSkin;
  },

  setActiveSkin(skinId) {
    if (typeof skinId !== "string" || skinId.length === 0) return;
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();

    const inventory = this.getInventory();
    if (!inventory.includes(skinId)) {
      inventory.push(skinId);
      writeLiteralKey(profileKey(KEYS.inventory), inventory);
    }

    writeLiteralKey(profileKey(KEYS.activeSkin), skinId);
  },

  getTrophies() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const n = sanitizeNumber(readLiteralKey(profileKey(KEYS.trophies), DEFAULTS.trophies), DEFAULTS.trophies);
    writeLiteralKey(profileKey(KEYS.trophies), n);
    return n;
  },

  setTrophies(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    writeLiteralKey(profileKey(KEYS.trophies), sanitizeNumber(value, DEFAULTS.trophies));
  },

  getCoins() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const n = sanitizeNumber(readLiteralKey(profileKey(KEYS.coins), DEFAULTS.coins), DEFAULTS.coins);
    writeLiteralKey(profileKey(KEYS.coins), n);
    return n;
  },

  setCoins(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    writeLiteralKey(profileKey(KEYS.coins), sanitizeNumber(value, DEFAULTS.coins));
  },

  /** Сколько дополнительных слотов докуплено за голду (+1 место за одну покупку). */
  getPaintExtraSlotsPurchased() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const raw = sanitizeNumber(readLiteralKey(profileKey(KEYS.paintExtraSlots), DEFAULTS.paintExtraSlots), 0);
    const maxExtras = MAX_PAINT_SLOTS - BASE_PAINT_SLOT_COUNT;
    const v = Math.min(Math.max(0, raw), maxExtras);
    writeLiteralKey(profileKey(KEYS.paintExtraSlots), v);
    return v;
  },

  getPaintSlotTotal() {
    return Math.min(MAX_PAINT_SLOTS, BASE_PAINT_SLOT_COUNT + this.getPaintExtraSlotsPurchased());
  },

  incrementPaintExtraSlotCount() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const maxExtras = MAX_PAINT_SLOTS - BASE_PAINT_SLOT_COUNT;
    const cur = this.getPaintExtraSlotsPurchased();
    if (cur >= maxExtras) return false;
    writeLiteralKey(profileKey(KEYS.paintExtraSlots), cur + 1);
    return true;
  },

  wasMegaCoinsBonusGranted(uid) {
    if (!AccountAuth.isLoggedIn() || typeof uid !== "string") return false;
    hydrateProfileEconomyOnce();
    const stored = readLiteralKey(profileKey(KEYS.megaCoinsBonusFor), DEFAULTS.megaCoinsBonusFor);
    return stored === uid;
  },

  markMegaCoinsBonusGranted(uid) {
    if (!AccountAuth.isLoggedIn() || typeof uid !== "string") return;
    hydrateProfileEconomyOnce();
    writeLiteralKey(profileKey(KEYS.megaCoinsBonusFor), uid);
  },

  /** Сырые данные ежедневных квестов (объект); null — ещё не сохраняли. */
  getDailyQuestsBlob() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const raw = readLiteralKey(profileKey(KEYS.dailyQuests), null);
    if (!raw || typeof raw !== "object") return null;
    return raw;
  },

  setDailyQuestsBlob(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    if (!value || typeof value !== "object") {
      writeLiteralKey(profileKey(KEYS.dailyQuests), {
        dateKey: "",
        matchesDone: 0,
        goalsSum: 0,
        wins: 0,
        shop: false,
        inv: false,
        claimed: {},
      });
      return;
    }
    writeLiteralKey(profileKey(KEYS.dailyQuests), value);
  },

  getAchievementsBlob() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const raw = readLiteralKey(profileKey(KEYS.achievements), null);
    if (!raw || typeof raw !== "object") return null;
    return raw;
  },

  setAchievementsBlob(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    if (!value || typeof value !== "object") {
      writeLiteralKey(profileKey(KEYS.achievements), {
        matches: 0,
        wins: 0,
        goals: 0,
        cases: 0,
        questsClaimed: 0,
        claimed: {},
      });
      return;
    }
    writeLiteralKey(profileKey(KEYS.achievements), value);
  },

  getWinStreakBlob() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const raw = readLiteralKey(profileKey(KEYS.winStreak), null);
    if (!raw || typeof raw !== "object") return null;
    return raw;
  },

  setWinStreakBlob(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    if (!value || typeof value !== "object") {
      writeLiteralKey(profileKey(KEYS.winStreak), { current: 0, best: 0 });
      return;
    }
    writeLiteralKey(profileKey(KEYS.winStreak), value);
  },

  getDailyLoginLastDate() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const raw = readLiteralKey(profileKey(KEYS.dailyLoginLast), DEFAULTS.dailyLoginLast);
    return typeof raw === "string" ? raw : DEFAULTS.dailyLoginLast;
  },

  setDailyLoginLastDate(dateKey) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    writeLiteralKey(profileKey(KEYS.dailyLoginLast), typeof dateKey === "string" ? dateKey : "");
  },

  getWeeklyQuestBlob() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const raw = readLiteralKey(profileKey(KEYS.weeklyQuest), null);
    if (!raw || typeof raw !== "object") return null;
    return raw;
  },

  setWeeklyQuestBlob(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    if (!value || typeof value !== "object") {
      writeLiteralKey(profileKey(KEYS.weeklyQuest), {
        weekKey: "",
        questId: "",
        matches: 0,
        wins: 0,
        goals: 0,
        claimed: false,
      });
      return;
    }
    writeLiteralKey(profileKey(KEYS.weeklyQuest), value);
  },

  getRewardCalendarBlob() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const raw = readLiteralKey(profileKey(KEYS.rewardCalendar), null);
    if (!raw || typeof raw !== "object") return null;
    return raw;
  },

  setRewardCalendarBlob(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    if (!value || typeof value !== "object") {
      writeLiteralKey(profileKey(KEYS.rewardCalendar), { completedDays: 0, lastClaimDate: "" });
      return;
    }
    writeLiteralKey(profileKey(KEYS.rewardCalendar), value);
  },

  getTournamentBlob() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const raw = readLiteralKey(profileKey(KEYS.tournament), null);
    if (!raw || typeof raw !== "object") return null;
    return raw;
  },

  setTournamentBlob(value) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    if (!value || typeof value !== "object") {
      writeLiteralKey(profileKey(KEYS.tournament), null);
      return;
    }
    writeLiteralKey(profileKey(KEYS.tournament), value);
  },

  migrateLegacyPaintSkinToSlotsOnce() {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    let slots = readLiteralKey(profileKey(KEYS.paintedSlots), DEFAULTS.paintedSlots);
    if (!Array.isArray(slots)) slots = [];

    const legacyRaw = readLiteralKey(profileKey(KEYS.paintedSkinData), DEFAULTS.paintedSkinData);
    const legacy = typeof legacyRaw === "string" ? legacyRaw.trim() : "";
    const hasStoredSlot = slots.some((s) => typeof s === "string" && s.startsWith("data:image"));
    if (!hasStoredSlot && legacy.startsWith("data:image") && legacy.length <= MAX_PAINT_DATA_URL_CHARS) {
      slots = [legacy, ...slots.filter((_s, i) => i > 0)];
      writeLiteralKey(profileKey(KEYS.paintedSlots), slots);
      writeLiteralKey(profileKey(KEYS.paintedSkinData), "");
    }
    return slots;
  },

  _padPaintSlots(slotsIn, total) {
    let slots = Array.isArray(slotsIn) ? slotsIn.slice() : [];
    if (slots.length < total) {
      slots = slots.concat(Array(total - slots.length).fill(""));
    } else if (slots.length > total) {
      slots = slots.slice(0, total);
    }
    return slots;
  },

  /** Data URL текста для слота 0…total−1 или пустая строка. */
  getPaintSlotDataUrl(slotIndex) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const slots = this.migrateLegacyPaintSkinToSlotsOnce();
    const total = this.getPaintSlotTotal();
    const padded = this._padPaintSlots(slots.map((x) => (typeof x === "string" ? x : "")), total);
    writeLiteralKey(profileKey(KEYS.paintedSlots), padded);
    const s = padded[slotIndex];
    if (typeof s !== "string" || !s.startsWith("data:image") || s.length > MAX_PAINT_DATA_URL_CHARS) return "";
    return s;
  },

  setPaintSlotDataUrl(slotIndex, url) {
    if (AccountAuth.isLoggedIn()) hydrateProfileEconomyOnce();
    const total = this.getPaintSlotTotal();
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= total) return;
    let slots = this.migrateLegacyPaintSkinToSlotsOnce().map((x) => (typeof x === "string" ? x : ""));
    slots = this._padPaintSlots(slots, total);
    if (typeof url !== "string" || url.length === 0) {
      slots[slotIndex] = "";
    } else {
      if (!url.startsWith("data:image") || url.length > MAX_PAINT_DATA_URL_CHARS) return;
      slots[slotIndex] = url;
    }
    writeLiteralKey(profileKey(KEYS.paintedSlots), slots);
  },

  /** Убрать paint_custom из инвентаря, добавить paint_slot_0…N; починить activeSkin. Вызывать из refresh инвентаря. */
  syncPaintSlotsIntoInventory() {
    if (!AccountAuth.isLoggedIn()) return;
    hydrateProfileEconomyOnce();
    this.migrateLegacyPaintSkinToSlotsOnce();
    const total = this.getPaintSlotTotal();

    let inv = sanitizeInventory(readLiteralKey(profileKey(KEYS.inventory), DEFAULTS.inventory));
    inv = inv.filter((id) => id !== "paint_custom" && !/^paint_slot_\d+$/.test(id));

    for (let i = 0; i < total; i += 1) {
      const pid = `paint_slot_${i}`;
      if (!inv.includes(pid)) inv.push(pid);
    }

    let activeSkin = readLiteralKey(profileKey(KEYS.activeSkin), DEFAULTS.activeSkin);
    if (typeof activeSkin !== "string") activeSkin = DEFAULTS.activeSkin;
    if (activeSkin === "paint_custom") activeSkin = "paint_slot_0";
    const m = /^paint_slot_(\d+)$/.exec(activeSkin);
    if (m && Number(m[1]) >= total) activeSkin = "paint_slot_0";

    if (!inv.includes(activeSkin)) {
      activeSkin = inv.includes("paint_slot_0") ? "paint_slot_0" : inv[0] || DEFAULTS.activeSkin;
    }

    writeLiteralKey(profileKey(KEYS.inventory), inv);
    writeLiteralKey(profileKey(KEYS.activeSkin), activeSkin);
  },
};

export default StorageSystem;
