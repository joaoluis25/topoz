// TOPOZ Estudos V5.5 — testes sem dependências de terceiros.
// Execute: node tests-atuais/test_labs_node.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'../topos-labs.js'),'utf8');
const sandbox={window:{crypto:{randomUUID:()=>'12345678-1234-1234-1234-123456789012'}},console,URL,Date,Math,setTimeout};
vm.createContext(sandbox);vm.runInContext(code,sandbox,{filename:'topos-labs.js'});
const LAB=sandbox.window.LAB;
assert.ok(LAB,'extensão carregada');
const orig={maps:[{id:'m1',title:'Matéria <script>danger</script>',nodes:[{id:'n1',parentId:'ghost',title:'Raiz'}, {id:'n2',parentId:'n1',title:'Filho'}]}],research:[{id:'p1',title:'Pesquisa',sources:[{id:'s1',title:'Fonte perigosa',url:'javascript:alert(1)'}]}],lessons:[{id:'l1',title:'Aula',body:'Texto preservado'}]};
const n=LAB.normalize(orig);
assert.equal(n.maps.length,1);
assert.equal(n.maps[0].nodes[0].parentId,null,'pai ausente normalizado');
assert.equal(n.maps[0].nodes[1].parentId,'n1');
const cyclic=LAB.normalize({maps:[{title:'Ciclo',nodes:[{id:'a',parentId:'b',title:'A'},{id:'b',parentId:'a',title:'B'}]}]});
assert.ok(cyclic.maps[0].nodes.some(n=>!n.parentId),'ciclo em mapa reparado');
assert.equal(n.research[0].sources[0].url,'','URL com protocolo inseguro descartada');
assert.equal(n.lessons[0].body,'Texto preservado');
assert.equal(n.paths.length,0,'coleção ausente recebe default');
assert.equal(n.transcripts.length,0,'coleção ausente recebe default');
assert.equal(LAB.parsePairs('Pergunta | Resposta\nSem par').length,1);
const huge=LAB.normalize({lessons:[{title:'Aula',body:'x'.repeat(30000)}]});
assert.equal(huge.lessons[0].body.length,25000);
assert.equal(typeof LAB.viewMapas,'function');
console.log('OK: normalizador, URLs, limites, hierarquia, pares e compatibilidade retroativa.');
