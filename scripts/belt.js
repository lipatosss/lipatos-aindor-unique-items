/**
 * Aindor Belt Weight for Foundry VTT v14 + D&D 5e
 * Patches calculated encumbrance after actor data preparation.
 * Does not alter item weights in saved world data.
 */
Hooks.once("ready", () => {
  const NAME = "Прочный кожаный ремень";
  const REDUCTION = 15;
  const KEY = "__lipatosAindorBeltWeightV1";

  if (globalThis[KEY]) {
    console.warn("Aindor Belt: weight calculation already patched. Please remove duplicate macros or modules.");
    return;
  }

  const ActorClass = CONFIG.Actor.documentClass;
  const oldPrepare = ActorClass?.prototype?.prepareData;
  if (typeof oldPrepare !== "function") {
    console.error("Aindor Belt: Actor.prepareData was not found.");
    return;
  }

  function wearing(actor) {
    return (actor.items?.contents ?? []).some(item => {
      if (item.name.trim() !== NAME || item.type !== "equipment") return false;
      const equipped = item.system?.equipped;
      return equipped === true || equipped?.value === true;
    });
  }

  ActorClass.prototype.prepareData = function (...args) {
    const result = oldPrepare.apply(this, args);
    if (this.type !== "character" || !wearing(this)) return result;
    const enc = this.system?.attributes?.encumbrance;
    if (!enc || !Number.isFinite(enc.value)) return result;

    try {
      enc.value = Math.round(Math.max(0, enc.value - REDUCTION) * 100) / 100;
      if (Number.isFinite(enc.max) && enc.max > 0 && "pct" in enc) {
        enc.pct = Math.min(100, enc.value / enc.max * 100);
      }
    } catch (error) {
      console.error("Aindor Belt: could not modify calculated encumbrance", error);
    }
    return result;
  };

  globalThis[KEY] = { original: oldPrepare, name: NAME, bonus: REDUCTION };

  Hooks.on("updateItem", item => {
    const actor = item.parent;
    if (!actor || actor.type !== "character" || item.name.trim() !== NAME) return;
    actor.prepareData();
    if (actor.sheet?.rendered) actor.sheet.render();
  });

  const actors = [
    ...game.actors.contents,
    ...(canvas?.tokens?.placeables ?? []).map(token => token.actor).filter(Boolean)
  ];
  for (const actor of new Set(actors)) {
    if (actor.type !== "character") continue;
    actor.prepareData();
    if (actor.sheet?.rendered) actor.sheet.render();
  }
  console.info("Aindor Belt: weight reduction installed (-15 lb when equipped)");
});
