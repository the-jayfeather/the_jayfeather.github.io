/* ============================================================
 * 博饼互联服务器（零依赖，Node 运行）
 *
 * 用途：让手机与电脑配对，手机摇动触发电脑摇骰并同步结果。
 * 运行：在「博饼工具」目录下执行  node 互联服务器.js
 *
 * 职责：
 *  1. 静态托管本目录文件（手机通过 http://<电脑局域网IP>:4567 打开博饼页面）
 *  2. 电脑端注册配对码（4 位数字），手机凭码配对
 *  3. 中转「手机摇动 → 电脑」与「电脑结果 → 手机」两条消息
 *
 * 通信采用 HTTP + 轮询，无需 WebSocket：
 *  - 电脑端每 500ms 轮询 /api/events        （取摇动指令）
 *  - 手机端每 250ms 轮询 /api/phone/events  （取结果/状态）
 * ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 4567;
const ROOT = __dirname;

/* ---------------- 内存会话 ----------------
 * sessions: sid -> { code, paired, shakeFlag, lastSeen }
 * byCode  : code -> sid
 * phoneQueues: code -> [ {type:'result'|'status', ...} ] */
const sessions = new Map();
const byCode = new Map();
const phoneQueues = new Map();

function genCode() {
  let c;
  do { c = String(1000 + Math.floor(Math.random() * 9000)); } while (byCode.has(c));
  return c;
}
/* 清理 5 分钟无轮询的电脑会话 */
setInterval(() => {
  const now = Date.now();
  for (const [sid, s] of sessions) {
    if (now - s.lastSeen > 300000) {
      sessions.delete(sid);
      byCode.delete(s.code);
      phoneQueues.delete(s.code);
    }
  }
}, 60000).unref();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', c => { d += c; if (d.length > 64 * 1024) reject(new Error('too large')); });
    req.on('end', () => resolve(d));
    req.on('error', reject);
  });
}
function json(res, obj) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(obj));
}
function notFound(res) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404'); }
function lanIP() {
  const nets = os.networkInterfaces();
  for (const k of Object.keys(nets)) {
    for (const n of nets[k] || []) {
      if (n.family === 'IPv4' && !n.internal) return n.address;
    }
  }
  return '127.0.0.1';
}

const server = http.createServer(async (req, res) => {
  /* CORS 预检（电脑端可能以 file:// 打开页面跨域访问） */
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  let u;
  try { u = new URL(req.url, 'http://127.0.0.1'); }
  catch (e) { notFound(res); return; }
  const p = u.pathname;

  /* 电脑端：注册配对码 */
  if (p === '/api/pair/new' && req.method === 'POST') {
    const code = genCode();
    const sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessions.set(sid, { code, paired: false, shakeFlag: false, pairRequested: false, lastSeen: Date.now() });
    byCode.set(code, sid);
    phoneQueues.set(code, []);
    json(res, { ok: true, code, sid, ip: lanIP(), port: PORT });
    return;
  }

  /* 手机端：凭码配对 */
  if (p === '/api/pair/verify' && req.method === 'POST') {
    let code = '';
    try { code = String((JSON.parse(await readBody(req)) || {}).code || '').trim(); } catch (e) {}
    const sid = byCode.get(code);
    if (!sid) { json(res, { ok: false, error: '配对码不存在或已过期' }); return; }
    sessions.get(sid).paired = true;
    json(res, { ok: true });
    return;
  }

  /* 手机端：上报摇动 */
  if (p === '/api/shake' && req.method === 'POST') {
    let code = '';
    try { code = String((JSON.parse(await readBody(req)) || {}).code || '').trim(); } catch (e) {}
    const sid = byCode.get(code);
    if (!sid) { json(res, { ok: false, error: '配对码不存在或已过期' }); return; }
    sessions.get(sid).shakeFlag = true;
    json(res, { ok: true });
    return;
  }

  /* 电脑端：推送结果/状态给配对手机 */
  if (p === '/api/push' && req.method === 'POST') {
    let sid = '', msg = null;
    try { const b = JSON.parse(await readBody(req)); sid = b.sid || ''; msg = b.msg || null; } catch (e) {}
    const s = sessions.get(sid);
    if (!s || !msg) { json(res, { ok: false }); return; }
    const q = phoneQueues.get(s.code);
    if (q) q.push(msg);
    json(res, { ok: true });
    return;
  }

  /* 手机端：列出未配对电脑（自动发现） */
  if (p === '/api/list' && req.method === 'GET') {
    const list = [];
    for (const s of sessions.values()) {
      if (!s.paired) list.push({ code: s.code, ip: lanIP() });
    }
    json(res, { ok: true, list });
    return;
  }

  /* 手机端：向某电脑发送配对请求 */
  if (p === '/api/request' && req.method === 'POST') {
    let code = '';
    try { code = String((JSON.parse(await readBody(req)) || {}).code || '').trim(); } catch (e) {}
    const sid = byCode.get(code);
    if (!sid) { json(res, { ok: false, error: '配对码不存在或已过期' }); return; }
    sessions.get(sid).pairRequested = true;
    json(res, { ok: true });
    return;
  }

  /* 电脑端：同意配对 */
  if (p === '/api/accept' && req.method === 'POST') {
    let sid = '';
    try { sid = String((JSON.parse(await readBody(req)) || {}).sid || '').trim(); } catch (e) {}
    const s = sessions.get(sid);
    if (!s) { json(res, { ok: false }); return; }
    s.paired = true; s.pairRequested = false;
    json(res, { ok: true });
    return;
  }

  /* 电脑端：拒绝配对 */
  if (p === '/api/decline' && req.method === 'POST') {
    let sid = '';
    try { sid = String((JSON.parse(await readBody(req)) || {}).sid || '').trim(); } catch (e) {}
    const s = sessions.get(sid);
    if (!s) { json(res, { ok: false }); return; }
    s.pairRequested = false;
    json(res, { ok: true });
    return;
  }

  /* 电脑端：轮询摇动/配对状态（读取后消费 shake） */
  if (p === '/api/events' && req.method === 'GET') {
    const s = sessions.get(u.searchParams.get('sid') || '');
    if (!s) { json(res, { ok: false, error: '会话不存在或已过期' }); return; }
    s.lastSeen = Date.now();
    const out = { ok: true, paired: s.paired, shake: s.shakeFlag, request: s.pairRequested || false };
    s.shakeFlag = false;
    s.pairRequested = false;
    json(res, out);
    return;
  }

  /* 手机端：轮询结果/状态（读取后出队） */
  if (p === '/api/phone/events' && req.method === 'GET') {
    const code = u.searchParams.get('code') || '';
    const sid = byCode.get(code);
    if (!sid) { json(res, { ok: false, error: '配对码不存在或已过期' }); return; }
    const s = sessions.get(sid);
    const q = phoneQueues.get(code);
    const msg = q && q.length ? q.shift() : null;
    json(res, { ok: true, paired: s.paired, msg });
    return;
  }

  /* 静态文件托管（防目录穿越） */
  const rel = p === '/' ? '/博饼游戏.html' : p;
  let fp;
  try { fp = path.normalize(path.join(ROOT, decodeURIComponent(rel))); } catch (e) { notFound(res); return; }
  if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { notFound(res); return; }
  if (fp === ROOT) fp = path.join(ROOT, '博饼游戏.html');
  fs.readFile(fp, (err, data) => {
    if (err) { notFound(res); return; }
    const ext = path.extname(fp).toLowerCase();
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
      '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg'
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('博饼互联服务器已启动，端口 ' + PORT);
  console.log('电脑端：照常打开 博饼游戏.html 即可（设置 → 手机互联 查看配对码）。');
  console.log('手机端：与电脑连同一 Wi-Fi，浏览器访问  http://' + lanIP() + ':' + PORT + '  ');
  console.log('注意：如手机无法连接，请检查 Windows 防火墙是否放行端口 ' + PORT + '。');
});
