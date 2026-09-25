// 验证 birthdays/celebrities 数据：数量、重复键、抽样匹配
'use strict';
const fs = require('fs');
global.window = global;
const path = 'F:/系统安装与开荒/本次整活/网页万年历/files/';
function load(name) { eval(fs.readFileSync(path + name, 'utf8')); }
load('birthdays.js'); load('celebrities.js');

function byDate(arr, m, d) {
  return arr.filter(x => x.m === m && x.d === d);
}
console.log('角色生日总数:', window.BIRTHDAYS.length);
console.log('名人生日总数:', window.CELEBRITIES.length);
// 非法日期检查
const dim = [0,31,28,31,30,31,30,31,31,30,31,30,31];
let bad = 0;
for (const arr of [window.BIRTHDAYS, window.CELEBRITIES]) {
  for (const x of arr) if (x.m < 1 || x.m > 12 || x.d < 1 || x.d > dim[x.m]) { console.log('非法日期:', x); bad++; }
}
console.log('非法条目:', bad);
// 9/24 匹配（今天）
console.log('9/24 角色:', byDate(window.BIRTHDAYS, 9, 24).map(x => x.name + '(' + x.work + ')'));
console.log('9/24 名人:', byDate(window.CELEBRITIES, 9, 24).map(x => x.name + '(' + x.y + ' ' + x.field + ')'));
// 9/25 角色（中秋节当天有没有？）
console.log('9/25 角色:', byDate(window.BIRTHDAYS, 9, 25).map(x => x.name));
// 覆盖天数统计
const days = new Set();
window.BIRTHDAYS.forEach(x => days.add(x.m + '-' + x.d));
const daysC = new Set();
window.CELEBRITIES.forEach(x => daysC.add(x.m + '-' + x.d));
console.log('角色覆盖天数:', days.size, '/ 366');
console.log('名人覆盖天数:', daysC.size, '/ 366');
console.log('并集覆盖天数:', new Set([...days, ...daysC]).size, '/ 366');
