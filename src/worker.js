onmessage = function (e) {
  console.log("Worker Agent: Message received from main script ");
  const gameData = e.data;
  if (!gameData.statusGame) {
    postMessage("Game is Over / Not Active ");
    return;
  }
  const possibleMove = [ "forward","backward","left","right"];
  const itemData = gameData.gridItems;
  //Pemisahan Objek Berisiko
  for (let i = 0; i <itemData.length; i++) {
    for (let j = 0; j <itemData[i].length; j++)
      if(itemData[i][j] == undefined) {
        continue;
      }
      console.log(itemData[i][j].isDangerous);
      if(itemData[i][j].isDangerous && itemData[i][j].isMoving){

      }
    }
  }

  console.log("Worker Agent: Posting message back to main script");
  //postMessage(gameData.gridItems);
};
