# -*- coding: utf-8 -*-
"""recover_history.py —— 从会话轨迹恢复原 history.js 数据，用 node 求值后输出临时 JSON"""
import json, io, subprocess, os, sys

TRAJ = r'C:\Users\Administrator\AppData\Local\Doubao\User Data\Default\.doubao\agent_mode\workspace\.sessions\38443878717118722\agents\m_0cwp2cU0xDW\system\trajectory.jsonl'
TMP_JS = r'F:\系统安装与开荒\本次整活\网页万年历\_recover_tmp.js'
OUT = r'F:\系统安装与开荒\本次整活\网页万年历\_history_orig.json'

raw_content = None
with io.open(TRAJ, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
        except Exception:
            continue
        if obj.get('role') != 'assistant':
            continue
        tcs = obj.get('tool_calls') or []
        for tc in tcs:
            if tc.get('function', {}).get('name') == 'Write':
                args = tc['function']['arguments']
                if isinstance(args, str):
                    args = json.loads(args)
                if args.get('file_path', '').endswith('history.js'):
                    raw_content = args['content']
                    break
        if raw_content:
            break

if not raw_content:
    print('FAIL: 未找到原始 history.js 写入内容')
    sys.exit(1)

print('原始文本长度:', len(raw_content))

with io.open(TMP_JS, 'w', encoding='utf-8', newline='\n') as f:
    f.write("global.window = global;\n")
    f.write(raw_content)
    f.write("\nrequire('fs').writeFileSync(process.argv[2], JSON.stringify(window.HISTORY));\n")

r = subprocess.run(['node', TMP_JS, OUT], capture_output=True, text=True, encoding='utf-8', errors='replace')
if r.returncode != 0:
    print('node 失败:', r.stderr[:500])
    sys.exit(1)

with io.open(OUT, 'r', encoding='utf-8') as f:
    data = json.load(f)
print('恢复成功，键数:', len(data), '事件总数:', sum(len(v) for v in data.values()))
print('样例 9-24:', data.get('9-24'))
print('样例 7-1:', data.get('7-1'))
print('样例 12-31:', data.get('12-31'))
