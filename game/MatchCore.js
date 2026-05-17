import { drawField, FIELD, GOALS } from "./Field.js";
import { Player } from "./Player.js";
import { Ball } from "./Ball.js";
import { AICore } from "./AICore.js";
import { resolveCollision } from "../systems/CollisionCore.js";
import { HUDCore } from "../ui/HUDCore.js";
import EloSystem from "../systems/EloSystem.js";
import CurrencySystem from "../systems/CurrencySystem.js";
import { awardTrophyAfterMatchWin, MILESTONE_TROPHY_COUNT } from "../systems/TrophySystem.js";
import SkinSystem from "../systems/SkinSystem.js";
import StorageSystem from "../systems/StorageSystem.js";
import { AccountAuth } from "../systems/AccountAuth.js";
import { getPlayerDrawScale } from "../core/MobileLayout.js";

const WIN_SCORE = 4;
const GOAL_PAUSE_SECONDS = 2;
const RESULT_ANIM_DURATION = 1.35;

const CUP_POP_START = 0.08;
const CUP_POP_DURATION = 0.78;

/** Экран «матч найден»: заезд аватарок, затем расход через ~3 с после показа. */
const MATCH_FOUND_SLIDE_IN = 0.55;
const MATCH_FOUND_HOLD = 3;
const MATCH_FOUND_SLIDE_OUT = 0.45;
const MATCH_FOUND_TOTAL = MATCH_FOUND_HOLD + MATCH_FOUND_SLIDE_OUT;

/** Случайный ник соперника: русские имена, уменьшительные, псевдонимы, латынь. Без «кото»-темы. */
const BOT_RANDOM_NAMES = [
  "Артём",
  "Максим",
  "Даниил",
  "Егор",
  "Кирилл",
  "Никита",
  "Степан",
  "Дмитрий",
  "Александр",
  "Иван",
  "Андрей",
  "Михаил",
  "Тимофей",
  "Платон",
  "Олег",
  "Глеб",
  "Ярослав",
  "Богдан",
  "Антон",
  "Павел",
  "Семён",
  "Роман",
  "Владислав",
  "Евгений",
  "Лев",
  "Матвей",
  "Марк",
  "Руслан",
  "Вадим",
  "Константин",
  "Денис",
  "Сергей",
  "Виктор",
  "Илья",
  "Василий",
  "Николай",
  "Григорий",
  "Алексей",
  "Валентин",
  "Станислав",
  "Давид",
  "Родион",
  "Захар",
  "Мирон",
  "Георгий",
  "Тихон",
  "Дамир",
  "Арсений",
  "Дарья",
  "Мария",
  "Ксения",
  "Полина",
  "Ева",
  "Алиса",
  "Виктория",
  "Софья",
  "Кристина",
  "Юлия",
  "Анна",
  "Елизавета",
  "Варвара",
  "Милана",
  "Вероника",
  "Арина",
  "Диана",
  "Карина",
  "Валерия",
  "Маргарита",
  "Наталья",
  "Оксана",
  "Светлана",
  "Ирина",
  "Татьяна",
  "Екатерина",
  "Нина",
  "Людмила",
  "Тома",
  "Дима",
  "Саша",
  "Женя",
  "Костя",
  "Вова",
  "Петя",
  "Коля",
  "Миша",
  "Лёша",
  "Рома",
  "Ваня",
  "Катя",
  "Настя",
  "Маша",
  "Даша",
  "Лера",
  "Вика",
  "Соня",
  "Лиза",
  "Женя",
  "NeoStorm",
  "FrostLine",
  "ShadowVortex",
  "IcePick",
  "ViperSeven",
  "SilentBlade",
  "ZeroKelvin",
  "ThunderKid",
  "PixelHunter",
  "NightForge",
  "DarkWave",
  "IronPulse",
  "SwiftArrow",
  "CosmicDrift",
  "RazorMind",
  "GhostStep",
  "NovaFlash",
  "SteelRain",
  "BlurFrame",
  "EchoDrift",
  "RedComet",
  "BlueShift",
  "WildCard",
  "TopLane",
  "MidOnly",
  "CarryMode",
  "NoScope",
  "LagFree",
  "PingZero",
  "Ржавый",
  "Сталкер",
  "Громила",
  "БыстраяСтрела",
  "ТихийПоток",
  "КрасноеПеро",
  "СеверныйШторм",
  "Молот",
  "Адреналин",
  "Штормовик",
  "Ледяной",
  "Огненный",
  "СерыйВолк",
  "БелыйМедведь",
  "Орёл",
  "Сокол",
  "Буревестник",
  "Тайга",
  "Урал",
  "Сибирь",
  "Камчатка",
  "Волга",
  "Дон",
  "Кавказ",
  "Полярник",
  "Шахматист",
  "Боксёр",
  "Капитан",
  "Сержант",
  "Майор",
  "Инженер",
  "Программер",
  "Хакер",
  "Стример",
  "Диджей",
  "Рэпер",
  "Арбитр",
  "Судья",
  "Комментатор",
  "Спортивный",
  "Любитель",
  "Профи",
  "Новичок",
  "Ветеран",
  "Рекордсмен",
];

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function easeInCubic(t) {
  return t * t * t;
}

function clamp01(t) {
  return Math.max(0, Math.min(1, t));
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export class MatchCore {
  /**
   * @param {string | null} [playerSkinForMatchId] — id скина, с которым заходишь в матч (для случайного соперника не как твой).
   */
  constructor(playerSkinForMatchId = null, matchOptions = {}) {
    const isTournament = matchOptions.mode === "tournament";
    this.isTournament = isTournament;
    this.tournamentRound = isTournament ? Math.max(0, Math.floor(Number(matchOptions.tournamentRound)) || 0) : -1;

    const playerMmrSnapshot = EloSystem.getElo();
    const botMmrThisMatch = isTournament
      ? Math.max(0, playerMmrSnapshot)
      : EloSystem.pickBotMmrForMatch(playerMmrSnapshot);

    this.player = new Player({
      x: FIELD.x + FIELD.width * 0.25,
      y: FIELD.y + FIELD.height * 0.5,
      color: "#ffffff",
    });
    this.bot = new Player({
      x: FIELD.x + FIELD.width * 0.75,
      y: FIELD.y + FIELD.height * 0.5,
      color: "#ff6b6b",
    });
    this.ball = new Ball();
    const aiOpts = isTournament
      ? { skill: Number(matchOptions.botSkill) || 0.1 }
      : {
          mmrGap: botMmrThisMatch - playerMmrSnapshot,
          botMmr: botMmrThisMatch,
          playerMmr: playerMmrSnapshot,
        };
    this.ai = new AICore(this.bot, this.ball, aiOpts);
    this.botMmr = isTournament ? Math.round(80 + (Number(matchOptions.botSkill) || 0) * 920) : botMmrThisMatch;
    this._introPlayerMmr = playerMmrSnapshot;
    /** Скин соперника на экране подбора (игрок дорисовывается в main уже после этого). */
    const excludeSid =
      typeof playerSkinForMatchId === "string" && playerSkinForMatchId.length > 0
        ? playerSkinForMatchId
        : StorageSystem.getActiveSkin();
    this._matchBotSkinId =
      isTournament && typeof matchOptions.botSkinId === "string"
        ? matchOptions.botSkinId
        : SkinSystem.pickRandomBotSkinId(excludeSid);
    SkinSystem.applySkinToPlayer(this.bot, this._matchBotSkinId);
    this.introElapsed = 0;
    this.playerScore = 0;
    this.botScore = 0;
    this.goalPauseTimer = 0;
    this.isFinished = false;
    this.winnerText = "";
    this.hud = new HUDCore();
    this.playerName = AccountAuth.getDisplayName() || "Игрок";
    this.botName =
      isTournament && typeof matchOptions.botName === "string"
        ? matchOptions.botName
        : BOT_RANDOM_NAMES[Math.floor(Math.random() * BOT_RANDOM_NAMES.length)];
    this.currentMmr = EloSystem.getElo();
    this.mmrDelta = 0;
    this.goldDelta = 0;
    this.winStreakCurrent = 0;
    this.streakBonusGold = 0;
    this.streakMilestoneHit = false;
    this.coinsDelta = 0;
    /** Победа: начисление кубка и анимация на экране результата. */
    this.cupAwarded = false;
    this.trophyTotalAfter = 0;
    this.trophyMilestoneGold = 0;
    this._goalScorer = "";
    this._goalAnimTime = 0;
    this._resultAnimTime = 0;
    this._goalParticles = [];
    this._shakeTime = 0;
    this._shakePower = 0;
    // На мобиле игрок едет только когда палец «схватил» его и тянет.
    // На ПК (мышь) этот флаг игнорируется — там игрок всегда следует за курсором.
    this.isGrabbingPlayer = false;
  }

  /**
   * Пытается «схватить» игрока пальцем. Возвращает true, если касание
   * попало по игроку (с небольшим запасом для удобства).
   */
  tryGrabPlayer(x, y) {
    if (this.isFinished || this.introElapsed < MATCH_FOUND_TOTAL) return false;
    // Запас 28 px — чтобы попасть пальцем было легче.
    // На APK кружок рисуется крупнее — зона захвата совпадает с видимым размером.
    const vis = getPlayerDrawScale();
    const grabRadius = this.player.radius * vis + 28;
    const dx = x - this.player.x;
    const dy = y - this.player.y;
    if (dx * dx + dy * dy <= grabRadius * grabRadius) {
      this.isGrabbingPlayer = true;
      return true;
    }
    return false;
  }

  releasePlayer() {
    this.isGrabbingPlayer = false;
  }

  update(deltaTime, pointer, inputType = "mouse") {
    // Ограничиваем dt, чтобы избежать резких скачков физики при просадках FPS.
    const dt = Math.min(0.033, Math.max(0, deltaTime));

    this._updateGoalParticles(dt);
    this._updateShake(dt);

    if (this.introElapsed < MATCH_FOUND_TOTAL) {
      this.introElapsed = Math.min(this.introElapsed + dt, MATCH_FOUND_TOTAL);
      return;
    }

    if (this.isFinished) {
      this._resultAnimTime += dt;
      return;
    }

    if (this.goalPauseTimer > 0) {
      this.goalPauseTimer -= dt;
      if (this.goalPauseTimer <= 0) this.resetPositions();
      return;
    }

    // На тачскрине pointer работает только если игрок «схвачен» пальцем.
    // На ПК (мышь) — pointer всегда передаётся как есть, игрок едет за курсором.
    const effectivePointer =
      inputType === "touch" && !this.isGrabbingPlayer && pointer
        ? { x: pointer.x, y: pointer.y, isActive: false }
        : pointer;

    this.player.update(effectivePointer, dt);
    this.ai.update(dt);
    resolveCollision(this.player, this.ball);
    resolveCollision(this.bot, this.ball);
    this.ball.update(dt);
    resolveCollision(this.player, this.ball);
    resolveCollision(this.bot, this.ball);
    this.ball.applyWallBounce();

    const goalSide = this.checkGoal();
    if (!goalSide) return;

    if (goalSide === "left") this.botScore += 1;
    else this.playerScore += 1;

    this._goalScorer = goalSide === "right" ? "ИГРОК" : "БОТ";
    this._goalAnimTime = GOAL_PAUSE_SECONDS;
    this._emitGoalConfetti(goalSide);
    this._startShake(0.26, 10);

    if (this.playerScore >= WIN_SCORE || this.botScore >= WIN_SCORE) {
      this.isFinished = true;
      const playerWon = this.playerScore > this.botScore;
      this.winnerText = playerWon ? "ПОБЕДА" : "ПОРАЖЕНИЕ";
      if (this.isTournament) {
        this.mmrDelta = 0;
        this.coinsDelta = 0;
        this.goldDelta = 0;
        this.cupAwarded = false;
        this.trophyTotalAfter = 0;
        this.trophyMilestoneGold = 0;
        this.currentMmr = EloSystem.getElo();
      } else {
        this.mmrDelta = playerWon ? EloSystem.applyWin() : EloSystem.applyLoss();
        this.coinsDelta = playerWon ? CurrencySystem.addMatchCoinsReward() : 0;
        this.goldDelta = playerWon ? CurrencySystem.addWinReward() : 0;
        this.cupAwarded = false;
        this.trophyTotalAfter = 0;
        this.trophyMilestoneGold = 0;
        if (playerWon) {
          const tr = awardTrophyAfterMatchWin();
          this.cupAwarded = true;
          this.trophyTotalAfter = tr.newTotal;
          this.trophyMilestoneGold = tr.milestoneBonusGold;
          this.goldDelta += tr.milestoneBonusGold;
        }
        this.currentMmr = EloSystem.getElo();
      }
      this._resultAnimTime = 0;
      return;
    }

    this.goalPauseTimer = GOAL_PAUSE_SECONDS;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  draw(ctx) {
    if (this.introElapsed < MATCH_FOUND_TOTAL) {
      this._drawMatchFoundScreen(ctx);
      return;
    }

    ctx.save();
    this._applyShake(ctx);
    drawField(ctx);
    this.ball.draw(ctx);
    this.player.draw(ctx);
    this.bot.draw(ctx);
    ctx.restore();
    this._drawGoalConfetti(ctx);
    this.hud.draw(ctx, {
      leftName: this.playerName,
      rightName: this.botName,
      leftScore: this.playerScore,
      rightScore: this.botScore,
      mmr: this.currentMmr,
      opponentMmr: this.botMmr,
    });

    if (this.goalPauseTimer > 0) {
      this._drawGoalOverlay(ctx);
    }

    if (this.isFinished) {
      this._drawResultOverlay(ctx);
    }
  }

  _drawMatchFoundScreen(ctx) {
    ctx.save();
    drawField(ctx);
    ctx.fillStyle = "rgba(8, 12, 24, 0.72)";
    ctx.fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);

    const g = ctx.createRadialGradient(
      FIELD.x + FIELD.width * 0.5,
      FIELD.y + FIELD.height * 0.45,
      40,
      FIELD.x + FIELD.width * 0.5,
      FIELD.y + FIELD.height * 0.5,
      FIELD.width * 0.72,
    );
    g.addColorStop(0, "rgba(30, 50, 90, 0.35)");
    g.addColorStop(1, "rgba(6, 8, 16, 0.88)");
    ctx.fillStyle = g;
    ctx.fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);

    const cxMid = FIELD.x + FIELD.width * 0.5;
    const cyMid = FIELD.y + FIELD.height * 0.5;
    const R = 68;
    const restL = cxMid - 246;
    const restR = cxMid + 246;
    const offL = FIELD.x - R * 3.2;
    const offR = FIELD.x + FIELD.width + R * 3.2;
    const outL = FIELD.x - R * 3.6;
    const outR = FIELD.x + FIELD.width + R * 3.6;

    const tAll = this.introElapsed;

    let xLeft = restL;
    let xRight = restR;
    let alphaHud = 1;

    if (tAll < MATCH_FOUND_SLIDE_IN) {
      const pin = clamp01(tAll / MATCH_FOUND_SLIDE_IN);
      const eIn = easeOutCubic(pin);
      xLeft = offL + (restL - offL) * eIn;
      xRight = offR + (restR - offR) * eIn;
    } else if (tAll >= MATCH_FOUND_HOLD) {
      const pOut = clamp01((tAll - MATCH_FOUND_HOLD) / MATCH_FOUND_SLIDE_OUT);
      const eOut = easeInCubic(pOut);
      xLeft = restL + (outL - restL) * eOut;
      xRight = restR + (outR - restR) * eOut;
      alphaHud = 1 - pOut;
    }

    const holdPulse = tAll >= MATCH_FOUND_SLIDE_IN && tAll < MATCH_FOUND_HOLD;
    const breath = holdPulse ? 1 + 0.038 * Math.sin(tAll * 5.8) : 1;
    const fadeExit = Math.max(0, 1 - alphaHud);
    const scaleHud = breath * (1 - fadeExit * 0.2);

    const playerSkinMeta = SkinSystem.getActiveSkin();
    const botSkinMeta = SkinSystem.getSkinById(this._matchBotSkinId);

    const drawHero = (x, skin, rimColor) => {
      ctx.save();
      ctx.translate(x, cyMid);
      ctx.scale(scaleHud, scaleHud);
      ctx.shadowColor = rimColor;
      ctx.shadowBlur = 22;

      SkinSystem.drawSkinInCircle(ctx, skin, 0, 0, R);
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.94)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, R + 2, 0, Math.PI * 2);
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9 * alphaHud;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    ctx.globalAlpha = alphaHud;

    drawHero(xLeft, playerSkinMeta, "rgba(79,195,247,0.95)");
    drawHero(xRight, botSkinMeta, "rgba(255,107,107,0.95)");

    const mmrY = cyMid - R * scaleHud - 36;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 22px Arial";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.62)";
    ctx.fillStyle = "#e8faff";
    if (this.isTournament) {
      const roundLabel = `РАУНД ${this.tournamentRound + 1}/10`;
      ctx.fillStyle = "#e8faff";
      ctx.strokeText("ТУРНИР", xLeft, mmrY);
      ctx.fillText("ТУРНИР", xLeft, mmrY);
      ctx.fillStyle = "#ffe8e8";
      ctx.strokeText(roundLabel, xRight, mmrY);
      ctx.fillText(roundLabel, xRight, mmrY);
    } else {
      ctx.strokeText(`MMR ${Math.floor(this._introPlayerMmr)}`, xLeft, mmrY);
      ctx.fillText(`MMR ${Math.floor(this._introPlayerMmr)}`, xLeft, mmrY);
      ctx.fillStyle = "#ffe8e8";
      ctx.strokeStyle = "rgba(0,0,0,0.62)";
      ctx.strokeText(`MMR ${Math.floor(this.botMmr)}`, xRight, mmrY);
      ctx.fillText(`MMR ${Math.floor(this.botMmr)}`, xRight, mmrY);
    }

    ctx.font = "bold 26px Arial";
    const nickDY = R * scaleHud + 54;
    ctx.strokeStyle = "rgba(0,0,0,0.72)";
    ctx.lineWidth = 4;
    ctx.strokeText(this.playerName, xLeft, cyMid + nickDY);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(this.playerName, xLeft, cyMid + nickDY);
    ctx.strokeText(this.botName, xRight, cyMid + nickDY);
    ctx.fillStyle = "#ffdede";
    ctx.fillText(this.botName, xRight, cyMid + nickDY);

    const vsPulse = holdPulse ? 0.048 * Math.sin(tAll * 7.5) : 0;
    const vsScale = (1.12 + vsPulse) * (1 - fadeExit * 0.52);
    ctx.save();
    ctx.translate(cxMid, cyMid - 18);
    ctx.scale(vsScale, vsScale);
    ctx.shadowColor = "#ffd740";
    ctx.shadowBlur = 28 * alphaHud;
    ctx.shadowOffsetY = 0;
    ctx.font = "bold italic 92px Arial";
    ctx.lineWidth = 12;
    const vsGrad = ctx.createLinearGradient(-80, -50, 80, 60);
    vsGrad.addColorStop(0, "#fff59d");
    vsGrad.addColorStop(0.45, "#ffffff");
    vsGrad.addColorStop(1, "#ffb300");
    ctx.strokeStyle = "rgba(110,55,12,0.88)";
    ctx.globalAlpha = alphaHud;
    ctx.strokeText("VS", 0, 0);
    ctx.fillStyle = vsGrad;
    ctx.fillText("VS", 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  checkGoal() {
    const ballTop = this.ball.y - this.ball.radius;
    const ballBottom = this.ball.y + this.ball.radius;
    const inGoalWindow = ballBottom >= GOALS.left.y && ballTop <= GOALS.left.y + GOALS.left.height;

    if (!inGoalWindow) return null;
    if (this.ball.x + this.ball.radius < FIELD.x) return "left";
    if (this.ball.x - this.ball.radius > FIELD.x + FIELD.width) return "right";
    return null;
  }

  resetPositions() {
    this.player.x = FIELD.x + FIELD.width * 0.25;
    this.player.y = FIELD.y + FIELD.height * 0.5;
    this.player.vx = 0;
    this.player.vy = 0;

    this.bot.x = FIELD.x + FIELD.width * 0.75;
    this.bot.y = FIELD.y + FIELD.height * 0.5;
    this.bot.vx = 0;
    this.bot.vy = 0;

    this.ball.x = FIELD.x + FIELD.width / 2;
    this.ball.y = FIELD.y + FIELD.height / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  _drawGoalOverlay(ctx) {
    const progress = Math.min(1, (GOAL_PAUSE_SECONDS - this.goalPauseTimer) / 0.35);
    const eased = 1 - Math.pow(1 - progress, 3);
    const centerX = FIELD.x + FIELD.width / 2;
    const centerY = FIELD.y + 96 - (1 - eased) * 40;
    const scale = 0.6 + eased * 0.5;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.font = "bold 54px Arial";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.fillStyle = "#ffe54d";
    ctx.strokeText("ГОЛ!", 0, 0);
    ctx.fillText("ГОЛ!", 0, 0);

    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.strokeText(`ЗАБИЛ ${this._goalScorer}`, 0, 54);
    ctx.fillText(`ЗАБИЛ ${this._goalScorer}`, 0, 54);
    ctx.restore();
  }

  _drawResultOverlay(ctx) {
    const t = Math.min(1, this._resultAnimTime / RESULT_ANIM_DURATION);
    const eased = 1 - Math.pow(1 - t, 3);
    const cx = FIELD.x + FIELD.width / 2;
    const cy = FIELD.y + FIELD.height / 2;
    const panelW = 520;
    const panelH = this.cupAwarded ? 352 : 318;
    const panelX = cx - panelW / 2;
    const panelY = cy - panelH / 2;
    const isWin = this.mmrDelta >= 0;
    const titleColor = isWin ? "#4fc3f7" : "#ff5252";

    const titleY = panelY + (this.cupAwarded ? 76 : 92);
    const mmrY = panelY + (this.cupAwarded ? 204 : 178);
    const goldY = panelY + (this.cupAwarded ? 252 : 228);
    const coinsY = panelY + (this.cupAwarded ? 292 : 266);
    const cupY = panelY + 132;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);

    ctx.globalAlpha = 0.45 + eased * 0.55;
    ctx.fillStyle = "rgba(12,18,30,0.92)";
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.globalAlpha = 1;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 68px Arial";
    ctx.fillStyle = titleColor;
    ctx.fillText(this.winnerText, cx, titleY);

    if (this.cupAwarded) {
      const tCup = clamp01((this._resultAnimTime - CUP_POP_START) / CUP_POP_DURATION);
      const cupScale = tCup <= 0 ? 0 : easeOutBack(tCup);
      const wobble = 0.04 * Math.sin(this._resultAnimTime * 11);
      const glowPulse = 0.55 + 0.45 * Math.sin(this._resultAnimTime * 6.5);
      this._drawCupReward(ctx, cx, cupY, cupScale * (1 + wobble), glowPulse);

      ctx.font = "bold 26px Arial";
      ctx.fillStyle = "rgba(255, 243, 200, " + clamp01((tCup - 0.25) * 2) + ")";
      ctx.fillText("+1 кубок", cx, cupY + 56);
      ctx.font = "500 21px Arial";
      ctx.fillStyle = "rgba(200, 220, 255, " + clamp01((tCup - 0.35) * 2.2) + ")";
      ctx.fillText(`Всего: ${this.trophyTotalAfter}`, cx, cupY + 82);

      const sparkPhase = clamp01((tCup - 0.5) / 0.35);
      if (sparkPhase > 0) {
        this._drawCupSparkles(ctx, cx, cupY, sparkPhase, this._resultAnimTime);
      }
    }

    const mmrLabel = this.mmrDelta >= 0 ? `MMR + ${this.mmrDelta}` : `MMR - ${Math.abs(this.mmrDelta)}`;
    const visibleChars = Math.max(1, Math.floor(mmrLabel.length * eased));
    const animatedLabel = mmrLabel.slice(0, visibleChars);
    ctx.font = "bold 50px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(animatedLabel, cx, mmrY);

    if (isWin && this.winStreakCurrent >= 2) {
      const streakLabel = this.streakMilestoneHit
        ? `🔥 Серия ${this.winStreakCurrent}! Бонус серии`
        : `🔥 Серия побед: ${this.winStreakCurrent}`;
      const streakReveal = clamp01((eased - 0.15) / 0.35);
      if (streakReveal > 0.05) {
        ctx.font = "bold 22px Arial";
        ctx.fillStyle = `rgba(255, 183, 77, ${streakReveal})`;
        ctx.fillText(streakLabel, cx, titleY + 44);
      }
    }

    if (this.goldDelta > 0) {
      const goldLabel = `GOLD + ${this.goldDelta}`;
      const visibleGoldChars = Math.max(1, Math.floor(goldLabel.length * eased));
      ctx.font = "bold 34px Arial";
      ctx.fillStyle = "#ffe082";
      ctx.fillText(goldLabel.slice(0, visibleGoldChars), cx, goldY);
    }

    if (this.coinsDelta > 0) {
      const coinsLabel = `КОИНЫ + ${this.coinsDelta}`;
      const vn = Math.max(1, Math.floor(coinsLabel.length * eased));
      ctx.font = "bold 28px Arial";
      ctx.fillStyle = "#bdbdbd";
      ctx.fillText(coinsLabel.slice(0, vn), cx, coinsY);
    }

    if (this.trophyMilestoneGold > 0) {
      const bonusLabel = `${MILESTONE_TROPHY_COUNT} кубков! Бонус +${this.trophyMilestoneGold} GOLD`;
      const reveal = clamp01((eased - 0.72) / 0.28);
      if (reveal > 0.05) {
        ctx.font = "bold 22px Arial";
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.lineWidth = 4;
        const by = panelY + panelH - 34;
        ctx.strokeText(bonusLabel, cx, by);
        ctx.fillStyle =
          reveal >= 1
            ? "#69f0ae"
            : `rgba(105,240,174, ${0.4 + reveal * 0.6})`;
        ctx.fillText(bonusLabel, cx, by);
      }
    }
    ctx.restore();
  }

  /** Нарисовать стилизованный кубок (золото + подсветка). */
  _drawCupReward(ctx, x, y, scale, glowK) {
    if (scale <= 0.001) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(0.05 * Math.sin(this._resultAnimTime * 9));

    const g = ctx.createRadialGradient(-12, -18, 4, 0, -6, 48);
    g.addColorStop(0, "#fffde7");
    g.addColorStop(0.35, "#ffd54f");
    g.addColorStop(0.72, "#ff8f00");
    g.addColorStop(1, "#e65100");

    ctx.shadowColor = `rgba(255, 213, 79, ${0.55 * glowK})`;
    ctx.shadowBlur = 28 * glowK;

    ctx.beginPath();
    ctx.moveTo(-8, -32);
    ctx.lineTo(-22, -8);
    ctx.lineTo(-24, 12);
    ctx.quadraticCurveTo(-24, 22, -14, 26);
    ctx.lineTo(-18, 36);
    ctx.lineTo(-10, 40);
    ctx.lineTo(10, 40);
    ctx.lineTo(18, 36);
    ctx.lineTo(14, 26);
    ctx.quadraticCurveTo(24, 22, 24, 12);
    ctx.lineTo(22, -8);
    ctx.lineTo(8, -32);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "rgba(139,69,19,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 12, 20, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(183,106,43,0.65)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-18, -6);
    ctx.lineTo(-6, -24);
    ctx.lineTo(6, -24);
    ctx.lineTo(18, -6);
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1.25;
    ctx.stroke();

    ctx.restore();
  }

  _drawCupSparkles(ctx, cx, cy, phase, time) {
    const R = 58 + phase * 18;
    const n = 10;
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 + time * 2.2;
      const px = cx + Math.cos(a) * R * (0.85 + 0.15 * Math.sin(time * 3 + i));
      const py = cy + Math.sin(a) * R * 0.72;
      const s = phase * (4 + (i % 3));
      ctx.save();
      ctx.globalAlpha = 0.25 + phase * 0.65;
      ctx.translate(px, py);
      ctx.rotate(a + time);
      ctx.fillStyle = i % 2 === 0 ? "#fff59d" : "#ffffff";
      ctx.fillRect(-s, -s * 0.35, s * 2, s * 0.7);
      ctx.restore();
    }
  }

  _emitGoalConfetti(goalSide) {
    const count = 65;
    const spawnX = goalSide === "right" ? GOALS.right.x : GOALS.left.x + GOALS.left.width;
    const spawnY = GOALS.left.y + GOALS.left.height / 2;
    const dir = goalSide === "right" ? -1 : 1;
    const colors = goalSide === "right"
      ? ["#4fc3f7", "#ffffff", "#ffe44d", "#8be9fd"]
      : ["#ff6b6b", "#ffffff", "#ffd166", "#ff9f80"];

    for (let i = 0; i < count; i += 1) {
      const speed = 120 + Math.random() * 260;
      const spread = (Math.random() - 0.5) * 1.7;
      const vx = dir * speed * (0.75 + Math.random() * 0.7);
      const vy = Math.sin(spread) * speed * 0.55;
      this._goalParticles.push({
        x: spawnX,
        y: spawnY + (Math.random() - 0.5) * 110,
        vx,
        vy,
        life: 0.9 + Math.random() * 0.6,
        ttl: 0.9 + Math.random() * 0.6,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  _updateGoalParticles(dt) {
    for (let i = this._goalParticles.length - 1; i >= 0; i -= 1) {
      const p = this._goalParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this._goalParticles.splice(i, 1);
        continue;
      }

      p.vy += 650 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
    }
  }

  _drawGoalConfetti(ctx) {
    for (const p of this._goalParticles) {
      const alpha = Math.max(0, p.life / p.ttl);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
      ctx.restore();
    }
  }

  _startShake(duration, power) {
    this._shakeTime = Math.max(this._shakeTime, duration);
    this._shakePower = Math.max(this._shakePower, power);
  }

  _updateShake(dt) {
    if (this._shakeTime <= 0) return;
    this._shakeTime -= dt;
    if (this._shakeTime <= 0) {
      this._shakeTime = 0;
      this._shakePower = 0;
    }
  }

  _applyShake(ctx) {
    if (this._shakeTime <= 0 || this._shakePower <= 0) return;
    const fade = Math.min(1, this._shakeTime / 0.26);
    const amount = this._shakePower * fade;
    const dx = (Math.random() * 2 - 1) * amount;
    const dy = (Math.random() * 2 - 1) * amount;
    ctx.translate(dx, dy);
  }

}
