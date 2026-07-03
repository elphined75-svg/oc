let characters = [];
let relations = [];
let logs = [];
let day = 1;
let autoTimer = null;
let dragging = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

const moods = ["평온", "기쁨", "불안", "짜증", "설렘", "의심", "감동", "긴장", "슬픔", "자신감"];
const map = document.getElementById("relationshipMap");
const lineLayer = document.getElementById("lineLayer");

function addCharacter() {
  const name = document.getElementById("charName").value.trim();
  const role = document.getElementById("charRole").value.trim();
  const desc = document.getElementById("charDesc").value.trim();
  const file = document.getElementById("charImage").files[0];

  if (!name) return alert("캐릭터 이름을 입력하세요.");

  if (file) {
    const reader = new FileReader();
    reader.onload = e => createCharacter(name, role, desc, e.target.result);
    reader.readAsDataURL(file);
  } else {
    createCharacter(name, role, desc, "");
  }
}

function createCharacter(name, role, desc, image) {
  const char = {
    id: "c" + Date.now() + Math.floor(Math.random() * 9999),
    name,
    role,
    desc,
    image,
    mood: "평온",
    energy: rand(45, 90),
    charm: rand(30, 95),
    logic: rand(30, 95),
    chaos: rand(10, 90),
    x: rand(60, 650),
    y: rand(60, 480)
  };
  characters.push(char);
  clearInputs();
  addLog("등장", `${name}이(가) 세계관에 등장했다.`);
  renderAll();
  saveGame();
}

function clearInputs() {
  document.getElementById("charName").value = "";
  document.getElementById("charRole").value = "";
  document.getElementById("charDesc").value = "";
  document.getElementById("charImage").value = "";
}

function addRelation() {
  const from = document.getElementById("fromChar").value;
  const to = document.getElementById("toChar").value;
  const type = document.getElementById("relationType").value;
  if (!from || !to) return alert("캐릭터가 2명 이상 필요합니다.");
  if (from === to) return alert("서로 다른 캐릭터를 선택하세요.");

  relations.push({ id: "r" + Date.now(), from, to, type, score: initialScore(type) });
  const a = getChar(from), b = getChar(to);
  addLog("관계", `${a.name}와(과) ${b.name}의 관계가 '${type}'으로 설정되었다.`);
  renderAll();
  saveGame();
}

function initialScore(type) {
  const table = { "친구": 60, "가족": 70, "연인": 75, "동료": 55, "스승/제자": 55, "라이벌": 38, "적대": 15, "비밀 관계": 45 };
  return table[type] || 50;
}

function nextTurn() {
  if (characters.length < 2) return alert("캐릭터를 2명 이상 만들어주세요.");
  day++;
  for (let i = 0; i < Math.min(3, Math.max(1, relations.length)); i++) runInteraction();
  if (Math.random() < 0.28) generateBigEvent(false);
  characters.forEach(c => c.energy = clamp(c.energy + rand(-8, 10), 0, 100));
  renderAll();
  saveGame();
}

function runInteraction() {
  if (relations.length === 0) return;
  const rel = relations[rand(0, relations.length - 1)];
  const a = getChar(rel.from), b = getChar(rel.to);
  if (!a || !b) return;

  const result = makeScene(a, b, rel);
  rel.score = clamp(rel.score + result.change, 0, 100);
  a.mood = result.moodA;
  b.mood = result.moodB;
  a.energy = clamp(a.energy + result.energyA, 0, 100);
  b.energy = clamp(b.energy + result.energyB, 0, 100);
  addLog("상호작용", result.text);
}

function makeScene(a, b, rel) {
  const type = rel.type;
  const score = rel.score;
  let list = [];
  let change = 0;
  let moodA = pick(moods), moodB = pick(moods);
  let energyA = rand(-5, 4), energyB = rand(-5, 4);

  if (type === "친구") {
    list = [
      `${a.name}이(가) ${b.name}에게 장난을 걸었다. ${b.name}은(는) 웃으며 받아쳤다.`,
      `${a.name}와(과) ${b.name}이(가) 밤늦게까지 서로의 고민을 들어주었다.`,
      `${b.name}이(가) ${a.name}을(를) 도와 작은 문제를 해결했다.`
    ];
    change = rand(1, 5); moodA = "기쁨"; moodB = "기쁨";
  } else if (type === "연인") {
    list = [
      `${a.name}와(과) ${b.name}이(가) 둘만 아는 약속을 나누었다.`,
      `${a.name}이(가) ${b.name}에게 조심스럽게 진심을 전했다.`,
      `${b.name}은(는) ${a.name}의 작은 변화까지 알아차렸다.`
    ];
    change = rand(1, 6); moodA = "설렘"; moodB = "설렘";
  } else if (type === "라이벌") {
    list = [
      `${a.name}와(과) ${b.name}이(가) 실력을 겨루었다. 승부는 쉽게 나지 않았다.`,
      `${b.name}은(는) ${a.name}을(를) 인정하면서도 절대 지고 싶지 않아 했다.`,
      `${a.name}의 한마디에 ${b.name}의 자존심이 살짝 흔들렸다.`
    ];
    change = rand(-2, 4); moodA = "긴장"; moodB = "자신감";
  } else if (type === "적대") {
    list = [
      `${a.name}와(과) ${b.name}이(가) 날카롭게 대립했다. 주변 공기가 차갑게 식었다.`,
      `${a.name}은(는) ${b.name}의 의도를 의심했다.`,
      `${b.name}이(가) ${a.name}의 약점을 건드렸다. 갈등이 깊어졌다.`
    ];
    change = rand(-6, 1); moodA = "짜증"; moodB = "의심";
  } else if (type === "가족") {
    list = [
      `${a.name}이(가) ${b.name}을(를) 걱정했다. 표현은 서툴렀지만 진심이었다.`,
      `${b.name}이(가) ${a.name}에게 잔소리를 했다. 이상하게도 따뜻한 잔소리였다.`,
      `${a.name}와(과) ${b.name}이(가) 오래된 추억을 떠올렸다.`
    ];
    change = rand(0, 4); moodA = "평온"; moodB = "감동";
  } else if (type === "비밀 관계") {
    list = [
      `${a.name}와(과) ${b.name}이(가) 아무도 모르게 짧은 대화를 나누었다.`,
      `${b.name}은(는) ${a.name}에게 의미심장한 눈빛을 보냈다.`,
      `${a.name}과(와) ${b.name} 사이에 숨겨진 약속이 생겼다.`
    ];
    change = rand(-1, 5); moodA = "의심"; moodB = "긴장";
  } else {
    list = [
      `${a.name}와(과) ${b.name}이(가) 함께 일을 처리했다.`,
      `${a.name}은(는) ${b.name}의 능력을 새롭게 보게 되었다.`,
      `${b.name}이(가) ${a.name}에게 조언을 건넸다.`
    ];
    change = rand(0, 4); moodA = "평온"; moodB = "기쁨";
  }

  if (score >= 85) list.push(`${a.name}와(과) ${b.name}은(는) 말하지 않아도 서로의 마음을 이해했다.`);
  if (score <= 15) list.push(`${a.name}와(과) ${b.name} 사이의 관계는 곧 폭발할 듯 위태로웠다.`);
  if (a.chaos + b.chaos > 140 && Math.random() < 0.3) {
    list.push(`${a.name}와(과) ${b.name}은(는) 충동적으로 예상 밖의 사고를 쳤다.`);
    change += rand(-4, 3);
  }
  return { text: pick(list), change, moodA, moodB, energyA, energyB };
}

function generateBigEvent(showAlert = true) {
  if (characters.length === 0) return showAlert && alert("캐릭터가 필요합니다.");
  const a = pick(characters);
  const b = characters.length > 1 ? pick(characters.filter(c => c.id !== a.id)) : null;
  const events = [
    `${a.name}이(가) 숨겨왔던 비밀의 일부를 들켜버렸다.`,
    `${a.name}에게 중요한 선택의 순간이 찾아왔다.`,
    `${a.name}이(가) 오래전 잊고 있던 기억을 떠올렸다.`,
    b ? `${a.name}와(과) ${b.name}이(가) 예상치 못한 사건에 함께 휘말렸다.` : `${a.name}의 하루가 이상하게 꼬이기 시작했다.`,
    b ? `${b.name}이(가) ${a.name}에게 큰 오해를 품게 되었다.` : `${a.name} 주변에 수상한 소문이 돌기 시작했다.`
  ];
  a.mood = pick(["불안", "긴장", "의심", "자신감", "감동"]);
  if (b) b.mood = pick(["불안", "긴장", "기쁨", "짜증"]);
  addLog("큰 사건", pick(events));
  renderAll();
  saveGame();
}

function toggleAuto() {
  const btn = document.getElementById("autoBtn");
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    btn.textContent = "자동 진행 시작";
    document.getElementById("autoText").textContent = "정지";
  } else {
    autoTimer = setInterval(nextTurn, 4000);
    btn.textContent = "자동 진행 정지";
    document.getElementById("autoText").textContent = "진행 중";
  }
}

function renderAll() {
  document.getElementById("dayText").textContent = `${day}일차`;
  renderSelects();
  renderCharacters();
  renderMap();
  renderLogs();
}

function renderSelects() {
  const from = document.getElementById("fromChar");
  const to = document.getElementById("toChar");
  from.innerHTML = ""; to.innerHTML = "";
  characters.forEach(c => {
    from.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
    to.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`;
  });
}

function renderCharacters() {
  const box = document.getElementById("characterList");
  box.innerHTML = "";
  characters.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="cardTop">
        ${c.image ? `<img src="${c.image}">` : `<img src="" alt="사진 없음">`}
        <div>
          <h3>${escapeHtml(c.name)}</h3>
          <div>${escapeHtml(c.role || "역할 없음")}</div>
          <div class="stat">기분: ${c.mood}</div>
        </div>
      </div>
      <p>${escapeHtml(c.desc || "설정 없음")}</p>
      ${statBar("에너지", c.energy)}
      ${statBar("매력", c.charm)}
      ${statBar("논리", c.logic)}
      ${statBar("혼돈", c.chaos)}
      <button class="smallBtn" onclick="deleteCharacter('${c.id}')">삭제</button>
    `;
    box.appendChild(card);
  });
}

function statBar(name, value) {
  return `<div class="stat">${name}: ${value}</div><div class="bar"><div class="fill" style="width:${value}%"></div></div>`;
}

function renderMap() {
  if (!map) return;

  map.querySelectorAll(".node").forEach(n => n.remove());
  lineLayer.innerHTML = "";

  // 같은 두 캐릭터 사이에 관계가 여러 개 있으면 직선이 겹치므로,
  // 같은 쌍끼리 묶은 뒤 곡선의 휘어짐 정도를 다르게 준다.
  const pairGroups = {};
  relations.forEach(r => {
    const a = getChar(r.from), b = getChar(r.to);
    if (!a || !b) return;

    const key = [r.from, r.to].sort().join("__");
    if (!pairGroups[key]) pairGroups[key] = [];
    pairGroups[key].push(r);
  });

  Object.values(pairGroups).forEach(group => {
    const total = group.length;

    group.forEach((r, index) => {
      const a = getChar(r.from), b = getChar(r.to);
      if (!a || !b) return;

      const x1 = a.x + 75, y1 = a.y + 55;
      const x2 = b.x + 75, y2 = b.y + 55;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

      // 선에 수직인 방향. 이 방향으로 제어점을 이동시켜 곡선을 만든다.
      const normalX = -dy / distance;
      const normalY = dx / distance;

      // 1개면 거의 직선, 2개 이상이면 좌우로 벌어지게 한다.
      const curveGap = 34;
      const curveOffset = (index - (total - 1) / 2) * curveGap;

      const controlX = midX + normalX * curveOffset;
      const controlY = midY + normalY * curveOffset;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", relationColor(r.type));
      path.setAttribute("stroke-width", "3");
      path.setAttribute("stroke-linecap", "round");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", controlX);
      text.setAttribute("y", controlY - 8);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "relationText");
      text.textContent = `${r.type} ${r.score}`;

      // 글자가 선과 너무 붙지 않도록 흰색 배경을 깔아준다.
      const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "text");
      labelBg.setAttribute("x", controlX);
      labelBg.setAttribute("y", controlY - 8);
      labelBg.setAttribute("text-anchor", "middle");
      labelBg.setAttribute("class", "relationTextBg");
      labelBg.textContent = `${r.type} ${r.score}`;

      lineLayer.appendChild(path);
      lineLayer.appendChild(labelBg);
      lineLayer.appendChild(text);
    });
  });

  characters.forEach(c => {
    const node = document.createElement("div");
    node.className = "node";
    node.style.left = c.x + "px";
    node.style.top = c.y + "px";
    node.innerHTML = `${c.image ? `<img src="${c.image}">` : ""}<div class="nodeName">${escapeHtml(c.name)}</div><div class="nodeMood">${c.mood}</div>`;
    node.addEventListener("mousedown", e => { dragging = c; dragOffsetX = e.offsetX; dragOffsetY = e.offsetY; });
    map.appendChild(node);
  });
}

document.addEventListener("mousemove", e => {
  if (!dragging) return;
  const rect = map.getBoundingClientRect();
  dragging.x = clamp(e.clientX - rect.left - dragOffsetX, 0, Math.max(0, map.clientWidth - 160));
  dragging.y = clamp(e.clientY - rect.top - dragOffsetY, 0, Math.max(0, map.clientHeight - 130));
  renderMap();
});
document.addEventListener("mouseup", () => { if (dragging) saveGame(); dragging = null; });

function relationColor(type) {
  return { "친구":"#10b981", "라이벌":"#f59e0b", "가족":"#3b82f6", "연인":"#ec4899", "동료":"#14b8a6", "스승/제자":"#6366f1", "적대":"#ef4444", "비밀 관계":"#6b7280" }[type] || "#7c3aed";
}

function renderLogs() {
  const box = document.getElementById("storyLog");
  box.innerHTML = "";
  logs.forEach(log => {
    const div = document.createElement("div");
    div.className = "logItem";
    div.innerHTML = `<div class="logMeta">${log.day}일차 · ${log.type}</div><div>${escapeHtml(log.text)}</div>`;
    box.appendChild(div);
  });
}

function addLog(type, text) {
  logs.unshift({ day, type, text });
  if (logs.length > 200) logs.pop();
}

function showTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tabContent").forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");
  document.getElementById(name + "Tab").classList.add("active");
  renderMap();
}

function deleteCharacter(id) {
  if (!confirm("이 캐릭터를 삭제할까요?")) return;
  const c = getChar(id);
  characters = characters.filter(x => x.id !== id);
  relations = relations.filter(r => r.from !== id && r.to !== id);
  addLog("퇴장", `${c ? c.name : "캐릭터"}이(가) 세계관에서 사라졌다.`);
  renderAll(); saveGame();
}

function saveGame() {
  localStorage.setItem("ocWorldGame", JSON.stringify({ characters, relations, logs, day }));
}

function loadGame() {
  const saved = localStorage.getItem("ocWorldGame");
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    characters = data.characters || [];
    relations = data.relations || [];
    logs = data.logs || [];
    day = data.day || 1;
  } catch(e) { console.error(e); }
}

function resetGame() {
  if (!confirm("정말 모든 데이터를 삭제할까요?")) return;
  characters = []; relations = []; logs = []; day = 1;
  localStorage.removeItem("ocWorldGame");
  renderAll();
}

function getChar(id) { return characters.find(c => c.id === id); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

loadGame();
renderAll();
