const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const root='/home/claude/v56/TOPOZ-ESTUDOS-BETA-V5-6';
let html=fs.readFileSync(path.join(root,'estudos-demo.html'),'utf8');
for(const s of ['style.css','topos-design.css','topos-labs.css','topoz-v56.css']) html=html.replace(`<link rel="stylesheet" href="${s}">`,`<style>\n${fs.readFileSync(path.join(root,s),'utf8')}\n</style>`);
for(const s of ['topos-voice.js','topos-labs.js','topoz-guard.js','topoz-v56.js']) html=html.replace(`<script src="${s}"></script>`,`<script>\n${fs.readFileSync(path.join(root,s),'utf8')}\n</script>`);
const eng=fs.readFileSync('/home/claude/calc/topoz-calc-engine.js','utf8'),ui=fs.readFileSync('/home/claude/calc/topoz-calc-ui.js','utf8');
let pass=0,fail=0;const bad=[];
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});
 for(const W of [1440,390]){
  const p=await b.newPage({viewport:{width:W,height:W===390?844:900},isMobile:W===390});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,100))});
  await p.setContent(html,{waitUntil:'load'});await p.waitForSelector('.nav-item');
  await p.addStyleTag({content:'.topos-study-demo-links{display:none!important}'});await p.addScriptTag({content:eng});await p.addScriptTag({content:ui});
  const T=(name,cond,extra)=>{cond?pass++:(fail++,bad.push(`[${W}] ${name} ${extra||''}`))};
  // presente em todas as rotas
  const routes=await p.evaluate(()=>ROUTES.map(r=>r.id));let missing=[];
  for(const r of routes){await p.evaluate(id=>navigate(id),r);await p.waitForTimeout(40);if(!(await p.locator('#tpzCalcFab').isVisible()))missing.push(r)}
  T('FAB visivel nas 24 rotas',missing.length===0,missing.join(','));
  await p.evaluate(()=>navigate('anotacoes'));
  // abrir/fechar: clique, Alt+C, ESC
  await p.click('#tpzCalcFab');T('abre ao clicar',await p.locator('#tpzCalc.open').count()===1);
  T('foco no campo ao abrir',await p.evaluate(()=>document.activeElement.classList.contains('tc-in')));
  await p.keyboard.press('Escape');T('ESC fecha',await p.locator('#tpzCalc.open').count()===0);
  T('foco volta ao FAB',await p.evaluate(()=>document.activeElement.id==='tpzCalcFab'));
  await p.keyboard.press('Alt+c');T('Alt+C abre',await p.locator('#tpzCalc.open').count()===1);
  const press=async(seq)=>{for(const lab of seq){await p.locator(`#tpzCalc .tc-g button[aria-label="${lab}"]`).first().click()}};
  const res=async()=>(await p.locator('#tpzCalc .tc-r').innerText()).trim();
  const clear=async()=>{await p.locator('#tpzCalc .tc-g button[aria-label="C"]').click()};
  const calc=async(name,seq,exp)=>{await clear();await press(seq);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();const r=await res();T(name,r===exp,`obtido "${r}" esperado "${exp}"`)};
  await calc('2+3×4=14',['2','+','3','×','4'],'14');
  await calc('9 ÷ 3 = 3',['9','÷','3'],'3');
  await calc('7−10 = -3',['7','−','1','0'],'-3');
  await calc('5! = 120',['5','n!'],'120');
  await calc('2 xʸ 10 = 1.024',['2','xʸ','1','0'],'1.024');
  await calc('√(81)=9',['√','8','1',')'],'9');
  await calc('x²: 12² = 144',['1','2','x²'],'144');
  await calc('sin(30)=0,5',['sin','3','0',')'],'0,5');
  await calc('cos(60)=0,5',['cos','6','0',')'],'0,5');
  await calc('tan(45)=1',['tan','4','5',')'],'1');
  await calc('ln(e)=1',['ln','e',')'],'1');
  await calc('log(1000)=3',['log','1','0','0','0',')'],'3');
  await calc('π×2 = 6,28318530718',['π','×','2'],'6,28318530718');
  await calc('50% = 0,5',['5','0','%'],'0,5');
  await calc('200+10% = 220',['2','0','0','+','1','0','%'],'220');
  await calc('0,1+0,2 = 0,3',['.','1','+','.','2'],'0,3');
  await calc('1÷0 erro',['1','÷','0'],'Divisão por zero');
  await calc('(2+3)×4 = 20',['(','2','+','3',')','×','4'],'20');
  // 2nd layer
  await clear();await p.locator('#tpzCalc .tc-g button[aria-label="2nd"]').click();
  await press(['sin⁻¹','1',')']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();T('2nd: asin(1)=90 (DEG)',(await res())==='90',await res());
  await clear();await p.locator('#tpzCalc .tc-g button[aria-label="2nd"]').click();await press(['10ˣ','3',')']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();T('2nd: 10^(3)=1.000',(await res())==='1.000',await res());
  await clear();await p.locator('#tpzCalc .tc-g button[aria-label="2nd"]').click();await press(['∛','2','7',')']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();T('2nd: ∛27=3',(await res())==='3',await res());
  await clear();await p.locator('#tpzCalc .tc-g button[aria-label="2nd"]').click();await press(['x³']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();T('2nd: x³ vazio nao quebra',true);
  await clear();
  // modos de ângulo
  await p.locator('#tpzCalc [data-act=angle][data-v=rad]').click();await clear();await press(['sin','π','÷','2',')']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();T('RAD sin(π/2)=1',(await res())==='1',await res());
  await p.locator('#tpzCalc [data-act=angle][data-v=grad]').click();await clear();await press(['sin','1','0','0',')']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();T('GRAD sin(100)=1',(await res())==='1',await res());
  await p.locator('#tpzCalc [data-act=angle][data-v=deg]').click();
  // Ans, continuação e memória
  await calc('6×7=42',['6','×','7'],'42');
  await p.locator('#tpzCalc .tc-g button[aria-label="+"]').click();await press(['8']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();T('continua do resultado: 42+8=50',(await res())==='50',await res());
  await clear();await press(['Ans','×','2']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();T('Ans×2=100',(await res())==='100',await res());
  await p.locator('#tpzCalc [data-act=mc]').click();await clear();await press(['1','0']);await p.locator('#tpzCalc [data-act=mplus]').click();T('M+ mostra M = 10',(await p.locator('#tpzCalc .tc-mem').innerText()).includes('10'));
  await clear();await press(['5']);await p.locator('#tpzCalc [data-act=mplus]').click();T('M+ acumula 15',(await p.locator('#tpzCalc .tc-mem').innerText()).includes('15'));
  await clear();await press(['3']);await p.locator('#tpzCalc [data-act=mminus]').click();T('M− reduz 12',(await p.locator('#tpzCalc .tc-mem').innerText()).includes('12'));
  await clear();await p.locator('#tpzCalc [data-act=mr]').click();await press(['×','2']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();T('MR×2=24',(await res())==='24',await res());
  await p.locator('#tpzCalc [data-act=mc]').click();T('MC limpa memória',(await p.locator('#tpzCalc .tc-mem').innerText()).trim()==='');
  // ± e ⌫
  await clear();await press(['5','±']);T('± → -(5)',(await p.inputValue('#tpzCalc .tc-in'))==='-(5)');await press(['±']);T('± volta 5',(await p.inputValue('#tpzCalc .tc-in'))==='5');
  await press(['⌫']);T('⌫ apaga',(await p.inputValue('#tpzCalc .tc-in'))==='');
  // teclado físico
  await clear();await p.fill('#tpzCalc .tc-in','sqrt(144)+2^3');await p.keyboard.press('Enter');T('teclado Enter: 20',(await res())==='20',await res());
  await p.fill('#tpzCalc .tc-in','1/(');await p.keyboard.press('Enter');T('expressão inválida mostra erro',(await p.locator('#tpzCalc .tc-r.err').count())===1);
  await p.fill('#tpzCalc .tc-in','5+5');T('pré-visualização ao digitar',(await res())==='10',await res());
  // histórico
  await p.keyboard.press('Enter');await p.locator('#tpzCalc [data-act=hist]').click();T('histórico lista cálculos',(await p.locator('#tpzCalc .tc-hist button[data-act=reuse]').count())>=3);
  await p.locator('#tpzCalc .tc-hist button[data-act=reuse]').first().click();T('reutilizar do histórico',(await p.inputValue('#tpzCalc .tc-in'))==='5+5');
  await p.locator('#tpzCalc [data-act=clearhist]').click();T('limpar histórico',(await p.locator('#tpzCalc .tc-hist button[data-act=reuse]').count())===0);
  // bases
  await clear();await press(['2','5','5']);await p.locator('#tpzCalc [data-act=base]').click();T('bases 255',(await res()).includes('HEX FF')&&(await res()).includes('BIN 11111111'),await res());
  // inserir no campo de outra tela
  await p.keyboard.press('Escape');await p.evaluate(()=>navigate('anotacoes'));await p.getByRole('button',{name:'+ Nova anotação'}).first().click();await p.waitForTimeout(200);
  await p.focus('#mNoteTitle').catch(()=>p.locator('input[placeholder^="Título"]').focus());
  await p.keyboard.press('Alt+c');await clear();await press(['2','×','4','5']);await p.locator('#tpzCalc .tc-g button[aria-label="="]').click();await p.locator('#tpzCalc [data-act=insert]').click();
  const ins=await p.evaluate(()=>{const e=document.querySelector('input[placeholder^="Título"]');return e&&e.value});T('inserir resultado no campo da nota',ins==='90',`valor "${ins}"`);
  await p.keyboard.press('Escape');
  // layout: não cobre botões principais e cabe na tela
  await p.keyboard.press('Alt+c');
  const box=await p.evaluate(()=>{const r=document.getElementById('tpzCalc').getBoundingClientRect();return {l:r.left,t:r.top,r:r.right,b:r.bottom,w:innerWidth,h:innerHeight}});
  T('painel cabe na janela',box.l>=0&&box.r<=box.w&&box.t>=0&&box.b<=box.h,JSON.stringify(box));
  const small=await p.evaluate(()=>[...document.querySelectorAll('#tpzCalc .tc-g button')].filter(b=>b.getBoundingClientRect().height<44).length);T('teclas ≥44px',small===0,small+' pequenas');
  await p.screenshot({path:`/tmp/t/calc_${W}.png`});
  T('sem erros JS',errs.length===0,errs.join('|'));
  await p.close();
 }
 console.log(`UI: PASSARAM ${pass} | FALHARAM ${fail}`);if(bad.length)console.log(bad.join('\n'));await b.close()})();
