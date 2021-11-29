const counterDOM = document.getElementById("counter");
const endDOM = document.getElementById("end");

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

const stepTime = 10; // Miliseconds it takes for the chicken to take a step forward, backward, left or right

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

const chicken = new Chicken();
scene.add(chicken);

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

const laneTypes = ["Car_Lane", "Truck_Lane", "Forest_Lane"];
const laneSpeeds = [2, 2.5, 3];
const vechicleColors = [0x428eff, 0xffef42, 0xff7b42, 0xff426b];
const treeHeights = [20, 45, 60];

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
  const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

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
  const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

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

function Lane(index) {
  this.index = index;
  this.type = index <= 0 ? "Field_Lane" : laneTypes[Math.floor(Math.random() * laneTypes.length)];

  switch (this.type) {
    case "Field_Lane": {
      this.mesh = new Grass();
      break;
    }
    case "Forest_Lane": {
      this.mesh = new Grass();

      this.occupiedPositions = new Set();
      this.tree = [1, 2, 3, 4].map(() => {
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
      this.vehicle = [1, 2, 3].map(() => {
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
      this.vehicle = [1, 2].map(() => {
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
  }
});
let finalPositionsLog = {};
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
    addLane();
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
  finalPositionsLog = finalPositions;
}

function animate(timestamp) {
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

  // Hit test

  if(lanes[currentLane].type === 'Car_Lane' || lanes[currentLane].type === 'Truck_Lane') {
    const chickenMinX = chicken.position.x - chickenSize*zoom/2;
    const chickenMaxX = chicken.position.x + chickenSize*zoom/2;
    const vehicleLength = { Car_Lane: 60, Truck_Lane: 105}[lanes[currentLane].type];
    lanes[currentLane].vehicle.forEach(vehicle => {
      const carMinX = vehicle.position.x - vehicleLength*zoom/2;
      const carMaxX = vehicle.position.x + vehicleLength*zoom/2;
      if(chickenMaxX > carMinX && chickenMinX < carMaxX) {
        gameOver = true;
        endDOM.style.visibility = 'visible';
      }
    });
  }

  renderer.render(scene, camera);
}

function apiGameEngine(lanes = lanes) {
  let tableItems = [];
  for (let i = lanes.length - 1; i >= 0; i--) {
    let childLane = [];
    let tempTableItem = [];
    const item = new Item();
    item.label = lanes[i].type;
    switch (lanes[i].type) {
      case "Field_Lane": {
        item.isARoad = true;
        item.isAFood = false;
        item.isDangerous = false;
        item.isMoving = false;
        break;
      }
      case "Forest_Lane": {
        childLane = childLane.concat(lanes[i].tree);
        item.isARoad = true;
        item.isAFood = false;
        item.isDangerous = false;
        item.isMoving = false;
        break;
      }
      case "Car_Lane": {
        childLane = childLane.concat(lanes[i].vehicle);
        item.isARoad = true;
        item.isAFood = false;
        item.isDangerous = false;
        item.isMoving = false;
        break;
      }
      case "Truck_Lane": {
        childLane = childLane.concat(lanes[i].vehicle);
        item.isARoad = true;
        item.isAFood = false;
        item.isDangerous = false;
        item.isMoving = false;
        break;
      }
      default: {
        console.log("Error :" + lanes[i].type );
        break;
      }
    }

    for (let j = 0; j < columns; j++) {
      tempTableItem.push(item);
    }

    for (let j = 0; j < childLane.length; j++) {
      const pos = Math.floor(-((positionWidth - boardWidth - childLane[j].position.x) / zoom / positionWidth));
      const innerItem = new Item();
      innerItem.label = childLane[j].name;
      innerItem.position = {
        x : pos,
        y: i,
      }
      switch (childLane[j].name) {
        case "Truck_Vehicle": {
          innerItem.isMoving = true;
          innerItem.isDangerous = true;
          innerItem.isAFood = false;
          innerItem.isARoad = false;
          break;
        }
        case "Car_Vehicle": {
          innerItem.isMoving = true;
          innerItem.isDangerous = true;
          innerItem.isAFood = false;
          innerItem.isARoad = false;
          break;
        }
        case "Tree": {
          innerItem.isMoving = false;
          innerItem.isDangerous = false;
          innerItem.isAFood = false;
          innerItem.isARoad = false;
          break;
        }
        default: {
          console.log("Error Default ");
        }
      }
      tempTableItem[pos] = innerItem;
    }
    tableItems.push(tempTableItem);
  }
  tableItems[tableItems.length - currentLane - 1][currentColumn] = new Item("chicken",1,
                                            true,false,true,
                                            false,false, { x:currentColumn, y:currentLane});
  let stat = !gameOver;
  //Print Stats from Console Log
  let FinaltempStr = "";
  FinaltempStr += "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" + "\n";
  for (let i = 0; i < tableItems.length; i++) {
    let tempStr = "";
    for (let j = 0; j < tableItems[i].length; j++) {
      let iconDebug = "";
      if(tableItems[i][j] == undefined){
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
        case "Tree": {
          iconDebug = "#";
          break;
        }
        default : {
          console.log("Undefined Type !!");
        }
      }
      tempStr += iconDebug;
    }
    FinaltempStr += tempStr + "\n";
  }
  FinaltempStr += "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" + "\n";
  console.log(FinaltempStr);
  return {statusGame: stat ,gridItems :tableItems};
}

requestAnimationFrame(animate);
