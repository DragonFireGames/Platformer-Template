/**
 * Made with p5play!
 * https://p5play.org
 */

let score = 0;

createCanvas(200, 160);
displayMode('maxed', 'pixelated');

// Tiles

let level = [
  'cc                                                                ',
  'gg                                     g                       f  ',
  '                                                               b  ',
  '   gg                                                        c    ',
  '      ec                        c  g                         b    ',
  '      ggg    c              0   g                               c ',
  '            ggg             g                 ccc     g         b ',
  '                                              ccc  g  d       e   ',
  ' 0   c c c       c cm     e                   ccc  d  dm  m  ggggg',
  'gggggggggggvvvvvggggg  ggggggggggg            ggg  d  dgggg  ddddd'
];

let water, coins, boxes, solidground;
const TileData = {
  grass: {
    layer: 0,
    img: 'assets/tiles/grass.png',
    tile: 'g',
    ground: true,
  },
  dirt: {
    layer: 0,
    img: 'assets/tiles/dirt.png',
    tile: 'd',
    ground: true,
  },
  bricks: {
    layer: 0,
    img: 'assets/tiles/brick.png',
    tile: 'b',
    ground: true,
  },
  water: {
    layer: 2,
    img: 'assets/tiles/water.png',
    tile: 'v',
    ground: false,
    setup(group) {
      water = group;
      group.h = 8;
    }
  },
  coins: {
    layer: 0,
    img: 'assets/tiles/coin.png',
    ani: { w: 16, h: 16, row: 0, frames: 14 },
    tile: 'c',
    ground: false,
    setup(group) {
      coins = group;
      coins.h = 10;
      coins.w = 10;
      player.overlaps(coins, collectCoin);
    }
  },
  flag: {
    layer: 0,
    img: 'assets/tiles/flag.png',
    tile: 'f',
    ground: false,
    setup(group) {
      group.w = 10;
      group.h = 16;
      player.overlaps(group, winGame);
    }
  },
  boxes: {
    layer: 0,
    img: 'assets/tiles/box.png',
    tile: '0',
    ground: true,
    setup(group) {
      boxes = group;
      delete group.physics;
      group.h = 14;
      group.w = 14;
      group.overlaps(coins, () => {});
      group.overlaps(water, () => {});
    }
  }
};
const TileGroups = {};
Object.keys(TileData).forEach(key=>{
  TileData[key].img = loadImage(TileData[key].img);
});

function setupTiles() {
  // Initialize tiles
  for (var key in TileData) {
    const data = TileData[key];
    const group = TileGroups[key] = new Group();
    group.physics = 'static';
    group.layer = data.layer;
    if (data.ani) {
      group.spriteSheet = data.img;
      group.ani = data.ani;
    } else {
      group.img = data.img;
    }
    group.tile = data.tile;
    if (data.setup) data.setup.call(data,group);
  }

  // Creates the platformer level!
  new Tiles(level, 8, 8, 16, 16);

  solidground = new Group();
  for (var key in TileData) 
    if (TileData[key].ground)
      for (let i = 0; i < TileGroups[key].length; i++) 
        solidground.add(TileGroups[key][i]);
}

// Enemies

const EnemyData = {
  red: {
    layer: 1,
    img: 'assets/enemies/red.png',
    anis: {
      knockback: { row: 0, frames: 1 },
      idle: { row: 1, frames: 4 },
    },
    tile: 'e',
    setup(group) {
      group.anis.w = 16;
      group.anis.h = 16;
      group.anis.offset.y = 1;
      group.anis.frameDelay = 8;
      group.spriteSheet = this.img;
      group.addAnis(this.anis);
    },
    touchHandler: function(enemy, player) {
      if (player.hit) return;
      if (enemy.hit) return;
      const playerAbove =
        player.vel.y > 0 && // falling onto enemy
        player.y < enemy.y - enemy.h / 2 + 4; // player’s feet above enemy top

      if (playerAbove) {
        // stomp: enemy dies and falls
        enemy.vel.x = -enemy.dir;
        enemy.vel.y = -2;
        player.vel.y = -3; // bounce
        hitEnemy(enemy, player);
      } else {
        // side hit
        hitPlayer(player, enemy);
      }
    }
  },
  blue: {
    layer: 1,
    img: 'assets/enemies/blue.png',
    anis: {
      knockback: { row: 0, frames: 1 },
      idle: { row: 1, frames: 4 },
    },
    tile: 'm',
    setup(group) {
      group.anis.w = 16;
      group.anis.h = 16;
      group.anis.offset.y = 1;
      group.anis.frameDelay = 8;
      group.spriteSheet = this.img
      group.addAnis(this.anis);
    },
    touchHandler: function(enemy, player) {
      if (player.hit) return;
      if (enemy.hit) return;
      const playerAbove =
        player.vel.y > 0 && // falling onto enemy
        player.y < enemy.y - enemy.h / 2 + 4; // player’s feet above enemy top

      if (playerAbove) {
        hitPlayer(player, enemy);
      } else {
        // ram: enemy gets knocked off
        enemy.vel.y = -2;
        enemy.vel.x = player.vel.x * 1.2 - enemy.dir;
        hitEnemy(enemy);
      }
    }
  }
};
Object.keys(EnemyData).forEach(key=>{
  EnemyData[key].img = loadImage(EnemyData[key].img);
});
EnemyGroups = {};

let enemies, enemySensors;
function setupEnemies() {
  for (const key in EnemyData) {
    const data = EnemyData[key];
    const group = EnemyGroups[key] = new Group();
    group.layer = data.layer;
    group.tile = data.tile;
    data.setup.call(data,group);
  }
}
function initEnemies() {
  enemySensors = new Group();
  enemySensors.layer = 1;
  enemySensors.visible = false;

  enemies = new Group();

  for (const key in EnemyData) {
    const data = EnemyData[key];
    const group = EnemyGroups[key];
    group.overlaps(player, data.touchHandler);
    for (let i = 0; i < group.length; i++) enemies.add(group[i]);
  }

  enemies.overlaps(enemies);
  enemies.overlaps(coins, () => {}); // prevent coin interaction

  // attach sensors to each enemy
  for (let e of enemies) {
    e.h = 12;
    e.w = 12;
    e.changeAni('idle');
    e.dir = -0.75;
    e.bounciness = 0;
    e.friction = 0;
    e.rotationLock = true;

    let foot = new enemySensors.Sprite(e.x, e.y, 4, 4);
    foot.mass = 0.01;
    foot.rotationLock = true;
    foot.physics = 'none';
    foot.visible = false;
    e.footSensor = foot;

    let wall = new enemySensors.Sprite(e.x, e.y, 4, 4);
    wall.mass = 0.01;
    wall.rotationLock = true;
    wall.physics = 'none';
    wall.visible = false;
    e.wallSensor = wall;
  }
}
function hitEnemy(enemy) {
  gritEffect.play();
  enemy.changeAni('knockback');
  enemy.removeColliders();
  enemy.hit = true;
  enemy.layer = 4;
}

// Music

// Create an HTML5 Audio element
var music = loadSound("assets/sounds/music.mp3");
music.loop = true;
music.volume = 0.5;
music.playing = false;

// Start playback after user interaction (required by browsers)
var autoplay = () => {
  if (music.playing) return;
  music.playing = true;
  music.play();
}
canvas.addEventListener("click", autoplay);
window.addEventListener("keypress", autoplay);

var jumpEffect = loadSound("assets/sounds/jump.mp3");
jumpEffect.volume = 0.7;

var coinCollectEffect = loadSound("assets/sounds/coin-collect.mp3");
coinCollectEffect.volume = 0.7;

var gritEffect = loadSound("assets/sounds/grit.mp3");
gritEffect.volume = 1.0;

// Player

let player, groundSensor;
let charactersImg = loadImage('assets/characters.png');

function setup() {
  world.gravity.y = 10;
  allSprites.pixelPerfect = true;

  // Setup Player
  player = new Sprite(48, 100, 12, 12);
  player.layer = 1;
  player.anis.w = 16;
  player.anis.h = 16;
  player.anis.offset.y = 1;
  player.anis.frameDelay = 8;
  player.spriteSheet = charactersImg;
  player.addAnis({
    idle: { row: 0, frames: 4 },
    knockback: { row: 0, col: 4, frames: 1, },
    run: { row: 1, frames: 3 },
    jump: { row: 1, col: 3, frames: 2 }
  });
  player.changeAni('idle');
  player.rotationLock = true;
  
  setupEnemies();

  setupTiles();

  initEnemies();

  // IMPORTANT! prevents the player from sticking to the sides of walls
  player.friction = 0;

  // This groundSensor sprite is used to check if the player
  // is close enough to the ground to jump. But why not use
  // `player.colliding(grass)`? Because then the player could
  // jump if they were touching the side of a wall!
  // Also the player's collider bounces a bit when it hits
  // the ground, even if its bounciness is set to 0. When
  // making a platformer game, you want the player to 
  // be able to jump right after they land.
  // This approach was inspired by this tutorial:
  // https://www.iforce2d.net/b2dtut/jumpability
  groundSensor = new Sprite(48, 106, 6, 12);
  groundSensor.removeColliders();
  groundSensor.visible = false;
  groundSensor.mass = 0.01;
  
  let j = new GlueJoint(player, groundSensor);
  j.visible = false;

  textAlign(CENTER);
}

function update() {
  background('skyblue');
  fill(255);

  text('Score: ' + score, 160, 20);

  // make the player slower in water
  if (groundSensor.overlapping(water)) {
    player.drag = 20;
    player.friction = 10;
  } else {
    player.drag = 0;
    player.friction = 0;
  }

  for (let i = 0; i < boxes.length; i++) {
    if (boxes[i].overlapping(water)) {
      boxes[i].drag = 100;
      boxes[i].rotationDrag = 5;
    } else {
      boxes[i].drag = 0;
      boxes[i].rotationDrag = 0.1;
    }
  }

  if (groundSensor.overlapping(solidground) ||
      groundSensor.overlapping(water)) {
    if (kb.presses('up') || kb.presses('space')) {
      jumpEffect.play();
      //player.changeAni('jump');
      player.vel.y = -4.5;
    }
  }

  if (!player.hit) if (kb.pressing('left')) {
    player.changeAni('run');
    player.vel.x = -1.5;
    player.scale.x = -1;
  } else if (kb.pressing('right')) {
    player.changeAni('run');
    player.vel.x = 1.5;
    player.scale.x = 1;
  } else {
    player.changeAni('idle');
    player.vel.x = 0;
  }

  for (let e of enemies) {
    e.x += e.dir;
    // place sensor slightly ahead and below enemy
    const ahead = e.dir >= 0 ? (e.w / 2 + 3) : -(e.w / 2 + 3);
    e.footSensor.x = e.x + ahead;
    e.footSensor.y = e.y + (e.h / 2) + 3;

    e.wallSensor.x = e.x + ahead;
    e.wallSensor.y = e.y;

    var wallInFront = e.wallSensor.overlapping(solidground);
    var groundAhead = e.footSensor.overlapping(solidground);

    if (e.colliding(solidground)) {
      if (!groundAhead || wallInFront) {
        e.edgeTimer = (e.edgeTimer || 0) + 1;
        if (e.edgeTimer > 3) { // wait 3 frames
          e.dir *= -1;
          e.edgeTimer = 0;
        }
      } else {
        e.edgeTimer = 0;
      }
    }


    if (e.y > 200) e.remove();

    // face move direction
    e.scale.x = e.dir < 0 ? 1 : -1;
  }

  // if player falls, reset them
  if (player.y > 160) {
    music.stop();
  }
  if (player.y > 400) {
    player.speed = 0;
    player.x = 48;
    player.y = 100;
    if (player.hit) {
      player.addCollider();
      player.hit = false;
      player.layer = 1;
    }
    music.play();
  }
}

function drawFrame() {
  camera.x = player.x + 52;
}

function collectCoin(player, coin) {
  coin.remove();
  score++;
  coinCollectEffect.play();
}

function hitPlayer(player, enemy) {
  gritEffect.play();
  music.stop();
  player.changeAni('knockback');
  player.removeColliders();
  player.hit = true;
  player.vel.x = 0;//(player.x < enemy.x) ? 1 : -1;
  player.vel.y = -2.5;
  player.layer = 4;
  // optional: reduce health or temporary invulnerability here
}

function winGame(player, flag) {
  player.x = flag.x;
  player.y = flag.y;
  player.vel.x = 0;
  player.vel.y = 0;
  player.hit = true;
  player.changeAni('idle');
  alert("You Won!");
  setTimeout(()=>player.vel.x = 0,10)
}
