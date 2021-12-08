const counterDOM = document.getElementById("counter");
const endDOM = document.getElementById("end");
const winDOM = document.getElementById("win");
const aiAgent = document.getElementById("aiToggle");
const gameMode = document.getElementById("finishToggle");
let isAI = false;
let isInfiniteGame = true;

aiAgent.onclick = function () {
  if (this.innerHTML == "AI") {
    this.innerHTML = "No AI";
    this.style.backgroundColor = null;
    isAI = false;
  } else {
    this.innerHTML = "AI";
    this.style.backgroundColor = "#fcba03";
    isAI = true;
  }
};
gameMode.onclick = function () {
  if (isInfiniteGame) {
    this.innerHTML = "Mode Infinite";
    isInfiniteGame = false;
    this.style.backgroundColor = "#fcba03";
    const extendedLane = Math.floor(Math.random() * 2 + 19);
    for (let i = 0; i < extendedLane; i++) {
      addLane();
    }
    addFinishLane();
    console.log(lanes);
  } else {
    this.style.backgroundColor = null;
    this.innerHTML = "Mode Finish";
    isInfiniteGame = true;
  }
};

const scene = new THREE.Scene();

const distance = 500;
const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 0.1, 10000);

camera.rotation.x = (50 * Math.PI) / 180;
camera.rotation.y = (20 * Math.PI) / 180;
camera.rotation.z = (10 * Math.PI) / 180;

const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
const initialCameraPositionX = Math.tan(camera.rotation.y) * Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

const zoom = 2;

const chickenSize = 15;

const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth * columns;

const stepTime = 200; // Miliseconds it takes for the chicken to take a step forward, backward, left or right

let lanes;
let currentLane;
let currentColumn;

let previousTimestamp;
let startMoving;
let moves;
let stepStartTimestamp;

let gameOver = false; // A flag to check whether the game has been over or not

const carFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110, 40, [
  { x: 10, y: 0, w: 50, h: 30 },
  { x: 70, y: 0, w: 30, h: 30 },
]);
const carLeftSideTexture = new Texture(110, 40, [
  { x: 10, y: 10, w: 50, h: 30 },
  { x: 70, y: 10, w: 30, h: 30 },
]);

const truckFrontTexture = new Texture(30, 30, [{ x: 15, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = new Texture(25, 30, [{ x: 0, y: 15, w: 10, h: 10 }]);
const truckLeftSideTexture = new Texture(25, 30, [{ x: 0, y: 5, w: 10, h: 10 }]);

const generateLanes = () =>
  [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((index) => {
      const lane = new Lane(index);
      lane.mesh.position.y = index * positionWidth * zoom;
      scene.add(lane.mesh);
      return lane;
    })
    .filter((lane) => lane.index >= 0);

const addLane = () => {
  const index = lanes.length;
  const lane = new Lane(index);
  lane.mesh.position.y = index * positionWidth * zoom;
  scene.add(lane.mesh);
  lanes.push(lane);
};

const addFinishLane = () => {
  const index = lanes.length;
  const lane = new Lane(-1);
  lane.index = index;
  lane.type = "Finish_Lane";
  lane.mesh = new FinishMark();
  lane.mesh.position.y = index * positionWidth * zoom;
  scene.add(lane.mesh);
  lanes.push(lane);
};

const chicken = new Chicken();
scene.add(chicken);

const raccoon = [];
let raccoonMoves = [];
let raccoonPreviousTimestamp = [];
let raccoonStartMoving = [];
let raccoonStepStartTimestamp = [];
let raccoonLane = [];
let raccoonColumn = [];

hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight);

const initialDirLightPositionX = -100;
const initialDirLightPositionY = -100;
dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
dirLight.castShadow = true;
dirLight.target = chicken;
scene.add(dirLight);

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

// var helper = new THREE.CameraHelper( dirLight.shadow.camera );
// var helper = new THREE.CameraHelper( camera );
// scene.add(helper)

backLight = new THREE.DirectionalLight(0x000000, 0.4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight);

//const laneTypes = ["Car_Lane", "Truck_Lane", "Forest_Lane", "River_Lane_Fixed"];
const laneTypes = ["Forest_Lane", "Car_Lane"];
const botNumber = 1;
const botPosition = [2];
const vehicleSize = { Car_Lane: 60, Truck_Lane: 105 };
const laneSpeeds = [2, 2.5, 3];
const vehicleColors = [0x428eff, 0xffef42, 0xff7b42, 0xff426b];
const treeHeights = [20, 45, 60];
let isRiverLastTime = false;
const initaliseValues = () => {
  lanes = generateLanes();

  currentLane = 0;
  currentColumn = Math.floor(columns / 2);

  previousTimestamp = null;

  gameOver = false;

  startMoving = false;
  moves = [];
  stepStartTimestamp;

  chicken.position.x = 0;
  chicken.position.y = 0;

  camera.position.y = initialCameraPositionY;
  camera.position.x = initialCameraPositionX;

  dirLight.position.x = initialDirLightPositionX;
  dirLight.position.y = initialDirLightPositionY;

  for (let i = 0; i < botNumber; i++) {
    const newPositionX = (botPosition[i] * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
    const newBot = new Raccoon();
    newBot.position.x = newPositionX;
    newBot.position.y = 0;
    raccoon.push(newBot);
    scene.add(raccoon[raccoon.length - 1]);
    raccoonLane.push(0);
    raccoonColumn.push(botPosition[i]);
    raccoonMoves.push([]);
    raccoonPreviousTimestamp.push(null);
    raccoonStepStartTimestamp.push(null);
    raccoonStartMoving.push(false);
  }
  winDOM.style.visibility = "hidden";
};

initaliseValues();

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function Texture(width, height, rects) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(0,0,0,0.6)";
  rects.forEach((rect) => {
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
  return new THREE.CanvasTexture(canvas);
}

function Wheel() {
  const wheel = new THREE.Mesh(new THREE.BoxBufferGeometry(12 * zoom, 33 * zoom, 12 * zoom), new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true }));
  wheel.position.z = 6 * zoom;
  return wheel;
}

function Car() {
  const car = new THREE.Group();
  const color = vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

  car.name = "Car_Vehicle";
  const main = new THREE.Mesh(new THREE.BoxBufferGeometry(60 * zoom, 30 * zoom, 15 * zoom), new THREE.MeshPhongMaterial({ color, flatShading: true }));
  main.position.z = 12 * zoom;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);

  const cabin = new THREE.Mesh(new THREE.BoxBufferGeometry(33 * zoom, 24 * zoom, 12 * zoom), [
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carBackTexture }),
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carFrontTexture }),
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carRightSideTexture }),
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carLeftSideTexture }),
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // top
    new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // bottom
  ]);
  cabin.position.x = 6 * zoom;
  cabin.position.z = 25.5 * zoom;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  const frontWheel = new Wheel();
  frontWheel.position.x = -18 * zoom;
  car.add(frontWheel);

  const backWheel = new Wheel();
  backWheel.position.x = 18 * zoom;
  car.add(backWheel);

  car.castShadow = true;
  car.receiveShadow = false;

  return car;
}

function Truck() {
  const truck = new THREE.Group();
  const color = vehicleColors[Math.floor(Math.random() * vehicleColors.length)];

  truck.name = "Truck_Vehicle";
  const base = new THREE.Mesh(new THREE.BoxBufferGeometry(100 * zoom, 25 * zoom, 5 * zoom), new THREE.MeshLambertMaterial({ color: 0xb4c6fc, flatShading: true }));
  base.position.z = 10 * zoom;
  truck.add(base);

  const cargo = new THREE.Mesh(new THREE.BoxBufferGeometry(75 * zoom, 35 * zoom, 40 * zoom), new THREE.MeshPhongMaterial({ color: 0xb4c6fc, flatShading: true }));
  cargo.position.x = 15 * zoom;
  cargo.position.z = 30 * zoom;
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  truck.add(cargo);

  const cabin = new THREE.Mesh(new THREE.BoxBufferGeometry(25 * zoom, 30 * zoom, 30 * zoom), [
    new THREE.MeshPhongMaterial({ color, flatShading: true }), // back
    new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckFrontTexture }),
    new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckRightSideTexture }),
    new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckLeftSideTexture }),
    new THREE.MeshPhongMaterial({ color, flatShading: true }), // top
    new THREE.MeshPhongMaterial({ color, flatShading: true }), // bottom
  ]);
  cabin.position.x = -40 * zoom;
  cabin.position.z = 20 * zoom;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  truck.add(cabin);

  const frontWheel = new Wheel();
  frontWheel.position.x = -38 * zoom;
  truck.add(frontWheel);

  const middleWheel = new Wheel();
  middleWheel.position.x = -10 * zoom;
  truck.add(middleWheel);

  const backWheel = new Wheel();
  backWheel.position.x = 30 * zoom;
  truck.add(backWheel);

  return truck;
}

function Tree() {
  const tree = new THREE.Group();
  tree.name = "Tree";
  const trunk = new THREE.Mesh(new THREE.BoxBufferGeometry(15 * zoom, 15 * zoom, 20 * zoom), new THREE.MeshPhongMaterial({ color: 0x4d2926, flatShading: true }));
  trunk.position.z = 10 * zoom;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  height = treeHeights[Math.floor(Math.random() * treeHeights.length)];

  const crown = new THREE.Mesh(new THREE.BoxBufferGeometry(30 * zoom, 30 * zoom, height * zoom), new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true }));
  crown.position.z = (height / 2 + 20) * zoom;
  crown.castShadow = true;
  crown.receiveShadow = false;
  tree.add(crown);

  return tree;
}

function Chicken() {
  const chicken = new THREE.Group();
  chicken.name = "Chicken";
  const body = new THREE.Mesh(new THREE.BoxBufferGeometry(chickenSize * zoom, chickenSize * zoom, 20 * zoom), new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }));
  body.position.z = 10 * zoom;
  body.castShadow = true;
  body.receiveShadow = true;
  chicken.add(body);

  const rowel = new THREE.Mesh(new THREE.BoxBufferGeometry(2 * zoom, 4 * zoom, 2 * zoom), new THREE.MeshLambertMaterial({ color: 0xf0619a, flatShading: true }));
  rowel.position.z = 21 * zoom;
  rowel.castShadow = true;
  rowel.receiveShadow = false;
  chicken.add(rowel);

  return chicken;
}

function Raccoon() {
  const raccoon = new THREE.Group();
  raccoon.name = "Raccoon";
  const body = new THREE.Mesh(new THREE.BoxBufferGeometry(chickenSize * zoom, chickenSize * zoom, 20 * zoom), new THREE.MeshPhongMaterial({ color: 0x50484b, flatShading: true }));
  body.position.z = 10 * zoom;
  body.castShadow = true;
  body.receiveShadow = true;
  raccoon.add(body);

  const head = new THREE.Mesh(new THREE.BoxBufferGeometry(6 * zoom, 6 * zoom, 2 * zoom), new THREE.MeshLambertMaterial({ color: 0x48302b, flatShading: true }));
  head.position.z = 21 * zoom;
  head.castShadow = true;
  head.receiveShadow = false;
  raccoon.add(head);

  return raccoon;
}

function Road() {
  const road = new THREE.Group();
  road.name = "Road";
  const createSection = (color) => new THREE.Mesh(new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom), new THREE.MeshPhongMaterial({ color }));

  const middle = createSection(0x454a59);
  middle.receiveShadow = true;
  road.add(middle);

  const left = createSection(0x393d49);
  left.position.x = -boardWidth * zoom;
  road.add(left);

  const right = createSection(0x393d49);
  right.position.x = boardWidth * zoom;
  road.add(right);

  return road;
}

function Grass() {
  const grass = new THREE.Group();
  grass.name = "Grass";
  const createSection = (color) => new THREE.Mesh(new THREE.BoxBufferGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom), new THREE.MeshPhongMaterial({ color }));

  const middle = createSection(0x55f472);
  middle.receiveShadow = true;
  grass.add(middle);

  const left = createSection(0x46c871);
  left.position.x = -boardWidth * zoom;
  grass.add(left);

  const right = createSection(0x46c871);
  right.position.x = boardWidth * zoom;
  grass.add(right);

  grass.position.z = 1.5 * zoom;
  return grass;
}

function FinishMark() {
  const finishMark = new THREE.Group();
  finishMark.name = "Finish_Mark";
  const createSection = (color) => new THREE.Mesh(new THREE.BoxBufferGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom), new THREE.MeshPhongMaterial({ color }));

  const middle = createSection(0x231d63);
  middle.receiveShadow = true;
  finishMark.add(middle);

  const left = createSection(0x280d8a);
  left.position.x = -boardWidth * zoom;
  finishMark.add(left);

  const right = createSection(0x2f2940);
  right.position.x = boardWidth * zoom;
  finishMark.add(right);

  finishMark.position.z = 1.5 * zoom;
  return finishMark;
}

function River() {
  const river = new THREE.Group();
  river.name = "River_Lane";
  const createSection = (color) => new THREE.Mesh(new THREE.BoxBufferGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom), new THREE.MeshPhongMaterial({ color }));

  const middle = createSection(0x0081ff);
  middle.receiveShadow = true;
  river.add(middle);

  const left = createSection(0x0081ff);
  left.position.x = -boardWidth * zoom;
  river.add(left);

  const right = createSection(0x0081ff);
  right.position.x = boardWidth * zoom;
  river.add(right);

  river.position.z = 1.5 * zoom;
  return river;
}

function Bridge() {
  const bridge = new THREE.Group();
  bridge.name = "Bridge";
  const body = new THREE.Mesh(
    new THREE.BoxBufferGeometry(positionWidth * zoom, positionWidth * zoom, 3 * zoom),
    new THREE.MeshPhongMaterial({ color: 0x4d4736, flatShading: true })
  );
  body.position.z = 5;
  body.castShadow = true;
  body.receiveShadow = false;
  bridge.add(body);

  return bridge;
}

function Lane(index) {
  this.index = index;
  this.type = index <= 0 ? "Field_Lane" : laneTypes[Math.floor(Math.random() * laneTypes.length)];
  if (isRiverLastTime == true) {
    this.type = laneTypes[0];
    isRiverLastTime = false;
  }
  switch (this.type) {
    case "Field_Lane": {
      this.mesh = new Grass();
      break;
    }
    case "Forest_Lane": {
      this.mesh = new Grass();

      this.occupiedPositions = new Set();
      this.tree = [1, 2].map(() => {
        const tree = new Tree();
        let position;
        do {
          position = Math.floor(Math.random() * columns);
        } while (this.occupiedPositions.has(position));
        this.occupiedPositions.add(position);
        tree.position.x = (position * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        this.mesh.add(tree);
        return tree;
      });
      break;
    }
    case "Car_Lane": {
      this.mesh = new Road();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      this.vehicle = [1].map(() => {
        const vehicle = new Car();
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 2);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        vehicle.position.x = (position * positionWidth * 2 + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        if (!this.direction) vehicle.rotation.z = Math.PI;
        this.mesh.add(vehicle);
        return vehicle;
      });

      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
      break;
    }
    case "Truck_Lane": {
      this.mesh = new Road();
      this.direction = Math.random() >= 0.5;

      const occupiedPositions = new Set();
      this.vehicle = [1].map(() => {
        const vehicle = new Truck();
        let position;
        do {
          position = Math.floor((Math.random() * columns) / 3);
        } while (occupiedPositions.has(position));
        occupiedPositions.add(position);
        vehicle.position.x = (position * positionWidth * 3 + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        if (!this.direction) vehicle.rotation.z = Math.PI;
        this.mesh.add(vehicle);
        return vehicle;
      });
      this.speed = laneSpeeds[Math.floor(Math.random() * laneSpeeds.length)];
      break;
    }
    case "River_Lane_Fixed": {
      isRiverLastTime = true;
      this.mesh = new River();
      this.occupiedPositions = new Set();
      this.bridge = [1, 2, 3, 4].map(() => {
        const bridge = new Bridge();
        let position;
        do {
          position = Math.floor(Math.random() * columns);
        } while (this.occupiedPositions.has(position));
        this.occupiedPositions.add(position);
        bridge.position.x = (position * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2;
        this.mesh.add(bridge);
        return bridge;
      });
      break;
    }
  }
}

document.querySelector("#retry").addEventListener("click", () => {
  lanes.forEach((lane) => scene.remove(lane.mesh));
  initaliseValues();
  endDOM.style.visibility = "hidden";
});

document.getElementById("forward").addEventListener("click", () => move("forward"));

document.getElementById("backward").addEventListener("click", () => move("backward"));

document.getElementById("left").addEventListener("click", () => move("left"));

document.getElementById("right").addEventListener("click", () => move("right"));

window.addEventListener("keydown", (event) => {
  if (event.keyCode == "38" && !gameOver) {
    // up arrow
    move("forward");
  } else if (event.keyCode == "40" && !gameOver) {
    // down arrow
    move("backward");
  } else if (event.keyCode == "37" && !gameOver) {
    // left arrow
    move("left");
  } else if (event.keyCode == "39" && !gameOver) {
    // right arrow
    move("right");
  } else if (event.code == "KeyW" && !gameOver) {
    // right arrow
    raccoonMove("forward", 0);
    raccoonMove("forward", 1);
  } else if (event.code == "KeyA" && !gameOver) {
    // right arrow
    raccoonMove("left", 0);
    raccoonMove("left", 1);
  } else if (event.code == "KeyS" && !gameOver) {
    // right arrow
    raccoonMove("backward", 0);
    raccoonMove("backward", 1);
  } else if (event.code == "KeyD" && !gameOver) {
    // right arrow
    raccoonMove("right", 0);
    raccoonMove("right", 1);
  }
});

function move(direction) {
  const finalPositions = moves.reduce(
    (position, move) => {
      if (move === "forward") return { lane: position.lane + 1, column: position.column };
      if (move === "backward") return { lane: position.lane - 1, column: position.column };
      if (move === "left") return { lane: position.lane, column: position.column - 1 };
      if (move === "right") return { lane: position.lane, column: position.column + 1 };
    },
    { lane: currentLane, column: currentColumn }
  );
  if (direction === "forward") {
    if (lanes[finalPositions.lane + 1].type === "Forest_Lane" && lanes[finalPositions.lane + 1].occupiedPositions.has(finalPositions.column)) return;
    if (!stepStartTimestamp) startMoving = true;
    if (isInfiniteGame == true) addLane();
  } else if (direction === "backward") {
    if (finalPositions.lane === 0) return;
    if (lanes[finalPositions.lane - 1].type === "Forest_Lane" && lanes[finalPositions.lane - 1].occupiedPositions.has(finalPositions.column)) return;
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "left") {
    if (finalPositions.column === 0) return;
    if (lanes[finalPositions.lane].type === "Forest_Lane" && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column - 1)) return;
    if (!stepStartTimestamp) startMoving = true;
  } else if (direction === "right") {
    if (finalPositions.column === columns - 1) return;
    if (lanes[finalPositions.lane].type === "Forest_Lane" && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column + 1)) return;
    if (!stepStartTimestamp) startMoving = true;
  }
  moves.push(direction);
}
function raccoonMove(direction, indexRaccoon) {
  const finalPositions = raccoonMoves[indexRaccoon].reduce(
    (position, move) => {
      if (move === "forward") return { lane: position.lane + 1, column: position.column };
      if (move === "backward") return { lane: position.lane - 1, column: position.column };
      if (move === "left") return { lane: position.lane, column: position.column - 1 };
      if (move === "right") return { lane: position.lane, column: position.column + 1 };
    },
    { lane: raccoonLane[indexRaccoon], column: raccoonColumn[indexRaccoon] }
  );
  if (direction === "forward") {
    if (lanes[finalPositions.lane + 1].type === "Forest_Lane" && lanes[finalPositions.lane + 1].occupiedPositions.has(finalPositions.column)) return;
    if (!raccoonStepStartTimestamp[indexRaccoon]) raccoonStartMoving[indexRaccoon] = true;
  } else if (direction === "backward") {
    if (finalPositions.lane === 0) return;
    if (lanes[finalPositions.lane - 1].type === "Forest_Lane" && lanes[finalPositions.lane - 1].occupiedPositions.has(finalPositions.column)) return;
    if (!raccoonStepStartTimestamp[indexRaccoon]) raccoonStartMoving[indexRaccoon] = true;
  } else if (direction === "left") {
    if (finalPositions.column === 0) return;
    if (lanes[finalPositions.lane].type === "Forest_Lane" && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column - 1)) return;
    if (!raccoonStepStartTimestamp[indexRaccoon]) raccoonStartMoving[indexRaccoon] = true;
  } else if (direction === "right") {
    if (finalPositions.column === columns - 1) return;
    if (lanes[finalPositions.lane].type === "Forest_Lane" && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column + 1)) return;
    if (!raccoonStepStartTimestamp[indexRaccoon]) raccoonStartMoving[indexRaccoon] = true;
  }
  raccoonMoves[indexRaccoon].push(direction);
}

let tableItemsGlobal;
function animate(timestamp) {
  if (gameOver) {
    return;
  }
  requestAnimationFrame(animate);

  if (!previousTimestamp) previousTimestamp = timestamp;
  const delta = timestamp - previousTimestamp;
  previousTimestamp = timestamp;

  // Animate cars and trucks moving on the lane
  lanes.forEach((lane) => {
    if (lane.type === "Car_Lane" || lane.type === "Truck_Lane") {
      const aBitBeforeTheBeginingOfLane = (-boardWidth * zoom) / 2 - positionWidth * 2 * zoom;
      const aBitAfterTheEndOFLane = (boardWidth * zoom) / 2 + positionWidth * 2 * zoom;
      lane.vehicle.forEach((vehicle) => {
        if (lane.direction) {
          vehicle.position.x = vehicle.position.x < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : (vehicle.position.x -= (lane.speed / 16) * delta);
        } else {
          vehicle.position.x = vehicle.position.x > aBitAfterTheEndOFLane ? aBitBeforeTheBeginingOfLane : (vehicle.position.x += (lane.speed / 16) * delta);
        }
      });
    }
  });

  if (startMoving) {
    stepStartTimestamp = timestamp;
    startMoving = false;
  }

  if (stepStartTimestamp) {
    const moveDeltaTime = timestamp - stepStartTimestamp;
    const moveDeltaDistance = Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
    const jumpDeltaDistance = Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;
    switch (moves[0]) {
      case "forward": {
        const positionY = currentLane * positionWidth * zoom + moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY; // initial chicken position is 0

        chicken.position.z = jumpDeltaDistance;
        break;
      }
      case "backward": {
        positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
        camera.position.y = initialCameraPositionY + positionY;
        dirLight.position.y = initialDirLightPositionY + positionY;
        chicken.position.y = positionY;

        chicken.position.z = jumpDeltaDistance;
        break;
      }
      case "left": {
        const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 - moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX; // initial chicken position is 0
        chicken.position.z = jumpDeltaDistance;
        break;
      }
      case "right": {
        const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 + moveDeltaDistance;
        camera.position.x = initialCameraPositionX + positionX;
        dirLight.position.x = initialDirLightPositionX + positionX;
        chicken.position.x = positionX;

        chicken.position.z = jumpDeltaDistance;
        break;
      }
    }
    // Once a step has ended
    if (moveDeltaTime > stepTime) {
      switch (moves[0]) {
        case "forward": {
          currentLane++;
          counterDOM.innerHTML = currentLane;
          break;
        }
        case "backward": {
          currentLane--;
          counterDOM.innerHTML = currentLane;
          break;
        }
        case "left": {
          currentColumn--;
          break;
        }
        case "right": {
          currentColumn++;
          break;
        }
      }
      moves.shift();
      // If more steps are to be taken then restart counter otherwise stop stepping
      stepStartTimestamp = moves.length === 0 ? null : timestamp;
    }
  }
  for (let i = 0; i < raccoon.length; i++) {
    if (raccoonStartMoving[i]) {
      const moveDeltaTime = timestamp - raccoonStepStartTimestamp[i];
      const moveDeltaDistance = Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
      const jumpDeltaDistance = Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;
      //Raccoon / Bot Move Update
      raccoonStartMoving[i] = false;
      raccoonStepStartTimestamp[i] = timestamp;
      let currentLane = raccoonLane[i];
      let currentColumn = raccoonColumn[i];
      switch (raccoonMoves[i][0]) {
        case "forward": {
          const positionY = currentLane * positionWidth * zoom + moveDeltaDistance;
          raccoon[i].position.y = positionY; // initial raccoon position is 0
          raccoon[i].position.z = jumpDeltaDistance;
          break;
        }
        case "backward": {
          const positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
          raccoon[i].position.y = positionY;
          raccoon[i].position.z = jumpDeltaDistance;
          break;
        }
        case "left": {
          const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 - moveDeltaDistance;
          raccoon[i].position.x = positionX; // initial  raccoon position is 0
          raccoon[i].position.z = jumpDeltaDistance;
          break;
        }
        case "right": {
          const positionX = (currentColumn * positionWidth + positionWidth / 2) * zoom - (boardWidth * zoom) / 2 + moveDeltaDistance;
          raccoon[i].position.x = positionX;
          raccoon[i].position.z = jumpDeltaDistance;
          break;
        }
      }
      // Once a step has ended

      switch (raccoonMoves[i][0]) {
        case "forward": {
          currentLane++;
          break;
        }
        case "backward": {
          currentLane--;
          break;
        }
        case "left": {
          currentColumn--;
          break;
        }
        case "right": {
          currentColumn++;
          break;
        }
      }
      raccoonLane[i] = currentLane;
      raccoonColumn[i] = currentColumn;
      raccoonMoves[i].shift();

      // If more steps are to be taken then restart counter otherwise stop stepping
      raccoonStepStartTimestamp[i] = raccoonMoves[0].length === 0 ? null : timestamp;
    }
  }
  // console.log(raccoonMoves);
  // console.log(raccoonStartMoving);

  // Hit test
  if (lanes[currentLane].type === "Car_Lane" || lanes[currentLane].type === "Truck_Lane" || lanes[currentLane].type === "River_Lane_Fixed") {
    const chickenMinX = chicken.position.x - (chickenSize * zoom) / 2;
    const chickenMaxX = chicken.position.x + (chickenSize * zoom) / 2;
    if (lanes[currentLane].vehicle != undefined) {
      const vehicleLength = vehicleSize[lanes[currentLane].type];
      lanes[currentLane].vehicle.forEach((vehicle) => {
        const carMinX = vehicle.position.x - (vehicleLength * zoom) / 2;
        const carMaxX = vehicle.position.x + (vehicleLength * zoom) / 2;
        if (chickenMaxX > carMinX && chickenMinX < carMaxX) {
          gameOver = true;
          endDOM.style.visibility = "visible";
        }
      });
    }
    if (lanes[currentLane].bridge != undefined) {
      let isInBridge = false;
      lanes[currentLane].bridge.forEach((bridge) => {
        const bridgeMinX = bridge.position.x - (positionWidth * zoom) / 2;
        const bridgeMaxX = bridge.position.x + (positionWidth * zoom) / 2;
        if (chickenMaxX > bridgeMinX && chickenMinX < bridgeMaxX) {
          //console.log("In Bridge");
          isInBridge = true;
        } else {
          // console.log("Out Bridge");
        }
      });
      if (isInBridge == false) {
        gameOver = true;
        endDOM.style.visibility = "visible";
      }
    }
  }
  if (lanes[currentLane].type == "Finish_Lane") {
    gameOver = true;
    winDOM.style.visibility = "visible";
  }
  // console.log(lanes);
  // console.log(tableItemsGlobal);
  tableItemsGlobal = refreshGrid2DObjek();
  //debuggingAPI(tableItemsGlobal);
  //console.log(raccoon);
  renderer.render(scene, camera);
}

setInterval(() => {
  searchChickenGreedy();
}, 500);

function searchChickenGreedy() {
  const possibleMove = { forward: "forward", backward: "backward", left: "left", right: "right" };
  const matrixRoad = [];
  if (tableItemsGlobal == undefined) {
    return;
  }
  const target = { col: -1, row: -1 };
  for (let i = 0; i < tableItemsGlobal.length; i++) {
    const tempMatrix = [];
    for (let j = 0; j < tableItemsGlobal[i].length; j++) {
      if (tableItemsGlobal[i][j].isControllable) {
        tempMatrix.push(3);
        target.row = i;
        target.col = j;
      } else if (tableItemsGlobal[i][j].isARoad) {
        tempMatrix.push(1);
      } else {
        tempMatrix.push(0);
      }
    }
    matrixRoad.push(tempMatrix);
  }
  //Greedy with Euclidean distance
  for (let j = 0; j < matrixRoad.length; j++) {
    for (let k = 0; k < matrixRoad[j].length; k++) {
      if (matrixRoad[j][k] == 1) {
        const a = target.row - j;
        const b = target.col - k;
        matrixRoad[j][k] = Math.round(Math.sqrt(a * a + b * b));
      }
    }
  }
  matrixRoad[target.row][target.col] = "T";
  for (let i = 0; i < raccoon.length; i++) {
    let sumber = { col: raccoonColumn[i], row: raccoonLane[i] };
    if (sumber.col < 0 || sumber.col >= columns) {
      continue;
    }
    matrixRoad[sumber.row][sumber.col] = "R";
    const choice = getBorderValue(matrixRoad, { row: sumber.row, col: sumber.col });
    const minVar = getMinimumValueBorder(choice);
    let executeMessage = "";
    if (minVar === "bottom") {
      executeMessage = possibleMove.forward;
    } else if (minVar === "top") {
      executeMessage = possibleMove.backward;
    } else if (minVar === "left") {
      executeMessage = possibleMove.left;
    } else if (minVar === "right") {
      executeMessage = possibleMove.right;
    } else {
      console.log("Bot " + (i + 1) + " : No Action");
    }
    console.log("Bot " + (i + 1) + " :" + executeMessage);
    raccoonMove(executeMessage, i);
  }
}
function getBorderValue(array = [[]], idx = { row: -1, col: -1 }) {
  const borderVal = { top: 0, bottom: 0, left: 0, right: 0 };
  if (idx.row + 1 < array.length) {
    borderVal.bottom = array[idx.row + 1][idx.col];
  }
  if (idx.row - 1 >= 0) {
    borderVal.top = array[idx.row - 1][idx.col];
  }
  if (idx.col + 1 < array[idx.row].length) {
    borderVal.right = array[idx.row][idx.col + 1];
  }
  if (idx.col - 1 >= 0) {
    borderVal.left = array[idx.row][idx.col - 1];
  }
  return borderVal;
}
function getMinimumValueBorder(borderVal = { top: 0, bottom: 0, left: 0, right: 0 }) {
  let variabelMin = "top";
  let minimumVal = borderVal.top;
  //Init
  if (minimumVal == 0) {
    variabelMin = "bottom";
    minimumVal = minimumVal.bottom;
  }
  if (minimumVal == 0) {
    variabelMin = "left";
    minimumVal = minimumVal.left;
  }
  if (minimumVal == 0) {
    variabelMin = "right";
    minimumVal = minimumVal.right;
  }

  if (minimumVal > borderVal.bottom && borderVal.bottom != 0) {
    variabelMin = "bottom";
    minimumVal = borderVal.bottom;
  }
  if (minimumVal > borderVal.left && borderVal.left != 0) {
    variabelMin = "left";
    minimumVal = borderVal.left;
  }
  if (minimumVal > borderVal.right && borderVal.right != 0) {
    variabelMin = "right";
    minimumVal = borderVal.right;
  }
  return variabelMin;
}

function apiGameEngine() {
  let stat = !gameOver;
  //Print Stats from Console Log
  return { statusGame: stat, gridItems: tableItemsGlobal };
}

function refreshGrid2DObjek() {
  const tableItems = new Array();
  if (tableItems.length < lanes.length) {
    for (let i = tableItems.length; i < lanes.length; i++) {
      tableItems.push(new Array(columns));
      for (let j = 0; j < tableItems[i].length; j++) {
        tableItems[i][j] = new Item();
      }
    }
  }
  for (let i = 0; i < lanes.length; i++) {
    let childLane = [];
    //ke kiri True
    //ke kanan False
    let direction = "";
    for (let j = 0; j < columns; j++) {
      tableItems[i][j].label = lanes[i].type;
      tableItems[i][j].position.x = -1;
      tableItems[i][j].position.y = i;
      tableItems[i][j].pParent = [];

      switch (lanes[i].type) {
        case "Field_Lane": {
          tableItems[i][j].isARoad = true;
          tableItems[i][j].isAFood = false;
          tableItems[i][j].isDangerous = false;
          tableItems[i][j].isMoving = false;
          break;
        }
        case "Forest_Lane": {
          childLane = lanes[i].tree;
          tableItems[i][j].isARoad = true;
          tableItems[i][j].isAFood = false;
          tableItems[i][j].isDangerous = false;
          tableItems[i][j].isMoving = false;
          break;
        }
        case "Car_Lane": {
          childLane = lanes[i].vehicle;
          tableItems[i][j].isARoad = true;
          tableItems[i][j].isAFood = false;
          tableItems[i][j].isDangerous = false;
          tableItems[i][j].isMoving = false;
          direction = lanes[i].direction;
          break;
        }
        case "Truck_Lane": {
          childLane = lanes[i].vehicle;
          tableItems[i][j].isARoad = true;
          tableItems[i][j].isAFood = false;
          tableItems[i][j].isDangerous = false;
          tableItems[i][j].isMoving = false;
          direction = lanes[i].direction;
          break;
        }
        case "River_Lane_Fixed": {
          childLane = lanes[i].bridge;
          tableItems[i][j].isARoad = false;
          tableItems[i][j].isAFood = false;
          tableItems[i][j].isDangerous = true;
          tableItems[i][j].isMoving = false;
          break;
        }
        case "Finish_Lane": {
          tableItems[i][j].isARoad = true;
          tableItems[i][j].isAFood = false;
          tableItems[i][j].status = 3;
          tableItems[i][j].isDangerous = false;
          tableItems[i][j].isMoving = false;
          break;
        }
        default: {
          console.log("Error Lane :" + lanes[i].type);
          break;
        }
      }
    }
    for (let j = 0; j < childLane.length; j++) {
      let pos = Math.floor(-((positionWidth - boardWidth - childLane[j].position.x) / zoom / positionWidth));
      let sizeItem = 0;
      if (pos < 0 || pos >= columns) {
        continue;
      }
      tableItems[i][pos].label = childLane[j].name;
      tableItems[i][pos].position.x = pos;
      tableItems[i][pos].position.y = i;
      tableItems[i][pos].position.pParent = [];
      switch (childLane[j].name) {
        case "Truck_Vehicle": {
          tableItems[i][pos].isMoving = true;
          tableItems[i][pos].isDangerous = true;
          tableItems[i][pos].isAFood = false;
          tableItems[i][pos].isARoad = false;

          tableItems[i][pos].size = Math.ceil(vehicleSize.Truck_Lane / positionWidth);
          sizeItem = tableItems[i][pos].size;
          for (let iter = 0; iter < sizeItem; iter++) {
            if (direction) {
              pos++;
            } else {
              pos--;
            }
            if (pos < 0 || tableItems[i].length <= pos) {
              continue;
            }
            tableItems[i][pos].label = "Truck_Vehicle_Body";
            tableItems[i][pos].position.x = pos;
            tableItems[i][pos].position.y = i;
            tableItems[i][pos].position.pParent = [tableItems[i][pos]];

            tableItems[i][pos].isMoving = tableItems[i][pos].isMoving;
            tableItems[i][pos].isDangerous = tableItems[i][pos].isDangerous;
            tableItems[i][pos].isAFood = tableItems[i][pos].isAFood;
            tableItems[i][pos].isARoad = tableItems[i][pos].isARoad;
          }
          break;
        }
        case "Car_Vehicle": {
          tableItems[i][pos].isMoving = true;
          tableItems[i][pos].isDangerous = true;
          tableItems[i][pos].isAFood = false;
          tableItems[i][pos].isARoad = false;
          tableItems[i][pos].size = Math.ceil(vehicleSize.Car_Lane / positionWidth);
          sizeItem = tableItems[i][pos].size;
          for (let iter = 0; iter < sizeItem; iter++) {
            if (direction) {
              pos++;
            } else {
              pos--;
            }
            if (pos < 0 || tableItems[i].length <= pos) {
              continue;
            }
            tableItems[i][pos].label = "Car_Vehicle_Body";
            tableItems[i][pos].position.x = pos;
            tableItems[i][pos].position.y = i;
            tableItems[i][pos].position.pParent = [tableItems[i][j]];

            tableItems[i][pos].isMoving = tableItems[i][pos].isMoving;
            tableItems[i][pos].isDangerous = tableItems[i][pos].isDangerous;
            tableItems[i][pos].isAFood = tableItems[i][pos].isAFood;
            tableItems[i][pos].isARoad = tableItems[i][pos].isARoad;
          }
          break;
        }
        case "Tree": {
          tableItems[i][pos].isMoving = false;
          tableItems[i][pos].isDangerous = false;
          tableItems[i][pos].isAFood = false;
          tableItems[i][pos].isARoad = false;
          break;
        }
        case "Bridge": {
          tableItems[i][pos].isMoving = false;
          tableItems[i][pos].isDangerous = false;
          tableItems[i][pos].isAFood = false;
          tableItems[i][pos].isARoad = true;
          tableItems[i][pos].size = 1;
          sizeItem = tableItems[i][pos].size;
          for (let iter = 0; iter < sizeItem - 1; iter++) {
            if (direction) {
              pos--;
            } else {
              pos++;
            }
            if (pos < 0 || tableItems[i].length <= pos) {
              continue;
            }
            tableItems[i][pos].position.x = pos;
            tableItems[i][pos].position.y = i;
            tableItems[i][pos].pParent = tableItems[i][j];

            tableItems[i][pos].isMoving = tableItems[i][pos].isMoving;
            tableItems[i][pos].isDangerous = tableItems[i][pos].isDangerous;
            tableItems[i][pos].isAFood = tableItems[i][pos].isAFood;
            tableItems[i][pos].isARoad = tableItems[i][pos].isARoad;
          }
          break;
        }
        default: {
          console.log("Error Default ");
        }
      }
    }
  }
  //console.log(raccoon);
  for (let i = 0; i < raccoon.length; i++) {
    let pos = raccoonColumn[i];
    const posLane = raccoonLane[i];
    if (pos < 0 || pos > columns) {
      continue;
    }
    // if (tableItems[posLane][pos] == undefined) {
    //   console.log(tableItems[posLane][pos]);
    //   continue;
    // }
    tableItems[posLane][pos].label = "Raccoon";
    tableItems[posLane][pos].isMoving = true;
    tableItems[posLane][pos].isDangerous = true;
    tableItems[posLane][pos].isAFood = false;
    tableItems[posLane][pos].isARoad = false;
    tableItems[posLane][pos].isControllable = false;
    tableItems[posLane][pos].position.x = pos;
    tableItems[posLane][pos].position.y = posLane;
  }
  tableItems[currentLane][currentColumn].label = "chicken";
  tableItems[currentLane][currentColumn].isControllable = true;
  tableItems[currentLane][currentColumn].isDangerous = false;
  tableItems[currentLane][currentColumn].isMoving = true;
  tableItems[currentLane][currentColumn].isARoad = true;
  tableItems[currentLane][currentColumn].isAFood = false;
  tableItems[currentLane][currentColumn].position.x = currentColumn; // ? kebalik ?
  tableItems[currentLane][currentColumn].position.y = currentLane;
  return tableItems;
}

function debuggingAPI(tableItems) {
  let FinaltempStr = "";
  FinaltempStr += "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" + "\n";
  for (let i = tableItems.length - 1; i >= 0; i--) {
    let tempStr = "";
    for (let j = 0; j < tableItems[i].length; j++) {
      let iconDebug = "";
      if (tableItems[i][j] == undefined) {
        continue;
      }
      switch (tableItems[i][j].label) {
        case "chicken": {
          iconDebug = "A";
          break;
        }
        case "Field_Lane": {
          iconDebug = "_";
          break;
        }
        case "Forest_Lane": {
          iconDebug = "_";
          break;
        }
        case "Car_Lane": {
          iconDebug = "-";
          break;
        }
        case "Truck_Lane": {
          iconDebug = "-";
          break;
        }
        case "Truck_Vehicle": {
          iconDebug = "$";
          break;
        }
        case "Car_Vehicle": {
          iconDebug = "$";
          break;
        }
        case "Truck_Vehicle_Body": {
          iconDebug = "%";
          break;
        }
        case "Car_Vehicle_Body": {
          iconDebug = "%";
          break;
        }
        case "Tree": {
          iconDebug = "#";
          break;
        }
        case "Bridge": {
          iconDebug = "?";
          break;
        }
        case "River_Lane_Fixed": {
          iconDebug = "!";
          break;
        }
        case "Finish_Lane": {
          iconDebug = "F";
          break;
        }
        case "Chicken": {
          iconDebug = "C";
          break;
        }
        case "Raccoon": {
          iconDebug = "E";
          break;
        }
        default: {
          console.log("Undefined Type !! :" + tableItems[i][j].label);
        }
      }
      tempStr += iconDebug;
    }
    FinaltempStr += tempStr + "\n";
  }
  FinaltempStr += "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" + "\n";
  console.log(FinaltempStr);
}

requestAnimationFrame(animate);
