let arrGrid = [
  [1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, "F", 1, 1, 1, 1, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
let target = { row: 1, col: 4 };
let dtarget = { row: 4, col: 8 };

for (let i = 0; i < arrGrid.length; i++) {
  for (let j = 0; j < arrGrid[i].length; j++) {
    if (arrGrid[i][j] == 1) {
      const row = target.row - i;
      const col = target.col - j;
      arrGrid[i][j] = Math.floor(Math.sqrt(row * row + col * col));
    }
  }
}


for (let i = 0; i < arrGrid.length; i++) {
  let tempStr = "";
  for (let j = 0; j < arrGrid[i].length; j++) {
    tempStr += arrGrid[i][j];
  }
  console.log(tempStr);
}
