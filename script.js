const canvas = document.getElementById("tetris");
const nextCanvas = document.getElementById("next-piece");
const context = canvas.getContext("2d");
const nextContext = nextCanvas.getContext("2d");

context.scale(30, 30);
nextContext.scale(20, 20);

const colors = [null, "red", "blue", "green", "purple", "orange", "yellow", "cyan"];
const arena = createMatrix(10, 20);
let dropInterval = 1000;
let dropCounter = 0;
let lastTime = 0;

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  level: 1,
  lines: 0,
  nextPiece: null,
};

function createMatrix(width, height) {
  const matrix = [];
  while (height--) matrix.push(new Array(width).fill(0));
  return matrix;
}

function createPiece(type) {
  switch (type) {
    case "T": return [[0, 1, 0], [1, 1, 1], [0, 0, 0]];
    case "O": return [[2, 2], [2, 2]];
    case "L": return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
    case "J": return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
    case "I": return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
    case "S": return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    case "Z": return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
  }
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function drawMatrix(matrix, offset, ctx) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 }, context);
  drawMatrix(player.matrix, player.pos, context);

  nextContext.fillStyle = "#000";
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  drawMatrix(player.nextPiece, { x: 1, y: 1 }, nextContext);
}

function playerMove(offset) {
  player.pos.x += offset;
  if (collide(arena, player)) player.pos.x -= offset;
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

function playerRotate(dir) {
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += dir > 0 ? -1 : 1;
  }
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) matrix.forEach(row => row.reverse());
  else matrix.reverse();
}

function playerReset() {
  if (!player.nextPiece) player.nextPiece = createPiece(randomPiece());
  player.matrix = player.nextPiece;
  player.nextPiece = createPiece(randomPiece());
  player.pos.y = 0;
  player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.level = 1;
    player.lines = 0;
    dropInterval = 1000;
    updateScore();
  }
}

function arenaSweep() {
  let rowCount = 1;
  for (let y = arena.length - 1; y >= 0; --y) {
    if (arena[y].every(value => value !== 0)) {
      arena.splice(y, 1);
      arena.unshift(new Array(arena[0].length).fill(0));
      player.score += rowCount * 10;
      player.lines++;
      if (player.lines % 10 === 0) {
        player.level++;
        dropInterval *= 0.9;
      }
      rowCount *= 2;
    }
  }
}

function randomPiece() {
  const pieces = "ILJOTSZ";
  return pieces[(pieces.length * Math.random()) | 0];
}

function updateScore() {
  document.getElementById("score").innerText = player.score;
  document.getElementById("level").innerText = player.level;
  document.getElementById("lines").innerText = player.lines;
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}

document.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") playerMove(-1);
  else if (event.key === "ArrowRight") playerMove(1);
  else if (event.key === "ArrowDown") playerDrop();
  else if (event.key === "ArrowUp") playerRotate(1);
});

playerReset();
update();
updateScore();