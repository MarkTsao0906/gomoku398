const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const size = 15;
let currentPlayer = 'black';
let board = Array.from({length:size},()=>Array(size).fill(null));
let gameOver = false;

for(let i=0;i<size;i++){
  const hLine = document.createElement('div');
  hLine.classList.add('line-horizontal');
  hLine.style.top = `${i*32 + 32}px`;
  boardEl.appendChild(hLine);

  const vLine = document.createElement('div');
  vLine.classList.add('line-vertical');
  vLine.style.left = `${i*32 + 32}px`;
  boardEl.appendChild(vLine);
}

for (let i=0;i<size;i++){
  for (let j=0;j<size;j++){
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.style.left = `${j*32 + 32}px`;
    cell.style.top = `${i*32 + 32}px`;
    cell.dataset.x = j;
    cell.dataset.y = i;

    cell.addEventListener('click', ()=> placeStone(cell));
    boardEl.appendChild(cell);
  }
}


function placeStone(cell){
  if(gameOver) return;
  const x = parseInt(cell.dataset.x);
  const y = parseInt(cell.dataset.y);

  if(board[y][x]) return; 

  const stone = document.createElement('div');
  stone.classList.add('stone', currentPlayer);
  cell.appendChild(stone);

  board[y][x] = currentPlayer;

  if(checkWin(x,y,currentPlayer)){
    statusEl.textContent = `${currentPlayer==='black'?'黑子':'白子'} 勝利！`;
    gameOver = true;
    return;
  }

  currentPlayer = currentPlayer==='black'?'white':'black';
  statusEl.textContent = `輪到: ${currentPlayer==='black'?'黑子':'白子'}`;
}

function checkWin(x,y,color){
  const directions = [
    [1,0],[0,1],[1,1],[1,-1]
  ];

  for(const [dx,dy] of directions){
    let count = 1;
    let nx=x+dx, ny=y+dy;
    while(nx>=0 && nx<size && ny>=0 && ny<size && board[ny][nx]===color){
      count++; nx+=dx; ny+=dy;
    }
    nx=x-dx; ny=y-dy;
    while(nx>=0 && nx<size && ny>=0 && ny<size && board[ny][nx]===color){
      count++; nx-=dx; ny-=dy;
    }
    if(count>=5) return true;
  }
  return false;
}
