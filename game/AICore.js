import { FIELD } from "./Field.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * ИИ бота:
 * - чем выше MMR бота, тем быстрее, точнее и агрессивнее;
 * - чем ниже MMR, тем медленнее и позже принимает решения.
 */
export class AICore {
  constructor(bot, ball, options = {}) {
    this.bot = bot;
    this.ball = ball;

    let skill;
    if (Number.isFinite(options.skill)) {
      skill = clamp(options.skill, 0, 1);
    } else {
      const gap = Number.isFinite(options.mmrGap) ? clamp(options.mmrGap, -180, 180) : 0;
      const botMmr = Number.isFinite(options.botMmr) ? Math.max(0, options.botMmr) : 0;
      const playerMmr = Number.isFinite(options.playerMmr) ? Math.max(0, options.playerMmr) : 0;
      const mmrTotal = Math.max(botMmr, playerMmr, 1);
      const mmrPower = clamp(botMmr / Math.max(900, mmrTotal), 0, 1);
      const gapSkill = clamp((gap + 180) / 360, 0, 1);
      skill = clamp(gapSkill * 0.6 + mmrPower * 0.4, 0, 1);
    }

    // 0: очень слабый бот, 1: сильный
    this.skill = skill;

    this.speed = lerp(290, 560, this.skill);
    this.state = "ATTACK";

    const s = this.skill;
    this._predictLead = lerp(0.025, 0.22, s);
    this._attackBiasX = lerp(4, 38, s);
    this._peelHold = lerp(0.28, 0.48, s);
    this._wallPeelStand = lerp(88, 128, s);
    this._hugBonus = lerp(28, 66, s);

    // Слабый бот думает реже и двигается к устаревшей цели.
    this._decisionCooldown = 0;
    this._decisionInterval = lerp(0.22, 0.03, s);
    this._cachedMode = "ATTACK";
    this._cachedTarget = { x: bot.x, y: bot.y };

    this._wallPeelTimer = 0;
  }

  update(deltaTime) {
    const dt = deltaTime;
    if (!Number.isFinite(dt) || dt <= 0) return;

    const ball = this.ball;
    const bot = this.bot;
    const nearWall = isBallNearWall(ball, 50);
    const distBall = Math.hypot(bot.x - ball.x, bot.y - ball.y);
    const hugDist = bot.radius + ball.radius + 22;

    if (this._wallPeelTimer > 0) {
      this._wallPeelTimer -= dt;
      const peel = this._wallPeelTarget(ball, bot);
      this.state = "UNSTICK";
      this.bot.moveTowards(peel.x, peel.y, dt, this.speed * 0.9);
      return;
    }

    if (nearWall && distBall < hugDist + this._hugBonus) {
      this._wallPeelTimer = this._peelHold;
      const peel = this._wallPeelTarget(ball, bot);
      this.state = "UNSTICK";
      this.bot.moveTowards(peel.x, peel.y, dt, this.speed * 0.9);
      return;
    }

    this._decisionCooldown -= dt;
    if (this._decisionCooldown <= 0) {
      this._decisionCooldown = this._decisionInterval;
      if (this._isThreatAtOwnGoal(ball)) {
        this._cachedMode = "DEFEND";
        this._cachedTarget = {
          x: FIELD.x + FIELD.width * lerp(0.89, 0.83, this.skill),
          y: clamp(ball.y, FIELD.y + bot.radius, FIELD.y + FIELD.height - bot.radius),
        };
      } else {
        this._cachedMode = "ATTACK";
        this._cachedTarget = this._attackChasePoint(ball, bot, nearWall);
      }
    }

    this.state = this._cachedMode;
    this.bot.moveTowards(this._cachedTarget.x, this._cachedTarget.y, dt, this.speed);
  }

  _isThreatAtOwnGoal(ball) {
    const s = this.skill;
    if (ball.x < FIELD.x + FIELD.width * 0.42) return false;
    const deepLine = FIELD.x + FIELD.width * lerp(0.82, 0.68, s);
    if (ball.x > deepLine) return true;
    const midFrac = lerp(0.63, 0.52, s);
    const vxNeed = lerp(250, 155, s);
    if (ball.x > FIELD.x + FIELD.width * midFrac && ball.vx > vxNeed) return true;
    return false;
  }

  _wallPeelTarget(ball, bot) {
    const { x: cx, y: cy } = fieldCenter();
    let nx = cx - ball.x;
    let ny = cy - ball.y;
    const len = Math.hypot(nx, ny);
    if (len > 0.001) {
      nx /= len;
      ny /= len;
    } else {
      nx = -1;
      ny = 0;
    }
    const standBack = this._wallPeelStand;
    return {
      x: clamp(ball.x + nx * standBack, FIELD.x + bot.radius, FIELD.x + FIELD.width - bot.radius),
      y: clamp(ball.y + ny * standBack, FIELD.y + bot.radius, FIELD.y + FIELD.height - bot.radius),
    };
  }

  _attackChasePoint(ball, bot, nearWall) {
    const cx = FIELD.x + FIELD.width * 0.5;
    const cy = FIELD.y + FIELD.height * 0.5;
    const lead = this._predictLead;
    let tx = ball.x + ball.vx * lead;
    let ty = ball.y + ball.vy * lead;
    tx -= this._attackBiasX;

    if (nearWall) {
      const dx = cx - ball.x;
      const dy = cy - ball.y;
      const len = Math.hypot(dx, dy) || 1;
      const inward = lerp(58, 84, this.skill);
      const inwardX = ball.x + (dx / len) * inward;
      const inwardY = ball.y + (dy / len) * inward;
      tx = tx * 0.4 + inwardX * 0.6;
      ty = ty * 0.4 + inwardY * 0.6;
    }

    return {
      x: clamp(tx, FIELD.x + bot.radius, FIELD.x + FIELD.width - bot.radius),
      y: clamp(ty, FIELD.y + bot.radius, FIELD.y + FIELD.height - bot.radius),
    };
  }
}

function fieldCenter() {
  return { x: FIELD.x + FIELD.width * 0.5, y: FIELD.y + FIELD.height * 0.5 };
}

function isBallNearWall(ball, margin) {
  return (
    ball.x - ball.radius <= FIELD.x + margin ||
    ball.x + ball.radius >= FIELD.x + FIELD.width - margin ||
    ball.y - ball.radius <= FIELD.y + margin ||
    ball.y + ball.radius >= FIELD.y + FIELD.height - margin
  );
}
