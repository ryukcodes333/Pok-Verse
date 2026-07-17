// Scripted gym leaders. Each fields one signature Pokemon at a fixed level;
// stats/moves are still pulled live from PokeAPI so they stay accurate.
const GYM_LEADERS = [
  { id: 1, name: "Brock",    badge: "Boulder Badge", species: "onix",      level: 12, reward: 1000, type: "rock"     },
  { id: 2, name: "Misty",    badge: "Cascade Badge", species: "starmie",   level: 18, reward: 1500, type: "water"    },
  { id: 3, name: "Lt. Surge",badge: "Thunder Badge", species: "raichu",    level: 24, reward: 2000, type: "electric" },
  { id: 4, name: "Erika",    badge: "Rainbow Badge", species: "vileplume", level: 29, reward: 2500, type: "grass"    },
  { id: 5, name: "Koga",     badge: "Soul Badge",    species: "weezing",   level: 37, reward: 3000, type: "poison"   },
  { id: 6, name: "Sabrina",  badge: "Marsh Badge",   species: "alakazam",  level: 43, reward: 3500, type: "psychic"  },
  { id: 7, name: "Blaine",   badge: "Volcano Badge", species: "arcanine",  level: 47, reward: 4000, type: "fire"     },
  { id: 8, name: "Giovanni", badge: "Earth Badge",   species: "rhydon",    level: 50, reward: 5000, type: "ground"   },
];

function findGym(query) {
  const q = String(query).toLowerCase();
  return GYM_LEADERS.find(
    (g) => g.name.toLowerCase() === q || String(g.id) === q || g.badge.toLowerCase().includes(q)
  );
}

module.exports = { GYM_LEADERS, findGym };
