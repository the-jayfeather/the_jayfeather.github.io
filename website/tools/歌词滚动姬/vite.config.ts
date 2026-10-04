import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import pkg from "./package.json" with { type: "json" };
import sw_plugin from "./plugins/sw-plugin";

const json_suffix = ".json";
const lang_dir = "src/languages";

const langFileList = readdirSync(lang_dir).filter((filename) => filename.endsWith(json_suffix));
langFileList.sort();

interface LangContent {
    languageName: string;
}

const langMap = await Promise.all(
    langFileList.map(async (f) => {
        const filePath = join(lang_dir, f);
        const fileContent = await readFile(filePath, {
            encoding: "utf-8",
        });

        const langCode = f.slice(0, -json_suffix.length);
        const langJson = JSON.parse(fileContent) as LangContent;
        const languageName = langJson.languageName;
        return [langCode, languageName] as const;
    }),
);

/**
 * 非 git 仓库（如本地直接拷入网站目录）时回退到时间戳，保证构建不失败。
 */
function runOr(cmd: string, fallback: string): string {
    try {
        return execSync(cmd).toString().trim();
    } catch {
        return fallback;
    }
}

const hash = runOr("git rev-parse --short HEAD", "local");
const updateTime = runOr("git log -1 --format=%cI", new Date().toISOString());

function stripCrossorigin(): Plugin {
    return {
        name: "strip-crossorigin",
        transformIndexHtml(html) {
            // file:// 直开时 crossorigin 会把本地资源当成 CORS 请求拦截（origin null），去掉以保证本地可用
            return html.replace(/\s+crossorigin(="[^"]*")?/g, "");
        },
    };
}

export default defineConfig({
    clearScreen: false,
    json: {
        namedExports: false,
    },
    plugins: [sw_plugin(), stripCrossorigin()],
    base: "./",
    esbuild: {
        jsx: "automatic",
    },
    define: {
        "import.meta.env.app": JSON.stringify({ hash, updateTime, version: pkg.version }),
        "i18n.langCodeList": JSON.stringify(langFileList.map((f) => f.slice(0, -json_suffix.length))),
        "i18n.langMap": JSON.stringify(langMap),
    },
    css: {
        transformer: "lightningcss",
    },
    build: {
        minify: true,
        cssMinify: "lightningcss",
        outDir: "build",
        modulePreload: {
            polyfill: false,
        },
        rollupOptions: {
            input: ["index.html", "worker/sw.ts"],
            output: {
                entryFileNames(chunkInfo) {
                    if (chunkInfo.name === "sw") {
                        return "sw.js";
                    }
                    return "assets/[name]-[hash].js";
                },
            },
        },
    },
});
