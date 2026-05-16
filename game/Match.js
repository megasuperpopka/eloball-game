import { drawField, FIELD, GOALS } from "./Field.js";
import { Player } from "./Player.js";
import { Ball } from "./Ball.js";
import { resolveCollision } from "../systems/CollisionCore.js";

const WIN_SCORE = 4;
const GOAL_PAUSE_SECONDS = 2;

export class Match {
  constructor() {
    this.player = new Player();
    this.ball = new Ball();
    this.playerScore = 0;
    this.botScore = 0;
    this.goalPauseTimer = 0;
    this.isFinished = false;
    this.winnerText = "";
  }

  update(deltaTime, pointer) {
    if (this.isFinished) return;

    if (this.goalPauseTimer > 0) {
      this.goalPauseTimer -= deltaTime;
      if (this.goalPauseTimer <= 0) {
        this.resetPositions();
      }
      return;
    }

    this.player.update(pointer, deltaTime);
    this.ball.update(deltaTime);
    resolveCollision(this.player, this.ball);

    const goalSide = this.checkGoal();
    if (goalSide) {
      if (goalSide === "left") {
        this.botScore += 1;
      } else {
        this.playerScore += 1;
      }

      if (this.playerScore >= WIN_SCORE || this.botScore >= WIN_SCORE) {
        this.isFinished = true;
        this.winnerText = this.playerScore > this.botScore ? "Победа!" : "Поражение!";
      } else {
        this.goalPauseTimer = GOAL_PAUSE_SECONDS;
        this.ball.vx = 0;
        this.ball.vy = 0;
      }
    }
  }

  draw(ctx) {
    drawField(ctx);
    this.ball.draw(ctx);
    this.player.draw(ctx);
    this.drawHud(ctx);
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

    this.ball.x = FIELD.x + FIELD.width / 2;
    this.ball.y = FIELD.y + FIELD.height / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  drawHud(ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${this.playerScore} : ${this.botScore}`, FIELD.x + FIELD.width / 2, 12);

    if (this.goalPauseTimer > 0) {
      ctx.font = "bold 42px Arial";
      ctx.fillText("GOAL!", FIELD.x + FIELD.width / 2, FIELD.y + 60);
    }

    if (this.isFinished) {
      ctx.font = "bold 44px Arial";
      ctx.fillText(this.winnerText, FIELD.x + FIELD.width / 2, FIELD.y + FIELD.height / 2 - 20);
    }
  }
}
import { Field, FIELD_CONFIG } from './Field.js';
import { Player } from './Player.js';
import { Ball } from './Ball.js';
import { resolveCircleCollision, checkGoal } from '../systems/Physics.js';
import { HUD } from '../ui/HUD.js';
import { AIController } from './AI.js';
import EloSystem from '../systems/EloSystem.js';
import CurrencySystem from '../systems/CurrencySystem.js';
import { effectsManager } from '../core/EffectsManager.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import AudioManager from '../core/AudioManager.js';

const START = {
  player: { x: 300, y: 350 },
  bot:    { x: 900, y: 350 },
  ball:   { x: 600, y: 350 },
};

const GOALS_TO_WIN = 4;
const GOAL_PAUSE_SEC = 2;

export class Match {
  constructor(
    getPointerFn,
    playerSkin = { type: 'color', value: '#4fc3f7' },
    botSkin    = { type: 'color', value: '#ef5350' },
    botName    = 'Бот',
    botElo     = 0,
  ) {
    this._getPointer = getPointerFn;
    this._botName    = botName;

    this._field  = new Field();
    this.player  = new Player(START.player.x, START.player.y, playerSkin);
    this.bot     = new Player(START.bot.x, START.bot.y, botSkin);
    this.ball    = new Ball(START.ball.x, START.ball.y);

    this.scoreLeft = 0;
    this.scoreRight = 0;

    this._hud = new HUD();
    this._ai = new AIController(this.bot, this.ball, botElo);
    this.state = 'playing';
    this._goalTimer = 0;
    this._lastGoal = null;
    this.onFinished = null;
    this._particles = new ParticleSystem();

    AudioManager.load('kick', 'assets/sounds/skins/soccer_kick_sound.mp3');
    this._kickCooldown = 0;
    this._eloChange = 0;
    this._goldEarned = 0;
    this._resultsApplied = false;
  }

  update(dt) {
    if (this.state === 'playing') this._updatePlaying(dt);
    else if (this.state === 'goal') this._updateGoal(dt);
    this._particles.update(dt);
  }

  draw(ctx) {
    ctx.save();
    effectsManager.applyShake(ctx);
    this._field.draw(ctx);
    this.ball.draw(ctx);
    this.player.draw(ctx);
    this.bot.draw(ctx);
    ctx.restore();

    this._particles.draw(ctx);
    this._hud.draw(ctx, this.scoreRight, this.scoreLeft, 'Игрок', this._botName, EloSystem.getElo(), CurrencySystem.getGold());
    if (this.state === 'goal') this._drawGoalOverlay(ctx);
  }

  _drawGoalOverlay(ctx) {
    const { width, height } = FIELD_CONFIG;
    const cx = width / 2;
    const cy = height / 2;
    const elapsed = GOAL_PAUSE_SEC - this._goalTimer;

    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, width, height);

    const flashAlpha = Math.max(0, 0.75 - elapsed * 1.5);
    if (flashAlpha > 0) {
      const isPlayerGoal = this._lastGoal === 'right';
      const r = isPlayerGoal ? 80 : 255;
      const g = isPlayerGoal ? 180 : 80;
      const b = isPlayerGoal ? 255 : 80;
      ctx.fillStyle = `rgba(${r},${g},${b},${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    const flyProgress = Math.min(1, elapsed / 0.25);
    const eased = 1 - Math.pow(1 - flyProgress, 3);
    const textY = cy + 80 * (1 - eased);
    const scale = 0.5 + eased * 0.9 + Math.sin(elapsed * 8) * 0.03 * flyProgress;

    ctx.save();
    ctx.translate(cx, textY);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 96px Arial';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 7;
    ctx.fillStyle = '#ffe44d';
    ctx.strokeText('ГОЛ!', 0, 0);
    ctx.fillText('ГОЛ!', 0, 0);
    ctx.restore();

    const nameAlpha = Math.min(1, Math.max(0, (elapsed - 0.2) * 4));
    if (nameAlpha > 0) {
      const scorer = this._lastGoal === 'right' ? 'Игрок' : this._botName;
      ctx.save();
      ctx.globalAlpha = nameAlpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 28px Arial';
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.lineWidth = 4;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeText(`Гол забил: ${scorer}`, cx, cy + 70);
      ctx.fillText(`Гол забил: ${scorer}`, cx, cy + 70);
      ctx.restore();
    }
  }

  resetPositions() {
    this.player.x = START.player.x;
    this.player.y = START.player.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.bot.x = START.bot.x;
    this.bot.y = START.bot.y;
    this.bot.vx = 0;
    this.bot.vy = 0;
    this.ball.x = START.ball.x;
    this.ball.y = START.ball.y;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  _updatePlaying(dt) {
    const ptr = this._getPointer();
    this.player.update(dt, ptr.x, ptr.y);
    this._ai.update(dt);
    this.ball.update(dt);

    const playerKick = resolveCircleCollision(this.player, this.ball);
    const botKick = resolveCircleCollision(this.bot, this.ball);
    if ((playerKick || botKick) && this._kickCooldown <= 0) {
      AudioManager.play('kick');
      this._kickCooldown = 0.12;
    }
    if (this._kickCooldown > 0) this._kickCooldown -= dt;

    this.ball.bounceWalls();
    const goal = checkGoal(this.ball, FIELD_CONFIG);
    if (goal) this._onGoal(goal);
  }

  _updateGoal(dt) {
    this._goalTimer -= dt;
    if (this._goalTimer <= 0) {
      this.resetPositions();
      this.state = 'playing';
    }
  }

  _onGoal(side) {
    this._lastGoal = side;
    if (side === 'left') this.scoreLeft += 1;
    else this.scoreRight += 1;

    if (this.scoreLeft >= GOALS_TO_WIN || this.scoreRight >= GOALS_TO_WIN) {
      this.state = 'finished';
      if (!this._resultsApplied) {
        this._resultsApplied = true;
        const winner = this.scoreRight >= GOALS_TO_WIN ? 'player' : 'bot';
        if (winner === 'player') {
          this._eloChange = EloSystem.applyWin();
          this._goldEarned = CurrencySystem.addWinReward();
        } else {
          this._eloChange = EloSystem.applyLoss();
          this._goldEarned = 0;
        }
      }
      if (typeof this.onFinished === 'function') {
        const winner = this.scoreRight >= GOALS_TO_WIN ? 'player' : 'bot';
        this.onFinished(winner, this._eloChange, this._goldEarned);
      }
      return;
    }

    this._goalTimer = GOAL_PAUSE_SEC;
    this.state = 'goal';
    effectsManager.shake(10, 0.4);
    this._emitGoalParticles(side);
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  _emitGoalParticles(side) {
    const { goalTop, goalBottom, left, right } = FIELD_CONFIG;
    const cy = (goalTop + goalBottom) / 2;
    const playerColors = ['#4fc3f7', '#81d4fa', '#ffffff', '#ffe44d', '#b3e5fc'];
    const botColors = ['#ef5350', '#ff8a65', '#ffffff', '#ffe44d', '#ffccbc'];

    if (side === 'right') this._particles.emit(right, cy, 55, playerColors, { spreadY: 120, speed: 380 });
    else this._particles.emit(left, cy, 55, botColors, { spreadY: 120, speed: 380 });
  }
}
/*
import { Field, FIELD_CONFIG } from './Field.js';
import { Player } from './Player.js';
import { Ball } from './Ball.js';
import { resolveCircleCollision, checkGoal } from '../systems/Physics.js';
import { HUD } from '../ui/HUD.js';
import { AIController } from './AI.js';
import EloSystem from '../systems/EloSystem.js';
import CurrencySystem from '../systems/CurrencySystem.js';
import { effectsManager } from '../core/EffectsManager.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import AudioManager from '../core/AudioManager.js';

// Стартовые позиции
const START = {
  player: { x: 300, y: 350 },
  bot:    { x: 900, y: 350 },
  ball:   { x: 600, y: 350 },
};

const GOALS_TO_WIN = 4;
const GOAL_PAUSE_SEC = 2;

export class Match {
  /**
   * @param {function(): {x: number, y: number}} getPointerFn
   * @param {{ type: string, value: any }} [playerSkin] - скин игрока
   * @param {{ type: string, value: any }} [botSkin]    - скин бота
   * @param {string} [botName]                          - ник бота
   * @param {number} [botElo]                           - рейтинг бота (определяет сложность)
   */
  constructor(
    getPointerFn,
    playerSkin = { type: 'color', value: '#4fc3f7' },
    botSkin    = { type: 'color', value: '#ef5350' },
    botName    = 'Бот',
    botElo     = 0,
  ) {
    this._getPointer = getPointerFn;
    this._botName    = botName;

    this._field  = new Field();
    this.player  = new Player(START.player.x, START.player.y, playerSkin);
    this.bot     = new Player(START.bot.x,    START.bot.y,    botSkin);
    this.ball    = new Ball(START.ball.x, START.ball.y);

    this.scoreLeft  = 0; // голы в левые ворота  → очко правому (боту)
    this.scoreRight = 0; // голы в правые ворота → очко левому (игроку)

    this._hud = new HUD();
    this._ai  = new AIController(this.bot, this.ball, botElo);

    /** @type {'playing' | 'goal' | 'finished'} */
    this.state = 'playing';

    this._goalTimer = 0;  // обратный отсчёт после гола
    this._lastGoal  = null; // 'left' | 'right' — какие ворота пробиты

    /** @type {function(string): void | null} */
    this.onFinished = null;

    this._particles = new ParticleSystem();

    // Звук удара по мячу
    AudioManager.load('kick', 'assets/sounds/skins/soccer_kick_sound.mp3');
    this._kickCooldown = 0; // задержка между звуками (сек), чтобы не спамил

    // Результаты матча (заполняются при завершении)
    this._eloChange   = 0;
    this._goldEarned  = 0;
    this._resultsApplied = false;
  }

  // ─── Публичные методы ────────────────────────────────────────────────────────

  /**
   * Вызывается каждый кадр из Engine.
   * @param {number} dt - время кадра в секундах
   */
  update(dt) {
    if (this.state === 'playing') {
      this._updatePlaying(dt);
    } else if (this.state === 'goal') {
      this._updateGoal(dt);
    }
    // 'finished' — ничего не обновляем

    this._particles.update(dt);
  }

  /** Рисует поле, мяч, игроков и оверлеи состояний. */
  draw(ctx) {
    // Тряска применяется к игровой сцене, но не к HUD и оверлею
    ctx.save();
    effectsManager.applyShake(ctx);
    this._field.draw(ctx);
    this.ball.draw(ctx);
    this.player.draw(ctx);
    this.bot.draw(ctx);
    ctx.restore();

    // Частицы рисуем поверх поля, но под HUD и оверлеем
    this._particles.draw(ctx);

    this._hud.draw(ctx, this.scoreRight, this.scoreLeft, 'Игрок', this._botName, EloSystem.getElo(), CurrencySystem.getGold());

    if (this.state === 'goal') {
      this._drawGoalOverlay(ctx);
    }
  }

  /**
   * Анимированный оверлей при голе.
   * Фаза 1 (0–0.25s): вспышка + текст "ГОЛ!" влетает снизу и увеличивается.
   * Фаза 2 (0.25–2s): текст пульсирует, имя забившего появляется плавно.
   */
  _drawGoalOverlay(ctx) {
    const { width, height } = FIELD_CONFIG;
    const cx = width / 2;
    const cy = height / 2;

    // Время с момента гола: _goalTimer считает от GOAL_PAUSE_SEC до 0
    const elapsed = GOAL_PAUSE_SEC - this._goalTimer; // 0 → 2

    // ── Тёмный фон ─────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, width, height);

    // ── Цветная вспышка (0..0.5s, быстро затухает) ─────────────────────────────
    const flashAlpha = Math.max(0, 0.75 - elapsed * 1.5);
    if (flashAlpha > 0) {
      const isPlayerGoal = this._lastGoal === 'right';
      // Синяя вспышка — гол игрока, красная — гол бота
      const r = isPlayerGoal ? 80  : 255;
      const g = isPlayerGoal ? 180 : 80;
      const b = isPlayerGoal ? 255 : 80;
      ctx.fillStyle = `rgba(${r},${g},${b},${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    // ── "ГОЛ!" — влетает снизу и масштабируется ────────────────────────────────
    // Первые 0.25s: pos идёт от cy+80 до cy, scale от 0.5 до 1.4
    // После: слегка пульсирует
    const flyProgress = Math.min(1, elapsed / 0.25); // 0 → 1 за 0.25s
    const eased       = 1 - Math.pow(1 - flyProgress, 3); // ease-out cubic
    const textY       = cy + 80 * (1 - eased);
    const scale       = 0.5 + eased * 0.9 + Math.sin(elapsed * 8) * 0.03 * flyProgress;

    ctx.save();
    ctx.translate(cx, textY);
    ctx.scale(scale, scale);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = 'bold 96px Arial';
    ctx.strokeStyle  = 'rgba(0,0,0,0.7)';
    ctx.lineWidth    = 7;
    ctx.fillStyle    = '#ffe44d';
    ctx.strokeText('ГОЛ!', 0, 0);
    ctx.fillText('ГОЛ!', 0, 0);
    ctx.restore();

    // ── Имя забившего (появляется плавно после 0.2s) ───────────────────────────
    const nameAlpha = Math.min(1, Math.max(0, (elapsed - 0.2) * 4));
    if (nameAlpha > 0) {
      const scorer = this._lastGoal === 'right' ? 'Игрок' : this._botName;
      ctx.save();
      ctx.globalAlpha  = nameAlpha;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = 'bold 28px Arial';
      ctx.strokeStyle  = 'rgba(0,0,0,0.65)';
      ctx.lineWidth    = 4;
      ctx.fillStyle    = 'rgba(255,255,255,0.9)';
      ctx.strokeText(`Гол забил: ${scorer}`, cx, cy + 70);
      ctx.fillText(`Гол забил: ${scorer}`, cx, cy + 70);
      ctx.restore();
    }
  }

  /** Возвращает объектов на стартовые позиции и обнуляет скорости. */
  resetPositions() {
    this.player.x = START.player.x;
    this.player.y = START.player.y;
    this.player.vx = 0;
    this.player.vy = 0;

    this.bot.x = START.bot.x;
    this.bot.y = START.bot.y;
    this.bot.vx = 0;
    this.bot.vy = 0;

    this.ball.x  = START.ball.x;
    this.ball.y  = START.ball.y;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  // ─── Приватные методы ────────────────────────────────────────────────────────

  _updatePlaying(dt) {
    // Игрок движется за курсором
    const ptr = this._getPointer();
    this.player.update(dt, ptr.x, ptr.y);

    // Бот управляется AI
    this._ai.update(dt);

    // Мяч
    this.ball.update(dt);

    // Физика: столкновения + звук удара
    const playerKick = resolveCircleCollision(this.player, this.ball);
    const botKick    = resolveCircleCollision(this.bot,    this.ball);
    if ((playerKick || botKick) && this._kickCooldown <= 0) {
      AudioManager.play('kick');
      this._kickCooldown = 0.12; // не чаще раза в 0.12 сек
    }
    if (this._kickCooldown > 0) this._kickCooldown -= dt;

    // После депенетрации мяч мог уйти за границу поля — возвращаем обратно
    this.ball.bounceWalls();

    // Проверка гола
    const goal = checkGoal(this.ball, FIELD_CONFIG);
    if (goal) {
      this._onGoal(goal);
    }
  }

  _updateGoal(dt) {
    this._goalTimer -= dt;
    if (this._goalTimer <= 0) {
      this.resetPositions();
      this.state = 'playing';
    }
  }

  /** Реакция на гол: обновить счёт, запустить паузу или завершить матч. */
  _onGoal(side) {
    this._lastGoal = side;

    if (side === 'left') {
      // Мяч залетел в левые ворота → очко боту (правая сторона)
      this.scoreLeft += 1;
    } else {
      // Мяч залетел в правые ворота → очко игроку (левая сторона)
      this.scoreRight += 1;
    }

    // Проверяем победу
    if (this.scoreLeft >= GOALS_TO_WIN || this.scoreRight >= GOALS_TO_WIN) {
      this.state = 'finished';

      // Начисляем ELO и голду один раз
      if (!this._resultsApplied) {
        this._resultsApplied = true;
        const winner = this.scoreRight >= GOALS_TO_WIN ? 'player' : 'bot';
        if (winner === 'player') {
          this._eloChange  = EloSystem.applyWin();
          this._goldEarned = CurrencySystem.addWinReward();
        } else {
          this._eloChange  = EloSystem.applyLoss();
          this._goldEarned = 0;
        }
      }

      if (typeof this.onFinished === 'function') {
        const winner = this.scoreRight >= GOALS_TO_WIN ? 'player' : 'bot';
        this.onFinished(winner, this._eloChange, this._goldEarned);
      }
      return;
    }

    // Пауза перед сбросом
    this._goalTimer = GOAL_PAUSE_SEC;
    this.state = 'goal';

    // Тряска экрана при голе
    effectsManager.shake(10, 0.4);

    // Конфетти из ворот
    this._emitGoalParticles(side);

    // Останавливаем мяч сразу, чтобы он не продолжал лететь
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  /** Взрыв конфетти из ворот, куда залетел мяч. */
  _emitGoalParticles(side) {
    const { goalTop, goalBottom, left, right } = FIELD_CONFIG;
    const cy = (goalTop + goalBottom) / 2;

    // Цвета: голубые/белые — гол игрока, красные/оранжевые — гол бота
    const playerColors = ['#4fc3f7', '#81d4fa', '#ffffff', '#ffe44d', '#b3e5fc'];
    const botColors    = ['#ef5350', '#ff8a65', '#ffffff', '#ffe44d', '#ffccbc'];

    if (side === 'right') {
      // Мяч влетел в правые ворота (player забил)
      this._particles.emit(right, cy, 55, playerColors, { spreadY: 120, speed: 380 });
    } else {
      // Мяч влетел в левые ворота (bot забил)
      this._particles.emit(left, cy, 55, botColors, { spreadY: 120, speed: 380 });
    }
  }
}
*/
import { Field, FIELD_CONFIG } from './Field.js';
import { Player } from './Player.js';
import { Ball } from './Ball.js';
import { resolveCircleCollision, checkGoal } from '../systems/Physics.js';
import { HUD } from '../ui/HUD.js';
import { AIController } from './AI.js';
import EloSystem from '../systems/EloSystem.js';
import CurrencySystem from '../systems/CurrencySystem.js';
import { effectsManager } from '../core/EffectsManager.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import AudioManager from '../core/AudioManager.js';

// Стартовые позиции
const START = {
  player: { x: 300, y: 350 },
  bot:    { x: 900, y: 350 },
  ball:   { x: 600, y: 350 },
};

const GOALS_TO_WIN = 4;
const GOAL_PAUSE_SEC = 2;

export class Match {
  /**
   * @param {function(): {x: number, y: number}} getPointerFn
   * @param {{ type: string, value: any }} [playerSkin] - скин игрока
   * @param {{ type: string, value: any }} [botSkin]    - скин бота
   * @param {string} [botName]                          - ник бота
   * @param {number} [botElo]                           - рейтинг бота (определяет сложность)
   */
  constructor(
    getPointerFn,
    playerSkin = { type: 'color', value: '#4fc3f7' },
    botSkin    = { type: 'color', value: '#ef5350' },
    botName    = 'Бот',
    botElo     = 0,
  ) {
    this._getPointer = getPointerFn;
    this._botName    = botName;

    this._field  = new Field();
    this.player  = new Player(START.player.x, START.player.y, playerSkin);
    this.bot     = new Player(START.bot.x,    START.bot.y,    botSkin);
    this.ball    = new Ball(START.ball.x, START.ball.y);

    this.scoreLeft  = 0; // голы в левые ворота  → очко правому (боту)
    this.scoreRight = 0; // голы в правые ворота → очко левому (игроку)

    this._hud = new HUD();
    this._ai  = new AIController(this.bot, this.ball, botElo);

    /** @type {'playing' | 'goal' | 'finished'} */
    this.state = 'playing';

    this._goalTimer = 0;  // обратный отсчёт после гола
    this._lastGoal  = null; // 'left' | 'right' — какие ворота пробиты

    /** @type {function(string): void | null} */
    this.onFinished = null;

    this._particles = new ParticleSystem();

    // Звук удара по мячу
    AudioManager.load('kick', 'assets/sounds/skins/soccer_kick_sound.mp3');
    this._kickCooldown = 0; // задержка между звуками (сек), чтобы не спамил

    // Результаты матча (заполняются при завершении)
    this._eloChange   = 0;
    this._goldEarned  = 0;
    this._resultsApplied = false;
  }

  // ─── Публичные методы ────────────────────────────────────────────────────────

  /**
   * Вызывается каждый кадр из Engine.
   * @param {number} dt - время кадра в секундах
   */
  update(dt) {
    if (this.state === 'playing') {
      this._updatePlaying(dt);
    } else if (this.state === 'goal') {
      this._updateGoal(dt);
    }
    // 'finished' — ничего не обновляем

    this._particles.update(dt);
  }

  /** Рисует поле, мяч, игроков и оверлеи состояний. */
  draw(ctx) {
    // Тряска применяется к игровой сцене, но не к HUD и оверлею
    ctx.save();
    effectsManager.applyShake(ctx);
    this._field.draw(ctx);
    this.ball.draw(ctx);
    this.player.draw(ctx);
    this.bot.draw(ctx);
    ctx.restore();

    // Частицы рисуем поверх поля, но под HUD и оверлеем
    this._particles.draw(ctx);

    this._hud.draw(ctx, this.scoreRight, this.scoreLeft, 'Игрок', this._botName, EloSystem.getElo(), CurrencySystem.getGold());

    if (this.state === 'goal') {
      this._drawGoalOverlay(ctx);
    }
  }

  /**
   * Анимированный оверлей при голе.
   * Фаза 1 (0–0.25s): вспышка + текст "ГОЛ!" влетает снизу и увеличивается.
   * Фаза 2 (0.25–2s): текст пульсирует, имя забившего появляется плавно.
   */
  _drawGoalOverlay(ctx) {
    const { width, height } = FIELD_CONFIG;
    const cx = width / 2;
    const cy = height / 2;

    // Время с момента гола: _goalTimer считает от GOAL_PAUSE_SEC до 0
    const elapsed = GOAL_PAUSE_SEC - this._goalTimer; // 0 → 2

    // ── Тёмный фон ─────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, width, height);

    // ── Цветная вспышка (0..0.5s, быстро затухает) ─────────────────────────────
    const flashAlpha = Math.max(0, 0.75 - elapsed * 1.5);
    if (flashAlpha > 0) {
      const isPlayerGoal = this._lastGoal === 'right';
      // Синяя вспышка — гол игрока, красная — гол бота
      const r = isPlayerGoal ? 80  : 255;
      const g = isPlayerGoal ? 180 : 80;
      const b = isPlayerGoal ? 255 : 80;
      ctx.fillStyle = `rgba(${r},${g},${b},${flashAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    // ── "ГОЛ!" — влетает снизу и масштабируется ────────────────────────────────
    // Первые 0.25s: pos идёт от cy+80 до cy, scale от 0.5 до 1.4
    // После: слегка пульсирует
    const flyProgress = Math.min(1, elapsed / 0.25); // 0 → 1 за 0.25s
    const eased       = 1 - Math.pow(1 - flyProgress, 3); // ease-out cubic
    const textY       = cy + 80 * (1 - eased);
    const scale       = 0.5 + eased * 0.9 + Math.sin(elapsed * 8) * 0.03 * flyProgress;

    ctx.save();
    ctx.translate(cx, textY);
    ctx.scale(scale, scale);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font         = 'bold 96px Arial';
    ctx.strokeStyle  = 'rgba(0,0,0,0.7)';
    ctx.lineWidth    = 7;
    ctx.fillStyle    = '#ffe44d';
    ctx.strokeText('ГОЛ!', 0, 0);
    ctx.fillText('ГОЛ!', 0, 0);
    ctx.restore();

    // ── Имя забившего (появляется плавно после 0.2s) ───────────────────────────
    const nameAlpha = Math.min(1, Math.max(0, (elapsed - 0.2) * 4));
    if (nameAlpha > 0) {
      const scorer = this._lastGoal === 'right' ? 'Игрок' : this._botName;
      ctx.save();
      ctx.globalAlpha  = nameAlpha;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = 'bold 28px Arial';
      ctx.strokeStyle  = 'rgba(0,0,0,0.65)';
      ctx.lineWidth    = 4;
      ctx.fillStyle    = 'rgba(255,255,255,0.9)';
      ctx.strokeText(`Гол забил: ${scorer}`, cx, cy + 70);
      ctx.fillText(`Гол забил: ${scorer}`, cx, cy + 70);
      ctx.restore();
    }
  }

  /** Возвращает объектов на стартовые позиции и обнуляет скорости. */
  resetPositions() {
    this.player.x = START.player.x;
    this.player.y = START.player.y;
    this.player.vx = 0;
    this.player.vy = 0;

    this.bot.x = START.bot.x;
    this.bot.y = START.bot.y;
    this.bot.vx = 0;
    this.bot.vy = 0;

    this.ball.x  = START.ball.x;
    this.ball.y  = START.ball.y;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  // ─── Приватные методы ────────────────────────────────────────────────────────

  _updatePlaying(dt) {
    // Игрок движется за курсором
    const ptr = this._getPointer();
    this.player.update(dt, ptr.x, ptr.y);

    // Бот управляется AI
    this._ai.update(dt);

    // Мяч
    this.ball.update(dt);

    // Физика: столкновения + звук удара
    const playerKick = resolveCircleCollision(this.player, this.ball);
    const botKick    = resolveCircleCollision(this.bot,    this.ball);
    if ((playerKick || botKick) && this._kickCooldown <= 0) {
      AudioManager.play('kick');
      this._kickCooldown = 0.12; // не чаще раза в 0.12 сек
    }
    if (this._kickCooldown > 0) this._kickCooldown -= dt;

    // После депенетрации мяч мог уйти за границу поля — возвращаем обратно
    this.ball.bounceWalls();

    // Проверка гола
    const goal = checkGoal(this.ball, FIELD_CONFIG);
    if (goal) {
      this._onGoal(goal);
    }
  }

  _updateGoal(dt) {
    this._goalTimer -= dt;
    if (this._goalTimer <= 0) {
      this.resetPositions();
      this.state = 'playing';
    }
  }

  /** Реакция на гол: обновить счёт, запустить паузу или завершить матч. */
  _onGoal(side) {
    this._lastGoal = side;

    if (side === 'left') {
      // Мяч залетел в левые ворота → очко боту (правая сторона)
      this.scoreLeft += 1;
    } else {
      // Мяч залетел в правые ворота → очко игроку (левая сторона)
      this.scoreRight += 1;
    }

    // Проверяем победу
    if (this.scoreLeft >= GOALS_TO_WIN || this.scoreRight >= GOALS_TO_WIN) {
      this.state = 'finished';

      // Начисляем ELO и голду один раз
      if (!this._resultsApplied) {
        this._resultsApplied = true;
        const winner = this.scoreRight >= GOALS_TO_WIN ? 'player' : 'bot';
        if (winner === 'player') {
          this._eloChange  = EloSystem.applyWin();
          this._goldEarned = CurrencySystem.addWinReward();
        } else {
          this._eloChange  = EloSystem.applyLoss();
          this._goldEarned = 0;
        }
      }

      if (typeof this.onFinished === 'function') {
        const winner = this.scoreRight >= GOALS_TO_WIN ? 'player' : 'bot';
        this.onFinished(winner, this._eloChange, this._goldEarned);
      }
      return;
    }

    // Пауза перед сбросом
    this._goalTimer = GOAL_PAUSE_SEC;
    this.state = 'goal';

    // Тряска экрана при голе
    effectsManager.shake(10, 0.4);

    // Конфетти из ворот
    this._emitGoalParticles(side);

    // Останавливаем мяч сразу, чтобы он не продолжал лететь
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  /** Взрыв конфетти из ворот, куда залетел мяч. */
  _emitGoalParticles(side) {
    const { goalTop, goalBottom, left, right } = FIELD_CONFIG;
    const cy = (goalTop + goalBottom) / 2;

    // Цвета: голубые/белые — гол игрока, красные/оранжевые — гол бота
    const playerColors = ['#4fc3f7', '#81d4fa', '#ffffff', '#ffe44d', '#b3e5fc'];
    const botColors    = ['#ef5350', '#ff8a65', '#ffffff', '#ffe44d', '#ffccbc'];

    if (side === 'right') {
      // Мяч влетел в правые ворота (player забил)
      this._particles.emit(right, cy, 55, playerColors, { spreadY: 120, speed: 380 });
    } else {
      // Мяч влетел в левые ворота (bot забил)
      this._particles.emit(left, cy, 55, botColors, { spreadY: 120, speed: 380 });
    }
  }
}
