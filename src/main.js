if (window.Worker) {
  const worker = new Worker("./src/worker.js" );

  setInterval(function () {
      if(gameOver == true){
        return;
      }
      sendDataToWorkerAgent(worker)
  }, 600);

  getDataToWorkerAgent(worker);
} else {
  alert("Your browser doesn't support web workers.  Agent will not working  ! ");
}

function sendDataToWorkerAgent(worker) {
  worker.postMessage(apiGameEngine(lanes));
  console.log('Message posted to worker');
}

function getDataToWorkerAgent(worker) {
  worker.onmessage = function(e) {
    console.log(e.data);
    const command = e.data;
    if (typeof command === 'string' || command instanceof String){
      move(command);
    }
    console.log('Message received from worker');
  }
}
