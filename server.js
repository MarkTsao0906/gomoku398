const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));
app.use(express.json());

let users = {}; // username -> password
let rooms = {}; // roomId -> { players: [], board, turn, lastMove, gameOver }

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, msg: "缺少帳號或密碼" });
  if (users[username]) return res.json({ success: false, msg: "帳號已存在" });
  users[username] = password;
  return res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, msg: "缺少帳號或密碼" });
  if (users[username] !== password) return res.json({ success: false, msg: "帳號或密碼錯誤" });
  return res.json({ success: true });
});

io.on("connection", (socket) => {
  console.log("新連線:", socket.id);

  socket.on("joinRoom", ({ roomId, username }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        board: Array.from({ length: 15 }, () => Array(15).fill(null)),
        turn: "black",
        lastMove: null,
        gameOver: false,
      };
    }
    const room = rooms[roomId];
    if (room.players.length >= 2) {
      socket.emit("roomFull");
      return;
    }
    room.players.push({ id: socket.id, username });
    socket.join(roomId);

    const color = room.players.length === 1 ? "black" : "white";
    socket.emit("assignColor", { color });

    io.to(roomId).emit("syncBoard", {
      board: room.board,
      currentTurn: room.turn,
      lastMove: room.lastMove,
    });
  });

  socket.on("move", ({ roomId, r, c, color }) => {
    const room = rooms[roomId];
    if (!room || room.gameOver) return;
    if (room.board[r][c]) return;
    if (color !== room.turn) return;

    room.board[r][c] = color;
    room.lastMove = { r, c };
    room.turn = color === "black" ? "white" : "black";

    io.to(roomId).emit("move", { r, c, color, lastMove: room.lastMove });

    if (checkWin(room.board, r, c, color)) {
      room.gameOver = true;
      io.to(roomId).emit("gameOver", color);
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      room.players = room.players.filter((p) => p.id !== socket.id);
      if (room.players.length === 0) delete rooms[roomId];
    }
  });
});

function checkWin(board, r, c, color) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dx,dy] of dirs) {
    let count = 1;
    for (let sign of [1,-1]) {
      let x=c+dx*sign, y=r+dy*sign;
      while (board[y] && board[y][x]===color){ count++; x+=dx*sign; y+=dy*sign; }
    }
    if(count>=5) return true;
  }
  return false;
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
