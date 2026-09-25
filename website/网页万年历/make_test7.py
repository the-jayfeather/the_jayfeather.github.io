# -*- coding: utf-8 -*-
"""make_test7.py —— 世纪视图十年界面样式（21 张小卡 + 年份行钻取）+ 回归"""
import io, re, json, subprocess, sys

HTML = r'F:\系统安装与开荒\本次整活\网页万年历\万年历.html'
FILES = r'F:\系统安装与开荒\本次整活\网页万年历\files'
OUT = r'F:\系统安装与开荒\本次整活\网页万年历\_test7.js'

html = io.open(HTML, encoding='utf-8').read()
inline = re.search(r'<script>\n(.*?)</script>', html, re.S).group(1)

tests = r'''
// ---------- 世纪视图 = 十年界面样式（21 张小卡） ----------
view.mode = 'century'; view.year = 2026;
renderCentury();
var cw = document.getElementById('calWrap').innerHTML;
check('世纪标题为 1900-2100', document.getElementById('toolTitle').textContent === '1900 – 2100 年');
check('世纪视图 21 块', (cw.match(/class="decade-card/g) || []).length === 21);
check('含 1900-1909 卡', cw.indexOf('1900 – 1909') >= 0 && cw.indexOf('data-y="1900"') >= 0);
check('含 2000-2009 卡', cw.indexOf('2000 – 2009') >= 0 && cw.indexOf('data-y="2000"') >= 0);
check('含 2090-2099 卡', cw.indexOf('2090 – 2099') >= 0 && cw.indexOf('data-y="2090"') >= 0);
check('含 2100 单卡', cw.indexOf('data-y="2100" data-single="1"') >= 0);
check('每十年卡含年份行', cw.indexOf('class="drows"') >= 0 && cw.indexOf('class="drow') >= 0);
check('当前十年卡高亮', cw.indexOf('decade-card is-cur') >= 0 && cw.indexOf('2020 – 2029') >= 0);
check('今日年份行高亮', cw.indexOf('drow cur-y') >= 0);
check('世纪视图翻页按钮禁用', document.getElementById('prevBtn').disabled === true && document.getElementById('nextBtn').disabled === true);

// ---------- 点击钻取 ----------
function mk(tag, cls, y, single) {
  var el = document.createElement('div');
  el.classList.add(cls);
  el.dataset.y = String(y);
  if (single) el.dataset.single = '1';
  el.closest = function (sel) { return (sel === '[data-y]') ? el : null; };
  return el;
}
view.mode = 'century'; view.year = 2026;
renderCentury();
var dec1900 = mk('div', 'decade-card', 1900, false);
document.getElementById('calWrap')._fire('click', { target: dec1900 });
check('点击 1900 卡进十年视图', view.mode === 'decade' && view.year === 1900);
renderDecade();
check('1900s 十年标题', document.getElementById('toolTitle').textContent === '1900 – 1909 年');

view.mode = 'century'; view.year = 2026;
renderCentury();
var dec2090 = mk('div', 'decade-card', 2090, false);
document.getElementById('calWrap')._fire('click', { target: dec2090 });
check('点击 2090 卡进十年视图', view.mode === 'decade' && view.year === 2090);
renderDecade();
check('2090s 十年标题', document.getElementById('toolTitle').textContent === '2090 – 2099 年');
check('2090s 十年视图含 2100 单卡', document.getElementById('calWrap').innerHTML.indexOf('class="year-card single"') >= 0);

view.mode = 'century'; view.year = 2026;
renderCentury();
var dec2100 = mk('div', 'decade-card', 2100, true);
document.getElementById('calWrap')._fire('click', { target: dec2100 });
check('点击 2100 卡直达年视图', view.mode === 'year' && view.year === 2100);

// ---------- 卡内年份行钻取 ----------
view.mode = 'century'; view.year = 2026;
renderCentury();
var row = mk('div', 'drow', 1984, false);
document.getElementById('calWrap')._fire('click', { target: row });
check('点击 1984 年份行进年视图', view.mode === 'year' && view.year === 1984);
view.mode = 'century'; view.year = 2026;
renderCentury();
var row2 = mk('div', 'drow', 2100, false);
document.getElementById('calWrap')._fire('click', { target: row2 });
check('点击 2100 年份行进年视图', view.mode === 'year' && view.year === 2100);

// ---------- 每一年可达（遍历全部十年卡年份行） ----------
var allRows = 0;
view.mode = 'century'; view.year = 2026;
renderCentury();
cw = document.getElementById('calWrap').innerHTML;
var reRows = cw.match(/class="drow(?: cur-y)?" data-y=/g) || [];
check('世纪视图年份行共 201 个', reRows.length === 201);
for (var yy = 1900; yy <= 2100; yy++) {
  if (cw.indexOf('class="drow' + (yy === 2026 ? ' cur-y' : '') + '" data-y="' + yy + '"') >= 0) allRows++;
}
check('1900-2100 每年一行齐全', allRows === 201);

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
