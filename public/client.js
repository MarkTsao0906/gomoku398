const socket = io();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const moveSound = document.getElementById("moveSound");

const boardSize = 15;
const grid = canvas.width / boardSize;
let board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));
let lastMove = null;
let myColor = null;
let currentTurn = "black";
let roomId = null;
let username = null;

function drawBoard(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="#333";
  for(let i=0;i<boardSize;i++){
    ctx.beginPath();
    ctx.moveTo(grid/2, grid/2+i*grid);
    ctx.lineTo(canvas.width-grid/2, grid/2+i*grid);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(grid/2+i*grid, grid/2);
    ctx.lineTo(grid/2+i*grid, canvas.height-grid/2);
    ctx.stroke();
  }

  for(let r=0;r<boardSize;r++){
    for(let c=0;c<boardSize;c++){
      if(board[r][c]) drawStone(r,c,board[r][c]);
    }
  }

  if(lastMove){
    ctx.strokeStyle="red";
    ctx.lineWidth=2;
    ctx.strokeRect(lastMove.c*grid+grid/4,lastMove.r*grid+grid/4,grid/2,grid/2);
  }
}

function drawStone(r,c,color){
  const x=c*grid+grid/2;
  const y=r*grid+grid/2;
  ctx.beginPath();
  ctx.arc(x,y,grid/2-2,0,Math.PI*2);
  ctx.fillStyle=color;
  ctx.fill();
  if(color==="white"){
    ctx.strokeStyle="black";
    ctx.lineWidth=2;
    ctx.stroke();
  }
}

canvas.addEventListener("click",(e)=>{
  if(!myColor || currentTurn!==myColor) return;
  const rect=canvas.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;
  const c=Math.floor(x/grid);
  const r=Math.floor(y/grid);
  if(board[r][c]) return;
  socket.emit("move",{roomId,r,c,color:myColor});
});

socket.on("assignColor",({color})=>{
  myColor=color;
  document.getElementById("myColor").textContent=`你的顏色: ${color}`;
});

socket.on("syncBoard",({board:b,currentTurn:turn,lastMove:lm})=>{
  board=b;
  currentTurn=turn;
  lastMove=lm;
  drawBoard();
});

socket.on("move",({r,c,color,lastMove:lm})=>{
  board[r][c]=color;
  lastMove=lm;
  currentTurn=color==="black"?"white":"black";
  drawBoard();
  moveSound.play();
});

socket.on("gameOver",(winner)=>{
  alert(`遊戲結束！${winner}獲勝`);
});

// 自動加入房間
window.onload = ()=>{
  username=localStorage.getItem("sessionId")||"玩家";
  const params = new URLSearchParams(window.location.search);
  roomId = params.get("room");
  if(roomId){
    socket.emit("joinRoom",{roomId,username});
  }
  drawBoard();
};
