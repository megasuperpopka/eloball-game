import StorageSystem from "./StorageSystem.js";
import { resolveGameAssetUrl } from "./AssetUrl.js";

const SKINS = [
  { id: "default", name: "Стартовый", rarity: "Default", type: "color", value: "#ffffff", caseGroup: "basic", sound: null },
  { id: "basic_blue", name: "Blue", rarity: "Rare", type: "color", value: "#4fc3f7", caseGroup: "basic", sound: "assets/sounds/skins/basic_blue.mp3" },
  { id: "basic_green", name: "Green", rarity: "Rare", type: "color", value: "#66bb6a", caseGroup: "basic", sound: "assets/sounds/skins/basic_green.mp3" },
  { id: "basic_orange", name: "Orange", rarity: "Rare", type: "color", value: "#ffb74d", caseGroup: "basic", sound: "assets/sounds/skins/basic_orange.mp3" },
  { id: "basic_purple", name: "Purple", rarity: "Epic", type: "color", value: "#9575cd", caseGroup: "basic", sound: "assets/sounds/skins/basic_purple.mp3" },
  { id: "basic_teal", name: "Teal", rarity: "Epic", type: "color", value: "#4db6ac", caseGroup: "basic", sound: "assets/sounds/skins/basic_teal.mp3" },
  { id: "basic_rose", name: "Rose", rarity: "Mythic", type: "color", value: "#f06292", caseGroup: "basic", sound: "assets/sounds/skins/basic_rose.mp3" },
  { id: "basic_lime", name: "Lime", rarity: "Mythic", type: "color", value: "#9ccc65", caseGroup: "basic", sound: "assets/sounds/skins/basic_lime.mp3" },
  { id: "basic_gold", name: "Gold", rarity: "Legendary", type: "color", value: "#ffd54f", caseGroup: "basic", sound: "assets/sounds/skins/basic_gold.mp3" },
  { id: "basic_crimson", name: "Crimson", rarity: "Legendary", type: "color", value: "#e53935", caseGroup: "basic", sound: "assets/sounds/skins/basic_crimson.mp3" },
  { id: "basic_obsidian", name: "Obsidian", rarity: "Top", type: "color", value: "#1f2937", caseGroup: "basic", sound: "assets/sounds/skins/basic_obsidian.mp3" },

  { id: "prm_sunset_blaze", name: "Sunset Blaze", rarity: "Epic", type: "dual", value: { primary: "#ff7043", secondary: "#ffd54f" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_sunset_blaze.mp3" },
  { id: "prm_arctic_wave", name: "Arctic Wave", rarity: "Epic", type: "dual", value: { primary: "#4fc3f7", secondary: "#00acc1" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_arctic_wave.mp3" },
  { id: "prm_toxic_mix", name: "Toxic Mix", rarity: "Mythic", type: "dual", value: { primary: "#76ff03", secondary: "#00e676" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_toxic_mix.mp3" },
  { id: "prm_galaxy_violet", name: "Galaxy Violet", rarity: "Legendary", type: "dual", value: { primary: "#7c4dff", secondary: "#e040fb" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_galaxy_violet.mp3" },
  { id: "prm_ruby_flash", name: "Ruby Flash", rarity: "Legendary", type: "dual", value: { primary: "#ff1744", secondary: "#ff8a80" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_ruby_flash.mp3" },
  { id: "prm_cyber_lime", name: "Cyber Lime", rarity: "Top", type: "dual", value: { primary: "#00e676", secondary: "#c6ff00" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_cyber_lime.mp3" },
  { id: "prm_ocean_storm", name: "Ocean Storm", rarity: "Rare", type: "dual", value: { primary: "#0288d1", secondary: "#80deea" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_ocean_storm.mp3" },
  { id: "prm_mango_heat", name: "Mango Heat", rarity: "Rare", type: "dual", value: { primary: "#ffca28", secondary: "#ff7043" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_mango_heat.mp3" },
  { id: "prm_ice_berry", name: "Ice Berry", rarity: "Epic", type: "dual", value: { primary: "#80deea", secondary: "#ab47bc" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_ice_berry.mp3" },
  { id: "prm_mint_punch", name: "Mint Punch", rarity: "Rare", type: "dual", value: { primary: "#64ffda", secondary: "#18ffff" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_mint_punch.mp3" },
  { id: "prm_sakura_pop", name: "Sakura Pop", rarity: "Epic", type: "dual", value: { primary: "#ff80ab", secondary: "#f06292" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_sakura_pop.mp3" },
  { id: "prm_lava_core", name: "Lava Core", rarity: "Mythic", type: "dual", value: { primary: "#ff3d00", secondary: "#ffd740" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_lava_core.mp3" },
  { id: "prm_skylight", name: "Skylight", rarity: "Rare", type: "dual", value: { primary: "#82b1ff", secondary: "#40c4ff" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_skylight.mp3" },
  { id: "prm_ultra_violet", name: "Ultra Violet", rarity: "Top", type: "dual", value: { primary: "#651fff", secondary: "#b388ff" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_ultra_violet.mp3" },
  { id: "prm_acid_rain", name: "Acid Rain", rarity: "Mythic", type: "dual", value: { primary: "#aeea00", secondary: "#00c853" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_acid_rain.mp3" },
  { id: "prm_night_pulse", name: "Night Pulse", rarity: "Legendary", type: "dual", value: { primary: "#263238", secondary: "#00bcd4" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_night_pulse.mp3" },
  { id: "prm_solar_flare", name: "Solar Flare", rarity: "Mythic", type: "dual", value: { primary: "#ff6f00", secondary: "#ffeb3b" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_solar_flare.mp3" },
  { id: "prm_aurora", name: "Aurora", rarity: "Legendary", type: "dual", value: { primary: "#00e5ff", secondary: "#69f0ae" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_aurora.mp3" },
  { id: "prm_candy_rush", name: "Candy Rush", rarity: "Epic", type: "dual", value: { primary: "#ff4081", secondary: "#7c4dff" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_candy_rush.mp3" },
  { id: "prm_emerald_wave", name: "Emerald Wave", rarity: "Rare", type: "dual", value: { primary: "#00c853", secondary: "#b2ff59" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_emerald_wave.mp3" },
  { id: "prm_frost_fire", name: "Frost Fire", rarity: "Top", type: "dual", value: { primary: "#ff5252", secondary: "#40c4ff" }, caseGroup: "premium", sound: "assets/sounds/skins/prm_frost_fire.mp3" },

  { id: "cust_anton_chigyr", name: "АНТОН ЧИГУР", rarity: "Rare", type: "image", value: "assets/images/skins/anton_chigyr.png", caseGroup: "premium", sound: null },
  { id: "cust_dexter", name: "Дiкстар Маргiн", rarity: "Legendary", type: "image", value: "assets/images/skins/dexter.png", caseGroup: "premium", sound: null },
  { id: "cust_ilya_slk", name: "ТЕСТЕР", rarity: "Top", type: "image", value: "assets/images/skins/ilya_slik1.png", caseGroup: "premium", sound: null },
  { id: "cust_judi_pops", name: "ДЖУДИ ПОПС", rarity: "Mythic", type: "image", value: "assets/images/skins/judi_pops.png", caseGroup: "premium", sound: null },
  { id: "cust_mellstroy", name: "МЕЛЛСТРОЙ", rarity: "Legendary", type: "image", value: "assets/images/skins/mellstroy.png", caseGroup: "premium", sound: null },
  { id: "cust_razrab", name: "РАЗРАБ", rarity: "Top", type: "image", value: "assets/images/skins/razrab.png", caseGroup: "premium", sound: null },
  { id: "cust_six_seven", name: "СИКС СЕВЕН", rarity: "Legendary", type: "image", value: "assets/images/skins/six-seven.png", caseGroup: "premium", sound: null },
  { id: "cust_srat_nado", name: "СРАТЬ НАДО", rarity: "Epic", type: "image", value: "assets/images/skins/SRAT_NADO.png", caseGroup: "premium", sound: null },
  { id: "cust_sressi", name: "СРЕССИ", rarity: "Epic", type: "image", value: "assets/images/skins/sressi.png", caseGroup: "premium", sound: null },
  { id: "cust_toxo_t2x2", name: "ТОХА Т2X2", rarity: "Legendary", type: "image", value: "assets/images/skins/toxo_t2x2.png", caseGroup: "premium", sound: null },
  { id: "cust_gazan", name: "ГАЗАН", rarity: "Legendary", type: "image", value: "assets/images/skins/gazan.png", caseGroup: "premium", sound: null },
  { id: "cust_pepe_shnene", name: "ПЕПЕ ШНЕНЕ", rarity: "Legendary", type: "image", value: "assets/images/skins/pepe_shnene.png", caseGroup: "premium", sound: null },
  { id: "cust_vozdyhan", name: "ВОЗДУХАН", rarity: "Mythic", type: "image", value: "assets/images/skins/vozdyhan.png", caseGroup: "premium", sound: null },
  { id: "cust_cheremsha", name: "ЧЕРЕМША", rarity: "Legendary", type: "image", value: "assets/images/skins/cheremsha.png", caseGroup: "premium", sound: null },
  { id: "cust_vozmi_telefon", name: "ВОЗЬМИ ТЕЛЕФОН,ДЕТКА", rarity: "Legendary", type: "image", value: "assets/images/skins/vozmi_telefon.png", caseGroup: "premium", sound: null },
];

/** @type {Map<string, HTMLImageElement>} */
const skinTextureCache = new Map();

/** Слот -> { memoUrl, img } для нарисованных скинов. */
const paintedSkinCacheBySlot = new Map();

const skinById = new Map(SKINS.map((skin) => [skin.id, skin]));

const PAINT_SLOT_ID_RE = /^paint_slot_(\d+)$/;

function normalizeFixedSkinId(skinId) {
  return typeof skinId === "string" && skinById.has(skinId) ? skinId : null;
}

function parsePaintSlotId(skinId) {
  const m = typeof skinId === "string" ? PAINT_SLOT_ID_RE.exec(skinId) : null;
  if (!m) return null;
  const idx = Number(m[1]);
  if (!Number.isInteger(idx) || idx < 0 || idx >= StorageSystem.getPaintSlotTotal()) return null;
  return idx;
}

function normalizeSkinId(skinId) {
  const paintIdx = typeof skinId === "string" ? parsePaintSlotId(skinId) : null;
  if (paintIdx !== null) return `paint_slot_${paintIdx}`;
  const fixed = normalizeFixedSkinId(skinId);
  return fixed || "default";
}

function metaPaintSkin(slotIndex) {
  const n = StorageSystem.getPaintSlotTotal();
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= n) return null;
  return {
    id: `paint_slot_${slotIndex}`,
    name: `Мой мяч ${slotIndex + 1}`,
    rarity: "Unique",
    type: "painted",
    slotIndex,
    value: null,
    caseGroup: "paint",
    sound: null,
  };
}

const SkinSystem = {
  getAllSkins() {
    return SKINS.slice();
  },

  getSkinById(skinId) {
    const m = typeof skinId === "string" ? PAINT_SLOT_ID_RE.exec(skinId) : null;
    if (m) {
      const slot = Number(m[1]);
      return metaPaintSkin(slot);
    }
    return skinById.get(normalizeFixedSkinId(skinId) || "default") || skinById.get("default");
  },

  getSkinsForCase(caseType) {
    const key = String(caseType || "").toLowerCase();
    return SKINS.filter((skin) => skin.caseGroup === key);
  },

  hasSkin(skinId) {
    const id = normalizeSkinId(skinId);
    return StorageSystem.getInventory().includes(id);
  },

  unlockSkin(skinId) {
    const id = normalizeSkinId(skinId);
    StorageSystem.addToInventory(id);
    return this.getSkinById(id);
  },

  getOwnedSkins() {
    const inventory = StorageSystem.getInventory();
    return inventory.map((sid) => this.getSkinById(sid)).filter(Boolean);
  },

  getActiveSkin() {
    return this.getSkinById(StorageSystem.getActiveSkin());
  },

  setActiveSkin(skinId) {
    const id = normalizeSkinId(skinId);
    if (!this.hasSkin(id)) return false;
    StorageSystem.setActiveSkin(id);
    return true;
  },

  invalidatePaintSlotTexture(slotIndex) {
    paintedSkinCacheBySlot.delete(Number(slotIndex));
  },

  invalidateAllPaintSlotTextures() {
    paintedSkinCacheBySlot.clear();
  },

  getPaintedSkinImageForSlot(slotIndex) {
    const url = StorageSystem.getPaintSlotDataUrl(slotIndex);
    if (!url) return null;
    const prev = paintedSkinCacheBySlot.get(slotIndex);
    if (prev && prev.memoUrl === url && prev.img) {
      return prev.img;
    }
    const img = new Image();
    img.src = url;
    paintedSkinCacheBySlot.set(slotIndex, { memoUrl: url, img });
    return img;
  },

  applySkinToPlayer(player, skinId) {
    if (!player || typeof player !== "object") return null;
    const skin = this.getSkinById(skinId || this.getActiveSkin().id);
    if (skin.type === "color") {
      player.color = skin.value;
      player.secondaryColor = null;
      player.skinImage = null;
      player.skinType = "color";
    } else if (skin.type === "dual") {
      player.color = skin.value.primary;
      player.secondaryColor = skin.value.secondary;
      player.skinImage = null;
      player.skinType = "dual";
    } else if (skin.type === "image") {
      player.secondaryColor = null;
      player.skinType = "image";
      player.color = "#cfd8dc";
      player.skinImage = this.loadSkinTexture(skin.value);
    } else if (skin.type === "painted" && typeof skin.slotIndex === "number") {
      player.secondaryColor = null;
      player.skinType = "image";
      player.color = "#cfd8dc";
      player.skinImage = this.getPaintedSkinImageForSlot(skin.slotIndex);
    }
    return skin;
  },

  preloadImageSkins() {
    SKINS.filter((s) => s.type === "image").forEach((s) => {
      if (typeof s.value === "string") this.loadSkinTexture(s.value);
    });
  },

  loadSkinTexture(src) {
    if (skinTextureCache.has(src)) return skinTextureCache.get(src);
    const img = new Image();
    img.src = resolveGameAssetUrl(src);
    skinTextureCache.set(src, img);
    return img;
  },

  drawSkinInCircle(ctx, skin, cx, cy, radius) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.save();
    ctx.clip();

    if (!skin || skin.type === "color") {
      ctx.fillStyle = skin?.value ?? "#ffffff";
      ctx.fill();
    } else if (skin.type === "dual" && skin.value) {
      const g = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      g.addColorStop(0, skin.value.primary);
      g.addColorStop(1, skin.value.secondary);
      ctx.fillStyle = g;
      ctx.fill();
    } else if (skin.type === "image" && typeof skin.value === "string") {
      const img = this.loadSkinTexture(skin.value);
      if (img.complete && img.naturalWidth > 0) {
        const scale = Math.max((2 * radius) / img.width, (2 * radius) / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      } else {
        ctx.fillStyle = "#546e7a";
        ctx.fill();
      }
    } else if (skin.type === "painted" && typeof skin.slotIndex === "number") {
      const img = this.getPaintedSkinImageForSlot(skin.slotIndex);
      if (img && img.complete && img.naturalWidth > 0) {
        const scale = Math.max((2 * radius) / img.naturalWidth, (2 * radius) / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
      } else {
        ctx.fillStyle = "#b0bec5";
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#eceff1";
      ctx.fill();
    }

    ctx.restore();
  },

  pickRandomBotSkinId(excludeSkinId = null) {
    const pool = SKINS.filter((s) => s.id !== excludeSkinId && s.type !== "painted");
    const sel = pool[Math.floor(Math.random() * pool.length)] ?? SKINS[0];
    return sel.id;
  },

  getSkinPreviewColor(skin) {
    if (!skin) return "#ffffff";
    if (skin.type === "dual" && skin.value && skin.value.primary) return skin.value.primary;
    if (skin.type === "image") return "#90a4ae";
    if (skin.type === "painted") return "#7e57c2";
    return typeof skin.value === "string" ? skin.value : "#ffffff";
  },
};

export default SkinSystem;
