import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import {randomInt,randomUUID} from 'crypto';
const app=express(),server=createServer(app),io=new Server(server,{cors:{origin:'*'}});
app.use(express.static('public'));
const rooms=new Map();
const questions=[
['Which vehicle travels through space?',['Spaceship','Monorail','Hoverboard','High-speed train'],0,'vehicles'],
['Which vehicle lets you fly using equipment on your back?',['Supersonic jet','Jetpack','Monorail','Hoverboard'],1,'vehicles'],
['Which vehicle runs on a single rail or beam?',['Jetpack','Spaceship','Monorail','Hoverboard'],2,'vehicles'],
['Which vehicle is designed to travel faster than the speed of sound?',['High-speed train','Hoverboard','Spaceship','Supersonic jet'],3,'vehicles'],
['Which vehicle is a very fast train running on tracks?',['High-speed train','Monorail','Jetpack','Spaceship'],0,'vehicles'],
['Which vehicle is a board that hovers above the ground?',['Spaceship','Hoverboard','Monorail','Supersonic jet'],1,'vehicles'],
['The robot is ahead of you. Go _____.',['left','right','straight ahead','down'],2,'directions'],
['To turn toward your left hand, go _____.',['left','right','up','over'],0,'directions'],
['The drone flies _____ the bridge, from one side to the other above it.',['into','over','down','left'],1,'directions'],
['The spaceship flies _____ the tunnel and exits the other side.',['through','over','into','up'],0,'directions'],
['The jetpack rises from the ground. It goes _____.',['down','right','left','up'],3,'directions'],
['Choose the correct future statement.',['People will travels by jetpack.','People will travel by jetpack.','People will traveling by jetpack.','People will to travel by jetpack.'],1,'grammar'],
['Choose the correct question and short answer.',['Will trains fly? Yes, they will.','Will trains flies? Yes, they will.','Do trains will fly? Yes, they will.','Will trains fly? Yes, they do.'],0,'grammar'],
['The train descends from the sky. It goes _____.',['up','down','over','into'],1,'directions'],
['The robot enters the spaceship. It goes _____ the spaceship.',['through','over','into','left'],2,'directions'],
['The station is on your right-hand side. Turn _____.',['straight ahead','left','right','down'],2,'directions'],
['Choose the correct negative prediction.',['Cars will not need drivers.','Cars not will need drivers.','Cars will not needs drivers.','Cars do not will need drivers.'],0,'grammar'],
['Choose the correct answer to “Will you use a hoverboard?”',['Yes, I do.','Yes, I will.','Yes, I am.','Yes, I can.'],1,'grammar']
].map(([q,opts,answer,category],i)=>({id:i+1,q,opts,answer,category}));
const publicRoom=r=>({pin:r.pin,status:r.status,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,score:p.score,answered:r.answers.has(p.id)})),index:r.index,total:r.order.length,question:r.status==='question'?(()=>{let q=questions[r.order[r.index]];return {q:q.q,opts:q.opts,category:q.category}})():null,deadline:r.deadline,round:r.round,reveal:r.status==='reveal'?{correct:questions[r.order[r.index]].answer,answerCount:r.answers.size}:null});
const emit=r=>io.to(r.pin).emit('room',publicRoom(r));
function next(r){clearTimeout(r.timer);r.index++;r.answers.clear();r.round++;if(r.index>=r.order.length){r.status='finished';r.deadline=null;emit(r);return}r.status='question';r.deadline=Date.now()+25000;emit(r);const round=r.round;r.timer=setTimeout(()=>{if(r.round===round)reveal(r)},25000)}
function reveal(r){if(r.status!=='question')return;clearTimeout(r.timer);r.status='reveal';r.deadline=null;emit(r)}
io.on('connection',socket=>{
 socket.on('create',(_,cb)=>{let pin;do{pin=String(randomInt(100000,999999))}while(rooms.has(pin));let r={pin,host:socket.id,players:new Map(),answers:new Map(),status:'lobby',index:-1,order:questions.map((_,i)=>i),deadline:null,timer:null,round:0};rooms.set(pin,r);socket.join(pin);socket.data.pin=pin;socket.data.host=true;cb({ok:true,pin});emit(r)});
 socket.on('join',({pin,name,token},cb)=>{let r=rooms.get(String(pin));if(!r)return cb({error:'Không tìm thấy phòng.'});if(r.status!=='lobby'&&r.status!=='question'&&r.status!=='reveal')return cb({error:'Phòng đã kết thúc.'});name=String(name||'').trim().slice(0,24);if(!name)return cb({error:'Vui lòng nhập tên.'});let p=token&&r.players.get(token);if(!p){if(r.status!=='lobby')return cb({error:'Trò chơi đã bắt đầu.'});if(r.players.size>=13)return cb({error:'Phòng đã đủ 13 học sinh.'});if([...r.players.values()].some(x=>x.name.toLocaleLowerCase()===name.toLocaleLowerCase()))return cb({error:'Tên này đã có trong phòng.'});token=randomUUID();p={id:token,name,score:0,streak:0};r.players.set(token,p)}socket.join(pin);socket.data.pin=pin;socket.data.player=token;cb({ok:true,token,pin});emit(r)});
 socket.on('hostAction',({action},cb=()=>{})=>{let r=rooms.get(socket.data.pin);if(!r||r.host!==socket.id)return cb({error:'Chỉ giáo viên mới điều khiển được.'});if(action==='start'&&r.status==='lobby'){if(r.players.size<1)return cb({error:'Chưa có học sinh.'});r.order=questions.map((_,i)=>i);for(let i=r.order.length-1;i>0;i--){let j=randomInt(i+1);[r.order[i],r.order[j]]=[r.order[j],r.order[i]]}next(r)}else if(action==='next'&&r.status==='reveal')next(r);else if(action==='reveal'&&r.status==='question')reveal(r);else if(action==='reset'){clearTimeout(r.timer);r.index=-1;r.status='lobby';r.deadline=null;r.answers.clear();r.players.forEach(p=>{p.score=0;p.streak=0});emit(r)}cb({ok:true})});
 socket.on('answer',({choice},cb=()=>{})=>{let r=rooms.get(socket.data.pin),p=r?.players.get(socket.data.player);if(!r||!p||r.status!=='question')return cb({error:'Câu hỏi đã đóng.'});if(r.answers.has(p.id))return cb({error:'Bạn đã trả lời.'});if(!Number.isInteger(choice)||choice<0||choice>3)return cb({error:'Lựa chọn không hợp lệ.'});let correct=questions[r.order[r.index]].answer===choice;let seconds=Math.max(0,(r.deadline-Date.now())/1000);let points=correct?500+Math.round(500*seconds/25):0;p.score+=points;p.streak=correct?p.streak+1:0;r.answers.set(p.id,{choice,correct,points});cb({ok:true,choice,points,correct});emit(r);if(r.answers.size===r.players.size)reveal(r)});
 socket.on('disconnect',()=>{let r=rooms.get(socket.data.pin);if(r&&socket.data.host&&r.host===socket.id){clearTimeout(r.timer);rooms.delete(r.pin);io.to(r.pin).emit('closed')} });
});
app.get('/health',(_,res)=>res.json({ok:true}));
server.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Future Travel Live ready'));
