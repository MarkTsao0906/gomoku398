const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

const rooms = {};

io.on('connection', socket => {
  socket.on('joinRoom', room => {
    if(!rooms[room]) rooms[room] = {black:null, white:null};
    const roomObj = rooms[room];

    let color;
    if(!roomObj.black){ roomObj.black = socket.id; color='black'; }
    else if(!roomObj.white){ roomObj.white = socket.id; color='white'; }
    else { socket.emit('init','spectator'); return; }

    socket.join(room);
    socket.emit('init', color);
  });

  socket.on('makeMove', ({room,x,y})=>{
    const color = (rooms[room].black === socket.id)?'black':'white';
    socket.to(room).emit('opponentMove',{x,y,color});
  });

  socket.on('restart', room=>{
    io.to(room).emit('restartBoard');
  });
});

http.listen(3000, ()=>console.log('Server running on http://localhost:3000'));
