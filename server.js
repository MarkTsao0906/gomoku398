// server.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 8080;

// --- Middleware ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// --- SQLite DB ---
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to SQLite DB.');
});

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`);

// --- Routes ---
// 註冊
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.run('INSERT INTO users(username, password) VALUES(?, ?)', [username, password], function(err) {
        if (err) return res.json({ success: false, message: '帳號已存在' });
        res.json({ success: true });
    });
});

// 登入
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username=? AND password=?', [username, password], (err, row) => {
        if (err) return res.json({ success: false });
        if (row) {
            req.session.user = username;
            res.json({ success: true });
        } else {
            res.json({ success: false, message: '帳號或密碼錯誤' });
        }
    });
});

// --- Socket.io 連線 ---
const rooms = {}; // 儲存房間棋局

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinRoom', (roomId) => {
        if (!roomId) return;
        socket.join(roomId);

        // 初始化房間棋盤
        if (!rooms[roomId]) {
            rooms[roomId] = {
                board: Array(15).fill(null).map(() => Array(15).fill(null)),
                turn: 'black',
                players: []
            };
        }

        // 分配顏色
        if (rooms[roomId].players.length < 2) {
            const color = rooms[roomId].players.length === 0 ? 'black' : 'white';
            rooms[roomId].players.push({ id: socket.id, color });
            socket.emit('color', color);
            socket.emit('boardUpdate', rooms[roomId].board);
        } else {
            socket.emit('full', true);
        }
    });

    socket.on('placePiece', ({ roomId, x, y }) => {
        const room = rooms[roomId];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        if (room.turn !== player.color) return;

        if (!room.board[y][x]) {
            room.board[y][x] = player.color;
            room.turn = room.turn === 'black' ? 'white' : 'black';
            io.to(roomId).emit('boardUpdate', room.board);
            io.to(roomId).emit('moveSound');

            // 判定勝利
            if (checkWin(room.board, x, y, player.color)) {
                io.to(roomId).emit('gameOver', player.color);
            }
        }
    });

    socket.on('disconnect', () => {
        for (let roomId in rooms) {
            rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
            if (rooms[roomId].players.length === 0) delete rooms[roomId];
        }
        console.log('Client disconnected');
    });
});

// --- 勝負判定函數 ---
function checkWin(board, x, y, color) {
    const directions = [
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 }
    ];

    for (let { dx, dy } of directions) {
        let count = 1;
        // 正向
        for (let i = 1; i < 5; i++) {
            const nx = x + dx * i;
            const ny = y + dy * i;
            if (board[ny] && board[ny][nx] === color) count++;
            else break;
        }
        // 反向
        for (let i = 1; i < 5; i++) {
            const nx = x - dx * i;
            const ny = y - dy * i;
            if (board[ny] && board[ny][nx] === color) count++;
            else break;
        }
        if (count >= 5) return true;
    }
    return false;
}

// --- 啟動伺服器 ---
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
