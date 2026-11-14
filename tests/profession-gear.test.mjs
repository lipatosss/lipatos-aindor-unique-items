import test from "node:test";
import assert from "node:assert/strict";

const callbacks = new Map();
globalThis.Hooks = { once(name, callback) { callbacks.set(name, callback); } };
await import("../scripts/profession-gear.mjs");
const created = [];
globalThis.game = {
  user: { isGM: true, id: "gm" },
  users: { activeGM: { id: "gm" } },
  system: { id: "dnd5e" },
  items: { contents: [] },
  actors: { contents: [] }
};
globalThis.Item = { async create(data) { created.push(data); return data; } };
globalThis.ui = { notifications: { warn() {} } };
await callbacks.get("ready")();

const get = name => created.find(i => i.name === name);

test("creates both original items and two new weapons without custom icons", () => {
  assert.equal(created.length, 4);
  assert.equal(get("Эльфийский клинок ремесленника").type, "weapon");
  assert.equal(get("Нож шеф-повара Жумбы").type, "weapon");
  assert.ok(!Object.hasOwn(get("Эльфийский клинок ремесленника"), "img"));
  assert.ok(!Object.hasOwn(get("Нож шеф-повара Жумбы"), "img"));
});
test("elf blade grants both hunting and leatherworking, not just one", () => {
  const blade = get("Эльфийский клинок ремесленника");
  assert.deepEqual(blade.flags["lipatos-aindor-unique-items"].professionBonuses,
    [{id:"hunting",value:2},{id:"leatherworking",value:2}]);
  assert.equal(blade.system.damage.base.denomination,6);
  assert.equal(blade.system.equipped,false);
});
test("chef knife grants cooking +1 and keeps the old compatibility flag", () => {
  const knife = get("Нож шеф-повара Жумбы");
  assert.deepEqual(knife.flags["lipatos-aindor-unique-items"].professionBonus,
    {id:"cooking",value:1});
  assert.equal(knife.system.damage.base.denomination,4);
});
