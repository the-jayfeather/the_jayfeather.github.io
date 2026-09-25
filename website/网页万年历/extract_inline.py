# -*- coding: utf-8 -*-
"""提取万年历.html 最后一个内联 <script> 块做语法检查"""
import re, io, sys

path = r"F:\系统安装与开荒\本次整活\网页万年历\万年历.html"
with io.open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# 取所有 <script>...</script> 无 src 的块
blocks = re.findall(r'<script>(.*?)</script>', html, re.S)
print("inline script blocks:", len(blocks))
js = "\n".join(blocks)
with io.open(r"F:\系统安装与开荒\本次整活\网页万年历\_inline_check.js", 'w', encoding='utf-8', newline='\n') as f:
    f.write(js)
print("written", len(js), "chars")
