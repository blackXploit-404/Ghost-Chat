const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://ghost-chat-73qc.onrender.com", // Update with your frontend URL
        methods: ["GET", "POST"]
    },
    pingInterval: 25000,
    pingTimeout: 5000,
});

app.use(cors());
app.use(express.static('public')); // Serve static files

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', ({ roomId, username, userColor }) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', `${username} joined the room.`);
        console.log(`${username} joined room ${roomId}`);
    });

    socket.on('send-message', ({ message, color }) => {
        const roomId = Array.from(socket.rooms)[1]; // Get the room ID
        const sender = socket.id; // Or use a username if available
        io.to(roomId).emit('receive-message', { sender, message, color });
    });

    socket.on('typing', ({ isTyping }) => {
        const roomId = Array.from(socket.rooms)[1];
        const username = socket.id; // Or use a username if available
        socket.to(roomId).emit('show-typing', { username, isTyping });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
