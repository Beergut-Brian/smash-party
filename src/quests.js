/* Smash Party — QUESTS: the Adventure quest engine (L35). Owner: Claude Code (logic-gameplay).
   Loaded after the world files and before src/world/quests/*.js (the quest packs, listed in src/world/quests/index.json)
   and game.js. Everything here runs only in Adventure (questOn); Arcade never sees a giver.

   Quest packs call registerQuest({...}) (full contract in CLAUDE.md, "Quests"; spec docs/ADVENTURE.md §4):
     id, world:'home', chapter:1–4, main:true|false,
     giver:{id, name, emoji, voice, at:[x,z] | spot:'kind', r?, build(){…group facing +Z, ~4.5 long at car scale 1}},
     needs:['other_quest' | 'ability'], stage:'scene id', stageAt:[x,z], stageR?,
     remind:['line',…], steps:[{do, n, icon, item, kind, type, at, voice, say:{start,each,got,hint}}…],
     Any line can be a string or {text, voice} (L40: two characters on one giver, e.g. Zorp & Blip); a step's
     `voice` overrides the giver's for that step. find: `lift:true` sits the item on top of whatever it lands on
     (touch that thing to grab it), `clear:true` pops props off its spot, `y` floats it that high (jump/hover to it).
     smash: `reveal:'item'` pops that item out of the last one smashed (grab it to finish; a `bring` can follow).
     reward:{ability, cosmetic, stars, say:[…]}, after:['idle line',…]
   Step verbs: talk, find, bring, catch, smash, deliver, rings, push, reach, boss (see questStepStart).
   Size-proof: givers, items, critters, rings and drop spots are all built at car scale 1 and scaled by S (the players'
   car scale), and a step's things are rebuilt at the new size when the players grow mid-quest. World spots stay put.
   Nothing can fail and nothing has a timer: things that run away stay in the stage, items never drop. */
const QUESTS={},QUEST_LIST=[];
const QUEST_CHAPTERS=4;
const QUEST_ABILITIES=['hammer','shoot','hover','dozer','glide','stomp','sugarrush']; // what they do lives in game.js (L36, land abilities L42)
const QUEST_LAND_ABIL=['stomp','sugarrush']; // L42: earned in a land; in Adventure off until a quest hands it out (even before the land's pack exists)
let questOn=/[?&](adventure|mode=adventure)\b/.test(location.search); // L36 sets this from the start screen
const questDone=new Set(),questAbil=new Set(),questCos=new Set(),questProg={};
let questA=null; // the active quest: {q, si (step index), st (step state)}
function registerQuest(q){
  if(!q||!q.id||!Array.isArray(q.steps)){console.warn('registerQuest: needs id and steps',q);return;}
  q.world=q.world||'home';q.chapter=clamp(q.chapter||1,1,QUEST_CHAPTERS);q.giver=q.giver||{};q.giver.id=q.giver.id||q.id;
  if(QUESTS[q.id])QUEST_LIST.splice(QUEST_LIST.indexOf(QUESTS[q.id]),1);QUESTS[q.id]=q;QUEST_LIST.push(q);return q;}
const hasAbility=id=>!questOn||questAbil.has(id)||(!QUEST_LAND_ABIL.includes(id)&&!QUEST_LIST.some(q=>q.reward&&q.reward.ability===id)); // Arcade: everything; Adventure: earned, or no quest gives it out yet
const questWorld=()=>typeof worldId!=='undefined'?worldId:'home'; // L33 worlds
const questChapter=()=>carTierNow()+1;
const questOpen=q=>q.world===questWorld()&&q.chapter<=questChapter()&&!questDone.has(q.id)&&(q.needs||[]).every(n=>questDone.has(n)||questAbil.has(n));
const questMain=ch=>QUEST_LIST.find(q=>q.main&&q.chapter===ch&&q.world===questWorld());
// LEVEL UP into the next car tier waits for the chapter's main quest → the giver's emoji for the button, else null
function questBlocksLevel(){
  if(!questOn||giant||Math.min(3,Math.floor((tier+1)/2))===carTierNow())return null;
  const m=questMain(questChapter());return m&&!questDone.has(m.id)?(m.giver.emoji||'❗'):null;}
function questNudge(){const m=questMain(questChapter());if(!m)return;showBig((m.giver.emoji||'')+'❗');sfx.boing();
  questSpeak([pick(m.remind||[`Help ${m.giver.name||'me'} first!`])],m.giver.voice);questPoint=m.id;}
let questPoint=null; // the quest the arrow points at while nothing is active

/* ---------- talking ---------- */
const questTalk=[];let questTalkT=0;
function questSpeak(lines,voice,gv){if(!lines)return;if(!Array.isArray(lines))lines=[lines];
  for(const l of lines){if(!l)continue;const o=typeof l==='string'?{text:l}:l;if(!o.text)continue;(talkS?talkS.cards:questTalk).push({text:String(o.text),voice:o.voice||voice,gv});}} // L45: while a talk scene is open, lines become its cards
const questVoice=(q,s)=>(s&&s.voice)||q.giver.voice; // L40: a step can speak in another voice
function questSayNow(text,voice){try{return say(text,voice?{voice,prio:true}:{prio:true});}catch(e){return say(text);}} // prio: L46's priority voice (ignored until then)
function updateQuestTalk(dt){
  if((questTalkT-=dt)>0)return;const l=questTalk.shift();if(!l)return;
  questSayNow(l.text,l.voice);questTalkT=0.7+l.text.split(/\s+/).length*0.36;
  if(l.gv){l.gv.talkT=questTalkT+0.6;l.gv.wob=1;}}
const questTalking=()=>questTalk.length>0||questTalkT>0;

/* ---------- givers ---------- */
const questGivers={}; // giver id → {q (its current quest), g, x, z, r, shown, balloon, bubble, talkT, wob, cool}
function questGiverLook(gd){
  if(typeof gd.build==='function'){try{const g=gd.build();if(g)return g;}catch(e){console.warn('giver build',gd.id,e);}}
  // placeholder: a blocky little car with big eyes, in the giver's color
  const g=new THREE.Group(),c=gd.color||'#ffbe0b';
  g.add(mk('box',2.4,1.1,4.0,c,0,1.0,0),mk('box',2.0,1.1,2.0,'#e9f5ff',0,2.05,-0.4));
  for(const sx of [-0.45,0.45])g.add(mk('sph',0.55,0.6,0.3,'#ffffff',sx,2.15,0.62),mk('sph',0.26,0.3,0.2,'#111111',sx,2.12,0.76));
  for(const [x,z] of [[-1.2,1.3],[1.2,1.3],[-1.2,-1.3],[1.2,-1.3]])g.add(mk('cyl',1,0.5,1,'#222222',x,0.5,z).rotateZ(Math.PI/2));
  if(gd.hat)g.add(mk('sph',1.5,0.9,1.5,gd.hat,0,2.7,-0.4));
  return g;}
function questGiverAt(q){const gd=q.giver;if(gd.at)return gd.at;if(gd.spot){const s=questFindSpot(gd.spot);if(s)return [s.x,s.z];}return null;}
function questFindSpot(kind){let best=null,bd=1e18;const px=players[0]?players[0].x:0,pz=players[0]?players[0].z:0;
  for(const c of chunks.values())for(const s of c.spots||[])if(s.kind===kind){const d=(s.x-px)**2+(s.z-pz)**2;if(d<bd){bd=d;best=s;}}return best;}
function questDiv(cls,html){const el=document.createElement('div');el.className=cls;el.innerHTML=html;el.style.display='none';$('tags').appendChild(el);return el;}
// which quest each giver stands for right now: the active one, else an open one (main first), else its last done one
function questGiverQuest(gid){
  const mine=QUEST_LIST.filter(q=>q.giver.id===gid&&q.world===questWorld());
  if(questA&&questA.q.giver.id===gid)return questA.q;
  return mine.filter(questOpen).sort((a,b)=>(b.main?1:0)-(a.main?1:0))[0]||mine.filter(q=>questDone.has(q.id)).pop()||null;}
function updateGivers(dt){
  const on=questOn&&!roomZ&&state==='play'&&!garageAll();const R=streamR();
  const ids=new Set(QUEST_LIST.map(q=>q.giver.id));
  for(const gid of ids){
    let gv=questGivers[gid];const q=on?questGiverQuest(gid):null,at=q&&questGiverAt(q);
    let near=1e9;if(at)for(const p of players)near=Math.min(near,Math.hypot(p.x-at[0],p.z-at[1]));
    const want=!!(q&&at&&near<R);
    if(!want){if(gv&&gv.shown)questGiverHide(gv);continue;}
    if(!gv)gv=questGivers[gid]={id:gid,talkT:0,wob:0,cool:0,face:Math.PI};
    if(!gv.shown||gv.q!==q){if(gv.shown)questGiverHide(gv);gv.q=q;gv.g=questGiverLook(q.giver);if(typeof carMerge==='function')gv.m=carMerge({g:gv.g});
      scene.add(gv.g);gv.shown=true;gv.x=at[0];gv.z=at[1];
      gv.balloon=questDiv('questBalloon',q.giver.emoji||'❗');gv.bubble=questDiv('questBubble','');gv.aBub=questDiv('talkA',`<b class="btnA">A</b><i>${q.giver.emoji||'❗'}</i>`);}
    gv.q=q;const s=S,done=questDone.has(q.id),r=(q.giver.r||2.3)*s;gv.r=r;
    // face the nearest car, bob, wobble while talking
    let np=null,nd=1e9;for(const p of players){const d=Math.hypot(p.x-gv.x,p.z-gv.z);if(d<nd){nd=d;np=p;}}
    if(np&&nd<r*8){const want2=Math.atan2(np.x-gv.x,np.z-gv.z);gv.face+=clamp(angDiff(want2,gv.face),-dt*3,dt*3);}
    gv.wob=Math.max(0,gv.wob-dt*1.5);gv.talkT=Math.max(0,gv.talkT-dt);
    const bob=Math.abs(Math.sin(T*(gv.talkT>0?9:2.4)))*(gv.talkT>0?0.35:0.12)*s;
    gv.g.position.set(gv.x,groundH(gv.x,gv.z)+bob,gv.z);gv.g.rotation.set(0,gv.face+Math.sin(T*20)*0.08*gv.wob,Math.sin(T*17)*0.05*gv.wob);gv.g.scale.setScalar(s);
    // cars bump into givers (solid) and that's how you talk to them; QA14: one with nothing left to ask lets cars drive through
    // (it still chats when you do), so a finished giver on the road or by a gate can't wedge a car
    let touch=null;
    for(const p of players){const dx=p.x-gv.x,dz=p.z-gv.z,d=Math.hypot(dx,dz)||0.01,rr=p.r+r;
      if(d<rr){if(!done){p.x=gv.x+dx/d*rr;p.z=gv.z+dz/d*rr;p.speed*=0.5;}touch=p;}}
    if(touch){if(!gv.cool){gv.cool=1;questTouch(gv,touch);}}else if(!np||nd>r*2.5+np.r*2)gv.cool=0; // drive away and back to talk again
    // the "!" balloon (gold = main, blue = side) on open quests; the picture bubble while they talk
    const top=(q.giver.h||3.4)*s;
    const showB=!done&&!(questA&&questA.q===q);questProj(gv.balloon,gv.x,top+(1.2+0.3*Math.sin(T*4))*s,gv.z,showB);
    gv.balloon.classList.toggle('main',!!q.main);
    // L45: the big A bubble when a car is close and the giver has something to say (press A to talk)
    gv.near=!talkS&&!done&&nd<r+TALK_NEAR*QUEST_CAR_L*s;questProj(gv.aBub,gv.x,top+(showB?2.9:1.4)*s+(0.2*Math.sin(T*6))*s,gv.z,gv.near);
    const showP=gv.talkT>0&&questA&&questA.q===q;if(showP)gv.bubble.innerHTML=questBubbleHtml();
    questProj(gv.bubble,gv.x,top+1.4*s,gv.z,showP);}
}
function questGiverHide(gv){scene.remove(gv.g);if(gv.m&&typeof carUnmerge==='function')carUnmerge(gv.m);gv.balloon.remove();gv.bubble.remove();gv.aBub.remove();gv.shown=false;gv.near=false;gv.g=null;}
const _qv=new THREE.Vector3();
function questProj(el,x,y,z,show){if(!show){el.style.display='none';return;}_qv.set(x,y,z).project(camera);
  if(_qv.z>1||Math.abs(_qv.x)>1.1||Math.abs(_qv.y)>1.1){el.style.display='none';return;}
  el.style.display='';el.style.left=((_qv.x+1)/2*innerWidth)+'px';el.style.top=((1-_qv.y)/2*innerHeight)+'px';}
// driving into a giver
// (and pressing A next to one, L45): a new quest or a reminder opens the talk scene
function questTouch(gv,p){
  if(talkS)return;const q=gv.q,gd=q.giver;
  if(questDone.has(q.id)){questSpeak([pick(q.after||['Thanks again!'])],gd.voice,gv);return;}
  if(!questA||questA.q!==q){talkOpen(gv,'start');return;}
  const s=questA.q.steps[questA.si];
  if(s.do==='bring'){questBring(gv);return;}
  if(s.do==='talk')return;
  talkOpen(gv,'remind');}

/* ---------- running a quest ---------- */
function questStart(q,quiet){
  if(questA)questStepEnd(false);
  questA={q,si:0,st:null};const pr=questProg[q.id]||(questProg[q.id]={step:0,n:0});questA.si=Math.min(pr.step,q.steps.length-1);
  if(!quiet){sfxClip('quest_start',0.8)||sfx.join();}
  questStepStart();}
function questGv(){return questA&&questGivers[questA.q.giver.id];}
function questStageCenter(q){
  const sp=questFindSpot('quest_'+q.id);if(sp)return [sp.x,sp.z,Math.min(Math.max(sp.hx,sp.hz),(q.stageR||10)*4.5*qS())];
  const R=(q.stageR||8)*4.5*qS();if(q.stageAt)return [q.stageAt[0],q.stageAt[1],R];
  const at=questGiverAt(q)||[players[0].x,players[0].z];return [at[0],at[1]-R*1.4,R];}
function questStepStart(){
  const A=questA,q=A.q,s=q.steps[A.si],pr=questProg[q.id],gv=questGv(),voice=questVoice(q,s);
  const n=s.n||1,c=questStageCenter(q),st=A.st={s,n,got:pr.n||0,things:[],tier,cx:c[0],cz:c[1],R:c[2],t:0};
  if(A.si===0&&q.stage&&typeof sceneAt==='function'&&!A.scene){A.scene=true; // L38; a stage design hasn't built yet is skipped quietly (L40)
    if(typeof sceneDef!=='function'||sceneDef(q.stage,zoneXZ(c[0],c[1])))try{A.scene=sceneAt(q.stage,c[0],c[1],0,null,{key:'quest_'+q.id})||true;}catch(e){console.warn('sceneAt',e);}}
  const say0=s.say&&!Array.isArray(s.say)&&s.say.start;
  switch(s.do){
    case 'talk':questSpeak(Array.isArray(s.say)?s.say:[].concat(s.say||[]),voice,gv);st.wait=true;break;
    case 'find':for(let i=st.got;i<n;i++)st.things.push(questItem(s,questPlace(s,st,i)));break;
    case 'bring':break;
    case 'catch':st.flock=questFlock(s.kind||'chicken',n-st.got,st);break;
    case 'smash':for(let i=st.got;i<n;i++){const o=questSmashThing(s,questPlace(s,st,i));if(o)st.things.push(o);}
      if(s.reveal&&st.got>=n)questReveal(st,[st.cx,st.cz]);break; // grew (or loaded) after the last one: the item waits in the stage
    case 'deliver':for(let i=0;i<n;i++)st.things.push(questDrop(s,questRingPos(s,st,i,n),i<st.got));break;
    case 'rings':for(let i=0;i<n;i++)st.things.push(questRing(s,questRingPos(s,st,i,n),i<st.got));questRingAim(st);break;
    case 'push':st.goal=questGoal(s,st);for(let i=st.got;i<n;i++)st.things.push(questPushable(s,questPlace(s,st,i,true)));break;
    case 'reach':{const a=questAt(s.at,st)||[st.cx,st.cz];st.goal=questGoal(Object.assign({r:3},s),{cx:a[0],cz:a[1]});break;}
    case 'boss':if(!boss)summonBoss(s.boss);break;
    default:console.warn('quest step?',s.do);st.done=true;}
  if(say0)questSpeak([say0],voice,gv);
  const mus=s.music||(s.do!=='talk'&&QUEST_MUSIC[q.id]); // L41: a step can carry its own track (the parade march)
  if(mus&&typeof music==='function'){st.music=mus;music(mus);}
  questHudSet();}
// tracks for steps whose pack doesn't set `music` yet (step `music:'parade'` in the pack wins)
const QUEST_MUSIC={wheelie_parade:'parade'};
function questStepEnd(advance){
  const A=questA;if(!A||!A.st)return;const st=A.st,s=st.s;
  for(const t of st.things)questThingOff(t,false);if((s.do==='find'||s.reveal)&&advance&&!questNextIs('bring'))questRoofClear(true);
  if(st.reveal)questThingOff(st.reveal,false);questUnclear(st);
  if(st.flock)questFlockOff(st.flock);if(st.goal)questThingOff(st.goal);if(st.aside){animalsBack();st.aside=null;}questMarkRings.count=0;
  if(!advance)questRoofClear(false);
  if(st.music&&musicWant&&musicWant.id===st.music)music('drive'); // back to the zone's drive track (unless a boss took over)
  A.st=null;}
const questNextIs=v=>{const A=questA,nx=A&&A.q.steps[A.si+1];return !!(nx&&nx.do===v);};
function questProgress(k=1){
  const A=questA,st=A.st,s=st.s,pr=questProg[A.q.id];st.got+=k;pr.n=st.got;
  confetti(25);sfxClip('quest_step',0.7)||sfx.pop();
  if(st.got<st.n){const e=s.say&&s.say.each;if(e)questSpeak([pick([].concat(e))],questVoice(A.q,s),questGv());questHudSet();return;}
  if(s.reveal&&!st.revealed){questReveal(st,st.lastAt||[st.cx,st.cz]);questHudSet();return;} // L40: the prize pops out of the last one
  questStepDone();}
function questStepDone(){
  const A=questA,q=A.q,s=A.st.s,gv=questGv();
  const got=s.say&&!Array.isArray(s.say)&&s.say.got;if(got)questSpeak([got],questVoice(q,s),gv);
  questStepEnd(true);A.si++;const pr=questProg[q.id];pr.step=A.si;pr.n=0;
  if(A.si>=q.steps.length){questFinish();return;}
  sfxClip('quest_step',0.9)||sfx.join();confetti(60);questStepStart();questSave();}
function questFinish(){
  const q=questA.q,rw=q.reward||{},gv=questGv();questA=null;questDone.add(q.id);questHudSet();questRoofClear(true);
  questSpeak(rw.say||['Thank you!'],q.giver.voice,gv);
  showBig(rw.ability&&QUEST_ICON[rw.ability]||'⭐'.repeat(clamp(rw.stars||1,1,5)));
  sfxClip('quest_done',1)||sfx.fanfare();confetti(220);shake=Math.min(2,shake+1);
  for(const p of players){p.air=true;p.vy=Math.max(p.vy,14*clamp(Math.pow(S,0.4),0.33,1.8));puff(p.x,S,p.z,12,1.4*Math.max(S,.3),'#ffd60a');}
  questSpinT=1.3;
  if(rw.ability){questAbil.add(rw.ability);if(typeof grantAbility==='function')grantAbility(rw.ability);} // L36: the ceremony + glyph
  if(rw.cosmetic){questCos.add(rw.cosmetic);if(typeof grantCosmetic==='function')grantCosmetic(rw.cosmetic);}
  if(rw.stars&&!giant)queue.push({t:1.2,fn:()=>{grow(Math.round((GROW_AT[tier+1]-GROW_AT[tier])*0.25*rw.stars));}}); // ⭐ = a quarter of a size
  questSave();}
const QUEST_ICON={hammer:'🔨',shoot:'🥚',hover:'🛸',dozer:'🚜',glide:'🪁',stomp:'🦖',sugarrush:'🍭'};
let questSpinT=0;
function questSave(){if(typeof saveGame==='function')try{saveGame();}catch(e){}} // L37
// for L37: everything quest-side that a save needs, and putting it back
function questState(){return {done:[...questDone],abil:[...questAbil],cos:[...questCos],prog:JSON.parse(JSON.stringify(questProg)),active:questA&&questA.q.id};}
function questLoad(s){questReset();if(!s)return;(s.done||[]).forEach(i=>questDone.add(i));(s.abil||[]).forEach(i=>questAbil.add(i));(s.cos||[]).forEach(i=>questCos.add(i));
  Object.assign(questProg,s.prog||{});if(s.active&&QUESTS[s.active])questStart(QUESTS[s.active],true);}
function questReset(){if(questA)questStepEnd(false);questA=null;questDone.clear();questAbil.clear();questCos.clear();for(const k in questProg)delete questProg[k];questHudSet();}
// the world was rebuilt (garage exit, breakout…): rebuild the active step's things
function questWorldChanged(){if(questA&&questA.st){questStepEnd(false);questStepStart();}}

/* ---------- step things ---------- */
const qS=()=>GROW_S[giant?GROW_S.length-1:tier]; // the players' size (not the still-growing car scale S): quest things are built at this
const QUEST_HIDE=new THREE.Matrix4().makeScale(0,0,0);
function questAt(at,st){if(Array.isArray(at))return at;if(typeof at==='string'&&at!=='stage'&&at!=='hidden'){const sp=questFindSpot(at);if(sp)return [sp.x+rand(-sp.hx,sp.hx)*0.8,sp.z+rand(-sp.hz,sp.hz)*0.8];}return null;}
function questPlace(s,st,i,ring){ // a spot for thing i: listed points, a spot kind, hidden around, or in the stage
  if(Array.isArray(s.at)&&Array.isArray(s.at[0]))return s.at[i%s.at.length];
  const a=questAt(s.at,st);if(a)return [a[0]+rand(-2,2)*qS(),a[1]+rand(-2,2)*qS()];
  const R=s.at==='hidden'?st.R*3:st.R;
  for(let t=0;t<12;t++){const ang=rand(0,Math.PI*2),d=(ring?rand(0.45,0.95):Math.sqrt(Math.random()))*R,x=st.cx+Math.sin(ang)*d,z=st.cz+Math.cos(ang)*d;
    if(Math.abs(x)>WB-4*qS()||Math.abs(z)>WB-4*qS()||rampH(x,z)>0)continue;if(!players.some(p=>Math.hypot(p.x-x,p.z-z)<p.r*3))return [x,z];}
  return [st.cx+rand(-1,1)*R*0.5,st.cz+rand(-1,1)*R*0.5];}
function questRingPos(s,st,i,n){if(Array.isArray(s.at)&&Array.isArray(s.at[0]))return s.at[i%s.at.length];
  const a=i/n*Math.PI*2+0.4;return [st.cx+Math.sin(a)*st.R,st.cz+Math.cos(a)*st.R];}
function questThingOff(t,poof){if(!t)return;if(t.g){if(poof)puff(t.g.position.x,t.g.position.y+qS(),t.g.position.z,6,1.2*Math.max(qS(),.2),'#ffffff');if(t.g.parent)t.g.parent.remove(t.g);}
  if(t.tag)t.tag.remove();if(t.o&&t.o.alive&&!t.keep){t.o.alive=false;if(typeof poolRelease==='function')poolRelease(t.o);scene.remove(t.o.g);}
  if(t.mats)for(const m of t.mats)m.dispose();if(t.geo)t.geo.dispose();}
// QA8: quest critters and items are blown up so their biggest side is at least `min` car lengths (a car is ~4.5 at scale 1),
// so a chicken to catch isn't a white speck next to the car. m is at scale 1, not yet in a scaled parent.
const QUEST_CAR_L=4.5,QUEST_MIN_CRITTER=0.6,QUEST_MIN_ITEM=0.45;
function questBigK(m,min){_bx.setFromObject(m);const d=Math.max(_bx.max.x-_bx.min.x,_bx.max.y-_bx.min.y,_bx.max.z-_bx.min.z)||1;return Math.max(1,min*QUEST_CAR_L/d);}
function questGlow(col,op=0.3){return new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending});}
// find: a bobbing item with a light beam and its icon above it; touch it and it hops onto your roof
function questItem(s,pos){const g=new THREE.Group(),look=typeof QUEST_ITEMS!=='undefined'&&QUEST_ITEMS[s.item];
  let m=null;if(look){try{m=look();}catch(e){}}
  if(!m){m=new THREE.Group();m.add(mk('box',1.2,0.8,0.9,s.color||'#e63946',0,0.4,0),mk('box',0.5,0.2,0.2,'#ffd60a',0,0.9,0));}
  const k=questBigK(m,QUEST_MIN_ITEM);m.scale.setScalar(k);
  const beam=new THREE.Mesh(GEO.cyl,BEAM_MAT);beam.scale.set(0.9,14,0.9);beam.position.y=7;beam.castShadow=false;
  g.add(m,beam);g.position.set(pos[0],groundH(pos[0],pos[1]),pos[1]);g.scale.setScalar(qS());scene.add(g);
  const t={kind:'item',g,m,k,beam,x:pos[0],z:pos[1],tag:questDiv('questIcon',s.icon||'🎁'),ph:rand(0,6),y:s.y!=null?s.y*qS():0,lift:!!s.lift,clear:!!s.clear,on:null,chk:0};
  questItemBase(t,st0(),true);return t;}
const st0=()=>questA&&questA.st;
// L40: what an item sits on (lift), what's cleared off its spot (clear); checked now and then, since chunks load later
function questItemBase(t,st,now){
  if(!t.lift&&!t.clear)return;if(!now&&(t.chk-=1/60)>0)return;t.chk=0.4;const R=1.2*qS();
  let on=null;
  for(const o of objects){if(!o.alive||o.quest)continue;const d=Math.hypot(o.x-t.x,o.z-t.z);if(d>o.r+R)continue;
    if(t.clear){if(o.building||o.mega)continue;o.alive=false;if(typeof poolRelease==='function')poolRelease(o);scene.remove(o.g);
      if(o.rec&&st){o.rec.dead=true;o.rec.back=Infinity;(st.cleared||(st.cleared=[])).push(o.rec);}
      if(!now)puff(o.x,o.h*0.5,o.z,5,Math.max(o.r,0.3),'#ffffff');continue;}
    if(d<o.r*0.9&&(!on||o.h+o.fy>on.h+on.fy))on=o;}
  t.on=on;}
function questUnclear(st){if(st.cleared)for(const e of st.cleared)if(e.back===Infinity)e.back=T+rand(3,12);st.cleared=null;} // cleared props grow back after the step
// smash reveal: the prize hops out of the last thing smashed
function questReveal(st,at){const s=st.s;st.revealed=true;
  st.reveal=questItem({item:s.reveal,icon:s.revealIcon||s.icon,color:s.color},at);st.reveal.hop=1;
  sfx.pop();puff(at[0],qS(),at[1],10,1.2*Math.max(qS(),.2),'#ffd60a');}
// one frame of a find item: bob on the ground / on top of what it sits on / up at y; true when a car grabs it
function questItemTick(t,dt,st){
  questItemBase(t,st,false);
  const base=t.on&&t.on.alive?t.on.h+(t.on.fy||0):t.y,gy=groundH(t.x,t.z);
  if(t.hop!=null){t.hop=Math.max(0,t.hop-dt*1.6);}
  t.g.position.y=gy+base+(t.hop?Math.sin((1-t.hop)*Math.PI)*4*qS():0);
  t.m.rotation.y+=dt*2;t.m.position.y=(0.4+0.3*Math.sin(T*3+t.ph))*t.k;
  questProj(t.tag,t.x,base+3.2*qS(),t.z,true);
  const reach=QUEST_CAR_L*qS()+(t.on&&t.on.alive?t.on.r:0); // QA8: within ~1.5 car lengths of the car's middle; touching what it sits on counts
  for(const p of players)if(Math.hypot(p.x-t.x,p.z-t.z)<p.r+reach&&(!(t.y>0)||t.on||(p.y||0)-gy>=t.y-1.6*qS()))return p;
  return null;}
function questDrop(s,pos,done){const g=new THREE.Group(),mat=new THREE.MeshBasicMaterial({color:done?'#06d6a0':'#ffd60a',transparent:true,opacity:0.75});
  const disc=new THREE.Mesh(GEO.cyl,mat);disc.scale.set(7,0.12,7);disc.position.y=0.08;g.add(disc);
  const beam=new THREE.Mesh(GEO.cyl,BEAM_MAT);beam.scale.set(2.6,16,2.6);beam.position.y=8;beam.visible=!done;g.add(beam);
  g.position.set(pos[0],0.02,pos[1]);g.scale.setScalar(qS());scene.add(g);
  return {kind:'drop',g,x:pos[0],z:pos[1],done,mats:[mat],beam,tag:questDiv('questIcon',done?'✅':(s.icon||'📦'))};}
const QUEST_ARCH=new THREE.TorusGeometry(4,0.45,8,28,Math.PI);
function questRing(s,pos,done){const mat=new THREE.MeshBasicMaterial({color:'#ffd60a',transparent:true,opacity:0.9});const m=new THREE.Mesh(QUEST_ARCH,mat);
  const g=new THREE.Group();g.add(m);g.position.set(pos[0],groundH(pos[0],pos[1]),pos[1]);g.scale.setScalar(qS());g.visible=!done;scene.add(g);
  return {kind:'ring',g,x:pos[0],z:pos[1],done,mats:[mat],mat};}
function questRingAim(st){const l=st.things;for(let i=0;i<l.length;i++){const a=l[(i+l.length-1)%l.length],b=l[(i+1)%l.length];l[i].g.rotation.y=Math.atan2(b.x-a.x,b.z-a.z)+Math.PI/2;}}
function questGoal(s,st){const r=(s.r||5)*qS(),mat=new THREE.MeshBasicMaterial({color:'#06d6a0',transparent:true,opacity:0.5,depthWrite:false});
  const g=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(1,0.06,6,40),mat);ring.rotation.x=-Math.PI/2;ring.scale.setScalar(r);ring.position.y=0.06;g.add(ring);
  const beam=new THREE.Mesh(GEO.cyl,BEAM_MAT);beam.scale.set(r*0.5,30*qS(),r*0.5);beam.position.y=15*qS();g.add(beam);
  g.position.set(st.cx,0.02,st.cz);scene.add(g);return {kind:'goal',g,x:st.cx,z:st.cz,r,mats:[mat],geo:ring.geometry,tag:questDiv('questIcon',s.icon||'🎯')};}
// push: a ball (or an animal, or design's look) that gets shoved when a car drives into it
function questPushable(s,pos){let m=null;
  if(typeof s.build==='function'){try{m=s.build();}catch(e){}}
  if(!m&&s.kind&&animalDef(s.kind))m=animalModel(s.kind,animalDef(s.kind));
  if(!m){m=new THREE.Group();m.add(mk('sph',2.2,2.2,2.2,s.color||'#ff006e',0,1.1,0),mk('box',2.25,0.35,0.35,'#ffffff',0,1.1,0));}
  const k=s.kind||s.build?questBigK(m,QUEST_MIN_CRITTER):1;m.scale.setScalar(k);
  _bx.setFromObject(m);const r=Math.max(0.6,Math.max(_bx.max.x-_bx.min.x,_bx.max.z-_bx.min.z)/2)*qS();
  const g=new THREE.Group();g.add(m);g.position.set(pos[0],groundH(pos[0],pos[1]),pos[1]);g.scale.setScalar(qS());scene.add(g);
  return {kind:'push',g,m,x:pos[0],z:pos[1],vx:0,vz:0,r,ball:!s.kind&&!s.build};}
// QA10: pushables are kept out of givers and out of props too big for the cars to plow through (both stop cars),
// so one can't get shoved somewhere no car can reach. It slides along and bounces a little.
function questPushSolid(t){
  const out=(x,z,R)=>{const dx=t.x-x,dz=t.z-z,d=Math.hypot(dx,dz),rr=R+t.r;if(d>=rr)return;
    const nx=d>1e-4?dx/d:1,nz=d>1e-4?dz/d:0;t.x=x+nx*rr;t.z=z+nz*rr;const vn=t.vx*nx+t.vz*nz;if(vn<0){t.vx-=1.4*vn*nx;t.vz-=1.4*vn*nz;}};
  for(const id in questGivers){const gv=questGivers[id];if(gv.shown)out(gv.x,gv.z,gv.r);}
  for(const o of objects){if(!o.alive||o.quest||o.boss||o.falling||o.sz<=tier)continue;if(Math.abs(o.x-t.x)>o.r+t.r||Math.abs(o.z-t.z)>o.r+t.r)continue;out(o.x,o.z,o.r);}}
// smash: props of the step's type at the players' size, in the stage
const questBaseSize={};
function questSmashThing(s,pos){const types=[].concat(s.type||['crates','barrel','cone']),t=pick(types);if(!OBJ[t])return null;
  if(questBaseSize[t]==null){const pr=OBJ[t](pos[0],pos[1]);questBaseSize[t]=pr.sz;pr.alive=false;scene.remove(pr.g);objects.splice(objects.indexOf(pr),1);}
  const o=OBJ[t](pos[0],pos[1],undefined,Math.pow(SIZE_STEP,tier-questBaseSize[t]));o.quest=true;o.roll=false; // QA14: a quest hay bale breaks on the hit instead of rolling off and counting 50 units away
  return {kind:'smash',o,x:o.x,z:o.z};}
// catch: a flock running around the stage (one InstancedMesh per material, so twenty chickens are a few draw calls)
function questFlock(kind,n,st){
  const def=animalDef(kind)||animalDef('chicken');animalModel(kind,def);const t=animalTemplates[kind];
  const ims=[];if(t&&t.userData.merged)for(const c of t.children){const im=new THREE.InstancedMesh(c.geometry,c.material,Math.max(1,n));im.castShadow=true;im.frustumCulled=false;scene.add(im);ims.push(im);}
  const src=t||def.build(),k=questBigK(src,QUEST_MIN_CRITTER);_bx.setFromObject(src);const r0=Math.max(_bx.max.x-_bx.min.x,_bx.max.z-_bx.min.z)/2*qS(),r=r0*k;
  const list=[];for(let i=0;i<n;i++){const p=questPlace({},st,i);list.push({x:p[0],z:p[1],h:rand(0,6),sp:0,t:rand(0,2),ph:rand(0,9),alive:true,g:ims.length?null:animalModel(kind,def)});
    if(list[i].g)scene.add(list[i].g);}
  return {kind,def,ims,list,r,r0,k,st,_m:new THREE.Matrix4(),_q:new THREE.Quaternion(),_p:new THREE.Vector3(),_s:new THREE.Vector3(),_e:new THREE.Euler()};}
function questFlockOff(f){for(const im of f.ims){scene.remove(im);im.dispose();}for(const a of f.list)if(a.g)scene.remove(a.g);}
function updateFlock(f,dt){const st=f.st,sp0=(3+f.r0/qS())*qS()*1.4;let k=0;
  for(let i=0;i<f.list.length;i++){const a=f.list[i];
    if(a.alive){let np=null,nd=1e9;for(const p of players){const d=Math.hypot(a.x-p.x,a.z-p.z);if(d<nd){nd=d;np=p;}}
      if(np&&nd<np.r+f.r){a.alive=false;const fl=f.def.fluff||'#ffffff';puff(a.x,f.r,a.z,8,Math.max(0.3,f.r*1.4),fl);sfxClip(f.kind,0.9,rand(0.92,1.12))||sfx.pop();
        const gv=questGv();if(gv&&gv.shown)puff(gv.x,gv.r,gv.z,4,gv.r*0.6,fl);questProgress();if(!questA||questA.st!==st)return;continue;}
      a.t-=dt;
      if(np&&nd<np.r+f.r0*8+4*qS()){a.h=Math.atan2(a.x-np.x,a.z-np.z)+Math.sin(T*3+a.ph)*0.6;a.sp=sp0*1.6;a.t=0.6;} // run away, flapping
      else if(a.t<=0){a.t=rand(1,2.5);a.sp=Math.random()<0.4?0:sp0*0.5;a.h=rand(0,Math.PI*2);}
      const dx=a.x-st.cx,dz=a.z-st.cz;if(Math.hypot(dx,dz)>st.R){a.h=Math.atan2(-dx,-dz);} // stay inside the stage
      a.x+=Math.sin(a.h)*a.sp*dt;a.z+=Math.cos(a.h)*a.sp*dt;}
    const y=a.alive?groundH(a.x,a.z)+(a.sp>0?Math.abs(Math.sin(T*16+a.ph))*0.25*f.r:0):0;
    if(a.g){a.g.visible=a.alive;a.g.position.set(a.x,y,a.z);a.g.rotation.y=a.h;a.g.scale.setScalar(qS()*f.k);continue;}
    f._m.compose(f._p.set(a.x,y,a.z),f._q.setFromEuler(f._e.set(0,a.h,a.sp>0?Math.sin(T*16+a.ph)*0.15:0)),f._s.setScalar(qS()*f.k));
    for(const im of f.ims)im.setMatrixAt(i,a.alive?f._m:QUEST_HIDE);k++;}
  for(const im of f.ims)im.instanceMatrix.needsUpdate=true;}
// items riding on car roofs
function questRoof(p,t){const l=p.qRoof||(p.qRoof=[]);t.tag.remove();t.tag=null;t.beam.visible=false;t.g.remove(t.beam);
  p.root.add(t.m);t.m.position.set(0,p.model.h+0.2+l.length*1.0,-0.3);t.m.rotation.set(0,0,0);t.m.scale.setScalar(0.8);scene.remove(t.g);l.push(t.m);}
function questRoofClear(poof){for(const p of players){for(const m of p.qRoof||[]){if(poof){m.getWorldPosition(_qv);puff(_qv.x,_qv.y,_qv.z,4,0.8*Math.max(qS(),.2),'#ffffff');}p.root.remove(m);}p.qRoof=[];}}
const questFly=[];
function questBring(gv){
  let k=0;for(const p of players){for(const m of p.qRoof||[]){m.getWorldPosition(_qv);p.root.remove(m);scene.add(m);m.position.copy(_qv);m.scale.setScalar(0.8*qS());
    questFly.push({m,x0:_qv.x,y0:_qv.y,z0:_qv.z,t:-k*0.15,gv});k++;}p.qRoof=[];}
  sfx.pop();queue.push({t:0.6+k*0.15,fn:()=>{if(questA&&questA.st&&questA.st.s.do==='bring')questStepDone();}});}
function updateQuestFly(dt){for(let i=questFly.length-1;i>=0;i--){const f=questFly[i];f.t+=dt;const k=clamp(f.t/0.6,0,1);
  const tx=f.gv.x,ty=(f.gv.r||qS())*1.2,tz=f.gv.z;f.m.position.set(f.x0+(tx-f.x0)*k,f.y0+(ty-f.y0)*k+Math.sin(k*Math.PI)*3*Math.max(qS(),.2),f.z0+(tz-f.z0)*k);
  if(k>=1){scene.remove(f.m);puff(tx,ty,tz,5,Math.max(qS(),.2),'#ffd60a');questFly.splice(i,1);}}}

/* ---------- each frame ---------- */
function updateQuestStep(dt){
  const A=questA;if(!A||!A.st)return;const st=A.st,s=st.s;st.t+=dt;
  if(st.tier!==tier&&s.do!=='talk'&&s.do!=='bring'&&s.do!=='boss'){questStepEnd(false);questStepStart();return;} // grew mid-quest: rebuild at the new size
  if(st.done){questStepDone();return;}
  switch(s.do){
    case 'talk':if(!questTalking()&&st.t>0.5)questStepDone();return;
    case 'bring':if(!players.some(p=>(p.qRoof||[]).length)&&!questFly.length&&st.t>0.5&&!questTalking()){/* nothing to carry (loaded game): just visit */}return;
    case 'find':for(const t of st.things){if(!t.g.parent)continue;const p=questItemTick(t,dt,st);
      if(p){questRoof(p,t);sfxClip('pickup',0.8)||sfx.pop();questProgress();return;}}return;
    case 'catch':updateFlock(st.flock,dt);return;
    case 'smash':if(st.reveal&&st.reveal.g.parent){const p=questItemTick(st.reveal,dt,st);
        if(p){questRoof(p,st.reveal);sfxClip('pickup',0.8)||sfx.pop();confetti(25);questStepDone();}return;}
      for(const t of st.things){const o=t.o;
      if(!o.alive&&!t.counted){t.counted=true;st.lastAt=[o.x,o.z];questProgress();if(questA!==A||A.st!==st)return;continue;}
      if(o.alive&&!objects.includes(o)){const c=chunks.get(o.chunk);if(c&&c.loaded){objects.push(o);scene.add(o.g);}}} // its chunk came back
      return;
    case 'deliver':for(const t of st.things){if(t.done){questProj(t.tag,t.x,1.5*qS(),t.z,false);continue;}questProj(t.tag,t.x,4*qS(),t.z,true);
      t.g.children[0].scale.setScalar(7*(1+0.08*Math.sin(T*6)));t.g.children[0].scale.y=0.12;
      for(const p of players)if(Math.hypot(p.x-t.x,p.z-t.z)<p.r+3.5*qS()){t.done=true;t.mats[0].color.set('#06d6a0');t.beam.visible=false;t.tag.innerHTML='✅';
        flash(t.x,qS(),t.z,'#06d6a0',4*qS(),0.4);questProgress();if(questA!==A)return;break;}}return;
    case 'rings':{const nx=st.things.find(t=>!t.done);if(!nx)return;
      for(const t of st.things){t.mat.opacity=t===nx?0.75+0.25*Math.sin(T*8):0.25;t.g.scale.setScalar(qS()*(t===nx?1+0.06*Math.sin(T*8):0.85));}
      for(const p of players)if(Math.hypot(p.x-nx.x,p.z-nx.z)<4*qS()+p.r*0.5){nx.done=true;nx.g.visible=false;flash(nx.x,3*qS(),nx.z,'#ffd60a',5*qS(),0.4);questProgress();return;}return;}
    case 'push':{const G=st.goal;questProj(G.tag,G.x,5*qS(),G.z,true);G.g.children[0].material.opacity=0.4+0.2*Math.sin(T*5);
      for(const t of st.things){if(t.inG){continue;}
        let hit=false,close=false;
        for(const p of players){const dx=t.x-p.x,dz=t.z-p.z,d=Math.hypot(dx,dz)||0.01,rr=p.r+t.r;if(d<rr+p.r*3)close=true;if(d>=rr)continue;hit=true;
          const nx=dx/d,nz=dz/d,kick=Math.max(Math.abs(p.speed)*1.15,6*p.sm);t.x=p.x+nx*rr;t.z=p.z+nz*rr;t.vx=nx*kick;t.vz=nz*kick;p.speed*=0.85;
          if(T-(t.bT||0)>0.3){t.bT=T;sfx.boing();}}
        const f=Math.pow(0.35,dt);t.vx*=f;t.vz*=f;t.x+=t.vx*dt;t.z+=t.vz*dt;
        const ox=t.x-st.cx,oz=t.z-st.cz,od=Math.hypot(ox,oz),lim=st.R*1.8;if(od>lim){t.x=st.cx+ox/od*lim;t.z=st.cz+oz/od*lim;t.vx*=-0.5;t.vz*=-0.5;} // stays in the stage
        questPushSolid(t);
        // QA10 backstop: a car hanging around it for a while without ever touching it → it pops back to a fresh spot
        t.stuckT=hit||!close?0:(t.stuckT||0)+dt;
        if(t.stuckT>12){t.stuckT=0;puff(t.x,t.r,t.z,8,t.r*1.5,'#ffffff');const np=questPlace(s,st,st.things.indexOf(t),true);t.x=np[0];t.z=np[1];t.vx=t.vz=0;puff(t.x,t.r,t.z,8,t.r*1.5,'#ffd60a');sfx.pop();}
        const sp=Math.hypot(t.vx,t.vz);t.g.position.set(t.x,groundH(t.x,t.z),t.z);
        if(sp>0.1){if(t.ball)t.m.rotation.x+=sp*dt/t.r*qS();t.g.rotation.y=Math.atan2(t.vx,t.vz);}
        if(Math.hypot(t.x-G.x,t.z-G.z)<G.r-t.r*0.3){t.inG=true;t.vx=t.vz=0;flash(t.x,qS(),t.z,'#06d6a0',3*qS(),0.4);questProgress();if(questA!==A)return;}}
      return;}
    case 'reach':{const G=st.goal;questProj(G.tag,G.x,5*qS(),G.z,true);
      if(players.some(p=>Math.hypot(p.x-G.x,p.z-G.z)<G.r+p.r&&(s.y==null||p.y>=s.y)))questProgress(st.n-st.got);return;}
    case 'boss':if(bossBeaten&&(!boss||boss.state==='dead'))questProgress(st.n-st.got);return;}}
function updateQuests(dt){
  updateQuestTalk(dt);
  if(!questOn){if(questA){questStepEnd(false);questA=null;}questArrowSet(null);updateGivers(dt);questHud.style.display='none';return;}
  updateGivers(dt);if(!garageAll())updateQuestStep(dt);updateQuestFly(dt);
  if(questSpinT>0){questSpinT-=dt;for(const p of players)p.heading+=dt*14;}
  for(const p of players)for(const m of p.qRoof||[])m.rotation.y+=dt*1.5;
  questMarks(dt);questArrowSet(questTarget());questHudSet(true);}
/* L48: what to catch, push, find or smash wears a pulsing gold ring on the ground and gives off sparkles (all rings
   are one InstancedMesh: one draw call), and while a catch / push step runs the world's own animals of that kind
   near the stage step aside (animalsAside in game.js) so the quest's critters are the only ones there. */
const QUEST_MARK_N=64,QUEST_ASIDE_R=2.5; // rings at most; animals step aside within this many stage radii (+ the giver's spot)
const questMarkRings=new THREE.InstancedMesh(new THREE.RingGeometry(0.66,1,40).rotateX(-Math.PI/2),
  new THREE.MeshBasicMaterial({color:'#ffd60a',transparent:true,opacity:0.85,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-4}),QUEST_MARK_N);
questMarkRings.count=0;questMarkRings.frustumCulled=false;questMarkRings.renderOrder=2;scene.add(questMarkRings);
const _qm=new THREE.Matrix4(),_qmq=new THREE.Quaternion(),_qmp=new THREE.Vector3(),_qms=new THREE.Vector3();
let questMarkSparkT=0;
function questMarkList(){const A=questA;if(!A||!A.st||(typeof talkS!=='undefined'&&talkS))return [];const st=A.st,s=st.s,l=[],q=qS();
  switch(s.do){
    case 'catch':for(const a of st.flock.list)if(a.alive)l.push([a.x,a.z,st.flock.r*1.35]);break;
    case 'push':for(const t of st.things)if(!t.inG)l.push([t.x,t.z,t.r*1.35]);break;
    case 'find':for(const t of st.things)if(t.g.parent&&!t.on&&!(t.y>0))l.push([t.x,t.z,0.5*QUEST_CAR_L*q]);break; // (an item up on a prop or in the air has its beam)
    case 'smash':if(st.reveal&&st.reveal.g.parent)l.push([st.reveal.x,st.reveal.z,0.5*QUEST_CAR_L*q]);
      else for(const t of st.things)if(t.o.alive)l.push([t.o.x,t.o.z,t.o.r*1.3+0.3*q]);break;}
  return l;}
function questMarks(dt){
  const A=questA,st=A&&A.st,s=st&&st.s;
  if(st&&(s.do==='catch'||s.do==='push')&&s.kind){ // the world's animals of the quest's kind step aside
    const R=st.R*QUEST_ASIDE_R+8*qS();animalsAside(s.kind,st.cx,st.cz,R);const gv=questGv();if(gv&&gv.shown)animalsAside(s.kind,gv.x,gv.z,st.R+8*qS());st.aside=true;}
  const l=questMarkList(),n=Math.min(l.length,QUEST_MARK_N),pulse=1+0.1*Math.sin(T*6);
  for(let i=0;i<n;i++){const [x,z,r]=l[i];_qm.compose(_qmp.set(x,groundH(x,z)+0.04*Math.max(qS(),0.2),z),_qmq.identity(),_qms.set(r*pulse,1,r*pulse));questMarkRings.setMatrixAt(i,_qm);}
  questMarkRings.count=n;questMarkRings.instanceMatrix.needsUpdate=true;
  if(n&&(questMarkSparkT-=dt)<=0){questMarkSparkT=0.09;const [x,z,r]=l[(Math.random()*n)|0],a=rand(0,Math.PI*2);
    const m=new THREE.Mesh(GEO.box,SPARK_MAT);m.scale.setScalar(0.35*Math.max(qS(),0.05));m.position.set(x+Math.sin(a)*r,groundH(x,z)+0.2*qS(),z+Math.cos(a)*r);m.rotation.set(rand(0,3),rand(0,3),0);
    addPart(m,0.8,0,2.2*qS(),0);}}
// where the gold arrow points: the next thing to do, else the main giver you need to see
function questTarget(){
  if(roomZ||state!=='play'||garageAll())return null;
  const A=questA;
  if(A&&A.st){const st=A.st,s=st.s,gv=questGv(),near=l=>{let b=null,bd=1e18;for(const t of l){const d=players.reduce((m,p)=>Math.min(m,(p.x-t.x)**2+(p.z-t.z)**2),1e18);if(d<bd){bd=d;b=t;}}return b;};
    switch(s.do){
      case 'talk':return null;
      case 'bring':return gv&&gv.shown?[gv.x,gv.z,A.q.giver.emoji]:questGiverAt(A.q)&&[...questGiverAt(A.q),A.q.giver.emoji];
      case 'find':{const t=near(st.things.filter(t=>t.g.parent));return t&&[t.x,t.z,s.icon];}
      case 'smash':if(st.reveal&&st.reveal.g.parent)return [st.reveal.x,st.reveal.z,s.revealIcon||s.icon];
        {const t=near(st.things.filter(t=>t.o.alive).map(t=>({x:t.o.x,z:t.o.z})));return t&&[t.x,t.z,s.icon];}
      case 'catch':{const t=near(st.flock.list.filter(a=>a.alive));return t&&[t.x,t.z,s.icon];}
      case 'deliver':{const t=near(st.things.filter(t=>!t.done));return t&&[t.x,t.z,s.icon];}
      case 'rings':{const t=st.things.find(t=>!t.done);return t&&[t.x,t.z,s.icon||'🎈'];}
      case 'push':{const t=near(st.things.filter(t=>!t.inG));return t&&[t.x,t.z,s.icon];}
      case 'reach':return [st.goal.x,st.goal.z,s.icon];
      case 'boss':return boss&&boss.state!=='dead'?[boss.o.x,boss.o.z,'👾']:null;}}
  const m=(questPoint&&QUESTS[questPoint])||questMain(questChapter()); // nothing going on: lead the way to the chapter's main giver
  if(m&&!questDone.has(m.id)){const at=questGiverAt(m);if(at)return [at[0],at[1],m.giver.emoji];}
  return null;}
const questArrow3=new THREE.Mesh(new THREE.ConeGeometry(0.5,1,12).rotateX(Math.PI).translate(0,0.5,0),new THREE.MeshBasicMaterial({color:'#ffd60a',transparent:true,opacity:0.95,depthTest:false}));
questArrow3.renderOrder=10;questArrow3.visible=false;scene.add(questArrow3);
const questArrowEl=document.createElement('div');questArrowEl.id='questArrow';$('hud').appendChild(questArrowEl);
let questSparkT=0;
function questArrowSet(tg){
  questArrow3.visible=!!tg;if(tg&&!tg[2])tg[2]='⭐';questArrowEl.style.display='none';if(!tg)return;
  const k=Math.max(1.6*qS(),camDist*0.05);questArrow3.scale.set(k,k*1.5,k);questArrow3.position.set(tg[0],groundH(tg[0],tg[1])+4*qS()+k*(0.5+0.3*Math.sin(T*5)),tg[1]);questArrow3.rotation.y=T*2;
  _qv.set(tg[0],qS(),tg[1]).project(camera);
  if(_qv.z>1||Math.abs(_qv.x)>0.92||Math.abs(_qv.y)>0.85){let ax=_qv.x,ay=_qv.y;if(_qv.z>1){ax=-ax;ay=-ay;}const m=Math.max(Math.abs(ax)/0.88,Math.abs(ay)/0.8,1e-3);
    questArrowEl.textContent=tg[2]||'⭐';questArrowEl.style.left=((ax/m+1)/2*innerWidth)+'px';questArrowEl.style.top=((1-ay/m)/2*innerHeight)+'px';questArrowEl.style.display='block';}
  // far away: a trail of sparkles on the ground from the cars toward it
  if((questSparkT-=1/60)<=0&&players.length){questSparkT=0.12;const p=players[0],dx=tg[0]-p.x,dz=tg[1]-p.z,d=Math.hypot(dx,dz);
    if(d>scatR()*0.7){const step=(T*6|0)%7+1,gap=Math.max(1.2,4*qS());if(step*gap<d-p.r*2){const x=p.x+dx/d*step*gap*1.0,z=p.z+dz/d*step*gap;
      const m=new THREE.Mesh(GEO.box,SPARK_MAT);m.scale.setScalar(0.5*Math.max(qS(),0.1));m.position.set(x,groundH(x,z)+0.3*qS(),z);m.rotation.set(rand(0,3),rand(0,3),0);addPart(m,0.7,0,1.5*qS(),0);}}}}
// the quest HUD: who you're helping, what they want, and dots for how many
const questHud=document.createElement('div');questHud.id='questHud';questHud.style.display='none';$('hud').appendChild(questHud);
function questStepIcon(){const A=questA;if(!A||!A.st)return '';const s=A.st.s;
  return s.icon||(s.do==='bring'?(A.q.steps.slice(0,A.si).reverse().find(x=>x.revealIcon||x.icon)||{}).revealIcon||(A.q.steps.slice(0,A.si).reverse().find(x=>x.icon)||{}).icon||'🎁':s.do==='talk'?(A.q.steps.slice(A.si).find(x=>x.icon)||{}).icon||'':s.do==='boss'?'👾':'');}
function questBubbleHtml(){const A=questA;if(!A||!A.st)return '';const ic=questStepIcon();
  const n=A.st.n,g=A.st.got;return `<b>${ic}</b>`+(n>1&&n<=12?`<span>${'●'.repeat(g)}${'○'.repeat(n-g)}</span>`:n>12?`<span>${g} / ${n}</span>`:'');}
let questHudKey='';
function questHudSet(){if(!questOn||!questA){questHud.style.display='none';questHudKey='';return;}
  const h=`<i>${questA.q.giver.emoji||'❗'}</i>`+questBubbleHtml();if(h!==questHudKey){questHudKey=h;questHud.innerHTML=h;questHud.classList.toggle('main',!!questA.q.main);}
  questHud.style.display=state==='play'?'flex':'none';}
{const st=document.createElement('style');st.textContent=`
:where(.questBalloon){position:absolute;transform:translate(-50%,-100%);width:62px;height:62px;border-radius:50% 50% 50% 50%;display:flex;align-items:center;justify-content:center;
  font-size:36px;background:#3a86ff;border:5px solid #fff;box-shadow:0 4px 0 #0004;pointer-events:none;animation:nwPulse .9s ease-in-out infinite}
:where(.questBalloon.main){background:#ffbe0b}
:where(.questBalloon)::after{content:'!';position:absolute;right:-8px;top:-10px;font:900 26px 'Lilita One',sans-serif;color:#e63946;text-shadow:0 2px 0 #fff}
:where(.questBubble){position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;padding:6px 14px;border-radius:22px;
  background:#fff;border:4px solid #222;color:#222;font:20px 'Lilita One',sans-serif;pointer-events:none;white-space:nowrap}
:where(.questBubble b){font-size:40px;line-height:1.1}
:where(.questIcon){position:absolute;transform:translate(-50%,-100%);font-size:34px;pointer-events:none;filter:drop-shadow(0 3px 0 #0005)}
:where(#questArrow){display:none;position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;font-size:38px;line-height:64px;text-align:center;border-radius:50%;
  background:radial-gradient(#fff3a0,#ffbe0b);box-shadow:0 0 24px #ffd60a;animation:nwPulse .8s ease-in-out infinite;z-index:5}
:where(#questHud){position:absolute;left:18px;top:110px;display:flex;align-items:center;gap:10px;padding:6px 16px;border-radius:20px;background:#3a86ffcc;border:4px solid #fff;
  color:#fff;font:22px 'Lilita One',sans-serif;pointer-events:none;z-index:4}
:where(#questHud.main){background:#ffbe0bdd}
:where(#questHud i){font-style:normal;font-size:34px}
:where(#questHud b){font-size:34px}`;document.head.appendChild(st);}

/* ---------- the talk scene (L45) ----------
   Press A next to a giver (or drive into one): the game stops (game.js skips the world while talkS is set), the camera
   frames the giver and the cars, letterbox bars slide in and each line is a card spoken in the giver's voice. The next
   card waits for the voice (A skips ahead). The last card is the goal as a picture (icon × n + an arrow toward it),
   then GO! and the game carries on. A new quest runs its opening `talk` steps inside the scene, so the goal card
   already shows the first real step; a reminder (mid-quest) shows the `remind` lines (or the step's hint) + the goal.
   Look: #talkScene (letterbox; .on while open), .talkCard (.main gold / blue; .goal for the picture), .talkName,
   .talkGoal, .talkNext (the A prompt), .talkA (the A bubble over a giver). Test: __sp.talk('giver id'). */
const TALK_NEAR=2.2,TALK_GOAL_T=3.2; // A bubble within ~2 car lengths; the goal card stays ~3 s (A = GO now)
let talkS=null;
const talkEl=document.createElement('div');talkEl.id='talkScene';
talkEl.innerHTML='<div class="talkBar top"></div><div class="talkBar bot"></div><div class="talkCard"></div>';$('hud').appendChild(talkEl);
const talkCardEl=talkEl.querySelector('.talkCard');
function talkOpen(gv,kind){
  if(talkS||!gv||!gv.shown)return false;const q=gv.q;
  talkS={gv,q,kind,cards:[],i:-1,t:0,wait:0,voiceT:0,goal:null,go:false,end:0};
  if(kind==='start'){questStart(q); // its opening talk steps speak into the cards, then the first real step starts (and says where)
    for(let k=0;k<20&&questA&&questA.q===q&&questA.st&&questA.st.s.do==='talk';k++)questStepDone();}
  else{const s=questA&&questA.st&&questA.st.s;
    const hint=s&&s.say&&!Array.isArray(s.say)&&(s.say.hint||s.say.start);
    if(q.remind&&q.remind.length)questSpeak([pick(q.remind)],q.giver.voice,gv);if(hint)questSpeak([pick([].concat(hint))],questVoice(q,s),gv);
    if(!talkS.cards.length)questSpeak(['You can do it!'],q.giver.voice,gv);}
  // the goal picture: the step that runs now
  if(questA&&questA.q===q&&questA.st){const st=questA.st;talkS.goal={icon:questStepIcon()||'⭐',n:Math.max(1,st.n-st.got)};}
  questTalk.length=0;questTalkT=0;
  if(AC)for(const p of players){if(p.eng)p.eng.g.gain.setTargetAtTime(0,AC.currentTime,0.05);p.speed=0;}
  talkEl.classList.add('on');talkEl.classList.toggle('main',!!q.main);sfx.pop();talkNext();return true;}
function talkLineLen(text,voice){const id=(voice?voice+'__':'')+voiceSlug(text),b=voiceBank.bufs[id];
  return b&&b!=='loading'?b.duration+0.35:0.9+text.split(/\s+/).length*0.38;}
function talkNext(){const S_=talkS;if(!S_)return;S_.i++;S_.t=0;
  const gd=S_.q.giver,name=`<div class="talkName"><i>${gd.emoji||'❗'}</i>${gd.name||''}</div>`;
  if(S_.i<S_.cards.length){const c=S_.cards[S_.i];stopVoice();const r=questSayNow(c.text,c.voice);
    S_.wait=talkLineLen(c.text,c.voice);S_.said=r&&typeof r.then==='function'?r:null;S_.done=false;if(S_.said)S_.said.then(()=>{if(talkS===S_)S_.done=true;},()=>{});
    if(c.gv){c.gv.talkT=S_.wait;c.gv.wob=1;}
    talkCardEl.className='talkCard'+(S_.q.main?' main':'');talkCardEl.innerHTML=name+`<div class="talkText">${talkEsc(c.text)}</div><div class="talkNext"><b class="btnA">A</b></div>`;return;}
  if(S_.goal&&S_.i===S_.cards.length){S_.wait=TALK_GOAL_T;sfxClip('quest_step',0.6)||sfx.pop();
    talkCardEl.className='talkCard goal'+(S_.q.main?' main':'');
    talkCardEl.innerHTML=name+`<div class="talkGoal"><b>${S_.goal.icon}</b>${S_.goal.n>1?`<span>× ${S_.goal.n}</span>`:''}<em class="talkArrow">➜</em></div><div class="talkNext"><b class="btnA">A</b> GO!</div>`;return;}
  talkClose();}
const talkEsc=t=>t.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function talkClose(){const S_=talkS;if(!S_)return;talkS=null;talkEl.classList.remove('on');talkCardEl.innerHTML='';
  if(S_.goal){showBig('GO!');sfx.join();}
  if(typeof lastReadySay!=='undefined')lastReadySay=performance.now(); // the "level up ready" nag starts counting again after the talk
  if(S_.gv)S_.gv.cool=1;questHudSet();}
// one frame while the scene is open (game.js runs only this, the givers, the camera and the HUD)
function updateTalk(dt,src){const S_=talkS;if(!S_)return;S_.t+=dt;
  let a=false;for(const p of players){const s=src[p.src];if(s&&s.aP)a=true;}
  if(musicGain&&AC){const g=musicGain.gain;if(g.value>MUSIC_VOL*0.45){g.cancelScheduledValues(AC.currentTime);g.setTargetAtTime(MUSIC_VOL*0.3,AC.currentTime,0.15);}}
  if(!S_.gv.shown){talkClose();return;}
  const onGoal=S_.i>=S_.cards.length;
  if(onGoal){const el=talkCardEl.querySelector('.talkArrow'),tg=questTarget();
    if(el){if(tg){_qv.set(S_.gv.x,0,S_.gv.z).project(camera);const ax=_qv.x*innerWidth,ay=_qv.y*innerHeight;_qv.set(tg[0],0,tg[1]).project(camera);
        el.style.transform=`rotate(${Math.atan2(-(_qv.y*innerHeight-ay),_qv.x*innerWidth-ax)}rad)`;el.style.display='';}else el.style.display='none';}}
  const spoken=S_.said?S_.done||S_.t>S_.wait*2.5+2:S_.t>S_.wait&&!(typeof speechSynthesis!=='undefined'&&speechSynthesis.speaking&&S_.t<S_.wait*2.5+2);
  if((a&&S_.t>0.25)||(onGoal?S_.t>S_.wait:spoken&&S_.t>0.6)){if(a&&!onGoal)stopVoice();talkNext();}
  if(!talkS&&musicGain&&AC){const g=musicGain.gain;g.cancelScheduledValues(AC.currentTime);g.setTargetAtTime(MUSIC_VOL,AC.currentTime,0.4);}}
// A pressed in play: talk to the giver next to that car (game.js calls this before the cars move)
function talkTry(src){if(talkS||!questOn||state!=='play'||garageAll())return false;
  for(const p of players){const s=src[p.src];if(!s||!s.aP)continue;
    let best=null,bd=1e9;for(const id in questGivers){const gv=questGivers[id];if(!gv.shown||!gv.near)continue;const d=Math.hypot(p.x-gv.x,p.z-gv.z);if(d<bd){bd=d;best=gv;}}
    if(best){best.cool=1;questTouch(best,p);if(talkS)return true;}}
  return false;}
{const st=document.createElement('style');st.textContent=`
:where(#talkScene){position:fixed;inset:0;pointer-events:none;z-index:30;visibility:hidden}
:where(#talkScene.on){visibility:visible}
:where(#talkScene .talkBar){position:absolute;left:0;right:0;height:12vh;background:#000;transition:transform .45s ease}
:where(#talkScene .talkBar.top){top:0;transform:translateY(-100%)}:where(#talkScene .talkBar.bot){bottom:0;transform:translateY(100%)}
:where(#talkScene.on .talkBar){transform:none}
:where(#talkScene .talkCard){position:absolute;left:50%;bottom:4vh;transform:translateX(-50%);min-width:44vw;max-width:80vw;display:flex;flex-direction:column;align-items:center;gap:6px;
  padding:14px 30px 18px;border-radius:28px;background:#3a86ff;border:6px solid #fff;box-shadow:0 8px 0 #0005;color:#fff;font:40px/1.15 'Lilita One',sans-serif;text-align:center}
:where(#talkScene .talkCard:empty){display:none}
:where(#talkScene .talkCard.main){background:#ffbe0b;color:#3a2500}
:where(#talkScene .talkName){display:flex;align-items:center;gap:10px;font-size:26px;opacity:.95}
:where(#talkScene .talkName i){font-style:normal;font-size:46px;width:66px;height:66px;line-height:66px;border-radius:50%;background:#fff;text-align:center}
:where(#talkScene .talkGoal){display:flex;align-items:center;gap:22px}
:where(#talkScene .talkGoal b){font-size:110px;line-height:1}:where(#talkScene .talkGoal span){font-size:70px}
:where(#talkScene .talkGoal em){font-style:normal;font-size:80px;display:inline-block}
:where(#talkScene .talkNext){align-self:flex-end;font-size:30px;display:flex;align-items:center;gap:8px}
:where(.btnA){display:inline-block;width:52px;height:52px;border-radius:50%;font:32px/46px 'Lilita One',sans-serif;text-align:center;color:#fff;border:3px solid #fff;
  background:#06d6a0;box-shadow:0 4px 0 #0006;animation:nwPulse .7s ease-in-out infinite}
:where(.talkA){position:absolute;transform:translate(-50%,-100%);display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:40px;background:#fff;
  border:4px solid #222;pointer-events:none;animation:nwPulse .8s ease-in-out infinite}
:where(.talkA i){font-style:normal;font-size:34px}`;document.head.appendChild(st);}

/* ---------- placeholder quest (used until a quest pack registers one) ---------- */
/* Hammerhead Hank by the start street: talk → find his lunchbox in the yard → bring it back → 🔨. The real Home World
   quests (Q1) live in src/world/quests/home.js; when any pack registers quests, this one stays out of the way. */
const QUEST_DEFAULT=[{
  id:'hank_lunchbox',world:'home',chapter:1,main:true,
  giver:{id:'hank',name:'Hammerhead Hank',emoji:'🔨',voice:'hank',at:[4.3,46.2],color:'#ffbe0b',hat:'#ff9f1c'},
  stageAt:[7.2,43.4],stageR:4,
  remind:['My lunchbox! Over there!'],
  steps:[
    {do:'talk',say:['Hey there, little buddy!','I lost my lunchbox!','My sandwich is in there!']},
    {do:'find',item:'lunchbox',icon:'🍱',at:'stage',say:{got:'My lunchbox! You found it!'}},
    {do:'bring',say:{start:'Bring it back to me!'}}],
  reward:{ability:'hammer',stars:2,say:['Here, take my Bonk Hammer!','Now go smash stuff!']},
  after:['Smashing is the best, right?','Mmm, sandwich.']}];
function questDefaults(){if(!QUEST_LIST.length)for(const q of QUEST_DEFAULT)registerQuest(q);}
