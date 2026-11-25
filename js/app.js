(function () {
  const PACKS = window.QUIZ_PACKS || [];
  const SOLO = PACKS.length === 1;
  const KEY = "qiaoqiao-v1";
  const SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  const SERIF = '"Songti SC","STSong","PMingLiU","Palatino Linotype",Palatino,serif';
  const POSTER = {
    heroine: ["#5c2430", "#c86b78"],
    city: ["#7a3e22", "#e39a62"],
    love: ["#6e2944", "#e58aaa"],
    charm: ["#4a3024", "#c4956c"],
    night: ["#1c2740", "#7d90c0"]
  };
  const inWeChat = /MicroMessenger/i.test(navigator.userAgent);
  let lock = false;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function quizById(id) {
    return PACKS.find((q) => q.id === id) || null;
  }

  function loadStore() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "{}");
      return { progress: data.progress || {}, results: data.results || {} };
    } catch (err) {
      return { progress: {}, results: {} };
    }
  }

function saveStore(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    /* 无痕模式等写不进本地时，这一轮结果仍可看 */
  }
}

  const GATE_KEY = "qiaoqiao-gate";

  function sha256Hex(message) {
    const K = new Uint32Array([
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);
    function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
    const bytes = new TextEncoder().encode(message);
    const bitLen = bytes.length * 8;
    const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));
    view.setUint32(padded.length - 4, bitLen >>> 0);
    let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    const w = new Uint32Array(64);
    for (let i = 0; i < padded.length; i += 64) {
      for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
        const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let t = 0; t < 64; t++) {
        const s1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + s1 + ch + K[t] + w[t]) >>> 0;
        const s0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (s0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map((n) => n.toString(16).padStart(8, "0")).join("");
  }

  function normCode(value) {
    return String(value || "").trim().toUpperCase().replace(/[\s-]/g, "");
  }

  function gateRecord() {
    try {
      return JSON.parse(localStorage.getItem(GATE_KEY) || "{}");
    } catch (err) {
      return {};
    }
  }

  function gatePassed() {
    const gate = window.QUIZ_GATE;
    if (!gate || !gate.id || !gate.hash) return true;
    return gateRecord()[gate.id] === gate.hash;
  }

  function gateHtml() {
    return (
      shellTop('<span class="ghost">测评码</span>') +
      '<section class="intro rise"><div class="kicker">悄悄测</div>' +
      "<h1>输入测评码</h1>" +
      '<p class="lede">下单后，把卖家发你的码填在这里。这个码只能打开这一份。</p>' +
      '<form id="gate" class="code-form">' +
      '<input id="gate-code" class="code-input" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="16" placeholder="测评码" enterkeyhint="go">' +
      '<p class="notice gate-err" id="gate-err" hidden>码不对。看的是这一份的码，不是另一份的。</p>' +
      '<button class="btn" type="submit">进入</button></form>' +
      '<p class="notice">码只存在这台手机里。换手机、换浏览器，或清掉本站数据后，要再填一次。</p></section>' +
      footer()
    );
  }

  function bindGate() {
    const form = document.getElementById("gate");
    const input = document.getElementById("gate-code");
    const err = document.getElementById("gate-err");
    input?.focus();
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const gate = window.QUIZ_GATE;
      const hash = sha256Hex(normCode(input.value));
      if (!gate || hash !== gate.hash) {
        err.hidden = false;
        input.classList.add("is-bad");
        return;
      }
      const saved = gateRecord();
      saved[gate.id] = gate.hash;
      try { localStorage.setItem(GATE_KEY, JSON.stringify(saved)); } catch (err2) { /* 这一页仍可进入 */ }
      render();
    });
  }

  function parseRoute() {
    const parts = (location.hash || "#/").replace(/^#/, "").split("/").filter(Boolean);
    if (!parts.length) return { name: "home" };
    if (parts[0] === "about") return { name: "about" };
    if (parts[0] === "q" && parts[1]) {
      if (parts[2] === "go") {
        return { name: "question", id: parts[1], step: Number(parts[3] || 0) };
      }
      return { name: "intro", id: parts[1] };
    }
    if (parts[0] === "r" && parts[1] && parts[2]) {
      return { name: "result", id: parts[1], code: parts[2] };
    }
    return { name: "home" };
  }

  function go(hash, replace) {
    if (replace) {
      history.replaceState(null, "", hash);
      render();
      return;
    }
    location.hash = hash;
  }

  function score(quiz, answers) {
    const totals = {};
    quiz.results.forEach((r) => { totals[r.id] = 0; });
    answers.forEach((choice, i) => {
      const opt = quiz.questions[i].options[choice];
      Object.entries(opt.w).forEach(([id, n]) => {
        if (totals[id] != null) totals[id] += n;
      });
    });
    const ranked = quiz.results
      .map((r) => ({ id: r.id, score: totals[r.id] }))
      .sort((a, b) => b.score - a.score);
    const top = ranked[0];
    const second = ranked[1];
    const strength = Math.round(58 + (top.score / ((top.score + second.score) || 1)) * 38);
    const close = second.score > 0 && second.score >= top.score * 0.86;
    return { top, second, strength, close };
  }

  function resultById(quiz, id) {
    return quiz.results.find((r) => r.id === id);
  }

  function decode(quiz, code) {
    if (!code || code.length !== quiz.questions.length || !/^[0-3]+$/.test(code)) return null;
    return [...code].map(Number);
  }

  function shareUrl(quiz, code) {
    return location.href.split("#")[0] + "#/r/" + quiz.id + "/" + code;
  }

  function shareText(quiz, result, code) {
    return [
      "我在「悄悄测」做了「" + quiz.title + "」",
      "结果是：" + result.name,
      "「" + result.quote + "」",
      result.epithet,
      "你也来测 " + shareUrl(quiz, code),
      result.topic + " #悄悄测"
    ].join("\n");
  }

  function toast(msg) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = msg;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 1800);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    toast("文案已复制");
  }

  function wrapLines(ctx, text, maxWidth) {
    const lines = [];
    let line = "";
    for (const ch of text) {
      const next = line + ch;
      const punctuation = "，。、！？；：）」』】》".includes(ch);
      if (line && ctx.measureText(next).width > maxWidth && !punctuation) {
        lines.push(line);
        line = ch;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function rounded(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPoster(quiz, result) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext("2d");
    const colors = POSTER[quiz.theme] || POSTER.heroine;
    const g = ctx.createLinearGradient(0, 0, 1080, 1440);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1080, 1440);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.beginPath();
    ctx.arc(980, 120, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(80, 1320, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,250,246,.92)";
    ctx.font = "34px " + SANS;
    ctx.fillText("悄悄测  ·  " + quiz.kicker, 72, 128);
    ctx.font = "44px " + SERIF;
    const titleLines = wrapLines(ctx, quiz.title, 900);
    titleLines.forEach((line, i) => ctx.fillText(line, 72, 190 + i * 56));

    const cardY = 250 + (titleLines.length - 1) * 20;
    rounded(ctx, 64, cardY, 952, 980, 48);
    ctx.fillStyle = "#fffaf6";
    ctx.fill();

    ctx.font = "120px " + SANS;
    ctx.fillText(result.emoji, 108, cardY + 150);
    let nameSize = 84;
    ctx.font = "600 " + nameSize + "px " + SERIF;
    while (nameSize > 48 && ctx.measureText(result.name).width > 820) {
      nameSize -= 4;
      ctx.font = "600 " + nameSize + "px " + SERIF;
    }
    ctx.fillStyle = "#241c18";
    ctx.fillText(result.name, 108, cardY + 280);
    ctx.font = "30px " + SANS;
    ctx.fillStyle = "#8a7268";
    ctx.fillText(result.from, 108, cardY + 336);

    ctx.font = "34px " + SERIF;
    const quote = wrapLines(ctx, "「" + result.quote + "」", 800).slice(0, 2);
    const quoteH = 36 + quote.length * 48;
    const quoteY = cardY + 372;
    rounded(ctx, 108, quoteY, 860, quoteH, 28);
    ctx.fillStyle = "#f6ece6";
    ctx.fill();
    ctx.fillStyle = "#241c18";
    quote.forEach((line, i) => ctx.fillText(line, 140, quoteY + 52 + i * 48));

    ctx.font = "28px " + SANS;
    let tagX = 108;
    let tagY = quoteY + quoteH + 28;
    result.tags.forEach((tag) => {
      const w = ctx.measureText(tag).width + 48;
      if (tagX + w > 968) {
        tagX = 108;
        tagY += 70;
      }
      rounded(ctx, tagX, tagY, w, 58, 29);
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "rgba(36,28,24,.12)";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#241c18";
      ctx.fillText(tag, tagX + 24, tagY + 38);
      tagX += w + 16;
    });

    ctx.font = "34px " + SANS;
    ctx.fillStyle = "#3a2c28";
    const epithet = wrapLines(ctx, result.epithet, 820).slice(0, 3);
    epithet.forEach((line, i) => ctx.fillText(line, 108, tagY + 120 + i * 50));

    const local = location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    const foot = local ? "悄悄测    娱乐向 · 保存图片发小红书" : location.host + "    娱乐向 · 保存图片发小红书";
    ctx.fillStyle = "rgba(255,250,246,.92)";
    ctx.font = "28px " + SANS;
    ctx.fillText(foot, 72, 1360);
    return canvas.toDataURL("image/png");
  }

  function showPoster(quiz, result) {
    const url = drawPoster(quiz, result);
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML =
      '<div class="sheet" role="dialog" aria-modal="true">' +
      '<img class="poster-img" alt="测评结果海报" src="' + url + '">' +
      "<p>" + (inWeChat ? "长按图片，保存到相册，再发小红书。" : "长按或右键保存图片。微信里打开时，请长按图片保存。") + "</p>" +
      (inWeChat ? "" : '<a class="btn" id="dl" href="' + url + '" download="悄悄测-' + esc(result.name) + '.png">下载海报</a>') +
      '<button class="btn secondary" id="close-poster" type="button">关闭</button></div>';
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
    document.getElementById("close-poster").addEventListener("click", () => modal.remove());
  }

  function shellTop(extra) {
    return (
      '<header class="topbar"><a class="brand" href="#/"><span class="mark">悄</span><span><b>悄悄测</b><small>答案只留在这台手机</small></span></span></a>' +
      (extra || '<a class="ghost" href="#/about">关于</a>') +
      "</header>"
    );
  }

  function footer() {
    return '<footer class="foot">娱乐向趣味测评，不是心理诊断，也不用来做严肃的人生决定。<br><a href="#/about">计分、隐私与边界</a></footer>';
  }

  function homeHtml() {
    const saved = loadStore().results;
    const cards = PACKS.map((quiz) => {
      const code = saved[quiz.id] && saved[quiz.id].code;
      let done = "";
      if (code) {
        const answers = decode(quiz, code);
        if (answers) {
          const hit = resultById(quiz, score(quiz, answers).top.id);
          done = '<span class="done">已测 · ' + esc(hit.name) + "</span>";
        }
      }
      return (
        '<a class="card rise" href="#/q/' + quiz.id + '">' +
        '<div class="card-top"><span class="emoji-lg">' + quiz.emoji + '</span><span class="kicker">' + esc(quiz.kicker) + " · " + quiz.minutes + " 分钟</span>" + done + "</div>" +
        "<h2>" + esc(quiz.title) + "</h2><p>" + esc(quiz.cardHook) + "</p>" +
        '<div class="card-foot"><span>' + quiz.questions.length + ' 题 · 不用注册</span><span class="go">开始</span></div></a>'
      );
    }).join("");
    return (
      shellTop() +
      '<section class="hero rise"><h1>按你平时怎么做，对一下自己。</h1><p class="lede">五套给女生的趣味测评。每题一个具体场景，在你这台手机里算完，测完可以存一张海报。</p></section>' +
      '<div class="stack">' + cards + "</div>" + footer()
    );
  }

  function introHtml(quiz) {
    const store = loadStore();
    const progress = store.progress[quiz.id];
    const saved = store.results[quiz.id];
    const gets = quiz.get.map((item) => "<li>" + esc(item) + "</li>").join("");
    let extra = "";
    if (progress && progress.answers && progress.answers.length && progress.answers.length < quiz.questions.length) {
      extra = '<a class="btn secondary" href="#/q/' + quiz.id + "/go/" + progress.answers.length + '">接着测，第 ' + (progress.answers.length + 1) + " 题</a>";
    }
    if (saved && saved.code && decode(quiz, saved.code)) {
      extra += '<a class="btn secondary" href="#/r/' + quiz.id + "/" + saved.code + '">查看上次结果</a>';
    }
    return (
      shellTop(SOLO ? '<a class="ghost" href="#/about">关于</a>' : '<a class="ghost" href="#/">全部</a>') +
      '<section class="intro rise"><div class="big">' + quiz.emoji + "</div>" +
      '<div class="kicker">' + esc(quiz.kicker) + " · " + quiz.questions.length + " 题 · 约 " + quiz.minutes + " 分钟</div>" +
      "<h1>" + esc(quiz.title) + "</h1><p class=\"lede\">" + esc(quiz.lead) + "</p>" +
      '<ul class="gets">' + gets + "</ul>" +
      '<a class="btn" href="#/q/' + quiz.id + '/go/0">开始</a>' + extra +
      '<p class="notice">' + esc(quiz.notice) + "</p></section>" + footer()
    );
  }

  function questionHtml(quiz, step) {
    const q = quiz.questions[step];
    const pct = Math.round((step / quiz.questions.length) * 100);
    const options = q.options.map((opt, i) =>
      '<button class="opt" type="button" data-choice="' + i + '">' + esc(opt.t) + "</button>"
    ).join("");
    const back = step === 0
      ? '<a class="ghost back" href="#/q/' + quiz.id + '">返回介绍</a>'
      : '<button class="ghost back" type="button" id="prev">上一题</button>';
    return (
      shellTop('<a class="ghost" href="#/">退出</a>') +
      '<div class="progress-wrap"><div class="bar"><span style="width:' + pct + '%"></span></div></div>' +
      '<div class="q-kicker">第 ' + (step + 1) + " / " + quiz.questions.length + " 题 · " + esc(quiz.title) + "</div>" +
      '<h2 class="q-title" id="q-title" tabindex="-1">' + esc(q.q) + "</h2>" +
      '<div class="options">' + options + "</div>" + back
    );
  }

  function resultHtml(quiz, code) {
    const answers = decode(quiz, code);
    if (!answers) {
      return shellTop() + '<section class="intro"><h1>这份结果打不开</h1><p class="lede">链接不完整。重新测一次就好。</p><a class="btn" href="#/q/' + quiz.id + '">回到这套测评</a></section>';
    }
    const scored = score(quiz, answers);
    const result = resultById(quiz, scored.top.id);
    const second = resultById(quiz, scored.second.id);
    const flashes = result.flash.map((item) => "<li>" + esc(item) + "</li>").join("");
    const close = scored.close
      ? '<section class="block"><h3>第二名是' + esc(second.name) + '</h3><p class="portrait">你有几题也指向「' + esc(second.name) + '」。这次没有超过第一名。</p></section>'
      : "";
    const help = quiz.id === "night"
      ? '<p class="notice">如果这些句子让你难受，可以打北京心理危机研究与干预中心 010-82951332，或当地心理援助热线。测评代替不了人和帮助。</p>'
      : "";
    const more = PACKS.filter((item) => item.id !== quiz.id).slice(0, 3).map((item) =>
      '<a class="mini" href="#/q/' + item.id + '"><span><b>' + esc(item.title) + "</b><span>" + esc(item.cardHook) + '</span></span><span class="go">测</span></a>'
    ).join("");
    const moreBlock = more ? '<section class="more"><h3>再测一个</h3>' + more + "</section>" : "";
    const tags = result.tags.map((tag) => "<span>" + esc(tag) + "</span>").join("");
    const misread = result.misread
      ? '<section class="block"><h3>别人容易说错的那句</h3><p class="portrait">' + esc(result.misread) + "</p></section>"
      : "";
    return (
      shellTop(SOLO ? '<a class="ghost" href="#/q/' + quiz.id + '">返回</a>' : '<a class="ghost" href="#/">全部</a>') +
      '<article class="result rise"><div class="result-hero">' +
      '<div class="emoji">' + result.emoji + "</div>" +
      '<div class="kicker">' + esc(quiz.title) + "</div>" +
      "<h1>" + esc(result.name) + "</h1>" +
      '<div class="from">' + esc(result.from) + "</div>" +
      '<p class="epithet">' + esc(result.epithet) + "</p>" +
      '<div class="quote">' + esc(result.quote) + "</div>" +
      '<div class="tags">' + tags + "</div>" +
      '<div class="meter"><div class="row"><span>选择有多集中</span><strong>' + scored.strength + '</strong></div><div class="bar"><span style="width:' + scored.strength + '%"></span></div>' +
      '<p class="caption">同一组答案永远是同一个结果。这个数字只说明你的选项有多集中地指向它，不是科学准确率。</p></div></div>' +
      '<section class="block"><h3>你选出来的样子</h3><p class="portrait">' + esc(result.portrait) + "</p></section>" +
      misread +
      '<div class="split"><section class="block"><h3>你做得来的</h3><ul>' + flashes + '</ul></section>' +
      '<section class="block"><h3>你会烦的</h3><ul><li>' + esc(result.drains[0]) + "</li><li>" + esc(result.drains[1]) + "</li></ul></section></div>" +
      '<section class="block"><h3>你缓过来靠这些</h3><ul><li>' + esc(result.fills[0]) + "</li><li>" + esc(result.fills[1]) + "</li></ul></section>" +
      '<section class="block"><h3>在关系里</h3><p class="love">' + esc(result.love) + "</p></section>" +
      '<section class="block pair"><div><h3>你能处久的人</h3><p>' + esc(result.pair) + "</p></div></section>" +
      close + help +
      '<div class="actions"><button class="btn" id="poster" type="button">保存海报</button><button class="btn secondary" id="copy" type="button">复制文案</button></div>' +
      '<button class="btn secondary" id="retake" type="button">重新测这套</button>' +
      moreBlock + "</article>" + footer()
    );
  }

  function aboutHtml() {
    return (
      shellTop('<a class="ghost" href="#/">首页</a>') +
      '<article class="about rise"><h1>关于悄悄测</h1>' +
      "<p>" + (SOLO ? "这套题" : "五套题都") + "在你的浏览器里算完。不注册，不上传答案，刷新前的进度只存在这台手机。点「重新测」会清掉那一套的进度和结果。</p>" +
      "<h2>怎么算的</h2><p>每个选项把分数加到对应结果上，取得分最高的一个。分数相同就按题库里的固定顺序，所以同一组答案永远得到同一个结果。若第二名和第一名很接近，结果页会把那一面也告诉你。</p>" +
      "<h2>它不是什么</h2><p>不是心理诊断，不是官方人格测验，也不能用来判断一个人配不配被爱、适不适合一份工作。女频人物名只作大家都认得的参照，文案是原创的，与原著和版权方无关。</p>" +
      "<h2>怎么写的</h2><p>每题只问一件具体的事：等人、回消息、周末、花钱、进一个房间。每个选项主要给一种结果加分。结果页把你反复选到的做法再说一遍，包括你做得来的、你会烦的，以及别人容易说错的那句。像，是因为对得上你刚选的那些事。</p>" +
      "<p>这不是常模测验，没有全国样本，不能当诊断，也不能拿来判断一个人配不配被爱。同一组答案永远是同一个结果。</p></article>" + footer()
    );
  }

  function render() {
    document.querySelectorAll(".modal").forEach((node) => node.remove());
    if (!gatePassed()) {
      const quiz = SOLO ? PACKS[0] : null;
      document.documentElement.dataset.theme = quiz ? quiz.theme : "home";
      document.getElementById("app").innerHTML = gateHtml();
      bindGate();
      window.scrollTo(0, 0);
      return;
    }
    let route = parseRoute();
    if (SOLO && route.name === "home") route = { name: "intro", id: PACKS[0].id };
    const quiz = route.id ? quizById(route.id) : null;
    document.documentElement.dataset.theme = quiz ? quiz.theme : "home";
    const app = document.getElementById("app");
    if ((route.name === "intro" || route.name === "question" || route.name === "result") && !quiz) {
      app.innerHTML = shellTop() + '<section class="intro"><h1>没有这套测评</h1><a class="btn" href="#/">回首页</a></section>';
      window.scrollTo(0, 0);
      return;
    }
    if (route.name === "question") {
      const answers = (loadStore().progress[quiz.id] || {}).answers || [];
      if (route.step > 0 && answers.length < route.step) {
        go("#/q/" + quiz.id + "/go/" + answers.length, true);
        return;
      }
      if (!Number.isInteger(route.step) || route.step < 0 || route.step >= quiz.questions.length) {
        go("#/q/" + quiz.id, true);
        return;
      }
    }
    const html = {
      home: homeHtml,
      about: aboutHtml,
      intro: () => introHtml(quiz),
      question: () => questionHtml(quiz, route.step),
      result: () => resultHtml(quiz, route.code)
    }[route.name]();
    app.innerHTML = html;
    bind(route, quiz);
    window.scrollTo(0, 0);
  }

  function bind(route, quiz) {
    if (route.name === "question") {
      document.querySelectorAll("[data-choice]").forEach((btn) => {
        btn.addEventListener("click", () => choose(quiz, route.step, Number(btn.dataset.choice), btn));
      });
      document.getElementById("prev")?.addEventListener("click", () => {
        go("#/q/" + quiz.id + "/go/" + (route.step - 1));
      });
      document.getElementById("q-title")?.focus({ preventScroll: true });
    }
    if (route.name === "result") {
      const answers = decode(quiz, route.code);
      if (!answers) return;
      const scored = score(quiz, answers);
      const result = resultById(quiz, scored.top.id);
      document.getElementById("poster")?.addEventListener("click", () => showPoster(quiz, result));
      document.getElementById("copy")?.addEventListener("click", () => copyText(shareText(quiz, result, route.code)));
      document.getElementById("retake")?.addEventListener("click", () => {
        const store = loadStore();
        delete store.progress[quiz.id];
        delete store.results[quiz.id];
        saveStore(store);
        go("#/q/" + quiz.id + "/go/0");
      });
    }
  }

  function choose(quiz, step, choice, btn) {
    if (lock) return;
    lock = true;
    btn.classList.add("is-on");
    const store = loadStore();
    const prev = (store.progress[quiz.id] || {}).answers || [];
    const answers = prev.slice(0, step);
    answers[step] = choice;
    if (step + 1 >= quiz.questions.length) {
      const code = answers.join("");
      store.results[quiz.id] = { code: code, at: Date.now() };
      delete store.progress[quiz.id];
      saveStore(store);
      setTimeout(() => {
        lock = false;
        go("#/r/" + quiz.id + "/" + code, true);
      }, 160);
      return;
    }
    store.progress[quiz.id] = { answers: answers };
    saveStore(store);
    setTimeout(() => {
      lock = false;
      go("#/q/" + quiz.id + "/go/" + (step + 1));
    }, 160);
  }

  document.addEventListener("keydown", (e) => {
    const route = parseRoute();
    if (route.name !== "question") return;
    const n = Number(e.key);
    if (n >= 1 && n <= 4) {
      const btn = document.querySelector('[data-choice="' + (n - 1) + '"]');
      btn?.click();
    }
  });

  window.addEventListener("hashchange", render);
  render();
})();
