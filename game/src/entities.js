import { CONFIG } from './config.js';

export const Player = (x, y) => ({
  x, y, vx: 0, vy: 0, hp: CONFIG.player.maxLives, maxHp: CONFIG.player.maxLives, 
  radius: CONFIG.player.radius, speed: CONFIG.player.speed, 
  fireCooldown: 0, upgrades: { split: 0, speed: 0, hull: 0, magnet: 0, pierce: 0, rapid: 0, revive: 0 },
  shieldTime: 0, magnetTime: 0,
  
  update(dt) {
    this.x += this.vx * this.speed * (1 + this.upgrades.speed * 0.12) * dt;
    this.y += this.vy * this.speed * (1 + this.upgrades.speed * 0.12) * dt;
    this.x = Math.max(this.radius, Math.min(CONFIG.arena.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(CONFIG.arena.height - this.radius, this.y));
    
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.shieldTime > 0) this.shieldTime -= dt;
    if (this.magnetTime > 0) this.magnetTime -= dt;
  },
  draw(ctx) {
    ctx.fillStyle = CONFIG.colors.player;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    if (this.shieldTime > 0) {
      ctx.strokeStyle = '#4de3c2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
});

export const Enemy = (kind, x, y, rnd) => {
  const cfg = CONFIG.enemies[kind];
  return {
    kind, x, y, hp: cfg.hp, maxHp: cfg.hp, radius: cfg.radius, speed: cfg.speed,
    phase: 0, timer: 0,
    update(dt, player, game) {
      if (this.kind === 'Drifter' || this.kind === 'Brute') {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed * dt;
        this.y += Math.sin(angle) * this.speed * dt;
      } else if (this.kind === 'Dart') {
        if (this.phase === 0) {
          this.timer += dt;
          if (this.timer > 1) { this.phase = 1; this.angle = Math.atan2(player.y - this.y, player.x - this.x); }
        } else {
          this.x += Math.cos(this.angle) * this.speed * 2 * dt;
          this.y += Math.sin(this.angle) * this.speed * 2 * dt;
        }
      } else if (this.kind === 'Spitter') {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist > 300) {
          const angle = Math.atan2(player.y - this.y, player.x - this.x);
          this.x += Math.cos(angle) * this.speed * dt;
          this.y += Math.sin(angle) * this.speed * dt;
        }
        this.timer += dt;
        if (this.timer > 2) {
          this.timer = 0;
          game.orbs.push(Orb(this.x, this.y, player.x, player.y));
        }
      } else if (this.kind === 'Warden') {
        this.timer += dt;
        if (this.phase === 0) { // Summon
          if (this.timer > 3) { this.timer = 0; game.spawnEnemy('Drifter'); }
          if (this.hp < 30) this.phase = 1;
        } else if (this.phase === 1) { // Burst
          if (this.timer > 2) {
            this.timer = 0;
            for (let i = 0; i < 8; i++) game.orbs.push(Orb(this.x, this.y, this.x + Math.cos(i) * 100, this.y + Math.sin(i) * 100));
          }
          if (this.hp < 15) this.phase = 2;
        } else if (this.phase === 2) { // Charge
          const angle = Math.atan2(player.y - this.y, player.x - this.x);
          this.x += Math.cos(angle) * this.speed * 2 * dt;
          this.y += Math.sin(angle) * this.speed * 2 * dt;
        }
      }
    },
    draw(ctx) {
      ctx.fillStyle = CONFIG.colors.fiend;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.x - 3, this.y - 3, 2, 2);
      ctx.fillRect(this.x + 1, this.y - 3, 2, 2);
    }
  };
};

export const Bolt = (x, y, angle, pierce) => ({
  x, y, angle, speed: 600, radius: 4, pierce,
  update(dt) {
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
  },
  draw(ctx) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
});

export const Orb = (x, y, tx, ty) => {
  const angle = Math.atan2(ty - y, tx - x);
  return {
    x, y, vx: Math.cos(angle) * 150, vy: Math.sin(angle) * 150, radius: 5,
    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; },
    draw(ctx) { ctx.fillStyle = CONFIG.colors.fiend; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
  };
};

export const Pickup = (kind, x, y) => ({
  kind, x, y, radius: 10,
  update(dt) {},
  draw(ctx) {
    ctx.fillStyle = kind === 'shard' ? CONFIG.colors.shard : (kind === 'heart' ? '#ff0000' : '#4de3c2');
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
});

export const Particle = (x, y, color) => ({
  x, y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, life: 0.5, color,
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt; },
  draw(ctx) { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, 2, 2); }
});

export const FloatingText = (text, x, y) => ({
  text, x, y, life: 1,
  update(dt) { this.y -= 50 * dt; this.life -= dt; },
  draw(ctx) { ctx.fillStyle = '#fff'; ctx.fillText(this.text, this.x, this.y); }
});
