import StorageSystem from "./StorageSystem.js";
import CurrencySystem from "./CurrencySystem.js";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Награды за дни 1…7 (день 7 — главный приз). */
export const CALENDAR_DAY_REWARDS = [
  { gold: 35, coins: 25 },
  { gold: 45, coins: 30 },
  { gold: 55, coins: 35 },
  { gold: 65, coins: 40 },
  { gold: 80, coins: 45 },
  { gold: 100, coins: 55 },
  { gold: 2000, coins: 2500 },
];

function emptyState() {
  return {
    completedDays: 0,
    lastClaimDate: "",
  };
}

function migrateBlob(blob) {
  if (typeof blob.completedDays === "number") return blob;
  let completed = 0;
  if (typeof blob.streakDay === "number" && blob.lastClaimDate) {
    const claimedToday = blob.lastClaimDate === todayKey();
    const prev = Math.max(1, Math.min(7, Math.floor(blob.streakDay)));
    if (claimedToday) completed = Math.max(0, prev - 1);
    else if (blob.lastClaimDate === yesterdayKey()) completed = Math.max(0, prev - 1);
    else completed = 0;
  }
  return { completedDays: completed, lastClaimDate: blob.lastClaimDate || "" };
}

function load() {
  let blob = StorageSystem.getRewardCalendarBlob();
  if (!blob || typeof blob !== "object") {
    blob = emptyState();
    StorageSystem.setRewardCalendarBlob(blob);
  }
  blob = migrateBlob(blob);
  blob.completedDays = Math.max(0, Math.min(7, Math.floor(Number(blob.completedDays)) || 0));
  blob.lastClaimDate = typeof blob.lastClaimDate === "string" ? blob.lastClaimDate : "";
  return blob;
}

function save(blob) {
  StorageSystem.setRewardCalendarBlob(blob);
}

/** Пропуск дня сбрасывает серию. */
function syncStreak(blob) {
  const today = todayKey();
  if (!blob.lastClaimDate) return blob;
  if (blob.lastClaimDate === today) return blob;
  if (blob.lastClaimDate === yesterdayKey()) return blob;
  blob.completedDays = 0;
  return blob;
}

const RewardCalendarSystem = {
  CALENDAR_DAY_REWARDS,

  getSnapshot() {
    const blob = syncStreak(load());
    save(blob);
    const today = todayKey();
    const claimedToday = blob.lastClaimDate === today;
    const completed = blob.completedDays;
    const nextDay = completed < 7 ? completed + 1 : 1;

    const days = CALENDAR_DAY_REWARDS.map((rew, i) => {
      const dayNum = i + 1;
      let status = "locked";
      if (dayNum <= completed) status = "done";
      else if (dayNum === nextDay && !claimedToday) status = "active";
      return { day: dayNum, ...rew, status };
    });

    return {
      completedDays: completed,
      streakDay: nextDay,
      claimedToday,
      canClaimToday: !claimedToday,
      days,
    };
  },

  claimToday() {
    const blob = syncStreak(load());
    const today = todayKey();
    if (blob.lastClaimDate === today) return { ok: false, reason: "ALREADY" };

    const dayNum = blob.completedDays < 7 ? blob.completedDays + 1 : 1;
    const idx = dayNum - 1;
    const rew = CALENDAR_DAY_REWARDS[idx];
    if (!rew) return { ok: false, reason: "UNKNOWN" };

    const gold = CurrencySystem.addGold(rew.gold);
    const coins = CurrencySystem.addCoins(rew.coins);

    blob.lastClaimDate = today;
    if (dayNum >= 7) blob.completedDays = 0;
    else blob.completedDays = dayNum;
    save(blob);

    return { ok: true, gold, coins, day: dayNum };
  },
};

export default RewardCalendarSystem;
