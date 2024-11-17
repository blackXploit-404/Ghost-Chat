const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Serve static files

// Handle socket connections
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    let username = '';
    let roomId = '';
    let userColor = '';

    // Join room
    socket.on('join-room', ({ roomId: providedRoomId, username: providedUsername, userColor: providedUserColor }) => {
        roomId = providedRoomId.trim();
        username = providedUsername.trim() || `Guest-${Math.floor(Math.random() * 1000)}`;
        userColor = providedUserColor;

        // Join the room
        socket.join(roomId);
        console.log(`User ${username} joined room: ${roomId}`);

        // Send user color and join message to the room
        socket.to(roomId).emit('user-joined', `${username} joined the chat!`);

        // Broadcast user joined message to the sender
        socket.emit('receive-message', {
            sender: 'System',
            message: `Welcome, ${username}!`,
            color: 'green',
            isSender: true
        });

        // Handle typing indicator
        socket.on('typing', ({ isTyping }) => {
            socket.to(roomId).emit('show-typing', { username, isTyping });
        });

        // Handle incoming messages
        socket.on('send-message', ({ message, color }) => {
            const sanitizedMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;'); // Sanitize message input
            io.to(roomId).emit('receive-message', { sender: username, message: sanitizedMessage, color, isSender: true });
        });

        // Handle user disconnection
        socket.on('disconnect', () => {
            io.to(roomId).emit('user-left', `${username} left the chat.`);
            console.log(`User ${username} disconnected.`);
        });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
