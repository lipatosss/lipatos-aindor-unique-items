/**
 * Кинжал рваной кромки — Foundry VTT 14 / dnd5e 6.x (правила 2014).
 * Добавляет 1к4 колющего урона к ОБЫЧНОМУ броску урона кинжала,
 * если до попадания цель уже была ранена, не чаще раза за свой ход.
 *
 * Для точной проверки попадания нужен ровно один выбранный целью токен.
 * Урон не применяется отдельно: система dnd5e сама обрабатывает
 * критические попадания, сопротивления и применение стандартного броска.
 */
const EDGE_MODULE = "lipatos-aindor-unique-items";
const EDGE_ID = "kinzhal-rvanoy-kromki";
const EDGE_NAME = "Кинжал рваной кромки";
const EDGE_TURN_FLAG = "raggedEdgeLastTurn";
const EDGE_PENDING = new Map();
const EDGE_USED = new Map();
const EDGE_ROLLS = new WeakMap();
const EDGE_EXPIRY_MS = 120000;

function edgeItem(item) {
  return item?.type === "weapon" && (
    item.flags?.[EDGE_MODULE]?.raggedEdge === true
    || String(item.system?.identifier ?? "").trim().toLowerCase() === EDGE_ID
    || item.name?.trim() === EDGE_NAME
  );
}

function edgeActor(activity) {
  return activity?.actor ?? activity?.item?.actor ?? activity?.item?.parent ?? null;
}

function edgeKey(activity) {
  const actor = edgeActor(activity);
  if (!actor?.uuid || !activity?.item?.id) return null;
  return actor.uuid + ":" + activity.item.id + ":" + activity.id;
}

function edgeTurn(actor) {
  const combat = game.combat;
  if (!combat?.started) return { valid: true, id: null };
  const combatant = combat.combatant;
  const active = combatant?.actor;
  const ownTurn = (active?.uuid && active.uuid === actor.uuid)
    || (combatant?.actorId && combatant.actorId === actor.id);
  if (!ownTurn) return { valid: false, id: null };
  return { valid: true, id: [combat.id, combat.round, combat.turn].join(":") };
}

function edgeUsed(actor, turnId) {
  if (!turnId) return false;
  return EDGE_USED.get(actor.uuid) === turnId
    || actor.getFlag(EDGE_MODULE, EDGE_TURN_FLAG) === turnId;
}

function edgeSingleTarget() {
  const targets = [...(game.user?.targets ?? [])];
  return targets.length === 1 ? targets[0] : null;
}

function edgeHit(roll, armorClass) {
  const die = roll?.dice?.find(term => term.faces === 20);
  const natural = die?.results?.find(result => result.active !== false)?.result;
  if (natural === 1 || roll?.isFumble === true) return false;
  if (natural === 20 || roll?.isCritical === true) return true;
  return Number.isFinite(Number(roll?.total)) && Number(roll.total) >= armorClass;
}

// The attack roll happens BEFORE damage. Remember the target's health now,
// so damage from this attack cannot make a healthy target eligible retroactively.
Hooks.on("dnd5e.postRollAttack", (rolls, data) => {
  const activity = data?.subject;
  if (!edgeItem(activity?.item)) return;
  const actor = edgeActor(activity);
  if (actor?.documentName !== "Actor" || !actor.isOwner) return;
  const key = edgeKey(activity);
  if (!key) return;
  EDGE_PENDING.delete(key); // A miss/new attack must invalidate previous hits.

  const turn = edgeTurn(actor);
  if (!turn.valid || edgeUsed(actor, turn.id)) return;
  const target = edgeSingleTarget();
  const victim = target?.actor;
  if (!victim || victim.uuid === actor.uuid) return;
  const hp = Number(victim.system?.attributes?.hp?.value);
  const max = Number(victim.system?.attributes?.hp?.max);
  const ac = Number(victim.system?.attributes?.ac?.value);
  if (!Number.isFinite(hp) || !Number.isFinite(max) || max <= 0 || hp <= 0 || hp >= max) return;
  if (!Number.isFinite(ac) || ac <= 0 || !edgeHit(rolls?.[0], ac)) return;

  EDGE_PENDING.set(key, {
    actorUuid: actor.uuid,
    targetUuid: victim.uuid,
    turnId: turn.id,
    timestamp: Date.now()
  });
});

// Insert a die into the native DAMAGE configuration, not a second damage
// application. This keeps 1к4 piercing inside the same damage type/critical.
Hooks.on("dnd5e.preRollDamage", config => {
  const activity = config?.subject;
  if (!edgeItem(activity?.item)) return;
  const actor = edgeActor(activity);
  if (!actor?.isOwner) return;
  const key = edgeKey(activity);
  const pending = EDGE_PENDING.get(key);
  if (!pending || Date.now() - pending.timestamp > EDGE_EXPIRY_MS) {
    EDGE_PENDING.delete(key);
    return;
  }

  const turn = edgeTurn(actor);
  if (!turn.valid || turn.id !== pending.turnId || edgeUsed(actor, turn.id)) return;
  if (edgeSingleTarget()?.actor?.uuid !== pending.targetUuid) return;

  const base = config.rolls?.find(roll => roll.base && Array.isArray(roll.parts))
    ?? config.rolls?.find(roll => Array.isArray(roll.parts));
  if (!base) return;
  base.parts.push("1d4");
  config._aindorRaggedEdge = { key, turnId: turn.id };
});

// A cancelled damage dialog must NOT spend the once-per-turn ability.
Hooks.on("dnd5e.postDamageRollConfiguration", (rolls, config) => {
  if (!config?._aindorRaggedEdge || !rolls?.length) return;
  EDGE_ROLLS.set(rolls, config._aindorRaggedEdge);
});

Hooks.on("dnd5e.rollDamage", (rolls, data) => {
  const applied = EDGE_ROLLS.get(rolls);
  if (!applied) return;
  EDGE_ROLLS.delete(rolls);
  EDGE_PENDING.delete(applied.key);
  const actor = edgeActor(data?.subject);
  if (!actor?.isOwner) return;
  if (applied.turnId) {
    EDGE_USED.set(actor.uuid, applied.turnId);
    void actor.setFlag(EDGE_MODULE, EDGE_TURN_FLAG, applied.turnId).catch(error => {
      console.warn(EDGE_MODULE + " | Не удалось сохранить использование кинжала", error);
    });
  }
  ui.notifications?.info?.(EDGE_NAME + ": Рваная рана — +1к4 колющего урона.");
});

// One-time GM world-item template. Never modify an existing weapon, its
// picture, its damage or any copies already carried by characters.
Hooks.once("ready", async () => {
  if (!game.user?.isGM) return;
  if (game.users?.activeGM && game.users.activeGM.id !== game.user.id) return;
  if ((game.items?.contents ?? []).some(edgeItem)) return;

  try {
    await Item.create({
      name: EDGE_NAME,
      type: "weapon",
      img: "icons/weapons/daggers/dagger-steel.webp",
      system: {
        identifier: EDGE_ID,
        description: {
          value: "<p>Немагический кинжал с зазубренной кромкой, рассчитанной на раненых противников.</p>"
            + "<p><strong>Рваная рана.</strong> Один раз в каждый свой ход, когда вы попадаете этим "
            + "кинжалом по существу, которое уже потеряло хотя бы 1 хит, атака наносит дополнительно "
            + "1к4 колющего урона. Цель должна иметь больше 0 хитов.</p>"
            + "<p>Для автоматизации выберите одну цель перед броском атаки. "
            + "Бонус прибавляется к обычному броску урона.</p>"
        },
        type: { value: "simpleM", baseItem: "dagger" },
        quantity: 1,
        weight: { value: 1, units: "lb" },
        price: { value: 90, denomination: "gp" },
        rarity: "uncommon",
        properties: ["fin", "lgt", "thr"],
        range: { reach: 5, value: 20, long: 60, units: "ft" },
        damage: {
          base: { number: 1, denomination: 4, types: ["piercing"] }
        }
      },
      flags: { [EDGE_MODULE]: { raggedEdge: true } }
    }, { renderSheet: false });
    console.info(EDGE_MODULE + " | Добавлен шаблон «" + EDGE_NAME + "» в Предметы мира.");
  } catch (error) {
    console.error(EDGE_MODULE + " | Не удалось создать шаблон кинжала", error);
    ui.notifications?.warn?.("Не удалось создать Кинжал рваной кромки. Подробности в F12.");
  }
});
