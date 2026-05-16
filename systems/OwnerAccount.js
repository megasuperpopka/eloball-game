import StorageSystem from "./StorageSystem.js";
import SkinSystem from "./SkinSystem.js";
import { AccountAuth } from "./AccountAuth.js";

/**
 * Только этот флаг (в коде): localStorage здесь сознательно не используется — ключ eloball.ownerFullAccount легко
 * забыть в браузере, и тогда «чит» срабатывает у любого аккаунта.
 */
export const OWNER_FULL_ACCOUNT_IN_CODE = false;

/**
 * Один раз на профиль: 1 000 000 коинов (и для отдельных акков — ещё голда), если userId сессии в списке.
 * userId = логин после slugify (как при регистрации).
 */
const DEV_ONE_MILLION_COINS_USER_IDS = new Set(["славик_разработчик"]);

/** Коины 1 000 000 один раз + голда при каждом входе (см. DEV_ALWAYS_GOLD). */
const DEV_FULL_MEGA_ECONOMY_USER_IDS = new Set(["kikykbek"]);

/** Голда при каждом входе (userId после slugify логина). */
const DEV_ALWAYS_GOLD_BY_USER = {
  kikykbek: 100_000_000,
  "я_друг_разраба": 1_000_000,
};

/** Коины один раз при первом входе (userId после slugify логина). */
const DEV_ONE_TIME_COINS_BY_USER = {
  "я_друг_разраба": 100_000,
};

function isOwnerAccountEnabled() {
  return OWNER_FULL_ACCOUNT_IN_CODE === true;
}

/** Все скины в инвентарь + 1 000 000 голды (только когда включён владельческий режим). */
export function applyOwnerAccountIfEnabled() {
  if (!isOwnerAccountEnabled()) return;

  const allIds = SkinSystem.getAllSkins().map((s) => s.id);
  const current = StorageSystem.getInventory();
  const merged = [...new Set([...current, ...allIds])];
  StorageSystem.setInventory(merged);
  StorageSystem.setGold(1000000);
}

export function applyDevMegaCoinsBonusOnce() {
  const uid = AccountAuth.getSessionUserId();
  if (!uid) return;

  const alwaysGold = DEV_ALWAYS_GOLD_BY_USER[uid];
  if (Number.isFinite(alwaysGold) && alwaysGold > 0) {
    StorageSystem.setGold(alwaysGold);
  }

  if (StorageSystem.wasMegaCoinsBonusGranted(uid)) return;

  if (DEV_FULL_MEGA_ECONOMY_USER_IDS.has(uid)) {
    StorageSystem.setCoins(1_000_000);
    if (!Number.isFinite(alwaysGold)) {
      StorageSystem.setGold(1_000_000);
    }
    StorageSystem.markMegaCoinsBonusGranted(uid);
    return;
  }
  if (DEV_ONE_MILLION_COINS_USER_IDS.has(uid)) {
    StorageSystem.setCoins(1_000_000);
    StorageSystem.markMegaCoinsBonusGranted(uid);
    return;
  }
  const onceCoins = DEV_ONE_TIME_COINS_BY_USER[uid];
  if (Number.isFinite(onceCoins) && onceCoins > 0) {
    StorageSystem.setCoins(onceCoins);
    StorageSystem.markMegaCoinsBonusGranted(uid);
  }
}
