const gameContainer = document.getElementById('game');
const statusDisplay = document.getElementById('status');
let gameState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = 'X';
let gameActive = true;
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener('open', () => {
    console.log('WebSocket connection opened');
});

socket.addEventListener('message', event => {
    console.log('WebSocket message received:', event.data);
    const data = JSON.parse(event.data);
    gameState = data.gameState;
    currentPlayer = data.currentPlayer;
    updateBoard();
    statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
    gameActive = true;
});

socket.addEventListener('error', error => {
    console.error('WebSocket error:', error);
});

socket.addEventListener('close', () => {
    console.log('WebSocket connection closed');
});

function fetchGameState() {
    fetch('/game-state')
        .then(response => response.json())
        .then(data => {
            gameState = data.gameState;
            currentPlayer = data.currentPlayer;
            updateBoard();
            statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
        })
        .catch(error => {
            console.error('Error fetching game state:', error);
            statusDisplay.textContent = 'Error loading game state';
        });
}

function updateBoard() {
    gameContainer.innerHTML = '';
    gameState.forEach((cellValue, index) => {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.textContent = cellValue;
        cell.addEventListener('click', () => handleCellClick(index));
        gameContainer.appendChild(cell);
    });
}

function handleCellClick(index) {
    if (gameState[index] !== "" || !gameActive) {
        return;
    }

    gameState[index] = currentPlayer;
    updateBoard();
    checkResult();
    updateGameStateOnServer();
}

function checkResult() {
    let roundWon = false;

    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        let b = gameState[winCondition[1]];
        let c = gameState[winCondition[2]];

        if (a === "" || b === "" || c === "") {
            continue;
        }

        if (a === b && b === c) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusDisplay.textContent = `Player ${currentPlayer} wins!`;
        gameActive = false;
        return;
    }

    let roundDraw = !gameState.includes("");
    if (roundDraw) {
        statusDisplay.textContent = "Game ended in a draw!";
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
}

function updateGameStateOnServer() {
    const data = {
        gameState: gameState,
        currentPlayer: currentPlayer
    };

    fetch('/update-state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(message => {
        console.log(message);
    })
    .catch(error => {
        console.error('Error updating game state:', error);
    });
}

document.getElementById('resetButton').addEventListener('click', () => {
    fetch('/reset-game', {
        method: 'POST'
    })
    .then(response => response.text())
    .then(message => {
        console.log(message);
        fetchGameState();
    })
    .catch(error => {
        console.error('Error resetting game state:', error);
    });
});

function initializeGame() {
    fetchGameState();
}

initializeGame();
