import SkinSystem from "../systems/SkinSystem.js";
import MmrRank from "../systems/MmrRank.js";
import { drawField, FIELD } from "../game/Field.js";
import { getUiButtonScale } from "../core/MobileLayout.js";
import { GAME_DISPLAY_NAME } from "../core/GameTitle.js";

export class MainMenu {
  constructor() {
    this.buttons = {
      play: { x: 445, y: 255, w: 310, h: 56, label: "Играть", colorA: "#2e8b57", colorB: "#1f6f43" },
      shop: { x: 445, y: 319, w: 310, h: 56, label: "Магазин", colorA: "#7e57c2", colorB: "#5e35b1" },
      inventory: { x: 445, y: 383, w: 310, h: 56, label: "Инвентарь", colorA: "#42a5f5", colorB: "#1e88e5" },
      quests: { x: 445, y: 447, w: 310, h: 56, label: "Квесты", colorA: "#f57c00", colorB: "#e65100" },
      paintSkin: { x: 445, y: 511, w: 310, h: 50, label: "Свой скин", colorA: "#00838f", colorB: "#006064" },
      logout: { x: 986, y: 18, w: 184, h: 42, label: "Выйти" },
    };

    // Текущая «высота отрыва» каждой кнопки в пикселях.
    // Плавно стремится к целевому значению (см. _updateHover).
    this.hoverLift = { play: 0, shop: 0, inventory: 0, quests: 0, paintSkin: 0, logout: 0 };

    // Имя кнопки под курсором (или null). Используется снаружи,
    // чтобы менять курсор мыши на «руку».
    this.hoveredKey = null;
  }

  /** Возвращает ключ кнопки под курсором или null. */
  _getHoveredKey(px, py) {
    if (px == null || py == null) return null;
    for (const key of Object.keys(this.buttons)) {
      if (this._inside(px, py, this.buttons[key])) return key;
    }
    return null;
  }

  /** Плавно подтягивает текущее значение лифта к целевому. */
  _updateHover(pointer) {
    // isActive === false означает, что мышь ушла с канваса или ещё не двигалась.
    // В этом случае никакая кнопка не должна считаться «под курсором».
    const pointerOk = pointer && pointer.isActive !== false;
    const hovered = pointerOk ? this._getHoveredKey(pointer.x, pointer.y) : null;
    this.hoveredKey = hovered;

    // Высота подпрыга: маленькая для «Выйти» и побольше для основных кнопок.
    const liftFor = (key) => (key === "logout" ? 5 : 9);

    // Коэффициент сглаживания: чем больше — тем быстрее «прыгает».
    const k = 0.22;

    for (const key of Object.keys(this.hoverLift)) {
      const target = hovered === key ? liftFor(key) : 0;
      this.hoverLift[key] += (target - this.hoverLift[key]) * k;
      if (Math.abs(this.hoverLift[key]) < 0.05) this.hoverLift[key] = 0;
    }
  }

  draw(ctx, data) {
    const {
      mmr = 0,
      gold = 0,
      coins = 0,
      trophies = 0,
      skinName = "Стартовый",
      skinRarity = "Default",
      previewSkin = null,
      uiTime = 0,
      rarityColor = "#cfd8dc",
      displayName = "",
      pointer = null,
      winStreak = 0,
      questsBadge = false,
      menuToastText = "",
    } = data;

    this._updateHover(pointer);

    this._drawMenuFieldBackdrop(ctx, uiTime);

    this._drawGhostButton(ctx, this.buttons.logout, this.hoverLift.logout);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    let titleFontPx = 52;
    ctx.font = `bold ${titleFontPx}px Arial`;
    const titleMaxW = 1080;
    while (titleFontPx > 26 && ctx.measureText(GAME_DISPLAY_NAME).width > titleMaxW) {
      titleFontPx -= 2;
      ctx.font = `bold ${titleFontPx}px Arial`;
    }
    ctx.fillText(GAME_DISPLAY_NAME, 600, 118);
    ctx.font = "22px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText("Футбольная аркада 1v1", 600, 164);
    if (displayName && String(displayName).trim().length > 0) {
      ctx.font = "500 19px Arial";
      ctx.fillStyle = "rgba(200, 230, 255, 0.88)";
      ctx.fillText(`Привет, ${String(displayName).trim()}!`, 600, 192);
    }
    if (winStreak >= 2) {
      ctx.font = "600 16px Arial";
      ctx.fillStyle = "rgba(255, 183, 77, 0.95)";
      ctx.fillText(`🔥 Серия побед: ${winStreak}`, 600, displayName ? 216 : 196);
    }

    const mmrCard = { x: 78, y: 30, w: 230, h: 64 };
    this._drawInfoCard(ctx, mmrCard.x, mmrCard.y, mmrCard.w, mmrCard.h, "#4fc3f7", "MMR", String(mmr), {
      rankProgress: MmrRank.getRankProgress(mmr),
    });
    this._drawMmrRankUnderCard(ctx, mmr, mmrCard);

    const goldCardX = 892;
    const goldCardW = 230;
    const goldCardH = 64;
    const trophyGap = 10;
    this._drawInfoCard(ctx, goldCardX, 30, goldCardW, goldCardH, "#ffd54f", "Gold", String(gold));
    const trophyCardY = 30 + goldCardH + trophyGap;
    const trophyCardH = 68;
    this._drawTrophyCounterCard(ctx, goldCardX, trophyCardY, goldCardW, trophyCardH, trophies, uiTime);
    const coinsCardGap = 8;
    const coinsCardY = trophyCardY + trophyCardH + coinsCardGap;
    const coinsCardH = 56;
    this._drawInfoCard(ctx, goldCardX, coinsCardY, goldCardW, coinsCardH, "#cfd8dc", "Коины", String(coins));

    this._drawButton(ctx, this.buttons.play, this.hoverLift.play);
    this._drawButton(ctx, this.buttons.shop, this.hoverLift.shop);
    this._drawButton(ctx, this.buttons.inventory, this.hoverLift.inventory);
    this._drawButton(ctx, this.buttons.quests, this.hoverLift.quests, { badge: questsBadge });
    this._drawButton(ctx, this.buttons.paintSkin, this.hoverLift.paintSkin);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();

    SkinSystem.drawSkinInCircle(ctx, previewSkin || SkinSystem.getSkinById("default"), 600, 624, 20);
    ctx.beginPath();
    ctx.arc(600, 624, 20, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px Arial";
    ctx.fillText(`Скин: ${skinName}`, 600, 604);
    ctx.font = "18px Arial";
    ctx.fillStyle = rarityColor;
    ctx.fillText(`Редкость: ${skinRarity} · выбор в инвентаре`, 600, 646);
  }

  getActionAt(x, y) {
    if (this._inside(x, y, this.buttons.logout)) return "LOGOUT";
    if (this._inside(x, y, this.buttons.play)) return "PLAY";
    if (this._inside(x, y, this.buttons.shop)) return "SHOP";
    if (this._inside(x, y, this.buttons.inventory)) return "INVENTORY";
    if (this._inside(x, y, this.buttons.quests)) return "QUESTS";
    if (this._inside(x, y, this.buttons.paintSkin)) return "PAINT_SKIN";
    return null;
  }

  _inside(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  _drawGhostButton(ctx, button, lift = 0) {
    if (lift > 0.2) {
      this._roundedRect(ctx, button.x + 2, button.y + lift + 2, button.w, button.h, 11);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.18 * Math.min(1, lift / 6)})`;
      ctx.fill();
    }

    const drawY = button.y - lift;
    this._roundedRect(ctx, button.x, drawY, button.w, button.h, 11);
    ctx.fillStyle = "rgba(15, 23, 42, 0.42)";
    ctx.fill();
    ctx.strokeStyle = "rgba(226, 232, 240, 0.38)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "rgba(241, 245, 249, 0.95)";
    const ghostFs = getUiButtonScale() > 1 ? Math.round(17 * 1.2) : 17;
    ctx.font = `600 ${ghostFs}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(button.label, button.x + button.w / 2, drawY + button.h / 2 + 1);
  }

  _drawButton(ctx, button, lift = 0, opts = {}) {
    const showBadge = Boolean(opts.badge);
    // Тень под кнопкой — создаёт ощущение «отрыва» от поверхности.
    if (lift > 0.2) {
      const shadowOffset = 3 + lift * 0.6;
      this._roundedRect(ctx, button.x + 3, button.y + shadowOffset, button.w, button.h, 12);
      ctx.fillStyle = `rgba(0, 0, 0, ${0.28 * Math.min(1, lift / 9)})`;
      ctx.fill();
    }

    const drawY = button.y - lift;
    const grad = ctx.createLinearGradient(button.x, drawY, button.x, drawY + button.h);
    grad.addColorStop(0, button.colorA);
    grad.addColorStop(1, button.colorB);
    this._roundedRect(ctx, button.x, drawY, button.w, button.h, 12);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    const labelFs = getUiButtonScale() > 1 ? Math.round(22 * 1.15) : 22;
    ctx.font = `bold ${labelFs}px Arial`;
    ctx.fillText(button.label, button.x + button.w / 2, drawY + button.h / 2 + 1);

    if (showBadge) {
      const bx = button.x + button.w - 14;
      const by = drawY + 10;
      const br = 9;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Arial";
      ctx.fillText("!", bx, by + 1);
    }
  }

  _drawInfoCard(ctx, x, y, w, h, accent, title, value, options = {}) {
    this._roundedRect(ctx, x, y, w, h, 12);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const hasRankBar = typeof options.rankProgress === "number" && Number.isFinite(options.rankProgress);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "bold 16px Arial";
    if (hasRankBar) {
      ctx.fillText(title, x + 16, y + 18);
      ctx.fillStyle = accent;
      ctx.font = "bold 28px Arial";
      ctx.fillText(value, x + 16, y + 38);
    } else {
      ctx.fillText(title, x + 16, y + 22);
      ctx.fillStyle = accent;
      ctx.font = "bold 28px Arial";
      ctx.fillText(value, x + 16, y + 48);
    }

    if (hasRankBar) {
      this._drawRankProgressStrip(ctx, x, y, w, h, accent, Math.min(1, Math.max(0, options.rankProgress)));
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
  }

  /** Полоска заполнения до следующего ранга у нижнего края карточки. */
  _drawRankProgressStrip(ctx, cx, cy, cw, ch, accent, amount) {
    const pad = 14;
    const bw = cw - pad * 2;
    const bh = 6;
    const bx = cx + pad;
    const by = cy + ch - bh - 8;
    const r = bh / 2;

    this._roundedRect(ctx, bx, by, bw, bh, r);
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (amount <= 0) return;

    ctx.save();
    this._roundedRect(ctx, bx, by, bw, bh, r);
    ctx.clip();
    const fw = Math.max(bh * (amount >= 1 ? 1 : 0.12), bw * amount);
    const fg = ctx.createLinearGradient(bx, by, bx + bw, by);
    fg.addColorStop(0, accent);
    fg.addColorStop(1, "#e1f5fe");
    ctx.fillStyle = fg;
    ctx.globalAlpha = 0.92;
    this._roundedRect(ctx, bx, by, fw, bh, r);
    ctx.fill();
    ctx.restore();
  }

  /** Иконка ранга по MMR — сразу под карточкой MMR. */
  _drawMmrRankUnderCard(ctx, mmr, card) {
    const img = MmrRank.getRankImageElement(mmr);
    const cx = card.x + card.w / 2;
    const top = card.y + card.h + 10;
    const rankScale = 4;
    const maxW = (card.w - 20) * rankScale;
    const maxH = 76 * rankScale;

    if (img && img.complete && img.naturalWidth > 0) {
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, cx - dw / 2, top, dw, dh);
    } else {
      ctx.save();
      const phW = Math.min(maxW, 88 * rankScale);
      const phH = Math.min(maxH, 52 * rankScale);
      this._roundedRect(ctx, cx - phW / 2, top, phW, phH, 10);
      ctx.fillStyle = "rgba(79,195,247,0.18)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "12px Arial";
      ctx.fillText("ранг…", cx, top + phH / 2);
      ctx.restore();
      ctx.textAlign = "center";
    }
  }

  /** Кубки: под карточкой Gold — подпись, иконка кубка и число. */
  _drawTrophyCounterCard(ctx, x, y, w, h, trophies, time) {
    this._roundedRect(ctx, x, y, w, h, 12);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "bold 16px Arial";
    ctx.fillText("Кубки", x + 14, y + 20);

    const rowCy = y + h * 0.62;
    const iconCx = x + 40;
    this._drawMiniTrophyIcon(ctx, iconCx, rowCy, time);

    ctx.fillStyle = "#ffb74d";
    ctx.font = "bold 28px Arial";
    ctx.textBaseline = "middle";
    ctx.fillText(String(trophies), x + 74, rowCy);

    ctx.textAlign = "center";
  }

  /** Маленький кубок (вектор, как после победы). */
  _drawMiniTrophyIcon(ctx, cx, cy, time) {
    const pulse = typeof time === "number" ? time : 0;
    const bob = 0.04 * Math.sin(pulse * 1.65);
    const scale = (0.36 + 0.02 * Math.sin(pulse * 2.4)) * (1 + bob);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.rotate(0.06 * Math.sin(pulse * 2));

    const g = ctx.createRadialGradient(-12, -18, 4, 0, -6, 48);
    g.addColorStop(0, "#fffde7");
    g.addColorStop(0.35, "#ffd54f");
    g.addColorStop(0.72, "#ff8f00");
    g.addColorStop(1, "#e65100");

    const glow = 0.52 + 0.48 * Math.sin(pulse * 2);
    ctx.shadowColor = `rgba(255, 213, 79, ${0.42 * glow})`;
    ctx.shadowBlur = 12;

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

  _roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  /** То же игровое поле + затемнение и виньетка — фон главного меню. */
  _drawMenuFieldBackdrop(ctx, time) {
    drawField(ctx);

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgb(28, 44, 56)";
    ctx.fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);
    ctx.globalCompositeOperation = "source-over";

    const evening = ctx.createLinearGradient(0, 0, FIELD.width, FIELD.height);
    evening.addColorStop(0, "rgba(12, 22, 40, 0.42)");
    evening.addColorStop(0.45, "rgba(6, 16, 32, 0.22)");
    evening.addColorStop(1, "rgba(14, 20, 36, 0.48)");
    ctx.fillStyle = evening;
    ctx.fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);

    const cx = FIELD.x + FIELD.width * 0.5;
    const cy = FIELD.y + FIELD.height * 0.48;
    const vignette = ctx.createRadialGradient(cx, cy, FIELD.width * 0.14, cx, cy, FIELD.width * 0.78);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.55, "rgba(2, 6, 12, 0.28)");
    vignette.addColorStop(1, "rgba(0, 4, 10, 0.82)");
    ctx.fillStyle = vignette;
    ctx.fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);

    // Лёгкий «прожектор» сверху (стадионный свет на центр).
    const spot = ctx.createRadialGradient(cx, FIELD.y + 40 + Math.sin(time * 0.6) * 8, 8, cx, FIELD.y + 220, 420);
    spot.addColorStop(0, "rgba(255, 252, 240, 0.07)");
    spot.addColorStop(1, "rgba(255, 252, 240, 0)");
    ctx.fillStyle = spot;
    ctx.fillRect(FIELD.x, FIELD.y, FIELD.width, FIELD.height);

    ctx.restore();

    this._drawAmbientDecor(ctx, time);
  }

  _drawAmbientDecor(ctx, time) {
    for (let i = 0; i < 16; i += 1) {
      const x = (i * 97 + 40 + Math.sin(time * 0.55 + i) * 18) % 1200;
      const y = 100 + ((i * 37 + time * 14) % 540);
      const alpha = 0.04 + 0.06 * (0.5 + 0.5 * Math.sin(time * 1.8 + i * 0.6));
      const radius = 1.2 + (i % 3) * 0.45;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const pulse = 0.5 + 0.5 * Math.sin(time * 1.9);
    const glow = ctx.createRadialGradient(600, 468, 20, 600, 468, 200 + pulse * 40);
    glow.addColorStop(0, "rgba(79,195,247,0.1)");
    glow.addColorStop(1, "rgba(79,195,247,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(320, 300, 560, 240);
  }
}
