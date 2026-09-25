// verify_new.js —— 用页面同款数据/逻辑核算 2026-09-25 各项历法信息
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const base = path.resolve(__dirname, '..', 'files');
function load(name) {
  const code = fs.readFileSync(path.join(base, name), 'utf-8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window;
}

const L = load('lunar.js').LunarLib;
const YJ = load('yi_ji.js').YIJI;
const F = load('festivals.js').FESTIVALS;

/* 复刻页面 dayInfo */
function dayInfo(y, m, d) {
  let lunar = L.solarToLunar(y, m, d);
  if (!isFinite(lunar.lDay) || lunar.lMonth < 1) {
    lunar = { lYear: 1899, lMonth: 12, lDay: -1, isLeap: false, outOfRange: true };
  }
  const gzSeq = L.dayGzSeq(y, m, d);
  const gzDay = L.gzName(gzSeq);
  const dayZhi = ((gzSeq % 12) + 12) % 12;
  const monthZhi = (lunar.lMonth + 1) % 12;
  const jcIdx = ((dayZhi - monthZhi + 12) % 12);
  const gzYear = L.gzName(L.yearGzSeq(lunar.lYear));
  const gzMonth = L.gzName(L.monthGzSeq(lunar.lYear, lunar.lMonth));
  const term = L.termOfDay(y, m, d);
  const week = new Date(y, m - 1, d).getDay();
  return {
    lunar, gzDay, gzYear, gzMonth, gzSeq, dayZhi, jcIdx, term, week,
    yearSx: L.SHENGXIAO[((lunar.lYear - 4) % 12 + 12) % 12],
    chong: YJ.chong[dayZhi], sha: YJ.sha[dayZhi]
  };
}

/* 彭祖百忌（与页面同款） */
const PENGZU_GAN = ['甲不开仓财物耗散', '乙不栽植千株不长', '丙不修灶必见灾殃', '丁不剃头头必生疮', '戊不受田田主不祥', '己不破券二比并亡', '庚不经络织机虚张', '辛不合酱主人不尝', '壬不汲水更难提防', '癸不词讼理弱敌强'];
const PENGZU_ZHI = ['子不问卜自惹祸殃', '丑不冠带主不还乡', '寅不祭祀神鬼不尝', '卯不穿井水泉不香', '辰不哭泣必主重丧', '巳不远行财物伏藏', '午不苫盖屋主更张', '未不服药毒气入肠', '申不安床鬼祟入房', '酉不宴客醉坐颠狂', '戌不吃犬作怪上床', '亥不嫁娶不利新郎'];
function pengZuOf(gzSeq) { const gan = ((gzSeq % 10) + 10) % 10, zhi = ((gzSeq % 12) + 12) % 12; return { gan: PENGZU_GAN[gan], zhi: PENGZU_ZHI[zhi] }; }

/* 复刻页面新函数（与 万年历.html 同步修正） */
const MANSIONS = ['角木蛟','亢金龙','氐土貉','房日兔','心月狐','尾火虎','箕水豹','斗木獬','牛金牛','女土蝠','虚日鼠','危月燕','室火猪','壁水貐','奎木狼','娄金狗','胃土雉','昴日鸡','毕月乌','觜火猴','参水猿','井木犴','鬼金羊','柳土獐','星日马','张月鹿','翼火蛇','轸水蚓'];
function starMansionOf(y, m, d) { return MANSIONS[((Math.floor(Date.UTC(y, m - 1, d) / 86400000) % 28) + 7) % 28]; }
const LIU_YAO = ['大安', '赤口', '先勝', '友引', '先負', '仏滅'];
function liuYaoOf(lunar) { return LIU_YAO[((lunar.lMonth + lunar.lDay) % 6 + 6) % 6]; }
const SHEN_NAMES = ['青龙','明堂','天刑','朱雀','金匮','天德','白虎','玉堂','天牢','玄武','司命','勾陈'];
const HUANGDAO = { 0: true, 1: true, 4: true, 5: true, 7: true, 10: true };
const QINGLONG_START = [8, 10, 0, 2, 4, 6, 8, 10, 0, 2, 4, 6];
function shenOf(dayZhi, monthZhi) {
  const start = QINGLONG_START[((monthZhi % 12) + 12) % 12];
  const idx = (((dayZhi - start) % 12) + 12) % 12;
  return SHEN_NAMES[idx] + (HUANGDAO[idx] ? ' · 黄道' : ' · 黑道');
}
const WU_SHUN_GAN = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
function hourGzOf(y, m, d, h) {
  const gzSeq = L.dayGzSeq(y, m, d);
  const dayGan = ((gzSeq % 10) + 10) % 10;
  const zhi = Math.floor((h + 1) / 2) % 12;
  return L.GAN[(WU_SHUN_GAN[dayGan] + zhi) % 10] + L.ZHI[zhi];
}
function moonPhaseOf(ld) {
  if (ld === 1) return '朔'; if (ld <= 6) return '娥眉月'; if (ld <= 8) return '上弦月';
  if (ld <= 14) return '盈凸月'; if (ld <= 16) return '满月'; if (ld <= 21) return '亏凸月';
  if (ld <= 24) return '下弦月'; if (ld <= 29) return '残月'; return '晦';
}
function festivalsOf(y, m, d) {
  const lunar = L.solarToLunar(y, m, d);
  const list = [];
  if (F.solar[m + '-' + d]) for (const n of F.solar[m + '-' + d]) list.push({ name: n, type: '公历' });
  if (!lunar.isLeap && F.lunar[lunar.lMonth + '-' + lunar.lDay]) for (const n of F.lunar[lunar.lMonth + '-' + lunar.lDay]) list.push({ name: n, type: '农历' });
  if (lunar.lMonth === 12 && lunar.lDay === L.monthDays(lunar.lYear, 12)) list.push({ name: '除夕', type: '农历' });
  const term = L.termOfDay(y, m, d);
  if (term) list.push({ name: term, type: '节气' });
  return list;
}

const y = 2026, m = 9, d = 25;
const info = dayInfo(y, m, d);
console.log('公历: 2026-09-25 星期' + L.WEEK_CN[info.week]);
console.log('农历: ' + info.lunar.lYear + '年 ' + L.lunarMonthCN(info.lunar.lMonth, info.lunar.isLeap) + L.lunarDayCN(info.lunar.lDay));
console.log('年柱: ' + info.gzYear + '（属' + info.yearSx + '） 月柱: ' + info.gzMonth + ' 日柱: ' + info.gzDay);
console.log('时柱(巳时10-12): ' + hourGzOf(y, m, d, 10) + '  时柱(子时23): ' + hourGzOf(y, m, d, 23));
console.log('节气: ' + (info.term || '无'));
const fests = festivalsOf(y, m, d);
console.log('节日: ' + (fests.filter(f => f.type !== '节气').map(f => f.name).join('、') || '无'));
console.log('月相: ' + moonPhaseOf(info.lunar.lDay));
console.log('星宿: ' + starMansionOf(y, m, d));
console.log('六曜: ' + liuYaoOf(info.lunar));
/* 月支取月柱地支 */
const mz = ((L.ZHI.indexOf(info.gzMonth.charAt(1)) + 12) % 12);
console.log('十二神: ' + shenOf(info.dayZhi, mz) + '（月支' + L.ZHI[mz] + '）');
console.log('彭祖: ' + pengZuOf(info.gzSeq).gan + ' / 百忌: ' + pengZuOf(info.gzSeq).zhi);
console.log('建除十二神: ' + YJ.jianChu[info.jcIdx] + '日');
console.log('宜: ' + YJ.yi[info.jcIdx].join(','));
console.log('忌: ' + YJ.ji[info.jcIdx].join(','));
console.log('冲: ' + info.chong + ' 煞: ' + info.sha);
console.log('道历: ' + (y + 2697) + '年  佛历: ' + (y + 543) + '年');

/* 额外抽查多个日期的四柱/星宿/值神/六曜，供与权威黄历对拍 */
console.log('\n--- 抽查 ---');
const samples = [
  [2026, 1, 1], [2026, 2, 17], [2026, 3, 3], [2026, 5, 5], [2026, 7, 7],
  [2026, 9, 23], [2026, 9, 24], [2026, 9, 25], [2026, 9, 26],
  [2025, 1, 1], [2024, 2, 10], [2024, 9, 17], [2023, 3, 22]
];
for (const [yy, mm, dd] of samples) {
  const i = dayInfo(yy, mm, dd);
  const mzz = ((L.ZHI.indexOf(i.gzMonth.charAt(1)) + 12) % 12);
  console.log(`${yy}-${mm}-${dd} 农历${i.lunar.lMonth}月${i.lunar.lDay}日 月柱${i.gzMonth} 日柱${i.gzDay} 星宿${starMansionOf(yy, mm, dd)} 六曜${liuYaoOf(i.lunar)} 十二神${shenOf(i.dayZhi, mzz)} 彭祖${pengZuOf(i.gzSeq).gan}/百忌${pengZuOf(i.gzSeq).zhi}`);
}
