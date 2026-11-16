import { CONFIG } from './config.js';

let stars = null;

function initStars() {
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * CONFIG.arena.width,
      y: Math.random() * CONFIG.arena.height,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.5
    });
  }
}

function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x, y, x - size * 0.7, y, x - size * 0.7, y + size * 0.3);
  ctx.bezierCurveTo(x - size * 0.7, y + size * 0.6, x, y + size * 1.0, x, y + size * 1.0);
  ctx.bezierCurveTo(x, y + size * 1.0, x + size * 0.7, y + size * 0.6, x + size * 0.7, y + size * 0.3);
  ctx.bezierCurveTo(x + size * 0.7, y, x, y, x, y + size * 0.3);
  ctx.fill();
}

function drawStar(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(x + Math.cos((18 + i * 72) / 180 * Math.PI) * size, y - Math.sin((18 + i * 72) / 180 * Math.PI) * size);
        ctx.lineTo(x + Math.cos((54 + i * 72) / 180 * Math.PI) * size * 0.5, y - Math.sin((54 + i * 72) / 180 * Math.PI) * size * 0.5);
    }
    ctx.closePath();
    ctx.fill();
}

export function draw(ctx, state) {
  if (!stars) initStars();

  ctx.save();

  // Screen Shake
  if (state.shake > 0) {
    const s = state.shake * 20;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  // Background
  ctx.fillStyle = CONFIG.colors.bg;
  ctx.fillRect(0, 0, CONFIG.arena.width, CONFIG.arena.height);

  // Starfield
  ctx.fillStyle = CONFIG.colors.star;
  stars.forEach(s => {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Vignette
  const grad = ctx.createRadialGradient(CONFIG.arena.width/2, CONFIG.arena.height/2, 0, CONFIG.arena.width/2, CONFIG.arena.height/2, CONFIG.arena.width * 0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CONFIG.arena.width, CONFIG.arena.height);

  if (state.mode === 'title') {
    drawTitle(ctx, state);
  } else {
    // Entities
    state.pickups.forEach(p => p.draw(ctx));
    state.enemies.forEach(e => e.draw(ctx));
    state.bolts.forEach(b => b.draw(ctx));
    state.orbs.forEach(o => o.draw(ctx));
    state.particles.forEach(p => p.draw(ctx));
    if (state.player) state.player.draw(ctx);
    state.texts.forEach(t => t.draw(ctx));

    drawHUD(ctx, state);

    if (state.mode === 'upgrade') drawUpgrade(ctx, state);
    if (state.mode === 'pause') drawPause(ctx, state);
    if (state.mode === 'over') drawGameOver(ctx, state);
    if (state.mode === 'win') drawWin(ctx, state);
  }

  // Red Flash
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 0, 0, ${state.flash * 0.5})`;
    ctx.fillRect(0, 0, CONFIG.arena.width, CONFIG.arena.height);
  }

  ctx.restore();
}

function drawHUD(ctx, state) {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${state.score.toLocaleString()}`, 20, 40);
  ctx.fillText(`WAVE: ${state.wave}/12`, 20, 75);
  ctx.fillText(`SHARDS: ${state.shards}`, 20, 110);
  
  ctx.textAlign = 'right';
  ctx.fillText(`COMBO x${state.combo}`, CONFIG.arena.width - 20, 40);

  // Lives
  ctx.fillStyle = '#ff4d4d';
  if (state.player) {
    for (let i = 0; i < state.player.hp; i++) {
      drawHeart(ctx, 35 + i * 35, 140, 15);
    }
  }

  // Warden HP
  if (state.wave === 12 && state.wardenHp) {
    const w = 400;
    const h = 20;
    const x = (CONFIG.arena.width - w) / 2;
    const y = 20;
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = CONFIG.colors.fiend;
    ctx.fillRect(x + 2, y + 2, (w - 4) * (state.wardenHp.current / state.wardenHp.max), h - 4);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WARDEN', CONFIG.arena.width / 2, y + 16);
  }

  // Banner
  if (state.banner) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 80px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText(state.banner, CONFIG.arena.width / 2, CONFIG.arena.height / 2);
    ctx.shadowBlur = 0;
  }
}

function drawTitle(ctx, state) {
  ctx.textAlign = 'center';
  ctx.fillStyle = CONFIG.colors.player;
  ctx.font = 'bold 80px monospace';
  ctx.fillText('STARFALL HARVEST', CONFIG.arena.width / 2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '30px monospace';
  ctx.fillText('Press Enter to play', CONFIG.arena.width / 2, 300);

  ctx.font = '24px monospace';
  ctx.fillText('Collect starshards. Survive 12 waves. Beat the Warden.', CONFIG.arena.width / 2, 350);

  ctx.font = '20px monospace';
  ctx.fillText('WASD move • Mouse aim • Click/Space fire', CONFIG.arena.width / 2, 400);
  ctx.fillText('P pause • M mute', CONFIG.arena.width / 2, 440);

  ctx.fillStyle = CONFIG.colors.shard;
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`BEST: ${state.best.toLocaleString()}`, CONFIG.arena.width / 2, 520);
}

function drawUpgrade(ctx, state) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CONFIG.arena.width, CONFIG.arena.height);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CHOOSE AN UPGRADE', CONFIG.arena.width / 2, 150);

  state.upgradeCards.forEach((card, i) => {
    const x = 40 + i * 450;
    const y = 260;
    const w = 300;
    const h = 200;

    ctx.strokeStyle = CONFIG.colors.player;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(77, 227, 194, 0.1)';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(card.name, x + w / 2, y + 50);
    
    ctx.font = '16px monospace';
    const lines = wrapText(ctx, card.desc, w - 40);
    lines.forEach((line, li) => {
        ctx.fillText(line, x + w / 2, y + 100 + li * 20);
    });

    ctx.fillStyle = CONFIG.colors.player;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Press ${i + 1} or click`, x + w / 2, y + 170);
  });
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function drawPause(ctx, state) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CONFIG.arena.width, CONFIG.arena.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 60px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CONFIG.arena.width / 2, CONFIG.arena.height / 2);
  ctx.font = '24px monospace';
  ctx.fillText('Press P to resume', CONFIG.arena.width / 2, CONFIG.arena.height / 2 + 60);
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CONFIG.arena.width, CONFIG.arena.height);
  ctx.fillStyle = CONFIG.colors.fiend;
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CONFIG.arena.width / 2, 200);

  ctx.fillStyle = '#fff';
  ctx.font = '24px monospace';
  ctx.fillText(`SCORE: ${state.score.toLocaleString()}`, CONFIG.arena.width / 2, 300);
  ctx.fillText(`WAVES CLEARED: ${state.wave - 1}`, CONFIG.arena.width / 2, 340);
  ctx.fillText(`SHARDS: ${state.shards}`, CONFIG.arena.width / 2, 380);
  ctx.fillText(`BEST: ${state.best.toLocaleString()}`, CONFIG.arena.width / 2, 420);

  ctx.font = '30px monospace';
  ctx.fillText('Press R to try again', CONFIG.arena.width / 2, 550);
}

function drawWin(ctx, state) {
  ctx.fillStyle = 'rgba(0, 10, 30, 0.9)';
  ctx.fillRect(0, 0, CONFIG.arena.width, CONFIG.arena.height);
  ctx.fillStyle = CONFIG.colors.player;
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VICTORY!', CONFIG.arena.width / 2, 200);

  // Stars
  ctx.fillStyle = '#ffd700';
  const starsCount = state.player.hp;
  for (let i = 0; i < 3; i++) {
    if (i < starsCount) ctx.globalAlpha = 1;
    else ctx.globalAlpha = 0.2;
    drawStar(ctx, CONFIG.arena.width / 2 - 100 + i * 100, 280, 30);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#fff';
  ctx.font = '24px monospace';
  ctx.fillText(`FINAL SCORE: ${state.score.toLocaleString()}`, CONFIG.arena.width / 2, 380);
  ctx.fillText(`SHARDS COLLECTED: ${state.shards}`, CONFIG.arena.width / 2, 420);
  ctx.fillText(`BEST: ${state.best.toLocaleString()}`, CONFIG.arena.width / 2, 460);

  ctx.font = '30px monospace';
  ctx.fillText('Press R to play again', CONFIG.arena.width / 2, 580);
}
