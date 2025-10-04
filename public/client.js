const socket = io();

const params = new URLSearchParams(window.location.search);
const nickname = params.get('nickname');
const roomId = params.get('roomId');

socket.emit('joinRoom', { roomId, nickname });

socket.on('playerNames', (names) => {
  document.getElementById('player1').textContent = names[0] || '';
  document.getElementById('player2').textContent = names[1] || '';
});

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const N = 15;
const cellSize = canvas.width / (N-1);
let board = Array(N).fill().map(()=>Array(N).fill(''));
let myColor = null;
const moveSound = new Audio('move.mp3');

socket.on('color', (color)=>{myColor=color;});
socket.on('board',(newBoard)=>{board=newBoard; drawBoard(board);});
socket.on('moveSound',()=>playMoveSound());
socket.on('winner',(winner)=>alert(winner+' 獲勝!'));

canvas.addEventListener('click',(e)=>{
  const rect = canvas.getBoundingClientRect();
  const x = Math.round((e.clientX-rect.left)/cellSize);
  const y = Math.round((e.clientY-rect.top)/cellSize);
  socket.emit('move',{x,y});
});

function drawBoard(board){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='black';
  for(let i=0;i<N;i++){
    ctx.beginPath();
    ctx.moveTo(i*cellSize,0); ctx.lineTo(i*cellSize,canvas.height); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0,i*cellSize); ctx.lineTo(canvas.width,i*cellSize); ctx.stroke();
  }
  for(let y=0;y<N;y++){
    for(let x=0;x<N;x++){
      if(board[y][x]){
        ctx.fillStyle = board[y][x]==='black'?'black':'white';
        ctx.beginPath();
        ctx.arc(x*cellSize, y*cellSize, cellSize/2-2,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='black'; ctx.stroke();
      }
    }
  }
}

function playMoveSound(){
  moveSound.currentTime=0;
  moveSound.play().catch(e=>console.log(e));
}
