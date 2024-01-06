// Game Configuration and GUI
let gui = new dat.GUI();
let gameConfig = {
    gridSize: 4,
    playerType: "human", // or "ai"
    displayType: "canvas", // or "canvas"
    resetGame: function() {
        initializeGame();
    },
    AIwaitMS: 100,
};
gameConfig.displayLogValue = false; // By default, show the original value

gameConfig.heuristicWeights = {
    wDelta: 1,
    wNEC: 30,
    wHEC: 500,
    wLCC: 500,
    wSMO: 50,
    wNWall: 500,
    wSMNL: 500,
};


let RUN = true;

const sleep = ms => new Promise(r => setTimeout(r, ms));



gui.add(gameConfig, 'gridSize', 4, 8).step(1).onChange(initializeGame);
gui.add(gameConfig, 'displayType', ['text', 'canvas']).onChange(updateDisplayType);
gui.add(gameConfig, 'displayLogValue').name('Show log2 Value').onChange(drawGrid);
gui.add(gameConfig, 'playerType', ['human', 'ai_diff','ai_heur']).onChange(updateAIparams);
gui.add(gameConfig, 'AIwaitMS', 1,10000);

gui.add(gameConfig, 'resetGame');


function clearGuiFolder(folder) {
    // Loop backwards since we'll be removing controllers
    for (let i = folder.__controllers.length - 1; i >= 0; i--) {
        folder.remove(folder.__controllers[i]);
    }

    // If the folder contains sub-folders, recursively clear them as well
    for (let i = folder.__folders.length - 1; i >= 0; i--) {
        clearGuiFolder(folder.__folders[i]);
    }
}


let aiParamsFolder = gui.addFolder('AI Params');


function updateAIparams(){
    clearGuiFolder(aiParamsFolder);
    if (gameConfig.playerType.includes('heur')) {
        aiParamsFolder.add(gameConfig.heuristicWeights, 'wDelta', 0, 1000);
        aiParamsFolder.add(gameConfig.heuristicWeights, 'wNEC', 0, 1000);
        aiParamsFolder.add(gameConfig.heuristicWeights, 'wHEC', 0, 1000);
        aiParamsFolder.add(gameConfig.heuristicWeights, 'wLCC', 0, 1000);
        aiParamsFolder.add(gameConfig.heuristicWeights, 'wSMO', 0, 1000);
        aiParamsFolder.add(gameConfig.heuristicWeights, 'wNWall', 0, 1000);
        aiParamsFolder.add(gameConfig.heuristicWeights, 'wSMNL', 0, 1000);
    }
    else{
        1+1;
    }

    if (gameConfig.playerType.includes('ai')) {
        aiParamsFolder.open();
    } else {
        aiParamsFolder.close();
    }

}

updateAIparams();



function getColorForValue(value) {
    switch (value) {
        case 2:    return '#eee4da';
        case 4:    return '#ede0c8';
        case 8:    return '#f2b179';
        case 16:   return '#f59563';
        case 32:   return '#f67c5f';
        case 64:   return '#f65e3b';
        case 128:  return '#edcf72';
        case 256:  return '#edcc61';
        case 512:  return '#edc850';
        case 1024: return '#edc53f';
        case 2048: return '#edc22e';
        default:   return '#cdc1b4';
    }
}


// Canvas Setup
let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

// Initialize or Reset Game
function initializeGame() {
    grid = [];
    for (let i = 0; i < gameConfig.gridSize; i++) {
        grid[i] = [];
        for (let j = 0; j < gameConfig.gridSize; j++) {
            grid[i][j] = 0;
        }
    }
    addNewTile();
    addNewTile();
    updateDisplayType(); // Update and draw the grid based on the current display type
    RUN = true;
}

// Ensure correct display based on display type
function updateDisplayType() {
    canvas.style.display = (gameConfig.displayType === 'canvas') ? 'block' : 'none';
    textCanvas.style.display = (gameConfig.displayType === 'text') ? 'block' : 'none';
    drawGrid();
}

// Update and redraw grid
function drawGrid() {
    if (gameConfig.displayType === 'canvas') {
        redrawCanvas();
    } else {
        redrawText();
    }
}

function redrawCanvas() {
    let cellSize = canvas.width / gameConfig.gridSize;
    let cellPadding = 5;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < gameConfig.gridSize; i++) {
        for (let j = 0; j < gameConfig.gridSize; j++) {
            drawCell(i, j, cellSize, cellPadding);
        }
    }
}

function redrawText() {
    let maxValue = Math.max(...grid.flat());
    let displayValue = gameConfig.displayLogValue ? Math.floor(Math.log2(maxValue)) : maxValue;
    let maxDigits = displayValue.toString().length;

    textCanvas.innerHTML = grid.map(row => 
        row.map(value => {
            let displayValue = value === 0 ? 0 : (gameConfig.displayLogValue ? Math.floor(Math.log2(value)) : value);
            return String(displayValue).padStart(maxDigits, '0');
        }).join(' ')
    ).join('\n');
}

function drawCell(row, col, cellSize, cellPadding) {
    let value = grid[row][col];
    let displayValue = value === 0 ? '' : (gameConfig.displayLogValue ? Math.floor(Math.log2(value)) : value);

    ctx.fillStyle = value ? getColorForValue(value) : '#eee';
    ctx.fillRect(col * cellSize + cellPadding, row * cellSize + cellPadding, cellSize - 2 * cellPadding, cellSize - 2 * cellPadding);

    if (displayValue) {
        ctx.fillStyle = '#000';
        ctx.font = `${cellSize / 3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayValue, col * cellSize + cellSize / 2, row * cellSize + cellSize / 2);
    }
}

// Add a new tile in a random position
function addNewTile() {
    let emptyCells = [];
    for (let i = 0; i < gameConfig.gridSize; i++) {
        for (let j = 0; j < gameConfig.gridSize; j++) {
            if (!grid[i][j]) {
                emptyCells.push([i, j]);
            }
        }
    }

    if (emptyCells.length) {
        let [x, y] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[x][y] = Math.random() < 0.9 ? 2 : 4;
    }
}

function compress(grid) {
    return grid.map(row => {
        let newRow = row.filter(val => val !== 0); // Remove zeros
        while (newRow.length < gameConfig.gridSize) {
            newRow.push(0); // Add zeros to the end
        }
        return newRow;
    });
}

function merge(grid) {
    return grid.map(row => {
        for (let i = 0; i < row.length - 1; i++) {
            if (row[i] === row[i + 1]) {
                row[i] *= 2;
                row[i + 1] = 0;
            }
        }
        return row;
    });
}

function reverse(grid) {
    return grid.map(row => row.slice().reverse());
}

function transpose(grid) {
    let newGrid = [];
    for (let i = 0; i < grid.length; i++) {
        newGrid.push([]);
        for (let j = 0; j < grid.length; j++) {
            newGrid[i][j] = grid[j][i];
        }
    }
    return newGrid;
}

function updateGrid(grid, move) {
    let newGrid;
    switch (move) {
        case 'up':
            newGrid = transpose(grid);
            newGrid = compress(newGrid);
            newGrid = merge(newGrid);
            newGrid = compress(newGrid);
            newGrid = transpose(newGrid);
            break;
        case 'down':
            newGrid = transpose(grid);
            newGrid = reverse(newGrid);
            newGrid = compress(newGrid);
            newGrid = merge(newGrid);
            grid = compress(newGrid);
            newGrid = reverse(newGrid);
            newGrid = transpose(newGrid);
            break;
        case 'left':
            newGrid = compress(grid);
            newGrid = merge(newGrid);
            newGrid = compress(newGrid);
            break;
        case 'right':
            newGrid = reverse(grid);
            newGrid = compress(newGrid);
            newGrid = merge(newGrid);
            newGrid = compress(newGrid);
            newGrid = reverse(newGrid);
            break;
        default:
            newGrid = grid;
    }
    return newGrid;
}

function mergeRow(row) {
    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
            row[i] *= 2;
            row[i + 1] = 0;
        }
    }
    return row.filter(val => val !== 0); // Remove zeros
}

// Check if the game is over
function isGameOver() {
    for (let i = 0; i < gameConfig.gridSize; i++) {
        for (let j = 0; j < gameConfig.gridSize; j++) {
            if (grid[i][j] === 0) {
                return false; // Empty cell found
            }
            // Check for merges in all directions
            if (i !== gameConfig.gridSize - 1 && grid[i][j] === grid[i + 1][j]) {
                return false; // Merge down possible
            }
            if (i !== 0 && grid[i][j] === grid[i - 1][j]) {
                return false; // Merge up possible
            }
            if (j !== gameConfig.gridSize - 1 && grid[i][j] === grid[i][j + 1]) {
                return false; // Merge right possible
            }
            if (j !== 0 && grid[i][j] === grid[i][j - 1]) {
                return false; // Merge left possible
            }
        }
    }
    console.log("Game Over!");
    console.log(grid);
    return true; // No moves left
}

// AI move logic
function aiMove() {
    if (gameConfig.playerType.includes('heur')) {
        fun=heuristicScore;
    }
    else{
        fun=simulateMoveAndScore;
    }

    let bestMove = simulateBestMove(fun);
    if (bestMove) {
        grid=updateGrid(grid,bestMove);
    }
}

function simulateBestMove(fun) {
    let moves = ['left', 'right', 'up', 'down'];
    let bestScore = -1;
    let bestMove = null;

    moves.forEach(move => {
        let [score, newGrid] = fun(grid, move);
        if(JSON.stringify(newGrid) == JSON.stringify(grid)){
            score = -Infinity;
        }
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    });

    console.log(bestMove, bestScore);


    return bestMove;
}

function simulateMoveAndScore(grid, move) {
    let tempGrid = JSON.parse(JSON.stringify(grid)); // Deep copy
    tempGrid = updateGrid(tempGrid, move);
    let score = calculateScore(grid, tempGrid);
    return [score, tempGrid];
}

function calculateScore(oldGrid, newGrid) {
    // Calculate score based on the difference of tiles between oldGrid and newGrid
    let score = 0;
    for (let i = 0; i < gameConfig.gridSize; i++) {
        for (let j = 0; j < gameConfig.gridSize; j++) {
            if (newGrid[i][j] !== oldGrid[i][j]) {
                score += newGrid[i][j] - oldGrid[i][j];
            }
        }
    }
    return score;
}

// Heuristic

function heuristicScore(grid, move) {
    let { DEL, NEC, HEC, LCC, SMO,NWall,SMNL,tempGrid} = calculateHeuristicFactors(grid, move);

    // Default weights (can be adjusted via dat.GUI)
    let weights = gameConfig.heuristicWeights;
    
    return [weights.wDelta * DEL + weights.wNEC * NEC + weights.wHEC * HEC + weights.wLCC * LCC + weights.wSMO * SMO + weights.wNWall*NWall+weights.wSMNL*SMNL,tempGrid];
}

function calculateHeuristicFactors(grid, move) {
    let newGrid = updateGrid(JSON.parse(JSON.stringify(grid)), move);
    let DEL = calculateScore(grid, newGrid); // Calculate delta
    let NEC = newGrid.flat().filter(cell => cell === 0).length; // Number of Empty Cells
    let HEC = NEC > 0 ? 1 : 0; // Has Empty Cells
    let LCC = isLargestCellAtCorner(newGrid); // Largest Cell at Corner
    let SMO = calculateSmoothness(newGrid); // Smoothness
    let NWall = largestNWallTouch(newGrid);//areNLargestCellsTouchingWall(newGrid, (gameConfig.gridSize/2>>0)); // N Largest Cells Touching Wall
    let SMNL = largestNSmooth(newGrid);//calculateSmoothnessNLargest(grid, (gameConfig.gridSize/2>>0));
    return { DEL, NEC, HEC, LCC, SMO,NWall,SMNL,tempGrid:newGrid};
}

function isLargestCellAtCorner(grid) {
    let maxVal = Math.max(...grid.flat());
    // Check corners for maxVal
    let gridSize = grid.length;
    return grid[0][0] === maxVal || grid[0][gridSize - 1] === maxVal ||
           grid[gridSize - 1][0] === maxVal || grid[gridSize - 1][gridSize - 1] === maxVal;
}

function calculateSmoothness(grid) {
    let smoothness = 0;
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length - 1; j++) {
            if (grid[i][j] !== 0 && grid[i][j] === grid[i][j + 1]) {
                smoothness++;
            }
            if (grid[j][i] !== 0 && grid[j][i] === grid[j + 1][i]) {
                smoothness++;
            }
        }
    }
    return smoothness;
}

function areNLargestCellsTouchingWall(grid, N) {
    // Flatten the grid and sort it to find the N largest values
    let flattenedGrid = grid.flat();
    let sortedCells = flattenedGrid.slice().sort((a, b) => b - a);
    let largestValues = sortedCells.slice(0, N);

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (largestValues.includes(grid[row][col])) {
                // Check if this cell is touching a wall
                if (row === 0 || row === grid.length - 1 || col === 0 || col === grid[row].length - 1) {
                    // Remove the value from largestValues as it's touching a wall
                    largestValues.splice(largestValues.indexOf(grid[row][col]), 1);
                }
            }
        }
    }

    // If largestValues is empty, all N largest cells are touching a wall
    return largestValues.length === 0;
}

function calculateSmoothnessNLargest(grid, N) {
    let flattenedGrid = grid.flat();
    let sortedCells = [...new Set(flattenedGrid)].sort((a, b) => b - a);
    let largestValues = sortedCells.slice(0, N);
    let smoothness = 0;

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (largestValues.includes(grid[row][col])) {
                // Check adjacent cells
                if (row > 0) smoothness += Math.abs(grid[row][col] - grid[row - 1][col]); // Cell above
                if (row < grid.length - 1) smoothness += Math.abs(grid[row][col] - grid[row + 1][col]); // Cell below
                if (col > 0) smoothness += Math.abs(grid[row][col] - grid[row][col - 1]); // Cell to the left
                if (col < grid[row].length - 1) smoothness += Math.abs(grid[row][col] - grid[row][col + 1]); // Cell to the right
            }
        }
    }

    return smoothness;
}

function largestNSmooth(grid) {
    let N = 1;
    let maxN = grid.length * grid[0].length;
    let currentSmoothness = calculateSmoothnessNLargest(grid, N);
    //let someSmoothnessThreshold
    while (N <= maxN){ // && currentSmoothness <= someSmoothnessThreshold) {
        N++;
        currentSmoothness = calculateSmoothnessNLargest(grid, N);
    }

    return N - 1; // Return the last N that met the condition
}

function largestNWallTouch(grid) {
    let N = 1;
    let maxN = grid.length * grid[0].length;
    let touchingWall = areNLargestCellsTouchingWall(grid, N);

    while (N <= maxN && touchingWall) {
        N++;
        touchingWall = areNLargestCellsTouchingWall(grid, N);
    }

    return N - 1; // Return the last N that met the condition
}



// Handle keyboard events for human player
document.addEventListener('keydown', (event) => {
    if(gameConfig.playerType === "human") {
        let moved = false;
        let gridCopy = JSON.parse(JSON.stringify(grid)); // Make a deep copy of the grid for comparison

        if (event.code === 'ArrowLeft') {
            grid = updateGrid(grid, 'left');
        } else if (event.code === 'ArrowRight') {
            grid = updateGrid(grid, 'right');
        } else if (event.code === 'ArrowUp') {
            grid = updateGrid(grid, 'up');
        } else if (event.code === 'ArrowDown') {
            grid = updateGrid(grid, 'down');
        }

        moved = JSON.stringify(grid) !== JSON.stringify(gridCopy); // Check if the grid has changed

        if (moved) {
            addNewTile();
            if (isGameOver()) {
                RUN = false;
            }
            drawGrid();
        }
    }
});

// Initialize the game
initializeGame();

// Game loop
async function gameLoop() {
    
    if(gameConfig.playerType.includes("ai") && RUN) {
        aiMove();
        addNewTile();
        await sleep(gameConfig.AIwaitMS);
    }
    drawGrid();
    if (isGameOver()) {
        RUN = false;
    }
    requestAnimationFrame(gameLoop);
}

gameLoop(); // Start the game loop
