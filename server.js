// server.js
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const session = require('express-session');
const path = require('path');

const PORT = process.env.PORT || 8080;

// Session middleware
const sessionMiddleware = session({
  secret: 'gomoku-secret',
  resave: false,
  saveUninitialized: true
});
app.use(sessionMiddleware);

// Socket.IO 
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// 靜態資源
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 房間狀態
let rooms = {}; // { roomId: { players: [], board: [], turn: 'black', winner: null } }

// 登入驗證 
let users = {}; // { username: password }

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users[username]) return res.status(400).send('帳號已存在');
  users[username] = password;
  res.send('註冊成功');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    req.session.username = username;
    res.send('登入成功');
  } else {
    res.status(400).send('帳號或密碼錯誤');
  }
});

// 加入房間
app.post('/join', (req, res) => {
  const { roomId } = req.body;
  if (!req.session.username) return res.status(401).send('請先登入');

  if (!rooms[roomId]) {
    rooms[roomId] = {
      players: [],
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      turn: 'black',
      winner: null
    };
  }

  const room = rooms[roomId];
  if (room.players.length >= 2) return res.status(400).send('房間已滿');

  const color = room.players.length === 0 ? 'black' : 'white';
  room.players.push({ username: req.session.username, color });

  req.session.roomId = roomId;
  req.session.color = color;

  res.json({ color });
});

// Socket.IO
io.on('connection', (socket) => {
  const req = socket.request;
  const username = req.session.username;
  const roomId = req.session.roomId;
  const color = req.session.color;

  if (!username || !roomId) return;

  socket.join(roomId);

  const room = rooms[roomId];

  // 進入房間
  socket.emit('initBoard', { board: room.board, turn: room.turn, winner: room.winner });

  // 落子事件
  socket.on('move', ({ x, y }) => {
    if (room.winner) return;
    if (room.turn !== color) return;

    if (room.board[y][x]) return; // 已有棋子

    room.board[y][x] = color;

    // 判定勝利
    if (checkWin(room.board, x, y, color)) {
      room.winner = color;
    } else {
      room.turn = room.turn === 'black' ? 'white' : 'black';
    }

    io.to(roomId).emit('updateBoard', {
      board: room.board,
      turn: room.turn,
      lastMove: { x, y, color },
      winner: room.winner
    });
  });

  // 離開房間
  socket.on('disconnect', () => {
    if (!rooms[roomId]) return;
    rooms[roomId].players = rooms[roomId].players.filter(p => p.username !== username);
    if (rooms[roomId].players.length === 0) delete rooms[roomId];
  });
});

// 判定勝利函式
function checkWin(board, x, y, color) {
  const directions = [
    [1, 0], [0, 1], [1, 1], [1, -1]
  ];

  for (let [dx, dy] of directions) {
    let count = 1;
    for (let dir = -1; dir <= 1; dir += 2) {
      let nx = x, ny = y;
      while (true) {
        nx += dx * dir;
        ny += dy * dir;
        if (nx < 0 || ny < 0 || nx >= 15 || ny >= 15) break;
        if (board[ny][nx] !== color) break;
        count++;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
