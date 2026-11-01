/**
 * Магазинные мечи Айндора.
 * Foundry v14 / D&D5e 6.x / правила 2014.
 * Штатные настройки Weapon Attack; без собственных обработчиков атак.
 * Создаёт отсутствующие шаблоны в Предметах мира, не меняет старые предметы/иконки.
 */
const AINDOR_SWORD_SCOPE = "lipatos-aindor-unique-items";
const AINDOR_SWORDS = Object.freeze([
  {
    identifier: "mech-rokovoy-grani",
    name: "Меч роковой грани",
    price: 195,
    rarity: "uncommon",
    magical: false,
    criticalThreshold: 19,
    img: "icons/weapons/swords/greatsword-guard.webp",
    description: "<p>Длинный меч с идеально выведенной кромкой и тонко подобранным балансом, созданный для точных, смертельно опасных ударов.</p>"
      + "<p><strong>Роковая грань.</strong> Атаки этим мечом считаются критическими попаданиями при результате <strong>19 или 20 на к20</strong>. Действует только для данного меча, бонуса к атаке не предоставляет.</p>"
      + "<p><strong>Урон:</strong> 1к8 рубящего одной рукой или 1к10 рубящего двумя руками.</p>"
  },
  {
    identifier: "mech-tleyushchey-stali",
    name: "Меч тлеющей стали",
    price: 275,
    rarity: "uncommon",
    magical: true,
    criticalThreshold: null,
    img: "icons/weapons/swords/sword-guard-flared.webp",
    description: "<p>В стальном клинке едва заметно тлеют тёмно-красные прожилки. При ударе с лезвия слетают искры.</p>"
      + "<p><strong>Тлеющая сталь.</strong> При попадании этим магическим мечом цель получает <strong>дополнительно 1к4 урона огнём</strong>. Дополнительный урон прибавляется при каждом попадании, включая критические попадания; бонуса к броску атаки нет.</p>"
      + "<p><strong>Урон:</strong> 1к8 рубящего одной рукой или 1к10 рубящего двумя руками, плюс 1к4 огнём.</p>"
  }
]);

function aindorSwordAttack(config) {
  const fire = config.magical
    ? [{
      number: 1,
      denomination: 4,
      bonus: "",
      types: ["fire"],
      custom: { enabled: false, formula: "" }
    }]
    : [];
  return {
    _id: "dnd5eactivity000",
    type: "attack",
    activation: { type: "action", value: 1, condition: "", override: false },
    consumption: { targets: [], scaling: { allowed: false, max: "" }, spellSlot: true },
    description: { chatFlavor: "" },
    duration: { concentration: false, value: "", units: "", special: "", override: false },
    effects: [],
    range: { value: "5", units: "ft", special: "", override: false },
    target: {
      template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "" },
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false
    },
    attack: {
      ability: "", bonus: "",
      critical: { threshold: config.criticalThreshold },
      flat: false,
      type: { value: "melee", classification: "weapon" }
    },
    damage: {
      critical: { bonus: "" },
      includeBase: true,
      parts: fire
    },
    uses: { spent: 0, recovery: [] },
    sort: 0
  };
}

function aindorSwordData(config) {
  const activity = aindorSwordAttack(config);
  return {
    name: config.name,
    type: "weapon",
    img: config.img,
    system: {
      identifier: config.identifier,
      description: { value: config.description, chat: "" },
      source: { rules: "2014" },
      quantity: 1,
      weight: { value: 3, units: "lb" },
      price: { value: config.price, denomination: "gp" },
      attunement: "",
      equipped: false,
      rarity: config.rarity,
      identified: true,
      range: { value: null, long: null, reach: null, units: "ft" },
      damage: {
        base: { number: 1, denomination: 8, bonus: "", types: ["slashing"] },
        versatile: { number: 1, denomination: 10, bonus: "", types: ["slashing"] }
      },
      properties: config.magical ? ["ver", "mgc"] : ["ver"],
      proficient: null,
      type: { value: "martialM", baseItem: "longsword" },
      magicalBonus: null,
      mastery: "",
      activities: { [activity._id]: activity }
    },
    flags: { [AINDOR_SWORD_SCOPE]: { shopSword: config.identifier } }
  };
}

function aindorWorldHasSword(config) {
  return (game.items?.contents ?? []).some(item =>
    item.type === "weapon" && (
      String(item.system?.identifier ?? "").trim().toLowerCase() === config.identifier
      || item.name?.trim() === config.name
      || item.flags?.[AINDOR_SWORD_SCOPE]?.shopSword === config.identifier
    )
  );
}

Hooks.once("ready", async () => {
  if (!game.user?.isGM) return;
  if (game.users?.activeGM && game.users.activeGM.id !== game.user.id) return;

  for (const sword of AINDOR_SWORDS) {
    if (aindorWorldHasSword(sword)) continue;
    try {
      const created = await Item.create(aindorSwordData(sword), { renderSheet: false });
      if (!created) throw new Error("Item.create вернул null");
      console.info(AINDOR_SWORD_SCOPE + " | В «Предметы мира» добавлен: " + sword.name);
    } catch (error) {
      console.error(AINDOR_SWORD_SCOPE + " | Не удалось создать " + sword.name, error);
      ui.notifications?.warn?.("Не удалось создать «" + sword.name + "». Подробности в F12.");
    }
  }
});
