const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let rooms = {};

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    if (rooms[roomId].length > 2) {
      socket.emit("roomFull");
      socket.leave(roomId);
    } else {
      socket.emit("roomJoined", rooms[roomId].length);
    }
  });

  socket.on("makeMove", ({ roomId, x, y, player }) => {
    io.to(roomId).emit("moveMade", { x, y, player });
  });

  socket.on("disconnect", () => {
    for (let room in rooms) {
      rooms[room] = rooms[room].filter((id) => id !== socket.id);
      if (rooms[room].length === 0) delete rooms[room];
    }
    console.log("user disconnected");
  });
});

http.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
