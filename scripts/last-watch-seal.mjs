/**
 * Печать Последнего Дозора. Foundry VTT v14 / dnd5e 6.x / правила 2014.
 * Без дополнительных макросов и без Midi-QOL: штатный AE, один заряд за долгий
 * отдых, контекстная реакция ГМа при получении союзником урона.
 * Решение об использовании ограниченного ресурса всегда остаётся за человеком.
 */
const SEAL_MODULE = "lipatos-aindor-unique-items";
const SEAL_IDENTIFIER = "pechat-poslednego-dozora";
const SEAL_NAME = "Печать Последнего Дозора";
const SEAL_ACTIVITY = "sealReact0000001";
const SEAL_PENDING = new Set();
const SEAL_RECENT = new Map();

function isAindorSeal(item) {
  return item?.type === "equipment" && (
    item.flags?.[SEAL_MODULE]?.lastWatchSeal === true
    || item.system?.identifier === SEAL_IDENTIFIER
    || item.name?.trim() === SEAL_NAME
  );
}

function activeAindorSeal(actor) {
  return actor?.items?.find(item => {
    if (!isAindorSeal(item)) return false;
    if (item.system?.equipped !== true) return false;
    const att = item.system?.attunement;
    return att?.attuned === true || att === "attuned";
  }) ?? null;
}

function aindorSealCharges(item) {
  const max = Number(item?.system?.uses?.max ?? 0);
  const spent = Number(item?.system?.uses?.spent ?? 0);
  return Math.max(0, max - spent);
}

function aindorSealToken(actor) {
  return (canvas?.tokens?.placeables ?? []).find(t =>
    t.actor?.uuid === actor?.uuid || t.actor?.id === actor?.id
  ) ?? null;
}

function aindorSealDistance(a, b) {
  if (!a || !b) return Infinity;
  try {
    const path = canvas?.grid?.measurePath?.([a.center, b.center]);
    const measured = typeof path === "number" ? path : path?.distance;
    if (Number.isFinite(measured)) return measured;
  } catch (error) {
    console.debug(SEAL_MODULE + " | Не удалось измерить путь", error);
  }
  const pixels = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y);
  const gridPx = Number(canvas?.grid?.size ?? 100);
  const gridUnits = Number(canvas?.scene?.grid?.distance ?? 5);
  return pixels / gridPx * gridUnits;
}

function aindorSealVisible(a, b) {
  if (!a || !b || b.document?.hidden) return false;
  try {
    if (typeof Ray === "function" && typeof canvas?.walls?.checkCollision === "function") {
      return !canvas.walls.checkCollision(new Ray(a.center, b.center), { type: "sight", mode: "any" });
    }
  } catch (error) {
    console.debug(SEAL_MODULE + " | Проверка видимости недоступна", error);
  }
  return true;
}

function aindorSealAlly(a, b) {
  return !!(a && b && a.id !== b.id
    && a.actor && b.actor
    && a.document?.disposition === b.document?.disposition);
}

function aindorSealNearAlly(actor) {
  const wearer = aindorSealToken(actor);
  if (!wearer) return false;
  return (canvas?.tokens?.placeables ?? []).some(t =>
    aindorSealAlly(wearer, t)
    && Number(t.actor?.system?.attributes?.hp?.value ?? 0) > 0
    && aindorSealDistance(wearer, t) <= 5
  );
}

function aindorSealGM() {
  return game.user?.isGM && (!game.users?.activeGM || game.users.activeGM.id === game.user.id);
}

function aindorSealDescription() {
  return "<p>Тяжёлая древняя печать из потемневшего серебра и чёрной стали. На её лицевой стороне вырезан щит, окружённый сомкнутыми копьями дозорных. Металл остаётся тёплым даже в самой холодной усыпальнице, словно хранит последнее обещание павшего ордена.</p>"
    + "<h3>Эффект — «Клятва последнего дозора»</h3>"
    + "<p><strong>Тип:</strong> чудесный предмет, очень редкий; требуется настройка.</p>"
    + "<ul><li>Пока Печать надета и настроена, вы получаете <strong>+1 к КД</strong>.</li>"
    + "<li>Пока в пределах <strong>5 футов</strong> от вас находится живой союзник, вы получаете <strong>преимущество на спасброски против испуга</strong>.</li></ul>"
    + "<h3>Защита клятвы — 1 раз до долгого отдыха</h3>"
    + "<p>Когда видимый союзник в пределах <strong>30 футов</strong> получает урон, вы можете потратить <strong>реакцию</strong> и один заряд Печати, выбрав <strong>один</strong> из вариантов:</p>"
    + "<ul><li><strong>Отразить удар:</strong> уменьшить полученный урон на <strong>2к6 + бонус мастерства</strong>.</li>"
    + "<li><strong>Не падать:</strong> если союзник в пределах <strong>5 футов</strong> от вас должен опуститься до 0 хитов, вместо этого он остаётся с <strong>1 хитом</strong>.</li></ul>"
    + "<p>Оба варианта используют один общий заряд, восстанавливающийся после долгого отдыха. Реакция предлагается ГМу автоматически после штатного применения урона D&amp;D5e; восстановление хитов и временных хитов рассчитывает модуль. При использовании других способов внесения урона реакцию можно вызвать через действие предмета, выбрав целью союзника.</p>";
}

function aindorSealItemData() {
  return {
    name: SEAL_NAME,
    type: "equipment",
    img: "icons/equipment/neck/necklace-triquetra-silver.webp",
    system: {
      identifier: SEAL_IDENTIFIER,
      description: { value: aindorSealDescription(), chat: "" },
      source: { rules: "2014" },
      quantity: 1,
      weight: { value: 0.5, units: "lb" },
      price: { value: 2500, denomination: "gp" },
      rarity: "veryRare",
      type: { value: "trinket", subtype: "", baseItem: "" },
      properties: ["mgc"],
      identified: true,
      equipped: false,
      attunement: { type: "required", attuned: false },
      uses: {
        max: "1",
        spent: 0,
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }]
      },
      activities: {
        [SEAL_ACTIVITY]: {
          _id: SEAL_ACTIVITY,
          name: "Защитить союзника",
          type: "utility",
          activation: { type: "reaction", value: 1, condition: "Когда союзник получает урон", override: false },
          consumption: { targets: [], scaling: { allowed: false, max: "" }, spellSlot: false },
          description: { chatFlavor: "Защита клятвы — один заряд за долгий отдых" },
          duration: { concentration: false, value: "", units: "", special: "", override: false },
          effects: [],
          range: { value: "30", units: "ft", special: "", override: false },
          target: {
            template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "" },
            affects: { count: "1", type: "ally", choice: false, special: "" },
            prompt: false,
            override: false
          },
          uses: { spent: 0, recovery: [] },
          sort: 0
        }
      }
    },
    effects: [{
      name: "Печать Последнего Дозора — +1 КД",
      img: "icons/equipment/neck/necklace-triquetra-silver.webp",
      transfer: true,
      disabled: false,
      changes: [{ key: "system.attributes.ac.bonus", mode: 2, value: "1", priority: 20 }],
      flags: { [SEAL_MODULE]: { lastWatchAc: true } }
    }],
    flags: { [SEAL_MODULE]: { lastWatchSeal: true } }
  };
}

async function aindorSealCreateWorldItem() {
  if (!aindorSealGM()) return;
  const existing = (game.items?.contents ?? []).some(isAindorSeal);
  if (existing) return;
  try {
    const result = await Item.create(aindorSealItemData(), { renderSheet: false });
    if (!result) throw new Error("Item.create вернул null");
    console.info(SEAL_MODULE + " | Добавлен шаблон: " + SEAL_NAME);
  } catch (error) {
    console.error(SEAL_MODULE + " | Ошибка создания Печати", error);
    ui.notifications?.error?.("Не удалось создать «Печать Последнего Дозора» (подробности в F12).");
  }
}

function aindorSealFearSave(config, dialog, message) {
  const actor = config?.subject ?? config?.actor ?? config?.options?.subject;
  if (!actor?.isOwner || !activeAindorSeal(actor) || !aindorSealNearAlly(actor)) return;
  // Другие спасброски не получают преимущество. Срабатывает лишь когда
  // источник явно помечен словом «испуг», «страх», «fear» и т. п.
  const hints = [
    config?.flavor, config?.reason, config?.source?.name, config?.item?.name,
    config?.options?.flavor, config?.options?.reason,
    config?.options?.source?.name, config?.options?.item?.name,
    dialog?.flavor, message?.flavor
  ].filter(s => typeof s === "string").join(" ").toLowerCase();
  if (!/(fright|fear|испуг|страх|устраш|ужас)/i.test(hints)) return;
  config.advantage = true;
  if (config?.options && typeof config.options === "object") config.options.advantage = true;
  if (dialog && typeof dialog === "object") dialog.advantage = true;
  console.info(SEAL_MODULE + " | Преимущество против испуга: " + actor.name);
}

function aindorSealIncoming(changes) {
  const hpLoss = Math.max(0, -Number(changes?.hp ?? 0));
  const tempLoss = Math.max(0, -Number(changes?.temp ?? 0));
  const total = Math.max(0, -Number(changes?.total ?? (Number(changes?.hp ?? 0) + Number(changes?.temp ?? 0))));
  return { total, hpLoss, tempLoss };
}

async function aindorSealChoice(wearer, ally, incoming, distance) {
  const hp = Number(ally.system?.attributes?.hp?.value ?? 0);
  const rescue = distance <= 5 && hp <= 0 && incoming.hpLoss > 0;
  const DialogV2 = foundry?.applications?.api?.DialogV2;
  if (!DialogV2?.wait) {
    ui.notifications?.warn?.("Не удалось открыть окно реакции Печати. Проверьте поддержку DialogV2 в Foundry.");
    return null;
  }
  const safe = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const buttons = [
    { action: "reduce", label: "Уменьшить урон (2к6 + мастерство)", default: true, callback: () => "reduce" }
  ];
  if (rescue) buttons.push({ action: "rescue", label: "Оставить союзника на 1 хите", callback: () => "rescue" });
  buttons.push({ action: "skip", label: "Не тратить реакцию", callback: () => null });
  return DialogV2.wait({
    window: { title: "Печать Последнего Дозора — реакция" },
    content: "<p><strong>" + safe(wearer.name) + "</strong> может защитить союзника <strong>"
      + safe(ally.name) + "</strong>.</p><p>Полученный урон: <strong>"
      + incoming.total + "</strong>. Расстояние: " + Math.round(distance * 10) / 10
      + " фт.</p><p>Выбранное действие потратит реакцию и один заряд Печати до долгого отдыха.</p>",
    buttons,
    rejectClose: false
  });
}

async function aindorSealApply(wearerActor, seal, allyActor, changes, choice) {
  if (!activeAindorSeal(wearerActor) || aindorSealCharges(seal) < 1) return false;
  const incoming = aindorSealIncoming(changes);
  const hpData = allyActor.system?.attributes?.hp ?? {};
  const hp = Number(hpData.value ?? 0);
  const hpMax = Number(hpData.max ?? hp);
  const temp = Number(hpData.temp ?? 0);
  const update = {};
  let reduction = 0;
  let text = "";

  if (choice === "rescue") {
    if (hp > 0) return false;
    update["system.attributes.hp.value"] = 1;
    text = "<p>Союзник остаётся с <strong>1 хитом</strong>.</p>";
  } else if (choice === "reduce") {
    const pb = Number(wearerActor.system?.attributes?.prof ?? 2);
    const roll = await new Roll("2d6 + " + pb).evaluate();
    reduction = Math.min(incoming.total, Math.max(0, Number(roll.total)));
    // Штатное применение урона уже завершено. Восстанавливаем снятые
    // из-за этого удара HP, затем временные HP (без изменения максимумов).
    const restoreHp = Math.min(reduction, incoming.hpLoss);
    const restoreTemp = Math.min(reduction - restoreHp, incoming.tempLoss);
    update["system.attributes.hp.value"] = Math.min(hpMax, hp + restoreHp);
    update["system.attributes.hp.temp"] = Math.max(0, temp + restoreTemp);
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: wearerActor }),
      flavor: "Печать Последнего Дозора — отражённый урон"
    });
    text = "<p>Снижено урона: <strong>" + reduction + "</strong> (из "
      + incoming.total + "). Хиты и временные хиты восстановлены автоматически.</p>";
  } else return false;

  try {
    await seal.update({ "system.uses.spent": Number(seal.system?.uses?.spent ?? 0) + 1 });
    await allyActor.update(update);
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: wearerActor }),
      content: "<h3>Печать Последнего Дозора</h3><p><strong>"
        + wearerActor.name + "</strong> защищает <strong>"
        + allyActor.name + "</strong>.</p>" + text
    });
    return true;
  } catch (error) {
    console.error(SEAL_MODULE + " | Ошибка защитной реакции", error);
    ui.notifications?.error?.("Не удалось применить защиту Печати. Проверьте F12.");
    return false;
  }
}

async function aindorSealOffer(targetActor, changes, requestedActor = null) {
  if (!canvas?.ready || !targetActor) return;
  const victim = aindorSealToken(targetActor);
  if (!victim || !aindorSealIncoming(changes).total) return;
  const lockKey = targetActor.uuid;
  if (SEAL_PENDING.has(lockKey)) return;
  SEAL_PENDING.add(lockKey);
  try {
    const allies = (canvas.tokens?.placeables ?? []).filter(t => {
      if (!aindorSealAlly(t, victim)) return false;
      if (requestedActor && t.actor?.uuid !== requestedActor.uuid) return false;
      if (!aindorSealVisible(t, victim) || aindorSealDistance(t, victim) > 30) return false;
      const seal = activeAindorSeal(t.actor);
      return !!seal && aindorSealCharges(seal) > 0;
    }).sort((a, b) => aindorSealDistance(a, victim) - aindorSealDistance(b, victim));

    for (const bearer of allies) {
      const seal = activeAindorSeal(bearer.actor);
      if (!seal || aindorSealCharges(seal) < 1) continue;
      const distance = aindorSealDistance(bearer, victim);
      const decision = await aindorSealChoice(bearer.actor, targetActor, aindorSealIncoming(changes), distance);
      if (!decision) continue;
      if (await aindorSealApply(bearer.actor, seal, targetActor, changes, decision)) break;
    }
  } finally {
    SEAL_PENDING.delete(lockKey);
  }
}

Hooks.on("dnd5e.preRollSavingThrow", aindorSealFearSave);

Hooks.on("dnd5e.damageActor", (actor, changes) => {
  const loss = aindorSealIncoming(changes);
  if (loss.total <= 0 || !actor?.uuid) return;
  SEAL_RECENT.set(actor.uuid, { changes: { hp: changes.hp, temp: changes.temp, total: changes.total }, at: Date.now() });
  if (!aindorSealGM()) return;
  void aindorSealOffer(actor, changes);
});

Hooks.on("dnd5e.preUseActivity", activity => {
  if (activity?.id !== SEAL_ACTIVITY || !isAindorSeal(activity?.item)) return;
  const item = activity.item;
  const actor = item.actor;
  if (!actor || !activeAindorSeal(actor) || aindorSealCharges(item) < 1) {
    ui.notifications?.warn?.("Для защиты нужна надетая, настроенная Печать с доступным зарядом.");
    return false;
  }
  const targets = Array.from(game.user?.targets ?? []);
  if (targets.length !== 1) {
    ui.notifications?.warn?.("Назначьте ровно одного союзника целью (T).");
    return false;
  }
  const targetActor = targets[0].actor;
  const recent = targetActor && SEAL_RECENT.get(targetActor.uuid);
  if (!recent || Date.now() - recent.at > 60000) {
    ui.notifications?.warn?.("Нет недавнего урона этой цели. Реакция предлагается ГМу автоматически при получении урона.");
    return false;
  }
  void aindorSealOffer(targetActor, recent.changes, actor);
  return false;
});

Hooks.once("ready", () => {
  void aindorSealCreateWorldItem();
  console.info(SEAL_MODULE + " | Печать Последнего Дозора: защита и шаблон включены.");
});
