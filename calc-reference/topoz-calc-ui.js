/* TOPOZ — interface da calculadora científica flutuante (depende de topoz-calc-engine.js).
 * Sem onclick inline: eventos delegados via data-act. Pronta para CSP sem 'unsafe-inline' em scripts. */
(function () {
  'use strict';
  if (window.TopozCalcUI) return;
  const C = window.TopozCalc;
  const LOGO = '<svg viewBox="0 0 64 64" width="22" height="22" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#14242c"/><rect x="13" y="34" width="9" height="18" rx="2" transform="skewX(-13)" fill="#90dec7"/><rect x="30" y="13" width="9" height="39" rx="2" transform="skewX(-13)" fill="#90dec7"/><rect x="47" y="23" width="9" height="29" rx="2" transform="skewX(-13)" fill="#eab86e"/></svg>';
  const CSS = `
#tpzCalcFab{position:fixed;right:16px;bottom:84px;z-index:9000;width:48px;height:48px;border-radius:14px;border:1px solid var(--teal,#83d7bd);background:var(--surface,#16222e);color:var(--teal,#83d7bd);font:600 18px/1 'JetBrains Mono',ui-monospace,monospace;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.35)}
#tpzCalcFab:focus-visible,#tpzCalc button:focus-visible,#tpzCalc input:focus-visible{outline:2px solid var(--amber,#e8b46e);outline-offset:2px}
#tpzCalc{position:fixed;right:16px;bottom:140px;z-index:9001;width:340px;max-width:calc(100vw - 24px);background:var(--surface,#16222e);color:var(--text,#edf4f4);border:1px solid var(--border,#30414e);border-top:3px solid var(--teal,#83d7bd);border-radius:16px;box-shadow:0 18px 48px rgba(0,0,0,.5);font-family:Inter,system-ui,sans-serif;display:none}
#tpzCalc.open{display:block}
#tpzCalc .tc-h{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--border-soft,#253441)}
#tpzCalc .tc-t{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:600 11px/1.2 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.08em;color:var(--text-dim,#b5c5cf)}
#tpzCalc .tc-seg{display:flex;border:1px solid var(--border,#30414e);border-radius:8px;overflow:hidden}
#tpzCalc .tc-seg button{padding:4px 8px;font:600 11px 'JetBrains Mono',ui-monospace,monospace;background:transparent;color:var(--text-dim,#b5c5cf);border:0;cursor:pointer;min-height:28px}
#tpzCalc .tc-seg button[aria-pressed=true]{background:var(--teal,#83d7bd);color:#0e1720}
#tpzCalc .tc-x{background:transparent;border:0;color:var(--text-dim,#b5c5cf);font-size:18px;cursor:pointer;min-width:32px;min-height:32px;border-radius:8px}
#tpzCalc .tc-d{padding:10px 12px 6px}
#tpzCalc .tc-in{width:100%;box-sizing:border-box;background:var(--bg,#0e1720);color:var(--text,#edf4f4);border:1px solid var(--border,#30414e);border-radius:10px;padding:8px 10px;font:500 16px 'JetBrains Mono',ui-monospace,monospace}
#tpzCalc .tc-r{min-height:38px;margin-top:6px;text-align:right;font:600 28px 'JetBrains Mono',ui-monospace,monospace;color:var(--teal,#83d7bd);overflow-x:auto;white-space:nowrap}
#tpzCalc .tc-r.err{color:#f08a7e;font-size:14px;white-space:normal}
#tpzCalc .tc-s{display:flex;justify-content:space-between;font:11px 'JetBrains Mono',ui-monospace,monospace;color:var(--text-faint,#99abb8);min-height:16px}
#tpzCalc .tc-m{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:0 12px 6px}
#tpzCalc .tc-g{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:0 12px 12px}
#tpzCalc .tc-g button,#tpzCalc .tc-m button{min-height:44px;border-radius:10px;border:1px solid var(--border,#30414e);background:var(--surface-2,#1c2b37);color:var(--text,#edf4f4);font:500 15px Inter,system-ui,sans-serif;cursor:pointer}
#tpzCalc .tc-m button{min-height:32px;font:600 11px 'JetBrains Mono',ui-monospace,monospace;color:var(--text-dim,#b5c5cf)}
#tpzCalc .tc-g button.fn{color:var(--teal,#83d7bd);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px}
#tpzCalc .tc-g button.op{color:var(--amber,#e8b46e);font-weight:700}
#tpzCalc .tc-g button.eq{background:var(--amber,#e8b46e);color:#0e1720;border-color:var(--amber,#e8b46e);font-weight:700}
#tpzCalc .tc-g button[aria-pressed=true]{background:var(--teal,#83d7bd);color:#0e1720}
#tpzCalc .tc-hist{max-height:150px;overflow:auto;margin:0 12px 10px;border-top:1px solid var(--border-soft,#253441);padding-top:6px;font:12px 'JetBrains Mono',ui-monospace,monospace}
#tpzCalc .tc-hist button{display:block;width:100%;text-align:right;background:transparent;border:0;color:var(--text-dim,#b5c5cf);padding:4px;cursor:pointer;min-height:28px}
#tpzCalc .tc-bar{display:flex;gap:6px;padding:0 12px 10px}
#tpzCalc .tc-bar button{flex:1;min-height:34px;border-radius:8px;border:1px solid var(--border,#30414e);background:transparent;color:var(--text-dim,#b5c5cf);font-size:12px;cursor:pointer}
@media (max-width:600px){#tpzCalc{left:8px;right:8px;bottom:8px;width:auto;max-width:none;max-height:92vh;overflow:auto}#tpzCalcFab{bottom:76px}}
@media (prefers-reduced-motion:no-preference){#tpzCalc.open{animation:tpzIn .16s ease-out}@keyframes tpzIn{from{opacity:0;transform:translateY(8px)}}}`;
  const state = { angle: 'deg', second: false, ans: 0, memory: 0, history: [], last: null, target: null };

  const KEYS = [
    ['2nd', 'fn', 'second'], ['sin', 'fn', 'f:sin(', 'asin('], ['cos', 'fn', 'f:cos(', 'acos('], ['tan', 'fn', 'f:tan(', 'atan('], ['C', 'op', 'clear'],
    ['ln', 'fn', 'f:ln(', 'exp('], ['log', 'fn', 'f:log(', '10^('], ['√', 'fn', 'f:√(', '∛('], ['x²', 'fn', 't:²', 't:³'], ['⌫', 'op', 'back'],
    ['xʸ', 'fn', 't:^', 'f:root('], ['(', 'fn', 't:('], [')', 'fn', 't:)'], ['n!', 'fn', 't:!'], ['÷', 'op', 't:÷'],
    ['π', 'fn', 't:π'], ['7', '', 't:7'], ['8', '', 't:8'], ['9', '', 't:9'], ['×', 'op', 't:×'],
    ['e', 'fn', 't:e'], ['4', '', 't:4'], ['5', '', 't:5'], ['6', '', 't:6'], ['−', 'op', 't:−'],
    ['Ans', 'fn', 't:Ans'], ['1', '', 't:1'], ['2', '', 't:2'], ['3', '', 't:3'], ['+', 'op', 't:+'],
    ['%', 'fn', 't:%'], ['±', 'fn', 'neg'], ['0', '', 't:0'], ['.', '', 't:.'], ['=', 'eq', 'eval'],
  ];
  const SECOND_LABEL = { sin: 'sin⁻¹', cos: 'cos⁻¹', tan: 'tan⁻¹', ln: 'eˣ', log: '10ˣ', '√': '∛', 'x²': 'x³', 'xʸ': 'ʸ√x' };

  let root, fab, input, out, status, histBox, keypad;

  function build() {
    const st = document.createElement('style'); st.id = 'tpz-calc-css'; st.textContent = CSS; document.head.appendChild(st);
    fab = document.createElement('button'); fab.id = 'tpzCalcFab'; fab.type = 'button';
    fab.setAttribute('aria-label', 'Abrir calculadora científica'); fab.title = 'Calculadora (Alt+C)'; fab.textContent = 'fx'; fab.dataset.act = 'toggle';
    root = document.createElement('div'); root.id = 'tpzCalc'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Calculadora científica TOPOZ');
    root.innerHTML = `<div class="tc-h">${LOGO}<span class="tc-t">TOPOZ // CALC</span>
      <div class="tc-seg" role="group" aria-label="Unidade de ângulo"><button type="button" data-act="angle" data-v="deg" aria-pressed="true">DEG</button><button type="button" data-act="angle" data-v="rad" aria-pressed="false">RAD</button><button type="button" data-act="angle" data-v="grad" aria-pressed="false">GRAD</button></div>
      <button type="button" class="tc-x" data-act="close" aria-label="Fechar calculadora">✕</button></div>
      <div class="tc-d"><input class="tc-in" type="text" inputmode="text" autocomplete="off" spellcheck="false" aria-label="Expressão" placeholder="ex.: sin(30)+2π">
      <div class="tc-r" aria-live="polite" aria-atomic="true">0</div><div class="tc-s"><span class="tc-mem"></span><span class="tc-ang">DEG</span></div></div>
      <div class="tc-m"><button type="button" data-act="mc">MC</button><button type="button" data-act="mr">MR</button><button type="button" data-act="mplus">M+</button><button type="button" data-act="mminus">M−</button><button type="button" data-act="hist">Histórico</button></div>
      <div class="tc-g"></div><div class="tc-hist" hidden></div>
      <div class="tc-bar"><button type="button" data-act="copy">Copiar</button><button type="button" data-act="insert">Inserir no campo</button><button type="button" data-act="base">Bases</button></div>`;
    document.body.append(fab, root);
    input = root.querySelector('.tc-in'); out = root.querySelector('.tc-r'); status = root.querySelector('.tc-mem'); histBox = root.querySelector('.tc-hist'); keypad = root.querySelector('.tc-g');
    paintKeys(); bind();
  }
  function paintKeys() {
    keypad.innerHTML = KEYS.map((k, i) => {
      const lab = state.second && SECOND_LABEL[k[0]] ? SECOND_LABEL[k[0]] : k[0];
      const pressed = k[2] === 'second' ? ` aria-pressed="${state.second}"` : '';
      return `<button type="button" class="${k[1]}" data-i="${i}" data-act="key"${pressed} aria-label="${lab}">${lab}</button>`;
    }).join('');
  }
  function insert(text) {
    const s = input.selectionStart ?? input.value.length, e = input.selectionEnd ?? s;
    input.value = input.value.slice(0, s) + text + input.value.slice(e);
    const pos = s + text.length; input.setSelectionRange(pos, pos); input.focus(); live();
  }
  function live() { // pré-visualização silenciosa enquanto digita
    const ex = input.value.trim(); out.classList.remove('err');
    if (!ex) { out.textContent = '0'; return; }
    const r = C.evaluate(ex, { angle: state.angle, ans: state.ans, memory: state.memory });
    out.textContent = r.ok ? r.text : '…';
  }
  function evalNow() {
    const ex = input.value.trim(); if (!ex) return;
    const r = C.evaluate(ex, { angle: state.angle, ans: state.ans, memory: state.memory });
    if (!r.ok) { out.textContent = r.error; out.classList.add('err'); return; }
    out.classList.remove('err'); out.textContent = r.text; state.ans = r.value; state.last = r;
    state.history.unshift({ ex, text: r.text, value: r.value }); state.history = state.history.slice(0, 30);
    paintHist(); input.value = ''; input.dataset.done = '1';
  }
  function paintHist() {
    histBox.innerHTML = state.history.length ? state.history.map((h, i) => `<button type="button" data-act="reuse" data-i="${i}">${esc(h.ex)} = <b>${esc(h.text)}</b></button>`).join('') + '<button type="button" data-act="clearhist">Limpar histórico</button>' : '<em>Sem cálculos ainda</em>';
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function memStatus() { status.textContent = state.memory ? 'M = ' + C.formatBR(state.memory) : ''; }
  function currentValue() { const r = state.last || C.evaluate(input.value || '0', { angle: state.angle, ans: state.ans, memory: state.memory }); return r && r.ok ? r.value : null; }
  function open() { root.classList.add('open'); fab.setAttribute('aria-expanded', 'true'); input.focus(); }
  function close() { root.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }

  function onAction(el) {
    const act = el.dataset.act;
    if (act === 'toggle') return root.classList.contains('open') ? close() : open();
    if (act === 'close') return close();
    if (act === 'angle') { state.angle = el.dataset.v; root.querySelectorAll('[data-act=angle]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === state.angle))); root.querySelector('.tc-ang').textContent = state.angle.toUpperCase(); return live(); }
    if (act === 'hist') { histBox.hidden = !histBox.hidden; if (!histBox.hidden) paintHist(); return; }
    if (act === 'reuse') { const h = state.history[+el.dataset.i]; if (h) { input.value = h.ex; live(); input.focus(); } return; }
    if (act === 'clearhist') { state.history = []; return paintHist(); }
    if (act === 'mc') { state.memory = 0; return memStatus(); }
    if (act === 'mr') return insert('M');
    if (act === 'mplus' || act === 'mminus') { const v = currentValue(); if (v === null) return; state.memory = C.clean(state.memory + (act === 'mplus' ? v : -v), 12); return memStatus(); }
    if (act === 'copy') { const v = currentValue(); if (v !== null && navigator.clipboard) navigator.clipboard.writeText(C.formatBR(v)).catch(() => {}); return; }
    if (act === 'insert') { const v = currentValue(); const t = state.target; if (v === null || !t || !t.isConnected) return; const txt = C.formatBR(v); if (t.setRangeText) { t.setRangeText(txt, t.selectionStart ?? t.value.length, t.selectionEnd ?? t.value.length, 'end'); t.dispatchEvent(new Event('input', { bubbles: true })); t.focus(); } return; }
    if (act === 'base') { const v = currentValue(); if (v === null) return; try { out.classList.remove('err'); out.textContent = 'BIN ' + C.toBase(v, 2) + ' · OCT ' + C.toBase(v, 8) + ' · HEX ' + C.toBase(v, 16); } catch (e) { out.textContent = e.message; out.classList.add('err'); } return; }
    if (act === 'key') {
      const k = KEYS[+el.dataset.i]; let code = k[2];
      if (code === 'second') { state.second = !state.second; return paintKeys(); }
      if (code === 'clear') { input.value = ''; state.last = null; out.classList.remove('err'); out.textContent = '0'; input.focus(); return; }
      if (code === 'back') { const s = input.selectionStart ?? input.value.length; if (s > 0) { input.value = input.value.slice(0, s - 1) + input.value.slice(s); input.setSelectionRange(s - 1, s - 1); } input.focus(); return live(); }
      if (code === 'neg') { const v = input.value.trim(); input.value = v.startsWith('-(') && v.endsWith(')') ? v.slice(2, -1) : v ? '-(' + v + ')' : '-'; return live(); }
      if (code === 'eval') return evalNow();
      if (state.second && k[3]) code = /^[tf]:/.test(k[3]) ? k[3] : 'f:' + k[3];
      if (input.dataset.done === '1' && /^t:[+−×÷^]/.test(code)) input.value = 'Ans'; // continuar do resultado anterior
      input.dataset.done = '';
      const text = code.slice(2); insert(text);
      if (state.second) { state.second = false; paintKeys(); }
    }
  }
  function bind() {
    document.addEventListener('click', (e) => { const el = e.target.closest('[data-act]'); if (el && (root.contains(el) || el === fab)) onAction(el); });
    input.addEventListener('input', () => { input.dataset.done = ''; live(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); evalNow(); } });
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); root.classList.contains('open') ? close() : open(); }
      else if (e.key === 'Escape' && root.classList.contains('open')) { e.stopPropagation(); close(); }
    }, true);
    document.addEventListener('focusin', (e) => { const t = e.target; if (t && !root.contains(t) && t !== fab && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) state.target = t; });
  }
  function init() { if (document.getElementById('tpzCalc')) return; build(); window.TopozCalcUI = { open, close, state }; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
