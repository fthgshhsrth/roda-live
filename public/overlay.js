import {placeBubble} from './layout.js';
const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d'),audio=document.getElementById('audio'),enable=document.getElementById('enable');
const preview=new URLSearchParams(location.search).has('preview');
let state={people:[],log:[],settings:{title:'A RODA É SUA',subtitle:'Mande uma rosa e entre na roda!',speed:1},music:{}},clockOffset=0,musicKey='',lastEvent='',flash=null,elapsed=0,lastFrame=performance.now(),audioOwner=false;
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('roda-live-audio'):null;
const myId=Math.random().toString(36);
function claimAudio(){channel?.postMessage({type:'claim',id:myId});audioOwner=true;}
if(channel)channel.onmessage=e=>{if(e.data.id!==myId&&e.data.type==='claim'){audioOwner=false;audio.pause();if(!preview){enable.hidden=false;enable.textContent='♫ Ativar áudio nesta cena';}}};
if(preview){enable.hidden=true;audio.muted=true;}else claimAudio();
async function syncAudio(){
 if(preview||!audioOwner)return;
 const m=state.music;if(!m.file){audio.pause();return;}
 if(musicKey!==m.file){musicKey=m.file;audio.src='/music/'+encodeURIComponent(m.file);}
 audio.volume=m.volume??.65;
 const position=Math.max(0,(m.position||0)+(m.playing?(Date.now()+clockOffset-m.changed)/1000:0));
 const seek=()=>{if(Number.isFinite(audio.duration)&&Math.abs(audio.currentTime-position)>1.5)audio.currentTime=Math.min(position,Math.max(0,audio.duration-.1));};
 if(audio.readyState)seek();else audio.onloadedmetadata=seek;
 if(m.playing){try{await audio.play();enable.hidden=true;}catch{enable.hidden=false;}}else audio.pause();
}
enable.onclick=()=>{claimAudio();syncAudio();};
audio.onended=()=>{if(audioOwner)fetch('/api/music',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'next',expectedFile:state.music.file})});};
const events=new EventSource('/events');
events.onmessage=e=>{state=JSON.parse(e.data);clockOffset=state.serverTime-Date.now();document.getElementById('offline').style.display='none';const latest=state.log[0];if(latest&&latest.id!==lastEvent){lastEvent=latest.id;if(Date.now()+clockOffset-latest.at<8000)flash=latest;}syncAudio();};
events.onerror=()=>document.getElementById('offline').style.display='block';
function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function text(t,x,y,size,color='#f5f6ec',align='center',weight=600){ctx.font=weight+' '+size+'px system-ui';ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(t,x,y);}
function fit(t,max,size){ctx.font='600 '+size+'px system-ui';while(ctx.measureText(t).width>max&&t.length>1)t=t.slice(0,-2)+'…';return t;}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function person(p,x,y,scale,now){
 const active=p.effectUntil>now?p.effect:'',step=Math.sin(elapsed*5+p.color),bounce=step*5+(active==='jump'?-Math.abs(Math.sin(elapsed*10))*35:0);
 ctx.save();ctx.translate(x,y+bounce);ctx.scale(scale,scale);
 ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,10,43,13,0,0,Math.PI*2);ctx.fill();
 if(active==='join'){ctx.strokeStyle='#d6fb79';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,9,48+Math.sin(elapsed*6)*4,17,0,0,Math.PI*2);ctx.stroke();}
 const hue=p.color??90,color='hsl('+hue+' 66% 62%)';
 ctx.lineCap='round';ctx.lineJoin='round';
 ctx.strokeStyle='#263547';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(-13,-37);ctx.lineTo(-18+step*7,-5);ctx.moveTo(13,-37);ctx.lineTo(18-step*7,-5);ctx.stroke();
 round(-35+step*7,-9,28,15,7,'#f0f4e8');round(7-step*7,-9,28,15,7,'#f0f4e8');
 const torso=ctx.createLinearGradient(-29,0,30,0);torso.addColorStop(0,'hsl('+hue+' 55% 39%)');torso.addColorStop(.45,color);torso.addColorStop(1,'hsl('+hue+' 60% 48%)');
 if(active==='glow'||active==='galaxy'){ctx.shadowColor=active==='galaxy'?'#c188ff':'#d6fb79';ctx.shadowBlur=30;}
 ctx.strokeStyle=color;ctx.lineWidth=17;ctx.beginPath();ctx.moveTo(-22,-79);ctx.lineTo(-40,-58+step*11);ctx.moveTo(22,-79);ctx.lineTo(40,-58-step*11);ctx.stroke();
 circle(-40,-56+step*11,9,'#f1c9a2');circle(40,-56-step*11,9,'#f1c9a2');
 round(-29,-91,58,59,22,torso);ctx.shadowBlur=0;
 ctx.fillStyle='#f6f8ed44';ctx.beginPath();ctx.moveTo(-10,-82);ctx.lineTo(0,-70);ctx.lineTo(10,-82);ctx.fill();
 const face=ctx.createRadialGradient(-10,-128,2,0,-121,36);face.addColorStop(0,'#ffdfbb');face.addColorStop(1,'#dba77b');circle(0,-122,33,face);
 const hairColors=['#2a2223','#70422a','#c1a46b','#292e36'];const hair=hairColors[Math.floor(hue/90)%4];circle(-26,-133,10,hair);circle(-14,-149,14,hair);circle(4,-152,17,hair);circle(23,-141,13,hair);
 circle(-11,-124,4,'#30342c');circle(11,-124,4,'#30342c');circle(-12,-126,1.2,'#fff');circle(10,-126,1.2,'#fff');circle(-20,-114,5,'#db8b7c66');circle(20,-114,5,'#db8b7c66');
 ctx.strokeStyle='#995d46';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,-115,8,0,Math.PI);ctx.stroke();
 if(active==='king')text('👑',0,-166,40);
 if(active==='heart')for(let i=0;i<3;i++)text('♥',Math.sin(elapsed*2+i)*45,-160-((elapsed*25+i*23)%45),20,'#ff83ad');
 if(active==='glow')text('✦',44,-136,29,'#e7ffa4');
 round(-78,24,156,34,17,'#111c18f5','#637b49');text(fit(p.name,143,18),0,47,18,p.demo?'#95a18e':'#edf9df');
 ctx.restore();
}
function wrap(t,max,size){
 ctx.font='600 '+size+'px system-ui';const lines=[];let line='';
 for(const word of t.split(/s+/)){if(!word)continue;const next=line?line+' '+word:word;if(ctx.measureText(next).width<=max)line=next;else{if(line)lines.push(line);line='';for(const ch of word){if(ctx.measureText(line+ch).width>max){lines.push(line);line=ch;}else line+=ch;}}}
 if(line)lines.push(line);if(lines.length>3){lines.length=3;lines[2]=fit(lines[2]+'…',max,size);}return lines;
}
function bubble(p,anchor,obstacles,placed){
 const lines=wrap(p.comment,236,22),w=264,h=lines.length*29+26,box=placeBubble(anchor,w,h,obstacles,placed);if(!box)return;
 placed.push({...box,x:box.x-5,y:box.y-5,w:box.w+10,h:box.h+10});
 // Connector is drawn under bodies in the frame; bubbles themselves never touch reserved body/name rectangles.
 ctx.strokeStyle='#d6fb7940';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(anchor.x,anchor.head-9);ctx.lineTo(box.x+box.w/2,box.y+box.h);ctx.stroke();
 round(box.x,box.y,w,h,15,'#f0f5e8');lines.forEach((l,i)=>text(l,box.x+14,box.y+29+i*29,22,'#24321e','left'));
}
function draw(nowFrame){
 const dt=Math.min(.05,(nowFrame-lastFrame)/1000);lastFrame=nowFrame;elapsed+=dt*state.settings.speed;
 const bounds=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),cw=Math.max(1,Math.round(bounds.width*dpr)),ch=Math.max(1,Math.round(bounds.height*dpr));if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;}
 ctx.setTransform(cw/1080,0,0,ch/1920,0,0);ctx.clearRect(0,0,1080,1920);const now=Date.now()+clockOffset,s=state.settings;
 if(!s.transparent){const bg=ctx.createLinearGradient(0,0,1080,1920);bg.addColorStop(0,'#10251f');bg.addColorStop(.55,'#101b19');bg.addColorStop(1,'#182219');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
 for(let i=0;i<32;i++)circle((i*173+31)%1080,(i*277+Math.sin(elapsed*.2+i)*20)%1920,i%3===0?2:1,'#d6fb7928');
 const glow=ctx.createRadialGradient(540,1040,10,540,1040,560);glow.addColorStop(0,'#a4ce5015');glow.addColorStop(1,'#a4ce5000');ctx.fillStyle=glow;ctx.fillRect(0,400,1080,1100);}
 round(420,94,240,48,24,'#d6fb7915','#d6fb7950');text('✳  RODA LIVE',540,126,20,'#d6fb79');text(fit(s.title||'A RODA É SUA',990,72),540,253,72);text(fit(s.subtitle||'',970,27),540,311,27,'#acbca7','center',400);
 const people=state.people.filter(p=>p.expires>now),n=people.length,demo=n?people:Array.from({length:6},(_,i)=>({id:'demo'+i,name:'Sua vaga',color:60+i*46,demo:true}));
 const positions=[],rings=Math.ceil(demo.length/12);
 for(let i=0;i<demo.length;i++){const ring=Math.floor(i/12),inRing=Math.min(12,demo.length-ring*12),index=i%12,angle=index/inRing*Math.PI*2+elapsed*.13*(ring%2?-1:1),radius=350-ring*63,x=540+Math.cos(angle)*radius,y=1000+Math.sin(angle)*(315-ring*62),scale=n>24?.62:n>12?.74:.95;positions.push({p:demo[i],x,y,scale,head:y-240*scale});}
 if(!s.transparent){ctx.fillStyle='#0b1511';ctx.beginPath();ctx.ellipse(540,1045,447,415,0,0,Math.PI*2);ctx.fill();const floor=ctx.createRadialGradient(540,980,10,540,1005,440);floor.addColorStop(0,'#314b2a');floor.addColorStop(1,'#17281c');ctx.fillStyle=floor;ctx.beginPath();ctx.ellipse(540,1005,447,415,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b1db6260';ctx.lineWidth=3;ctx.stroke();}
ctx.strokeStyle='#d6fb7922';ctx.lineWidth=2;for(let i=0;i<rings;i++){ctx.beginPath();ctx.ellipse(540,1005,350-i*63,315-i*62,0,0,Math.PI*2);ctx.stroke();}
 circle(540,1010,82,'#c9f5800b');circle(540,1010,62,'#d6fb7910');text('🌹',540,1018,49);text(n+' NA RODA',540,1073,17,'#d6fb79');
 // Bounds include maximum jump, hearts, crown, name badge, and glow.
 const obstacles=positions.map(a=>({x:a.x-88*a.scale,y:a.y-265*a.scale,w:176*a.scale,h:332*a.scale}));
 const placed=[];
 positions.filter(a=>s.comments&&a.p.commentUntil>now).sort((a,b)=>b.p.commentUntil-a.p.commentUntil).forEach(a=>bubble(a.p,a,obstacles,placed));
 positions.sort((a,b)=>a.y-b.y).forEach(a=>person(a.p,a.x,a.y,a.scale,now));
 if(!n){text('A primeira rosa começa a festa.',540,1490,27,'#bdcfae');text('Seu nome. Seu boneco. Seu lugar na roda.',540,1535,21,'#879b80','center',400);}
 if(flash&&now-flash.at<6500){if(flash.effect==='galaxy'||flash.effect==='king')for(let i=0;i<26;i++)text(flash.effect==='galaxy'?'✦':'✧',(i*137+elapsed*30)%1080,420+(i*89+elapsed*90)%1070,15+i%15,i%2?'#c89aff':'#d6fb79');
 round(100,1640,880,73,22,'#202d21ee','#728b4c');text(fit(flash.icon+' '+flash.message,830,26),540,1687,26,'#e5f6cb');}
 round(130,1765,820,90,45,'#d6fb79');text('🌹  UMA ROSA = SEU LUGAR NA RODA',540,1821,26,'#21321b');requestAnimationFrame(draw);
}
requestAnimationFrame(draw);