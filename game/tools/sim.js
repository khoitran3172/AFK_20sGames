// Mô phỏng người chơi F2P để kiểm tra nhịp kinh tế: node tools/sim.js [phiênMỗiNgày]
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = { console, Math, Date, JSON, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, document: { hidden: false }, window: {}, navigator: {}, setTimeout, toast() {}, location: {} };
vm.createContext(ctx);
for (const f of ['data', 'state', 'game', 'battle']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', f + '.js'), 'utf8'), ctx, { filename: f });
const run = c => vm.runInContext(c, ctx);
const sessionsPerDay = +process.argv[2] || 4;
run(`
S.first = Date.now(); S.devOffset = 0; S.last = nowMs(); gameInit();
function playSession() {
  ensureDay(); ensureWeek();
  if (S.loginClaimed !== S.daily.key) claimLogin();
  collectAllCaravans(); sellAll();
  // daily
  for (const q of DAILY) claimDaily(q.id); AP_CHESTS.forEach((c,i)=>claimApChest(i));
  for (const j of JOURNEY) for (const g of j.goals) claimGoal(g.id);
  ACH.forEach(a=>{for(let i=0;i<8;i++)claimAch(a.id)}); PASS.forEach((_,i)=>claimPass(i)); claimWeek();
  // gacha: tân thủ + dùng hết vé/ngọc theo x10
  if (!S.tut.tenUsed) doPull('hero',10);
  claimGift();
  while (S.tickets + Math.floor(S.gems/COST.pull) >= 10) doPull('hero',10);
  while (S.ssrPick>0) claimSsrPick(ssrFeatured());
  // gán anh hùng tốt nhất
  for (const slot of ['farm','lumber','mine','garden','trade']) { const best = HEROES.filter(h=>S.own[h.id]).sort((a,b)=>heroBuff(b,slot)-heroBuff(a,slot))[0]; if (best && heroBuff(best,slot) > slotBuff(slot)) assignHero(slot,best.id); }
  // nâng cấp: ưu tiên ROI (sản lượng / chi phí)
  for (let n=0;n<400;n++) {
    let best=null,bv=0;
    for (const k of BKEYS) { if(!dayUnlocked(BUILD[k].unlockDay)) continue; const c=upCost(k); if(S.gold<c) continue; const v=BUILD[k].base*BUILD[k].good.length/c*(GOOD[BUILD[k].good].price); if(v>bv){bv=v;best=['b',k];} }
    for (const k of FKEYS) { if(!dayUnlocked(FAC[k].unlockDay)||S.fac[k]>=FAC[k].max) continue; const c=facCost(k); if(S.gold<c*1.0) continue; const v=0.5/c; if(v>bv*0.7 && S.fac[k] < 6+S.guildLv){bv=v;best=['f',k];} }
    if(!best)break; best[0]==='b'?upgradeBuild(best[1]):upgradeFac(best[1]);
  }
  for (const h of HEROES) if(S.own[h.id]) for(let i=0;i<30&&S.gold>heroLvCost(h,S.own[h.id])*4;i++) levelHero(h.id);
  // thương đoàn: tuyến dài nhất có thể
  while (S.caravans.length < caravanSlots()) { let r=-1; for(let i=ROUTES.length-1;i>=0;i--) if(dayUnlocked(ROUTES[i].unlockDay)){r=i;break;} if(r<0||S.gold<100)break; const before=S.caravans.length; sendCaravan(r,0.5); if(S.caravans.length===before)break; }
  if (canPrestige() && S.prestige.run > 4*50000*Math.pow(S.prestige.count+1,2)) doPrestige();
}
const marks = [];
function wrAt(n,k){ let w=0; const team=autoTeam(); for(let i=0;i<k;i++) if(simulateBattle(team,stageDef(n))==='win') w++; return w/k; }
function battleReach(){ let best=0; for(let n=1;n<=STAGE_N;n++){ if(wrAt(n,40)>=0.5) best=n; else if(n>best+2) break; } return best; }
function snapshot(label){ const owned=Object.keys(S.own).map(i=>HEROES[i]); marks.push(label+' | vàng/s='+goldRate().toFixed(0)+' | tổng Lv='+BKEYS.reduce((a,k)=>a+S.lv[k],0)+' | hero '+owned.length+' (SSR '+owned.filter(h=>h.r==='SSR').length+') | lượt quay '+S.stats.pulls+' | ngọc '+S.gems+' | guild '+S.guildLv+' | renown '+S.renown+' | prestige '+S.prestige.count+' | rank '+S.rank+' | ĐẤU THẺ qua màn ~'+battleReach()+' (thẻ '+ownedHeroes().length+')'); }
`);
const days = +process.argv[3] || 14;
const sched = { 1: [8, 20], 2: [8, 13, 20], 3: [8, 12, 17, 21], 4: [8, 12, 17, 21, 23], 6: [7, 9, 12, 15, 18, 21] }[sessionsPerDay] || [8, 12, 17, 21];
run(`S.devOffset = 0;`);
for (let d = 0; d < days; d++) {
  for (const h of sched) {
    // chuyển tới giờ h của ngày d
    const target = (() => { const base = new Date(Date.now()); base.setHours(0, 0, 0, 0); return base.getTime() + d * 86400000 + h * 3600000; })();
    run(`(()=>{ const dt = ${target} - nowMs(); if (dt>0) { S.devOffset += dt; lastTick = nowMs()-dt; gameTick(); } })()`);
    run('playSession()');
  }
  if ([0, 1, 2, 3, 6, 13].includes(d)) run(`snapshot('Cuối ngày ${d + 1}')`);
}
for (const m of run('marks')) console.log(m);
