import { FIELD } from "../game/Field.js";

export class HUD {
  draw(ctx, data) {
    const {
      leftName = "Игрок",
      rightName = "Бот",
      leftScore = 0,
      rightScore = 0,
      elo = 0,
      goalText = "",
      endText = "",
    } = data;

    // Верхняя плашка счёта и имён
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(FIELD.x + FIELD.width / 2 - 210, 8, 420, 72);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "bold 18px Arial";
    ctx.fillText(`${leftName}  vs  ${rightName}`, FIELD.x + FIELD.width / 2, 14);

    ctx.font = "bold 34px Arial";
    ctx.fillText(`${leftScore} : ${rightScore}`, FIELD.x + FIELD.width / 2, 34);

    // ELO в левом верхнем углу
    ctx.textAlign = "left";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`ELO: ${elo}`, 20, 14);

    if (goalText) {
      ctx.textAlign = "center";
      ctx.font = "bold 42px Arial";
      ctx.fillText(goalText, FIELD.x + FIELD.width / 2, FIELD.y + 60);
    }

    if (endText) {
      ctx.textAlign = "center";
      ctx.font = "bold 44px Arial";
      ctx.fillText(endText, FIELD.x + FIELD.width / 2, FIELD.y + FIELD.height / 2 - 20);
    }
  }
}
/*
import { LOGICAL_WIDTH } from '../core/Canvas.js';

// Цвета редкостей для будущего расширения
const RARITY_COLORS = {
  default:   '#ffffff',
  Rare:      '#4fc3f7',
  Epic:      '#ce93d8',
  Mythic:    '#ff8a65',
  Legendary: '#ffd54f',
  Top:       '#f44336',
};

export class HUD {
  /**
   * Рисует игровой интерфейс поверх canvas.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} scoreLeft  - очки левого игрока
   * @param {number} scoreRight - очки правого игрока (бота)
   * @param {string} leftName   - имя левого игрока
   * @param {string} rightName  - имя правого игрока
   * @param {number} [elo]      - текущий ELO (опционально)
   * @param {number} [gold]     - текущая голда (опционально)
   */
  draw(ctx, scoreLeft, scoreRight, leftName, rightName, elo, gold) {
    this._drawScorePanel(ctx, scoreLeft, scoreRight, leftName, rightName);

    if (elo !== undefined) {
      this._drawStats(ctx, elo, gold);
    }
  }

  // ─── Приватные методы ──────────────────────────────────────────────────────

  _drawScorePanel(ctx, scoreLeft, scoreRight, leftName, rightName) {
    const cx = LOGICAL_WIDTH / 2;

    // Полупрозрачная подложка за счётом
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
    ctx.beginPath();
    ctx.roundRect(cx - 120, 6, 240, 68, 12);
    ctx.fill();

    // Счёт по центру
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${scoreLeft}  :  ${scoreRight}`, cx, 32);

    // Имена под счётом
    ctx.font = '15px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

    // Имя левого — чуть левее центра
    ctx.textAlign = 'right';
    ctx.fillText(leftName, cx - 18, 60);

    // Имя правого — чуть правее центра
    ctx.textAlign = 'left';
    ctx.fillText(rightName, cx + 18, 60);

    ctx.restore();
  }

  _drawStats(ctx, elo, gold) {
    ctx.save();

    // Подложка в левом верхнем углу
    const hasGold = gold !== undefined;
    const panelH = hasGold ? 58 : 32;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 140, panelH, 8);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // ELO
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText(`ELO: ${elo}`, 22, 27);

    // Голда под ELO
    if (hasGold) {
      ctx.fillStyle = '#a5d6a7';
      ctx.fillText(`Gold: ${gold}`, 22, 52);
    }

    ctx.restore();
  }
}
*/
