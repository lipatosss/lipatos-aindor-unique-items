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

test("creates five profession items including alchemist gloves without icons", () => {
  assert.equal(created.length, 5);
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

test("alchemist leather gloves are wearable equipment with +1 alchemy and no custom icon", () => {
  const gloves = get("Кожаные перчатки алхимика");
  assert.ok(gloves);
  assert.equal(gloves.type, "equipment");
  assert.equal(gloves.system.equipped, false);
  assert.equal(gloves.system.price.value, 90);
  assert.equal(gloves.system.price.denomination, "sp");
  assert.equal(gloves.system.weight.value, 0.5);
  assert.equal(gloves.system.rarity, "uncommon");
  assert.deepEqual(gloves.flags["lipatos-aindor-unique-items"].professionBonuses,
    [{id:"alchemy",value:1}]);
  assert.deepEqual(gloves.flags["lipatos-aindor-unique-items"].professionBonus,
    {id:"alchemy",value:1});
  assert.equal(Object.hasOwn(gloves, "img"), false);
});
