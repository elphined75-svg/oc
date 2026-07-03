const STORE_KEY='oc_world_complete_v1';
function defaultState(){return{world:{name:'나의 자캐 세계관',desc:'캐릭터를 만들고, 관계를 연결하고, 자동으로 이야기가 진행되게 해보세요.'},day:1,phaseIndex:0,characters:[],relations:[],logs:[]}}
function saveState(){localStorage.setItem(STORE_KEY,JSON.stringify(state));}
function loadState(){try{return JSON.parse(localStorage.getItem(STORE_KEY))||defaultState()}catch(e){return defaultState()}}
function downloadFile(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
