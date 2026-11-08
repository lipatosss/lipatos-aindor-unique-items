import test from "node:test";
import assert from "node:assert/strict";

// Regression: the belt module must not prepare ALL actors a second time.
// Extra prepareData during ready used to display class level 3 as level 6
// until an unrelated inventory update forced a normal Foundry calculation.
test("startup and item updates never manually repeat actor.prepareData", async () => {
  const hooks = new Map();
  globalThis.Hooks = {
    once(name, callback) { hooks.set(name, [...(hooks.get(name) ?? []), callback]); },
    on(name, callback) { hooks.set(name, [...(hooks.get(name) ?? []), callback]); }
  };
  const fire = (name, ...args) => {
    for (const callback of hooks.get(name) ?? []) callback(...args);
  };
  let wrapped = null;
  globalThis.libWrapper = {
    register(id, path, callback, mode) {
      assert.equal(id, "lipatos-aindor-unique-items");
      assert.equal(path, "CONFIG.Actor.documentClass.prototype.prepareData");
      assert.equal(mode, "WRAPPER");
      wrapped = callback;
    }
  };
  let calls = 0;
  const actor = {
    type: "character",
    items: { contents: [{type: "equipment", name: "Прочный кожаный ремень",
      system: {equipped: true}}] },
    system: { details: { level: 3 }, attributes: {
      encumbrance: {value: 40, max: 100, pct: 40}
    } },
    prepareData() { calls++; this.system.details.level += 3; },
    sheet: { rendered: true, render() { throw new Error("Manual render forbidden"); } }
  };
  globalThis.game = {actors: {contents: [actor]}};
  globalThis.canvas = {tokens: {placeables: [{actor}]}};
  globalThis.ui = {notifications: {error(message) {throw Error(message);}}};

  await import("../scripts/belt.js");
  fire("setup");
  assert.equal(typeof wrapped, "function");
  fire("ready");
  fire("updateItem", {name: "Прочный кожаный ремень", parent: actor});
  assert.equal(calls, 0, "Neither hook may re-prepare a character");
  assert.equal(actor.system.details.level, 3, "Level remains the actual class level");

  const result = wrapped.call(actor, () => "prepared");
  assert.equal(result, "prepared");
  assert.equal(actor.system.attributes.encumbrance.value, 25,
    "Equipped belt still deducts 15 lb through libWrapper");
  wrapped.call(actor, () => "prepared again");
  assert.equal(actor.system.attributes.encumbrance.value, 25,
    "Repeated hooks must not double-reduce weight");
  assert.equal(actor.system.details.level, 3);
});
