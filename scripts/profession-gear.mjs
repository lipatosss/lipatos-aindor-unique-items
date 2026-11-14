/**
 * Снаряжение для ремёсел Айндора. Foundry v14 / dnd5e 6.x.
 * В мире создаются шаблоны предметов без индивидуальных иконок.
 * Бонусы читает модуль lipatos-professions по флагу professionBonus.
 */
const SCOPE = "lipatos-aindor-unique-items";
const GEAR = [
  {
    identifier: "kozhannyy-fartuh-povara",
    name: "Кожаный фартух повара",
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
  },
  {
    identifier: "elfiyskiy-klinok-remeslennika",
    name: "Эльфийский клинок ремесленника",
    itemType: "weapon",
    baseItem: "scimitar",
    professionBonuses: [{ id: "hunting", value: 2 }, { id: "leatherworking", value: 2 }],
    price: 340,
    weight: 3,
    rarity: "uncommon",
    description: "<p>Лёгкий изогнутый клинок эльфийской работы с тонким, необычайно прочным лезвием и удобной нескользящей рукоятью. Им удобно разделывать добычу, снимать шкуры и выполнять точные надрезы, не повреждая ценный материал. Орнамент вдоль обуха напоминает переплетающиеся лесные ветви.</p>"
      + "<h3>Эффект — Лесное мастерство</h3><p>Пока клинок <strong>экипирован</strong>, владелец получает <strong>+2 к проверкам ремесла «Охота»</strong> и <strong>+2 к проверкам ремесла «Кожевничество»</strong>. Оба бонуса действуют одновременно и исчезают при снятии. Это немагическое оружие, не требующее настройки.</p>"
      + "<p><strong>Оружие:</strong> скимитар; 1к6 рубящего урона, фехтовальное, лёгкое.</p>"
  },
  {
    identifier: "nozh-shef-povara-zhumby",
    name: "Нож шеф-повара Жумбы",
    itemType: "weapon",
    baseItem: "dagger",
    profession: "cooking",
    bonus: 1,
    price: 135,
    weight: 1,
    rarity: "uncommon",
    description: "<p>Любимый кухонный нож знаменитого шеф-повара Жумбы, выкованный из тщательно отполированной стали. Широкое острое лезвие удобно для разделки мяса, нарезки овощей и филигранной работы с деликатными ингредиентами. Удобная деревянная рукоять хранит следы множества приготовленных пиршеств.</p>"
      + "<h3>Эффект — Точная нарезка</h3><p>Пока нож <strong>экипирован</strong>, владелец получает <strong>+1 к проверкам ремесла «Кулинария»</strong>. При снятии бонус исчезает. Бонусы от нескольких одинаковых ремесленных предметов на одно ремесло не складываются: используется наибольший. Настройка не требуется.</p>"
      + "<p><strong>Оружие:</strong> кинжал; 1к4 рубящего урона, фехтовальное, лёгкое.</p>"
  },

  {
    identifier: "kozhanye-perchatki-alhimika",
    name: "Кожаные перчатки алхимика",
    profession: "alchemy",
    bonus: 1,
    price: 90,
    weight: 0.5,
    rarity: "uncommon",
    description: "<p>Пара облегающих перчаток из тонкой выделанной кожи, с усиленными швами и аккуратно подогнанными пальцами. Кожа обработана воском, чтобы защищать руки от брызг, не мешая точным движениям при работе со склянками, пипетками и хрупкими ингредиентами. Эти перчатки особенно ценят алхимики, которым важна твёрдость руки и аккуратность смешивания составов.</p>"
      + "<h3>Эффект — Уверенное смешивание</h3><p>Пока перчатки <strong>надеты</strong>, персонаж получает <strong>+1 к проверкам ремесла «Алхимия»</strong>. При снятии бонус исчезает. Настройка не требуется; бонусы от нескольких ремесленных предметов к одному ремеслу не складываются — используется наибольший.</p>"
  }
]; 

function gearBonuses(entry) {
  if (Array.isArray(entry.professionBonuses)) return entry.professionBonuses;
  return [{ id: entry.profession, value: entry.bonus }];
}

function craftWeaponActivity() {
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
      ability: "", bonus: "", critical: { threshold: null }, flat: false,
      type: { value: "melee", classification: "weapon" }
    },
    damage: { critical: { bonus: "" }, includeBase: true, parts: [] },
    uses: { spent: 0, recovery: [] }, sort: 0
  };
}

function makeGearItem(entry) {
  const bonuses = gearBonuses(entry);
  const common = {
    identifier: entry.identifier,
    description: { value: entry.description, chat: "" },
    source: { rules: "2014" },
    quantity: 1,
    weight: { value: entry.weight, units: "lb" },
    price: { value: entry.price, denomination: "sp" },
    rarity: entry.rarity,
    equipped: false,
    identified: true
  };
  const isWeapon = entry.itemType === "weapon";
  const system = isWeapon ? {
    ...common,
    type: {
      value: entry.baseItem === "scimitar" ? "martialM" : "simpleM",
      baseItem: entry.baseItem
    },
    attunement: "",
    properties: ["fin", "lgt"],
    range: { value: null, long: null, reach: 5, units: "ft" },
    damage: {
      base: {
        number: 1,
        denomination: entry.baseItem === "scimitar" ? 6 : 4,
        bonus: "",
        types: ["slashing"]
      }
    },
    magicalBonus: null,
    mastery: "",
    activities: { dnd5eactivity000: craftWeaponActivity() }
  } : {
    ...common,
    type: { value: "clothing", subtype: "", baseItem: "" },
    properties: [],
    attunement: { type: "", attuned: false }
  };
  return {
    name: entry.name,
    type: isWeapon ? "weapon" : "equipment",
    // No img property: Foundry's default placeholder, replace it manually.
    system,
    flags: {
      [SCOPE]: {
        professionGear: entry.identifier,
        professionBonuses: bonuses,
        // Legacy key remains available for existing single-bonus integrations.
        ...(bonuses.length === 1 ? { professionBonus: bonuses[0] } : {})
      }
    }
  };
}

function matchesGear(item, entry) {
  if (!["equipment", "weapon"].includes(item?.type)) return false;
  const id = item.system?.identifier;
  const flag = item.flags?.[SCOPE]?.professionGear;
  const name = String(item.name ?? "").trim().toLowerCase();
  return id === entry.identifier || flag === entry.identifier
    || name === entry.name.toLowerCase()
    || (entry.profession === "cooking" && name === "кожанный фартух повара");
}

// Repair copies made by Item Piles or older versions without overwriting
// item artwork, equipment state or any other item data.
async function repairGearFlags(item, entry) {
  const scope = item.flags?.[SCOPE] ?? {};
  const bonuses = gearBonuses(entry);
  const exact = Array.isArray(scope.professionBonuses)
    && JSON.stringify(scope.professionBonuses) === JSON.stringify(bonuses);
  const legacy = bonuses.length === 1
    && scope.professionBonus?.id === bonuses[0].id
    && Number(scope.professionBonus?.value) === bonuses[0].value;
  if (scope.professionGear === entry.identifier && exact
      && (bonuses.length !== 1 || legacy)) return false;
  const update = {
    ["flags." + SCOPE + ".professionGear"]: entry.identifier,
    ["flags." + SCOPE + ".professionBonuses"]: bonuses
  };
  if (bonuses.length === 1) update["flags." + SCOPE + ".professionBonus"] = bonuses[0];
  await item.update(update);
  return true;
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

  const allItems = [
    ...(game.items?.contents ?? []),
    ...(game.actors?.contents ?? []).flatMap(actor => actor.items?.contents ?? [])
  ];
  for (const item of allItems) {
    const entry = GEAR.find(e => matchesGear(item, e));
    if (!entry) continue;
    try {
      if (await repairGearFlags(item, entry)) {
        console.info(SCOPE + " | Восстановлены флаги предмета: " + item.name);
      }
    } catch (error) {
      console.error(SCOPE + " | Не удалось восстановить флаги: " + item.name, error);
    }
  }
});
