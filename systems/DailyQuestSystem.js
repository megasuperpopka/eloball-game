import StorageSystem from "./StorageSystem.js";
import CurrencySystem from "./CurrencySystem.js";

/** Локальный календарный день (сброс квестов в полночь по времени устройства). */
function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyState(dateKey) {
  return {
    dateKey,
    matchesDone: 0,
    goalsSum: 0,
    wins: 0,
    shop: false,
    inv: false,
    claimed: {},
    chainStarted: false,
    chainTier: 0,
    chainDone: false,
  };
}

function normalizeClaimed(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k === "string" && v === true) out[k] = true;
  }
  return out;
}

/** Бонусная цепочка: открывается после первого «Забрать» за день, следующий шаг — после забора текущего. */
export const CHAIN_QUEST_DEFS = [
  {
    title: "Серия побед",
    description: "Одолейте бота 3 раза за день.",
    target: 3,
    rewardCoins: 70,
    rewardGold: 28,
    kind: "wins",
  },
  {
    title: "На поле снова",
    description: "Завершите 6 матчей за день.",
    target: 6,
    rewardCoins: 62,
    rewardGold: 32,
    kind: "matches",
  },
  {
    title: "Острый прицел",
    description: "Забейте 12 голов суммарно за день.",
    target: 12,
    rewardCoins: 78,
    rewardGold: 36,
    kind: "goals",
  },
  {
    title: "Доминатор",
    description: "4 победы за день.",
    target: 4,
    rewardCoins: 92,
    rewardGold: 42,
    kind: "wins",
  },
  {
    title: "Железная выдержка",
    description: "10 завершённых матчей за день.",
    target: 10,
    rewardCoins: 85,
    rewardGold: 46,
    kind: "matches",
  },
  {
    title: "Легенда фронта",
    description: "18 голов суммарно за день.",
    target: 18,
    rewardCoins: 105,
    rewardGold: 52,
    kind: "goals",
  },
];

/**
 * Ежедневные квесты: коины и голда без обязательных трат; награды умеренные относительно матча (50 коин / 50–100 голда за победу).
 */
export const DAILY_QUEST_DEFS = [
  {
    id: "warm_one",
    title: "Разминка",
    description: "Завершите 1 матч.",
    target: 1,
    rewardCoins: 18,
    rewardGold: 0,
    kind: "matches",
  },
  {
    id: "steady_two",
    title: "В ритме",
    description: "Завершите 2 матча.",
    target: 2,
    rewardCoins: 28,
    rewardGold: 0,
    kind: "matches",
  },
  {
    id: "triple_play",
    title: "Тройной заход",
    description: "Завершите 3 матча.",
    target: 3,
    rewardCoins: 36,
    rewardGold: 0,
    kind: "matches",
  },
  {
    id: "quad_runner",
    title: "Четвёрка",
    description: "Завершите 4 матча.",
    target: 4,
    rewardCoins: 42,
    rewardGold: 0,
    kind: "matches",
  },
  {
    id: "marathon_six",
    title: "Марафонец",
    description: "Завершите 6 матчей.",
    target: 6,
    rewardCoins: 52,
    rewardGold: 14,
    kind: "matches",
  },
  {
    id: "striker_three",
    title: "Остриё",
    description: "Забейте 3 гола суммарно за день.",
    target: 3,
    rewardCoins: 24,
    rewardGold: 0,
    kind: "goals",
  },
  {
    id: "bomber_six",
    title: "Бомбардир",
    description: "Забейте 6 голов суммарно за день.",
    target: 6,
    rewardCoins: 40,
    rewardGold: 0,
    kind: "goals",
  },
  {
    id: "sharpshooter_ten",
    title: "Снайпер",
    description: "Забейте 10 голов суммарно за день.",
    target: 10,
    rewardCoins: 52,
    rewardGold: 20,
    kind: "goals",
  },
  {
    id: "octo_goals",
    title: "Восьмёрка",
    description: "Забейте 8 голов суммарно за день.",
    target: 8,
    rewardCoins: 46,
    rewardGold: 16,
    kind: "goals",
  },
  {
    id: "first_blood",
    title: "Первая победа",
    description: "Выиграйте 1 матч.",
    target: 1,
    rewardCoins: 44,
    rewardGold: 0,
    kind: "wins",
  },
  {
    id: "doubler_wins",
    title: "Дубль",
    description: "Выиграйте 2 матча.",
    target: 2,
    rewardCoins: 64,
    rewardGold: 22,
    kind: "wins",
  },
  {
    id: "triple_crown",
    title: "Триумвир",
    description: "Выиграйте 3 матча.",
    target: 3,
    rewardCoins: 78,
    rewardGold: 30,
    kind: "wins",
  },
  {
    id: "visit_shop",
    title: "В магазин",
    description: "Зайдите в «Магазин» с главного меню.",
    target: 1,
    rewardCoins: 12,
    rewardGold: 14,
    kind: "shop",
  },
  {
    id: "visit_inventory",
    title: "Коллекция",
    description: "Зайдите в «Инвентарь» с главного меню.",
    target: 1,
    rewardCoins: 12,
    rewardGold: 14,
    kind: "inventory",
  },
  {
    id: "five_fire",
    title: "Пятёрка голов",
    description: "Забейте 5 голов суммарно за день.",
    target: 5,
    rewardCoins: 34,
    rewardGold: 0,
    kind: "goals",
  },
];

function migrateBlob(blob) {
  if (typeof blob.chainStarted !== "boolean") blob.chainStarted = false;
  const t = Math.floor(Number(blob.chainTier));
  blob.chainTier = Number.isFinite(t) && t >= 0 ? t : 0;
  if (typeof blob.chainDone !== "boolean") blob.chainDone = false;
  if (blob.chainTier >= CHAIN_QUEST_DEFS.length) {
    blob.chainDone = true;
    blob.chainTier = CHAIN_QUEST_DEFS.length;
  }
  return blob;
}

function loadOrResetState() {
  const t = todayKey();
  let blob = StorageSystem.getDailyQuestsBlob();
  if (!blob || typeof blob !== "object" || blob.dateKey !== t) {
    blob = emptyState(t);
    StorageSystem.setDailyQuestsBlob(blob);
  }
  blob.claimed = normalizeClaimed(blob.claimed);
  blob.matchesDone = Math.max(0, Math.floor(Number(blob.matchesDone)) || 0);
  blob.goalsSum = Math.max(0, Math.floor(Number(blob.goalsSum)) || 0);
  blob.wins = Math.max(0, Math.floor(Number(blob.wins)) || 0);
  blob.shop = Boolean(blob.shop);
  blob.inv = Boolean(blob.inv);
  migrateBlob(blob);
  return blob;
}

function save(blob) {
  StorageSystem.setDailyQuestsBlob(blob);
}

function progressFor(def, blob) {
  if (def.kind === "matches") return blob.matchesDone;
  if (def.kind === "goals") return blob.goalsSum;
  if (def.kind === "wins") return blob.wins;
  if (def.kind === "shop") return blob.shop ? 1 : 0;
  if (def.kind === "inventory") return blob.inv ? 1 : 0;
  return 0;
}

function mapRow(def, blob, extras = {}) {
  const cur = progressFor(def, blob);
  const target = def.target;
  const done = cur >= target;
  const id = extras.id ?? def.id;
  const claimed = Boolean(blob.claimed[id]);
  return {
    ...def,
    id,
    current: Math.min(cur, target),
    done,
    claimed,
    canClaim: done && !claimed,
    rewardCoins: def.rewardCoins ?? 0,
    rewardGold: def.rewardGold ?? 0,
    ...extras,
  };
}

function buildChainRow(blob) {
  if (!blob.chainStarted || blob.chainDone) return null;
  if (blob.chainTier >= CHAIN_QUEST_DEFS.length) return null;
  const def = CHAIN_QUEST_DEFS[blob.chainTier];
  const id = `chain_${blob.chainTier}`;
  return mapRow(def, blob, {
    id,
    isChain: true,
    chainStep: blob.chainTier + 1,
    chainTotal: CHAIN_QUEST_DEFS.length,
  });
}

function grantRewards(def) {
  let coins = 0;
  let gold = 0;
  const c = Number(def.rewardCoins) || 0;
  const g = Number(def.rewardGold) || 0;
  if (c > 0) coins = CurrencySystem.addCoins(c);
  if (g > 0) {
    CurrencySystem.addGold(Math.floor(g));
    gold = Math.floor(g);
  }
  return { coins, gold };
}

function onAnySuccessfulClaim(blob) {
  if (!blob.chainStarted && !blob.chainDone) {
    blob.chainStarted = true;
  }
}

const DailyQuestSystem = {
  getSnapshot() {
    const blob = loadOrResetState();
    const rows = DAILY_QUEST_DEFS.map((def) => mapRow(def, blob));
    const chainRow = buildChainRow(blob);
    return {
      dateKey: blob.dateKey,
      rows,
      chainRow,
      chainStarted: blob.chainStarted,
      chainDone: blob.chainDone,
    };
  },

  recordMatchFinished({ won, goalsPlayer }) {
    const blob = loadOrResetState();
    blob.matchesDone += 1;
    const g = Number.isFinite(goalsPlayer) ? Math.max(0, Math.floor(goalsPlayer)) : 0;
    blob.goalsSum += g;
    if (won) blob.wins += 1;
    save(blob);
  },

  markShopVisited() {
    const blob = loadOrResetState();
    blob.shop = true;
    save(blob);
  },

  markInventoryVisited() {
    const blob = loadOrResetState();
    blob.inv = true;
    save(blob);
  },

  /**
   * Забрать награду.
   * @returns {{ ok: true, coins: number, gold: number } | { ok: false, reason: string }}
   */
  claim(questId) {
    const blob = loadOrResetState();

    if (typeof questId === "string" && questId.startsWith("chain_")) {
      const tier = Number(questId.slice("chain_".length));
      if (!Number.isInteger(tier) || tier !== blob.chainTier) return { ok: false, reason: "UNKNOWN" };
      if (!blob.chainStarted || blob.chainDone) return { ok: false, reason: "NOT_DONE" };
      const def = CHAIN_QUEST_DEFS[tier];
      if (!def) return { ok: false, reason: "UNKNOWN" };
      if (blob.claimed[questId]) return { ok: false, reason: "ALREADY" };
      const cur = progressFor(def, blob);
      if (cur < def.target) return { ok: false, reason: "NOT_DONE" };
      blob.claimed[questId] = true;
      blob.chainTier += 1;
      if (blob.chainTier >= CHAIN_QUEST_DEFS.length) blob.chainDone = true;
      const { coins, gold } = grantRewards(def);
      save(blob);
      return { ok: true, coins, gold };
    }

    const def = DAILY_QUEST_DEFS.find((d) => d.id === questId);
    if (!def) return { ok: false, reason: "UNKNOWN" };
    if (blob.claimed[questId]) return { ok: false, reason: "ALREADY" };
    const cur = progressFor(def, blob);
    if (cur < def.target) return { ok: false, reason: "NOT_DONE" };
    blob.claimed[questId] = true;
    const { coins, gold } = grantRewards(def);
    onAnySuccessfulClaim(blob);
    save(blob);
    return { ok: true, coins, gold };
  },
};

export default DailyQuestSystem;
