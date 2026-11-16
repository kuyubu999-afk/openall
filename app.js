/* 环球旅行指南：路由、渲染与语音播报(全部本地运行，无需网络) */
(function () {
  'use strict';

  var DESTS = window.DESTS || [];
  var TIPS = window.TIPS || [];
  var app = document.getElementById('app');
  var synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;

  var REGIONS = ['全部', '亚洲', '中东', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲'];
  var LANGN = { zh: '中文', ja: '日语', ko: '韩语', th: '泰语', id: '印尼语', ar: '阿拉伯语', tr: '土耳其语', fr: '法语', it: '意大利语', es: '西班牙语', en: '英语', pt: '葡萄牙语', sw: '斯瓦希里语' };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 忽略 */ } }
  };

  /* ---------- 提示 ---------- */
  var toastTimer;
  function toast(msg) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 3200);
  }

  function updateNet() {
    var n = document.getElementById('net');
    n.textContent = navigator.onLine ? '' : '离线模式';
  }
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);

  /* ---------- 语音播报 ---------- */
  var TTS = { queue: [], i: 0, playing: false, paused: false, gen: 0, rate: Number(store.get('rate', 1)) || 1, lastSid: null };

  function normLang(l) { return String(l || '').replace('_', '-').toLowerCase(); }

  function pickVoice(lang) {
    if (!synth) return null;
    var vs = synth.getVoices();
    if (!vs.length) return null;
    var want = normLang(lang), base = want.split('-')[0];
    var best = null, bestScore = -1;
    vs.forEach(function (v) {
      var vl = normLang(v.lang), score = -1;
      if (vl === want) score = 3;
      else if (vl.split('-')[0] === base) score = 2;
      if (score < 0) return;
      if (v.localService) score += 0.5;
      if (score > bestScore) { best = v; bestScore = score; }
    });
    return best;
  }

  function chunks(text) {
    var parts = text.replace(/\s+/g, ' ').match(/[^。！？!?；;.]+[。！？!?；;.]*/g) || [text];
    var out = [], cur = '';
    parts.forEach(function (p) {
      if (p.length > 160) {
        (p.match(/[^，,、]+[，,、]?/g) || [p]).forEach(function (q) {
          if (cur && (cur + q).length > 110) { out.push(cur); cur = q; } else cur += q;
        });
        return;
      }
      if (cur && (cur + p).length > 110) { out.push(cur); cur = p; } else cur += p;
    });
    if (cur) out.push(cur);
    return out;
  }

  function clearMark() {
    document.querySelectorAll('.speaking').forEach(function (e) { e.classList.remove('speaking'); });
    TTS.lastSid = null;
  }
  function mark(sid) {
    if (!sid || sid === TTS.lastSid) return;
    clearMark();
    TTS.lastSid = sid;
    var el = document.querySelector('[data-sid="' + sid + '"]');
    if (!el) return;
    el.classList.add('speaking');
    var r = el.getBoundingClientRect();
    if (r.top < 70 || r.bottom > window.innerHeight - 100) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function updatePlayer() {
    var pl = document.getElementById('player');
    pl.hidden = !TTS.playing;
    document.getElementById('pp').textContent = TTS.paused ? '▶ 继续' : '⏸ 暂停';
    var cur = TTS.queue[TTS.i];
    document.getElementById('now').textContent = cur ? ('正在朗读：' + cur.text.slice(0, 30)) : '';
  }

  function next() {
    if (!TTS.playing || TTS.paused) return;
    if (TTS.i >= TTS.queue.length) { ttsStop(); return; }
    var g = ++TTS.gen;
    var it = TTS.queue[TTS.i];
    if (window.AndroidTTS) {
      mark(it.sid);
      updatePlayer();
      window.AndroidTTS.speak(it.text, it.lang || 'zh-CN', TTS.rate);
      return;
    }
    var u = new SpeechSynthesisUtterance(it.text);
    u.lang = it.lang || 'zh-CN';
    var v = pickVoice(u.lang);
    if (v) u.voice = v;
    u.rate = TTS.rate;
    u.onstart = function () { if (g === TTS.gen) { mark(it.sid); updatePlayer(); } };
    u.onend = function () { if (g !== TTS.gen) return; TTS.i++; next(); };
    u.onerror = function (e) {
      if (g !== TTS.gen) return;
      if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
      if (e && e.error === 'not-allowed') { toast('浏览器阻止了自动播放，请再点一次朗读按钮。'); ttsStop(); return; }
      TTS.i++; next();
    };
    synth.speak(u);
  }

  function ttsPlay(items) {
    if (!synth && !window.AndroidTTS) { toast('此设备不支持语音播报。'); return; }
    ttsStop(true);
    var q = [];
    items.forEach(function (it) {
      chunks(it.text).forEach(function (c) { q.push({ text: c, lang: it.lang, sid: it.sid }); });
    });
    if (!q.length) return;
    TTS.queue = q; TTS.i = 0; TTS.playing = true; TTS.paused = false;
    updatePlayer();
    setTimeout(next, 80);
  }
  function ttsPause() {
    if (!TTS.playing || TTS.paused) return;
    TTS.paused = true; TTS.gen++; if (window.AndroidTTS) window.AndroidTTS.stop(); if (synth) synth.cancel(); updatePlayer();
  }
  function ttsResume() {
    if (!TTS.playing || !TTS.paused) return;
    TTS.paused = false; updatePlayer(); setTimeout(next, 60);
  }
  function ttsStop(silent) {
    TTS.gen++; TTS.playing = false; TTS.paused = false;
    if (window.AndroidTTS) window.AndroidTTS.stop();
    if (synth) synth.cancel();
    clearMark();
    if (!silent) updatePlayer();
  }

  window.onNativeTtsDone = function () {
    if (!TTS.playing || TTS.paused) return;
    TTS.i++;
    next();
  };

  function langName(l) { return LANGN[normLang(l).split('-')[0]] || l; }
  function refreshHints() {
    document.querySelectorAll('.vhint').forEach(function (el) {
      var lang = el.getAttribute('data-lang');
      if (!synth && !window.AndroidTTS) { el.textContent = '此设备不支持语音播报，仍可正常阅读。'; return; }
      var vs = synth.getVoices();
      if (!vs.length) { el.textContent = ''; return; }
      el.textContent = pickVoice(lang) ? '' : ('未检测到' + langName(lang) + '语音包，朗读可能无声或发音不准。请在系统设置里下载对应语音后重试。');
    });
  }
  if (synth) {
    if (synth.addEventListener) synth.addEventListener('voiceschanged', refreshHints);
    else synth.onvoiceschanged = refreshHints;
  }

  /* ---------- 页面：首页 ---------- */
  var state = { q: '', region: '全部', favoritesOnly: false };
  function favorites() { return store.get('favorite-destinations', []); }
  function isFavorite(id) { return favorites().indexOf(id) >= 0; }
  function toggleFavorite(id) {
    var saved = favorites();
    var i = saved.indexOf(id);
    if (i >= 0) saved.splice(i, 1); else saved.push(id);
    store.set('favorite-destinations', saved);
    toast(i >= 0 ? '已取消收藏' : '已加入收藏');
  }

  function haystack(d) {
    return [d.name, d.country, d.region, d.tag]
      .concat(d.spots.map(function (s) { return s[0]; }))
      .concat(d.food.map(function (f) { return f[0]; }))
      .join(' ').toLowerCase();
  }

  function cardHtml(d) {
    return '<a class="card" href="#/d/' + d.id + '">' +
      '<div class="art">' + Art.scene(d.spots[0][1], d.pal, 0) + '</div>' +
      '<div class="card-body"><h3>' + esc(d.name) + '</h3>' +
      '<p class="sub">' + esc(d.country) + ' · ' + esc(d.region) + '</p>' +
      '<p class="tag">' + esc(d.tag) + '</p></div></a>';
  }

  function fillGrid() {
    var q = state.q.trim().toLowerCase();
    var list = DESTS.filter(function (d) {
      return (!state.favoritesOnly || isFavorite(d.id)) && (state.region === '全部' || d.region === state.region) && (!q || haystack(d).indexOf(q) >= 0);
    });
    var g = document.getElementById('grid');
    g.innerHTML = list.length ? list.map(cardHtml).join('') : '<p class="empty">' + (state.favoritesOnly ? '还没有收藏目的地。打开任意目的地，点击“☆ 收藏”即可添加。' : '没有找到相关目的地，换个关键词试试。') + '</p>'; 
  }

  function renderHome() {
    document.title = '环球旅行指南(离线版)';
    app.innerHTML =
      '<section class="hero"><h1>环球旅行指南</h1>' +
      '<p>' + DESTS.length + ' 个热门目的地 · 图文为主 · 支持语音播报 · 离线可读</p></section>' +
      '<div class="controls">' +
      '<input id="q" class="search" type="search" placeholder="搜索国家、城市、景点或美食" value="' + esc(state.q) + '" aria-label="搜索">' +
      '<div class="chips" role="group" aria-label="按大洲筛选">' +
      '<button class="chip" type="button" data-fav-filter aria-pressed="' + state.favoritesOnly + '">★ 我的收藏</button>' +
      REGIONS.map(function (r) {
        return '<button class="chip" type="button" data-region="' + r + '" aria-pressed="' + (state.region === r) + '">' + r + '</button>';
      }).join('') + '</div></div>' +
      '<div id="grid" class="grid"></div>';
    fillGrid();
  }

  /* ---------- 页面：目的地详情 ---------- */
  var CUR = null;

  function renderDetail(id) {
    var idx = DESTS.findIndex(function (x) { return x.id === id; });
    if (idx < 0) { renderHome(); return; }
    var d = DESTS[idx];
    document.title = d.name + ' · 环球旅行指南';

    var n = 0;
    function sid() { return 's' + (++n); }
    var blocks = [];

    function block(bid, title, build, opts) {
      opts = opts || {};
      var items = [];
      var body = build(items);
      blocks.push({
        id: bid, title: title, items: items, speakable: !opts.nospeak,
        html: '<section class="block" id="b-' + bid + '"><div class="bh"><h2>' + esc(title) + '</h2>' +
          (opts.nospeak ? '' : '<button class="btn small" type="button" data-act="read-block" data-b="' + bid + '">🔊 朗读</button>') +
          '</div>' + body + '</section>'
      });
    }
    function para(items, text) {
      var s = sid();
      items.push({ sid: s, text: text, lang: 'zh-CN' });
      return '<p data-sid="' + s + '">' + esc(text) + '</p>';
    }

    block('overview', '概览', function (it) { return para(it, d.intro); });
    block('best', '最佳出行时间', function (it) { return para(it, d.best); });

    block('spots', '必去景点', function (it) {
      return '<div class="spots">' + d.spots.map(function (s, i) {
        var q = sid();
        it.push({ sid: q, text: s[0] + '。' + s[2], lang: 'zh-CN' });
        var photo = s[3] ? '<img src="' + esc(s[3]) + '" alt="' + esc(s[0]) + '" loading="lazy" onerror="this.remove()">' : '';
        var mapQuery = encodeURIComponent(d.name + ' ' + s[0]);
        var mapLink = 'https://www.google.com/maps/search/?api=1&query=' + mapQuery;
        return '<figure class="spot" data-sid="' + q + '"><div class="art">' + Art.scene(s[1], d.pal, i) + photo + '</div>' +
          '<figcaption><b>' + esc(s[0]) + '</b><span>' + esc(s[2]) + '</span>' +
          '<a class="map-link" data-ext href="' + esc(mapLink) + '" target="_blank" rel="noopener noreferrer">地图中查看 ↗</a></figcaption></figure>';
      }).join('') + '</div>';
    });

    block('food', '特色美食', function (it) {
      return '<ul>' + d.food.map(function (f) {
        var q = sid();
        it.push({ sid: q, text: f[0] + '。' + f[1], lang: 'zh-CN' });
        return '<li data-sid="' + q + '"><b>' + esc(f[0]) + '</b>：' + esc(f[1]) + '</li>';
      }).join('') + '</ul>';
    });

    block('transport', '交通', function (it) { return para(it, d.transport); });

    block('tips', '实用贴士', function (it) {
      return '<ul>' + d.tips.map(function (t) {
        var q = sid();
        it.push({ sid: q, text: t, lang: 'zh-CN' });
        return '<li data-sid="' + q + '">' + esc(t) + '</li>';
      }).join('') + '</ul>';
    });

    block('phrases', '常用语(点击喇叭跟读)', function () {
      return '<table class="ph"><tbody>' + d.phrases.map(function (p) {
        return '<tr><td><div class="t">' + esc(p[0]) + '</div>' + (p[1] ? '<div class="r">' + esc(p[1]) + '</div>' : '') + '</td>' +
          '<td class="zh">' + esc(p[2]) + '</td>' +
          '<td><button class="btn small" type="button" data-act="say" data-lang="' + esc(d.plang) + '" data-text="' + esc(p[0]) + '" aria-label="朗读 ' + esc(p[0]) + '">🔊</button></td></tr>';
      }).join('') + '</tbody></table>' +
        '<p class="vhint" data-lang="' + esc(d.plang) + '"></p>';
    }, { nospeak: true });

    block('video', '视频与延伸(需联网)', function () {
      var yt = function (q) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q); };
      var bl = function (q) { return 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(q); };
      return '<p class="note">以下为视频搜索链接，联网后在新窗口打开，可按需筛选最新内容；离线时无法播放。</p><ul class="vids">' +
        d.video.map(function (q) {
          return '<li><span class="q">' + esc(q) + '</span>' +
            '<a data-ext href="' + yt(q) + '" target="_blank" rel="noopener noreferrer">YouTube</a>' +
            '<a data-ext href="' + bl(q) + '" target="_blank" rel="noopener noreferrer">哔哩哔哩</a></li>';
        }).join('') + '</ul>';
    }, { nospeak: true });

    CUR = {
      lead: [{ sid: 'hero', text: d.name + '旅行指南。' + d.tag + '。', lang: 'zh-CN' }],
      blocks: blocks
    };

    var prev = DESTS[(idx - 1 + DESTS.length) % DESTS.length];
    var nextD = DESTS[(idx + 1) % DESTS.length];

    app.innerHTML =
      '<a class="back" href="#/">← 返回目的地</a>' +
      '<div class="dhero"><div class="art">' + Art.scene(d.spots[0][1], d.pal, 0) + '</div>' +
      '<div class="ov"><h1 data-sid="hero">' + esc(d.name) + '</h1><p>' + esc(d.tag) + ' · ' + esc(d.country) + '</p></div></div>' +
      '<div class="basics">' + d.basics.map(function (b) {
        return '<div><small>' + esc(b[0]) + '</small><b>' + esc(b[1]) + '</b></div>';
      }).join('') + '</div>' +
      '<div class="toolbar"><button class="btn primary" type="button" data-act="read-all">🔊 朗读全文</button>' +
      '<button class="btn" type="button" data-act="toggle-fav">' + (isFavorite(d.id) ? '★ 已收藏' : '☆ 收藏') + '</button></div>' +
      '<div class="toc">' + blocks.map(function (b) {
        return '<button class="btn" type="button" data-act="goto" data-b="' + b.id + '">' + esc(b.title.replace(/(.*?)(\(.*)/, '$1')) + '</button>';
      }).join('') + '</div>' +
      '<p class="vhint" data-lang="zh-CN"></p>' +
      blocks.map(function (b) { return b.html; }).join('') +
      '<div class="pn"><a href="#/d/' + prev.id + '"><small>上一个</small>' + esc(prev.name) + '</a>' +
      '<a class="r" href="#/d/' + nextD.id + '"><small>下一个</small>' + esc(nextD.name) + '</a></div>';
    refreshHints();
  }

  /* ---------- 页面：出行通用 ---------- */
  function renderTips() {
    document.title = '出行通用指南 · 环球旅行指南';
    var n = 0;
    var blocks = [];
    var saved = store.get('checklist', {});
    TIPS.forEach(function (sec) {
      var items = [];
      var body;
      if (sec.type === 'check') {
        body = '<ul class="check">' + sec.items.map(function (t, i) {
          var s = 't' + (++n);
          items.push({ sid: s, text: t, lang: 'zh-CN' });
          var key = sec.id + '-' + i;
          return '<li data-sid="' + s + '"><label><input type="checkbox" data-ck="' + key + '"' + (saved[key] ? ' checked' : '') + '><span>' + esc(t) + '</span></label></li>';
        }).join('') + '</ul>';
      } else {
        body = '<ul>' + sec.items.map(function (t) {
          var s = 't' + (++n);
          items.push({ sid: s, text: t, lang: 'zh-CN' });
          return '<li data-sid="' + s + '">' + esc(t) + '</li>';
        }).join('') + '</ul>';
      }
      blocks.push({
        id: sec.id, title: sec.title, items: items, speakable: true,
        html: '<section class="block" id="b-' + sec.id + '"><div class="bh"><h2>' + esc(sec.title) + '</h2>' +
          '<button class="btn small" type="button" data-act="read-block" data-b="' + sec.id + '">🔊 朗读</button></div>' + body + '</section>'
      });
    });
    CUR = { lead: [], blocks: blocks };
    app.innerHTML =
      '<a class="back" href="#/">← 返回目的地</a>' +
      '<section class="hero"><h1>出行通用指南</h1><p>适用于大多数目的地的准备与安全要点</p></section>' +
      '<div class="toolbar"><button class="btn primary" type="button" data-act="read-all">🔊 朗读全文</button></div>' +
      '<p class="vhint" data-lang="zh-CN"></p>' +
      blocks.map(function (b) { return b.html; }).join('');
    refreshHints();
  }

  /* ---------- 路由 ---------- */
  function route() {
    ttsStop();
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    if (parts[0] === 'd' && parts[1]) renderDetail(parts[1]);
    else if (parts[0] === 'tips') renderTips();
    else renderHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ---------- 事件 ---------- */
  document.addEventListener('click', function (e) {
    var ext = e.target.closest('a[data-ext]');
    if (ext && !navigator.onLine) {
      e.preventDefault();
      toast('当前处于离线状态，地图和视频服务需要联网；景点介绍仍可离线查看。');
      return;
    }
    var favFilter = e.target.closest('[data-fav-filter]');
    if (favFilter) { state.favoritesOnly = !state.favoritesOnly; renderHome(); return; }
    var chip = e.target.closest('[data-region]');
    if (chip) { state.region = chip.getAttribute('data-region'); renderHome(); return; }

    var t = e.target.closest('[data-act]');
    if (!t || !CUR && t.dataset.act !== 'say') return;
    var act = t.dataset.act;

    if (act === 'toggle-fav') {
      var current = location.hash.split('/')[2];
      if (current) { toggleFavorite(current); renderDetail(current); }
    } else if (act === 'read-all') {
      var items = CUR.lead.slice();
      CUR.blocks.forEach(function (b) { if (b.speakable) items = items.concat(b.items); });
      ttsPlay(items);
    } else if (act === 'read-block') {
      var b = CUR.blocks.filter(function (x) { return x.id === t.dataset.b; })[0];
      if (b) ttsPlay(b.items);
    } else if (act === 'say') {
      ttsPlay([{ text: t.dataset.text, lang: t.dataset.lang, sid: null }]);
    } else if (act === 'goto') {
      var el = document.getElementById('b-' + t.dataset.b);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'q') { state.q = e.target.value; fillGrid(); }
  });
  document.addEventListener('change', function (e) {
    var ck = e.target.getAttribute && e.target.getAttribute('data-ck');
    if (ck) {
      var saved = store.get('checklist', {});
      saved[ck] = e.target.checked;
      store.set('checklist', saved);
    }
  });

  document.getElementById('pp').addEventListener('click', function () { TTS.paused ? ttsResume() : ttsPause(); });
  document.getElementById('st').addEventListener('click', function () { ttsStop(); });
  var rateSel = document.getElementById('rate');
  rateSel.value = String(TTS.rate);
  if (rateSel.value !== String(TTS.rate)) rateSel.value = '1';
  rateSel.addEventListener('change', function () {
    TTS.rate = Number(rateSel.value) || 1;
    store.set('rate', TTS.rate);
  });

  window.addEventListener('pagehide', function () { if (synth) synth.cancel(); });

  /* ---------- 离线缓存 ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* 忽略 */ });
  }

  updateNet();
  route();
})();
