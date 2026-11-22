const C=require('./topoz-calc-engine.js');
let pass=0,fail=0;const bad=[];
const near=(a,b,eps=1e-9)=>Math.abs(a-b)<=eps*Math.max(1,Math.abs(b));
function ok(expr,exp,opts){const r=C.evaluate(expr,opts);const good=r.ok&&(typeof exp==='number'?near(r.value,exp):r.text===exp);good?pass++:(fail++,bad.push(`${expr} => ${JSON.stringify(r)} esperado ${exp}`))}
function err(expr,sub,opts){const r=C.evaluate(expr,opts);const good=!r.ok&&(!sub||r.error.includes(sub));good?pass++:(fail++,bad.push(`${expr} deveria dar erro [${sub}] => ${JSON.stringify(r)}`))}
// básico e precedência
ok('1+2',3);ok('2+3*4',14);ok('(2+3)*4',20);ok('10-4-3',3);ok('100/4/5',5);ok('2*3+4*5',26);ok('0.1+0.2',0.3);ok('0.3-0.1',0.2);ok('1/3*3',1);ok('7/2',3.5);
ok('2^3',8);ok('2^3^2',512);ok('-2^2',-4);ok('(-2)^2',4);ok('2^-2',0.25);ok('2^0.5',Math.SQRT2);ok('10^6',1e6);ok('5!',120);ok('0!',1);ok('10!',3628800);ok('3!+2',8);ok('(2+1)!',6);ok('170!',7.257415615308e306);
ok('-5+3',-2);ok('--5',5);ok('+5',5);ok('3*-2',-6);ok('4/-2',-2);ok('2×3',6);ok('8÷2',4);ok('5−2',3);ok('2**3',8);
// implícita
ok('2π',2*Math.PI);ok('3(4+1)',15);ok('(1+2)(3+4)',21);ok('2sin(90)',2);ok('π*2',2*Math.PI);ok('2e',2*Math.E);ok('2e3',2000);ok('1.5e-3',0.0015);
// constantes
ok('pi',Math.PI);ok('e',Math.E);ok('phi',(1+Math.sqrt(5))/2);ok('e^1',Math.E);ok('e^(ln(5))',5);
// porcentagem
ok('50%',0.5);ok('200+10%',220);ok('200-10%',180);ok('200*10%',20);ok('50/50%',100);ok('100+50%+50%',225);ok('80%',0.8);ok('(100+50)%',1.5);
// quadrado/cubo, raízes
ok('5²',25);ok('2³',8);ok('3²+4²',25);ok('√9',3);ok('√(16)',4);ok('√2',Math.SQRT2);ok('∛27',3);ok('sqrt(144)',12);ok('cbrt(-8)',-2);ok('root(3,27)',3);ok('root(2,81)',9);ok('root(3,-8)',-2);ok('raiz(49)',7);ok('√9+√16',7);ok('2√9',6);
// trigonometria em graus
ok('sin(0)',0);ok('sin(30)',0.5);ok('sin(90)',1);ok('sin(180)',0);ok('sin(270)',-1);ok('sin(360)',0);ok('cos(0)',1);ok('cos(60)',0.5);ok('cos(90)',0);ok('cos(180)',-1);ok('tan(45)',1);ok('tan(0)',0);ok('tan(135)',-1);ok('sin(45)^2+cos(45)^2',1);ok('sin(-30)',-0.5);
ok('asin(0.5)',30);ok('acos(0.5)',60);ok('atan(1)',45);ok('asin(1)',90);ok('acos(-1)',180);ok('atan2(1,1)',45);ok('atan2(1,-1)',135);
err('tan(90)','indefinida');err('tan(270)','indefinida');err('asin(2)','asin');err('acos(-2)','acos');
// radianos e grados
ok('sin(pi/2)',1,{angle:'rad'});ok('cos(pi)',-1,{angle:'rad'});ok('sin(pi)',0,{angle:'rad'});ok('tan(pi/4)',1,{angle:'rad'});ok('asin(1)',Math.PI/2,{angle:'rad'});ok('atan(1)',Math.PI/4,{angle:'rad'});ok('sin(1)',Math.sin(1),{angle:'rad'});
ok('sin(100)',1,{angle:'grad'});ok('cos(200)',-1,{angle:'grad'});ok('tan(50)',1,{angle:'grad'});ok('asin(1)',100,{angle:'grad'});err('tan(pi/2)','indefinida',{angle:'rad'});
ok('rad(180)',Math.PI);ok('deg(pi)',180);
// hiperbólicas
ok('sinh(0)',0);ok('cosh(0)',1);ok('tanh(0)',0);ok('sinh(1)',Math.sinh(1));ok('cosh(1)',Math.cosh(1));ok('tanh(1)',Math.tanh(1));ok('asinh(1)',Math.asinh(1));ok('acosh(1)',0);ok('atanh(0.5)',Math.atanh(0.5));err('acosh(0.5)','acosh');err('atanh(1)','atanh');
// logs e exp
ok('ln(1)',0);ok('ln(e)',1);ok('log(100)',2);ok('log(1000)',3);ok('log2(8)',3);ok('logb(3,81)',4);ok('exp(0)',1);ok('exp(1)',Math.E);ok('ln(e^3)',3);ok('log(0.001)',-3);
err('ln(0)','Logaritmo');err('log(-5)','Logaritmo');err('log2(0)','Logaritmo');err('logb(1,5)','logb');
// divisão e domínio
err('1/0','Divisão por zero');err('5/(3-3)','Divisão por zero');err('√(-4)','negativo');err('sqrt(-1)','negativo');err('(-8)^0.5','fracionária');err('0^-1','Divisão por zero');err('root(0,5)','Índice');err('root(2,-4)','negativo');err('(-3)!','Fatorial');err('2.5!','Fatorial');err('171!','limite');err('10^400','limite');
ok('0^0',1);ok('1/3',1/3);
// arredondamento e utilidades
ok('abs(-7)',7);ok('floor(2.7)',2);ok('floor(-2.1)',-3);ok('ceil(2.1)',3);ok('ceil(-2.9)',-2);ok('trunc(-2.9)',-2);ok('round(2.5)',3);ok('round(3.14159,2)',3.14);ok('round(1.005,2)',1.01);ok('sign(-9)',-1);
ok('mod(10,3)',1);ok('mod(-1,3)',2);ok('mod(7,7)',0);err('mod(5,0)','Divisão por zero');ok('pow(2,10)',1024);ok('hypot(3,4)',5);
// combinatória e teoria dos números
ok('nPr(5,2)',20);ok('nCr(5,2)',10);ok('nCr(10,3)',120);ok('nCr(52,5)',2598960);ok('nPr(10,0)',1);ok('nCr(6,6)',1);err('nCr(3,5)','nCr');err('nPr(2.5,1)','inteiros');
ok('gcd(12,18)',6);ok('gcd(12,18,24)',6);ok('lcm(4,6)',12);ok('lcm(3,4,5)',60);ok('gcd(0,5)',5);ok('fact(6)',720);ok('fat(5)',120);
// estatística
ok('sum(1,2,3,4)',10);ok('mean(2,4,6)',4);ok('media(1,2,3,4)',2.5);ok('median(3,1,2)',2);ok('median(1,2,3,4)',2.5);ok('min(4,2,8)',2);ok('max(4,2,8)',8);ok('stdev(2,4,4,4,5,5,7,9)',2.138089935);ok('stdevp(2,4,4,4,5,5,7,9)',2);ok('var(1,2,3,4,5)',2.5);ok('varp(1,2,3,4,5)',2);err('stdev(5)','insuficientes');
// Ans e memória
ok('Ans*2',14,{ans:7});ok('M+1',11,{memory:10});ok('ans+ans',10,{ans:5});
// formatação
const fmt=(v,s)=>{const t=C.formatBR(v);t===s?pass++:(fail++,bad.push(`formatBR(${v}) = ${t} esperado ${s}`))};
fmt(1234567.89,'1.234.567,89');fmt(0.5,'0,5');fmt(1000,'1.000');fmt(-1234.5,'-1.234,5');fmt(1e15,'1e+15');fmt(0,'0');fmt(123,'123');fmt(0.0000001234,'1,234e-7');
// bases
const bs=(v,b,s)=>{const t=C.toBase(v,b);t===s?pass++:(fail++,bad.push(`toBase(${v},${b})=${t} esperado ${s}`))};bs(255,16,'FF');bs(10,2,'1010');bs(64,8,'100');bs(-5,2,'-101');
try{C.toBase(2.5,2);fail++;bad.push('toBase(2.5) deveria falhar')}catch(e){pass++}
// robustez: entradas inválidas
['','  ','2+','*3','(2+3','2+3)','2..3','sin','sin()','sin(1,2)','foo(1)','2 $ 3','1,5','()','!5','%','2++','abc'].forEach(x=>err(x,null));
// segurança: nada executa
['constructor','process.exit()','alert(1)','__proto__','this','globalThis','require("fs")','1;2','`x`','a=1'].forEach(x=>err(x,null));
err('9'.repeat(501),'longa');
// limites de tamanho de números
ok('1e300*1e300'.replace('*1e300',''),1e300);err('1e300*1e300','limite');
// espaços e símbolos
ok(' 2 + 3 ',5);ok('2 × ( 3 + 4 )',14);ok('1 000'.replace(' ',''),1000);
console.log(`PASSARAM ${pass} | FALHARAM ${fail}`);if(fail){console.log(bad.join('\n'));process.exit(1)}
