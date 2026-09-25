/* ============================================================
 * lunar.js —— 农历 / 节气 / 干支计算库（1900–2100）
 * 以 script 标签加载（file:// 下不受跨域限制）
 * 算法：经典农历数据表 + 公历->农历转换；节气用世纪公式；干支用锚点法
 * 锚点：公历 2024-01-01 = 甲子日（经多方黄历核验）
 * ============================================================ */
window.LunarLib = (function () {
  'use strict';

  /* ---------- 农历数据表（1900–2100，201 项） ---------- */
  var LUNAR_INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
    0x0d520 // 2100
  ];

  /* ---------- 基础表 ---------- */
  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var SHENGXIAO = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
  var MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  var DAY_CN = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  var WEEK_CN = ['日', '一', '二', '三', '四', '五', '六'];

  /* ---------- 节气（Meeus 简化太阳黄经 + 二分求时刻，精度约±20分钟） ---------- */
  var STERM_NAME = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
    '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
    '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];

  /** 公历 y/m/d 0点(UT) 的儒略日 */
  function julianDayUTC(y, m, d) {
    var a = Math.floor((14 - m) / 12);
    var yy = y + 4800 - a;
    var mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) -
      Math.floor(yy / 100) + Math.floor(yy / 400) - 32045 - 0.5;
  }
  /** 无界太阳视黄经（度） */
  function sunLongitudeRaw(jd) {
    var T = (jd - 2451545.0) / 36525.0;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var Mr = M * Math.PI / 180;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) + 0.000289 * Math.sin(3 * Mr);
    return L0 + C;
  }
  /** 儒略日 -> {y,m,d}（UT 历日） */
  function jdToDate(jd) {
    jd = jd + 0.5;
    var z = Math.floor(jd), f = jd - z, a = z;
    if (z >= 2299161) {
      var alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    var b = a + 1524, c = Math.floor((b - 122.1) / 365.25);
    var d = Math.floor(365.25 * c), e = Math.floor((b - d) / 30.6001);
    var day = b - d - Math.floor(30.6001 * e) + f;
    var month = e < 14 ? e - 1 : e - 13;
    var year = month > 2 ? c - 4716 : c - 4715;
    return { y: year, m: month, d: Math.floor(day) };
  }
  /** 节气：某年某节气落在北京时间的“日”（月 = floor(n/2)+1） */
  function solarTermDate(y, n) {
    var target = (285 + 15 * n) % 360;
    var lo = julianDayUTC(y, 1, 1);
    var hi = julianDayUTC(y + 1, 1, 1);
    var lamLo = sunLongitudeRaw(lo);
    while (target < lamLo) target += 360;
    var mid, iter;
    for (iter = 0; iter < 90; iter++) {
      mid = (lo + hi) / 2;
      if (sunLongitudeRaw(mid) < target) lo = mid; else hi = mid;
    }
    return jdToDate((lo + hi) / 2 + 8 / 24).d; // +8h 转北京时间取日
  }
  /** 某年全年 24 节气 [{name, month, day}] */
  function solarTermsOfYear(y) {
    var list = [], i;
    for (i = 0; i < 24; i++) {
      list.push({ name: STERM_NAME[i], month: Math.floor(i / 2) + 1, day: solarTermDate(y, i) });
    }
    return list;
  }
  /** 某日（公历）的节气，无则返回 null */
  function termOfDay(y, m, d) {
    var n = (m - 1) * 2;
    if (solarTermDate(y, n) === d) return STERM_NAME[n];
    if (solarTermDate(y, n + 1) === d) return STERM_NAME[n + 1];
    return null;
  }

  /* ---------- 农历基础函数 ---------- */
  function lYearDays(y) {
    var sum = 348, i;
    for (i = 0x8000; i > 0x8; i >>= 1) sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0;
    return sum + leapDays(y);
  }
  function leapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }
  function leapDays(y) { return leapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0; }
  function monthDays(y, m) { return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29; }

  /** 公历 -> 农历 */
  function solarToLunar(y, m, d) {
    /* Date.UTC 计算绝对天数差，避免历史夏令时/LMT 导致的非整天偏差 */
    var base = Date.UTC(1900, 0, 31);
    var obj = Date.UTC(y, m - 1, d);
    var offset = Math.floor((obj - base) / 86400000);
    var i, temp = 0, lYear = 1900;
    for (i = 1900; i < 2101 && offset > 0; i++) {
      temp = lYearDays(i);
      offset -= temp;
    }
    if (offset < 0) { offset += temp; i--; }
    lYear = i;
    var leap = leapMonth(lYear), isLeap = false;
    var lMonth, lDay;
    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === (leap + 1) && isLeap === false) {
        --i; isLeap = true; temp = leapDays(lYear);
      } else {
        temp = monthDays(lYear, i); isLeap = false;
      }
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && i === leap + 1) {
      if (isLeap) { isLeap = false; } else { isLeap = true; --i; }
    }
    if (offset < 0) { offset += temp; --i; }
    lMonth = i;
    lDay = offset + 1;
    return { lYear: lYear, lMonth: lMonth, lDay: lDay, isLeap: isLeap };
  }

  /** 农历 -> 公历 Date（本地午夜） */
  function lunarToSolar(lYear, lMonth, lDay, isLeap) {
    var offset = 0, i, leap = leapMonth(lYear);
    for (i = 1900; i < lYear; i++) offset += lYearDays(i);
    if (isLeap) {
      /* 闰月：第 lMonth 月后之闰月，前面累计 1..lMonth 月 */
      for (i = 1; i <= lMonth; i++) offset += monthDays(lYear, i);
    } else {
      for (i = 1; i < lMonth; i++) {
        offset += monthDays(lYear, i);
        /* 闰月插在第 leap 月之后（序列第 leap+1 位） */
        if (leap > 0 && i === leap) offset += leapDays(lYear);
      }
    }
    offset += lDay - 1;
    return new Date(1900, 0, 31 + offset);
  }

  /* ---------- 干支 ---------- */
  /** 60 甲子序号 -> 干支名 */
  function gzName(seq) {
    seq = ((seq % 60) + 60) % 60;
    return GAN[seq % 10] + ZHI[seq % 12];
  }
  /** 日干支序：锚点 2024-01-01 = 甲子(0) */
  function dayGzSeq(y, m, d) {
    var ref = Date.UTC(2024, 0, 1);
    var cur = Date.UTC(y, m - 1, d);
    return ((cur - ref) / 86400000) % 60;
  }
  /** 农历年干支序（正月初一为界） */
  function yearGzSeq(lYear) { return (lYear - 4) % 60; }
  /** 农历月干支序（五虎遁，正月=寅，按农历月简化） */
  function monthGzSeq(lYear, lMonth) {
    var yg = (lYear - 4) % 60 % 10;           // 年干序
    var firstGan = (yg * 2 + 2) % 10;         // 正月天干
    var gan = (firstGan + lMonth - 1) % 10;   // 月干
    var zhi = (lMonth + 1) % 12;              // 月支（正月=寅=2）
    var seq = (gan * 6 - zhi * 5 + 60 * 2) % 60;
    return seq;
  }

  /* ---------- 对外接口 ---------- */
  return {
    GAN: GAN, ZHI: ZHI, SHENGXIAO: SHENGXIAO, MONTH_CN: MONTH_CN, DAY_CN: DAY_CN,
    WEEK_CN: WEEK_CN, STERM_NAME: STERM_NAME,
    solarToLunar: solarToLunar,
    lunarToSolar: lunarToSolar,
    lYearDays: lYearDays,
    leapMonth: leapMonth,
    leapDays: leapDays,
    monthDays: monthDays,
    solarTermDate: solarTermDate,
    solarTermsOfYear: solarTermsOfYear,
    termOfDay: termOfDay,
    gzName: gzName,
    dayGzSeq: dayGzSeq,
    yearGzSeq: yearGzSeq,
    monthGzSeq: monthGzSeq,
    /** 农历日汉字名 */
    lunarDayCN: function (lDay) { return DAY_CN[lDay - 1]; },
    /** 农历月汉字名（含闰） */
    lunarMonthCN: function (lMonth, isLeap) {
      return (isLeap ? '闰' : '') + MONTH_CN[lMonth - 1] + '月';
    }
  };
})();
