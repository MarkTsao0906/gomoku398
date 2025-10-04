const socket = io();

const loginSection = document.getElementById('login-section');
const roomSection = document.getElementById('room-section');
const gameSection = document.getElementById('game-section');

const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginMsg = document.getElementById('login-msg');

const joinRoomBtn = document.getElementById('join-room-btn');
const roomInput = document.getElementById('room-input');
const playerColorP = document.getElementById('player-color');

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const moveSound = document.getElementById('move-sound');
let board = [];
let myColor;
let currentTurn;

loginBtn.onclick = () => {
  fetch('/login', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username:document.getElementById('username').value, password:document.getElementById('password').value})
  }).then(r=>r.json()).then(data=>{
    if(data.success){
      loginSection.style.display='none';
      roomSection.style.display='block';
    }else{
      loginMsg.textContent=data.message;
    }
  });
};

registerBtn.onclick = () => {
  fetch('/register', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username:document.getElementById('username').value, password:document.getElementById('password').value})
  }).then(r=>r.json()).then(data=>{
    loginMsg.textContent = data.success ? "註冊成功" : data.message;
  });
};

joinRoomBtn.onclick = () => {
  const roomId = roomInput.value.trim();
  if(!roomId) return alert("請輸入房號");
  socket.emit('joinRoom', roomId);
};

socket.on('assignColor', color => {
  myColor = color;
  playerColorP.textContent = `你的顏色: ${color}`;
  roomSection.style.display='none';
  gameSection.style.display='block';
});

socket.on('initBoard', (b, turn, winner) => {
  board = b;
  currentTurn = turn;
  drawBoard();
  updateTurnInfo();
});

socket.on('updateBoard', (x, y, color) => {
  board[y][x] = color;
  drawBoard();
  moveSound.play();
});

socket.on('updateTurn', turn => {
  currentTurn = turn;
  updateTurnInfo();
});

socket.on('gameOver', winner => {
  alert(`${winner}勝利！`);
});

function updateTurnInfo(){
  document.getElementById('turn-info').textContent = `現在輪到: ${currentTurn}`;
}

function drawBoard(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const cell = canvas.width/15;
  for(let i=0;i<15;i++){
    ctx.beginPath();
    ctx.moveTo(cell/2, cell/2 + i*cell);
    ctx.lineTo(canvas.width-cell/2, cell/2 + i*cell);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cell/2 + i*cell, cell/2);
    ctx.lineTo(cell/2 + i*cell, canvas.height-cell/2);
    ctx.stroke();
  }

  for(let y=0;y<15;y++){
    for(let x=0;x<15;x++){
      if(board[y][x]!==''){
        ctx.beginPath();
        ctx.arc(cell/2 + x*cell, cell/2 + y*cell, cell/3, 0, Math.PI*2);
        ctx.fillStyle = board[y][x]==='black' ? 'black' : 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
      }
    }
  }
}

canvas.addEventListener('click', e=>{
  const rect = canvas.getBoundingClientRect();
  const cell = canvas.width/15;
  const x = Math.floor((e.clientX-rect.left)/cell);
  const y = Math.floor((e.clientY-rect.top)/cell);
  socket.emit('makeMove', {x,y});
});
