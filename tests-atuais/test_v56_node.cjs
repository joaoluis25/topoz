const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
function load(f){const context={window:{},module:{exports:{}},TextEncoder,Date,Math,console};context.globalThis=context.window;vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});return context.module.exports;}
const guard=load('topoz-guard.js');
const mod=load('topoz-v56.js');
function topics(raw){const arr=JSON.parse(JSON.stringify(raw));guard.breakTopicCycles(arr);return arr;}
assert.equal(guard.byteLength('á'),2,'contagem UTF-8');
assert.equal(guard.validateStudySnapshot({schemaVersion:4,topics:[]}).ok,true);
assert.equal(guard.validateStudySnapshot({schemaVersion:4,content:'あ'.repeat(1800000)}).ok,false,'limite 5 MB');
assert.equal(guard.validateStudySnapshot({schemaVersion:5}).ok,false,'migracao futura não reconhecida');
const cycle=topics([{id:'a',parentId:'b'},{id:'b',parentId:'c'},{id:'c',parentId:'a'}]);
assert.ok(cycle.some(t=>t.parentId===null),'ciclo reparado');
for(const start of cycle){let cur=start;let seen=new Set();while(cur?.parentId){assert.ok(!seen.has(cur.id),'nenhum ciclo remanescente');seen.add(cur.id);cur=cycle.find(x=>x.id===cur.parentId);}}
const today='2026-11-14';
const state={topics:[{id:'t1',name:'Português'},{id:'t2',name:'TI'}],notes:[{id:'n1',title:'Crase',topicId:'t1',reviewOn:true,nextReview:today},{id:'n2',title:'Futura',reviewOn:true,nextReview:'2099-01-01'}],flashcards:[{id:'f1',front:'Anáfora',topicId:'t1',nextReview:'2026-11-13'},{id:'f2',front:'Depois',topicId:'t2',nextReview:'2099-01-01'}],goals:[{id:'g',status:'andamento',topicId:'t2'}],events:[]};
const q=mod.makeQueue(state,today);assert.equal(q.length,2);assert.equal(q[0].type,'flashcard');
const dates=mod.planStudy(state,45,7,new Date('2026-11-14T12:00:00'));
assert.equal(dates.length,7);assert.equal(dates[0].minutes,45);assert.equal(dates[0].date,'2026-11-14');
assert.equal(mod.planStudy({...state,topics:[]},45).length,0);
assert.equal(mod.planStudy(state,1000,100).length,14);
assert.equal(mod.planStudy(state,1000,100)[0].minutes,180);
console.log('PASSOU: 12 verificações de tamanho, compatibilidade, ciclos e planejamento.');
