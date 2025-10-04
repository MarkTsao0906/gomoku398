const socket = io();

// --- DOM ---
const loginDiv = document.getElementById('loginDiv');
const roomDiv = document.getElementById('roomDiv');
const gameDiv = document.getElementById('gameDiv');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginMsg = document.getElementById('loginMsg');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const roomMsg = document.getElementById('roomMsg');
const boardCanvas = document.getElementById('board');
const ctx = boardCanvas.getContext('2d');
const playerColorSpan = document.getElementById('playerColor');
const moveAudio = document.getElementById('moveAudio');
const statusMsg = document.getElementById('statusMsg');

let board = [];
let playerColor = '';
let myTurn = false;

// --- 登入 / 註冊 ---
loginBtn.addEventListener('click', () => {
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.value, password: passwordInput.value })
    }).then(res => res.json())
      .then(data => {
        if (data.success) {
            loginDiv.style.display = 'none';
            roomDiv.style.display = 'block';
        } else {
            loginMsg.textContent = data.message || '登入失敗';
        }
    });
});

registerBtn.addEventListener('click', () => {
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.value, password: passwordInput.value })
    }).then(res => res.json())
      .then(data => {
        loginMsg.textContent = data.success ? '註冊成功，請登入' : data.message || '註冊失敗';
    });
});

// --- 進房 ---
joinBtn.addEventListener('click', () => {
    const roomId = roomInput.value.trim();
    if (!roomId) return;
    socket.emit('joinRoom', roomId);
});

// --- Socket.io ---
socket.on('color', color => {
    playerColor = color;
    playerColorSpan.textContent = color;
    roomDiv.style.display = 'none';
    gameDiv.style.display = 'block';
});

socket.on('full', () => {
    roomMsg.textContent = '房間已滿';
});

socket.on('boardUpdate', newBoard => {
    board = newBoard;
    drawBoard();
});

socket.on('moveSound', () => {
    moveAudio.play();
});

socket.on('gameOver', winner => {
    statusMsg.textContent = winner === playerColor ? '你贏了！' : '你輸了！';
});

// --- Canvas --- 
const gridSize = 30;
const boardSize = 15;

boardCanvas.addEventListener('click', (e) => {
    if (!playerColor) return;

    const rect = boardCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gridSize);
    const y = Math.floor((e.clientY - rect.top) / gridSize);

    socket.emit('placePiece', { roomId: roomInput.value, x, y });
});

function drawBoard() {
    ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

    // 15x15 棋盤
    ctx.strokeStyle = '#000';
    for (let i = 0; i < boardSize; i++) {
        ctx.beginPath();
        ctx.moveTo(gridSize / 2, gridSize / 2 + i * gridSize);
        ctx.lineTo(gridSize / 2 + gridSize * (boardSize-1), gridSize / 2 + i * gridSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(gridSize / 2 + i * gridSize, gridSize / 2);
        ctx.lineTo(gridSize / 2 + i * gridSize, gridSize / 2 + gridSize * (boardSize-1));
        ctx.stroke();
    }

    // 畫棋子
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            if (board[y][x]) {
                ctx.beginPath();
                ctx.arc(gridSize/2 + x*gridSize, gridSize/2 + y*gridSize, gridSize/2-2, 0, Math.PI*2);
                ctx.fillStyle = board[y][x];
                ctx.fill();
                if (board[y][x] === 'white') {
                    ctx.strokeStyle = 'black';
                    ctx.stroke();
                }
            }
        }
    }
}
