export class Landscape {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = new Array(width * height);
  }

  // Path: lanscape.js
  set(x, y, value) {
    this.grid[y * this.width + x] = value;
  }

  // Path: lanscape.js
  get(x, y) {
    return this.grid[y * this.width + x];
  }
}