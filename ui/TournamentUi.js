import SkinSystem from "../systems/SkinSystem.js";
import TournamentSystem, { TOURNAMENT_OPPONENT_COUNT } from "../systems/TournamentSystem.js";

const INTRO_DARK_HOLD = 2;
const INTRO_FADE_OUT = 0.45;
const ZOOM_DURATION = 1.35;
const PRE_MATCH_DARK = 0.55;

export const modeSelectUi = {
  backButton: { x: 20, y: 18, w: 120, h: 48 },
  ratingButton: { x: 320, y: 280, w: 560, h: 72 },
  tournamentButton: { x: 320, y: 380, w: 560, h: 72 },
};

export const tournamentUi = {
  phase: "intro",
  phaseElapsed: 0,
  overlayAlpha: 1,
  zoomT: 0,
  skipIntro: false,
  backButton: { x: 20, y: 18, w: 120, h: 48 },
  fightButton: { x: 445, y: 580, w: 310, h: 52 },
  toast: "",
  toastTimer: 0,
};

function isInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function ladderSlotY(index) {
  const bottomY = 600;
  const topY = 200;
  const t = index / (TOURNAMENT_OPPONENT_COUNT - 1);
  return bottomY + (topY - bottomY) * t;
}

export function drawModeSelectScreen(ctx, drawButton, data = {}) {
  const { cooldownText = "", onCooldown = false } = data;
  const bg = ctx.createLinearGradient(0, 0, 0, 700);
  bg.addColorStop(0, "#0b1324");
  bg.addColorStop(1, "#111b33");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 700);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial";
  ctx.fillText("Выбор режима", 600, 120);

  drawButton(modeSelectUi.backButton, "Назад", "#455a64");
  drawButton(modeSelectUi.ratingButton, "Рейтинг", "#2e7d32");
  const tourColor = onCooldown ? "#546e7a" : "#8a5cff";
  drawButton(modeSelectUi.tournamentButton, onCooldown ? "Турнир (кулдаун)" : "Турнир", tourColor);

  ctx.font = "22px Arial";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("Рейтинг — обычный матч с изменением MMR", 600, 250);
  ctx.fillText("Турнир — лестница из 10 ботов, без MMR", 600, 360);

  if (onCooldown) {
    ctx.fillStyle = "#ffab91";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`Следующий турнир через ${cooldownText}`, 600, 470);
  }
}

export function getModeSelectActionAt(x, y) {
  if (isInRect(x, y, modeSelectUi.backButton)) return "BACK";
  if (isInRect(x, y, modeSelectUi.ratingButton)) return "RATING";
  if (isInRect(x, y, modeSelectUi.tournamentButton)) return "TOURNAMENT";
  return null;
}

export function beginTournamentIntro(resumed) {
  tournamentUi.phase = resumed ? "ladder" : "intro";
  tournamentUi.phaseElapsed = 0;
  tournamentUi.overlayAlpha = resumed ? 0 : 1;
  tournamentUi.zoomT = 0;
  tournamentUi.skipIntro = resumed;
}

export function updateTournamentFlow(dt, onReadyForMatch) {
  tournamentUi.phaseElapsed += dt;
  if (tournamentUi.toastTimer > 0) {
    tournamentUi.toastTimer = Math.max(0, tournamentUi.toastTimer - dt);
  }

  if (tournamentUi.phase === "intro") {
    if (tournamentUi.phaseElapsed < INTRO_DARK_HOLD) {
      tournamentUi.overlayAlpha = 1;
    } else if (tournamentUi.phaseElapsed < INTRO_DARK_HOLD + INTRO_FADE_OUT) {
      const t = (tournamentUi.phaseElapsed - INTRO_DARK_HOLD) / INTRO_FADE_OUT;
      tournamentUi.overlayAlpha = 1 - t;
    } else {
      tournamentUi.phase = "ladder";
      tournamentUi.overlayAlpha = 0;
      tournamentUi.phaseElapsed = 0;
    }
    return;
  }

  if (tournamentUi.phase === "zoom") {
    tournamentUi.zoomT = Math.min(1, tournamentUi.phaseElapsed / ZOOM_DURATION);
    if (tournamentUi.phaseElapsed >= ZOOM_DURATION) {
      tournamentUi.phase = "pre_match";
      tournamentUi.phaseElapsed = 0;
      tournamentUi.overlayAlpha = 0;
    }
    return;
  }

  if (tournamentUi.phase === "pre_match") {
    tournamentUi.overlayAlpha = Math.min(1, tournamentUi.phaseElapsed / PRE_MATCH_DARK);
    if (tournamentUi.phaseElapsed >= PRE_MATCH_DARK + 0.15) {
      tournamentUi.phase = "ladder";
      tournamentUi.overlayAlpha = 0;
      tournamentUi.phaseElapsed = 0;
      if (typeof onReadyForMatch === "function") onReadyForMatch();
    }
  }
}

export function startTournamentFightAnim() {
  tournamentUi.phase = "zoom";
  tournamentUi.phaseElapsed = 0;
  tournamentUi.zoomT = 0;
}

export function drawTournamentScreen(ctx, drawButton, uiTime) {
  const snap = TournamentSystem.getSnapshot();
  const bg = ctx.createLinearGradient(0, 0, 0, 700);
  bg.addColorStop(0, "#0a1628");
  bg.addColorStop(1, "#0f2038");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 700);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px Arial";
  ctx.fillText("Турнир", 600, 72);

  if (snap.onCooldown) {
    ctx.fillStyle = "#ffab91";
    ctx.font = "bold 22px Arial";
    ctx.fillText(`Кулдаун: ${snap.cooldownText}`, 600, 108);
  } else {
    ctx.font = "20px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`Раунд ${snap.currentRound + 1} / ${TOURNAMENT_OPPONENT_COUNT}`, 600, 108);
  }

  const ladderX = 600;
  const railW = 8;
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(ladderX - railW / 2, ladderSlotY(0) - 30, railW, ladderSlotY(TOURNAMENT_OPPONENT_COUNT - 1) - ladderSlotY(0) + 60);

  for (let i = 0; i < TOURNAMENT_OPPONENT_COUNT; i += 1) {
    const y = ladderSlotY(i);
    const opp = TournamentSystem.getOpponentDef(i);
    const defeated = snap.defeated[i];
    const isCurrent = snap.currentRound === i && snap.canFight;
    const skin = opp.skin;

    let zoomScale = 1;
    let zoomOffsetY = 0;
    if (tournamentUi.phase === "zoom" && i === snap.currentRound) {
      const e = tournamentUi.zoomT;
      const eased = 1 - (1 - e) ** 3;
      zoomScale = 1 + eased * 0.85;
      zoomOffsetY = -eased * 18;
    }

    ctx.save();
    ctx.translate(ladderX, y + zoomOffsetY);
    ctx.scale(zoomScale, zoomScale);

    const cardW = 520;
    const cardH = 46;
    ctx.fillStyle = defeated
      ? "rgba(80,80,90,0.35)"
      : isCurrent
        ? "rgba(138,92,255,0.28)"
        : "rgba(255,255,255,0.08)";
    ctx.strokeStyle = isCurrent ? "#b388ff" : defeated ? "rgba(120,120,130,0.5)" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = isCurrent ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 10);
    ctx.fill();
    ctx.stroke();

    const r = 20;
    const cx = -cardW / 2 + 36;
    if (defeated) ctx.globalAlpha = 0.45;
    SkinSystem.drawSkinInCircle(ctx, skin, cx, 0, r);
    ctx.beginPath();
    ctx.arc(cx, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = defeated ? "#9e9e9e" : "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = defeated ? "#9e9e9e" : "#ffffff";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`${i + 1}. ${opp.name}`, -cardW / 2 + 72, -6);
    ctx.font = "14px Arial";
    ctx.fillStyle = defeated ? "#757575" : "rgba(255,255,255,0.65)";
    ctx.fillText(defeated ? "Побеждён" : isCurrent ? "Следующий бой" : "Ожидает", -cardW / 2 + 72, 14);

    ctx.textAlign = "right";
    ctx.fillStyle = defeated ? "#757575" : "#ffe082";
    ctx.font = "bold 13px Arial";
    const diffLabel = i === 0 ? "★" : i < 4 ? "★★" : i < 7 ? "★★★" : "★★★★";
    ctx.fillText(diffLabel, cardW / 2 - 16, 0);

    ctx.restore();
  }

  if (tournamentUi.phase === "ladder" && snap.canFight) {
    drawButton(tournamentUi.fightButton, "В бой", "#c62828");
  } else if (tournamentUi.phase === "ladder" && snap.onCooldown) {
    drawButton(tournamentUi.fightButton, "Кулдаун", "#546e7a");
  }

  drawButton(tournamentUi.backButton, "Назад", "#455a64");

  if (tournamentUi.toastTimer > 0 && tournamentUi.toast) {
    ctx.textAlign = "center";
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = "#a5d6a7";
    ctx.fillText(tournamentUi.toast, 600, 660);
  }

  if (tournamentUi.overlayAlpha > 0.01) {
    ctx.fillStyle = `rgba(0,0,0,${tournamentUi.overlayAlpha * 0.92})`;
    ctx.fillRect(0, 0, 1200, 700);
    if (tournamentUi.phase === "intro" && tournamentUi.phaseElapsed < INTRO_DARK_HOLD) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial";
      ctx.fillText("Турнир начинается…", 600, 350);
    }
  }
}

export function getTournamentActionAt(x, y) {
  if (tournamentUi.phase !== "ladder") return null;
  if (isInRect(x, y, tournamentUi.backButton)) return "BACK";
  if (isInRect(x, y, tournamentUi.fightButton)) return "FIGHT";
  return null;
}

export function setTournamentToast(text, sec = 2.5) {
  tournamentUi.toast = text;
  tournamentUi.toastTimer = sec;
}
