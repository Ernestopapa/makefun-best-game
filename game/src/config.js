export const CONFIG = {
  arena: { width: 1280, height: 720 },
  player: {
    speed: 300,
    fireRate: 0.25, // seconds between shots
    maxLives: 3,
    radius: 15,
  },
  colors: {
    bg: '#0d1030',
    star: '#ffffff',
    shard: '#ffd76a',
    fiend: '#ff6b35',
    player: '#4de3c2',
    text: '#ffffff',
    ui: '#ffffff',
  },
  enemies: {
    Drifter: { speed: 120, hp: 1, score: 10, radius: 10 },
    Dart: { speed: 450, hp: 1, score: 25, radius: 8 },
    Spitter: { speed: 90, hp: 2, score: 40, radius: 12 },
    Brute: { speed: 60, hp: 6, score: 100, radius: 20 },
    Warden: { speed: 50, hp: 40, score: 500, radius: 40 },
  },
  // Wave configuration (counts of each enemy per wave)
  waves: [
    { drifters: 10, darts: 0, spitters: 0, brutes: 0 }, // W1
    { drifters: 15, darts: 5, spitters: 0, brutes: 0 }, // W2
    { drifters: 15, darts: 10, spitters: 5, brutes: 0 }, // W3
    { drifters: 20, darts: 15, spitters: 8, brutes: 0 }, // W4
    { drifters: 20, darts: 20, spitters: 10, brutes: 2 }, // W5
    { drifters: 25, darts: 20, spitters: 12, brutes: 4 }, // W6
    { drifters: 30, darts: 25, spitters: 15, brutes: 6 }, // W7
    { drifters: 30, darts: 30, spitters: 20, brutes: 8 }, // W8
    { drifters: 35, darts: 35, spitters: 25, brutes: 10 }, // W9
    { drifters: 40, darts: 40, spitters: 30, brutes: 12 }, // W10
    { drifters: 45, darts: 45, spitters: 35, brutes: 15 }, // W11
    { drifters: 0, darts: 0, spitters: 0, brutes: 0, warden: 1 }, // W12
  ],
  upgrades: [
    { id: 'split', name: 'Split Shot', desc: '+1 bolt per shot', max: 3 },
    { id: 'speed', name: 'Swift Boots', desc: '+12% move speed', max: 3 },
    { id: 'hull', name: 'Thick Hull', desc: '+1 max life and heal 1', max: 3 },
    { id: 'magnet', name: 'Magnet Core', desc: 'pickup radius +60%', max: 3 },
    { id: 'pierce', name: 'Piercing Shots', desc: 'bolts pierce +1 enemy', max: 3 },
    { id: 'rapid', name: 'Rapid Fire', desc: '+20% fire rate', max: 3 },
    { id: 'revive', name: 'Second Wind', desc: 'once per run, revive at 1 life', max: 1 },
  ],
  comboSteps: [1, 2, 3, 4, 5],
};
