# -*- coding: utf-8 -*-
"""Meeus 简化太阳黄经算法验证（修正版：无界黄经二分）"""
import datetime, math

DEG = math.pi / 180.0

def jd_from_utc(y, m, d, h=0):
    a = (14 - m) // 12
    yy = y + 4800 - a
    mm = m + 12*a - 3
    jdn = d + (153*mm + 2)//5 + 365*yy + yy//4 - yy//100 + yy//400 - 32045
    return jdn + (h - 12.0)/24.0

def jd_to_date(jd):
    jd = jd + 0.5
    z = int(jd)
    f = jd - z
    a = z
    if z >= 2299161:
        alpha = int((z - 1867216.25) / 36524.25)
        a = z + 1 + alpha - alpha // 4
    b = a + 1524
    c = int((b - 122.1) / 365.25)
    d = int(365.25 * c)
    e = int((b - d) / 30.6001)
    day = b - d - int(30.6001 * e) + f
    month = e - 1 if e < 14 else e - 13
    year = c - 4716 if month > 2 else c - 4715
    day_i = int(day)
    frac = day - day_i
    hour = int(frac * 24)
    minute = int((frac * 24 - hour) * 60)
    return datetime.datetime(year, month, day_i, hour, minute)

def sun_longitude_raw(jd):
    # 无界太阳视黄经（不取模，一年内单调递增约360度）
    T = (jd - 2451545.0) / 36525.0
    L0 = 280.46646 + 36000.76983*T + 0.0003032*T*T
    M = 357.52911 + 35999.05029*T - 0.0001537*T*T
    C = (1.914602 - 0.004817*T - 0.000014*T*T)*math.sin(M*DEG) \
        + (0.019993 - 0.000101*T)*math.sin(2*M*DEG) + 0.000289*math.sin(3*M*DEG)
    return L0 + C

def solar_term_datetime(y, n):
    target = (285 + 15*n) % 360
    lo = jd_from_utc(y, 1, 1)
    hi = jd_from_utc(y+1, 1, 1)
    lam_lo = sun_longitude_raw(lo)
    target_eff = target
    while target_eff < lam_lo:
        target_eff += 360.0
    for _ in range(90):
        mid = (lo + hi) / 2.0
        if sun_longitude_raw(mid) < target_eff:
            lo = mid
        else:
            hi = mid
    t = jd_to_date((lo + hi) / 2.0) + datetime.timedelta(hours=8)  # UTC+8
    return t

names = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至',
         '小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至']

tests = [
    (2025, '冬至', 21, 12), (2026, '冬至', 22, 12), (2024, '冬至', 21, 12),
    (2026, '秋分', 23, 9), (2025, '秋分', 23, 9), (2024, '春分', 20, 3),
    (2024, '立春', 4, 2), (2026, '立春', 4, 2), (2026, '小寒', 5, 1),
    (2025, '清明', 4, 4), (2026, '清明', 5, 4), (2026, '立夏', 5, 5),
    (2026, '大暑', 23, 7), (2026, '芒种', 5, 6), (2025, '春分', 20, 3),
    (2026, '谷雨', 20, 4), (2026, '霜降', 23, 10), (2026, '处暑', 23, 8),
]
ok = 0
for y, name, expd, expm in tests:
    n = names.index(name)
    t = solar_term_datetime(y, n)
    match = (t.day == expd and t.month == expm)
    if match: ok += 1
    print(f'{y}年{name}: 算法={t.month}月{t.day}日 {t:%H:%M} | 权威={expm}月{expd}日 {"OK" if match else "MISMATCH"}')
print(f'\n通过 {ok}/{len(tests)}')
