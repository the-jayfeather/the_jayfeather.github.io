// 验证 tarot.js：牌数、tarotOf 逻辑复现与同日稳定性
'use strict';
const fs = require('fs');
global.window = global;
const path = 'F:/系统安装与开荒/本次整活/网页万年历/files/';
eval(fs.readFileSync(path + 'tarot.js', 'utf8'));

const TT = window.TAROT;
let total = TT.major.length;
for (const s of ['wands', 'cups', 'swords', 'coins']) total += TT.minor[s].length;
console.log('总牌数:', total, '(应为78)');

function tarotOf(y, m, d) {
  const deck = [];
  TT.major.forEach((c, i) => deck.push({ name: c.name, card: c }));
  for (const s of ['wands', 'cups', 'swords', 'coins']) {
    TT.minor[s].forEach((c, j) => deck.push({ name: c.name, card: c }));
  }
  let seed = (y * 10000 + m * 100 + d) % 2147483647;
  if (seed <= 0) seed += 2147483646;
  const next = () => { seed = (seed * 16807) % 2147483647; return (seed % 10000) / 10000; };
  for (let i = deck.length - 1; i > 0; i--) {
    const k = Math.floor(next() * (i + 1));
    [deck[i], deck[k]] = [deck[k], deck[i]];
  }
  const pos = ['过去', '现在', '未来'];
  const out = [];
  for (let i = 0; i < 3; i++) {
    const c = deck[i];
    const reversed = next() < 0.5;
    out.push({ pos: pos[i], name: c.name, reversed, text: reversed ? c.card.r : c.card.u });
  }
  return out;
}

const a = tarotOf(2026, 9, 24);
console.log('2026-09-24 牌阵:', a.map(c => `${c.pos}:${c.name}(${c.reversed ? '逆' : '正'})`).join(' | '));
console.log('释义:', a.map(c => c.text).join(' / '));
const b = tarotOf(2026, 9, 24);
console.log('同日重复结果一致:', JSON.stringify(a) === JSON.stringify(b));
const c = tarotOf(2026, 9, 25);
console.log('次日结果不同:', JSON.stringify(a) !== JSON.stringify(c));
// 抽查释义非空
let empty = 0;
for (const s of ['major', 'wands', 'cups', 'swords', 'coins']) {
  const arr = s === 'major' ? TT.major : TT.minor[s];
  for (const x of arr) if (!x.u || !x.r) empty++;
}
console.log('空释义条目:', empty);
