import { resolveGameAssetUrl } from "./AssetUrl.js";

const RANGES_BASE = "assets/images/ranges";

const RANK_FILES = ["bronze", "silver", "gold", "eclipse", "apex", "angel", "devil"];

/** @type {Map<string, HTMLImageElement>} */
const rankTextureCache = new Map();

function rankSrcForFilename(filename) {
  return `${RANGES_BASE}/${filename}.png`;
}

/**
 * По MMR возвращает имя файла ранга (без пути): bronze … devil.
 */
function getRankBasename(mmr) {
  const m = Number(mmr);
  const x = Number.isFinite(m) ? Math.floor(m) : 0;
  const clamped = Math.max(0, x);
  if (clamped < 300) return "bronze";
  if (clamped < 600) return "silver";
  if (clamped < 900) return "gold";
  if (clamped < 1200) return "eclipse";
  if (clamped < 1500) return "apex";
  if (clamped < 1800) return "angel";
  return "devil";
}

function getRankSrc(mmr) {
  return rankSrcForFilename(getRankBasename(mmr));
}

/** Доля пути до следующего порога ранга (шаг между рангами 300 MMR), 0…1; от 1800 — полоска всегда полная. */
function getRankProgress(mmr) {
  const raw = Number(mmr);
  const x = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  if (x >= 1800) return 1;
  const span = 300;
  const low = Math.floor(x / span) * span;
  return Math.min(1, Math.max(0, (x - low) / span));
}

function loadRankTexture(src) {
  if (rankTextureCache.has(src)) return rankTextureCache.get(src);
  const img = new Image();
  img.src = resolveGameAssetUrl(src);
  rankTextureCache.set(src, img);
  return img;
}

const MmrRank = {
  getRankBasename,

  getRankSrc,

  getRankProgress,

  /** Картинка текущего ранга (кэш как у скинов). */
  getRankImageElement(mmr) {
    return loadRankTexture(getRankSrc(mmr));
  },

  preloadRankImages() {
    RANK_FILES.forEach((name) => loadRankTexture(rankSrcForFilename(name)));
  },
};

export default MmrRank;
