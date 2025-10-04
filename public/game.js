const socket = io();
const nickname = localStorage.getItem('nickname');
const roomId = localStorage.getItem('roomId');

socket.emit('joinRoom', { roomId, name: nickname });

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const N = 15;
const cellSize = canvas.width / N;
let board = Array(N).fill().map(() => Array(N).fill(''));
let myColor = null;
let players = [];

socket.on('color', (color) => myColor = color);
socket.on('board', (b) => { board = b; drawBoard(); });
socket.on('players', (p) => {
  players = p;
  document.getElementById('player1').textContent = p[0] || '';
  document.getElementById('player2').textContent = p[1] || '';
});
socket.on('moveSound', () => document.getElementById('moveSound').play());
socket.on('winner', (winner) => alert(winner + ' 勝利!'));
socket.on('roomFull', () => alert('房間已滿'));

canvas.addEventListener('click', (e) => {
  if (!myColor) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);
  if (board[y][x]) return;
  socket.emit('move', { x, y });
});

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#000';
  for (let i = 0; i < N; i++) {
    ctx.beginPath();
    ctx.moveTo(cellSize/2, cellSize/2 + i*cellSize);
    ctx.lineTo(canvas.width - cellSize/2, cellSize/2 + i*cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cellSize/2 + i*cellSize, cellSize/2);
    ctx.lineTo(cellSize/2 + i*cellSize, canvas.height - cellSize/2);
    ctx.stroke();
  }

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!board[y][x]) continue;
      ctx.beginPath();
      ctx.arc(x*cellSize + cellSize/2, y*cellSize + cellSize/2, cellSize/2 - 2, 0, 2*Math.PI);
      ctx.fillStyle = board[y][x];
      ctx.fill();
    }
  }
}
