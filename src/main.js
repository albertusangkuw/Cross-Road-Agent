if (window.Worker) {
  const worker = new Worker("./src/worker.js");
  setInterval(function () {
    if (gameOver == true ||isAI == false ) {
      return;
    }
    sendDataToWorkerAgent(worker);
  }, 600);
  getDataFromWorkerAgent(worker);
} else {
  alert("Your browser doesn't support web workers.  Agent will not working  ! ");
}
function sendDataToWorkerAgent(worker) {
  worker.postMessage(apiGameEngine(lanes));
  console.log("Message posted to worker");
}
function getDataFromWorkerAgent(worker) {
  worker.onmessage = function (e) {
    console.log(e.data);
    const command = e.data;
    console.log("Message received from worker");
    if (typeof command === "string" || command instanceof String) {
      if (command != "hold") {
        move(command);
      }
    }
  };
}
