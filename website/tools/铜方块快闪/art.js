/* ==========================================================================
   铜方块 SVG 绘制
   - 每个方块种类有自己的等距/风格化图形
   - 会根据氧化阶段、含水、亮灭、开合、姿势、避雷针朝向等状态改变画面
   ========================================================================== */
(function () {
  "use strict";

  const { PALETTES, SPECIAL_PALETTE } = window.CopperData;

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function paletteFor(item) {
    return item.oxidation === null || item.oxidation === undefined
      ? SPECIAL_PALETTE
      : PALETTES[item.oxidation] || PALETTES[0];
  }

  function stateVal(item, key) {
    const value = item.stateValues && item.stateValues[key];
    return value ? value.id : null;
  }

  function facePoints(cx, y, hw, hh, sh) {
    return {
      top: `${cx},${y} ${cx + hw},${y + hh} ${cx},${y + hh * 2} ${cx - hw},${y + hh}`,
      left: `${cx - hw},${y + hh} ${cx},${y + hh * 2} ${cx},${y + hh * 2 + sh} ${cx - hw},${y + hh + sh}`,
      right: `${cx + hw},${y + hh} ${cx},${y + hh * 2} ${cx},${y + hh * 2 + sh} ${cx + hw},${y + hh + sh}`,
    };
  }

  function bottomPoint(cx, y, hh, sh) {
    return y + hh * 2 + sh;
  }

  function defs(p) {
    return `<defs>
      <pattern id="cfTex" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="2" height="2" fill="${p.hi}" opacity=".2"/>
        <rect x="4" y="2" width="1" height="2" fill="${p.edge}" opacity=".22"/>
        <rect x="2" y="5" width="2" height="1" fill="${p.speck}" opacity=".2"/>
        <rect x="6" y="6" width="1" height="1" fill="${p.patina}" opacity=".28"/>
      </pattern>
      <pattern id="cfHoles" width="14" height="14" patternUnits="userSpaceOnUse">
        <rect x="4" y="4" width="6" height="6" fill="#04100f" opacity=".78"/>
        <rect x="4" y="4" width="6" height="1" fill="${p.hi}" opacity=".18"/>
      </pattern>
      <radialGradient id="cfGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${p.glowSoft}" stop-opacity=".95"/>
        <stop offset="45%" stop-color="${p.glow}" stop-opacity=".52"/>
        <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="cfWax" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffe9ad" stop-opacity="0"/>
        <stop offset="45%" stop-color="#ffe9ad" stop-opacity=".72"/>
        <stop offset="100%" stop-color="#ffe9ad" stop-opacity="0"/>
      </linearGradient>
      <filter id="cfSoftGlow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="6"/>
      </filter>
      <filter id="cfTinyGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="2.4"/>
      </filter>
    </defs>`;
  }

  function isoBox(options) {
    const {
      cx = 130,
      y = 38,
      hw = 82,
      hh = 42,
      sh = 86,
      p,
      cls = "",
      shadow = false,
      detail = "",
    } = options;
    const f = facePoints(cx, y, hw, hh, sh);
    const shadowMarkup = shadow
      ? `<ellipse cx="${cx}" cy="${bottomPoint(cx, y, hh, sh) + 8}" rx="${hw * 0.9}" ry="${Math.max(7, hh * 0.24)}" fill="#000" opacity=".3"/>`
      : "";
    return `<g class="voxel ${cls}">
      ${shadowMarkup}
      <polygon points="${f.left}" fill="${p.left}"/>
      <polygon points="${f.right}" fill="${p.right}"/>
      <polygon points="${f.top}" fill="${p.top}"/>
      <polygon points="${f.left}" fill="url(#cfTex)" opacity=".42"/>
      <polygon points="${f.right}" fill="url(#cfTex)" opacity=".36"/>
      <polygon points="${f.top}" fill="url(#cfTex)" opacity=".48"/>
      <polyline points="${f.left}" fill="none" stroke="${p.edge}" stroke-width="1.6" opacity=".85"/>
      <polyline points="${f.right}" fill="none" stroke="${p.edge}" stroke-width="1.6" opacity=".85"/>
      <polyline points="${f.top}" fill="none" stroke="${p.edge}" stroke-width="1.6" opacity=".9"/>
      <polyline points="${cx - hw},${y + hh} ${cx},${y + hh * 2} ${cx + hw},${y + hh}" fill="none" stroke="${p.hi}" stroke-width="1.3" opacity=".34"/>
      <line x1="${cx - hw + 12}" y1="${y + hh + 10}" x2="${cx - hw + 12}" y2="${y + hh + sh - 10}" stroke="${p.hi}" stroke-width="1" opacity=".16"/>
      <line x1="${cx + hw - 7}" y1="${y + hh + 13}" x2="${cx + hw - 7}" y2="${y + hh + sh - 13}" stroke="${p.edge}" stroke-width="1" opacity=".2"/>
      <g opacity=".72">
        <polygon points="${cx - 26},${y + 31} ${cx - 22},${y + 33} ${cx - 26},${y + 35} ${cx - 30},${y + 33}" fill="${p.hi}" opacity=".30"/>
        <polygon points="${cx + 18},${y + 36} ${cx + 23},${y + 38.5} ${cx + 18},${y + 41} ${cx + 13},${y + 38.5}" fill="${p.speck}" opacity=".26"/>
        <polygon points="${cx - 3},${y + 55} ${cx + 2},${y + 57.5} ${cx - 3},${y + 60} ${cx - 8},${y + 57.5}" fill="${p.hi}" opacity=".18"/>
        <polygon points="${cx + 42},${y + 52} ${cx + 46},${y + 54} ${cx + 42},${y + 56} ${cx + 38},${y + 54}" fill="${p.edge}" opacity=".16"/>
        <polygon points="${cx - 47},${y + 49} ${cx - 43},${y + 51} ${cx - 47},${y + 53} ${cx - 51},${y + 51}" fill="${p.speck}" opacity=".18"/>
      </g>
      ${p.aged
        ? `<g opacity=".7">
            <polygon points="${cx - 18},${y + 47} ${cx - 12},${y + 50} ${cx - 18},${y + 53} ${cx - 24},${y + 50}" fill="${p.patina}" opacity=".56"/>
            <polygon points="${cx + 29},${y + 25} ${cx + 34},${y + 27.5} ${cx + 29},${y + 30} ${cx + 24},${y + 27.5}" fill="${p.patina}" opacity=".42"/>
            <polygon points="${cx + 7},${y + 64} ${cx + 11},${y + 66} ${cx + 7},${y + 68} ${cx + 3},${y + 66}" fill="${p.patina}" opacity=".36"/>
          </g>`
        : ""}
      ${detail}
    </g>`;
  }

  function waterOverlay() {
    return `<g class="water-overlay" opacity=".95">
      <path d="M48 205 q13 -8 26 0 t26 0 t26 0 t26 0 t26 0 t26 0" fill="none" stroke="#7ce5ee" stroke-width="2.4" opacity=".52"/>
      <path d="M58 213 q11 -6 22 0 t22 0 t22 0 t22 0 t22 0 t22 0" fill="none" stroke="#45b8c9" stroke-width="2" opacity=".36"/>
      <rect x="54" y="216" width="152" height="8" fill="#2a8794" opacity=".17"/>
      <rect x="83" y="190" width="4" height="4" fill="#b8fbff" opacity=".62"/>
      <rect x="166" y="196" width="3" height="3" fill="#b8fbff" opacity=".55"/>
      <rect x="135" y="181" width="2" height="2" fill="#b8fbff" opacity=".48"/>
    </g>`;
  }

  function waxShine() {
    return `<g opacity=".24" aria-hidden="true">
      <path d="M73 92 L188 58 L195 69 L80 104 Z" fill="url(#cfWax)"/>
      <path d="M166 72 l8 -12 4 16 -12 -4 Z" fill="#fff0ba" opacity=".8"/>
    </g>`;
  }

  function sparkles(item) {
    const glow = item.waxed || item.special || stateVal(item, "lit") === "true";
    if (!glow) return "";
    return `<g opacity=".8" aria-hidden="true">
      <path d="M58 82 l3 -9 3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 Z" fill="#ffe8ad" opacity=".48"/>
      <path d="M204 130 l2 -7 2 7 7 2 -7 2 -2 7 -2 -7 -7 -2 Z" fill="#ffe8ad" opacity=".38"/>
      <path d="M195 78 l2 -5 2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 Z" fill="#fff2c7" opacity=".34"/>
    </g>`;
  }

  /* ------------------------------------------------------------------------
     方块图形
     ------------------------------------------------------------------------ */

  function artCube(item, p) {
    let detail = "";
    if (item.icon === "cut") {
      detail = `<g opacity=".28" stroke="${p.edge}" stroke-width="1.6">
        <line x1="130" y1="38" x2="130" y2="122"/>
        <line x1="56" y1="95" x2="130" y2="121"/>
        <line x1="204" y1="95" x2="130" y2="121"/>
        <line x1="130" y1="122" x2="130" y2="208"/>
        <line x1="55" y1="118" x2="130" y2="155"/>
        <line x1="205" y1="118" x2="130" y2="155"/>
      </g>`;
    } else if (item.icon === "chiseled") {
      detail = `<g opacity=".42">
        <polygon points="130,108 166,126 130,144 94,126" fill="none" stroke="${p.edge}" stroke-width="2"/>
        <polygon points="130,118 151,126 130,134 109,126" fill="none" stroke="${p.hi}" stroke-width="1.2" opacity=".68"/>
        <rect x="126" y="126" width="8" height="8" fill="${p.edge}" opacity=".45" transform="rotate(45 130 130)"/>
        <line x1="78" y1="136" x2="78" y2="184" stroke="${p.edge}" stroke-width="1.4" opacity=".45"/>
        <line x1="182" y1="136" x2="182" y2="184" stroke="${p.edge}" stroke-width="1.4" opacity=".45"/>
      </g>`;
    } else if (item.icon === "custom") {
      detail = `<path d="M130 96 l8 21 22 2 -17 14 5 22 -18 -11 -18 11 5 -22 -17 -14 22 -2 Z" fill="${p.hi}" opacity=".72" stroke="${p.edge}" stroke-width="1.2"/>`;
    }
    return isoBox({ p, shadow: true, detail }) + (item.icon === "custom" ? "" : "");
  }

  function artSlab(item, p) {
    const type = stateVal(item, "type");
    if (type === "double") return isoBox({ p, shadow: true, y: 38, sh: 86 });
    const shift = type === "top" ? -43 : 0;
    const detail = `<g opacity=".24" stroke="${p.edge}" stroke-width="1.5">
      <line x1="57" y1="101" x2="130" y2="145"/>
      <line x1="203" y1="101" x2="130" y2="145"/>
    </g>`;
    return `<g transform="translate(0 ${shift})">
      ${isoBox({ p, y: 88, hw: 82, hh: 42, sh: 36, shadow: true, detail })}
    </g>
    ${type === "top" ? `<g opacity=".25" stroke="${p.edge}" stroke-width="1.5">
      <line x1="86" y1="181" x2="86" y2="198"/>
      <line x1="174" y1="181" x2="174" y2="198"/>
    </g>` : ""}`;
  }

  function artStairs(item, p) {
    const half = stateVal(item, "half");
    const shape = stateVal(item, "shape") || "straight";
    const shift =
      shape === "outer_left" ? -20 : shape === "outer_right" ? 20 : shape === "inner_left" ? -8 : shape === "inner_right" ? 8 : 0;
    const detail = `<g opacity=".28" stroke="${p.edge}" stroke-width="1.4">
      <line x1="${130 - 50}" y1="143" x2="${130 + 50}" y2="188"/>
      <line x1="${130 + shift - 34}" y1="102" x2="${130 + shift + 34}" y2="138"/>
      <line x1="${130 + shift * 1.6 - 20}" y1="67" x2="${130 + shift * 1.6 + 20}" y2="89"/>
    </g>`;
    const body = `
      ${isoBox({ p, cx: 130, y: 120, hw: 82, hh: 42, sh: 24, shadow: true })}
      ${isoBox({ p, cx: 130 + shift, y: 82, hw: 61, hh: 31, sh: 28, shadow: false, detail })}
      ${isoBox({ p, cx: 130 + shift * 1.6, y: 48, hw: 40, hh: 20, sh: 32, shadow: false })}
      <polyline points="${130 - 61 + shift},${113} ${130 + shift},${144} ${130 + 61 + shift},${113}" fill="none" stroke="${p.edge}" stroke-width="1.3" opacity=".55"/>
      <polyline points="${130 - 40 + shift * 1.6},${68} ${130 + shift * 1.6},${88} ${130 + 40 + shift * 1.6},${68}" fill="none" stroke="${p.edge}" stroke-width="1.3" opacity=".55"/>
    `;
    if (half === "top") {
      return `<g transform="translate(0 24) rotate(180 130 130)">${body}</g>`;
    }
    return body;
  }

  function artGrate(item, p) {
    const f = facePoints(130, 38, 82, 42, 86);
    return `<g class="voxel">
      <ellipse cx="130" cy="216" rx="78" ry="12" fill="#000" opacity=".28"/>
      <polygon points="${f.left}" fill="${p.left}"/>
      <polygon points="${f.right}" fill="${p.right}"/>
      <polygon points="${f.top}" fill="${p.top}"/>
      <polygon points="${f.left}" fill="url(#cfHoles)" opacity=".84"/>
      <polygon points="${f.right}" fill="url(#cfHoles)" opacity=".84"/>
      <polygon points="${f.top}" fill="url(#cfHoles)" opacity=".84"/>
      <polyline points="${f.left}" fill="none" stroke="${p.edge}" stroke-width="2" opacity=".9"/>
      <polyline points="${f.right}" fill="none" stroke="${p.edge}" stroke-width="2" opacity=".9"/>
      <polyline points="${f.top}" fill="none" stroke="${p.edge}" stroke-width="2" opacity=".9"/>
      <polyline points="${130},${38} ${130},${122} ${130},${208}" fill="none" stroke="${p.edge}" stroke-width="1.2" opacity=".5"/>
      <line x1="48" y1="82" x2="130" y2="122" stroke="${p.hi}" stroke-width="1.2" opacity=".3"/>
    </g>`;
  }

  function artBars(item, p) {
    const conn = (item.stateValues.connections && item.stateValues.connections.connections) || {};
    const bars = [78, 121, 164];
    const vertical = bars
      .map(
        (x, i) => `<g>
          <rect x="${x}" y="63" width="10" height="139" fill="${p.left}"/>
          <rect x="${x + 2}" y="63" width="4" height="139" fill="${p.top}"/>
          <rect x="${x + 7}" y="63" width="2" height="139" fill="${p.edge}" opacity=".55"/>
          <rect x="${x - 3}" y="58" width="16" height="7" fill="${p.right}" stroke="${p.edge}" stroke-width="1"/>
          <rect x="${x - 3}" y="199" width="16" height="7" fill="${p.left}" stroke="${p.edge}" stroke-width="1"/>
          ${i === 1 ? `<rect x="${x + 2}" y="92" width="6" height="6" fill="${p.hi}" opacity=".5"/>` : ""}
        </g>`
      )
      .join("");
    const connectionLines = [];
    if (conn.east) {
      connectionLines.push(`<rect x="179" y="126" width="58" height="8" fill="${p.left}"/><rect x="179" y="126" width="58" height="3" fill="${p.top}"/>`);
    }
    if (conn.west) {
      connectionLines.push(`<rect x="24" y="126" width="52" height="8" fill="${p.left}"/><rect x="24" y="126" width="52" height="3" fill="${p.top}"/>`);
    }
    if (conn.north) {
      connectionLines.push(`<rect x="116" y="34" width="8" height="36" fill="${p.left}"/><rect x="116" y="34" width="3" height="36" fill="${p.top}"/>`);
    }
    if (conn.south) {
      connectionLines.push(`<rect x="136" y="195" width="8" height="32" fill="${p.left}"/><rect x="136" y="195" width="3" height="32" fill="${p.top}"/>`);
    }
    return `<g>
      <ellipse cx="130" cy="223" rx="73" ry="11" fill="#000" opacity=".26"/>
      ${connectionLines.join("")}
      ${vertical}
      <rect x="70" y="78" width="112" height="5" fill="${p.right}" stroke="${p.edge}" stroke-width="1"/>
      <rect x="70" y="188" width="112" height="5" fill="${p.left}" stroke="${p.edge}" stroke-width="1"/>
    </g>`;
  }

  function artChain(item, p) {
    const axis = stateVal(item, "axis") || "y";
    let transform = "";
    if (axis === "x") transform = "rotate(90 130 130)";
    if (axis === "z") transform = "rotate(45 130 130)";
    const links = [];
    for (let i = 0; i < 5; i += 1) {
      const y = 54 + i * 36;
      if (i % 2 === 0) {
        links.push(`<rect x="${122}" y="${y}" width="16" height="32" rx="7" fill="none" stroke="${p.left}" stroke-width="7"/>
          <rect x="${122}" y="${y}" width="16" height="32" rx="7" fill="none" stroke="${p.top}" stroke-width="3"/>
          <rect x="${126}" y="${y + 3}" width="3" height="7" fill="${p.hi}" opacity=".4"/>`);
      } else {
        links.push(`<rect x="${114}" y="${y}" width="32" height="30" rx="10" fill="none" stroke="${p.left}" stroke-width="7"/>
          <rect x="${114}" y="${y}" width="32" height="30" rx="10" fill="none" stroke="${p.top}" stroke-width="3"/>
          <rect x="${119}" y="${y + 4}" width="7" height="3" fill="${p.hi}" opacity=".36"/>`);
      }
    }
    return `<g transform="${transform}">
      <ellipse cx="130" cy="232" rx="35" ry="8" fill="#000" opacity=".22"/>
      <rect x="127" y="24" width="6" height="22" fill="${p.left}"/>
      <circle cx="130" cy="23" r="7" fill="none" stroke="${p.top}" stroke-width="4"/>
      ${links.join("")}
    </g>`;
  }

  function artLantern(item, p) {
    const hanging = stateVal(item, "hanging") === "true";
    return `<g>
      ${hanging
        ? `<rect x="127" y="18" width="6" height="54" fill="${p.left}"/>
           <rect x="128" y="18" width="2" height="54" fill="${p.top}" opacity=".7"/>
           <rect x="119" y="54" width="22" height="8" fill="${p.right}" stroke="${p.edge}" stroke-width="1"/>`
        : `<ellipse cx="130" cy="224" rx="48" ry="10" fill="#000" opacity=".3"/>`}
      <circle cx="130" cy="118" r="47" fill="url(#cfGlow)" opacity=".66" filter="url(#cfSoftGlow)"/>
      <path d="M99 88 h62 l-7 15 h-48 Z" fill="${p.right}" stroke="${p.edge}" stroke-width="1.6"/>
      <path d="M108 103 h44 l9 69 h-62 Z" fill="${p.left}" stroke="${p.edge}" stroke-width="1.8"/>
      <path d="M113 109 h34 l7 56 h-48 Z" fill="#132b29" stroke="${p.edge}" stroke-width="1"/>
      <path d="M130 119 c-11 15 -7 32 0 40 c8 -9 11 -25 0 -40 Z" fill="#7ce69c" opacity=".95"/>
      <path d="M130 130 c-5 8 -4 17 0 22 c5 -6 6 -14 0 -22 Z" fill="#d8ffe4"/>
      <path d="M105 103 v68 M155 103 v68 M112 172 h36" stroke="${p.top}" stroke-width="3" opacity=".86"/>
      <path d="M102 170 h56 l-9 14 h-38 Z" fill="${p.right}" stroke="${p.edge}" stroke-width="1.6"/>
      <path d="M113 184 h34 l-5 9 h-24 Z" fill="${p.left}" stroke="${p.edge}" stroke-width="1.2"/>
      <rect x="123" y="173" width="14" height="4" fill="${p.hi}" opacity=".22"/>
    </g>`;
  }

  function artBulb(item, p) {
    const lit = stateVal(item, "lit") === "true";
    const powered = stateVal(item, "powered") === "true";
    const glow = lit
      ? `<circle cx="158" cy="142" r="40" fill="url(#cfGlow)" opacity=".9" filter="url(#cfSoftGlow)"/>
         <g opacity=".5" stroke="${p.hi}" stroke-width="2">
           <line x1="158" y1="92" x2="158" y2="78"/>
           <line x1="194" y1="108" x2="206" y2="101"/>
           <line x1="194" y1="172" x2="206" y2="179"/>
           <line x1="158" y1="190" x2="158" y2="203"/>
         </g>`
      : "";
    return `<g>
      ${isoBox({ p, shadow: true })}
      ${glow}
      <polygon points="130,74 166,92 130,110 94,92" fill="none" stroke="${p.edge}" stroke-width="2.4" opacity=".88"/>
      <polygon points="130,82 155,94 130,106 105,94" fill="${lit ? p.hi : p.left}" opacity="${lit ? ".86" : ".5"}" stroke="${p.edge}" stroke-width="1"/>
      <g transform="translate(158 142)">
        <circle r="26" fill="${lit ? p.hi : p.left}" opacity="${lit ? ".96" : ".72"}" stroke="${p.edge}" stroke-width="2"/>
        <path d="M0 -17 L14 0 L0 17 L-14 0 Z" fill="${lit ? p.glowSoft : p.right}" opacity=".92"/>
        <path d="M0 -9 L7 0 L0 9 L-7 0 Z" fill="${lit ? "#ffffff" : p.top}" opacity=".86"/>
      </g>
      <g opacity=".42" stroke="${p.edge}" stroke-width="1.5">
        <line x1="83" y1="142" x2="83" y2="188"/>
        <line x1="95" y1="148" x2="95" y2="194"/>
        <line x1="182" y1="148" x2="182" y2="192"/>
      </g>
      ${powered ? `<circle cx="130" cy="124" r="5" fill="#e85f4d" stroke="#3c0c08" stroke-width="1.5"/><circle cx="130" cy="124" r="10" fill="#e85f4d" opacity=".2" filter="url(#cfTinyGlow)"/>` : ""}
    </g>`;
  }

  function artDoor(item, p) {
    const open = stateVal(item, "open") === "true";
    const half = stateVal(item, "half") || "lower";
    const hinge = stateVal(item, "hinge") || "left";
    const powered = stateVal(item, "powered") === "true";
    const knobX = hinge === "left" ? 160 : 100;
    const doorTransform = open ? "translate(24 0) skewY(-3) scale(.72 1)" : "";
    const highlight =
      half === "upper"
        ? `<polygon points="82,70 130,45 178,70 178,134 130,159 82,134" fill="${p.hi}" opacity=".08"/>`
        : `<polygon points="82,134 130,159 178,134 178,200 130,225 82,200" fill="${p.hi}" opacity=".1"/>`;
    return `<g>
      <ellipse cx="132" cy="230" rx="72" ry="10" fill="#000" opacity=".26"/>
      ${open ? `<polygon points="60,84 92,68 92,198 60,212" fill="${p.left}" opacity=".45" stroke="${p.edge}" stroke-width="1.2"/>` : ""}
      <g transform="${doorTransform}">
        <polygon points="75,76 130,47 185,76 185,204 130,233 75,204" fill="${p.edge}" opacity=".82"/>
        <polygon points="82,70 130,45 178,70 178,200 130,225 82,200" fill="${p.left}"/>
        <polygon points="86,74 130,51 174,74 174,195 130,218 86,195" fill="${p.right}"/>
        ${highlight}
        <g fill="none" stroke="${p.edge}" stroke-width="1.7" opacity=".7">
          <polygon points="99,91 130,75 161,91 161,123 130,140 99,123"/>
          <polygon points="99,150 130,134 161,150 161,183 130,200 99,183"/>
        </g>
        <g opacity=".3" stroke="${p.hi}" stroke-width="1.2">
          <line x1="89" y1="80" x2="89" y2="189"/>
          <line x1="171" y1="80" x2="171" y2="189"/>
        </g>
        <circle cx="${knobX}" cy="146" r="5" fill="${p.hi}" stroke="${p.edge}" stroke-width="1.4"/>
        <circle cx="${knobX}" cy="146" r="2" fill="${p.edge}" opacity=".55"/>
        ${hinge === "left"
          ? `<rect x="88" y="106" width="7" height="18" fill="${p.top}" stroke="${p.edge}" stroke-width="1"/><rect x="88" y="168" width="7" height="18" fill="${p.top}" stroke="${p.edge}" stroke-width="1"/>`
          : `<rect x="165" y="106" width="7" height="18" fill="${p.top}" stroke="${p.edge}" stroke-width="1"/><rect x="165" y="168" width="7" height="18" fill="${p.top}" stroke="${p.edge}" stroke-width="1"/>`}
        ${powered ? `<circle cx="130" cy="207" r="5" fill="#e85f4d" stroke="#3c0c08" stroke-width="1.4"/><circle cx="130" cy="207" r="12" fill="#e85f4d" opacity=".18" filter="url(#cfTinyGlow)"/>` : ""}
      </g>
    </g>`;
  }

  function artTrapdoor(item, p) {
    const open = stateVal(item, "open") === "true";
    const half = stateVal(item, "half") || "bottom";
    const powered = stateVal(item, "powered") === "true";
    const yShift = half === "top" ? -35 : 0;
    let panel;
    if (open) {
      panel = `<g>
        <polygon points="88,82 130,60 172,82 172,198 130,220 88,198" fill="${p.left}" stroke="${p.edge}" stroke-width="1.6"/>
        <polygon points="94,87 130,68 166,87 166,193 130,212 94,193" fill="${p.right}"/>
        <path d="M94 112 h72 M94 142 h72 M94 172 h72" stroke="${p.edge}" stroke-width="1.6" opacity=".58"/>
        <rect x="102" y="128" width="10" height="5" fill="${p.hi}" opacity=".5"/>
        <rect x="148" y="128" width="10" height="5" fill="${p.hi}" opacity=".5"/>
        <circle cx="122" cy="113" r="5" fill="${p.top}" stroke="${p.edge}" stroke-width="1.2"/>
      </g>`;
    } else {
      panel = `<g>
        <polygon points="56,139 130,103 204,139 130,175" fill="${p.top}" stroke="${p.edge}" stroke-width="1.8"/>
        <polygon points="56,139 130,175 130,188 56,152" fill="${p.left}" stroke="${p.edge}" stroke-width="1.4"/>
        <polygon points="204,139 130,175 130,188 204,152" fill="${p.right}" stroke="${p.edge}" stroke-width="1.4"/>
        <path d="M76 140 L130 167 L184 140 M92 132 L146 159 M168 132 L114 159" fill="none" stroke="${p.edge}" stroke-width="1.4" opacity=".52"/>
        <rect x="119" y="135" width="22" height="6" fill="${p.hi}" opacity=".3" transform="skewX(-26)"/>
      </g>`;
    }
    return `<g transform="translate(0 ${yShift})">
      ${open ? "" : `<ellipse cx="130" cy="201" rx="70" ry="9" fill="#000" opacity=".26"/>`}
      ${panel}
      ${powered ? `<circle cx="130" cy="${open ? 202 : 169}" r="5" fill="#e85f4d" stroke="#3c0c08" stroke-width="1.4"/>` : ""}
    </g>`;
  }

  function artChest(item, p) {
    const type = stateVal(item, "type") || "single";
    const halfFade = type === "left" ? "0.55" : "1";
    return `<g>
      <ellipse cx="130" cy="221" rx="79" ry="12" fill="#000" opacity=".3"/>
      ${isoBox({ p, cx: 130, y: 100, hw: 78, hh: 38, sh: 62, shadow: false })}
      <g opacity="${type === "left" ? "0.55" : "1"}">
        ${isoBox({ p, cx: 130, y: 66, hw: 78, hh: 38, sh: 26, shadow: false })}
      </g>
      <line x1="52" y1="138" x2="130" y2="176" stroke="${p.edge}" stroke-width="2" opacity=".75"/>
      <line x1="208" y1="138" x2="130" y2="176" stroke="${p.edge}" stroke-width="2" opacity=".75"/>
      <g stroke="${p.edge}" stroke-width="1.5" opacity=".55">
        <line x1="78" y1="112" x2="78" y2="186"/>
        <line x1="182" y1="112" x2="182" y2="186"/>
        <line x1="104" y1="108" x2="104" y2="196"/>
        <line x1="156" y1="108" x2="156" y2="196"/>
      </g>
      <g>
        <rect x="122" y="154" width="18" height="24" fill="${p.top}" stroke="${p.edge}" stroke-width="1.6"/>
        <rect x="126" y="159" width="10" height="7" fill="${p.edge}" opacity=".7"/>
        <circle cx="131" cy="170" r="2.4" fill="${p.edge}"/>
      </g>
      ${type !== "single" ? `<g opacity=".8"><line x1="${type === "left" ? "158" : "102"}" y1="92" x2="${type === "left" ? "158" : "102"}" y2="196" stroke="${p.hi}" stroke-width="1.5" stroke-dasharray="5 5"/></g>` : ""}
      <g opacity="${halfFade}" fill="${p.hi}">
        <rect x="74" y="122" width="4" height="4"/>
        <rect x="182" y="122" width="4" height="4"/>
        <rect x="74" y="168" width="4" height="4"/>
        <rect x="182" y="168" width="4" height="4"/>
      </g>
    </g>`;
  }

  function artStatue(item, p) {
    const pose = stateVal(item, "pose") || "standing";
    const sitting = pose === "sitting";
    const running = pose === "running";
    const star = pose === "star";
    const bodyY = sitting ? 106 : 80;
    const headY = sitting ? 58 : 34;
    const bodySh = sitting ? 40 : 48;
    const legY = bodyY + 58;
    const armAngle = running ? -16 : star ? 78 : 0;

    const legs = `
      <g transform="translate(${sitting ? 0 : running ? 8 : 0} ${sitting ? 42 : 0})">
        ${isoBox({ p, cx: 116, y: legY, hw: 17, hh: 9, sh: 38, shadow: false })}
        ${isoBox({ p, cx: 144, y: legY, hw: 17, hh: 9, sh: 38, shadow: false })}
      </g>`;
    const arms = `
      <g transform="rotate(${armAngle} 96 ${bodyY + 18})">
        ${isoBox({ p, cx: 92, y: bodyY + 8, hw: 12, hh: 7, sh: 45, shadow: false })}
      </g>
      <g transform="rotate(${-armAngle} 164 ${bodyY + 18})">
        ${isoBox({ p, cx: 168, y: bodyY + 8, hw: 12, hh: 7, sh: 45, shadow: false })}
      </g>`;
    return `<g>
      <ellipse cx="130" cy="228" rx="62" ry="11" fill="#000" opacity=".28"/>
      ${legs}
      ${arms}
      ${isoBox({ p, cx: 130, y: bodyY + 18, hw: 34, hh: 17, sh: bodySh, shadow: false })}
      ${isoBox({ p, cx: 130, y: headY, hw: 25, hh: 13, sh: 30, shadow: false })}
      <g fill="${p.edge}" opacity=".9">
        <rect x="137" y="${headY + 33}" width="5" height="5"/>
        <rect x="149" y="${headY + 37}" width="5" height="5"/>
      </g>
      <rect x="127" y="${headY + 47}" width="16" height="3" fill="${p.edge}" opacity=".55"/>
      <g stroke="${p.edge}" stroke-width="1.3" opacity=".4">
        <line x1="103" y1="${bodyY + 34}" x2="157" y2="${bodyY + 60}"/>
        <line x1="103" y1="${bodyY + 58}" x2="157" y2="${bodyY + 84}"/>
      </g>
      ${star ? `<g opacity=".65" fill="${p.hi}"><rect x="42" y="${bodyY + 2}" width="5" height="5"/><rect x="214" y="${bodyY + 2}" width="5" height="5"/></g>` : ""}
    </g>`;
  }

  function artRod(item, p) {
    const facing = stateVal(item, "facing") || "up";
    const powered = stateVal(item, "powered") === "true";
    const angles = { up: 0, down: 180, north: -22, south: 22, east: 38, west: -38 };
    const angle = angles[facing] || 0;
    return `<g>
      <ellipse cx="130" cy="218" rx="52" ry="10" fill="#000" opacity=".28"/>
      ${isoBox({ p, cx: 130, y: 172, hw: 53, hh: 27, sh: 17, shadow: false })}
      <g transform="rotate(${angle} 130 181)">
        <rect x="126" y="55" width="8" height="122" fill="${p.left}"/>
        <rect x="128" y="55" width="3" height="122" fill="${p.top}"/>
        <circle cx="130" cy="51" r="9" fill="${p.right}" stroke="${p.edge}" stroke-width="1.5"/>
        <circle cx="130" cy="51" r="4" fill="${powered ? "#fff4d2" : p.hi}" opacity=".78"/>
        <path d="M146 50 l-9 16 h7 l-7 17 17 -21 h-8 l6 -12 Z" fill="${powered ? "#fff3c9" : p.hi}" opacity=".9"/>
        ${powered ? `<circle cx="130" cy="51" r="26" fill="url(#cfGlow)" opacity=".75" filter="url(#cfSoftGlow)"/>` : ""}
      </g>
    </g>`;
  }

  function artTorch(item, p) {
    return `<g>
      <ellipse cx="130" cy="226" rx="32" ry="8" fill="#000" opacity=".28"/>
      <rect x="123" y="104" width="14" height="112" fill="${p.left}"/>
      <rect x="126" y="104" width="5" height="112" fill="${p.top}"/>
      <rect x="118" y="103" width="24" height="12" fill="${p.right}" stroke="${p.edge}" stroke-width="1.2"/>
      <circle cx="130" cy="89" r="39" fill="url(#cfGlow)" opacity=".8" filter="url(#cfSoftGlow)"/>
      <path d="M130 47 c-18 25 -13 49 0 61 c14 -14 18 -39 0 -61 Z" fill="${p.right}" stroke="${p.edge}" stroke-width="1.2"/>
      <path d="M130 61 c-9 16 -6 30 0 38 c7 -9 9 -23 0 -38 Z" fill="${p.hi}"/>
      <path d="M130 75 c-3 7 -2 14 0 18 c3 -5 4 -12 0 -18 Z" fill="#f5ffe8"/>
      <g fill="${p.hi}" opacity=".6">
        <rect x="104" y="70" width="3" height="3"/>
        <rect x="154" y="82" width="2" height="2"/>
        <rect x="111" y="112" width="2" height="2"/>
      </g>
    </g>`;
  }

  /* ------------------------------------------------------------------------
     入口
     ------------------------------------------------------------------------ */

  function bodyFor(item, p) {
    if (item.icon === "slab") return artSlab(item, p);
    if (item.icon === "stairs") return artStairs(item, p);
    if (item.icon === "grate") return artGrate(item, p);
    if (item.icon === "bars") return artBars(item, p);
    if (item.icon === "chain") return artChain(item, p);
    if (item.icon === "lantern") return artLantern(item, p);
    if (item.icon === "bulb") return artBulb(item, p);
    if (item.icon === "door") return artDoor(item, p);
    if (item.icon === "trapdoor") return artTrapdoor(item, p);
    if (item.icon === "chest") return artChest(item, p);
    if (item.icon === "statue") return artStatue(item, p);
    if (item.icon === "rod") return artRod(item, p);
    if (item.icon === "torch") return artTorch(item, p);
    return artCube(item, p);
  }

  function render(item) {
    const p = paletteFor(item);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260" role="img" aria-label="${esc(item.name)}">
      ${defs(p)}
      ${bodyFor(item, p)}
      ${item.waterlogged ? waterOverlay() : ""}
      ${item.waxed ? waxShine() : ""}
      ${sparkles(item)}
    </svg>`;
  }

  window.CopperArt = { render };
})();
