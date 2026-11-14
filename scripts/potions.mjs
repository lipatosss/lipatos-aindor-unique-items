/**
 * Ten Aindor potions (including two healing variants): canonical world templates for Foundry v14 / dnd5e 6.x.
 * The matching LipatoS Buffs & Debuffs module handles effects after actual use.
 * Deliberately leave illustrations up to the GM.
 */
const NS = "lipatos-aindor-unique-items";
const ACTIVITY = "potionUse0000001";
const LEGACY_HEAL_ID = "zele-lecheniya";
const POTIONS = [
  {
    id: "zele-krovavyh-shipov", name: "Зелье кровавых шипов", rarity: "uncommon", price: 600,
    prose: "Густое зелье тёмно-багрового цвета, внутри которого медленно плавают крошечные острые кристаллы, напоминающие кровавые осколки. После употребления под кожей проступают едва заметные красные прожилки.",
    effect: "До долгого отдыха при попадании врага рукопашной атакой он получает 1к4 колющего урона. Повторное употребление не суммирует эффект."
  },
  {
    id: "zele-feniksa", name: "Зелье феникса", rarity: "rare", price: 1200,
    prose: "Ярко-алая жидкость с золотистыми искрами, напоминающими тлеющие угли. Даже сквозь стекло флакон излучает слабое тепло. В груди выпившего разгорается упорное пламя жизни.",
    effect: "Первый раз до долгого отдыха, когда хиты должны опуститься до 0, вместо этого остаётся 1 хит. После срабатывания эффект исчезает."
  },
  {
    id: "zele-prizrachnogo-shaga", name: "Зелье призрачного шага", rarity: "rare", price: 800,
    prose: "Полупрозрачная дымчато-серая жидкость с полосами серебристого тумана. Флакон кажется почти невесомым, а выпивший ощущает, будто его тело перестаёт подчиняться обычным границам пространства.",
    effect: "До долгого отдыха можно проходить сквозь пространство враждебных существ. Выход из их досягаемости не провоцирует атак. Нельзя завершить перемещение в пространстве другого существа."
  },
  {
    id: "zele-kostyanogo-pancirya", name: "Зелье костяного панциря", rarity: "uncommon", price: 600,
    prose: "Молочно-белая жидкость с густым осадком из мельчайших костяных частиц. При взбалтывании на стекле проступают узоры, похожие на переплетённые рёбра.",
    effect: "Первое критическое попадание по вам до долгого отдыха становится обычным попаданием без дополнительных костей критического урона. После срабатывания эффект исчезает."
  },
  {
    id: "zele-posledney-mesti", name: "Зелье последней мести", rarity: "uncommon", price: 400,
    prose: "Почти чёрная жидкость с глубоким багровым отливом. Тусклые красные искры внутри похожи на последние удары угасающего сердца.",
    effect: "Первый раз до долгого отдыха, когда хиты опускаются до 0, можно реакцией совершить одну атаку оружием перед потерей сознания. После срабатывания эффект исчезает."
  },
  {
    id: "zele-malogo-lecheniya", name: "Зелье малого лечения", rarity: "common", price: 500,
    prose: "Небольшой стеклянный флакон с густой рубиновой жидкостью, слегка светящейся изнутри. Сладковатый вкус с травяной горечью сопровождает быстрое заживление ран.",
    effect: "Мгновенно восстанавливает 2к4 + 2 хита, но не выше максимума."
  },
  {
    id: "kraftovoe-zele-lecheniya", name: "Крафтовое зелье лечения", rarity: "common", price: 550,
    prose: "Небольшой стеклянный флакон с насыщенно-красным алхимическим настоем, в котором мерцают тёплые золотистые искры. Сваренное вручную зелье пахнет лекарственными травами и свежим мёдом. После глотка по телу расходится мягкое тепло, ускоряющее заживление ран.",
    effect: "Мгновенно восстанавливает 2к4 + 3 хита, но не выше максимума."
  },
  {
    id: "zele-skorosti", name: "Зелье скорости", rarity: "uncommon", price: 300,
    prose: "Ярко-голубая жидкость с серебристыми искрами, которые непрерывно кружатся вихрем. Выпивший чувствует прохладный ветер и необыкновенную лёгкость во всём теле.",
    effect: "На 10 минут скорость передвижения удваивается. Дополнительных действий или атак зелье не предоставляет; повторное употребление обновляет срок."
  },
  {
    id: "zele-buyvola", name: "Зелье буйвола", rarity: "uncommon", price: 250,
    prose: "Тёмно-коричневое густое зелье с золотистыми прожилками, терпким травяным ароматом и горьковатым вкусом. Караванщики ценят его за силу в дороге.",
    effect: "До долгого отдыха максимальный переносимый вес увеличивается на 200 фунтов без изменения Силы. Повторное употребление не суммирует эффект."
  },
  {
    id: "zele-silnogo-yada", name: "Зелье сильного яда", rarity: "rare", price: 800,
    prose: "Тягучая тёмно-зелёная жидкость с чёрными прожилками и мелкими пузырьками, которые медленно поднимаются со дна флакона. На языке оставляет терпкую горечь, после чего смертоносный яд накапливается в оружии, которым пользуется выпивший.",
    effect: "До долгого отдыха следующее успешное попадание любым оружием наносит дополнительно 1к8 урона ядом. Цель становится Отравленной и получает 1к8 урона ядом в начале каждого своего хода. В конце каждого своего хода цель делает спасбросок Телосложения СЛ 14; при успехе отравление и периодический урон прекращаются. После срабатывания усиление оружия исчезает. Новое употребление обновляет ожидание следующего попадания, но не суммирует его."
  }
];
function potionDescription(entry) {
  return "<p>" + entry.prose + "</p><h3>Эффект</h3><p>" + entry.effect
    + "</p><p><strong>Применение:</strong> 1 действие; расходуется один флакон. "
    + "После употребления в инвентаре остаётся «Небольшой флакон для зелья» (nebolshoi-flakon-dlya-zelia). Автоматизацию обеспечивает «LipatoS — Баффы и дебаффы».</p>";
}
function potionUseActivity() {
  return {
    _id: ACTIVITY, name: "Выпить зелье", type: "utility",
    activation: { type: "action", value: 1, condition: "" },
    consumption: {
      targets: [{ type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
      scaling: { allowed: false, max: "" }, spellSlot: false
    },
    description: { chatFlavor: "" },
    uses: { spent: 0, recovery: [] }
  };
}
function potionItem(entry) {
  return {
    name: entry.name, type: "consumable",
    // Intentionally no img, so user-assigned images survive migration.
    system: {
      identifier: entry.id,
      type: { value: "potion", subtype: "" },
      source: { rules: "2014" },
      description: { value: potionDescription(entry), chat: "" },
      quantity: 1, weight: { value: 0.5, units: "lb" },
      price: { value: entry.price, denomination: "sp" },
      rarity: entry.rarity, identified: true,
      uses: { max: "1", spent: 0, recovery: [], prompt: false, autoDestroy: true },
      activities: { [ACTIVITY]: potionUseActivity() }
    },
    flags: { [NS]: { aindorPotion: entry.id } }
  };
}
function potionDefinition(item) {
  if (item?.type !== "consumable") return null;
  const id = String(item.system?.identifier ?? item.flags?.[NS]?.aindorPotion ?? "").trim().toLowerCase();
  // Upgrade ONLY our old healing template; never reinterpret a normal D&D healing item.
  if (id === LEGACY_HEAL_ID && item.flags?.[NS]?.aindorPotion === LEGACY_HEAL_ID)
    return POTIONS.find(p => p.id === "zele-malogo-lecheniya");
  return POTIONS.find(p => p.id === id)
    ?? POTIONS.find(p => p.name.toLocaleLowerCase("ru") === String(item.name ?? "").trim().toLocaleLowerCase("ru"))
    ?? null;
}
async function repairPotion(item) {
  const entry = potionDefinition(item);
  if (!entry) return false;
  const patch = {};
  if (entry.id === "zele-malogo-lecheniya" && item.name === "Зелье лечения") patch.name = entry.name;
  if (item.system?.identifier !== entry.id) patch["system.identifier"] = entry.id;
  if (item.flags?.[NS]?.aindorPotion !== entry.id) patch["flags." + NS + ".aindorPotion"] = entry.id;
  if (item.system?.type?.value !== "potion") patch["system.type.value"] = "potion";
  if (Number(item.system?.uses?.max ?? 0) !== 1) patch["system.uses.max"] = "1";
  if (item.system?.uses?.autoDestroy !== true) patch["system.uses.autoDestroy"] = true;
  if (item.system?.uses?.prompt !== false) patch["system.uses.prompt"] = false;
  const activities = item.toObject?.().system?.activities ?? {};
  if (!Object.keys(activities).length) patch["system.activities." + ACTIVITY] = potionUseActivity();
  // Existing quantity, charges spent, custom descriptions, icon and prices stay untouched.
  if (!Object.keys(patch).length) return false;
  await item.update(patch);
  return true;
}
function firstGM() {
  return game.users?.activeGM ?? game.users?.contents?.find(u => u.isGM && u.active);
}
async function installAindorPotions() {
  if (!game.user?.isGM || (firstGM() && firstGM().id !== game.user.id)) return [];
  const world = game.items?.contents ?? [];
  const existing = new Set(world.map(i => potionDefinition(i)?.id).filter(Boolean));
  const missing = POTIONS.filter(p => !existing.has(p.id));
  const created = missing.length ? await Item.createDocuments(missing.map(potionItem)) : [];
  const actors = (game.actors?.contents ?? []).flatMap(a => a.items?.contents ?? []);
  for (const item of [...world, ...actors]) {
    if (potionDefinition(item)) await repairPotion(item);
  }
  return created;
}
Hooks.once("ready", () => {
  if (game.system?.id !== "dnd5e") return;
  const module = game.modules.get(NS);
  if (module) module.api = {
    ...(module.api ?? {}), listAindorPotions: () => POTIONS.map(p => ({...p})),
    installAindorPotions
  };
  void installAindorPotions().then(items => {
    if (items?.length) ui.notifications?.info?.("Айндор: добавлено зелий в «Предметы мира»: " + items.length);
  }).catch(error => console.error(NS + " | Ошибка установки зелий", error));
});
Hooks.on("createItem", (item, options, userId) => {
  if (item.parent?.documentName !== "Actor" || !potionDefinition(item)) return;
  if (game.user?.isGM ? firstGM()?.id !== game.user.id : game.user?.id !== userId) return;
  void repairPotion(item).catch(error => console.warn(NS + " | Не удалось восстановить зелье", error));
});
