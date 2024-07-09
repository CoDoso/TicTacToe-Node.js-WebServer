const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const port = 3000;
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const gameFilePath = path.join(__dirname, 'gameState.json');

// Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON bodies
app.use(express.json());

// Get the current game state
app.get('/game-state', (req, res) => {
    fs.readFile(gameFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading game state:', err);
            res.status(500).send('Error reading game state');
            return;
        }
        res.send(data);
    });
});

// Update the game state
app.post('/update-state', (req, res) => {
    const gameState = req.body;
    
    if (!gameState || !gameState.gameState || !gameState.currentPlayer) {
        console.error('Invalid game state received:', gameState);
        res.status(400).send('Invalid game state');
        return;
    }

    fs.writeFile(gameFilePath, JSON.stringify(gameState), (err) => {
        if (err) {
            console.error('Error updating game state:', err);
            res.status(500).send('Error updating game state');
            return;
        }
        broadcastGameState(gameState);
        res.send('Game state updated');
    });
});

// Reset the game state
app.post('/reset-game', (req, res) => {
    const initialState = {
        gameState: ["", "", "", "", "", "", "", "", ""],
        currentPlayer: "X"
    };

    fs.writeFile(gameFilePath, JSON.stringify(initialState), (err) => {
        if (err) {
            console.error('Error resetting game state:', err);
            res.status(500).send('Error resetting game state');
            return;
        }
        broadcastGameState(initialState);
        res.send('Game state reset');
    });
});

// Broadcast game state to all connected WebSocket clients
function broadcastGameState(gameState) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(gameState));
        }
    });
}

wss.on('connection', socket => {
    console.log('New WebSocket connection');

    // Send the current game state to the new connection
    fs.readFile(gameFilePath, 'utf8', (err, data) => {
        if (!err) {
            socket.send(data);
        } else {
            console.error('Error reading game state for new connection:', err);
        }
    });

    socket.on('message', message => {
        console.log('Received:', message);
        // Handle incoming messages if needed
    });

    socket.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
