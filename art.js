/* 离线插画生成器:用内联 SVG 画出各类景观,不依赖任何网络图片 */
(function () {
  'use strict';
  let uid = 0;

  const M = {
    mountain: p => `<circle cx="250" cy="45" r="18" fill="#fff" opacity=".85"/><path d="M40 150 L150 40 L260 150Z" fill="#5b6b8c"/><path d="M118 72 L150 40 L182 72 L166 66 L150 78 L134 66Z" fill="#fff"/><rect y="150" width="320" height="30" fill="${p.a}" opacity=".55"/>`,

    torii: p => `<rect y="140" width="320" height="40" fill="#2f3b2c"/><circle cx="262" cy="40" r="16" fill="#fff" opacity=".8"/><g fill="#d6382c"><rect x="105" y="60" width="14" height="95"/><rect x="201" y="60" width="14" height="95"/><path d="M85 58 Q160 42 235 58 L235 70 Q160 56 85 70Z"/><rect x="100" y="82" width="120" height="9"/></g>`,

    pagoda: p => `<rect y="150" width="320" height="30" fill="#33423a"/><rect x="130" y="70" width="60" height="60" fill="#e8d9b8" opacity=".45"/><g fill="#8c3b2f"><rect x="146" y="40" width="28" height="8"/><path d="M120 62 Q160 46 200 62 L192 70 L128 70Z"/><path d="M112 88 Q160 70 208 88 L198 98 L122 98Z"/><path d="M102 118 Q160 98 218 118 L206 130 L114 130Z"/></g><rect x="118" y="130" width="84" height="20" fill="#6b4a3a"/>`,

    sakura: p => `<rect y="150" width="320" height="30" fill="#7aa36a" opacity=".6"/><path d="M160 160 Q150 110 165 80 M160 120 Q190 100 205 80 M158 110 Q130 95 115 78" stroke="#5a4033" stroke-width="9" fill="none" stroke-linecap="round"/><g fill="#f6b7cd"><circle cx="115" cy="70" r="30"/><circle cx="165" cy="55" r="36"/><circle cx="210" cy="72" r="30"/><circle cx="140" cy="88" r="24"/><circle cx="190" cy="92" r="24"/></g><g fill="#fbd5e2"><circle cx="150" cy="50" r="12"/><circle cx="205" cy="68" r="10"/><circle cx="120" cy="66" r="9"/></g>`,

    skyline: p => {
      let s = '<rect y="150" width="320" height="30" fill="#2a2f3d"/>';
      [60, 95, 70, 120, 85, 105, 65, 90, 75].forEach((h, i) => {
        const x = 10 + i * 34;
        s += `<rect x="${x}" y="${150 - h}" width="28" height="${h}" fill="#3b4256"/>`;
        for (let y = 150 - h + 8; y < 142; y += 14) {
          s += `<rect x="${x + 5}" y="${y}" width="5" height="6" fill="#ffd36b" opacity=".85"/><rect x="${x + 16}" y="${y}" width="5" height="6" fill="#ffd36b" opacity=".6"/>`;
        }
      });
      return s;
    },

    tower: p => `<rect y="150" width="320" height="30" fill="#6d7f5a" opacity=".7"/><path d="M160 30 L172 80 L190 150 L170 150 L160 110 L150 150 L130 150 L148 80Z" fill="#4a4036"/><rect x="145" y="82" width="30" height="5" fill="#4a4036"/><rect x="138" y="112" width="44" height="5" fill="#4a4036"/><path d="M148 150 Q160 125 172 150" fill="${p.s2}"/>`,

    lantern: p => {
      let s = '<path d="M0 30 Q160 60 320 30" stroke="#554" stroke-width="2" fill="none"/>';
      [30, 80, 130, 180, 230, 280].forEach((x, i) => {
        const y = 36 + (i % 2) * 10;
        s += `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" stroke="#554"/><ellipse cx="${x}" cy="${y + 22}" rx="14" ry="18" fill="#d6382c"/><rect x="${x - 5}" y="${y + 4}" width="10" height="4" fill="#e9b949"/><rect x="${x - 5}" y="${y + 38}" width="10" height="4" fill="#e9b949"/>`;
      });
      return s + '<rect y="150" width="320" height="30" fill="#2a2326"/>';
    },

    spire: p => `<rect y="150" width="320" height="30" fill="#2f5d4a" opacity=".7"/><g fill="#e9b949"><path d="M160 24 L172 60 L148 60Z"/><path d="M160 50 L184 100 L136 100Z"/><path d="M160 90 L198 150 L122 150Z"/><path d="M92 100 L102 124 L82 124Z"/><path d="M92 118 L112 150 L72 150Z"/><path d="M228 100 L238 124 L218 124Z"/><path d="M228 118 L248 150 L208 150Z"/></g><rect x="150" y="120" width="20" height="30" fill="#b9382c"/>`,

    terrace: p => `<path d="M0 90 Q80 60 160 80 T320 70 V180 H0Z" fill="#5f9a4f"/><path d="M0 110 Q90 85 170 100 T320 95 V180 H0Z" fill="#78b25f"/><path d="M0 132 Q100 112 180 122 T320 118 V180 H0Z" fill="#92c76d"/><path d="M0 154 Q110 138 190 146 T320 142 V180 H0Z" fill="#b4dc82"/><rect x="236" y="46" width="5" height="28" fill="#6b4a3a"/><path d="M238 46 q-22 4 -28 -10 M238 46 q22 4 28 -10 M238 46 q-6 -18 -22 -18 M238 46 q6 -18 22 -18" stroke="#2f7a3a" stroke-width="5" fill="none"/>`,

    dome: p => `<rect y="150" width="320" height="30" fill="#e9dcc2"/><circle cx="270" cy="36" r="10" fill="#fff8d6"/><g fill="#f7f2e6"><path d="M110 150 V110 A50 50 0 0 1 210 110 V150Z"/><rect x="60" y="50" width="12" height="100"/><rect x="248" y="50" width="12" height="100"/><path d="M60 50 L66 30 L72 50Z"/><path d="M248 50 L254 30 L260 50Z"/><rect x="156" y="42" width="8" height="18"/></g><path d="M156 42 L160 28 L164 42Z" fill="#e9b949"/><g fill="${p.a}" opacity=".55"><rect x="130" y="118" width="12" height="32" rx="6"/><rect x="178" y="118" width="12" height="32" rx="6"/></g>`,

    dunes: p => `<circle cx="250" cy="48" r="22" fill="#ffe29a"/><path d="M0 120 Q80 70 170 112 T320 100 V180 H0Z" fill="#e4a35c"/><path d="M0 150 Q100 110 200 144 T320 132 V180 H0Z" fill="#cf8a45"/><path d="M0 172 Q120 150 220 168 T320 160 V180 H0Z" fill="#b87335"/>`,

    pyramid: p => `<circle cx="255" cy="42" r="20" fill="#fff0b0"/><rect y="140" width="320" height="40" fill="#e0b46a"/><path d="M70 148 L140 66 L210 148Z" fill="#d9a14d"/><path d="M140 66 L210 148 L160 148Z" fill="#b9803a"/><path d="M175 148 L222 96 L269 148Z" fill="#c98f40"/><path d="M222 96 L269 148 L232 148Z" fill="#a8742f"/><path d="M20 148 L52 116 L84 148Z" fill="#cf9a48"/>`,

    andes: p => `<path d="M0 150 L70 60 L120 110 L170 40 L240 120 L290 80 L320 120 V180 H0Z" fill="#587a5a"/><ellipse cx="60" cy="40" rx="40" ry="9" fill="#fff" opacity=".6"/><g><path d="M60 180 L90 150 L230 150 L260 180Z" fill="#9bb66f"/><path d="M80 150 L100 128 L220 128 L240 150Z" fill="#aac57c"/><path d="M100 128 L116 108 L204 108 L220 128Z" fill="#bcd48d"/></g><g fill="#d9d2bd"><rect x="130" y="92" width="22" height="16"/><rect x="160" y="96" width="26" height="12"/><rect x="118" y="112" width="14" height="14"/></g>`,

    balloon: p => {
      let s = '<path d="M0 150 Q60 110 120 140 T240 130 T320 150 V180 H0Z" fill="#b58a63"/><path d="M0 165 Q80 140 160 160 T320 158 V180 H0Z" fill="#9b7050"/>';
      [[70, 60, '#e4572e'], [140, 40, '#f2b134'], [210, 70, '#3a9bc1'], [260, 34, '#7bc86c']].forEach(([x, y, c]) => {
        s += `<ellipse cx="${x}" cy="${y}" rx="17" ry="21" fill="${c}"/><path d="M${x - 8} ${y + 19} L${x - 5} ${y + 38} H${x + 5} L${x + 8} ${y + 19}Z" fill="#6b4a3a"/>`;
      });
      return s;
    },

    sails: p => `<rect y="148" width="320" height="32" fill="#2f7db1"/><rect x="60" y="140" width="200" height="12" fill="#d9d4c8"/><g fill="#fdfaf2" stroke="#d9d4c8"><path d="M70 140 Q80 70 140 62 Q122 100 128 140Z"/><path d="M130 140 Q138 86 182 80 Q166 108 170 140Z"/><path d="M172 140 Q184 98 222 96 Q210 116 212 140Z"/><path d="M200 140 Q214 108 252 112 Q242 124 244 140Z"/></g><path d="M0 162 Q40 156 80 162 T160 162 T240 162 T320 162" stroke="#fff" stroke-opacity=".5" fill="none"/>`,

    bridge: p => `<rect y="140" width="320" height="40" fill="#2f6f95"/><ellipse cx="60" cy="152" rx="70" ry="9" fill="#fff" opacity=".35"/><g fill="#c1432e"><rect x="80" y="40" width="9" height="110"/><rect x="231" y="40" width="9" height="110"/><rect x="0" y="118" width="320" height="7"/></g><path d="M0 108 Q40 118 84 44 Q160 130 236 44 Q280 118 320 108" stroke="#c1432e" stroke-width="3" fill="none"/><path d="M110 125 V96 M135 125 V110 M160 125 V114 M185 125 V110 M210 125 V96" stroke="#c1432e" fill="none"/>`,

    castle: p => `<rect y="150" width="320" height="30" fill="#5f7a4a"/><path d="M0 150 L60 120 L260 120 L320 150Z" fill="#6f6a60"/><g fill="#8a8479"><rect x="90" y="70" width="140" height="60"/><rect x="70" y="50" width="34" height="80"/><rect x="216" y="50" width="34" height="80"/><rect x="143" y="40" width="34" height="90"/></g><path d="M143 40 L160 18 L177 40Z" fill="#a24a3a"/><rect x="150" y="100" width="20" height="30" rx="10" fill="#3b3a36"/><g fill="#8a8479"><rect x="70" y="44" width="8" height="8"/><rect x="82" y="44" width="8" height="8"/><rect x="94" y="44" width="8" height="8"/><rect x="216" y="44" width="8" height="8"/><rect x="228" y="44" width="8" height="8"/><rect x="240" y="44" width="8" height="8"/></g>`,

    canyon: p => `<circle cx="260" cy="36" r="16" fill="#ffe7a8"/><path d="M0 100 H40 V80 H100 V96 H140 V70 H210 V92 H260 V84 H320 V180 H0Z" fill="#c9683b"/><path d="M0 125 H60 V108 H130 V122 H190 V104 H250 V120 H320 V180 H0Z" fill="#a9522f"/><path d="M0 152 H90 V140 H170 V150 H230 V138 H320 V180 H0Z" fill="#8a3f24"/>`,

    waterfall: p => `<rect y="120" width="320" height="60" fill="#2f7a5a"/><path d="M0 50 H110 V120 H0Z M210 50 H320 V120 H210Z" fill="#3f8a4f"/><g fill="#eaf6fb"><rect x="120" y="50" width="16" height="80"/><rect x="146" y="50" width="20" height="80"/><rect x="176" y="50" width="14" height="80"/></g><ellipse cx="160" cy="134" rx="60" ry="12" fill="#fff" opacity=".7"/><path d="M0 152 Q80 142 160 152 T320 152 V180 H0Z" fill="#3a8ec1"/>`,

    statue: p => `<path d="M0 150 L90 80 L160 120 L230 60 L320 140 V180 H0Z" fill="#3f7a4f"/><path d="M0 160 Q80 140 160 158 T320 152 V180 H0Z" fill="#2f78a8"/><g fill="#f1efe6"><rect x="154" y="34" width="12" height="46"/><rect x="118" y="44" width="84" height="9"/><circle cx="160" cy="28" r="8"/></g><rect x="140" y="80" width="40" height="14" fill="#cfc9b8"/>`,

    safari: p => `<circle cx="70" cy="60" r="30" fill="#f9c15a"/><rect y="130" width="320" height="50" fill="#c9a24a"/><path d="M0 130 Q100 118 200 130 T320 126 V140 H0Z" fill="#b8913a"/><rect x="214" y="70" width="6" height="62" fill="#4a3a2a"/><path d="M180 72 Q216 52 256 72 Q216 64 180 72Z" fill="#3d6b33" stroke="#3d6b33" stroke-width="7" stroke-linejoin="round"/><g fill="#2b2b2b"><ellipse cx="110" cy="140" rx="20" ry="9"/><rect x="94" y="140" width="4" height="16"/><rect x="124" y="140" width="4" height="16"/><rect x="124" y="118" width="5" height="26"/><circle cx="130" cy="116" r="5"/></g>`,

    boat: p => `<rect y="110" width="320" height="70" fill="#2f7fa3"/><g fill="#e4b189"><rect x="0" y="50" width="70" height="62"/><rect x="250" y="40" width="70" height="72"/></g><g fill="#bf5b3e"><rect x="0" y="44" width="70" height="8"/><rect x="250" y="34" width="70" height="8"/></g><path d="M100 128 Q160 150 230 124 L222 134 Q160 160 108 138Z" fill="#1d1d22"/><rect x="156" y="104" width="3" height="26" fill="#1d1d22"/><path d="M0 152 Q40 146 80 152 T160 152 T240 152 T320 152" stroke="#fff" stroke-opacity=".4" fill="none"/>`,

    colosseum: p => {
      let s = '<rect y="150" width="320" height="30" fill="#8aa06a" opacity=".6"/><path d="M40 150 V80 Q160 50 280 80 V150Z" fill="#d6b88a"/>';
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 8; i++) {
          s += `<path d="M${58 + i * 28} ${142 - r * 26} v-14 a8 8 0 0 1 16 0 v14z" fill="#8c6b43"/>`;
        }
      }
      return s;
    },

    clock: p => `<rect y="150" width="320" height="30" fill="#3b4a5a"/><g fill="#c7ac7a"><rect x="136" y="46" width="48" height="104"/><rect x="128" y="40" width="64" height="10"/></g><path d="M130 40 L160 6 L190 40Z" fill="#8a7a52"/><circle cx="160" cy="68" r="15" fill="#f6f1e1" stroke="#6b5a3a" stroke-width="3"/><path d="M160 68 V58 M160 68 L167 72" stroke="#222" stroke-width="2"/><g fill="#6b5a3a" opacity=".7"><rect x="146" y="96" width="6" height="22"/><rect x="168" y="96" width="6" height="22"/></g>`,

    palm: p => `<circle cx="70" cy="46" r="20" fill="#fff2b8"/><rect y="124" width="320" height="56" fill="#3aa6c9"/><path d="M0 150 Q60 130 130 152 T320 146 V180 H0Z" fill="#f2deb0"/><path d="M230 150 Q236 100 252 66" stroke="#7a5a3a" stroke-width="7" fill="none" stroke-linecap="round"/><g stroke="#2f8a4a" stroke-width="6" fill="none" stroke-linecap="round"><path d="M252 66 Q230 52 208 64M252 66 Q250 44 232 38M252 66 Q270 46 290 50M252 66 Q282 66 292 86"/></g><path d="M0 135 Q40 129 80 135 T160 135 T240 135 T320 135" stroke="#fff" stroke-opacity=".6" fill="none"/>`,

    houses: p => {
      let s = '<rect y="150" width="320" height="30" fill="#2f5a7a"/>';
      const c = ['#4a86b8', '#7fb0d6', '#a9ccea', '#5f9ccb', '#8fc0e3'];
      for (let i = 0; i < 8; i++) {
        const h = 40 + ((i * 37) % 50);
        s += `<rect x="${8 + i * 38}" y="${150 - h}" width="34" height="${h}" fill="${c[i % 5]}"/><rect x="${18 + i * 38}" y="${150 - h + 10}" width="10" height="14" fill="#173a55" opacity=".6"/>`;
      }
      return s;
    },

    reef: p => `<rect width="320" height="180" fill="#1f8fb5" opacity=".35"/><path d="M0 150 Q80 130 160 150 T320 146 V180 H0Z" fill="#e8d8a8"/><g fill="#ef6a5b"><circle cx="60" cy="140" r="14"/><circle cx="82" cy="148" r="11"/></g><g fill="#f2a43c"><rect x="130" y="110" width="8" height="36" rx="4"/><rect x="144" y="100" width="8" height="46" rx="4"/><rect x="158" y="116" width="8" height="30" rx="4"/></g><g fill="#ffd34d"><ellipse cx="230" cy="80" rx="14" ry="8"/><path d="M244 80 l12 -8 v16z"/></g><g fill="#fff"><ellipse cx="190" cy="60" rx="10" ry="6"/><path d="M200 60 l9 -6 v12z"/></g>`,

    hanok: p => `<rect y="150" width="320" height="30" fill="#b7a98a"/><path d="M60 70 Q160 40 260 70 Q240 66 232 76 H88 Q80 66 60 70Z" fill="#3b4a56"/><rect x="96" y="76" width="128" height="52" fill="#a8372c"/><rect x="96" y="76" width="128" height="8" fill="#2c6b5a"/><g fill="#e9d9a8"><rect x="112" y="92" width="18" height="36"/><rect x="151" y="92" width="18" height="36"/><rect x="190" y="92" width="18" height="36"/></g><rect x="80" y="128" width="160" height="10" fill="#8a8272"/><rect x="70" y="138" width="180" height="12" fill="#9a9282"/>`,

    market: p => {
      let s = '<rect y="140" width="320" height="40" fill="#3a3330"/>';
      const c = ['#d6532f', '#e9b949', '#3f8a4f', '#3a82c1', '#c1456f'];
      for (let i = 0; i < 5; i++) {
        const x = i * 62;
        s += `<path d="M${10 + x} 72 H${66 + x} L${72 + x} 92 H${4 + x}Z" fill="${c[i]}"/><rect x="${14 + x}" y="92" width="48" height="48" fill="#5a4a3e"/><circle cx="${30 + x}" cy="118" r="7" fill="${c[(i + 2) % 5]}"/><circle cx="${48 + x}" cy="120" r="6" fill="${c[(i + 3) % 5]}"/>`;
      }
      return s;
    },

    arch: p => `<rect y="150" width="320" height="30" fill="#9aa07a" opacity=".6"/><g fill="#d9cfb8"><rect x="50" y="60" width="50" height="90"/><rect x="220" y="60" width="50" height="90"/><rect x="100" y="48" width="120" height="30"/></g><path d="M118 150 V112 a42 42 0 0 1 84 0 V150Z" fill="#8c6b43"/><path d="M135 150 V118 a25 25 0 0 1 50 0 V150Z" fill="#2b2b33"/>`,

    cathedral: p => `<rect y="150" width="320" height="30" fill="#8a8f6a" opacity=".6"/><g fill="#d8c7a0"><rect x="60" y="60" width="26" height="90"/><rect x="104" y="40" width="26" height="110"/><rect x="148" y="30" width="26" height="120"/><rect x="192" y="40" width="26" height="110"/><rect x="236" y="60" width="26" height="90"/></g><g fill="#b59a66"><path d="M60 60 L73 36 L86 60Z"/><path d="M104 40 L117 12 L130 40Z"/><path d="M148 30 L161 2 L174 30Z"/><path d="M192 40 L205 12 L218 40Z"/><path d="M236 60 L249 36 L262 60Z"/></g>`,

    geyser: p => `<rect y="130" width="320" height="50" fill="#b9a77a"/><path d="M0 140 Q80 128 160 140 T320 136 V180 H0Z" fill="#8f9c7a"/><g fill="#fff" opacity=".85"><ellipse cx="160" cy="70" rx="14" ry="50"/><circle cx="150" cy="40" r="22"/><circle cx="172" cy="34" r="24"/><circle cx="162" cy="22" r="20"/></g><ellipse cx="160" cy="132" rx="46" ry="9" fill="#3aa6c9"/>`,

    stones: p => `<rect y="130" width="320" height="50" fill="#6f9a52"/><path d="M0 134 Q160 120 320 134 V180 H0Z" fill="#5b8a45"/><g fill="#8e8b84"><rect x="70" y="86" width="22" height="50"/><rect x="108" y="82" width="24" height="54"/><rect x="62" y="78" width="78" height="10"/><rect x="190" y="90" width="22" height="46"/><rect x="226" y="86" width="24" height="50"/><rect x="182" y="80" width="76" height="10"/><rect x="150" y="100" width="16" height="36"/></g>`
  };

  const NIGHT = { skyline: 1, lantern: 1, clock: 1 };

  function scene(motif, pal, i) {
    const fn = M[motif] || M.mountain;
    const id = 'g' + (++uid);
    let s1, s2;
    if (NIGHT[motif]) {
      s1 = '#161b38'; s2 = '#3b3f78';
    } else {
      const opts = [[pal[0], pal[1]], ['#a9d6f5', '#eaf6ff'], ['#ffc49b', '#fff0dc'], ['#c3d1f5', '#f5eeff']];
      const o = opts[(i || 0) % opts.length];
      s1 = o[0]; s2 = o[1];
    }
    const p = { s1: s1, s2: s2, a: pal[2] };
    const stars = NIGHT[motif]
      ? '<g fill="#fff" opacity=".8"><circle cx="30" cy="24" r="1.4"/><circle cx="90" cy="40" r="1.2"/><circle cx="150" cy="18" r="1.5"/><circle cx="240" cy="30" r="1.3"/><circle cx="290" cy="56" r="1.2"/></g><circle cx="270" cy="32" r="12" fill="#fff6d0"/>'
      : '';
    return '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + s1 + '"/><stop offset="1" stop-color="' + s2 + '"/></linearGradient></defs>' +
      '<rect width="320" height="180" fill="url(#' + id + ')"/>' + stars + fn(p) + '</svg>';
  }

  window.Art = { scene: scene, motifs: Object.keys(M) };
})();
