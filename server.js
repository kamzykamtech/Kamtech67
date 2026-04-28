const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));
let rooms = {};

io.on('connection', (socket) => {
    socket.on('create-room', () => {
        const roomId = Math.floor(100000 + Math.random() * 900000).toString();
        rooms[roomId] = { host: socket.id, players: [socket.id], usedCards: [] };
        socket.join(roomId);
        socket.emit('room-created', roomId);
    });

    socket.on('join-room', (roomId) => {
        if (rooms[roomId]) {
            rooms[roomId].players.push(socket.id);
            socket.join(roomId);
            io.to(roomId).emit('game-start', rooms[roomId].usedCards);
        }
    });

    socket.on('select-mode', (data) => {
        io.to(data.roomId).emit('mode-set', data.mode);
    });

    socket.on('flip-card', (data) => {
        if (rooms[data.roomId]) {
            rooms[data.roomId].usedCards.push(data.index);
            io.to(data.roomId).emit('card-flipped', data);
        }
    });

    socket.on('send-reply', (data) => {
        io.to(data.roomId).emit('receive-reply', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server Live'));
