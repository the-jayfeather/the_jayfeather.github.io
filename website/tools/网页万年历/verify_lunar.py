# -*- coding: utf-8 -*-
"""验证 lunar.js 算法核心输出（与权威黄历比对）"""
import datetime

LUNAR_INFO = [
0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
0x0d520]

def lYearDays(y):
    s=348
    i=0x8000
    while i>0x8:
        s += 1 if (LUNAR_INFO[y-1900]&i) else 0
        i >>= 1
    return s+leapDays(y)
def leapMonth(y): return LUNAR_INFO[y-1900]&0xf
def leapDays(y): return (leapMonth(y) and ((LUNAR_INFO[y-1900]&0x10000) and 30 or 29)) or 0
def monthDays(y,m): return 30 if (LUNAR_INFO[y-1900]&(0x10000>>m)) else 29

def solarToLunar(y,m,d):
    base=datetime.date(1900,1,31); obj=datetime.date(y,m,d)
    offset=(obj-base).days
    i=1900; temp=0
    while i<2101 and offset>0:
        temp=lYearDays(i); offset-=temp; i+=1
    if offset<0: offset+=temp; i-=1
    lYear=i
    leap=leapMonth(lYear); isLeap=False
    i=1
    while i<13 and offset>0:
        if leap>0 and i==(leap+1) and isLeap==False:
            i-=1; isLeap=True; temp=leapDays(lYear)
        else:
            temp=monthDays(lYear,i); isLeap=False
        offset-=temp; i+=1
    if offset==0 and leap>0 and i==leap+1:
        if isLeap: isLeap=False
        else: isLeap=True; i-=1
    if offset<0: offset+=temp; i-=1
    return (lYear,i,offset+1,isLeap)

GAN='甲乙丙丁戊己庚辛壬癸'; ZHI='子丑寅卯辰巳午未申酉戌亥'
def gzName(seq):
    seq=seq%60
    return GAN[seq%10]+ZHI[seq%12]
def dayGz(y,m,d):
    ref=datetime.date(2024,1,1); cur=datetime.date(y,m,d)
    return (cur-ref).days%60
def yearGz(ly): return (ly-4)%60
def monthGz(ly,lm):
    yg=(ly-4)%60%10
    fg=(yg*2+2)%10
    gan=(fg+lm-1)%10
    zhi=(lm+1)%12
    return (gan*6-zhi*5+120)%60

STERM_INFO=[0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397822,420241,441893,464354,487003,509592]
import time
def sTerm(y,n):
    ms=31556925974.7*(y-1900)+STERM_INFO[n]*60000
    t=datetime.datetime(1900,1,6,2,5)+datetime.timedelta(milliseconds=ms)
    return t.day

cases=[
    (2024,1,1,  '2023-11-20 癸卯 甲子日 甲子月', '权威:癸卯年甲子月甲子日,农历冬月二十'),
    (2024,2,10, '2024-01-01 甲辰 春节', '权威:2024年2月10日春节,甲辰年正月初一'),
    (2025,1,29, '2025-01-01 乙巳 春节', '权威:2025年1月29日春节,乙巳年正月初一'),
    (2026,2,17, '2026-01-01 丙午 春节', '权威:2026年2月17日春节,丙午年正月初一'),
    (2026,9,24, '2026-08-14 丙午 辛丑日 丁酉月', '权威:农历八月十四,丙午年丁酉月辛丑日,冲羊煞东'),
    (2023,6,22, '2023-05-05 癸卯 端午(五月初五)', '权威:2023年端午节6月22日'),
    (2024,4,4,  '甲辰 清明', '权威:2024年清明4月4日'),
]
print('=== 农历/干支 验证 ===')
for y,m,d,expect,note in cases:
    ly,lm,ld,le=solarToLunar(y,m,d)
    g=dayGz(y,m,d)
    yg=yearGz(ly); mg=monthGz(ly,lm)
    print(f'{y}-{m:02d}-{d:02d} -> 农历{ly}年{lm}月{ld}日(闰{le}) | 年{gzName(yg)} 月{gzName(mg)} 日{gzName(g)}')
    print(f'   期待: {expect} | {note}')
print()
print('=== 节气验证 ===')
for y,term,expect in [(2026,'秋分',23),(2024,'立春',4),(2025,'冬至',21),(2026,'立春',4),(2024,'春分',20)]:
    n=STERM_INFO and None
    idx={'小寒':0,'大寒':1,'立春':2,'雨水':3,'惊蛰':4,'春分':5,'清明':6,'谷雨':7,'立夏':8,'小满':9,'芒种':10,'夏至':11,'小暑':12,'大暑':13,'立秋':14,'处暑':15,'白露':16,'秋分':17,'寒露':18,'霜降':19,'立冬':20,'小雪':21,'大雪':22,'冬至':23}[term]
    print(f'{y}年{term}: 算法={sTerm(y,idx)}日, 期待≈{expect}日')
