let destination = { col: -1, row: -1 };
let currentPos = { col: -1, row: -1 };
let trajectoryDestination = [];
let finalDestination = { col: -1, row: -1 };
let lookAHead = 1;
const possibleMove = { forward: "forward", backward: "backward", left: "left", right: "right", hold: "hold" };
self.importScripts("astar.js");
self.importScripts("nodeelement.js");
onmessage = function (e) {
  //console.log("Worker Agent: Message received from main script ");
  const gameData = e.data;
  if (!gameData.statusGame) {
    postMessage("Game is Over / Not Active ");
    return;
  }
  const itemData = gameData.gridItems;
  //Pemisahan Objek Berisiko
  let binaryTable = make2DArray(itemData[itemData.length - 1].length, itemData.length, -1);
  for (let i = 0; i < binaryTable.length; i++) {
    for (let j = 0; j < binaryTable[i].length; j++) {
      if (itemData[i][j] == undefined) {
        binaryTable[i][j] = 0;
        continue;
      }
      if (itemData[i][j].isDangerous) {
        binaryTable[i][j] = 0;
        if (itemData[i][j].isMoving && itemData[i][j].position.pParent.length === 0) {
          binaryTable = SegmentationDangerItem(binaryTable, j, i, 0);
        }
      } else if (itemData[i][j].isARoad && binaryTable[i][j] == -1) {
        binaryTable[i][j] = 1;
        if (itemData[i][j].isAFood) {
          binaryTable[i][j] = 2;
        }
      } else {
        binaryTable[i][j] = 0;
      }
      //Status 3 Adalah Item Finish
      if (itemData[i][j].status == 3) {
        itemData[i][j].status = 1;
        binaryTable[i][j] = 1;
        finalDestination.row = i;
        finalDestination.col = j;
      }
      if (itemData[i][j].isControllable) {
        currentPos.row = i;
        currentPos.col = j;
        binaryTable[i][j] = 1;
      }
    }
  }

  //Pengecheckan apakah dalam posisi berbahaya
  const reflexOrder = reflexAgent(itemData);
  if (reflexOrder.row != currentPos.row || reflexOrder.col != currentPos.col) {
    const executeMessage = executeOrder(reflexOrder, binaryTable);
    if (executeMessage != "hold") {
      postMessage(executeMessage);
      return;
    } else {
      console.log("No Reflex");
    }
  }

  const gridAStar = new Array(binaryTable.length);
  //Pre Proccessing Grid A Star
  for (let i = 0; i < binaryTable.length; i++) {
    const tempGrid = new Array(binaryTable[i].length);
    for (let j = 0; j < binaryTable[i].length; j++) {
      if (binaryTable[i][j] == 2) {
        tempGrid[j] = { wall: false, difficulty: 1 };
      } else if (binaryTable[i][j] == 1) {
        tempGrid[j] = { wall: false, difficulty: 5 };
      } else {
        tempGrid[j] = { wall: true, difficulty: 0 };
      }
    }
    gridAStar[i] = tempGrid;
  }

  // Apakah sudah ada ada jalan sebelumnya
  if (trajectoryDestination.length == 0) {
    //Mencari Tujuan dan mencari jalan yang bisa dilalui
    lookAHead = Math.floor(Math.random() * 5) + 1;
    const arrDestination = chooseDestination(binaryTable);
    for (let i = 0; i < arrDestination.length; i++) {
      const start = [currentPos.row, currentPos.col];
      const end = [arrDestination[i].row, arrDestination[i].col];
      let aStarInstance;
      let optimalPath = [];
      try {
        aStarInstance = new AStar(start, end, gridAStar);
        aStarInstance.startAlgorithm();
        optimalPath = aStarInstance.optimalPath;
      } catch (e) {
        console.log("Error Instance A Star");
      }
      if (optimalPath.length > 0) {
        destination.col = arrDestination[i].col;
        destination.row = arrDestination[i].row;
        for (let j = 0; j < optimalPath.length; j++) {
          let item = itemData[parseInt(optimalPath[j].row)][parseInt(optimalPath[j].col)];
          if (j == optimalPath.length - 1) {
            continue;
          }
          if (j == 0) {
            item.label = "end";
            continue;
          }
          item.label = "trajectory";
        }
        trajectoryDestination = optimalPath;
        trajectoryDestination.pop();
        break;
      }
    }
  }
  //console.log(itemData);
  loggingTable(itemData);
  //console.log(currentPos);

  //Melakukan Eksekusi
  if (trajectoryDestination == undefined || trajectoryDestination.length == 0) {
    postMessage(possibleMove.hold);
  }
  const nextStep = trajectoryDestination.pop();
  const order = executeOrder(nextStep, binaryTable);
  if (order == possibleMove.hold) {
    trajectoryDestination = [];
  }
  postMessage(order);
};
function SegmentationDangerItem(gridBinary = [], cols = -1, rows = -1, value = -1) {
  if (gridBinary.length > rows + 1) {
    gridBinary[rows + 1][cols] = value;
  }
  if (0 <= rows - 1) {
    gridBinary[rows - 1][cols] = value;
  }
  if (gridBinary[rows].length > cols + 1) {
    gridBinary[rows][cols + 1] = value;
  }
  if (0 <= cols - 1) {
    gridBinary[rows][cols - 1] = value;
  }
  return gridBinary;
}
function executeOrder(nextStep, binaryTable) {
  let executeMessage = possibleMove.hold;
  if (nextStep == undefined || nextStep.row == undefined || nextStep.col == undefined) {
    return executeMessage;
  }
  // X = row
  // Y = col
  if (nextStep.row > currentPos.row && binaryTable[nextStep.row][currentPos.col] > 0) {
    executeMessage = possibleMove.forward;
  } else if (nextStep.row < currentPos.row && binaryTable[nextStep.row][currentPos.col] > 0) {
    executeMessage = possibleMove.backward;
  } else if (nextStep.col > currentPos.col && binaryTable[currentPos.row][nextStep.col] > 0) {
    executeMessage = possibleMove.right;
  } else if (nextStep.col < currentPos.col && binaryTable[currentPos.row][currentPos.col] > 0) {
    executeMessage = possibleMove.left;
  }
  return executeMessage;
}
function reflexAgent(itemData) {
  // [1, 1, 1, 1, 1]
  // [1, 0, 0, 0, 1] // tidak bisa ke atas
  // [1, 0, F, 0, 1] // tidak bisa ke kanan dan kiri
  // [1, 0, 0, 0, 1] // tidak bisa ke bawah
  // [1, 1, 1, 1, 1];
  //Mengecek apakah ada bahaya atau tidak
  //kiri cek => depan cek => kanan cek
  //mengecheck sekitar apakah dalam bahaaya tabrkan !
  let canGoUp = true;
  let canGoLeft = true;
  let canGoRight = true;
  let canGoDown = true;
  let reflexOrder = { row: currentPos.row, col: currentPos.col };
  if (
    currentPos.row + 1 < itemData.length &&
    currentPos.col - 1 >= 0 &&
    itemData[currentPos.row + 1][currentPos.col - 1].isDangerous &&
    itemData[currentPos.row + 1][currentPos.col - 1].isMoving
  ) {
    console.log("Sebelah Kiri Atas");
    canGoUp = false;
    canGoLeft = false;
  }
  if (
    currentPos.row + 1 < itemData.length &&
    currentPos.col < itemData[currentPos.row + 1].length &&
    itemData[currentPos.row + 1][currentPos.col].isDangerous &&
    itemData[currentPos.row + 1][currentPos.col].isMoving
  ) {
    console.log("Sebelah Atas");
    // tidak bisa ke bawah
    canGoUp = false;
  }

  if (
    currentPos.row + 1 < itemData.length &&
    currentPos.col + 1 < itemData[currentPos.row + 1].length &&
    itemData[currentPos.row + 1][currentPos.col + 1].isDangerous &&
    itemData[currentPos.row + 1][currentPos.col + 1].isMoving
  ) {
    console.log("Sebelah Atas Kanan");
    // tidak bisa ke bawah
    canGoUp = false;
    canGoRight = false;
  }
  if (
    currentPos.row < itemData.length &&
    currentPos.col - 1 >= 0 &&
    itemData[currentPos.row][currentPos.col - 1].isDangerous &&
    itemData[currentPos.row][currentPos.col - 1].isMoving
  ) {
    console.log("Sebelah Kiri");
    // tidak bisa ke kanan dan kiri
    canGoLeft = false;
  }
  if (
    currentPos.row < itemData.length &&
    currentPos.col + 1 < itemData[currentPos.row].length &&
    itemData[currentPos.row][currentPos.col + 1].isDangerous &&
    itemData[currentPos.row][currentPos.col + 1].isMoving
  ) {
    // tidak bisa ke kanan dan kiri
    console.log("Sebelah Kanan");
    canGoRight = false;
  }
  if (
    currentPos.row - 1 >= 0 &&
    currentPos.col - 1 >= 0 &&
    itemData[currentPos.row - 1][currentPos.col - 1].isDangerous &&
    itemData[currentPos.row - 1][currentPos.col - 1].isMoving
  ) {
    console.log("Sebelah Kiri Bawah");
    // tidak bisa ke atas
    canGoDown = false;
    canGoLeft = false;
  }
  if (
    currentPos.row - 1 >= 0 &&
    currentPos.col < itemData[currentPos.row - 1][currentPos.col].length &&
    itemData[currentPos.row - 1][currentPos.col].isDangerous &&
    itemData[currentPos.row - 1][currentPos.col].isMoving
  ) {
    console.log("Sebelah Bawah");
    canGoDown = false;
  }
  if (
    currentPos.row - 1 >= 0 &&
    currentPos.col + 1 < itemData[currentPos.row - 1].length &&
    itemData[currentPos.row - 1][currentPos.col + 1].isDangerous &&
    itemData[currentPos.row - 1][currentPos.col + 1].isMoving
  ) {
    // tidak bisa ke atas
    console.log("Sebelah Kanan Bawah");
    canGoDown = false;
    canGoRight = false;
  }

  if (!canGoUp || !canGoLeft || !canGoRight || !canGoDown) {
    let loggingReflex = "";
    if (canGoUp) {
      reflexOrder.row = currentPos.row + 1;
      loggingReflex = "forward";
    } else if (canGoDown) {
      reflexOrder.row = currentPos.row - 1;
      loggingReflex = "backward";
    } else if (canGoLeft) {
      reflexOrder.col = currentPos.col - 1;
      loggingReflex = "left";
    } else if (canGoRight) {
      reflexOrder.col = currentPos.col + 1;
      loggingReflex = "right";
    }
    if (loggingReflex != "") {
      console.log("Reflex Override");
      console.log(loggingReflex);
    }
  }
  return reflexOrder;
}
function make2DArray(col = 0, row = 0, defaultValue = 0) {
  var arr = [];
  for (let i = 0; i < row; i++) {
    const tempArr = new Array(col);
    for (let j = 0; j < col; j++) {
      tempArr[j] = defaultValue;
    }
    arr.push(tempArr);
  }
  return arr;
}
function chooseDestination(binaryTable = []) {
  let arrDestination = [];
  if (finalDestination.col != -1 && finalDestination.row != -1 && currentPos.row + lookAHead > finalDestination.row) {
    arrDestination.push(finalDestination);
    console.log("Found FInal destination");
    return arrDestination;
  }
  for (let i = currentPos.row + lookAHead; i > currentPos.row; i--) {
    for (let j = Math.round(binaryTable[i].length / 2); j < binaryTable[i].length; j++) {
      if (binaryTable[i][j] == 2) {
        let destination = { row: -1, col: -1 };
        destination.row = i;
        destination.col = j;
        arrDestination.unshift(destination);
      } else if (binaryTable[i][j] == 1) {
        let destination = { row: -1, col: -1 };
        destination.row = i;
        destination.col = j;
        arrDestination.push(destination);
      }
    }
    for (let j = 0; j < Math.round(binaryTable[i].length / 2); j++) {
      if (binaryTable[i][j] == 2) {
        let destination = { row: -1, col: -1 };
        destination.row = i;
        destination.col = j;
        arrDestination.unshift(destination);
      } else if (binaryTable[i][j] == 1) {
        let destination = { row: -1, col: -1 };
        destination.row = i;
        destination.col = j;
        arrDestination.push(destination);
      }
    }
  }
  return arrDestination;
}
function loggingTable(tableItems = []) {
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
        case "trajectory": {
          iconDebug = "^";
          break;
        }
        case "start": {
          iconDebug = "S";
          break;
        }
        case "end": {
          iconDebug = "F";
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
          iconDebug = "E";
          break;
        }
        case "Egg": {
          iconDebug = "G";
          break;
        }
        case "Raccoon": {
          iconDebug = "R";
          break;
        }
        default: {
          console.log("Undefined Type !!" + tableItems[i][j].label);
        }
      }
      tempStr += iconDebug;
    }
    FinaltempStr += tempStr + "\n";
  }
  FinaltempStr += "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" + "\n";
  console.log(FinaltempStr);
}
