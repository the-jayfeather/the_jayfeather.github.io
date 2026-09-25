# -*- coding: utf-8 -*-
"""make_test5.py —— 年份范围 1900-2100 + 塔罗每日单牌 渲染桩测试"""
import io, re, json, subprocess, sys

HTML = r'F:\系统安装与开荒\本次整活\网页万年历\万年历.html'
FILES = r'F:\系统安装与开荒\本次整活\网页万年历\files'
OUT = r'F:\系统安装与开荒\本次整活\网页万年历\_test5.js'

html = io.open(HTML, encoding='utf-8').read()
assert '塔罗 · 每日单牌 · 往今未三牌阵' in html, '面板标题未更新'
inline = re.search(r'<script>\n(.*?)</script>', html, re.S).group(1)

tests = r'''
// ---------- 年份范围：世纪视图 ----------
view.mode = 'century'; view.year = 2026;
renderCentury();
var cw = document.getElementById('calWrap').innerHTML;
check('世纪视图 2000 标题', document.getElementById('toolTitle').textContent === '2000 – 2100 年');
check('世纪视图 11 块', (cw.match(/class="decade-card/g) || []).length === 11);
check('世纪视图含 2100 单年卡', cw.indexOf('data-y="2100" data-single="1"') >= 0);
check('2100 卡有边界标记', cw.indexOf('边界单年') >= 0);

view.year = 1900;
renderCentury();
cw = document.getElementById('calWrap').innerHTML;
check('世纪视图 1900 标题', document.getElementById('toolTitle').textContent === '1900 – 1999 年');
check('世纪视图 1900 为 10 块', (cw.match(/class="decade-card/g) || []).length === 10);
check('1900 世纪无 single', cw.indexOf('data-single') < 0);

// ---------- 年份范围：十年视图 ----------
view.mode = 'decade'; view.year = 2100;
renderDecade();
var dw = document.getElementById('calWrap').innerHTML;
check('十年视图 2100 归入 2090 起始', document.getElementById('toolTitle').textContent === '2090 – 2099 年');
check('十年视图 11 张年卡', (dw.match(/class="year-card/g) || []).length === 11);
check('十年视图含 2100 单年卡', dw.indexOf('class="year-card single"') >= 0 && dw.indexOf('data-y="2100"') >= 0);

view.year = 1900;
renderDecade();
check('十年视图 1900 标题', document.getElementById('toolTitle').textContent === '1900 – 1909 年');

view.year = 1950;
renderDecade();
check('十年视图 1950 标题', document.getElementById('toolTitle').textContent === '1950 – 1959 年');

// ---------- 年份范围：prev/next clamp ----------
view.mode = 'month'; view.year = 1900; view.month = 1;
document.getElementById('prevBtn')._fire('click');
check('月视图 1900-01 prev 不越界', view.year === 1900 && view.month === 1);
view.mode = 'month'; view.year = 2100; view.month = 12;
document.getElementById('nextBtn')._fire('click');
check('月视图 2100-12 next 不越界', view.year === 2100 && view.month === 12);
view.mode = 'year'; view.year = 1900;
document.getElementById('prevBtn')._fire('click');
check('年视图 1900 prev 不越界', view.year === 1900);
view.mode = 'year'; view.year = 2100;
document.getElementById('nextBtn')._fire('click');
check('年视图 2100 next 不越界', view.year === 2100);
view.mode = 'decade'; view.year = 1900;
document.getElementById('prevBtn')._fire('click');
check('十年视图 1900 prev 不越界', view.year === 1900);
view.mode = 'decade'; view.year = 2100;
document.getElementById('nextBtn')._fire('click');
check('十年视图 2100 next 不越界', view.year === 2100);
view.mode = 'century'; view.year = 1900;
document.getElementById('prevBtn')._fire('click');
check('世纪视图 1900 prev 不越界', view.year === 1900);
view.mode = 'century'; view.year = 2100;
document.getElementById('nextBtn')._fire('click');
check('世纪视图 2100 next 不越界', view.year === 2100);

// ---------- 年份范围：月视图 ghost 边界 ----------
view.mode = 'month'; view.year = 1900; view.month = 1;
renderMonth();
var mw = document.getElementById('calWrap').innerHTML;
check('1900-01 无 1899 ghost', mw.indexOf('data-y="1899"') < 0);
check('1900-01 上月空格占位', mw.indexOf('cal-cell blank') >= 0);
check('1900-01 当月正常渲染', mw.indexOf('data-y="1900" data-m="1" data-d="1"') >= 0);

view.mode = 'month'; view.year = 2100; view.month = 12;
renderMonth();
mw = document.getElementById('calWrap').innerHTML;
check('2100-12 无 2101 ghost', mw.indexOf('data-y="2101"') < 0);

// ---------- 边界日期数据 ----------
var i1 = dayInfo(1900, 1, 1), i2 = dayInfo(2100, 12, 31), i3 = dayInfo(1900, 1, 31);
check('1900-01-01 边界防护', !!i1.lunar && i1.lunar.outOfRange === true && i1.lunar.lYear === 1899);
check('1900-01-01 干支数学可算(己亥)', i1.gzYear === '己亥');
check('1900-01-31 农历正常(正月初一)', !!i3.lunar && i3.lunar.lYear === 1900 && i3.lunar.lMonth === 1 && i3.lunar.lDay === 1);
check('2100-12-31 农历正常', !!i2.lunar && i2.lunar.lYear === 2100 && i2.lunar.outOfRange !== true);
sel.y = 1900; sel.m = 1; sel.d = 1;
renderSidebar();
check('1900-01-01 侧栏农历降级显示', document.getElementById('bigDateCard').innerHTML.indexOf('数据边界') >= 0);
check('1900-01-01 详历不渲染 undefined', document.getElementById('lunarDetail').innerHTML.indexOf('undefined') < 0);
sel.y = 2026; sel.m = 9; sel.d = 24;
renderSidebar();
check('正常日期详历无边界标记', document.getElementById('bigDateCard').innerHTML.indexOf('数据边界') < 0);

// ---------- 塔罗：每日单牌 ----------
var d1 = tarotDailyOf(2026, 9, 24);
var d2 = tarotDailyOf(2026, 9, 24);
check('每日单牌同日稳定', d1.name === d2.name && d1.reversed === d2.reversed);
check('每日单牌字段完整', !!d1.name && (d1.reversed === true || d1.reversed === false) && d1.text.length > 0);
var spread = tarotOf(2026, 9, 24);
check('三牌阵仍 3 张且位置完整', spread.length === 3 && spread[0].pos === '过去' && spread[1].pos === '现在' && spread[2].pos === '未来');
check('单牌与三牌阵不重复', spread.every(function (c) { return c.name !== d1.name; }));
check('换日期单牌变化', tarotDailyOf(2026, 9, 25).name !== d1.name || tarotDailyOf(2026, 9, 25).reversed !== d1.reversed);

sel.y = 2026; sel.m = 9; sel.d = 24;
renderTarot();
check('每日单牌面板渲染', document.getElementById('tarotDaily').innerHTML.indexOf('今日单牌') >= 0);
check('三牌阵面板渲染(往今未)', document.getElementById('tarotBox').innerHTML.indexOf('往今未三张牌阵') >= 0);

// ---------- 点击 2100 单年卡直达年视图 ----------
var tmp = document.createElement('div');
tmp.classList.add('decade-card');
tmp.dataset.single = '1';
tmp.dataset.y = '2100';
tmp.closest = function () { return tmp; };
view.mode = 'century'; view.year = 2000;
// 模拟 calWrap 事件委托：inline 中 handler 绑定于 $('calWrap')，直接调用其 handlers
var cwEl = document.getElementById('calWrap');
console.log('  [click handler 已注册] ' + (typeof cwEl._has === 'undefined' ? 'n/a' : ''));
console.log('  [tmp] classes=' + JSON.stringify(tmp.classList._set) + ' dataset=' + JSON.stringify(tmp.dataset) + ' contains=' + tmp.classList.contains('decade-card'));
try {
  document.getElementById('calWrap')._fire('click', { target: tmp });
} catch (err) {
  console.log('  [点击异常] ' + err.message);
}
console.log('  [点击后] mode=' + view.mode + ' year=' + view.year);
check('2100 单年卡点击直达年视图', view.mode === 'year' && view.year === 2100);
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
    checked: false, onclick: null, onchange: null,
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

title_check = "document.getElementById('panelTarot').getElementsByClassName('panel-title').length === 0 || true"  # 占位，实际改为读原始 HTML
tests = tests.replace('%TITLE_CHECK%', json.dumps("document.getElementById('panelTarot') !== null"))
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
