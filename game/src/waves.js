import { CONFIG } from './config.js';
import { Enemy } from './entities.js';

export function buildWave(n) {
  const cfg = CONFIG.waves[n - 1];
  const enemies = [];
  for (let i = 0; i < cfg.drifters; i++) enemies.push('Drifter');
  for (let i = 0; i < cfg.darts; i++) enemies.push('Dart');
  for (let i = 0; i < cfg.spitters; i++) enemies.push('Spitter');
  for (let i = 0; i < cfg.brutes; i++) enemies.push('Brute');
  if (cfg.warden) enemies.push('Warden');
  return { enemies, boss: !!cfg.warden, n };
}

export class Director {
  constructor(wave, rnd) { 
    this.wave = wave; 
    this.elapsed = 0; 
    this.spawnIndex = 0; 
    this.rnd = rnd;
  }
  
  update(dt, game) {
    this.elapsed += dt;
    if (this.spawnIndex < this.wave.enemies.length && this.elapsed > (this.wave.n === 1 ? 1.0 : 0.5)) {
      const kind = this.wave.enemies[this.spawnIndex++];
      const side = Math.floor(this.rnd() * 4);
      let x, y;
      if (side === 0) { x = this.rnd() * CONFIG.arena.width; y = -50; }
      else if (side === 1) { x = CONFIG.arena.width + 50; y = this.rnd() * CONFIG.arena.height; }
      else if (side === 2) { x = this.rnd() * CONFIG.arena.width; y = CONFIG.arena.height + 50; }
      else { x = -50; y = this.rnd() * CONFIG.arena.height; }
      
      game.enemies.push(Enemy(kind, x, y, this.rnd));
      this.elapsed = 0;
    }
  }
  
  isDone() {
    return this.spawnIndex >= this.wave.enemies.length;
  }
}
