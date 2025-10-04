const socket = io();

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const size = 15;
const cellSize = canvas.width / size;

let board = Array.from({ length: size }, () => Array(size).fill(null));
let myTurn = false;
let myPlayer = "black";
let roomId = "";
let lastMove = null;

// 棋盤棋子
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000";

    for (let i = 0; i < size; i++) {
        // 橫線
        ctx.beginPath();
        ctx.moveTo(cellSize / 2, i * cellSize + cellSize / 2);
        ctx.lineTo(canvas.width - cellSize / 2, i * cellSize + cellSize / 2);
        ctx.stroke();
        // 縱線
        ctx.beginPath();
        ctx.moveTo(i * cellSize + cellSize / 2, cellSize / 2);
        ctx.lineTo(i * cellSize + cellSize / 2, canvas.height - cellSize / 2);
        ctx.stroke();
    }

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
            }
        }
    }

    // 標記
    if (lastMove) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(
            lastMove.x * cellSize + cellSize / 4,
            lastMove.y * cellSize + cellSize / 4,
            cellSize / 2,
            cellSize / 2
        );
        ctx.lineWidth = 1;
    }
}

drawBoard();

// 加房間
function joinRoom() {
    const roomInput = document.getElementById("roomId").value;
    if (!roomInput) return alert("請輸入房號");
    roomId = roomInput;
    socket.emit("joinRoom", roomId);
}

socket.on("roomJoined", (playerCount) => {
    alert("成功入房，目前玩家數：" + playerCount);
    myTurn = playerCount === 1; // 第一位是黑棋先手
});

socket.on("roomFull", () => {
    alert("房間滿，換房號");
});

// 落子
canvas.addEventListener("click", (e) => {
    if (!myTurn) return;

    const x = Math.floor(e.offsetX / cellSize);
    const y = Math.floor(e.offsetY / cellSize);
    if (board[x][y]) return;

    board[x][y] = myPlayer;
    lastMove = { x, y };
    drawBoard();

    // 音效
    const moveSound = document.getElementById("moveSound");
    moveSound.currentTime = 0; 
    moveSound.play();

    socket.emit("makeMove", { roomId, x, y, player: myPlayer });
    myTurn = false;
});
// 接收落子
socket.on("opponentMove", (data) => {
    board[data.x][data.y] = data.player; // 對方顏色
    lastMove = { x: data.x, y: data.y };
    drawBoard();
    document.getElementById("moveSound").play();
    myTurn = true;
});
// 判斷
function checkWin(x, y, player) {
    const directions = [
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 1 },
        { dx: 1, dy: -1 }
    ];

    for (let {dx, dy} of directions) {
        let count = 1;
        for (let i = 1; i < 5; i++) {
            let nx = x + dx * i;
            let ny = y + dy * i;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) break;
            if (board[nx][ny] === player) count++;
            else break;
        }
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
//判斷玩家數
socket.on("roomJoined", (playerCount) => {
    alert("成功加入房間，目前玩家數：" + playerCount);
    if (playerCount === 1) {
        myPlayer = "black"; 
        myTurn = true;      
    } else {
        myPlayer = "white"; 
        myTurn = false;     
    }
});