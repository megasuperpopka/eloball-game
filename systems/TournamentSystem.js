import StorageSystem from "./StorageSystem.js";
import CurrencySystem from "./CurrencySystem.js";
import SkinSystem from "./SkinSystem.js";

export const TOURNAMENT_OPPONENT_COUNT = 10;
export const TOURNAMENT_COOLDOWN_MS = 30 * 60 * 1000;
export const TOURNAMENT_GOLD_PER_ROUND = 100;
export const TOURNAMENT_FINAL_GOLD = 3000;
export const TOURNAMENT_FINAL_COINS = 500;

/** Снизу вверх: 1-й самый слабый, 10-й самый сильный. */
const OPPONENTS = [
  { name: "Новичок", skill: 0.06 },
  { name: "Любитель", skill: 0.14 },
  { name: "Болельщик", skill: 0.22 },
  { name: "Запасной", skill: 0.32 },
  { name: "Полузащитник", skill: 0.42 },
  { name: "Капитан", skill: 0.54 },
  { name: "Ас", skill: 0.66 },
  { name: "Звезда", skill: 0.78 },
  { name: "Мастер", skill: 0.9 },
  { name: "Легенда", skill: 1 },
];

const DEFAULT_BLOB = {
  inProgress: false,
  currentRound: 0,
  defeated: [],
  opponentSkinIds: [],
  cooldownUntil: 0,
};

function nowMs() {
  return Date.now();
}

function sanitizeBlob(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BLOB, defeated: [], opponentSkinIds: [] };
  const defeated = Array.isArray(raw.defeated)
    ? raw.defeated.slice(0, TOURNAMENT_OPPONENT_COUNT).map((v) => Boolean(v))
    : [];
  while (defeated.length < TOURNAMENT_OPPONENT_COUNT) defeated.push(false);

  const opponentSkinIds = Array.isArray(raw.opponentSkinIds)
    ? raw.opponentSkinIds.slice(0, TOURNAMENT_OPPONENT_COUNT).filter((id) => typeof id === "string")
    : [];
  while (opponentSkinIds.length < TOURNAMENT_OPPONENT_COUNT) {
    opponentSkinIds.push(SkinSystem.pickRandomBotSkinId());
  }

  return {
    inProgress: Boolean(raw.inProgress),
    currentRound: Math.max(0, Math.min(TOURNAMENT_OPPONENT_COUNT - 1, Math.floor(Number(raw.currentRound)) || 0)),
    defeated,
    opponentSkinIds,
    cooldownUntil: Math.max(0, Math.floor(Number(raw.cooldownUntil)) || 0),
  };
}

function readBlob() {
  return sanitizeBlob(StorageSystem.getTournamentBlob());
}

function writeBlob(blob) {
  StorageSystem.setTournamentBlob(sanitizeBlob(blob));
}

function rollOpponentSkins() {
  const ids = [];
  const used = new Set();
  for (let i = 0; i < TOURNAMENT_OPPONENT_COUNT; i += 1) {
    let tries = 0;
    let id = SkinSystem.pickRandomBotSkinId();
    while (used.has(id) && tries < 24) {
      id = SkinSystem.pickRandomBotSkinId();
      tries += 1;
    }
    used.add(id);
    ids.push(id);
  }
  return ids;
}

function formatCooldown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const TournamentSystem = {
  OPPONENTS,

  getCooldownRemainingMs() {
    const blob = readBlob();
    const left = blob.cooldownUntil - nowMs();
    return left > 0 ? left : 0;
  },

  isOnCooldown() {
    return this.getCooldownRemainingMs() > 0;
  },

  formatCooldownRemaining() {
    return formatCooldown(this.getCooldownRemainingMs());
  },

  getSnapshot() {
    const blob = readBlob();
    const cooldownMs = this.getCooldownRemainingMs();
    const allWon = blob.defeated.every(Boolean);
    return {
      inProgress: blob.inProgress && !allWon && cooldownMs <= 0,
      currentRound: blob.currentRound,
      defeated: blob.defeated.slice(),
      opponentSkinIds: blob.opponentSkinIds.slice(),
      onCooldown: cooldownMs > 0,
      cooldownMs,
      cooldownText: formatCooldown(cooldownMs),
      allWon,
      canFight: blob.inProgress && !allWon && blob.currentRound < TOURNAMENT_OPPONENT_COUNT && cooldownMs <= 0,
    };
  },

  /** Начать или продолжить турнир (с экрана выбора режима). */
  enterTournament() {
    const cooldownMs = this.getCooldownRemainingMs();
    const blob = readBlob();

    if (cooldownMs > 0 && !blob.inProgress) {
      return { ok: true, resumed: true, viewOnly: true, onCooldown: true };
    }

    if (blob.inProgress && !blob.defeated.every(Boolean) && blob.cooldownUntil <= nowMs()) {
      return { ok: true, resumed: true };
    }

    writeBlob({
      inProgress: true,
      currentRound: 0,
      defeated: Array(TOURNAMENT_OPPONENT_COUNT).fill(false),
      opponentSkinIds: rollOpponentSkins(),
      cooldownUntil: 0,
    });
    return { ok: true, resumed: false };
  },

  getOpponentDef(roundIndex) {
    const idx = Math.max(0, Math.min(TOURNAMENT_OPPONENT_COUNT - 1, Math.floor(Number(roundIndex)) || 0));
    const meta = OPPONENTS[idx] || OPPONENTS[0];
    const blob = readBlob();
    const skinId = blob.opponentSkinIds[idx] || SkinSystem.pickRandomBotSkinId();
    return {
      roundIndex: idx,
      name: meta.name,
      skill: meta.skill,
      skinId,
      skin: SkinSystem.getSkinById(skinId),
    };
  },

  getCurrentOpponent() {
    const blob = readBlob();
    return this.getOpponentDef(blob.currentRound);
  },

  /** Параметры для MatchCore. */
  getMatchOptions() {
    const opp = this.getCurrentOpponent();
    return {
      mode: "tournament",
      tournamentRound: opp.roundIndex,
      botSkill: opp.skill,
      botName: opp.name,
      botSkinId: opp.skinId,
    };
  },

  startCooldown() {
    const blob = readBlob();
    blob.cooldownUntil = nowMs() + TOURNAMENT_COOLDOWN_MS;
    blob.inProgress = false;
    blob.currentRound = 0;
    blob.defeated = Array(TOURNAMENT_OPPONENT_COUNT).fill(false);
    writeBlob(blob);
  },

  onRoundWin() {
    const blob = readBlob();
    const round = blob.currentRound;
    if (round < 0 || round >= TOURNAMENT_OPPONENT_COUNT) {
      return { ok: false, reason: "INVALID_ROUND" };
    }

    blob.defeated[round] = true;
    let gold = CurrencySystem.addGold(TOURNAMENT_GOLD_PER_ROUND);
    let coins = 0;
    let completed = false;

    if (round >= TOURNAMENT_OPPONENT_COUNT - 1) {
      gold += CurrencySystem.addGold(TOURNAMENT_FINAL_GOLD);
      coins = CurrencySystem.addCoins(TOURNAMENT_FINAL_COINS);
      completed = true;
      blob.inProgress = false;
      blob.cooldownUntil = nowMs() + TOURNAMENT_COOLDOWN_MS;
    } else {
      blob.currentRound = round + 1;
    }

    writeBlob(blob);
    return {
      ok: true,
      roundGold: TOURNAMENT_GOLD_PER_ROUND,
      finalBonus: completed,
      bonusGold: completed ? TOURNAMENT_FINAL_GOLD : 0,
      bonusCoins: coins,
      totalGoldAdded: gold,
      completed,
    };
  },

  onDefeat() {
    this.startCooldown();
    return { ok: true, reason: "DEFEAT" };
  },

  getLastResultMessage(result) {
    if (!result?.ok) return "";
    if (result.completed) {
      return `Турнир пройден! +${TOURNAMENT_GOLD_PER_ROUND} gold за раунд, +${TOURNAMENT_FINAL_GOLD} gold и +${TOURNAMENT_FINAL_COINS} коинов`;
    }
    return `Победа! +${TOURNAMENT_GOLD_PER_ROUND} gold`;
  },
};

export default TournamentSystem;
