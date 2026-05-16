import StorageSystem from './StorageSystem.js';

const MIN_MMR_DELTA = 50;
const MAX_MMR_DELTA = 100;
const MIN_ELO = 0;

function getRandomMmrDelta() {
  return Math.floor(Math.random() * (MAX_MMR_DELTA - MIN_MMR_DELTA + 1)) + MIN_MMR_DELTA;
}

/** Смещение MMR противника-матачмейка: случайный знак × [50…100]. */
function rollBotMmrOffset() {
  const magnitude = getRandomMmrDelta();
  return (Math.random() < 0.5 ? -1 : 1) * magnitude;
}

const EloSystem = {
  getElo() {
    return StorageSystem.getElo();
  },

  /**
   * MMR бота перед матчем: твой MMR ± случайное 50–100 (не ниже 0).
   */
  pickBotMmrForMatch(playerMmr) {
    const base = Number.isFinite(playerMmr) ? playerMmr : this.getElo();
    const offset = rollBotMmrOffset();
    return Math.max(MIN_ELO, base + offset);
  },

  applyWin() {
    const reward = getRandomMmrDelta();
    StorageSystem.setElo(this.getElo() + reward);
    return reward;
  },

  applyLoss() {
    const penalty = getRandomMmrDelta();
    const newElo = Math.max(MIN_ELO, this.getElo() - penalty);
    StorageSystem.setElo(newElo);
    return -penalty;
  },

  /** Досрочный выход из матча — фиксированный штраф MMR. */
  applyForfeit(fixedPenalty = 40) {
    const penalty = Math.max(0, Math.floor(Number(fixedPenalty)) || 40);
    const newElo = Math.max(MIN_ELO, this.getElo() - penalty);
    StorageSystem.setElo(newElo);
    return -penalty;
  },
};

export default EloSystem;
