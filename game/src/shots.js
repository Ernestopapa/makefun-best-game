import { createGame } from './game.js';
import { draw } from './render.js';
import { Player, Enemy, Pickup } from './entities.js';
import { dealCards } from './upgrades.js';
import { CONFIG } from './config.js';
import { mulberry32 } from './random.js';

export function setupShot(shot, seed, canvas, ctx) {
  const game = createGame(seed);
  const rnd = mulberry32(seed);
  const { state } = game;

  // Common setup for non-title shots
  if (shot !== 'title') {
    state.player = Player(CONFIG.arena.width / 2, CONFIG.arena.height / 2);
  }

  if (shot === 'title') {
    state.mode = 'title';
    state.best = 5000;
  } else if (shot === 'play') {
    state.mode = 'play';
    state.score = 1250;
    state.wave = 3;
    state.combo = 3;
    state.shards = 25;
    
    state.enemies.push(Enemy('Drifter', 200, 200, rnd));
    state.enemies.push(Enemy('Dart', 1000, 150, rnd));
    state.enemies.push(Enemy('Spitter', 300, 500, rnd));
    state.enemies.push(Enemy('Brute', 900, 600, rnd));
    
    state.pickups.push(Pickup('shard', 400, 300));
    state.pickups.push(Pickup('shard', 600, 450));
    state.pickups.push(Pickup('heart', 800, 200));
  } else if (shot === 'upgrade') {
    state.mode = 'upgrade';
    state.wave = 2;
    state.score = 800;
    state.shards = 15;
    state.upgradeCards = dealCards({ split: 0, speed: 0, hull: 0, magnet: 0, pierce: 0, rapid: 0, revive: 0 }, rnd);
  } else if (shot === 'results') {
    state.mode = 'win';
    state.score = 5420;
    state.wave = 12;
    state.shards = 112;
    state.player.hp = 3;
    state.best = 5420;
  }

  draw(ctx, state);
  window.__shotReady = true;
}
