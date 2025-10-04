import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import fs from 'fs';
import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: 'gomoku-secret',
    resave: false,
    saveUninitialized: true,
  })
);

const SQL = await initSqlJs();
let db;
if (fs.existsSync('./users.db')) {
  const filebuffer = fs.readFileSync('./users.db');
  db = new SQL.Database(filebuffer);
} else {
  db = new SQL.Database();
  db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT UNIQUE)`);
  saveDB();
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync('./users.db', Buffer.from(data));
}

// 房間資料
let rooms = {}; // roomId => { players: [{id, nickname}], board: [][] }

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ roomId, nickname }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], board: Array(15).fill().map(() => Array(15).fill('')) };
    }
    if (rooms[roomId].players.length >= 2) {
      socket.emit('roomFull');
      return;
    }

    rooms[roomId].players.push({ id: socket.id, nickname });
    const color = rooms[roomId].players.length === 1 ? 'black' : 'white';
    socket.join(roomId);
    socket.emit('color', color);

    // 發送雙方暱稱
    const names = rooms[roomId].players.map(p => p.nickname);
    io.to(roomId).emit('playerNames', names);

    socket.emit('board', rooms[roomId].board);

    socket.on('move', ({ x, y }) => {
      const playerIndex = rooms[roomId].players.findIndex(p => p.id === socket.id);
      if (playerIndex === -1) return;
      const turn = rooms[roomId].board.flat().filter(v => v).length % 2 === 0 ? 0 : 1;
      if (playerIndex !== turn) return;

      rooms[roomId].board[y][x] = turn === 0 ? 'black' : 'white';
      io.to(roomId).emit('board', rooms[roomId].board);
      io.to(roomId).emit('moveSound');

      const winner = checkWinner(rooms[roomId].board);
      if (winner) io.to(roomId).emit('winner', winner);
    });

    socket.on('disconnect', () => {
      if (rooms[roomId]) {
        rooms[roomId].players = rooms[roomId].players.filter(p => p.id !== socket.id);
        if (rooms[roomId].players.length === 0) delete rooms[roomId];
      }
    });
  });
});

function checkWinner(board) {
  const N = 15;
  const directions = [[1,0],[0,1],[1,1],[1,-1]];
  for (let y=0; y<N; y++) {
    for (let x=0; x<N; x++) {
      const player = board[y][x];
      if (!player) continue;
      for (const [dx, dy] of directions) {
        let count = 1;
        for (let k=1;k<5;k++){
          const nx = x + dx*k;
          const ny = y + dy*k;
          if (nx<0 || nx>=N || ny<0 || ny>=N) break;
          if(board[ny][nx]===player) count++;
        }
        if(count===5) return player;
      }
    }
  }
  return null;
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
