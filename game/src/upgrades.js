import { CONFIG } from './config.js';
import { pick } from './random.js';

export const UPGRADES = CONFIG.upgrades;

export function dealCards(owned, rnd) {
  const pool = UPGRADES.filter(u => (owned[u.id] || 0) < u.max);
  const cards = [];
  const available = [...pool];
  
  while (cards.length < 3 && available.length > 0) {
    const card = pick(rnd, available);
    cards.push(card);
    available.splice(available.indexOf(card), 1);
  }
  return cards;
}

export function applyUpgrade(player, id) {
  player.upgrades[id] = (player.upgrades[id] || 0) + 1;
  if (id === 'hull') {
    player.maxHp += 1;
    player.hp = Math.min(player.maxHp, player.hp + 1);
  }
}
