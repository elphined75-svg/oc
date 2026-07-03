let state=loadState();
const phases=['아침','점심','저녁','밤'];
const relationBase={친구:60,라이벌:35,가족:70,연인:75,'스승/제자':55,적대:15,'비밀 관계':45,동료:50};
const moods=['평온','기쁨','불안','짜증','설렘','의심','감동','긴장','질투','자신감'];
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,n))}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function addLog(text,type='일상'){const d=new Date();state.logs.unshift({id:uid(),day:state.day,phase:phases[state.phaseIndex],time:d.toLocaleTimeString('ko-KR'),type,text});if(state.logs.length>300)state.logs.pop();saveState();renderAll();}
function makeCharacter(data){state.characters.push({id:uid(),name:data.name,role:data.role,bio:data.bio,image:data.image||'',mood:'평온',energy:80,x:80+Math.random()*500,y:80+Math.random()*380,stats:data.stats});saveState();renderAll();}
function addRelation(from,to,type){if(!from||!to||from===to)return alert('서로 다른 캐릭터 2명을 고르세요.');state.relations.push({id:uid(),from,to,type,score:relationBase[type]??50,tension:type==='적대'?70:20});addLog(`${nameOf(from)}와(과) ${nameOf(to)} 사이에 '${type}' 관계가 생겼다.`,'관계');}
function nameOf(id){return state.characters.find(c=>c.id===id)?.name||'누군가'}
function tick(){state.phaseIndex++;if(state.phaseIndex>=phases.length){state.phaseIndex=0;state.day++;state.characters.forEach(c=>c.energy=clamp(c.energy+18));}runInteraction(false);saveState();renderAll();}
function bigEvent(){const events=['소문이 퍼졌다','비밀 편지가 발견되었다','갑작스러운 대회가 열렸다','누군가 사라졌다는 이야기가 돌았다','축제가 시작되었다','오래된 약속이 다시 떠올랐다'];const e=pick(events);state.relations.forEach(r=>{r.tension=clamp(r.tension+Math.floor(Math.random()*15)-4);r.score=clamp(r.score+Math.floor(Math.random()*9)-4)});addLog(`큰 사건: ${e}. 세계관 전체의 분위기가 흔들리기 시작했다.`,'큰 사건');}
function runInteraction(showAlert=true){if(state.characters.length<2||state.relations.length<1){if(showAlert)alert('캐릭터 2명 이상과 관계 1개 이상이 필요합니다.');return;}const r=pick(state.relations);const a=state.characters.find(c=>c.id===r.from),b=state.characters.find(c=>c.id===r.to);if(!a||!b)return;const res=interactionText(a,b,r);r.score=clamp(r.score+res.score);r.tension=clamp(r.tension+res.tension);a.mood=res.moodA;b.mood=res.moodB;a.energy=clamp(a.energy-3);b.energy=clamp(b.energy-3);addLog(res.text,'상호작용');}
function interactionText(a,b,r){let t=[],score=0,tension=0,moodA='평온',moodB='평온';
 if(r.type==='친구'){t=[`${a.name}이(가) ${b.name}에게 장난을 걸었다. 둘은 한참 웃었다.`,`${b.name}이(가) ${a.name}의 고민을 들어주었다.`,`${a.name}와(과) ${b.name}이(가) 오늘의 계획을 함께 세웠다.`];score=rand(1,5);tension=rand(-4,1);moodA=moodB='기쁨'}
 else if(r.type==='연인'){t=[`${a.name}이(가) ${b.name}에게 조심스러운 마음을 전했다.`,`${a.name}와(과) ${b.name} 사이에 말없이 따뜻한 분위기가 흘렀다.`,`${b.name}이(가) ${a.name}에게 작은 선물을 건넸다.`];score=rand(1,6);tension=rand(-2,3);moodA=moodB='설렘'}
 else if(r.type==='적대'){t=[`${a.name}와(과) ${b.name}이(가) 날카롭게 대립했다.`,`${a.name}이(가) ${b.name}의 말을 믿지 못했다.`,`${b.name}이(가) ${a.name}의 약점을 건드렸다.`];score=rand(-6,1);tension=rand(3,9);moodA='짜증';moodB='의심'}
 else if(r.type==='라이벌'){t=[`${a.name}와(과) ${b.name}이(가) 승부를 약속했다.`,`${b.name}이(가) ${a.name}의 실력을 인정했지만 지고 싶어하지 않았다.`,`${a.name}은(는) ${b.name}을(를) 넘어서겠다고 다짐했다.`];score=rand(-2,4);tension=rand(0,6);moodA=moodB='긴장'}
 else if(r.type==='가족'){t=[`${a.name}이(가) ${b.name}을(를) 걱정했다.`,`${b.name}이(가) ${a.name}에게 잔소리를 했지만 진심이 담겨 있었다.`,`${a.name}와(과) ${b.name}이(가) 오래된 추억을 이야기했다.`];score=rand(0,4);tension=rand(-3,2);moodA=moodB='평온'}
 else if(r.type==='비밀 관계'){t=[`${a.name}와(과) ${b.name}이(가) 아무도 모르게 짧은 대화를 나누었다.`,`${b.name}이(가) ${a.name}에게 의미심장한 눈빛을 보냈다.`,`${a.name}과(와) ${b.name} 사이의 숨겨진 약속이 흔들리기 시작했다.`];score=rand(-1,4);tension=rand(1,7);moodA='의심';moodB='긴장'}
 else{t=[`${a.name}와(과) ${b.name}이(가) 함께 시간을 보냈다.`,`${a.name}이(가) ${b.name}에게 도움을 요청했다.`,`${b.name}은(는) ${a.name}의 새로운 면을 발견했다.`];score=rand(-1,4);tension=rand(-2,4);moodA=pick(moods);moodB=pick(moods)}
 if(r.score>85)t.push(`${a.name}와(과) ${b.name}은(는) 서로를 깊이 신뢰하는 듯했다.`); if(r.tension>80)t.push(`${a.name}와(과) ${b.name} 사이의 긴장감이 폭발 직전까지 올라갔다.`);
 return{text:pick(t),score,tension,moodA,moodB}}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
