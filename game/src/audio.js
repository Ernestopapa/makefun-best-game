let ctx, muted = false;

function init() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
}

function play(freq, type, duration, vol = 0.1, ramp = true) {
  if (muted || !ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  if (ramp) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const audio = {
  shoot: () => { init(); play(880, 'square', 0.05, 0.05); },
  pickup: (combo) => { 
    init(); 
    play(440 + (combo - 1) * 220, 'sine', 0.1, 0.1); 
  },
  kill: () => { init(); play(220, 'sawtooth', 0.1, 0.1); },
  hurt: () => { init(); play(110, 'square', 0.2, 0.2); },
  horn: () => { 
    init(); 
    play(220, 'triangle', 1.0, 0.2);
    play(440, 'triangle', 1.0, 0.1);
  },
  win: () => {
    init();
    const now = ctx.currentTime;
    [440, 554, 659, 880].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.1, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.2);
    });
  },
  lose: () => {
    init();
    const now = ctx.currentTime;
    [220, 165, 110, 55].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.1, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.2);
    });
  },
  click: () => { init(); play(330, 'sine', 0.05, 0.1); },
  setMuted: (m) => muted = m,
};
