const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const rooms = {};

io.on("connection", (socket) => {
    socket.on("joinRoom", (roomId) => {
        if (!rooms[roomId]) rooms[roomId] = [];
        if (rooms[roomId].length >= 2) {
            socket.emit("roomFull");
            return;
        }

        rooms[roomId].push(socket.id);
        socket.join(roomId);
        socket.emit("roomJoined", rooms[roomId].length);
        socket.to(roomId).emit("playerJoined", socket.id);
    });

    socket.on("makeMove", (data) => {
        socket.to(data.roomId).emit("opponentMove", data);
    });

    socket.on("disconnect", () => {
        for (let roomId in rooms) {
            rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
            if (rooms[roomId].length === 0) delete rooms[roomId];
        }
    });
});

http.listen(3000, () => console.log("Server running on http://localhost:3000"));
