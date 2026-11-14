# 铜方块快闪 / Copper Block Flash

一个以 Minecraft 1.21.9「铜器时代」为主题的静态网页：按顺序快闪全部铜方块、氧化变种、涂蜡变种与方块状态，并可用浏览器自带语音朗读。

## 打开方式

- **推荐单文件版**：双击 `copper-block-flash.standalone.html`，所有 CSS、JavaScript、图标均已内联，无需联网。
- **源码版**：双击 `index.html`。需要保持 `styles.css`、`data.js`、`art.js`、`app.js`、`favicon.svg`、`favicon.ico`、`apple-touch-icon.png` 在同一目录。

两种版本均不需要安装依赖、不需要本地服务器。

## 功能

- **全部铜方块**：铜块、切制铜块、雕纹铜块、切制铜台阶、切制铜楼梯、铜格栅、铜栏杆、铜链、铜灯笼、铜灯、铜门、铜活板门、铜箱子、铜傀儡像、避雷针，外加不可氧化/不可涂蜡的铜火把。
- **8 个基础变种**：未氧化 / 斑驳 / 锈蚀 / 氧化 × 未涂蜡 / 涂蜡。
- **完整方块状态**：朝向、正置/倒置、向左外角/向右外角/向左内角/向右内角/直形、含水、门格、铰链、开合、红石激活、亮灭、悬挂、轴向、箱体左右半、傀儡姿势、栏杆连接、避雷针朝向等。
- **状态串联名称**：状态词用“的”串在方块名称前，例如“倒置的向右外角的斑驳的铜楼梯”“含水的涂蜡的正置的向左外角的朝北的切制铜楼梯”。
- **两种组合模式**：完整模式默认展开全部状态组合，共 **2,761** 项；精简模式每个方块类型只保留一个代表状态，共 **121** 项。
- **语音朗读**：默认关闭。开启后调用浏览器 `speechSynthesis`，每个方块会停留到语音读完再自动切换；如果浏览器无可用语音或朗读失败，会自动回退到“停留时长”。Edge 下优先选择 **Microsoft 晓晓 Online (Natural)** 等内置自然语音，在线语音不可用时会自动回退到本地语音；本地语音会自动加速到约 **1.24×**，在线自然语音约 **1.10×**。控制栏的 **音色下拉框** 可手动切换自动、Edge 在线自然语音、本地语音等；旁边的 **语速下拉框** 可单独选择自动 / 0.8×–1.5×，选择都会保存在本机。
- **预加载下一项**：当前项开始朗读后，会立刻把下一项的朗读加入 `speechSynthesis` 队列，缩短朗读之间的启动/合成延迟；显示仍会在上一项读完后才切换。
- **自定义方块**：添加自己的铜方块条目，自动组合氧化/涂蜡前缀，并支持额外状态标签；数据保存在本机 `localStorage`。
- **播放控件**：开始/暂停、上一个/下一个、循环、停留时长、进度、下一项预览、全屏。
- **快捷键**：`Space` 播放/暂停，`←`/`→` 上一个/下一个，`T` 朗读开关，`L` 循环开关，`R` 回到开头。

## 排序规则

1. 先按方块种类：铜块 → 切制铜块 → 雕纹铜块 → 切制铜台阶 → 切制铜楼梯 → 铜格栅 → 铜栏杆 → 铜链 → 铜灯笼 → 铜灯 → 铜门 → 铜活板门 → 铜箱子 → 铜傀儡像 → 避雷针 → 铜火把。
2. 同一种方块内：先全部未涂蜡，再全部涂蜡。
3. 可含水方块：先全部干燥，再全部含水。
4. 每个分组内：未氧化 → 斑驳 → 锈蚀 → 氧化。
5. 其他状态在氧化阶段内继续排序。楼梯的状态顺序为：
   - 正置 → 倒置
   - 向左外角 → 向右外角 → 向左内角 → 向右内角 → 直形
   - 朝北 → 朝东 → 朝南 → 朝西

这与需求示例中的“正置的向左外角…… > 正置的向右外角…… > …… > 斑驳…… > 倒置…… > …… > 含水重复”保持一致。

## 数据说明

- 方块名称、氧化阶段、涂蜡状态与方块状态参考 Minecraft Java 版 1.21.9 官方中文译名及 Minecraft Wiki：
  - <https://minecraft.wiki/w/The_Copper_Age>
  - <https://zh.minecraft.wiki/w/铜块>
  - <https://zh.minecraft.wiki/w/切制铜楼梯>
  - <https://zh.minecraft.wiki/w/切制铜台阶>
  - <https://zh.minecraft.wiki/w/铜格栅>
  - <https://zh.minecraft.wiki/w/铜栏杆>
  - <https://zh.minecraft.wiki/w/铜链>
  - <https://zh.minecraft.wiki/w/铜灯笼>
  - <https://zh.minecraft.wiki/w/铜灯>
  - <https://zh.minecraft.wiki/w/铜门>
  - <https://zh.minecraft.wiki/w/铜活板门>
  - <https://zh.minecraft.wiki/w/铜箱子>
  - <https://zh.minecraft.wiki/w/铜傀儡像>
  - <https://minecraft.wiki/w/Lightning_Rod>
  - <https://minecraft.wiki/w/Copper_Torch>
- "铜栏杆"在部分玩家口中也被称为"铜栅栏"，页面中作为别名支持搜索。
- 所有方块插画均为本页自行绘制的原创 SVG，没有使用 Mojang 的纹理文件。
- 本页是非官方粉丝作品，与 Mojang / Microsoft 无关。

## 文件结构

```text
copper-block-flash/
├─ index.html                         # 多文件版入口
├─ copper-block-flash.standalone.html # 单文件版（推荐分享）
├─ styles.css                         # 铜主题样式
├─ data.js                            # 方块数据、状态组合、排序
├─ art.js                             # 原创 SVG 方块插画
├─ app.js                             # 播放、TTS、自定义、侧栏
├─ favicon.svg / favicon.ico          # 铜块网页图标
├─ apple-touch-icon.png               # 铜块触控图标
├─ preview.png                        # 桌面预览图
├─ build-standalone.mjs               # 生成单文件版的脚本
└─ README.md
```

重新生成单文件版：

```bash
node build-standalone.mjs
```
