const socket = io();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const size = 15;
const cellSize = canvas.width / size;
let board = Array(size).fill().map(() => Array(size).fill(null));
let myTurn = false;
let myPlayer = null;
let roomId = null;
let lastMove = null;

// 棋盤
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";

    for (let i = 0; i < size; i++) {
        // 畫橫線
        ctx.beginPath();
        ctx.moveTo(cellSize / 2, i * cellSize + cellSize / 2);
        ctx.lineTo(canvas.width - cellSize / 2, i * cellSize + cellSize / 2);
        ctx.stroke();

        // 畫縱線
        ctx.beginPath();
        ctx.moveTo(i * cellSize + cellSize / 2, cellSize / 2);
        ctx.lineTo(i * cellSize + cellSize / 2, canvas.height - cellSize / 2);
        ctx.stroke();
    }
}
drawBoard(); // 一開始畫一次
drawBoard(); // 一開始就畫
  // 棋子
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (board[x][y]) {
        ctx.beginPath();
        ctx.arc(
          x * cellSize + cellSize / 2,
          y * cellSize + cellSize / 2,
          cellSize / 2.5,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = board[x][y] === "black" ? "black" : "white";
        ctx.fill();
        ctx.stroke();

        // 標記最後一步
        if (lastMove && lastMove.x === x && lastMove.y === y) {
          ctx.strokeStyle = "red";
          ctx.strokeRect(
            x * cellSize,
            y * cellSize,
            cellSize,
            cellSize
          );
          ctx.strokeStyle = "#000";
        }
      }
    }
  }
}

drawBoard();

// 落子
canvas.addEventListener("click", (e) => {
  canvas.addEventListener("click", (e) => {
  if (!myTurn) return;

  const x = Math.floor(e.offsetX / cellSize);
  const y = Math.floor(e.offsetY / cellSize);
  if (board[x][y]) return; // 如果已經有棋子，不做任何事

  
  board[x][y] = myPlayer;
  lastMove = { x, y };
  drawBoard();

  
  document.getElementById("moveSound").play();

  
  if (checkWin(x, y, myPlayer)) {
      alert(myPlayer + " 獲勝！");
      myTurn = false; // 停止繼續下
  }


  socket.emit("makeMove", { roomId, x, y, player: myPlayer });
  myTurn = false;
});


// 接收落子
socket.on("moveMade", ({ x, y, player }) => {
  board[x][y] = player;
  lastMove = { x, y };
  drawBoard();
  document.getElementById("moveSound").play();
  myTurn = (player !== myPlayer);
});

function joinRoom() {
  roomId = document.getElementById("roomId").value;
  if (!roomId) return alert("刷房卡");
  socket.emit("joinRoom", roomId);
}

socket.on("roomJoined", (count) => {
  if (count === 1) {
    myPlayer = "black";
    myTurn = true;
    alert("你先手！");
  } else if (count === 2) {
    myPlayer = "white";
    myTurn = false;
    alert("你後手！");
  }
});

socket.on("roomFull", () => {
  alert("房間滿了！");
});
function checkWin(x, y, player) {
    const directions = [
        { dx: 1, dy: 0 },  // 水平
        { dx: 0, dy: 1 },  // 垂直
        { dx: 1, dy: 1 },  // 斜右下
        { dx: 1, dy: -1 }  // 斜右上
    ];

    for (let {dx, dy} of directions) {
        let count = 1;

        // 正方向
        for (let i = 1; i < 5; i++) {
            let nx = x + dx * i;
            let ny = y + dy * i;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
            if (board[nx][ny] === player) count++;
            else break;
        }

        // 反方向
        for (let i = 1; i < 5; i++) {
            let nx = x - dx * i;
            let ny = y - dy * i;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
            if (board[nx][ny] === player) count++;
            else break;
        }

        if (count >= 5) return true;
    }
    return false;
}
