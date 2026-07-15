const { state, save } = require("./store");

function key(userId, itemName) {
  return `${userId}:${itemName}`;
}

function getInventory(userId) {
  return Object.values(state.inventory)
    .filter((i) => i.user_id === userId && i.quantity > 0)
    .sort((a, b) => a.item_name.localeCompare(b.item_name));
}

function getItemQuantity(userId, itemName) {
  const row = state.inventory[key(userId, itemName)];
  return row ? row.quantity : 0;
}

function addItem(userId, itemName, qty) {
  const k = key(userId, itemName);
  if (state.inventory[k]) {
    state.inventory[k].quantity += qty;
  } else {
    state.inventory[k] = { user_id: userId, item_name: itemName, quantity: qty };
  }
  save();
}

function removeItem(userId, itemName, qty) {
  const current = getItemQuantity(userId, itemName);
  if (current < qty) return false;
  state.inventory[key(userId, itemName)].quantity -= qty;
  save();
  return true;
}

module.exports = { getInventory, getItemQuantity, addItem, removeItem };
