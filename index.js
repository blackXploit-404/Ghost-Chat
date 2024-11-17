const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
    console.log(`[INFO] User connected: ${socket.id}`);

    let username = '';
    let roomId = '';
    let userColor = '';

    // Join room
    socket.on('join-room', ({ roomId: providedRoomId, username: providedUsername, userColor: providedUserColor }) => {
        // Sanitize inputs
        roomId = sanitizeInput(providedRoomId).trim();
        username = sanitizeInput(providedUsername).trim() || `Guest-${Math.floor(Math.random() * 1000)}`;
        userColor = sanitizeInput(providedUserColor);

        // Truncate username if too long
        if (username.length > 10) {
            username = `${username.slice(0, 10)}...`;
        }

        // Join the specified room
        socket.join(roomId);
        console.log(`[INFO] ${username} joined room: ${roomId}`);

        // Notify the room about the new user
        socket.to(roomId).emit('user-joined', `${username} joined the chat!`);

        // Send a welcome message to the new user
        socket.emit('receive-message', {
            sender: 'System',
            message: `Welcome, ${username}!`,
            color: 'green',
        });

        // Handle typing indicator
        socket.on('typing', ({ isTyping }) => {
            socket.to(roomId).emit('show-typing', { username, isTyping });
        });

        // Handle incoming messages
        socket.on('send-message', ({ message, color }) => {
            const sanitizedMessage = sanitizeInput(message);
            if (sanitizedMessage) {
                io.to(roomId).emit('receive-message', {
                    sender: username,
                    message: sanitizedMessage,
                    color: userColor || color,
                });
            }
        });

        // Handle user disconnection
        socket.on('disconnect', () => {
            io.to(roomId).emit('user-left', `${username} left the chat.`);
            console.log(`[INFO] ${username} disconnected.`);
        });
    });
});

// Utility function to sanitize user inputs
function sanitizeInput(input) {
    if (!input) return '';
    return String(input).replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[INFO] Server running on http://localhost:${PORT}`);
});
