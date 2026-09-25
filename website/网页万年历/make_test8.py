# -*- coding: utf-8 -*-
"""make_test8.py —— 世纪视图"世纪卡+十年区间行"结构 + 回归"""
import io, re, json, subprocess, sys

HTML = r'F:\系统安装与开荒\本次整活\网页万年历\万年历.html'
FILES = r'F:\系统安装与开荒\本次整活\网页万年历\files'
OUT = r'F:\系统安装与开荒\本次整活\网页万年历\_test8.js'

html = io.open(HTML, encoding='utf-8').read()
inline = re.search(r'<script>\n(.*?)</script>', html, re.S).group(1)

tests = r'''
// ---------- 世纪视图 = 世纪卡 + 十年区间行（类似十年结构） ----------
view.mode = 'century'; view.year = 2026;
renderCentury();
var cw = document.getElementById('calWrap').innerHTML;
check('世纪标题为 1900-2100', document.getElementById('toolTitle').textContent === '1900 – 2100 年');
check('世纪视图 3 张世纪卡', (cw.match(/class="decade-card/g) || []).length === 3);
check('二十世纪卡', cw.indexOf('二十世纪') >= 0 && cw.indexOf('data-y="1900"') >= 0 && cw.indexOf('1900 – 1999') < 0);
check('二十一世纪卡', cw.indexOf('二十一世纪') >= 0 && cw.indexOf('data-y="2000"') >= 0);
check('2100 边界卡', cw.indexOf('data-y="2100" data-single="1"') >= 0);
check('卡内含十年区间行', cw.indexOf('class="drows"') >= 0 && cw.indexOf('1900 – 1909') >= 0 && cw.indexOf('2000 – 2009') >= 0);
var reRows = cw.match(/class="drow(?: cur-y)?" data-y=/g) || [];
check('十年区间行共 21 行', reRows.length === 21);
check('20 世纪 10 行', (cw.match(/class="drow(?: cur-y)?" data-y="19\d\d"/g) || []).length === 10);
check('21 世纪 10 行', (cw.match(/class="drow(?: cur-y)?" data-y="20\d\d"/g) || []).length === 10);
check('当前世纪卡高亮', cw.indexOf('decade-card is-cur') >= 0 && cw.indexOf('二十一世纪') >= 0);
check('当前十年区间行高亮', cw.indexOf('drow cur-y') >= 0 && cw.indexOf('2020 – 2029') >= 0);
check('世纪视图翻页按钮禁用', document.getElementById('prevBtn').disabled === true && document.getElementById('nextBtn').disabled === true);

// ---------- 点击钻取 ----------
function mk(cls, y, single) {
  var el = document.createElement('div');
  el.classList.add(cls);
  el.dataset.y = String(y);
  if (single) el.dataset.single = '1';
  el.closest = function (sel) { return (sel === '[data-y]') ? el : null; };
  return el;
}
view.mode = 'century'; view.year = 2026;
renderCentury();
document.getElementById('calWrap')._fire('click', { target: mk('decade-card', 1900, false) });
check('点击二十世纪卡进十年视图', view.mode === 'decade' && view.year === 1900);
renderDecade();
check('1900s 十年标题', document.getElementById('toolTitle').textContent === '1900 – 1909 年');

view.mode = 'century'; view.year = 2026;
renderCentury();
document.getElementById('calWrap')._fire('click', { target: mk('decade-card', 2000, false) });
check('点击二十一世纪卡进十年视图', view.mode === 'decade' && view.year === 2000);
renderDecade();
check('2000s 十年标题', document.getElementById('toolTitle').textContent === '2000 – 2009 年');

view.mode = 'century'; view.year = 2026;
renderCentury();
document.getElementById('calWrap')._fire('click', { target: mk('decade-card', 2100, true) });
check('点击 2100 卡直达年视图', view.mode === 'year' && view.year === 2100);

// 十年区间行点击
view.mode = 'century'; view.year = 2026;
renderCentury();
document.getElementById('calWrap')._fire('click', { target: mk('drow', 1980, false) });
check('点击 1980–1989 行进十年视图', view.mode === 'decade' && view.year === 1980);
renderDecade();
check('1980s 十年标题', document.getElementById('toolTitle').textContent === '1980 – 1989 年');

view.mode = 'century'; view.year = 2026;
renderCentury();
document.getElementById('calWrap')._fire('click', { target: mk('drow', 2090, false) });
check('点击 2090–2099 行进十年视图', view.mode === 'decade' && view.year === 2090);
renderDecade();
check('2090s 十年视图含 2100 单卡', document.getElementById('calWrap').innerHTML.indexOf('class="year-card single"') >= 0);

view.mode = 'century'; view.year = 2026;
renderCentury();
document.getElementById('calWrap')._fire('click', { target: mk('drow', 2100, false) });
check('点击 2100 行直达年视图', view.mode === 'year' && view.year === 2100);

// ---------- 1900-2100 每一年可达（行→十年视图→年视图→月视图） ----------
var okAll = true;
for (var yy = 1900; yy <= 2100; yy += 10) {
  view.mode = 'decade'; view.year = yy;
  renderDecade();
  var expect = (yy === 2100) ? '2090 – 2099 年' : (yy + ' – ' + (yy + 9) + ' 年');
  if (document.getElementById('toolTitle').textContent !== expect) okAll = false;
}
check('全部十年区间可渲染', okAll);
view.mode = 'month'; view.year = 1900; view.month = 1;
renderMonth();
check('1900-01 月视图渲染正常', document.getElementById('calWrap').innerHTML.indexOf('data-y="1900" data-m="1" data-d="1"') >= 0);
view.mode = 'month'; view.year = 2100; view.month = 12;
renderMonth();
check('2100-12 月视图渲染正常', document.getElementById('calWrap').innerHTML.indexOf('data-y="2100" data-m="12" data-d="31"') >= 0);

// ---------- 回归：非世纪视图翻页按钮启用（真实入口 renderContent） ----------
view.mode = 'month'; view.year = 2026; view.month = 9;
renderContent();
check('月视图翻页按钮启用', document.getElementById('prevBtn').disabled === false && document.getElementById('nextBtn').disabled === false);
view.mode = 'decade'; view.year = 2020;
renderContent();
check('十年视图翻页按钮启用', document.getElementById('prevBtn').disabled === false && document.getElementById('nextBtn').disabled === false);

// ---------- 回归：边界 clamp 与 ghost ----------
view.mode = 'month'; view.year = 1900; view.month = 1;
document.getElementById('prevBtn')._fire('click');
check('月视图 1900-01 prev 不越界', view.year === 1900 && view.month === 1);
view.mode = 'month'; view.year = 2100; view.month = 12;
document.getElementById('nextBtn')._fire('click');
check('月视图 2100-12 next 不越界', view.year === 2100 && view.month === 12);
view.mode = 'month'; view.year = 1900; view.month = 1;
renderMonth();
check('1900-01 无 1899 ghost', document.getElementById('calWrap').innerHTML.indexOf('data-y="1899"') < 0);
view.mode = 'month'; view.year = 2100; view.month = 12;
renderMonth();
check('2100-12 无 2101 ghost', document.getElementById('calWrap').innerHTML.indexOf('data-y="2101"') < 0);

// ---------- 回归：边界农历防护 ----------
var i1 = dayInfo(1900, 1, 1), i3 = dayInfo(1900, 1, 31), i2 = dayInfo(2100, 12, 31);
check('1900-01-01 边界防护', !!i1.lunar && i1.lunar.outOfRange === true && i1.lunar.lYear === 1899);
check('1900-01-31 农历正常(正月初一)', !!i3.lunar && i3.lunar.lYear === 1900 && i3.lunar.lMonth === 1 && i3.lunar.lDay === 1);
check('2100-12-31 农历正常', !!i2.lunar && i2.lunar.lYear === 2100);
sel.y = 1900; sel.m = 1; sel.d = 1;
renderSidebar();
check('1900-01-01 侧栏农历降级显示', document.getElementById('bigDateCard').innerHTML.indexOf('数据边界') >= 0);
check('1900-01-01 详历无 undefined', document.getElementById('lunarDetail').innerHTML.indexOf('undefined') < 0);
sel.y = 2026; sel.m = 9; sel.d = 25;
renderSidebar();
check('正常日期无边界标记', document.getElementById('bigDateCard').innerHTML.indexOf('数据边界') < 0);

// ---------- 回归：塔罗每日单牌 ----------
var d1 = tarotDailyOf(2026, 9, 25);
var d2 = tarotDailyOf(2026, 9, 25);
check('每日单牌同日稳定', d1.name === d2.name && d1.reversed === d2.reversed);
var spread = tarotOf(2026, 9, 25);
check('三牌阵仍 3 张', spread.length === 3 && spread[0].pos === '过去' && spread[2].pos === '未来');
check('单牌与三牌阵不重复', spread.every(function (c) { return c.name !== d1.name; }));
renderTarot();
check('每日单牌面板渲染', document.getElementById('tarotDaily').innerHTML.indexOf('今日单牌') >= 0);
check('三牌阵面板渲染(往今未)', document.getElementById('tarotBox').innerHTML.indexOf('往今未三张牌阵') >= 0);
'''

runner = r'''
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
global.window = global;
function mkEl() {
  const handlers = {};
  return {
    innerHTML: '', style: {}, dataset: {}, textContent: '', title: '',
    checked: false, disabled: false, onclick: null, onchange: null,
    classList: { _set: {}, add(c){ this._set[c]=1; }, remove(c){ delete this._set[c]; }, toggle(c,f){ if(f===undefined) f=!this._set[c]; if(f) this._set[c]=1; else delete this._set[c]; return !!f; }, contains(c){ return !!this._set[c]; } },
    addEventListener(ev, fn) { handlers[ev] = fn; },
    _fire(evName, ev) { if (handlers[evName]) handlers[evName].call(this, ev); }
  };
}
const els = {};
global.document = {
  getElementById: (id) => (els[id] || (els[id] = mkEl())),
  querySelectorAll: () => [],
  addEventListener() {},
  createElement: () => mkEl()
};
global.localStorage = { getItem: () => null, setItem() {} };
global.fetch = () => Promise.reject(new Error('no net'));
global.AbortSignal = { timeout: () => ({}) };
global.setInterval = () => 0;
global.clearInterval = () => 0;
global.clearTimeout = () => 0;

['lunar.js','festivals.js','birthdays.js','celebrities.js','history.js','yi_ji.js','bagua.js','tarot.js']
  .forEach(f => eval(fs.readFileSync(path.join(%FILES%, f), 'utf8')));

const full = 'function check(name, cond) { console.log((cond ? "PASS" : "FAIL") + " | " + name); if (!cond) process.exitCode = 1; }\n'
  + %INLINE% + '\n' + %TESTS%;
vm.runInThisContext(full, { filename: 'inline.js' });
'''

runner = runner.replace('%FILES%', json.dumps(FILES))
runner = runner.replace('%INLINE%', json.dumps(inline))
runner = runner.replace('%TESTS%', json.dumps(tests))
with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
    f.write(runner)
print('written')
r = subprocess.run(['node', OUT], capture_output=True, text=True, encoding='utf-8', errors='replace')
print(r.stdout)
if r.returncode != 0:
    print('STDERR:', r.stderr[:800])
    sys.exit(1)
