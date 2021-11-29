onmessage = function (e) {
  console.log("Worker Agent: Message received from main script ");
  const gameData = e.data;
  if (!gameData.statusGame) {
    postMessage("Game is Over / Not Active ");
    return;
  }
  console.log("Worker: Posting message back to main script");
  postMessage(gameData.gridItems);
};
