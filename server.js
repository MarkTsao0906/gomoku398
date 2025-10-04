const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const db = new sqlite3.Database('./users.db');

// 建立 users table
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

// 登入
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.json({ success: false, message: err.message });
    if (!user) return res.json({ success: false, message: '帳號不存在' });
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        req.session.user = username;
        res.json({ success: true });
      } else {
        res.json({ success: false, message: '密碼錯誤' });
      }
    });
  });
});

// 註冊
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    db.run('INSERT INTO users(username, password) VALUES(?,?)', [username, hash], function(err){
      if(err) return res.json({ success:false, message:err.message });
      res.json({ success:true });
    });
  });
});

// 房間資料
const rooms = {}; // roomId -> { board: [], turn: 'black'/'white', winner: null }

io.on('connection', socket => {
  socket.on('joinRoom', roomId => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = { board: Array(15).fill(0).map(()=>Array(15).fill('')), turn: 'black', winner: null };
    }

    const room = rooms[roomId];
    const playerColor = io.sockets.adapter.rooms.get(roomId).size === 1 ? 'black' : 'white';
    socket.emit('assignColor', playerColor);
    socket.emit('initBoard', room.board, room.turn, room.winner);

    socket.on('makeMove', ({ x, y }) => {
      if(room.winner) return;
      if(room.board[y][x] !== '') return;
      if(playerColor !== room.turn) return;

      room.board[y][x] = playerColor;
      io.to(roomId).emit('updateBoard', x, y, playerColor);

      // 判勝負
      if(checkWin(room.board, x, y, playerColor)){
        room.winner = playerColor;
        io.to(roomId).emit('gameOver', playerColor);
        return;
      }

      // 換手
      room.turn = room.turn === 'black' ? 'white' : 'black';
      io.to(roomId).emit('updateTurn', room.turn);
    });
  });
});

// 勝判定
function checkWin(board, x, y, color){
  const directions = [
    [[0,1],[0,-1]], // vertical
    [[1,0],[-1,0]], // horizontal
    [[1,1],[-1,-1]], // diag1
    [[1,-1],[-1,1]] // diag2
  ];

  for(const dir of directions){
    let count = 1;
    for(const [dx, dy] of dir){
      let nx = x + dx;
      let ny = y + dy;
      while(nx>=0 && nx<15 && ny>=0 && ny<15 && board[ny][nx]===color){
        count++;
        nx += dx;
        ny += dy;
      }
    }
    if(count>=5) return true;
  }
  return false;
}

const PORT = process.env.PORT || 8080;
http.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
