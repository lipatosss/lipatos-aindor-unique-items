/**
 * LipatoS — Sturdy Leather Belt
 * Applies a -15 lb reduction to the calculated current encumbrance.
 * The original prepareData method remains under libWrapper's control so DAE
 * and other modules can participate in the same call chain.
 */
const AINDOR_BELT_MODULE_ID = "lipatos-aindor-unique-items";
const AINDOR_BELT_NAME = "Прочный кожаный ремень";
const AINDOR_BELT_REDUCTION = 15;
const AINDOR_BELT_REGISTRATION_KEY = "__lipatosAindorBeltLibWrapperV2";

function aindorBeltIsEquipped(actor) {
  return (actor.items?.contents ?? []).some(item => {
    if (item.type !== "equipment" || item.name?.trim() !== AINDOR_BELT_NAME) return false;
    const equipped = item.system?.equipped;
    return equipped === true || equipped?.value === true;
  });
}

function aindorBeltApplyEncumbrance(actor) {
  if (actor?.type !== "character" || !aindorBeltIsEquipped(actor)) return;

  const encumbrance = actor.system?.attributes?.encumbrance;
  if (!encumbrance || !Number.isFinite(encumbrance.value)) return;

  try {
    encumbrance.value = Math.round(Math.max(0, encumbrance.value - AINDOR_BELT_REDUCTION) * 100) / 100;
    if (Number.isFinite(encumbrance.max) && encumbrance.max > 0 && "pct" in encumbrance) {
      encumbrance.pct = Math.min(100, encumbrance.value / encumbrance.max * 100);
    }
  } catch (error) {
    console.error(`${AINDOR_BELT_MODULE_ID} | Не удалось применить снижение загруженности ремнём`, error);
  }
}

Hooks.once("setup", () => {
  if (globalThis[AINDOR_BELT_REGISTRATION_KEY]) return;

  // Never replace prepareData directly. That causes libWrapper warnings with DAE.
  if (typeof globalThis.libWrapper?.register !== "function") {
    console.error(`${AINDOR_BELT_MODULE_ID} | Для ремня требуется включённый libWrapper.`);
    Hooks.once("ready", () => ui.notifications?.error(
      "LipatoS — Уникальные предметы Айндора: включите модуль libWrapper для работы ремня."
    ));
    return;
  }

  try {
    globalThis.libWrapper.register(
      AINDOR_BELT_MODULE_ID,
      "CONFIG.Actor.documentClass.prototype.prepareData",
      function (wrapped, ...args) {
        const result = wrapped(...args);
        if (result && typeof result.then === "function") {
          return result.then(value => {
            aindorBeltApplyEncumbrance(this);
            return value;
          });
        }
        aindorBeltApplyEncumbrance(this);
        return result;
      },
      "WRAPPER"
    );
    globalThis[AINDOR_BELT_REGISTRATION_KEY] = true;
  } catch (error) {
    console.error(`${AINDOR_BELT_MODULE_ID} | Ошибка регистрации в libWrapper`, error);
    Hooks.once("ready", () => ui.notifications?.error(
      "LipatoS — Уникальные предметы Айндора: не удалось зарегистрировать эффект ремня (F12)."
    ));
    return;
  }

  Hooks.on("updateItem", item => {
    const actor = item.parent;
    if (actor?.type !== "character" || item.name?.trim() !== AINDOR_BELT_NAME) return;
    actor.prepareData();
    if (actor.sheet?.rendered) actor.sheet.render();
  });
});

Hooks.once("ready", () => {
  if (!globalThis[AINDOR_BELT_REGISTRATION_KEY]) return;

  const actors = [
    ...(game.actors?.contents ?? []),
    ...(globalThis.canvas?.tokens?.placeables ?? []).map(token => token.actor).filter(Boolean)
  ];
  for (const actor of new Set(actors)) {
    if (actor.type !== "character") continue;
    actor.prepareData();
    if (actor.sheet?.rendered) actor.sheet.render();
  }
  console.info(`${AINDOR_BELT_MODULE_ID} | Эффект ремня зарегистрирован через libWrapper (−15 фунтов).`);
});
