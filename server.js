const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// 設定 session
app.use(session({
    secret: "gomoku-secret",
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("users.db");

// 建立 users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);

// 登入頁
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// 登入
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (!row) return res.send("使用者不存在");
        if (row.password !== password) return res.send("密碼錯誤");
        req.session.user = username;
        res.redirect("/game.html");
    });
});

// 註冊
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err) => {
        if (err) return res.send("使用者已存在");
        res.redirect("/");
    });
});

// ---------------- Socket.io ----------------
const rooms = {}; // roomId -> { board, turn, players }

io.on("connection", (socket) => {
    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);
        if (!rooms[roomId]) {
            rooms[roomId] = { board: Array(15).fill(null).map(() => Array(15).fill(null)), turn: "black", players: [] };
        }
        if (rooms[roomId].players.length < 2) {
            const color = rooms[roomId].players.length === 0 ? "black" : "white";
            rooms[roomId].players.push({ id: socket.id, color });
            socket.emit("assignColor", color);
            socket.emit("boardUpdate", rooms[roomId].board);
            io.to(roomId).emit("turn", rooms[roomId].turn);
        } else {
            socket.emit("full", "房間已滿");
        }
    });

    socket.on("makeMove", ({ roomId, x, y }) => {
        const room = rooms[roomId];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;
        if (room.turn !== player.color) return;
        if (room.board[y][x]) return;

        room.board[y][x] = player.color;
        io.to(roomId).emit("boardUpdate", room.board);
        io.to(roomId).emit("moveSound");

        // 檢查勝負
        if (checkWin(room.board, x, y, player.color)) {
            io.to(roomId).emit("gameOver", player.color);
        } else {
            room.turn = room.turn === "black" ? "white" : "black";
            io.to(roomId).emit("turn", room.turn);
        }
    });
});

function checkWin(board, x, y, color) {
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (let [dx,dy] of dirs) {
        let count = 1;
        for (let d=1; d<=4; d++) {
            const nx = x + dx*d, ny = y + dy*d;
            if (board[ny] && board[ny][nx] === color) count++;
            else break;
        }
        for (let d=1; d<=4; d++) {
            const nx = x - dx*d, ny = y - dy*d;
            if (board[ny] && board[ny][nx] === color) count++;
            else break;
        }
        if (count >= 5) return true;
    }
    return false;
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
