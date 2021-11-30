let destination = { col:-1,row:-1 };
let currentPos = { col:-1,row:-1 };
let trajectoryDestination = [];
onmessage = function (e) {
  console.log("Worker Agent: Message received from main script ");
  const gameData = e.data;
  if (!gameData.statusGame) {
    postMessage("Game is Over / Not Active ");
    return;
  }
  const possibleMove = { forward: "forward", backward : "backward", left : "left", right : "right"};
  const itemData = gameData.gridItems;

  //Pemisahan Objek Berisiko
  let binaryTable = make2DArray(itemData[itemData.length-1].length,itemData.length,-1);
  //console.log(itemData);
  for (let i = 0; i <binaryTable.length; i++) {
    for (let j = 0; j <binaryTable[i].length ; j++){
      if(itemData[i][j] == undefined) {
        binaryTable[i][j] = 0;
        continue;
      }
      if(itemData[i][j].isDangerous){
        binaryTable[i][j] = 0;
        if(itemData[i][j].isMoving && (itemData[i][j].position.pParent.length) === 0){
          binaryTable = SegmentationDangerItem(binaryTable ,j,i,0);
        }
      }else if(itemData[i][j].isARoad && binaryTable[i][j]== -1 ){
        binaryTable[i][j] = 1;
        if(itemData[i][j].isAFood){
          binaryTable[i][j]  = 2;
        }
      }else {
        binaryTable[i][j] = 0;
      }
      if(itemData[i][j].isControllable){
        currentPos.row = i;
        currentPos.col = j;
        binaryTable[i][j] = 1;
      }
    }
  }
  console.log("?????????????????????????????????");
  let gridAStar = [];
  for (let i = 0; i < binaryTable.length ; i++) {
    let tempStr = "";
    let tempGrid = [];
    for (let j = 0; j < binaryTable[i].length ; j++) {
       tempStr += binaryTable[i][j];
       if(binaryTable[i][j] == 1){
         tempGrid.push({wall:false, difficulty: 1});
       }else{
         tempGrid.push({wall:true, difficulty: 1});
       }
    }
    console.log(tempStr);
    gridAStar.push(tempGrid);
  }
  console.log("?????????????????????????????????");
  loggingTable(itemData);
  //console.log(gridAStar);
    let arrDestination = chooseDestination(binaryTable);
    //Mencari Tujuan dan mencari jalan ang bisa dilalui
    for (let i = 0; i < arrDestination.length; i++) {
      const  start = [ currentPos.row, currentPos.col];
      const  end =  [ arrDestination[i].row , arrDestination[i].col];
      const aStarInstance = new AStar(start,end,gridAStar);
      aStarInstance.startAlgorithm();
      let optimalPath = aStarInstance.optimalPath;
      if(optimalPath.length > 0){
        destination.col = arrDestination[i].col;
        destination.row = arrDestination[i].row;
        for (let j = 0; j < optimalPath.length ; j++) {
          let item =  itemData[parseInt(optimalPath[j].row)][parseInt(optimalPath[j].col)];
          if(j == optimalPath.length-1){
            continue;
          }
          if(j==0){
            item.label  = "end";
            continue;
          }
          item.label = "trajectory";
        }
        trajectoryDestination = optimalPath;
        trajectoryDestination.pop();
        break;
      }
    }

  //console.log(trajectoryDestination);
  //loggingTable(itemData);
  console.log("*************************************");

  //Pengechekan Apakah Sudah di Tujuan
  const nextStep = trajectoryDestination.pop();
  let executeMessage  = "hold";
  // X = row
  // Y = col
  if(nextStep.row > currentPos.row && binaryTable[nextStep.row][currentPos.col] == 1){
    executeMessage = possibleMove.forward;
  }else if(nextStep.row < currentPos.row  && binaryTable[nextStep.row][currentPos.col] == 1){
    executeMessage = possibleMove.backward;
  }else if(nextStep.col > currentPos.col  && binaryTable[currentPos.row][nextStep.col] == 1){
    executeMessage = possibleMove.right;
  }else if(nextStep.col < currentPos.col && binaryTable[currentPos.row][currentPos.col] == 1){
    executeMessage = possibleMove.left;
  }else{
    //Generate New Path

  }
  console.log("Worker Agent: Posting message back to main script");
  postMessage(executeMessage);
};

function SegmentationDangerItem(gridBinary = [],cols=-1,rows=-1,value=-1) {
  if(gridBinary.length > rows+1 ){
    gridBinary[rows+1][cols] = value;
  }
  if( 0 <= rows-1 ){
    gridBinary[rows-1][cols] = value;
  }
  // if(gridBinary[rows].length > cols+1 ){
  //   gridBinary[rows][cols+1] = value;
  // }
  // if( 0 <= cols-1 ){
  //   gridBinary[rows][cols-1] = value;
  // }
  return gridBinary;
}
function executeOrder(){

}

function make2DArray(col=0, row=0,defaultValue=0) {
  var arr = [];
  for(let i = 0; i < row; i++) {
    const tempArr = new Array(col);
    for (let j = 0; j <col ; j++) {
      tempArr[j] = defaultValue;
    }
    arr.push(tempArr);
  }
  return arr;
}

function chooseDestination(binaryTable=[]){
  let arrDestination = [];
  for (let i =binaryTable.length-1; i > currentPos.row ; i--) {
    for (let j =binaryTable[i].length-1; j >=Math.round(binaryTable[i].length/2); j--) {
      if(binaryTable[i][j] == 1){
        let destination = {row:-1,col:-1};
        destination.row = i;
        destination.col = j;
        arrDestination.push(destination);
      }
    }
    for (let j = 0; j < Math.round(binaryTable[i].length/2) ; j++) {
      if(binaryTable[i][j] == 1){
        let destination = {row:-1,col:-1};
        destination.row = i;
        destination.col = j;
        arrDestination.push(destination);
      }
    }
  }

  return arrDestination;
}
function loggingTable(tableItems =[]){
  let FinaltempStr = "";
  FinaltempStr += "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" + "\n";
  for (let i =tableItems.length-1; i >=0 ; i--) {
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
}
// function isPartoftrajectory(position = {x:-1,y:-1}){
//   for (let i = 0; i <trajectoryDestination.length ; i++) {
//     trajectoryDestination[i].
//   }
// }
class AStar {

  constructor(start, end, grid){
    this.grid = grid
    this.matrixLenght = this.grid.length
    this.nodes =[]
    for(let i=0;i<grid.length;i++){
      for(let j=0;j<grid[0].length;j++){
        if(i==start[0] && j==start[1]){
          this.start = new NodeElement(i, j, grid[i][j].difficulty, grid[i][j].wall, this)
          this.nodes.push(this.start)
        }  else if(i==end[0] && j==end[1]){
          this.end = new NodeElement(i, j, grid[i][j].difficulty, grid[i][j].wall, this)
          this.nodes.push(this.end)
        } else {
          this.nodes.push(new NodeElement (i,j,grid[i][j].difficulty,grid[i][j].wall,this))
        }
      }
    }
    this.openQueue = [this.start]
    this.alreadyChecked = []

    this.optimalPath=[]
  }

  startAlgorithm(){
    this.openQueue[0].heuristicCalculation(this.openQueue[0])

    while(this.openQueue.length>0 ){
      if(this.openQueue[0]===this.end){
        break
      }
      let neighbours = this.openQueue[0].neighboursCalculation(this.openQueue)
      let queue = this.openQueue
      this.alreadyChecked.push(queue.shift())
      let newQueue = queue.concat(neighbours)
      let sortedNeighbours = newQueue.sort(function(a, b){return a.heuristic - b.heuristic})
      this.openQueue = sortedNeighbours
    }
    if(this.openQueue.length !== 0){this.retrieveOptimalPath(this.openQueue[0])}
  }


  retrieveOptimalPath(node){
    this.optimalPath.push(node)
    if(node.through!==this.start){
      this.retrieveOptimalPath(node.through)
    }else{
      this.optimalPath.push(this.start)
    }
  }



  eucledianDistance(node){
    return Math.sqrt(Math.pow(Math.abs(node.row-this.end.row),2)+Math.pow(Math.abs(node.col-this.end.col),2))
  }

}

class NodeElement {

  constructor(row, col, difficulty, isWall, aStarInstance){
    this.row = row
    this.col = col
    this.wall = isWall
    this.difficulty = difficulty
    this.through = ''
    this.heuristic = Infinity
    this.eucledianDistance = Infinity
    this.difficultySums = ''
    this.aStar = aStarInstance
    this.neighbours=[]
  }



  heuristicCalculation(node) {
    this.eucledianDistance = this.aStar.eucledianDistance(this)
    let difficultySums
    difficultySums = this.difficulty + Number(node.difficultySums)
    if( this.difficultySums === '' ) {
      this.difficultySums = difficultySums
      this.through=node
    }else if(this.difficultySums >  difficultySums){
      this.difficultySums = difficultySums
      this.through=node
    }else{

    }


    return this.heuristic = this.eucledianDistance + this.difficultySums
  }

  neighboursCalculation(openQueue){
    let neighbours = []
    let enqueuedNode
    let newNode

    if(this.row < this.aStar.matrixLenght-1) {
      enqueuedNode = openQueue.find(node=>node.row===this.row+1 && node.col===this.col)
      if(!enqueuedNode){
        newNode = this.aStar.nodes.find(node=>(node.row===this.row+1 && node.col===this.col))
        if(newNode.wall===false && !this.aStar.alreadyChecked.includes(newNode) && !this.aStar.openQueue.includes(newNode) ) {
          newNode.heuristicCalculation(this)
          neighbours.push(newNode)
        }
      }else{
        enqueuedNode.heuristicCalculation(this)
      }
    }
    if(this.col < this.aStar.matrixLenght-1) {
      enqueuedNode = openQueue.find(node=>node.row===this.row && node.col===this.col+1)
      if(!enqueuedNode){
        newNode = this.aStar.nodes.find(node=>(node.row===this.row && node.col===this.col+1))
        if(newNode.wall===false && !this.aStar.alreadyChecked.includes(newNode) && !this.aStar.openQueue.includes(newNode) ){
          newNode.heuristicCalculation(this)
          neighbours.push(newNode)
        }
      }else{
        enqueuedNode.heuristicCalculation(this)
      }
    }
    if(this.row > 0) {
      enqueuedNode = openQueue.find(node=>node.row===this.row-1 && node.col===this.col )
      if(!enqueuedNode){
        newNode = this.aStar.nodes.find(node=>(node.row===this.row-1 && node.col===this.col))
        if(newNode.wall===false && !this.aStar.alreadyChecked.includes(newNode) && !this.aStar.openQueue.includes(newNode) ){
          newNode.heuristicCalculation(this)
          neighbours.push(newNode)
        }
      }else{
        enqueuedNode.heuristicCalculation(this)
      }
    }
    if(this.col > 0) {
      enqueuedNode = openQueue.find(node=>node.row===this.row && node.col===this.col-1)
      if(!enqueuedNode){
        newNode = this.aStar.nodes.find(node=>(node.row===this.row && node.col===this.col-1))
        if(newNode.wall===false && !this.aStar.alreadyChecked.includes(newNode) && !this.aStar.openQueue.includes(newNode) ){
          newNode.heuristicCalculation(this)
          neighbours.push(newNode)
        }
      }else{
        enqueuedNode.heuristicCalculation(this)
      }
    }
    return neighbours

  }




}


