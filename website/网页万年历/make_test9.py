# -*- coding: utf-8 -*-
"""make_test9.py —— 1900-2100 全范围回归验证（22 世纪已取消）"""
import io, re, json, subprocess, sys

HTML = r'F:\系统安装与开荒\本次整活\网页万年历\万年历.html'
FILES = r'F:\系统安装与开荒\本次整活\网页万年历\files'
OUT = r'F:\系统安装与开荒\本次整活\网页万年历\_test9.js'

html = io.open(HTML, encoding='utf-8').read()
inline = re.search(r'<script>\n(.*?)</script>', html, re.S).group(1)

tests = r'''
// ---------- 范围常量 ----------
check('MAX_YEAR=2100', typeof MAX_YEAR !== 'undefined' && MAX_YEAR === 2100);
check('clampY 上界', clampY(2200) === 2100 && clampY(2199) === 2100 && clampY(2100) === 2100);
check('clampY 下界', clampY(1899) === 1900 && clampY(1900) === 1900);

// ---------- 1900-2100 每天农历有效性（1900-01-01~30 属农历 1899 腊月、表外，另行断言） ----------
var bad = [], cnt = 0;
for (var y = 1900; y <= 2100; y++) {
  for (var m = 1; m <= 12; m++) {
    var dim = new Date(y, m, 0).getDate();
    for (var d = 1; d <= dim; d++) {
      if (y === 1900 && d < 31) continue; // 表外（农历 1899 腊月）
      cnt++;
      var lu = L.solarToLunar(y, m, d);
      var ok = lu && isFinite(lu.lDay) && lu.lDay >= 1 && lu.lDay <= 30 &&
        lu.lMonth >= 1 && lu.lMonth <= 12 && lu.lYear >= 1900 && lu.lYear <= 2100;
      if (!ok) {
        if (bad.length < 10) bad.push(y + '-' + m + '-' + d + ' -> ' + JSON.stringify(lu));
      }
    }
  }
}
check('1900-2100 全部 ' + cnt + ' 天农历有效', bad.length === 0);
if (bad.length) console.log('BAD:', bad.join(' | '));
var diPre = dayInfo(1900, 1, 1);
check('1900-01-01（1899 腊月）表外防护', !!diPre.lunar && diPre.lunar.outOfRange === true);

// ---------- 正月初一在 1 月 21 日 - 2 月 20 日 ----------
var badSpr = [];
for (var y = 1900; y <= 2100; y++) {
  var sd = L.lunarToSolar(y, 1, 1, false);
  if (sd.getFullYear() !== y || sd.getMonth() < 0 || sd.getMonth() > 1) badSpr.push(y + '@' + sd.toDateString());
}
check('1900-2100 春节均在 1-2 月', badSpr.length === 0);
if (badSpr.length) console.log('SPR:', badSpr.join(' | '));

// ---------- 往返一致性抽查（每年初一/十五；1901 起避开 1899 腊月） ----------
var roundOk = true, roundBad = [];
for (var y = 1901; y <= 2100; y += 5) {
  var l1 = L.solarToLunar(y, 1, 1);
  var back = L.lunarToSolar(l1.lYear, l1.lMonth, l1.lDay, l1.isLeap);
  if (back.getFullYear() !== y || back.getMonth() !== 0 || back.getDate() !== 1) { roundOk = false; if (roundBad.length < 5) roundBad.push(y + ':' + JSON.stringify(l1)); }
  var l15 = L.solarToLunar(y, 6, 15);
  var b15 = L.lunarToSolar(l15.lYear, l15.lMonth, l15.lDay, l15.isLeap);
  if (b15.getFullYear() !== y || b15.getMonth() !== 5 || b15.getDate() !== 15) { roundOk = false; if (roundBad.length < 5) roundBad.push(y + '!:' + JSON.stringify(l15)); }
}
check('农历<->公历往返一致（抽查）', roundOk);
if (!roundOk) console.log('ROUND:', roundBad.join(' | '));

// ---------- 边界：2101 年初仍在 2100 腊月（表内）；2101-01-29 起农历 2101（表外，UI 不可达） ----------
var l2101 = L.solarToLunar(2101, 1, 1);
check('2101-01-01 农历属 2100 腊月（表内）', l2101.lYear === 2100 && l2101.lMonth === 12);
check('2100-12-31 农历有效', L.solarToLunar(2100, 12, 31).lYear === 2100);

// ---------- 旧年份回归 ----------
var l2026 = L.solarToLunar(2026, 9, 25);
check('2026-09-25 农历回归(八月十五)', l2026.lYear === 2026 && l2026.lMonth === 8 && l2026.lDay === 15);
var l1900 = L.solarToLunar(1900, 1, 31);
check('1900-01-31 正月初一回归', l1900.lYear === 1900 && l1900.lMonth === 1 && l1900.lDay === 1);
var di = dayInfo(1900, 1, 1);
check('1900-01-01 边界防护回归', !!di.lunar && di.lunar.outOfRange === true);

// ---------- 世纪视图（二十/二十一 + 2100 单卡） ----------
view.mode = 'century'; view.year = 2026;
renderCentury();
var cw = document.getElementById('calWrap').innerHTML;
check('世纪标题 1900-2100', document.getElementById('toolTitle').textContent === '1900 – 2100 年');
check('世纪视图 3 张卡', (cw.match(/class="decade-card/g) || []).length === 3);
check('2100 单卡', cw.indexOf('data-y="2100" data-single="1"') >= 0);
check('二十世纪卡', cw.indexOf('二十世纪') >= 0 && cw.indexOf('二十一世纪') >= 0);
check('无二十二世纪', cw.indexOf('二十二世纪') < 0);
check('世纪视图翻页禁用', document.getElementById('prevBtn').disabled === true && document.getElementById('nextBtn').disabled === true);

// ---------- 钻取 ----------
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
document.getElementById('calWrap')._fire('click', { target: mk('decade-card', 2100, true) });
check('点击 2100 单卡进年视图', view.mode === 'year' && view.year === 2100);
renderYear();
check('2100 年视图标题', document.getElementById('toolTitle').textContent.indexOf('2100') >= 0);

view.mode = 'century'; view.year = 2026;
renderCentury();
document.getElementById('calWrap')._fire('click', { target: mk('drow', 2100, false) });
check('点击 2100 行进年视图', view.mode === 'year' && view.year === 2100);

view.mode = 'century'; view.year = 2026;
renderCentury();
document.getElementById('calWrap')._fire('click', { target: mk('drow', 2090, false) });
check('点击 2090-2099 行进十年视图', view.mode === 'decade' && view.year === 2090);
renderDecade();
check('2090s 十年标题', document.getElementById('toolTitle').textContent === '2090 – 2099 年');
check('2090s 含 2100 单年卡', document.getElementById('calWrap').innerHTML.indexOf('class="year-card single"') >= 0);

// ---------- 十年/月/年视图边界 ----------
view.mode = 'decade'; view.year = 2100;
renderDecade();
check('2100 clamp 到 2090s', document.getElementById('toolTitle').textContent === '2090 – 2099 年');
view.mode = 'month'; view.year = 2100; view.month = 12;
renderMonth();
var mw = document.getElementById('calWrap').innerHTML;
check('2100-12 无 2101 ghost', mw.indexOf('data-y="2101"') < 0);
check('2100-12 含空白占位', mw.indexOf('class="cal-cell blank"') >= 0);
view.mode = 'month'; view.year = 1900; view.month = 1;
renderMonth();
mw = document.getElementById('calWrap').innerHTML;
check('1900-01 无 1899 ghost', mw.indexOf('data-y="1899"') < 0);

// ---------- 月视图 prev/next 边界 ----------
view.mode = 'month'; view.year = 2100; view.month = 12;
document.getElementById('nextBtn')._fire('click');
check('月视图 2100-12 next 不越界', view.year === 2100 && view.month === 12);
view.mode = 'month'; view.year = 1900; view.month = 1;
document.getElementById('prevBtn')._fire('click');
check('1900-01 prev 不越界', view.year === 1900 && view.month === 1);

// ---------- 世纪/非世纪翻页状态 ----------
view.mode = 'month'; view.year = 2026; view.month = 9;
renderContent();
check('月视图翻页启用', document.getElementById('prevBtn').disabled === false);
view.mode = 'century'; view.year = 2026;
renderContent();
check('世纪视图翻页禁用', document.getElementById('prevBtn').disabled === true);

// ---------- 塔罗回归 ----------
var d1 = tarotDailyOf(2026, 9, 25);
check('每日单牌稳定', d1.name === tarotDailyOf(2026, 9, 25).name);
var spread = tarotOf(2026, 9, 25);
check('三牌阵 3 张', spread.length === 3);
check('单牌不重复', spread.every(function (c) { return c.name !== d1.name; }));
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
