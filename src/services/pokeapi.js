const axios = require("axios");

const BASE = "https://pokeapi.co/api/v2";
const speciesCache = new Map();
const moveCache = new Map();
const evoCache = new Map();

const http = axios.create({ timeout: 10000 });

function slugify(name) {
  return String(name).toLowerCase().trim().replace(/\s+/g, "-").replace(/[.']/g, "");
}

// Fetches and normalizes a full "species" record: base stats, types, abilities,
// sprite, learnset, gender ratio, capture rate and evolution chain url.
async function getSpecies(nameOrId) {
  const key = String(nameOrId).toLowerCase();
  if (speciesCache.has(key)) return speciesCache.get(key);

  const slug = typeof nameOrId === "number" ? nameOrId : slugify(nameOrId);
  const [pokeRes, speciesRes] = await Promise.all([
    http.get(`${BASE}/pokemon/${slug}`),
    http.get(`${BASE}/pokemon-species/${slug}`),
  ]);
  const p = pokeRes.data;
  const s = speciesRes.data;

  const stats = {};
  const STAT_MAP = {
    hp: "hp",
    attack: "attack",
    defense: "defense",
    "special-attack": "spAttack",
    "special-defense": "spDefense",
    speed: "speed",
  };
  for (const st of p.stats) {
    const key2 = STAT_MAP[st.stat.name];
    if (key2) stats[key2] = st.base_stat;
  }

  const learnset = p.moves
    .map((m) => {
      const levelDetail = m.version_group_details.find(
        (d) => d.move_learn_method.name === "level-up"
      );
      return levelDetail
        ? { name: m.move.name, level: levelDetail.level_learned_at || 1, method: "level-up" }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.level - b.level);

  const flavor = (s.flavor_text_entries || []).find((f) => f.language.name === "en");

  const data = {
    id: p.id,
    name: p.name,
    displayName: p.name.charAt(0).toUpperCase() + p.name.slice(1).replace(/-/g, " "),
    types: p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    stats,
    abilities: p.abilities.map((a) => ({ name: a.ability.name, isHidden: a.is_hidden })),
    sprite:
      p.sprites?.other?.["official-artwork"]?.front_default ||
      p.sprites?.front_default ||
      null,
    shinySprite:
      p.sprites?.other?.["official-artwork"]?.front_shiny || p.sprites?.front_shiny || null,
    height: p.height,
    weight: p.weight,
    learnset,
    genderRate: s.gender_rate, // -1 genderless, else eighths female
    captureRate: s.capture_rate,
    baseHappiness: s.base_happiness ?? 70,
    growthRate: s.growth_rate?.name || "medium",
    eggGroups: (s.egg_groups || []).map((g) => g.name),
    evolutionChainUrl: s.evolution_chain?.url || null,
    flavorText: flavor ? flavor.flavor_text.replace(/\f|\n/g, " ") : "No Pokedex data available.",
    isLegendary: s.is_legendary,
    isMythical: s.is_mythical,
  };

  speciesCache.set(key, data);
  speciesCache.set(String(data.id), data);
  speciesCache.set(data.name, data);
  return data;
}

async function getMove(name) {
  const key = slugify(name);
  if (moveCache.has(key)) return moveCache.get(key);
  const res = await http.get(`${BASE}/move/${key}`);
  const m = res.data;
  const data = {
    name: m.name,
    displayName: m.name.charAt(0).toUpperCase() + m.name.slice(1).replace(/-/g, " "),
    power: m.power,
    accuracy: m.accuracy,
    pp: m.pp,
    priority: m.priority,
    type: m.type.name,
    damageClass: m.damage_class.name, // physical, special, status
  };
  moveCache.set(key, data);
  return data;
}

// Returns the evolution chain flattened as [{species, minLevel, trigger, item}]
async function getEvolutionChain(url) {
  if (!url) return null;
  if (evoCache.has(url)) return evoCache.get(url);
  const res = await http.get(url);
  const chain = res.data.chain;

  function flatten(node) {
    const evolvesTo = node.evolves_to.map((next) => {
      const detail = next.evolution_details[0] || {};
      return {
        species: next.species.name,
        minLevel: detail.min_level || null,
        trigger: detail.trigger?.name || null,
        item: detail.item?.name || null,
        minHappiness: detail.min_happiness || null,
        evolvesTo: flatten(next),
      };
    });
    return evolvesTo;
  }

  const result = { species: chain.species.name, evolvesTo: flatten(chain) };
  evoCache.set(url, result);
  return result;
}

function findNextEvolution(chain, currentSpeciesName) {
  if (!chain) return null;
  if (chain.species === currentSpeciesName) return chain.evolvesTo[0] || null;
  for (const branch of chain.evolvesTo || []) {
    const found = findNextEvolution(branch, currentSpeciesName);
    if (found) return found;
  }
  return null;
}

module.exports = { slugify, getSpecies, getMove, getEvolutionChain, findNextEvolution };
