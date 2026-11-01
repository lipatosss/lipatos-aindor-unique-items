/**
 * LipatoS — Improved Mundane Ammunition (Foundry VTT v14, dnd5e v6.x).
 * Native dnd5e ammo type/subtype and a separate, fixed +1 piercing damage
 * part (NOT a +1 weapon/ammunition enchantment or attack modifier).
 * The normal dnd5e attack workflow handles one spent ammo per attack.
 */
const AMMO_SCOPE = "lipatos-aindor-unique-items";

const AINDOR_AMMO = [
  {
    id: "strela-shirokogo-nakonechnika",
    name: "Стрела широкого наконечника",
    subtype: "arrow",
    img: "icons/weapons/ammunition/arrows-broadhead-white.webp",
    weight: 0.05,
    description: "<p>Стрела с широким, тщательно заточенным стальным наконечником, "
      + "предназначенным для нанесения глубоких ран.</p>"
      + "<p><strong>Усиленное попадание.</strong> При попадании атака наносит "
      + "<strong>дополнительно 1 колющего урона</strong>. Бонус к броску атаки не предоставляется.</p>"
      + "<p>Немагический расходуемый боеприпас для коротких и длинных луков.</p>"
  },
  {
    id: "usilennyy-stalnoy-bolt",
    name: "Усиленный стальной болт",
    subtype: "crossbowBolt",
    img: "icons/weapons/ammunition/arrow-broadhead-white.webp",
    weight: 0.075,
    description: "<p>Усиленный арбалетный болт со стальным наконечником и "
      + "укреплённым древком для более глубокого проникновения.</p>"
      + "<p><strong>Усиленное попадание.</strong> При попадании атака наносит "
      + "<strong>дополнительно 1 колющего урона</strong>. Бонус к броску атаки не предоставляется.</p>"
      + "<p>Немагический расходуемый боеприпас для арбалетов.</p>"
  }
];

function aindorAmmoData(entry) {
  return {
    name: entry.name,
    type: "consumable",
    img: entry.img,
    system: {
      identifier: entry.id,
      description: { value: entry.description, chat: "" },
      source: { rules: "2014" },
      quantity: 1,
      weight: { value: entry.weight, units: "lb" },
      price: { value: 2, denomination: "gp" },
      attunement: "",
      equipped: false,
      rarity: "",
      identified: true,
      uses: { max: "", recovery: [], autoDestroy: false, spent: 0 },
      damage: {
        base: {
          number: null,
          denomination: 0,
          bonus: "1",
          types: ["piercing"],
          custom: { enabled: false, formula: "" },
          scaling: { mode: "", number: null, formula: "" }
        },
        replace: false
      },
      type: { value: "ammo", subtype: entry.subtype },
      properties: [],
      magicalBonus: null,
      activities: {}
    },
    flags: { [AMMO_SCOPE]: { shopAmmo: entry.id } }
  };
}

function aindorHasAmmo(entry) {
  return (game.items?.contents ?? []).some(item =>
    item.type === "consumable" && (
      String(item.system?.identifier ?? "").trim().toLowerCase() === entry.id
      || item.name?.trim() === entry.name
      || item.flags?.[AMMO_SCOPE]?.shopAmmo === entry.id
    )
  );
}

Hooks.once("ready", async () => {
  if (!game.user?.isGM) return;
  if (game.users?.activeGM && game.users.activeGM.id !== game.user.id) return;

  for (const entry of AINDOR_AMMO) {
    if (aindorHasAmmo(entry)) continue;
    try {
      const item = await Item.create(aindorAmmoData(entry), { renderSheet: false });
      if (!item) throw new Error("Item.create returned null");
      console.info(AMMO_SCOPE + " | В «Предметы мира» добавлено: " + entry.name);
    } catch (error) {
      console.error(AMMO_SCOPE + " | Ошибка создания боеприпаса: " + entry.name, error);
      ui.notifications?.warn?.("Не удалось создать «" + entry.name + "». Подробности в F12.");
    }
  }
});
