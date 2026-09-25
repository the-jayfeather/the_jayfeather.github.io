# -*- coding: utf-8 -*-
"""make_test4.py —— 本轮四条需求的渲染桩测试：宜忌条数/生日两列/名人扩充/历史扩充"""
import io, re, json, subprocess, sys

HTML = r'F:\系统安装与开荒\本次整活\网页万年历\万年历.html'
FILES = r'F:\系统安装与开荒\本次整活\网页万年历\files'
OUT = r'F:\系统安装与开荒\本次整活\网页万年历\_test4.js'

html = io.open(HTML, encoding='utf-8').read()
inline = re.search(r'<script>\n(.*?)</script>', html, re.S).group(1)

tests = r'''
// ---------- 数据规模 ----------
check('名人生日总数 281', CE.length === 281);
check('名人覆盖天数 201', new Set(CE.map(c => c.m + '-' + c.d)).size === 201);
check('历史事件总数 609', Object.values(H).reduce((s, v) => s + v.length, 0) === 609);
check('历史日期键 366', Object.keys(H).length === 366);

// ---------- 宜忌条数（定日 = 今天 2026-09-24） ----------
sel.y = 2026; sel.m = 9; sel.d = 24;
const info = dayInfo(2026, 9, 24);
check('今天为定日', info.jcIdx === 4);
check('定日宜 ≥8 条', YJ.yi[4].length >= 8);
check('定日忌 ≥6 条', YJ.ji[4].length >= 6);
renderSidebar();
const yiHtml = document.getElementById('yiJiBox').innerHTML;
check('宜忌面板渲染含全部标签', (yiHtml.match(/class="chip/g) || []).length === YJ.yi[info.jcIdx].length + YJ.ji[info.jcIdx].length);

// ---------- 生日两列（名人左、角色右） ----------
const celebHtml = document.getElementById('celebList').innerHTML;
const birthHtml = document.getElementById('birthList').innerHTML;
check('9/24 名人生日含曹禺顾城', celebHtml.indexOf('曹禺') >= 0 && celebHtml.indexOf('顾城') >= 0);
check('9/24 角色组显示空态', birthHtml.indexOf('empty') >= 0);
check('birthCols 双开非 one-col', document.getElementById('birthCols').classList.contains('one-col') === false);

// ---------- one-col 逻辑 ----------
settings.showBirthday = false; settings.showCelebrity = true;
renderSidebar();
check('仅名人时 one-col', document.getElementById('birthCols').classList.contains('one-col') === true);
check('仅名人时角色组隐藏', document.getElementById('charGroup').style.display === 'none');
settings.showBirthday = true; settings.showCelebrity = false;
renderSidebar();
check('仅角色时 one-col', document.getElementById('birthCols').classList.contains('one-col') === true);
check('仅角色时名人组隐藏', document.getElementById('fameGroup').style.display === 'none');
settings.showBirthday = true; settings.showCelebrity = true;
renderSidebar();
check('双开时两列', document.getElementById('birthCols').classList.contains('one-col') === false);

// ---------- 9/24 历史事件 ----------
check('9/24 含吉法尔飞艇事件', document.getElementById('historyList').innerHTML.indexOf('吉法尔') >= 0);

// ---------- 抽查新增名人 ----------
function hasCeleb(m, d, name) { return CE.some(c => c.m === m && c.d === d && c.name.indexOf(name) >= 0); }
check('10/30 马拉多纳', hasCeleb(10, 30, '马拉多纳'));
check('2/17 乔丹', hasCeleb(2, 17, '乔丹'));
check('6/24 梅西', hasCeleb(6, 24, '梅西'));
check('9/3 谷爱凌', hasCeleb(9, 3, '谷爱凌'));
check('12/31 马蒂斯', hasCeleb(12, 31, '马蒂斯'));
check('1/15 徐志摩', hasCeleb(1, 15, '徐志摩'));

// ---------- 抽查新增历史事件 ----------
function hasEvent(m, d, kw) { const evs = H[m + '-' + d] || []; return evs.some(e => e[1].indexOf(kw) >= 0); }
check('10/4 斯普特尼克', hasEvent(10, 4, '斯普特尼克'));
check('7/20 阿波罗11号', hasEvent(7, 20, '阿波罗11号'));
check('12/13 国家公祭日', hasEvent(12, 13, '公祭日'));
check('3/15 凯撒遇刺(公元前)', hasEvent(3, 15, '凯撒'));
check('9/28 孔子诞辰(公元前)', hasEvent(9, 28, '孔子'));

console.log('  [9/24 历史] ' + document.getElementById('historyList').innerHTML.replace(/<[^>]+>/g, ' ').trim());
console.log('  [9/24 名人] ' + celebHtml.replace(/<[^>]+>/g, ' ').trim());
console.log('  [9/24 宜忌] ' + yiHtml.replace(/<[^>]+>/g, ' ').trim().slice(0, 150));
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
    _fire(ev) { if (handlers[ev]) handlers[ev].call(this, { target: this }); }
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
