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

test("artisan gloves are wearable equipment with both +1 alchemy and +1 glassblowing, no custom icon", () => {
  const gloves = get("Кожаные перчатки алхимика и стеклодува");
  assert.ok(gloves);
  assert.equal(gloves.type, "equipment");
  assert.equal(gloves.system.equipped, false);
  assert.equal(gloves.system.price.value, 90);
  assert.equal(gloves.system.price.denomination, "sp");
  assert.equal(gloves.system.weight.value, 0.5);
  assert.equal(gloves.system.rarity, "uncommon");
  assert.deepEqual(gloves.flags["lipatos-aindor-unique-items"].professionBonuses,
    [{id:"alchemy",value:1},{id:"glassblowing",value:1}]);
  assert.equal(Object.hasOwn(gloves, "img"), false);
});

test("upgrades legacy glove already in actor inventory, keeps icon and equipped status", async () => {
  const oldGloves = {
    type:"equipment", name:"Кожаные перчатки алхимика",
    img:"my-custom-art/gloves.webp",
    system:{
      identifier:"kozhanye-perchatki-alhimika",equipped:true,
      description:{value:"Старая версия"},
      price:{value:90,denomination:"sp"}
    },
    flags:{"lipatos-aindor-unique-items":{
      professionGear:"kozhanye-perchatki-alhimika",
      professionBonus:{id:"alchemy",value:1},
      professionBonuses:[{id:"alchemy",value:1}]
    }},
    async update(changes) {
      for (const [key, value] of Object.entries(changes)) {
        if (key==="name") { this.name=value;continue; }
        const parts=key.split(".");
        let object=this;
        while (parts.length>1) { const part=parts.shift();object[part]??={};object=object[part]; }
        object[parts[0]]=value;
      }
    }
  };
  // Only the exact existing glove should be migrated; no duplicate glove
  // should be created in the world when its legacy name exists.
  const countBefore=created.length;
  game.items.contents=[oldGloves];
  game.actors.contents=[{items:{contents:[oldGloves]}}];
  await callbacks.get("ready")();
  assert.equal(oldGloves.name,"Кожаные перчатки алхимика и стеклодува");
  assert.deepEqual(oldGloves.flags["lipatos-aindor-unique-items"].professionBonuses,
    [{id:"alchemy",value:1},{id:"glassblowing",value:1}]);
  assert.match(oldGloves.system.description.value,/Стеклодувство/);
  assert.equal(oldGloves.img,"my-custom-art/gloves.webp");
  assert.equal(oldGloves.system.equipped,true);
  assert.equal(oldGloves.system.price.value,90);
  assert.equal(created.filter(i=>i.system?.identifier==="kozhanye-perchatki-alhimika").length,1);
});
