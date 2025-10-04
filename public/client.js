const socket = io();
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const moveSound = document.getElementById('moveSound');
const size = 15;
let board = Array(size).fill(null).map(()=>Array(size).fill(null));
let myColor = null;
let turn = 'black';
let winner = null;

// 棋盤
function drawBoard() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const gap = canvas.width / (size+1);
  for(let i=1;i<=size;i++){
    ctx.beginPath();
    ctx.moveTo(gap, gap*i);
    ctx.lineTo(gap*size, gap*i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gap*i, gap);
    ctx.lineTo(gap*i, gap*size);
    ctx.stroke();
  }
  // 棋子
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      if(board[y][x]){
        ctx.beginPath();
        ctx.arc(gap*x+gap, gap*y+gap, gap/2.2, 0, Math.PI*2);
        ctx.fillStyle = board[y][x];
        ctx.fill();
        if(board[y][x]==='white'){
          ctx.strokeStyle='black';
          ctx.stroke();
        }
      }
    }
  }
}

// 落子
canvas.addEventListener('click', e=>{
  if(!myColor || winner || turn!==myColor) return;
  const rect = canvas.getBoundingClientRect();
  const gap = canvas.width/(size+1);
  const x = Math.round((e.clientX-rect.left-gap)/gap)+1;
  const y = Math.round((e.clientY-rect.top-gap)/gap)+1;
  if(board[y][x]) return;
  socket.emit('move',{x,y});
});

// 更新棋盤
socket.on('updateBoard', data=>{
  board = data.board;
  turn = data.turn;
  winner = data.winner;
  drawBoard();
  if(data.lastMove){
    moveSound.play();
  }
  document.getElementById('turnInfo').innerText = winner ? `勝利者: ${winner}` : `輪到: ${turn}`;
  updateSchedule();
});

// 初始棋盤
socket.on('initBoard', data=>{
  board = data.board;
  turn = data.turn;
  winner = data.winner;
  drawBoard();
  document.getElementById('turnInfo').innerText = winner ? `勝利者: ${winner}` : `輪到: ${turn}`;
});

// 登入註冊
document.getElementById('registerBtn').addEventListener('click', async ()=>{
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  const res = await fetch('/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
  const msg = document.getElementById('authMsg');
  if(res.ok) msg.innerText='註冊成功'; else msg.innerText=await res.text();
});
document.getElementById('loginBtn').addEventListener('click', async ()=>{
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  const res = await fetch('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
  const msg = document.getElementById('authMsg');
  if(res.ok){
    msg.innerText='登入成功';
    document.getElementById('auth').style.display='none';
    document.getElementById('roomSection').style.display='block';
  } else msg.innerText=await res.text();
});

// 加入房間
document.getElementById('joinBtn').addEventListener('click', async ()=>{
  const roomId = document.getElementById('roomIdInput').value;
  const res = await fetch('/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId})});
  if(res.ok){
    const data = await res.json();
    myColor = data.color;
    document.getElementById('colorInfo').innerText=`你的顏色: ${myColor}`;
    socket.connect();
  } else {
    alert(await res.text());
  }
});

// 賽程表更新
function updateSchedule(){
  const tbody = document.querySelector('#schedule tbody');
  tbody.innerHTML = '';
  for(const roomId in socket.io.engine.transportServer.rooms || {}){
    
  }
}
