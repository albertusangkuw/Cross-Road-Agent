setInterval(() => {
    searchChickenGreedy();
}, stepBot);
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
            } else if (tableItemsGlobal[i][j].isARoad && !tableItemsGlobal[i][j].isDangerous) {
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
    for (let i = 0; i < raccoon.length; i++) {
        let sumber = { col: raccoonColumn[i], row: raccoonLane[i] };
        if (sumber.col < 0 || sumber.col >= columns) {
            continue;
        }
        matrixRoad[sumber.row][sumber.col] = "R";
        const choice = getBorderValue(matrixRoad, { row: sumber.row, col: sumber.col },{ row: target.row, col: target.col });
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
function getBorderValue(array = [[]], idx = { row: -1, col: -1 },target) {
    const borderVal = { top: 0, bottom: 0, left: 0, right: 0 };
    if(idx.row + 1 == target.row && idx.col == target.col){
        borderVal.bottom = 1;
        return  borderVal;
    }
    if(idx.row - 1 == target.row && idx.col == target.col){
        borderVal.top = 1;
        return  borderVal;
    }
    if(idx.row == target.row && idx.col+1 == target.col){
        borderVal.right = 1;
        return  borderVal;
    }
    if(idx.row == target.row && idx.col-1 == target.col){
        borderVal.left = 1;
        return  borderVal;
    }
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
    let minimumVal = 99;
    for (const property in borderVal) {
        if(borderVal[property] != 0 && borderVal[property] < minimumVal){
            variabelMin = property;
            minimumVal = borderVal[property];
        }
    }
    return variabelMin;
}
