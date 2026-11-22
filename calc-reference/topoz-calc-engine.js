/* TOPOZ — motor da calculadora científica.
 * Sem eval/Function. Analisador descendente recursivo com precedência matemática.
 * Uso: TopozCalc.evaluate('sin(30)+2π', { angle: 'deg', ans: 0, memory: 0 })
 *  -> { ok:true, value:2.5.., text:'...' } | { ok:false, error:'mensagem' } */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TopozCalc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const PI = Math.PI, E = Math.E, PHI = (1 + Math.sqrt(5)) / 2;
  class CalcError extends Error {}
  const fail = (m) => { throw new CalcError(m); };

  const clean = (v, digits) => {
    if (typeof v !== 'number') return v;
    if (!isFinite(v)) fail('Resultado fora do limite');
    if (v === 0) return 0;
    return Number(v.toPrecision(digits || 12));
  };
  const mid = (v) => clean(v, 15); // resultados intermediários: preserva precisão para trigonometria
  const snapTrig = (v) => (Math.abs(v) < 1e-14 ? 0 : v);

  const toRad = (x, mode) => (mode === 'rad' ? x : mode === 'grad' ? (x * PI) / 200 : (x * PI) / 180);
  const fromRad = (x, mode) => (mode === 'rad' ? x : mode === 'grad' ? (x * 200) / PI : (x * 180) / PI);

  const fact = (n) => {
    if (!Number.isInteger(n) || n < 0) fail('Fatorial só existe para inteiros ≥ 0');
    if (n > 170) fail('Resultado fora do limite');
    let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
  };
  const gcd2 = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const needInt = (x, name) => { if (!Number.isInteger(x)) fail(name + ' exige números inteiros'); return x; };
  const nPr = (n, r) => { needInt(n, 'nPr'); needInt(r, 'nPr'); if (n < 0 || r < 0 || r > n) fail('nPr: use 0 ≤ r ≤ n'); let p = 1; for (let i = 0; i < r; i++) p *= n - i; return p; };
  const nCr = (n, r) => { needInt(n, 'nCr'); needInt(r, 'nCr'); if (n < 0 || r < 0 || r > n) fail('nCr: use 0 ≤ r ≤ n'); r = Math.min(r, n - r); let p = 1; for (let i = 1; i <= r; i++) p = (p * (n - r + i)) / i; return Math.round(p); };
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const mean = (a) => { if (!a.length) fail('Informe valores'); return sum(a) / a.length; };
  const variance = (a, sample) => { const n = a.length; if (n < (sample ? 2 : 1)) fail('Valores insuficientes'); const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (sample ? n - 1 : n); };
  const median = (a) => { if (!a.length) fail('Informe valores'); const s = [...a].sort((x, y) => x - y), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };

  const FUNCS = (mode) => ({
    sin: (x) => snapTrig(Math.sin(toRad(x, mode))),
    cos: (x) => snapTrig(Math.cos(toRad(x, mode))),
    tan: (x) => { const r = toRad(x, mode); if (Math.abs(Math.cos(r)) < 1e-14) fail('Tangente indefinida'); return snapTrig(Math.tan(r)); },
    asin: (x) => { if (Math.abs(x) > 1) fail('asin: use valores entre -1 e 1'); return fromRad(Math.asin(x), mode); },
    acos: (x) => { if (Math.abs(x) > 1) fail('acos: use valores entre -1 e 1'); return fromRad(Math.acos(x), mode); },
    atan: (x) => fromRad(Math.atan(x), mode),
    atan2: (y, x) => fromRad(Math.atan2(y, x), mode),
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh,
    acosh: (x) => { if (x < 1) fail('acosh: use x ≥ 1'); return Math.acosh(x); },
    atanh: (x) => { if (Math.abs(x) >= 1) fail('atanh: use |x| < 1'); return Math.atanh(x); },
    ln: (x) => { if (x <= 0) fail('Logaritmo exige número positivo'); return Math.log(x); },
    log: (x) => { if (x <= 0) fail('Logaritmo exige número positivo'); return Math.log10(x); },
    log2: (x) => { if (x <= 0) fail('Logaritmo exige número positivo'); return Math.log2(x); },
    logb: (b, x) => { if (b <= 0 || b === 1 || x <= 0) fail('logb: base positiva e diferente de 1'); return Math.log(x) / Math.log(b); },
    exp: Math.exp,
    sqrt: (x) => { if (x < 0) fail('Raiz quadrada de número negativo'); return Math.sqrt(x); },
    cbrt: Math.cbrt,
    root: (n, x) => { needInt(n, 'root'); if (n === 0) fail('Índice da raiz não pode ser 0'); if (x < 0 && n % 2 === 0) fail('Raiz par de número negativo'); const r = x < 0 ? -Math.pow(-x, 1 / n) : Math.pow(x, 1 / n); return r; },
    pow: Math.pow, abs: Math.abs, sign: Math.sign, trunc: Math.trunc, floor: Math.floor, ceil: Math.ceil,
    round: (x, d) => { d = d === undefined ? 0 : needInt(d, 'round'); const f = 10 ** d; return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f; },
    mod: (a, b) => { if (b === 0) fail('Divisão por zero'); return ((a % b) + b) % b; },
    fact, nPr, nCr,
    gcd: (...a) => a.reduce((g, x) => gcd2(g, needInt(x, 'gcd')), 0),
    lcm: (...a) => a.reduce((l, x) => { needInt(x, 'lcm'); return l === 0 || x === 0 ? 0 : Math.abs(l * x) / gcd2(l, x); }, 1),
    hypot: Math.hypot, min: (...a) => Math.min(...a), max: (...a) => Math.max(...a),
    sum: (...a) => sum(a), mean: (...a) => mean(a), median: (...a) => median(a),
    stdev: (...a) => Math.sqrt(variance(a, true)), stdevp: (...a) => Math.sqrt(variance(a, false)),
    var: (...a) => variance(a, true), varp: (...a) => variance(a, false),
    rad: (x) => (x * PI) / 180, deg: (x) => (x * 180) / PI,
  });
  const ALIASES = { raiz: 'sqrt', fat: 'fact', media: 'mean', mediana: 'median', desvio: 'stdev', arcsin: 'asin', arccos: 'acos', arctan: 'atan', lg: 'log', tg: 'tan' };
  const ARITY = { sin: [1, 1], cos: [1, 1], tan: [1, 1], asin: [1, 1], acos: [1, 1], atan: [1, 1], atan2: [2, 2], sinh: [1, 1], cosh: [1, 1], tanh: [1, 1], asinh: [1, 1], acosh: [1, 1], atanh: [1, 1], ln: [1, 1], log: [1, 1], log2: [1, 1], logb: [2, 2], exp: [1, 1], sqrt: [1, 1], cbrt: [1, 1], root: [2, 2], pow: [2, 2], abs: [1, 1], sign: [1, 1], trunc: [1, 1], floor: [1, 1], ceil: [1, 1], round: [1, 2], mod: [2, 2], fact: [1, 1], nPr: [2, 2], nCr: [2, 2], gcd: [1, 99], lcm: [1, 99], hypot: [1, 99], min: [1, 99], max: [1, 99], sum: [1, 999], mean: [1, 999], median: [1, 999], stdev: [1, 999], stdevp: [1, 999], var: [1, 999], varp: [1, 999], rad: [1, 1], deg: [1, 1] };

  function tokenize(src) {
    const s = src.replace(/\s+/g, '').replace(/×|·|⋅/g, '*').replace(/÷/g, '/').replace(/[−–—]/g, '-').replace(/\*\*/g, '^');
    const t = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (num) { i += num[0].length; if (s[i] === '.') fail('Número inválido'); t.push({ k: 'num', v: parseFloat(num[0]) }); continue; }
      if (c === 'π') { t.push({ k: 'id', v: 'pi' }); i++; continue; }
      if (c === 'φ') { t.push({ k: 'id', v: 'phi' }); i++; continue; }
      if (c === '√') { t.push({ k: 'id', v: 'sqrt', prefix: true }); i++; continue; }
      if (c === '∛') { t.push({ k: 'id', v: 'cbrt', prefix: true }); i++; continue; }
      const id = /^[A-Za-z_][A-Za-z_0-9]*/.exec(s.slice(i));
      if (id) { t.push({ k: 'id', v: id[0] }); i += id[0].length; continue; }
      if ('+-*/^(),!%²³'.includes(c)) { t.push({ k: 'op', v: c }); i++; continue; }
      fail('Caractere inválido: ' + c);
    }
    return t;
  }

  function evaluate(expr, opts) {
    opts = opts || {};
    const mode = opts.angle || 'deg';
    try {
      if (!String(expr).trim()) fail('Digite uma expressão');
      if (String(expr).length > 500) fail('Expressão muito longa');
      const F = FUNCS(mode);
      const tk = tokenize(String(expr)); let p = 0;
      const peek = () => tk[p], next = () => tk[p++];
      const isOp = (v) => peek() && peek().k === 'op' && peek().v === v;
      const startsPrimary = () => { const x = peek(); return x && (x.k === 'num' || x.k === 'id' || (x.k === 'op' && x.v === '(')); };
      const N = (v, pct, raw) => ({ v, pct: !!pct, raw });

      function args() {
        const a = [];
        if (isOp(')')) { next(); return a; }
        for (;;) { a.push(parseExpr().v); if (isOp(',')) { next(); continue; } if (isOp(')')) { next(); break; } fail('Parêntese ausente'); }
        return a;
      }
      function primary() {
        const x = next();
        if (!x) fail('Expressão incompleta');
        if (x.k === 'num') return N(x.v);
        if (x.k === 'op' && x.v === '(') { const r = parseExpr(); if (!isOp(')')) fail('Parêntese ausente'); next(); return N(r.v); }
        if (x.k === 'id') {
          const name = ALIASES[x.v] || x.v;
          const lower = name.toLowerCase();
          if (lower === 'pi') return N(PI);
          if (lower === 'phi') return N(PHI);
          if (name === 'e') return N(E);
          if (lower === 'ans') return N(Number(opts.ans || 0));
          if (name === 'M') return N(Number(opts.memory || 0));
          const key = F[name] ? name : (F[lower] ? lower : null);
          if (!key) fail('Desconhecido: ' + x.v);
          let a;
          if (isOp('(')) { next(); a = args(); }
          else if (x.prefix) { a = [unary().v]; }
          else fail(key + ' precisa de parênteses');
          const [mn, mx] = ARITY[key] || [1, 1];
          if (a.length < mn || a.length > mx) fail(key + ': número de argumentos inválido');
          return N(F[key](...a));
        }
        fail('Símbolo inesperado: ' + x.v);
      }
      function postfix() {
        let r = primary();
        for (;;) {
          if (isOp('!')) { next(); r = N(fact(r.v)); }
          else if (isOp('%')) { next(); r = N(r.v / 100, true, r.v); }
          else if (isOp('²')) { next(); r = N(r.v ** 2); }
          else if (isOp('³')) { next(); r = N(r.v ** 3); }
          else break;
        }
        return r;
      }
      function power() {
        const base = postfix();
        if (isOp('^')) {
          next();
          const ex = unary();
          if (base.v < 0 && !Number.isInteger(ex.v)) fail('Potência fracionária de número negativo');
          if (base.v === 0 && ex.v < 0) fail('Divisão por zero');
          return N(Math.pow(base.v, ex.v));
        }
        return base;
      }
      function unary() {
        if (isOp('-')) { next(); const r = unary(); return N(-r.v); }
        if (isOp('+')) { next(); return unary(); }
        return power();
      }
      function term() {
        let l = unary();
        for (;;) {
          if (isOp('*')) { next(); const r = unary(); l = N(mid(l.v * r.v)); }
          else if (isOp('/')) { next(); const r = unary(); if (r.v === 0) fail('Divisão por zero'); l = N(mid(l.v / r.v)); }
          else if (startsPrimary()) { const r = unary(); l = N(mid(l.v * r.v)); }
          else break;
        }
        return l;
      }
      function parseExpr() {
        let l = term();
        for (;;) {
          if (isOp('+')) { next(); const r = term(); l = N(mid(r.pct ? l.v + (l.v * r.raw) / 100 : l.v + r.v)); }
          else if (isOp('-')) { next(); const r = term(); l = N(mid(r.pct ? l.v - (l.v * r.raw) / 100 : l.v - r.v)); }
          else break;
        }
        return l;
      }
      const res = parseExpr();
      if (p < tk.length) fail('Símbolo inesperado: ' + tk[p].v);
      const value = clean(res.v, 12);
      return { ok: true, value, text: formatBR(value) };
    } catch (err) {
      if (err instanceof CalcError) return { ok: false, error: err.message };
      return { ok: false, error: 'Expressão inválida' };
    }
  }

  function formatBR(v) {
    if (!isFinite(v)) return 'Erro';
    const a = Math.abs(v);
    if (a !== 0 && (a >= 1e12 || a < 1e-6)) return v.toExponential(6).replace(/\.?0+e/, 'e').replace('.', ',');
    const s = String(Number(v.toPrecision(12)));
    const [i, d] = s.split('.');
    const ip = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return d ? ip + ',' + d : ip;
  }
  function toBase(v, base) {
    if (!Number.isInteger(v) || Math.abs(v) > Number.MAX_SAFE_INTEGER) fail('Conversão de base exige inteiro seguro');
    return (v < 0 ? '-' : '') + Math.abs(v).toString(base).toUpperCase();
  }
  return { evaluate, formatBR, toBase, clean };
});
