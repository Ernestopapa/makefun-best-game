export const input = {
  keys: {},
  pressed: {},
  mouse: { x: 0, y: 0, down: false, moved: false },
  
  attach() {
    window.addEventListener('keydown', e => {
      if (!this.keys[e.key]) {
        this.pressed[e.key] = true;
      }
      this.keys[e.key] = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key] = false;
    });
    window.addEventListener('mousemove', e => {
      const canvas = document.getElementById('game');
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.moved = true;
    });
    window.addEventListener('mousedown', () => this.mouse.down = true);
    window.addEventListener('mouseup', () => this.mouse.down = false);
  },

  consumePressed(key) {
    if (this.pressed[key]) {
      this.pressed[key] = false;
      return true;
    }
    return false;
  }
};
