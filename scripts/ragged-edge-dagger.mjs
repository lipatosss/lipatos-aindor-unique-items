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

// A real attack roll is optional in the native dnd5e workflow.
// When a damage roll is made without an attack roll, the GM adjudicates
// the hit. If there WAS a roll, a miss must never grant the bonus.
Hooks.on("dnd5e.postRollAttack", (rolls, data) => {
  const activity = data?.subject;
  if (!edgeItem(activity?.item)) return;
  const actor = edgeActor(activity);
  if (actor?.documentName !== "Actor" || !actor.isOwner) return;
  const key = edgeKey(activity);
  if (!key) return;
  const turn = edgeTurn(actor);
  const victim = edgeSingleTarget()?.actor;
  const hp = Number(victim?.system?.attributes?.hp?.value);
  const max = Number(victim?.system?.attributes?.hp?.max);
  const ac = Number(victim?.system?.attributes?.ac?.value);
  const wounded = victim?.uuid !== actor.uuid
    && Number.isFinite(hp) && Number.isFinite(max)
    && max > 0 && hp > 0 && hp < max;

  EDGE_PENDING.set(key, {
    actorUuid: actor.uuid,
    targetUuid: victim?.uuid ?? null,
    turnId: turn.id,
    eligible: Boolean(turn.valid && !edgeUsed(actor, turn.id)
      && wounded && Number.isFinite(ac) && ac > 0 && edgeHit(rolls?.[0], ac)),
    timestamp: Date.now()
  });
});

// Apply bonus to native damage before the roll is built, no separate die
// prompt. The selected target is the same one shown in the damage chat card.
Hooks.on("dnd5e.preRollDamage", (config, dialog, message) => {
  const activity = config?.subject;
  if (!edgeItem(activity?.item)) return;
  const actor = edgeActor(activity);
  if (actor?.documentName !== "Actor" || !actor.isOwner) return;
  const key = edgeKey(activity);
  const turn = edgeTurn(actor);
  if (!key || !turn.valid || edgeUsed(actor, turn.id)) return;
  const victim = edgeSingleTarget()?.actor;
  if (!victim || victim.uuid === actor.uuid) {
    console.info(EDGE_MODULE + " | Рваная рана: выберите одну цель (T).");
    return;
  }

  const hp = Number(victim.system?.attributes?.hp?.value);
  const max = Number(victim.system?.attributes?.hp?.max);
  if (!Number.isFinite(hp) || !Number.isFinite(max) || max <= 0 || hp <= 0 || hp >= max) {
    console.debug(EDGE_MODULE + " | Рваная рана: цель не ранена.", victim.name);
    return;
  }

  const pending = EDGE_PENDING.get(key);
  if (pending && Date.now() - pending.timestamp < EDGE_EXPIRY_MS && pending.turnId === turn.id) {
    if (!pending.eligible || pending.targetUuid !== victim.uuid) {
      console.debug(EDGE_MODULE + " | Рваная рана: атака не попала или цель изначально была здоровой.");
      return;
    }
  }

  const base = config.rolls?.find(roll => roll.base && Array.isArray(roll.parts))
    ?? config.rolls?.find(roll => Array.isArray(roll.parts));
  if (!base) {
    console.warn(EDGE_MODULE + " | Рваная рана: часть урона не найдена.");
    return;
  }
  base.parts.push("1d4");
  config._aindorRaggedEdge = { key, turnId: turn.id };
  if (message?.data) {
    message.data.flavor = (message.data.flavor ?? EDGE_NAME + " — урон")
      + " · Рваная рана (+1к4)";
  }
  console.info(EDGE_MODULE + " | Рваная рана: +1к4 к урону", {
    actor: actor.name, target: victim.name,
    mode: pending ? "with-attack-roll" : "manual-damage"
  });
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
