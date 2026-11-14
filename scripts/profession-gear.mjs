/**
 * Снаряжение для ремёсел Айндора. Foundry v14 / dnd5e 6.x.
 * В мире создаются шаблоны предметов без индивидуальных иконок.
 * Бонусы читает модуль lipatos-professions по флагу professionBonus.
 */
const SCOPE = "lipatos-aindor-unique-items";
const GEAR = [
  {
    identifier: "kozhannyy-fartuh-povara",
    name: "Кожанный фартух повара",
    profession: "cooking",
    bonus: 1,
    price: 85,
    weight: 2,
    rarity: "uncommon",
    description: "<p>Практичный фартух из мягкой выделанной кожи, укреплённый плотными швами и регулируемыми ремешками. Защищает одежду от горячих брызг, жира и случайных порезов. В его карманах удобно держать специи, кухонные принадлежности и нужные ингредиенты.</p>"
      + "<h3>Эффект — Опытная рука</h3><p>Пока фартух <strong>надет</strong>, владелец получает <strong>+1 к проверкам ремесла «Кулинария»</strong>. Снятие фартуха немедленно убирает бонус. Не требует настройки.</p>"
  },
  {
    identifier: "prosmolennyy-kozhannyy-kostyum-rybaka",
    name: "Просмоленный кожанный костюм рыбака",
    profession: "fishing",
    bonus: 2,
    price: 180,
    weight: 5,
    rarity: "uncommon",
    description: "<p>Прочный рыбацкий костюм из плотной выделанной кожи, тщательно пропитанной древесной смолой и воском. Швы защищены от сырости, а усиленные участки не боятся контакта с мокрыми снастями и грубыми верёвками. Удобные карманы и крепления помогают быстро доставать инструменты и справляться с уловом даже под дождём.</p>"
      + "<h3>Эффект — Рыбацкая сноровка</h3><p>Пока костюм <strong>надет</strong>, владелец получает <strong>+2 к проверкам ремесла «Рыболовство»</strong>. Снятие костюма немедленно убирает бонус. Не требует настройки.</p>"
  }
];

function makeGearItem(entry) {
  return {
    name: entry.name,
    type: "equipment",
    // No custom img: Foundry uses its default placeholder until the GM sets one.
    system: {
      identifier: entry.identifier,
      description: { value: entry.description, chat: "" },
      source: { rules: "2014" },
      quantity: 1,
      weight: { value: entry.weight, units: "lb" },
      price: { value: entry.price, denomination: "sp" },
      rarity: entry.rarity,
      type: { value: "clothing", subtype: "", baseItem: "" },
      properties: [],
      equipped: false,
      attunement: { type: "", attuned: false },
      identified: true
    },
    flags: {
      [SCOPE]: {
        professionGear: entry.identifier,
        professionBonus: { id: entry.profession, value: entry.bonus }
      }
    }
  };
}

function exists(entry) {
  return (game.items?.contents ?? []).some(item => (
    item.system?.identifier === entry.identifier
    || item.flags?.[SCOPE]?.professionGear === entry.identifier
    || item.name?.trim() === entry.name
  ));
}

Hooks.once("ready", async () => {
  if (game.system?.id !== "dnd5e" || !game.user?.isGM) return;
  if (game.users?.activeGM && game.users.activeGM.id !== game.user.id) return;
  for (const entry of GEAR) {
    if (exists(entry)) continue;
    try {
      await Item.create(makeGearItem(entry), { renderSheet: false });
      console.info(SCOPE + " | Создан предмет ремесленника: " + entry.name);
    } catch (error) {
      console.error(SCOPE + " | Не удалось создать: " + entry.name, error);
      ui.notifications?.warn?.("Не удалось создать «" + entry.name + "» (F12).");
    }
  }
});
