import StorageSystem from "./StorageSystem.js";
import CurrencySystem from "./CurrencySystem.js";

export const WEEKLY_REWARD_GOLD = 1000;
export const WEEKLY_REWARD_COINS = 1500;

/** Понедельник текущей недели (локальное время). */
function weekKey() {
  const d = new Date();
  const day = d.getDay();
  const toMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + toMon);
  const y = mon.getFullYear();
  const m = String(mon.getMonth() + 1).padStart(2, "0");
  const dayNum = String(mon.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

/** Цели ~в 3 раза сложнее ежедневных (на всю неделю). */
export const WEEKLY_QUEST_POOL = [
  {
    id: "weekly_wins_24",
    title: "Завоеватель недели",
    description: "Выиграйте 24 матча за неделю.",
    kind: "wins",
    target: 24,
    rewardCoins: WEEKLY_REWARD_COINS,
    rewardGold: WEEKLY_REWARD_GOLD,
  },
  {
    id: "weekly_matches_60",
    title: "Марафон недели",
    description: "Завершите 60 матчей за неделю.",
    kind: "matches",
    target: 60,
    rewardCoins: WEEKLY_REWARD_COINS,
    rewardGold: WEEKLY_REWARD_GOLD,
  },
  {
    id: "weekly_goals_105",
    title: "Налёт недели",
    description: "Забейте 105 голов суммарно за неделю.",
    kind: "goals",
    target: 105,
    rewardCoins: WEEKLY_REWARD_COINS,
    rewardGold: WEEKLY_REWARD_GOLD,
  },
];

function pickQuestForWeek(wk) {
  let h = 0;
  for (let i = 0; i < wk.length; i += 1) h = (h * 31 + wk.charCodeAt(i)) >>> 0;
  return WEEKLY_QUEST_POOL[h % WEEKLY_QUEST_POOL.length];
}

function emptyState(wk, questId) {
  return {
    weekKey: wk,
    questId,
    matches: 0,
    wins: 0,
    goals: 0,
    claimed: false,
  };
}

function loadOrReset() {
  const wk = weekKey();
  let blob = StorageSystem.getWeeklyQuestBlob();
  const quest = pickQuestForWeek(wk);
  if (!blob || typeof blob !== "object" || blob.weekKey !== wk) {
    blob = emptyState(wk, quest.id);
    StorageSystem.setWeeklyQuestBlob(blob);
  } else if (blob.questId !== quest.id) {
    blob.questId = quest.id;
    blob.matches = 0;
    blob.wins = 0;
    blob.goals = 0;
    blob.claimed = false;
    StorageSystem.setWeeklyQuestBlob(blob);
  }
  blob.matches = Math.max(0, Math.floor(Number(blob.matches)) || 0);
  blob.wins = Math.max(0, Math.floor(Number(blob.wins)) || 0);
  blob.goals = Math.max(0, Math.floor(Number(blob.goals)) || 0);
  blob.claimed = Boolean(blob.claimed);
  return { blob, def: quest };
}

function progressFor(kind, blob) {
  if (kind === "matches") return blob.matches;
  if (kind === "goals") return blob.goals;
  if (kind === "wins") return blob.wins;
  return 0;
}

const WeeklyQuestSystem = {
  WEEKLY_QUEST_POOL,
  WEEKLY_REWARD_GOLD,
  WEEKLY_REWARD_COINS,

  getSnapshot() {
    const { blob, def } = loadOrReset();
    const cur = progressFor(def.kind, blob);
    const done = cur >= def.target;
    const claimed = blob.claimed;
    return {
      weekKey: blob.weekKey,
      row: {
        ...def,
        current: Math.min(cur, def.target),
        done,
        claimed,
        canClaim: done && !claimed,
      },
    };
  },

  recordMatchFinished({ won, goalsPlayer }) {
    const { blob } = loadOrReset();
    blob.matches += 1;
    const g = Number.isFinite(goalsPlayer) ? Math.max(0, Math.floor(goalsPlayer)) : 0;
    blob.goals += g;
    if (won) blob.wins += 1;
    StorageSystem.setWeeklyQuestBlob(blob);
  },

  claim() {
    const { blob, def } = loadOrReset();
    if (blob.claimed) return { ok: false, reason: "ALREADY" };
    const cur = progressFor(def.kind, blob);
    if (cur < def.target) return { ok: false, reason: "NOT_DONE" };
    blob.claimed = true;
    StorageSystem.setWeeklyQuestBlob(blob);
    const coins = CurrencySystem.addCoins(def.rewardCoins);
    const gold = CurrencySystem.addGold(def.rewardGold);
    return { ok: true, coins, gold, title: def.title };
  },
};

export default WeeklyQuestSystem;
