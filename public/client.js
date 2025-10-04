const socket = io();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");
const colorInfo = document.getElementById("colorInfo");
const turnInfo = document.getElementById("turnInfo");
const moveAudio = document.getElementById("moveAudio");

let roomId;
let myColor;
let board = Array(15).fill(null).map(() => Array(15).fill(null));

joinBtn.addEventListener("click", () => {
    roomId = roomInput.value.trim();
    if (!roomId) return alert("請輸入房號");
    socket.emit("joinRoom", roomId);
});

socket.on("assignColor", (color) => {
    myColor = color;
    colorInfo.textContent = `你的顏色: ${myColor}`;
    drawBoard();
});

socket.on("boardUpdate", (newBoard) => {
    board = newBoard;
    drawBoard();
});

socket.on("turn", (color) => {
    turnInfo.textContent = `輪到: ${color}`;
});

socket.on("moveSound", () => {
    moveAudio.play();
});

socket.on("gameOver", (color) => {
    alert(`${color} 勝利!`);
});

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const size = canvas.width / 15;
    // 畫線
    ctx.strokeStyle = "#000";
    for (let i=0;i<=15;i++){
        ctx.beginPath();
        ctx.moveTo(i*size,0);
        ctx.lineTo(i*size,canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0,i*size);
        ctx.lineTo(canvas.width,i*size);
        ctx.stroke();
    }
    // 畫棋子
    for (let y=0;y<15;y++){
        for (let x=0;x<15;x++){
            if (!board[y][x]) continue;
            ctx.beginPath();
            ctx.arc((x+0.5)*size,(y+0.5)*size,size/2*0.9,0,2*Math.PI);
            ctx.fillStyle = board[y][x]==="black"?"black":"white";
            ctx.fill();
            if(board[y][x]==="white"){
                ctx.strokeStyle="black";
                ctx.stroke();
            }
        }
    }
}

canvas.addEventListener("click",(e)=>{
    if(!myColor) return;
    const rect = canvas.getBoundingClientRect();
    const size = canvas.width / 15;
    const x = Math.floor((e.clientX - rect.left)/size);
    const y = Math.floor((e.clientY - rect.top)/size);
    socket.emit("makeMove",{roomId,x,y});
});
