const AUTH_KEY = "eloball.auth.v1";
const LEGACY_KEYS = {
  elo: "eloball.elo",
  gold: "eloball.gold",
  inventory: "eloball.inventory",
};

function getStorage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch (_) {
    /* ignore */
  }
  return null;
}

function readAuth() {
  const storage = getStorage();
  if (!storage) return { accounts: [], session: null, legacyTargetUserId: null };
  try {
    const raw = storage.getItem(AUTH_KEY);
    if (!raw) return { accounts: [], session: null, legacyTargetUserId: null };
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return { accounts: [], session: null, legacyTargetUserId: null };
    return {
      accounts: Array.isArray(data.accounts) ? data.accounts : [],
      session: data.session && typeof data.session.userId === "string" ? data.session : null,
      legacyTargetUserId:
        typeof data.legacyTargetUserId === "string" && data.legacyTargetUserId.length > 0
          ? data.legacyTargetUserId
          : null,
    };
  } catch (_) {
    return { accounts: [], session: null, legacyTargetUserId: null };
  }
}

function writeAuth(state) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(AUTH_KEY, JSON.stringify(state));
}

function hasLegacyProgress() {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const goldRaw = storage.getItem(LEGACY_KEYS.gold);
    const eloRaw = storage.getItem(LEGACY_KEYS.elo);
    const invRaw = storage.getItem(LEGACY_KEYS.inventory);

    const gold = goldRaw ? Number(JSON.parse(goldRaw)) : 0;
    const elo = eloRaw ? Number(JSON.parse(eloRaw)) : 0;
    const inv = invRaw ? JSON.parse(invRaw) : [];
    const hasInventory = Array.isArray(inv) && inv.length > 1;
    return (Number.isFinite(gold) && gold > 0) || (Number.isFinite(elo) && elo > 0) || hasInventory;
  } catch (_) {
    return false;
  }
}

export function slugifyLogin(username) {
  return String(username || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9а-яё_\-]/gi, "");
}

function slugify(username) {
  return slugifyLogin(username);
}

/** Уникальный слот сохранений профиля (не смешивает экономику между аккаунтами при любых совпадениях slug и т.п.). */
function newProfileSlot() {
  try {
    if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
  } catch (_) {
    // ignore
  }
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

async function sha256Hex(text) {
  const subtle = typeof globalThis.crypto !== "undefined" ? globalThis.crypto.subtle : null;
  if (!subtle) {
    /** @deprecated fallback — локально только для крайних случаев без Web Crypto */
    let h = 0;
    for (let i = 0; i < text.length; i += 1) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
    return `legacy:${h}:${text.length}`;
  }
  const buf = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const AccountAuth = {
  /** Вошёл ли игрок в аккаунт (локальная сессия на этом устройстве). */
  isLoggedIn() {
    const { session } = readAuth();
    return Boolean(session && session.userId);
  },

  getDisplayName() {
    const { session } = readAuth();
    if (!session?.display || typeof session.display !== "string") return null;
    return session.display.trim() || null;
  },

  getSessionUserId() {
    const { session } = readAuth();
    return session?.userId ?? null;
  },

  getSessionInfo() {
    const { session } = readAuth();
    return session || null;
  },

  /**
   * Ключ профиля в StorageSystem (`eloball.profile.<слот>.…`): для новых аккаунтов UUID, для старых — первый вход подставляет userId.
   * @returns {string | null}
   */
  getProfileStorageSlug() {
    const { session } = readAuth();
    if (!session?.userId) return null;
    if (typeof session.profileSlot === "string" && session.profileSlot.length > 0) {
      return session.profileSlot;
    }
    return session.userId;
  },

  getLegacyTargetUserId() {
    const { legacyTargetUserId } = readAuth();
    return legacyTargetUserId ?? null;
  },

  markLegacyMigrated() {
    const data = readAuth();
    data.legacyTargetUserId = null;
    writeAuth(data);
  },

  logout() {
    const data = readAuth();
    data.session = null;
    writeAuth(data);
  },

  /**
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async register(displayName, password, email = "") {
    const name = String(displayName || "").trim();
    const userId = slugify(name);
    if (userId.length < 2) {
      return { ok: false, message: "Логин слишком короткий (минимум 2 символа после очистки)." };
    }
    if (name.length > 32) {
      return { ok: false, message: "Логин не длиннее 32 символов." };
    }
    if (password.length < 4) {
      return { ok: false, message: "Пароль не короче 4 символов." };
    }
    const data = readAuth();
    if (data.accounts.some((a) => a.userId === userId)) {
      return { ok: false, message: "Такой логин уже занят." };
    }
    const passHash = await sha256Hex(password);
    const profileSlot = newProfileSlot();
    data.legacyTargetUserId = null;
    data.accounts.push({
      userId,
      display: name.slice(0, 32),
      passHash,
      email: typeof email === "string" ? email.trim().slice(0, 120) : "",
      createdAt: Date.now(),
      profileSlot,
    });
    data.session = { userId, display: name.slice(0, 32), source: "register", profileSlot };
    writeAuth(data);
    return { ok: true };
  },

  /**
   * Вход по логину + паролю.
   * Опционально можно сменить ник прямо при входе.
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async login(loginName, password, options = {}) {
    const userId = slugify(loginName);
    if (userId.length < 2) {
      return { ok: false, message: "Введите логин." };
    }
    if (String(password || "").length < 1) {
      return { ok: false, message: "Введите пароль." };
    }
    const data = readAuth();
    let acc = data.accounts.find((a) => a.userId === userId);
    if (!acc) {
      // Один раз привязываем старый локальный прогресс к первому логину,
      // чтобы игрок не терял достижения после внедрения системы аккаунтов.
      if (data.accounts.length === 0 && hasLegacyProgress()) {
        const autoCreated = await this.register(loginName, String(password || ""), "");
        if (!autoCreated.ok) {
          return { ok: false, message: autoCreated.message || "Не удалось привязать старый прогресс." };
        }
        const nextData = readAuth();
        const legacyAcc = nextData.accounts.find((a) => a.userId === userId);
        const slot = legacyAcc && typeof legacyAcc.profileSlot === "string" ? legacyAcc.profileSlot : userId;
        nextData.legacyTargetUserId = userId;
        nextData.session = {
          userId,
          display: String(loginName || "").trim().slice(0, 32),
          source: "login",
          profileSlot: slot,
        };
        writeAuth(nextData);
        return { ok: true };
      }
      return { ok: false, message: "Аккаунт с таким логином не найден." };
    }
    const hash = await sha256Hex(String(password));
    if (hash !== acc.passHash) {
      return { ok: false, message: "Неверный пароль." };
    }

    if (data.legacyTargetUserId && data.legacyTargetUserId !== acc.userId) {
      data.legacyTargetUserId = null;
    }

    const shouldRename = Boolean(options && options.changeNickname);
    if (shouldRename) {
      const nextDisplayRaw = String(options.newNickname || "").trim();
      const nextUserId = slugify(nextDisplayRaw);
      if (nextDisplayRaw.length < 2 || nextUserId.length < 2) {
        return { ok: false, message: "Новый ник слишком короткий." };
      }
      if (nextDisplayRaw.length > 32) {
        return { ok: false, message: "Новый ник не длиннее 32 символов." };
      }
      const takenByAnother = data.accounts.some((a) => a.userId === nextUserId && a.userId !== acc.userId);
      if (takenByAnother) {
        return { ok: false, message: "Такой ник уже занят." };
      }
      const preservedSlot =
        typeof acc.profileSlot === "string" && acc.profileSlot.length > 0 ? acc.profileSlot : acc.userId;
      acc.display = nextDisplayRaw.slice(0, 32);
      acc.userId = nextUserId;
      acc.profileSlot = preservedSlot;
    }

    if (typeof acc.profileSlot !== "string" || acc.profileSlot.length === 0) {
      acc.profileSlot = acc.userId;
    }

    data.session = {
      userId: acc.userId,
      display: acc.display,
      source: "login",
      profileSlot: acc.profileSlot,
    };
    writeAuth(data);
    return { ok: true };
  },
};

/** Локальные демо-аккаунты (создаются при первом запуске, если ещё нет в localStorage). */
const BUILT_IN_ACCOUNTS = [
  { display: "KIKYKBEK", password: "~8~Wv{#aa@" },
  { display: "я_друг_разраба", password: "0705" },
];

/**
 * Добавляет встроенные логины в `eloball.auth.v1`, не трогая сессию.
 * Пароль в исходниках — только для офлайн-демо; в публичном репозитории не выкладывай.
 */
export async function ensureBuiltInTestAccounts() {
  const data = readAuth();
  let changed = false;
  for (const { display, password } of BUILT_IN_ACCOUNTS) {
    const name = String(display || "").trim();
    const userId = slugify(name);
    if (userId.length < 2) continue;
    if (data.accounts.some((a) => a.userId === userId)) continue;
    const passHash = await sha256Hex(String(password));
    data.accounts.push({
      userId,
      display: name.slice(0, 32),
      passHash,
      email: "",
      createdAt: Date.now(),
      profileSlot: newProfileSlot(),
    });
    changed = true;
  }
  if (changed) writeAuth(data);
}
