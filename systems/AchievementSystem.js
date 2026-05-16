import StorageSystem from "./StorageSystem.js";
import CurrencySystem from "./CurrencySystem.js";
import EloSystem from "./EloSystem.js";
import SkinSystem from "./SkinSystem.js";
import TrophySystem from "./TrophySystem.js";

function emptyStats() {
  return {
    matches: 0,
    wins: 0,
    goals: 0,
    cases: 0,
    questsClaimed: 0,
    claimed: {},
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

/** Постоянные достижения (не сбрасываются). */
export const ACHIEVEMENT_DEFS = [
  {
    id: "first_win",
    title: "Первая победа",
    description: "Выиграйте 1 матч.",
    kind: "wins",
    target: 1,
    rewardCoins: 30,
    rewardGold: 25,
  },
  {
    id: "wins_10",
    title: "Десятка",
    description: "10 побед за всё время.",
    kind: "wins",
    target: 10,
    rewardCoins: 80,
    rewardGold: 50,
  },
  {
    id: "wins_50",
    title: "Ветеран",
    description: "50 побед за всё время.",
    kind: "wins",
    target: 50,
    rewardCoins: 150,
    rewardGold: 100,
  },
  {
    id: "matches_25",
    title: "На поле",
    description: "25 завершённых матчей.",
    kind: "matches",
    target: 25,
    rewardCoins: 50,
    rewardGold: 40,
  },
  {
    id: "goals_20",
    title: "Голеадор",
    description: "20 голов суммарно.",
    kind: "goals",
    target: 20,
    rewardCoins: 60,
    rewardGold: 35,
  },
  {
    id: "goals_100",
    title: "Снайпер",
    description: "100 голов суммарно.",
    kind: "goals",
    target: 100,
    rewardCoins: 120,
    rewardGold: 80,
  },
  {
    id: "elo_100",
    title: "Бронза+",
    description: "Достигните MMR 100.",
    kind: "elo",
    target: 100,
    rewardCoins: 40,
    rewardGold: 30,
  },
  {
    id: "elo_300",
    title: "Серебро",
    description: "Достигните MMR 300.",
    kind: "elo",
    target: 300,
    rewardCoins: 80,
    rewardGold: 60,
  },
  {
    id: "skins_5",
    title: "Коллекционер",
    description: "Имейте 5 скинов в инвентаре.",
    kind: "skins",
    target: 5,
    rewardCoins: 50,
    rewardGold: 40,
  },
  {
    id: "skins_15",
    title: "Архивариус",
    description: "Имейте 15 скинов в инвентаре.",
    kind: "skins",
    target: 15,
    rewardCoins: 100,
    rewardGold: 70,
  },
  {
    id: "quests_10",
    title: "Квестоман",
    description: "Заберите 10 наград ежедневных квестов.",
    kind: "quests_claimed",
    target: 10,
    rewardCoins: 70,
    rewardGold: 50,
  },
  {
    id: "cases_5",
    title: "Азарт",
    description: "Откройте 5 кейсов.",
    kind: "cases",
    target: 5,
    rewardCoins: 60,
    rewardGold: 45,
  },
  {
    id: "trophies_10",
    title: "Кубковая десятка",
    description: "Соберите 10 кубков.",
    kind: "trophies",
    target: 10,
    rewardCoins: 55,
    rewardGold: 40,
  },
];

function loadStats() {
  let blob = StorageSystem.getAchievementsBlob();
  if (!blob || typeof blob !== "object") {
    blob = emptyStats();
    StorageSystem.setAchievementsBlob(blob);
  }
  blob.matches = Math.max(0, Math.floor(Number(blob.matches)) || 0);
  blob.wins = Math.max(0, Math.floor(Number(blob.wins)) || 0);
  blob.goals = Math.max(0, Math.floor(Number(blob.goals)) || 0);
  blob.cases = Math.max(0, Math.floor(Number(blob.cases)) || 0);
  blob.questsClaimed = Math.max(0, Math.floor(Number(blob.questsClaimed)) || 0);
  blob.claimed = normalizeClaimed(blob.claimed);
  return blob;
}

function save(blob) {
  StorageSystem.setAchievementsBlob(blob);
}

function liveProgress(kind, blob) {
  if (kind === "matches") return blob.matches;
  if (kind === "wins") return blob.wins;
  if (kind === "goals") return blob.goals;
  if (kind === "cases") return blob.cases;
  if (kind === "quests_claimed") return blob.questsClaimed;
  if (kind === "elo") return EloSystem.getElo();
  if (kind === "skins") return SkinSystem.getOwnedSkins().length;
  if (kind === "trophies") return TrophySystem.getTrophies();
  return 0;
}

function mapRow(def, blob) {
  const cur = liveProgress(def.kind, blob);
  const target = def.target;
  const done = cur >= target;
  const claimed = Boolean(blob.claimed[def.id]);
  return {
    ...def,
    current: Math.min(cur, target),
    done,
    claimed,
    canClaim: done && !claimed,
  };
}

function grantRewards(def) {
  let coins = 0;
  let gold = 0;
  if (def.rewardCoins > 0) coins = CurrencySystem.addCoins(def.rewardCoins);
  if (def.rewardGold > 0) gold = CurrencySystem.addGold(def.rewardGold);
  return { coins, gold };
}

const AchievementSystem = {
  ACHIEVEMENT_DEFS,

  getSnapshot() {
    const blob = loadStats();
    const rows = ACHIEVEMENT_DEFS.map((def) => mapRow(def, blob));
    const unlocked = rows.filter((r) => r.done).length;
    const claimed = rows.filter((r) => r.claimed).length;
    return { rows, unlocked, claimed, total: rows.length };
  },

  /** Список ачивок, готовых к забиранию (для глобального попапа). */
  getClaimableRows() {
    return this.getSnapshot().rows.filter((r) => r.canClaim);
  },

  onMatchFinished({ won, goalsPlayer }) {
    const blob = loadStats();
    blob.matches += 1;
    const g = Number.isFinite(goalsPlayer) ? Math.max(0, Math.floor(goalsPlayer)) : 0;
    blob.goals += g;
    if (won) blob.wins += 1;
    save(blob);
  },

  onCaseOpened() {
    const blob = loadStats();
    blob.cases += 1;
    save(blob);
  },

  onQuestRewardClaimed() {
    const blob = loadStats();
    blob.questsClaimed += 1;
    save(blob);
  },

  /**
   * @returns {{ ok: true, coins: number, gold: number, title: string } | { ok: false, reason: string }}
   */
  claim(achievementId) {
    const def = ACHIEVEMENT_DEFS.find((d) => d.id === achievementId);
    if (!def) return { ok: false, reason: "UNKNOWN" };
    const blob = loadStats();
    if (blob.claimed[achievementId]) return { ok: false, reason: "ALREADY" };
    const cur = liveProgress(def.kind, blob);
    if (cur < def.target) return { ok: false, reason: "NOT_DONE" };
    blob.claimed[achievementId] = true;
    save(blob);
    const { coins, gold } = grantRewards(def);
    return { ok: true, coins, gold, title: def.title };
  },
};

export default AchievementSystem;
