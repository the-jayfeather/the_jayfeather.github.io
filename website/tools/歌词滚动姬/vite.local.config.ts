import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

const json_suffix = ".json";
const lang_dir = "src/languages";

const langFileList = readdirSync(lang_dir)
    .filter((filename) => filename.endsWith(json_suffix))
    .sort();

const langMap = await Promise.all(
    langFileList.map(async (f) => {
        const filePath = join(lang_dir, f);
        const fileContent = await readFile(filePath, { encoding: "utf-8" });
        const langCode = f.slice(0, -json_suffix.length);
        const langJson = JSON.parse(fileContent) as { languageName: string };
        return [langCode, langJson.languageName] as const;
    }),
);

export default defineConfig({
    clearScreen: false,
    json: {
        namedExports: false,
    },
    // 单文件本地版：不注册 ServiceWorker（file:// 下无意义）
    plugins: [],
    base: "./",
    esbuild: {
        jsx: "automatic",
    },
    define: {
        "import.meta.env.app": JSON.stringify({
            hash: "local",
            updateTime: new Date().toISOString(),
            version: pkg.version,
        }),
        "i18n.langCodeList": JSON.stringify(langFileList.map((f) => f.slice(0, -json_suffix.length))),
        "i18n.langMap": JSON.stringify(langMap),
    },
    css: {
        transformer: "lightningcss",
    },
    build: {
        minify: true,
        cssMinify: "lightningcss",
        outDir: "build-local",
        modulePreload: {
            polyfill: false,
        },
        rollupOptions: {
            input: ["index.html"],
            output: {
                inlineDynamicImports: true,
            },
        },
    },
});
