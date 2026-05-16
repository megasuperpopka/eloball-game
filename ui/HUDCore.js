import { FIELD } from "../game/Field.js";

export class HUDCore {
  draw(ctx, data) {
    const {
      leftName = "Игрок",
      rightName = "Бот",
      leftScore = 0,
      rightScore = 0,
      mmr = 0,
      opponentMmr = null,
      goalText = "",
      endText = "",
    } = data;

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(FIELD.x + FIELD.width / 2 - 210, 8, 420, 72);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "bold 18px Arial";
    ctx.fillText(`${leftName}  vs  ${rightName}`, FIELD.x + FIELD.width / 2, 14);

    ctx.font = "bold 34px Arial";
    ctx.fillText(`${leftScore} : ${rightScore}`, FIELD.x + FIELD.width / 2, 34);

    ctx.fillStyle = "#ffffff";

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
