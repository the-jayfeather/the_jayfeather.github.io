// 单文件本地版生成脚本：vite build --config vite.local.config.ts 之后运行
// 作用：把 CSS / JS / 加载动画 / 图标全部内联进一个 HTML，实现本地双击直开。
// 注意：必须使用函数形式的 String.replace，避免 bundle 中合法的 $&/$' 被展开。
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

const buildDir = "build-local";
const outPath = "歌词滚动姬.html";

let html = readFileSync(`${buildDir}/index.html`, "utf-8");

// 1. 内联 CSS
const cssTag = html.match(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/);
if (!cssTag) throw new Error("css tag not found");
const css = readFileSync(`${buildDir}/assets/${cssTag[1]}`, "utf-8").replace(/<\/style/gi, "<\\/style");
html = html.replace(cssTag[0], () => `<style>${css}</style>`);

// 2. 内联 JS
const jsTag = html.match(/<script type="module"[^>]*src="\.\/assets\/([^"]+\.js)"[^>]*><\/script>/);
if (!jsTag) throw new Error("js tag not found");
const js = readFileSync(`${buildDir}/assets/${jsTag[1]}`, "utf-8").replace(/<\/script/gi, "<\\/script");
html = html.replace(jsTag[0], () => `<script type="module">${js}</script>`);

// 3. 内联加载动画 SVG 为 data URI
const svgTag = html.match(/src="\.\/svg\/([^"]+\.svg)"/);
if (!svgTag) throw new Error("svg tag not found");
const svg = readFileSync(`${buildDir}/svg/${svgTag[1]}`);
html = html.replace(svgTag[0], `src="data:image/svg+xml;base64,${svg.toString("base64")}"`);

// 4. 图标内联为 data URI，去掉非必需外链
const fav = readFileSync(`${buildDir}/favicons/favicon-32x32.png`).toString("base64");
const favData = `data:image/png;base64,${fav}`;
html = html
    .replace(/<link rel="apple-touch-icon"[^>]*>/g, `<link rel="apple-touch-icon" type="image/png" sizes="180x180" href="${favData}" />`)
    .replace(/<link rel="icon" type="image\/png" sizes="32x32"[^>]*>/g, `<link rel="icon" type="image/png" sizes="32x32" href="${favData}" />`)
    .replace(/<link rel="icon" type="image\/png" sizes="16x16"[^>]*>/g, "")
    .replace(/<link rel="manifest"[^>]*>/g, "")
    .replace(/<link rel="mask-icon"[^>]*>/g, "")
    .replace(/<link rel="shortcut icon"[^>]*>/g, "")
    .replace(/<meta name="msapplication-config"[^>]*>/g, "");

writeFileSync(outPath, html, "utf-8");
console.log("single file written:", outPath, `${(html.length / 1024).toFixed(1)} KB`);

// 5. worker 文件（ncm/qmc 解密用）：bundle 以页面相对路径引用，复制到页面同级目录
const workerRefs = [...js.matchAll(/new URL\("((?:ncmc|qmc)-worker-[^"]+\.js)",import\.meta\.url\)/g)];
for (const m of workerRefs) {
    const file = m[1];
    copyFileSync(`${buildDir}/assets/${file}`, file);
    console.log("worker copied:", file);
}
if (workerRefs.length === 0) console.log("WARN: no worker refs found in bundle");

// 6. 自检
const externalRefs = [...html.matchAll(/(?:src|href)="\.\/(?!assets\/(?:ncmc|qmc))[^"]*"/g)].map((x) => x[0]);
console.log("remaining relative refs:", externalRefs.length ? externalRefs : "none");
console.log("corrupted tag count:", (html.match(/<script type="module" crossorigin/g) || []).length);
