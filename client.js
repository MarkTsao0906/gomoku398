const socket = io();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const size = 15; // 15x15 棋盤
const cellSize = canvas.width / size;
let board = Array(size).fill().map(() => Array(size).fill(null));
let myTurn = true;
let myColor = "black";

const moveSound = new Audio("move.mp3");

// 畫棋盤
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < size; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize + cellSize / 2, cellSize / 2);
        ctx.lineTo(i * cellSize + cellSize / 2, canvas.height - cellSize / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cellSize / 2, i * cellSize + cellSize / 2);
        ctx.lineTo(canvas.width - cellSize / 2, i * cellSize + cellSize / 2);
        ctx.stroke();
    }
    // 畫棋子
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            if (board[x][y]) {
                drawPiece(x, y, board[x][y]);
            }
        }
    }
}

function drawPiece(x, y, color, highlight = false) {
    ctx.beginPath();
    ctx.arc(
        x * cellSize + cellSize / 2,
        y * cellSize + cellSize / 2,
        cellSize / 2.5,
        0,
        2 * Math.PI
    );
    ctx.fillStyle = color;
    ctx.fill();

    if (highlight) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

// 玩家下棋
canvas.addEventListener("click", (e) => {
    if (!myTurn) return;
    const x = Math.floor(e.offsetX / cellSize);
    const y = Math.floor(e.offsetY / cellSize);
    if (board[x][y]) return;

    board[x][y] = myColor;
    drawBoard();
    drawPiece(x, y, myColor);
    moveSound.play();

    socket.emit("placePiece", { x, y, color: myColor });
    myTurn = false;
});

// 進入房間
function joinRoom() {
    const room = document.getElementById("roomInput").value;
    if (!room) return;
    socket.emit("joinRoom", room);
}

socket.on("joinedRoom", (room) => {
    document.getElementById("room-select").style.display = "none";
    canvas.style.display = "block";
    drawBoard();
});

socket.on("opponentMove", ({ x, y, color }) => {
    board[x][y] = color;
    drawBoard();
    drawPiece(x, y, color, true); // 標註對手下棋位置
    moveSound.play();
    myTurn = true;
});
