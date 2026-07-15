// Shop catalog. `type` drives how !use resolves the effect.
const SHOP_ITEMS = [
  { name: "Poke Ball", price: 200, type: "ball", catchBonus: 1, sell: 100, desc: "A basic device for catching wild Pokemon." },
  { name: "Great Ball", price: 600, type: "ball", catchBonus: 1.5, sell: 300, desc: "A good, high-performance Ball with a higher catch rate than a Poke Ball." },
  { name: "Ultra Ball", price: 1200, type: "ball", catchBonus: 2, sell: 600, desc: "An ultra-high-performance Ball with an even higher catch rate." },
  { name: "Master Ball", price: 50000, type: "ball", catchBonus: 255, sell: 25000, desc: "The best Ball with a 100% capture rate for any wild Pokemon." },
  { name: "Potion", price: 150, type: "heal", heal: 20, sell: 75, desc: "Restores 20 HP to a Pokemon." },
  { name: "Super Potion", price: 400, type: "heal", heal: 60, sell: 200, desc: "Restores 60 HP to a Pokemon." },
  { name: "Hyper Potion", price: 900, type: "heal", heal: 120, sell: 450, desc: "Restores 120 HP to a Pokemon." },
  { name: "Max Potion", price: 1500, type: "heal", heal: 9999, sell: 750, desc: "Fully restores a Pokemon's HP." },
  { name: "Revive", price: 800, type: "revive", heal: 0.5, sell: 400, desc: "Revives a fainted Pokemon, restoring half its HP." },
  { name: "Rare Candy", price: 2000, type: "candy", sell: 1000, desc: "Instantly raises a Pokemon's level by 1." },
  { name: "Fire Stone", price: 1200, type: "evo-stone", sell: 600, desc: "Evolves certain Fire-type Pokemon." },
  { name: "Water Stone", price: 1200, type: "evo-stone", sell: 600, desc: "Evolves certain Water-type Pokemon." },
  { name: "Thunder Stone", price: 1200, type: "evo-stone", sell: 600, desc: "Evolves certain Electric-type Pokemon." },
  { name: "Leaf Stone", price: 1200, type: "evo-stone", sell: 600, desc: "Evolves certain Grass-type Pokemon." },
  { name: "Moon Stone", price: 1200, type: "evo-stone", sell: 600, desc: "Evolves certain Pokemon exposed to moonlight." },
  { name: "Sun Stone", price: 1200, type: "evo-stone", sell: 600, desc: "Evolves certain Pokemon exposed to sunlight." },
  { name: "Shiny Stone", price: 1500, type: "evo-stone", sell: 750, desc: "Evolves certain Pokemon that shine with radiance." },
  { name: "Dusk Stone", price: 1500, type: "evo-stone", sell: 750, desc: "Evolves certain Pokemon that love darkness." },
  { name: "Friendship Bracelet", price: 500, type: "friendship", amount: 20, sell: 250, desc: "Raises a Pokemon's Friendship." },
  { name: "Leftovers", price: 1000, type: "held", sell: 500, desc: "A held item that gradually restores HP in battle." },
];

function findItem(name) {
  return SHOP_ITEMS.find((i) => i.name.toLowerCase() === String(name).toLowerCase());
}

module.exports = { SHOP_ITEMS, findItem };
