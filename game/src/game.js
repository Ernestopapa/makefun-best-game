import { Player, Enemy, Bolt, Orb, Pickup, Particle, FloatingText } from './entities.js';
import { CONFIG } from './config.js';
import { Director, buildWave } from './waves.js';
import { mulberry32, range, pick, chance } from './random.js';
import { dealCards, applyUpgrade } from './upgrades.js';
import { input } from './input.js';
import { audio } from './audio.js';

function filterInPlace(arr, keep) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (!keep(arr[i])) arr.splice(i, 1);
  }
}

export function createGame(seed = Math.random() * 1000000) {
  const rnd = mulberry32(seed);
  const getBest = () => {
    try {
      return parseInt(localStorage.getItem('starfall-harvest-best') || 0);
    } catch (e) {
      return 0;
    }
  };

  const state = {
    mode: 'title',
    player: null,
    enemies: [], bolts: [], orbs: [], particles: [], pickups: [], texts: [],
    wave: 0, score: 0, shards: 0, combo: 1, 
    best: getBest(),
    upgradeCards: [], banner: '', bannerTime: 0, 
    shake: 0, flash: 0, wardenHp: null,
    invulnTime: 0, shardSpawnTimer: 2,
    muted: false
  };

  let director = null;

  const saveBest = () => {
    if (state.score > state.best) {
      state.best = state.score;
      try {
        localStorage.setItem('starfall-harvest-best', state.best);
      } catch (e) {}
    }
  };

  const takeHit = () => {
    if (state.invulnTime > 0) return;
    
    if (state.player.shieldTime > 0) {
      state.player.shieldTime = 0;
      state.invulnTime = 0.5;
      state.shake = 0.2;
      state.flash = 0.1;
      audio.hurt();
      return;
    }

    state.player.hp -= 1;
    state.combo = 1;
    state.shake = 0.4;
    state.flash = 0.3;
    state.invulnTime = 1.0;
    audio.hurt();

    if (state.player.hp <= 0) {
      if (state.player.upgrades.revive > 0) {
        state.player.upgrades.revive = 0;
        state.player.hp = 1;
        state.invulnTime = 2.0;
        audio.horn();
      } else {
        state.mode = 'over';
        saveBest();
        audio.lose();
      }
    }
  };

  const game = {
    state,
    enemies: state.enemies,
    bolts: state.bolts,
    orbs: state.orbs,
    pickups: state.pickups,
    particles: state.particles,
    texts: state.texts,

    update(dt) {
      if (input.consumePressed('m') || input.consumePressed('M')) {
        state.muted = !state.muted;
        audio.setMuted(state.muted);
      }

      if (state.mode === 'play' || state.mode === 'pause') {
        if (input.consumePressed('p') || input.consumePressed('P')) {
          state.mode = state.mode === 'play' ? 'pause' : 'play';
        }
      }

      if (state.mode === 'pause') return;

      if (state.shake > 0) state.shake -= dt;
      if (state.flash > 0) state.flash -= dt;
      if (state.invulnTime > 0) state.invulnTime -= dt;
      if (state.bannerTime > 0) {
        state.bannerTime -= dt;
        if (state.bannerTime <= 0) state.banner = '';
      }

      switch (state.mode) {
        case 'title':
          if (input.consumePressed('Enter')) {
            this.resetRun();
          }
          break;
        case 'play':
          this.updatePlay(dt);
          break;
        case 'upgrade':
          this.updateUpgrade();
          break;
        case 'over':
        case 'win':
          if (input.consumePressed('r') || input.consumePressed('R')) {
            this.resetRun();
          }
          break;
      }
    },

    resetRun() {
      state.player = Player(CONFIG.arena.width / 2, CONFIG.arena.height / 2);
      state.enemies.length = 0;
      state.bolts.length = 0;
      state.orbs.length = 0;
      state.particles.length = 0;
      state.pickups.length = 0;
      state.texts.length = 0;
      state.wave = 1;
      state.score = 0;
      state.shards = 0;
      state.combo = 1;
      state.mode = 'play';
      state.banner = 'WAVE 1';
      state.bannerTime = 1.5;
      state.invulnTime = 3;
      state.wardenHp = null;
      state.shardSpawnTimer = 2;
      director = new Director(buildWave(1), rnd);
      audio.horn();
    },

    updatePlay(dt) {
      // Movement
      let mx = 0, my = 0;
      if (input.keys['w'] || input.keys['W'] || input.keys['ArrowUp']) my -= 1;
      if (input.keys['s'] || input.keys['S'] || input.keys['ArrowDown']) my += 1;
      if (input.keys['a'] || input.keys['A'] || input.keys['ArrowLeft']) mx -= 1;
      if (input.keys['d'] || input.keys['D'] || input.keys['ArrowRight']) mx += 1;

      if (mx !== 0 || my !== 0) {
        const mag = Math.hypot(mx, my);
        state.player.vx = mx / mag;
        state.player.vy = my / mag;
      } else {
        state.player.vx = 0;
        state.player.vy = 0;
      }

      state.player.update(dt);

      // Firing
      let aimAngle = Math.atan2(input.mouse.y - state.player.y, input.mouse.x - state.player.x);
      if (input.keys[' '] && !input.mouse.moved && state.enemies.length > 0) {
        let nearest = state.enemies[0];
        let best = Infinity;
        for (const e of state.enemies) {
          const d = Math.hypot(e.x - state.player.x, e.y - state.player.y);
          if (d < best) { best = d; nearest = e; }
        }
        aimAngle = Math.atan2(nearest.y - state.player.y, nearest.x - state.player.x);
      }
      if ((input.mouse.down || input.keys[' ']) && state.player.fireCooldown <= 0) {
        const fireRate = CONFIG.player.fireRate * Math.pow(0.8, state.player.upgrades.rapid);
        state.player.fireCooldown = fireRate;
        
        const split = state.player.upgrades.split;
        const pierce = state.player.upgrades.pierce;
        const count = 1 + split;
        const spread = 0.2;
        for (let i = 0; i < count; i++) {
          const angle = aimAngle + (i - (count - 1) / 2) * spread;
          state.bolts.push(Bolt(state.player.x, state.player.y, angle, pierce));
        }
        audio.shoot();
      }

      director.update(dt, this);

      // Shard spawning
      state.shardSpawnTimer -= dt;
      if (state.shardSpawnTimer <= 0) {
        state.shardSpawnTimer = 2;
        if (state.pickups.filter(p => p.kind === 'shard').length < 8) {
          state.pickups.push(Pickup('shard', range(rnd, 50, CONFIG.arena.width - 50), range(rnd, 50, CONFIG.arena.height - 50)));
        }
      }

      // Update entities
      state.enemies.forEach(e => e.update(dt, state.player, this));
      state.bolts.forEach(b => b.update(dt));
      state.orbs.forEach(o => o.update(dt));
      state.particles.forEach(p => p.update(dt));
      state.pickups.forEach(p => {
        if (state.player.magnetTime > 0 && p.kind === 'shard') {
            const d = Math.hypot(state.player.x - p.x, state.player.y - p.y);
            if (d < 200) {
                const angle = Math.atan2(state.player.y - p.y, state.player.x - p.x);
                p.x += Math.cos(angle) * 400 * dt;
                p.y += Math.sin(angle) * 400 * dt;
            }
        }
        p.update(dt);
      });
      state.texts.forEach(t => t.update(dt));

      if (state.wave === 12) {
        const warden = state.enemies.find(e => e.kind === 'Warden');
        if (warden) state.wardenHp = { current: warden.hp, max: warden.maxHp };
      }

      // Collisions
      // Bolts vs Enemies
      for (let i = state.bolts.length - 1; i >= 0; i--) {
        const b = state.bolts[i];
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const e = state.enemies[j];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < b.radius + e.radius) {
            e.hp -= 1;
            if (e.kind === 'Warden') {
                state.wardenHp = { current: e.hp, max: e.maxHp };
            }
            if (e.hp <= 0) {
              const val = CONFIG.enemies[e.kind].score;
              state.score += val * state.combo;
              state.texts.push(FloatingText(`+${val * state.combo}`, e.x, e.y));
              audio.kill();
              for (let k = 0; k < 10; k++) state.particles.push(Particle(e.x, e.y, CONFIG.colors.fiend));
              
              state.pickups.push(Pickup('shard', e.x, e.y));
              if (chance(rnd, 0.01)) state.pickups.push(Pickup('heart', e.x, e.y));
              else if (chance(rnd, 0.05)) state.pickups.push(Pickup('magnet', e.x, e.y));
              else if (chance(rnd, 0.05)) state.pickups.push(Pickup('shield', e.x, e.y));

              if (e.kind === 'Warden') {
                state.mode = 'win';
                saveBest();
                audio.win();
              }
              state.enemies.splice(j, 1);
            } else {
                for (let k = 0; k < 3; k++) state.particles.push(Particle(b.x, b.y, '#fff'));
            }

            if (b.pierce > 0) {
              b.pierce--;
            } else {
              state.bolts.splice(i, 1);
              break;
            }
          }
        }
      }

      // Enemies vs Player
      state.enemies.forEach(e => {
        const dist = Math.hypot(e.x - state.player.x, e.y - state.player.y);
        if (dist < e.radius + state.player.radius) {
          if (state.player.shieldTime > 0) {
            const angle = Math.atan2(e.y - state.player.y, e.x - state.player.x);
            e.x += Math.cos(angle) * 100;
            e.y += Math.sin(angle) * 100;
          }
          takeHit();
        }
      });

      // Orbs vs Player
      for (let i = state.orbs.length - 1; i >= 0; i--) {
        const o = state.orbs[i];
        const dist = Math.hypot(o.x - state.player.x, o.y - state.player.y);
        if (dist < o.radius + state.player.radius) {
          takeHit();
          state.orbs.splice(i, 1);
        }
      }

      // Pickups vs Player
      for (let i = state.pickups.length - 1; i >= 0; i--) {
        const p = state.pickups[i];
        const dist = Math.hypot(p.x - state.player.x, p.y - state.player.y);
        const magnetBonus = state.player.upgrades.magnet * 0.6;
        if (dist < p.radius + state.player.radius * (1 + magnetBonus)) {
          audio.pickup(state.combo);
          if (p.kind === 'shard') {
            state.score += 10 * state.combo;
            state.shards += 1;
            state.combo = Math.min(5, state.combo + 1);
          } else if (p.kind === 'heart') {
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
          } else if (p.kind === 'magnet') {
            state.player.magnetTime = 8;
          } else if (p.kind === 'shield') {
            state.player.shieldTime = 10;
          }
          state.pickups.splice(i, 1);
        }
      }

      filterInPlace(state.bolts, b => b.x > -50 && b.x < CONFIG.arena.width + 50 && b.y > -50 && b.y < CONFIG.arena.height + 50);
      filterInPlace(state.orbs, o => o.x > -50 && o.x < CONFIG.arena.width + 50 && o.y > -50 && o.y < CONFIG.arena.height + 50);
      filterInPlace(state.particles, p => p.life > 0);
      filterInPlace(state.texts, t => t.life > 0);
      filterInPlace(state.enemies, e => e.x > -100 && e.x < CONFIG.arena.width + 100 && e.y > -100 && e.y < CONFIG.arena.height + 100);

      if (director.isDone() && state.enemies.length === 0) {
        if (state.wave === 12) {
          state.mode = 'win';
          saveBest();
          audio.win();
        } else {
          state.mode = 'upgrade';
          state.upgradeCards = dealCards(state.player.upgrades, rnd);
        }
      }
    },

    updateUpgrade() {
      let chosenIndex = -1;
      if (input.consumePressed('1')) chosenIndex = 0;
      if (input.consumePressed('2')) chosenIndex = 1;
      if (input.consumePressed('3')) chosenIndex = 2;

      if (input.mouse.down) {
        const mx = input.mouse.x;
        const my = input.mouse.y;
        if (my >= 260 && my <= 460) {
          if (mx >= 40 && mx <= 340) chosenIndex = 0;
          else if (mx >= 490 && mx <= 790) chosenIndex = 1;
          else if (mx >= 940 && mx <= 1240) chosenIndex = 2;
        }
        if (chosenIndex >= 0) input.mouse.down = false;
      }

      if (chosenIndex >= 0 && chosenIndex < state.upgradeCards.length) {
        const card = state.upgradeCards[chosenIndex];
        applyUpgrade(state.player, card.id);
        audio.click();
        state.wave += 1;
        state.banner = `WAVE ${state.wave}`;
        state.bannerTime = 1.5;
        director = new Director(buildWave(state.wave), rnd);
        state.mode = 'play';
      }
    },

    spawnEnemy(kind) {
      const side = Math.floor(rnd() * 4);
      let x, y;
      if (side === 0) { x = rnd() * CONFIG.arena.width; y = -50; }
      else if (side === 1) { x = CONFIG.arena.width + 50; y = rnd() * CONFIG.arena.height; }
      else if (side === 2) { x = rnd() * CONFIG.arena.width; y = CONFIG.arena.height + 50; }
      else { x = -50; y = rnd() * CONFIG.arena.height; }
      state.enemies.push(Enemy(kind, x, y, rnd));
    }
  };

  return game;
}
