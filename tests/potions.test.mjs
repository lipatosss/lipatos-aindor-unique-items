import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

test("installs ten potion templates with native one-dose use and no forced artwork", async () => {
  const hooks = new Map();
  const created = [];
  const module = { api: {} };
  const world = { contents: [] };
  const gm = { id: "gm", isGM: true, active: true };
  const context = vm.createContext({
    Hooks: { once: (event, cb) => hooks.set(event, cb), on: () => {} },
    game: {
      system: { id: "dnd5e" }, user: gm,
      users: { activeGM: gm, contents: [gm] },
      items: world, actors: { contents: [] }, modules: { get: () => module }
    },
    Item: { createDocuments: async items => { created.push(...items); return items; } },
    ui: { notifications: { info() {} } }, console
  });
  vm.runInContext(fs.readFileSync("scripts/potions.mjs", "utf8"), context);
  hooks.get("ready")();
  for (let i = 0; i < 3; i++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(created.length, 10);
  const byId = new Map(created.map(item => [item.system.identifier, item]));
  assert.equal(byId.size, 10);
  assert.equal(byId.get("zele-malogo-lecheniya").name, "Зелье малого лечения");
  assert.match(byId.get("zele-malogo-lecheniya").system.description.value, /2к4 \+ 2/);
  assert.match(byId.get("zele-malogo-lecheniya").system.description.value, /nebolshoi-flakon-dlya-zelia/);
  const poison = byId.get("zele-silnogo-yada");
  assert.equal(poison.name, "Зелье сильного яда");
  assert.equal(poison.system.rarity, "rare");
  assert.equal(poison.system.price.value, 800);
  assert.match(poison.system.description.value, /1к8/);
  assert.match(poison.system.description.value, /СЛ 14/);
  assert.match(poison.system.description.value, /nebolshoi-flakon-dlya-zelia/);
  const crafted = byId.get("kraftovoe-zele-lecheniya");
  assert.equal(crafted.name, "Крафтовое зелье лечения");
  assert.equal(crafted.system.price.value, 550);
  assert.equal(crafted.system.rarity, "common");
  assert.match(crafted.system.description.value, /2к4 \+ 3/);
  assert.match(crafted.system.description.value, /nebolshoi-flakon-dlya-zelia/);
  for (const item of created) {
    assert.equal(item.type, "consumable");
    assert.equal(item.system.type.value, "potion");
    assert.equal(item.system.weight.value, 0.5);
    assert.equal(item.system.weight.units, "lb");
    assert.equal(item.system.price.denomination, "sp");
    assert.equal(item.system.uses.max, "1");
    assert.equal(item.system.uses.autoDestroy, true);
    assert.equal(item.system.activities.potionUse0000001.type, "utility");
    assert.equal(item.system.activities.potionUse0000001.consumption.targets[0].value, "1");
    assert.equal(Object.hasOwn(item, "img"), false);
  }
  assert.equal(byId.get("zele-feniksa").system.rarity, "rare");
  assert.equal(byId.get("zele-prizrachnogo-shaga").system.price.value, 800);
  assert.equal(byId.get("zele-malogo-lecheniya").system.price.value, 500);
  assert.equal(byId.get("zele-skorosti").system.price.value, 300);
  assert.equal(byId.get("zele-buyvola").system.price.value, 250);
});
