/**
 * Aindor shop bows — Foundry VTT v14, D&D5e 6.x (2014).
 * All bonuses use native weapon fields and do not require attack hooks.
 * Creates missing world item templates only. Never replaces existing icons.
 */
const BOW_SCOPE = "lipatos-aindor-unique-items";
const BOWS = [
  {
    name: "Лук соколиного глаза",
    id: "luk-sokolinogo-glaza",
    price: 190,
    die: 8,
    crit: 19,
    img: "icons/weapons/bows/longbow-recurve-leather-brown.webp",
    description: "<p>Точный длинный лук с тщательно сбалансированными плечами.</p>"
      + "<p><strong>Соколиный глаз.</strong> Атаки из этого лука становятся критическими попаданиями "
      + "при результате <strong>19 или 20 на к20</strong>. Базовый урон: 1к8 колющего.</p>"
  },
  {
    name: "Лук тяжёлой тетивы",
    id: "luk-tyazheloy-tetivy",
    price: 160,
    die: 10,
    crit: null,
    img: "icons/weapons/bows/bow-recurve-black.webp",
    description: "<p>Усиленные плечи и необычно тугая тетива придают этому луку большую мощь.</p>"
      + "<p><strong>Мощный натяг.</strong> Вместо обычных 1к8 базовый урон лука составляет "
      + "<strong>1к10 колющего</strong>. Бонус атаки не меняется.</p>"
  }
];

function bowActivity(threshold) {
  return {
    _id: "dnd5eactivity000",
    type: "attack",
    activation: { type: "action", value: 1, condition: "", override: false },
    consumption: { targets: [], scaling: { allowed: false, max: "" }, spellSlot: true },
    description: { chatFlavor: "" },
    duration: { concentration: false, value: "", units: "", special: "", override: false },
    effects: [],
    range: { value: "150", units: "ft", special: "", override: false },
    target: {
      template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "" },
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false
    },
    attack: {
      ability: "", bonus: "", critical: { threshold }, flat: false,
      type: { value: "ranged", classification: "weapon" }
    },
    damage: { critical: { bonus: "" }, includeBase: true, parts: [] },
    uses: { spent: 0, recovery: [] }, sort: 0
  };
}

function bowData(bow) {
  const activity = bowActivity(bow.crit);
  return {
    name: bow.name, type: "weapon", img: bow.img,
    system: {
      identifier: bow.id,
      description: { value: bow.description },
      source: { rules: "2014" },
      quantity: 1, weight: { value: 2, units: "lb" },
      price: { value: bow.price, denomination: "gp" },
      rarity: "uncommon", equipped: false, identified: true,
      range: { value: 150, long: 600, reach: null, units: "ft" },
      damage: { base: { number: 1, denomination: bow.die, bonus: "", types: ["piercing"] } },
      properties: ["amm", "hvy", "two"], proficient: null,
      type: { value: "martialR", baseItem: "longbow" },
      ammunition: { type: "arrow" }, magicalBonus: null, mastery: "",
      activities: { [activity._id]: activity }
    },
    flags: { [BOW_SCOPE]: { shopBow: bow.id } }
  };
}

function bowExists(bow) {
  return (game.items?.contents ?? []).some(item => item.type === "weapon" && (
    String(item.system?.identifier ?? "").trim().toLowerCase() === bow.id
    || item.name?.trim() === bow.name
    || item.flags?.[BOW_SCOPE]?.shopBow === bow.id
  ));
}

Hooks.once("ready", async () => {
  if (!game.user?.isGM) return;
  if (game.users?.activeGM && game.users.activeGM.id !== game.user.id) return;
  for (const bow of BOWS) {
    if (bowExists(bow)) continue;
    try {
      const result = await Item.create(bowData(bow), { renderSheet: false });
      if (!result) throw new Error("Item.create returned null");
      console.info(BOW_SCOPE + " | Создан магазинный предмет: " + bow.name);
    } catch (error) {
      console.error(BOW_SCOPE + " | Ошибка создания лука: " + bow.name, error);
      ui.notifications?.warn?.("Не удалось создать «" + bow.name + "». Подробности в F12.");
    }
  }
});
