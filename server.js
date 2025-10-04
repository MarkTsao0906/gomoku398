const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("一位玩家連線");

    socket.on("joinRoom", (room) => {
        socket.join(room);
        socket.room = room;
        console.log(`玩家加入房間: ${room}`);
        socket.emit("joinedRoom", room);
    });

    socket.on("placePiece", (data) => {
        // 廣播給同房間的其他玩家
        socket.to(socket.room).emit("opponentMove", data);
    });

    socket.on("disconnect", () => {
        console.log("一位玩家離線");
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`伺服器運行在 http://localhost:${PORT}`);
});
