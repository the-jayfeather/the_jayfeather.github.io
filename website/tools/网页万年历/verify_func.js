// 功能验证：加载数据库，核对 2026-09-24 的输出与权威黄历
'use strict';
const fs = require('fs');
global.window = global; // 浏览器环境桩
const path = 'F:/系统安装与开荒/本次整活/网页万年历/files/';
function load(name) { eval(fs.readFileSync(path + name, 'utf8')); }
load('lunar.js'); load('yi_ji.js'); load('bagua.js');

const L = window.LunarLib, YJ = window.YIJI, BG = window.BAGUA;

function dayInfo(y, m, d) {
  const lunar = L.solarToLunar(y, m, d);
  const gzSeq = L.dayGzSeq(y, m, d);
  const gzDay = L.gzName(gzSeq);
  const dayZhi = ((gzSeq % 12) + 12) % 12;
  const monthZhi = (lunar.lMonth + 1) % 12;
  const jcIdx = ((dayZhi - monthZhi + 12) % 12);
  const gzYear = L.gzName(L.yearGzSeq(lunar.lYear));
  const gzMonth = L.gzName(L.monthGzSeq(lunar.lYear, lunar.lMonth));
  const term = L.termOfDay(y, m, d);
  return { lunar, gzDay, gzYear, gzMonth, gzSeq, dayZhi, jcIdx, term,
    yearSx: L.SHENGXIAO[((lunar.lYear - 4) % 12 + 12) % 12],
    chong: YJ.chong[dayZhi], sha: YJ.sha[dayZhi],
    liuhe: YJ.liuhe[dayZhi], sanhe: YJ.sanhe[dayZhi].join('、'),
    xi: YJ.fangWei[YJ.xiShen[gzSeq % 10]], cai: YJ.fangWei[YJ.caiShen[gzSeq % 10]], fu: YJ.fangWei[YJ.fuShen[gzSeq % 10]]
  };
}

const info = dayInfo(2026, 9, 24);
console.log('农历:  ' + info.lunar.lYear + '年' + L.lunarMonthCN(info.lunar.lMonth, info.lunar.isLeap) + L.lunarDayCN(info.lunar.lDay) + '  (权威: 丙午年八月十四)');
console.log('年柱:  ' + info.gzYear + '  (权威: 丙午)');
console.log('月柱:  ' + info.gzMonth + '  (权威: 丁酉)');
console.log('日柱:  ' + info.gzDay + '  (权威: 辛丑)');
console.log('生肖:  ' + info.yearSx + '  (权威: 马)');
console.log('建除:  ' + YJ.jianChu[info.jcIdx] + '  (权威: 定)');
console.log('冲煞:  冲' + info.chong + ' 煞' + info.sha + '  (权威: 冲羊煞东)');
console.log('六合:  ' + info.liuhe + '  (权威: 鼠)');
console.log('三合:  ' + info.sanhe + '  (权威: 鸡、蛇)');
console.log('喜神:  ' + info.xi + '  (权威: 西南)');
console.log('财神:  ' + info.cai + '  (权威: 正东)');
console.log('福神:  ' + info.fu + '  (权威: 西北)');
console.log('当日节气: ' + (info.term || '无 (权威: 昨天秋分)'));
console.log('宜:  ' + YJ.yi[info.jcIdx].join('、'));
console.log('忌:  ' + YJ.ji[info.jcIdx].join('、'));
// 八卦
const up = ((2026 * 7 + 9 * 13 + 24 * 31) % 8 + 8) % 8;
const down = ((2026 * 11 + 9 * 17 + 24 * 7) % 8 + 8) % 8;
const idx = up * 8 + down;
console.log('八卦: ' + BG.trigrams[up].symbol + BG.trigrams[down].symbol + ' ' + BG.names[idx] + ' — ' + BG.notes[idx]);
// 节气全年抽查
console.log('2026秋分日: ' + L.solarTermDate(2026, 17) + ' (权威: 23)');
console.log('2026冬至日: ' + L.solarTermDate(2026, 23) + ' (权威: 22)');
console.log('2026立春: ' + L.solarTermDate(2026, 2) + ' (权威: 4)');
