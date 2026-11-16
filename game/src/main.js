import { createGame } from './game.js';
import { draw } from './render.js';
import { input } from './input.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
if (params.has('shot')) {
  setupShot(params.get('shot'), parseInt(params.get('seed') || 1), canvas, ctx);
} else {
  const game = createGame();
  input.attach();

  function loop() {
    game.update(1/60);
    draw(ctx, game.state);
    requestAnimationFrame(loop);
  }
  loop();
}
