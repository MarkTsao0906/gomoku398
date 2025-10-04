function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  fetch("/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})})
  .then(r=>r.json()).then(res=>{
    alert(res.msg||"註冊成功");
  });
}

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  fetch("/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})})
  .then(r=>r.json()).then(res=>{
    if(res.success){
      localStorage.setItem("sessionId",username);
      alert("登入成功");
    }else{
      alert(res.msg);
    }
  });
}

function enterGame(){
  if(!localStorage.getItem("sessionId")){
    alert("請先登入");
    return;
  }
  const roomId=document.getElementById("roomId").value.trim();
  if(!roomId){ alert("請輸入房號"); return; }
  window.location.href=`game.html?room=${roomId}`;
}
