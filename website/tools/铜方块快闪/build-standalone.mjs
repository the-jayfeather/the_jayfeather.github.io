import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const favicon = fs.readFileSync(path.join(root, 'favicon.svg')).toString('base64');
const css = read('styles.css');
const data = read('data.js');
const art = read('art.js');
const app = read('app.js');

let html = read('index.html');
html = html
  .replace(/\s*<link rel="icon"[^>]*>\s*/i, () => `\n  <link rel="icon" href="data:image/svg+xml;base64,${favicon}" type="image/svg+xml">\n`)
  .replace(/\s*<link rel="alternate icon"[^>]*>\s*/i, () => '\n')
  .replace(/\s*<link rel="apple-touch-icon"[^>]*>\s*/i, () => '\n')
  .replace(/\s*<link rel="stylesheet" href="styles.css">\s*/i, () => `\n  <style>\n${css}\n  </style>\n`)
  .replace(/\s*<script src="data.js"><\/script>\s*/i, () => `\n  <script>\n${data}\n  </script>\n`)
  .replace(/\s*<script src="art.js"><\/script>\s*/i, () => `\n  <script>\n${art}\n  </script>\n`)
  .replace(/\s*<script src="app.js"><\/script>\s*/i, () => `\n  <script>\n${app}\n  </script>\n`);

const output = path.join(root, 'copper-block-flash.standalone.html');
fs.writeFileSync(output, html, 'utf8');
console.log(`Wrote ${output} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KiB)`);
