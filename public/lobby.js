document.getElementById('joinBtn').addEventListener('click', () => {
  const name = document.getElementById('nickname').value.trim();
  const roomId = document.getElementById('roomId').value.trim();
  if (!name || !roomId) return alert('請輸入暱稱與房號');

  localStorage.setItem('nickname', name);
  localStorage.setItem('roomId', roomId);
  window.location.href = '/game.html';
});
