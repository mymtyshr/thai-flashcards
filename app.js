'use strict';
(() => {
  /* =====================================================
   * タイ語マイフレーズ
   * 音声は speak() だけが担当。将来、別の音声合成サービスに
   * 切り替える場合は「TTS」オブジェクトの中身を差し替える。
   * ===================================================== */

  const KEY = 'thai-my-phrases.v1';
  const DEFAULT_CATS = ['挨拶', 'レストラン', 'ホテル', '買い物', '移動'];

  // [日本語, タイ語, カタカナ, カテゴリー, 単語分解（タイ語＝和訳＝発音記号＝カタカナ；…）]
  const SEED = [
    ['こんにちは', 'สวัสดีครับ', 'サワッディー クラップ', '挨拶', 'สวัสดี＝こんにちは＝sà.wàt̚.diː＝サワッディー；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['ありがとう', 'ขอบคุณครับ', 'コープクン クラップ', '挨拶', 'ขอบคุณ＝ありがとう＝kʰɔ̀ːp̚.kʰun＝コープクン；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['これください', 'เอาอันนี้ครับ', 'アオ アンニー クラップ', '買い物', 'เอา＝欲しい・取る＝ʔaw＝アオ；อันนี้＝これ＝ʔan.níː＝アンニー；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['お会計お願いします', 'เช็คบิลด้วยครับ', 'チェックビン ドゥアイ クラップ', 'レストラン', 'เช็คบิล＝お会計＝tɕʰék̚.bin＝チェックビン；ด้วย＝〜をお願い（〜も）＝dûaj＝ドゥアイ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['いくらですか？', 'ราคาเท่าไหร่ครับ', 'ラーカー タオライ クラップ', '買い物', 'ราคา＝値段＝raː.kʰaː＝ラーカー；เท่าไหร่＝いくら＝tʰâw.rài＝タオライ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['すみません', 'ขอโทษครับ', 'コートーッ クラップ', '挨拶', 'ขอโทษ＝すみません・ごめんなさい＝kʰɔ̌ː.tʰôːt̚＝コートーッ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['はい／そうです', 'ใช่ครับ', 'チャイ クラップ', '挨拶', 'ใช่＝そう・はい＝tɕʰâj＝チャイ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['いいえ／違います', 'ไม่ใช่ครับ', 'マイ チャイ クラップ', '挨拶', 'ไม่＝〜ない＝mâj＝マイ；ใช่＝そう＝tɕʰâj＝チャイ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['トイレはどこですか？', 'ห้องน้ำอยู่ที่ไหนครับ', 'ホンナーム ユー ティーナイ クラップ', '移動', 'ห้องน้ำ＝トイレ＝hɔ̂ŋ.náːm＝ホンナーム；อยู่＝ある・いる＝jùː＝ユー；ที่ไหน＝どこ＝tʰîː.nǎj＝ティーナイ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['ここに行きたいです', 'อยากไปที่นี่ครับ', 'ヤーク パイ ティーニー クラップ', '移動', 'อยาก＝〜したい＝jàːk̚＝ヤーク；ไป＝行く＝paj＝パイ；ที่นี่＝ここ＝tʰîː.nîː＝ティーニー；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['チェックインしたいです', 'ขอเช็คอินครับ', 'コー チェックイン クラップ', 'ホテル', 'ขอ＝〜させてください＝kʰɔ̌ː＝コー；เช็คอิน＝チェックイン＝tɕʰék̚.ʔin＝チェックイン；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['辛くしないでください', 'ไม่เผ็ดครับ', 'マイ ペッ クラップ', 'レストラン', 'ไม่＝〜ない＝mâj＝マイ；เผ็ด＝辛い＝pʰèt̚＝ペッ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['水をください', 'ขอน้ำเปล่าครับ', 'コー ナーム プラーオ クラップ', 'レストラン', 'ขอ＝〜をください＝kʰɔ̌ː＝コー；น้ำเปล่า＝水（ふつうの飲み水）＝náːm.plàw＝ナームプラーオ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['少し安くできますか？', 'ลดหน่อยได้ไหมครับ', 'ロッ ノイ ダイ マイ クラップ', '買い物', 'ลด＝安くする・減らす＝lót̚＝ロッ；หน่อย＝少し＝nɔ̀j＝ノイ；ได้ไหม＝できますか＝dâj.mǎj＝ダイマイ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
    ['英語を話せますか？', 'พูดภาษาอังกฤษได้ไหมครับ', 'プーッ パーサー アングリッ ダイ マイ クラップ', '挨拶', 'พูด＝話す＝pʰûːt̚＝プーッ；ภาษาอังกฤษ＝英語＝pʰaː.sǎː.ʔaŋ.krìt̚＝パーサーアングリッ；ได้ไหม＝できますか＝dâj.mǎj＝ダイマイ；ครับ＝（男性の丁寧な語尾）＝kʰráp̚＝クラップ'],
  ];

  // 女性用の初期フレーズ。男性用の語尾 ครับ を、疑問文は คะ、それ以外は ค่ะ に替えたもの
  const SEED_QUESTIONS = ['ราคาเท่าไหร่ครับ', 'ห้องน้ำอยู่ที่ไหนครับ', 'ลดหน่อยได้ไหมครับ', 'พูดภาษาอังกฤษได้ไหมครับ'];
  const SEED_F = SEED.map(([ja, th, kana, cat, wd]) => {
    const end = SEED_QUESTIONS.includes(th) ? 'คะ' : 'ค่ะ';
    return [ja, th.replace(/ครับ$/, end), kana.replace(/クラップ$/, 'カ'),
      cat, wd.replace(/ครับ＝（男性の丁寧な語尾）＝[^＝；]*＝クラップ$/, `${end}＝（女性の丁寧な語尾）＝kʰaʔ＝カ`)];
  });

  const noTone = (t) => String(t || '').normalize('NFD').replace(/[\u0300\u0301\u0302\u030C\u0303]/g, '').normalize('NFC');

  // 単語分解の書式：「タイ語＝和訳＝発音記号＝カタカナ」（発音記号・カタカナは省略可）を ； か改行で区切る
  function parseWords(text) {
    const out = [];
    String(text || '').split(/\r?\n|[;；]/).forEach((part) => {
      const [th = '', ja = '', pron = '', kana = ''] = part.split(/[=＝]/).map((x) => x.trim());
      if (th && ja) out.push({ th, ja, pron: noTone(pron), kana });
    });
    return out;
  }
  const wordsToText = (ws) => (ws || []).map((w) => `${w.th}＝${w.ja}${w.pron || w.kana ? '＝' + noTone(w.pron) : ''}${w.kana ? '＝' + w.kana : ''}`).join('\n');
  let seedWordsCache = null;
  function seedWords() {
    if (!seedWordsCache) { seedWordsCache = {}; SEED.concat(SEED_F).forEach((r) => { seedWordsCache[r[1]] = parseWords(r[4]); }); }
    return seedWordsCache;
  }

  const THAI_RE = /[\u0E00-\u0E7F]/;
  const $view = document.getElementById('view');
  const $toast = document.getElementById('toast');

  /* ---------------- util ---------------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 3200);
  }

  /* ---------------- state / storage ---------------- */
  const defaultSettings = () => ({ rate: 0.7, repeat: 1, autoplay: false, voiceURI: '', pronMode: 'ipa', speaker: 'male' });

  function normalize(s) {
    const out = {
      phrases: [],
      settings: Object.assign(defaultSettings(), s.settings || {}),
      today: s.today && s.today.date ? s.today : { date: localDate(), reviewed: 0 },
    };
    (s.phrases || []).forEach((p) => {
      if (!p || !p.ja || !p.th) return;
      out.phrases.push({
        id: p.id || uid(),
        ja: String(p.ja), th: String(p.th),
        kana: String(p.kana || ''), cat: String(p.cat || 'その他'),
        learned: !!p.learned,
        seen: Number(p.seen) || 0, hit: Number(p.hit) || 0, miss: Number(p.miss) || 0,
        last: String(p.last || ''), learnedAt: String(p.learnedAt || ''),
        // 単語分解。未設定でタイ語が初期フレーズと同じなら、初期の分解を補う
        words: cleanWords(p.words, p.th),
      });
    });
    return out;
  }
  // 単語分解の読み込み。未設定、またはカタカナ無しの旧い初期分解なら、初期データの分解で補う
  function cleanWords(arr, th) {
    const seed = seedWords()[th] || [];
    if (!Array.isArray(arr)) return seed;
    const ws = arr.filter((w) => w && w.th && w.ja).map((w) => ({ th: String(w.th), ja: String(w.ja), pron: noTone(w.pron), kana: String(w.kana || '') }));
    const sameAsSeed = seed.length && ws.length === seed.length && ws.every((w, i) => w.th === seed[i].th);
    if (sameAsSeed && ws.every((w) => !w.pron)) return seed;
    return ws;
  }
  function seedState(speaker) {
    const rows = speaker === 'female' ? SEED_F : SEED;
    return normalize({
      phrases: rows.map(([ja, th, kana, cat, wd]) => ({ ja, th, kana, cat, words: parseWords(wd) })),
      settings: { speaker: speaker === 'female' ? 'female' : 'male' },
    });
  }
  let firstRun = false; // 保存データがないとき（初回）は、最初に話し手を選んでもらう
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); if (s && Array.isArray(s.phrases)) return normalize(s); }
    } catch (e) { /* 壊れたデータは初期値に戻す */ }
    firstRun = true;
    return seedState();
  }
  let state = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast('保存に失敗しました。ブラウザの容量や設定を確認してください'); }
  }
  function today() {
    const d = localDate();
    if (state.today.date !== d) state.today = { date: d, reviewed: 0 };
    return state.today;
  }

  let currentView = 'home';
  let flash = { queue: [], i: 0, shown: false, mode: 'all' };
  let listUI = { q: '', cat: '' };
  let editingId = null;
  let appVer = '';

  /* ---------------- TTS (Web Speech API) ---------------- */
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let thVoices = [];
  let token = 0;
  let playingId = null;
  let keepUtt = null; // 一部ブラウザでの GC による再生中断対策

  function refreshVoices() {
    if (!synth) { thVoices = []; return; }
    const all = synth.getVoices() || [];
    thVoices = all.filter((v) => /^th([-_]|$)/i.test(v.lang));
    if (state && currentView === 'settings') render();
    else updateVoiceDim();
  }
  function pickVoice() {
    if (!thVoices.length) return null;
    const saved = state.settings.voiceURI;
    return thVoices.find((v) => v.voiceURI === saved)
      || thVoices.find((v) => /premium|enhanced|kanya|narisa/i.test(v.name))
      || thVoices[0];
  }
  function updateVoiceDim() {
    $view.classList.toggle('dim', !thVoices.length);
    const b = document.getElementById('voice-banner');
    if (b) b.hidden = thVoices.length > 0;
  }
  function updatePlayingUI() {
    document.querySelectorAll('[data-action="speak"]').forEach((b) => {
      const on = b.dataset.id === playingId;
      b.classList.toggle('playing', on);
      b.setAttribute('aria-label', on ? '停止' : 'タイ語を再生');
    });
    document.querySelectorAll('[data-action="speakWord"]').forEach((b) => b.classList.toggle('playing', b.dataset.id === playingId));
  }
  function stop() {
    token++;
    keepUtt = null;
    if (synth) synth.cancel();
    playingId = null;
    updatePlayingUI();
  }
  function speak(text, id) {
    if (!synth) { toast('このブラウザは音声合成に対応していません'); return; }
    if (!thVoices.length) refreshVoices();
    const voice = pickVoice();
    if (!voice) {
      toast('タイ語の音声がこの端末にありません（設定画面で確認方法を見られます）');
      return; // 他言語の音声では絶対に読み上げない
    }
    if (playingId === id && playingId !== null) { stop(); return; } // 再生中にもう一度押すと停止
    const busy = synth.speaking || synth.pending;
    stop();
    const my = ++token;
    playingId = id;
    updatePlayingUI();
    const times = Number(state.settings.repeat) || 1;
    let n = 0;
    const finish = () => { if (my !== token) return; keepUtt = null; playingId = null; updatePlayingUI(); };
    const run = () => {
      if (my !== token) return;
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = 'th-TH';
      u.rate = Number(state.settings.rate) || 1;
      u.onend = () => {
        if (my !== token) return;
        n++;
        if (n < times) setTimeout(run, 500); else finish();
      };
      u.onerror = (e) => {
        if (my !== token) return;
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        finish();
        toast('音声の再生に失敗しました（' + (e.error || 'unknown') + '）');
      };
      keepUtt = u;
      synth.speak(u);
    };
    // iPhone Safari は cancel 直後の speak が無視されることがあるので、
    // 何も再生していないときは即時（ユーザー操作の中で）、再生中だった場合のみ少し待つ
    if (busy) setTimeout(run, 120); else run();
  }

  if (synth) {
    refreshVoices();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refreshVoices);
    else synth.onvoiceschanged = refreshVoices;
    // iOS は voiceschanged が来ないことがあるため再取得
    setTimeout(refreshVoices, 500);
    setTimeout(refreshVoices, 1500);
  }

  const ICON = `<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg><svg class="i-stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;
  const spk = (id, small) => `<button class="spk${small ? ' sm' : ''}" data-action="speak" data-id="${esc(id)}" aria-label="タイ語を再生">${ICON}</button>`;
  const banner = () => `<div id="voice-banner" class="banner" ${thVoices.length ? 'hidden' : ''}>この端末ではタイ語の音声が見つかりません。他の言語で読み上げることはしません。設定画面の「音声が出ないとき」を確認してください。</div>`;

  /* ---------------- views ---------------- */
  const byId = (id) => state.phrases.find((p) => p.id === id);
  const categories = () => {
    const set = new Set(DEFAULT_CATS);
    state.phrases.forEach((p) => set.add(p.cat));
    return [...set];
  };

  function go(view) {
    stop();
    if (view !== 'bulk') { bulkResult = ''; }
    reportText = '';
    aiPrompt = '';
    currentView = view;
    render();
    window.scrollTo(0, 0);
  }

  function vSetup() {
    return `
      <h1>はじめに</h1>
      <p class="sub">タイ語は、話す人の性別で文末の言い方が変わります（男性は ครับ、女性は ค่ะ・คะ）。あなたの言い方を選んでください。最初に入るフレーズが、その言い方になります。</p>
      <div class="stack">
        <button class="btn primary" data-action="setup" data-v="male">男性の言い方（ครับ）</button>
        <button class="btn primary" data-action="setup" data-v="female">女性の言い方（ค่ะ・คะ）</button>
      </div>
      <p class="sub" style="margin-top:16px">あとから設定画面で変えられます。ただし、すでに入っているフレーズの語尾は変わりません。</p>`;
  }

  function render() {
    const tabbar = document.querySelector('.tabbar');
    if (tabbar) tabbar.style.display = firstRun ? 'none' : '';
    if (firstRun) { $view.innerHTML = vSetup(); return; }
    const fn = { home: vHome, flash: vFlash, list: vList, form: vForm, bulk: vBulk, settings: vSettings }[currentView] || vHome;
    $view.innerHTML = fn();
    const tab = (currentView === 'form' || currentView === 'bulk') ? 'list' : currentView;
    document.querySelectorAll('.tabbar button').forEach((b) => {
      if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $view.classList.toggle('dim', !thVoices.length);
    updatePlayingUI();
  }

  function vHome() {
    const total = state.phrases.length;
    const learned = state.phrases.filter((p) => p.learned).length;
    const rest = total - learned;
    const pct = total ? Math.round((learned / total) * 100) : 0;
    return `
      <h1>タイ語マイフレーズ</h1>
      ${banner()}
      <div class="stats">
        <div class="stat"><b>${today().reviewed}</b><span>今日見たカード</span></div>
        <div class="stat"><b>${learned}</b><span>覚えた</span></div>
        <div class="stat"><b>${rest}</b><span>まだ</span></div>
      </div>
      <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      <div class="stack">
        <button class="btn primary" data-action="startFlash" data-mode="all">フラッシュカードを始める</button>
        <button class="btn" data-action="startFlash" data-mode="unlearned">まだのカードだけ復習（${rest}）</button>
        <button class="btn" data-action="nav" data-view="list">フレーズ一覧</button>
        <button class="btn" data-action="nav" data-view="bulk">まとめて追加（AIで作る）</button>
        <button class="btn" data-action="add">手動でフレーズを追加</button>
      </div>`;
  }

  /* --- flashcard --- */
  function startFlash(mode) {
    const list = mode === 'unlearned' ? state.phrases.filter((p) => !p.learned) : state.phrases.slice();
    flash = { queue: list.map((p) => p.id), i: 0, shown: false, mode };
    stop();
    currentView = 'flash';
    if (!list.length) {
      render();
      return;
    }
    render();
    window.scrollTo(0, 0);
  }
  function vFlash() {
    const q = flash.queue.filter((id) => byId(id));
    flash.queue = q;
    const modeSeg = `
      <div class="mode-row">
        <div class="seg" role="group" aria-label="出題範囲">
          <button data-action="startFlash" data-mode="all" aria-pressed="${flash.mode === 'all'}">すべて</button>
          <button data-action="startFlash" data-mode="unlearned" aria-pressed="${flash.mode === 'unlearned'}">まだだけ</button>
        </div>
        <button class="btn small" data-action="shuffle" style="margin-left:auto">シャッフル</button>
      </div>`;
    if (!q.length) {
      return `<h1>カード</h1>${modeSeg}<div class="empty">${flash.mode === 'unlearned' ? 'まだのカードはありません。全部覚えました。' : 'フレーズがありません。'}</div>`;
    }
    if (flash.i >= q.length) {
      const learned = q.filter((id) => byId(id).learned).length;
      return `<h1>カード</h1>${modeSeg}
        <div class="card"><div class="ja">最後まで終わりました</div><div class="hint">覚えた ${learned} / ${q.length}</div></div>
        <div class="stack" style="margin-top:12px">
          <button class="btn primary" data-action="startFlash" data-mode="unlearned">まだのカードだけ復習</button>
          <button class="btn" data-action="startFlash" data-mode="all">最初からやり直す</button>
        </div>`;
    }
    const p = byId(q[flash.i]);
    const face = flash.shown
      ? `${p.words && p.words.length ? wordsHTML(p) : `<div class="thai" lang="th">${esc(p.th)}</div>${p.kana ? `<div class="kana">${esc(p.kana)}</div>` : ''}`}
         <div class="hint">${esc(p.ja)}</div>
         ${spk(p.id)}`
      : `<div class="ja">${esc(p.ja)}</div><div class="hint">タップでタイ語を表示</div>`;
    return `
      ${banner()}
      ${modeSeg}
      <div class="progress"><b>${flash.i + 1} / ${q.length}</b><span class="sub">${esc(p.cat)}${p.learned ? '・覚えた' : ''}</span></div>
      <div class="card${p.learned ? ' known' : ''}" data-action="flip" role="button" tabindex="0" aria-label="カードをめくる">${face}</div>
      <div class="nav-row">
        <button class="btn" data-action="prev" ${flash.i === 0 ? 'disabled' : ''}>前へ</button>
        <button class="btn" data-action="flip">${flash.shown ? '隠す' : '答え'}</button>
        <button class="btn" data-action="next" ${flash.i >= q.length - 1 ? 'disabled' : ''}>次へ</button>
      </div>
      <div class="row">
        <button class="btn" data-action="mark" data-v="no">まだ</button>
        <button class="btn ok" data-action="mark" data-v="yes">覚えた</button>
      </div>`;
  }
  function wordsHTML(p) {
    if (!p.words || !p.words.length) return '';
    const pm = state.settings.pronMode || 'ipa';
    const pron = (w) => (pm === 'both' ? [noTone(w.pron), w.kana] : pm === 'kana' ? [w.kana || noTone(w.pron)] : [noTone(w.pron) || w.kana])
      .filter(Boolean).map((t) => `<i>${esc(t)}</i>`).join('');
    return `<div class="words">${p.words.map((w, i) => `<button class="w" data-action="speakWord" data-id="${esc(p.id)}#${i}" aria-label="${esc(w.th)}を再生"><b lang="th">${esc(w.th)}</b>${pron(w)}<span>${esc(w.ja)}</span></button>`).join('')}</div>`;
  }
  function flashStep(d) {
    stop();
    flash.i = Math.max(0, Math.min(flash.queue.length, flash.i + d));
    flash.shown = false;
    render();
  }

  /* --- list --- */
  function filtered() {
    const q = listUI.q.trim().toLowerCase();
    return state.phrases.filter((p) => {
      if (listUI.cat && p.cat !== listUI.cat) return false;
      if (!q) return true;
      return [p.ja, p.th, p.kana, p.cat].some((s) => s.toLowerCase().includes(q));
    });
  }
  function itemsHTML() {
    const items = filtered();
    if (!items.length) return '<div class="empty">該当するフレーズがありません</div>';
    return items.map((p) => `
      <div class="item${p.learned ? ' known' : ''}">
        <div>
          <div class="ja">${esc(p.ja)}</div>
          <div class="thai" lang="th">${esc(p.th)}</div>
          ${p.kana ? `<div class="kana">${esc(p.kana)}</div>` : ''}
          ${p.words && p.words.length ? `<div class="wline">${p.words.map((w) => `<span><span lang="th">${esc(w.th)}</span>＝${esc(w.ja)}</span>`).join('')}</div>` : ''}
        </div>
        ${spk(p.id, true)}
        <div class="tools">
          <span class="tag">${esc(p.cat)}</span>
          <button class="btn small" data-action="toggleLearned" data-id="${esc(p.id)}" aria-pressed="${p.learned}">${p.learned ? '覚えた ✓' : 'まだ'}</button>
          <button class="btn small" data-action="edit" data-id="${esc(p.id)}">編集</button>
          <button class="btn small danger" data-action="del" data-id="${esc(p.id)}">削除</button>
        </div>
      </div>`).join('');
  }
  function vList() {
    const chips = ['', ...categories()].map((c) =>
      `<button class="chip" data-action="cat" data-cat="${esc(c)}" aria-pressed="${listUI.cat === c}">${c ? esc(c) : 'すべて'}</button>`).join('');
    return `
      <h1>フレーズ一覧</h1>
      ${banner()}
      <input id="q" class="search" type="search" placeholder="日本語・タイ語・カタカナで検索" value="${esc(listUI.q)}" autocomplete="off">
      <div class="chips">${chips}</div>
      <div id="items">${itemsHTML()}</div>
      <div class="stack" style="margin-top:8px">
        <button class="btn primary" data-action="nav" data-view="bulk">まとめて追加（AIで作る）</button>
        <button class="btn" data-action="add">手動でフレーズを追加</button>
      </div>`;
  }

  /* --- form --- */
  function vForm() {
    const p = editingId ? byId(editingId) : null;
    const dl = categories().map((c) => `<option value="${esc(c)}">`).join('');
    return `
      <h1>${p ? 'フレーズを編集' : 'フレーズを追加'}</h1>
      <label class="field">日本語訳<input id="f-ja" value="${esc(p?.ja)}" autocomplete="off"></label>
      <label class="field">タイ語表記（この文字だけが読み上げられます）<input id="f-th" lang="th" class="th" value="${esc(p?.th)}" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
      <label class="field">カタカナ発音（任意）<input id="f-kana" value="${esc(p?.kana)}" autocomplete="off"></label>
      <label class="field">単語の分解（任意）<textarea id="f-words" placeholder="1行に1語：タイ語＝和訳＝発音記号＝カタカナ（後ろ2つは省略可）&#10;例）ขอ＝〜をください＝kʰɔː">${esc(wordsToText(p?.words))}</textarea></label>
      <label class="field">カテゴリー<input id="f-cat" list="cats" value="${esc(p?.cat || '挨拶')}" autocomplete="off"><datalist id="cats">${dl}</datalist></label>
      <div class="row">
        <button class="btn" data-action="nav" data-view="list">キャンセル</button>
        <button class="btn primary" data-action="saveForm">保存</button>
      </div>`;
  }
  function saveForm() {
    const ja = document.getElementById('f-ja').value.trim();
    const th = document.getElementById('f-th').value.trim();
    const kana = document.getElementById('f-kana').value.trim();
    const cat = document.getElementById('f-cat').value.trim() || 'その他';
    const words = parseWords(document.getElementById('f-words').value);
    if (!ja) return toast('日本語訳を入力してください');
    if (!th) return toast('タイ語表記を入力してください');
    if (!THAI_RE.test(th)) return toast('タイ語表記にタイ文字が含まれていません');
    if (editingId) {
      Object.assign(byId(editingId), { ja, th, kana, cat, words });
    } else {
      state.phrases.push({ id: uid(), ja, th, kana, cat, words, learned: false });
    }
    save();
    toast('保存しました');
    editingId = null;
    go('list');
  }


  /* --- bulk add --- */
  let bulkText = '';
  let bulkResult = '';
  let aiScene = '', aiCount = 10, aiPrompt = '';
  const segHTML = (action, name, vals, cur, fmt) => `<div class="seg" role="group">${vals.map((v) =>
    `<button data-action="${action}" data-k="${name}" data-v="${v}" aria-pressed="${String(cur) === String(v)}">${fmt(v)}</button>`).join('')}</div>`;
  // 話し手（男性 ครับ／女性 ค่ะ・คะ）に合わせた、AIへの指定と書式の例
  const SPEAKER = {
    male: {
      ask: '男性が丁寧に話す形にしてください（文末は ครับ）。',
      end: 'ครับ＝（男性の丁寧な語尾）＝kʰrap̚＝クラップ',
      ex: 'メニューをください｜ขอเมนูครับ｜コー メーヌー クラップ｜レストラン｜ขอ＝〜をください＝kʰɔː＝コー；เมนู＝メニュー＝meː.nuː＝メーヌー；ครับ＝（男性の丁寧な語尾）＝kʰrap̚＝クラップ',
    },
    female: {
      ask: '女性が丁寧に話す形にしてください（平叙文・お願いの文末は ค่ะ、疑問文の文末は คะ）。',
      end: 'ค่ะ＝（女性の丁寧な語尾）＝kʰaʔ＝カ',
      ex: 'メニューをください｜ขอเมนูค่ะ｜コー メーヌー カ｜レストラン｜ขอ＝〜をください＝kʰɔː＝コー；เมนู＝メニュー＝meː.nuː＝メーヌー；ค่ะ＝（女性の丁寧な語尾）＝kʰaʔ＝カ',
    },
  };
  const speakerOf = () => SPEAKER[state.settings.speaker] || SPEAKER.male;
  // 「まとめて追加」に貼る前提の、AIへの依頼文
  function buildPhrasePrompt(scene, n) {
    const sp = speakerOf();
    // 参考として、登録済みのフレーズ（覚えた／まだ）を載せる。長くなりすぎないよう各50件まで
    const LIMIT = 50;
    const refs = (title, list) => {
      if (!list.length) return [];
      const shown = list.slice(0, LIMIT).map((p) => `- ${p.ja}｜${p.th}`);
      if (list.length > LIMIT) shown.push(`- ほか${list.length - LIMIT}件`);
      return ['', title, ...shown];
    };
    const known = state.phrases.filter((p) => p.learned).sort((a, b) => (b.learnedAt || '').localeCompare(a.learnedAt || ''));
    const rest = state.phrases.filter((p) => !p.learned);
    return [
      'タイ語の旅行フレーズ帳アプリに追加するフレーズを作ってください。',
      '',
      `【場面】${scene}`,
      `【件数】${n}個`,
      `【話し手】${sp.ask}`,
      `【既存のカテゴリー】${categories().join('、')}（できるだけこの中から選び、合わなければ新しく作ってよい）`,
      '',
      '【出力の書式】',
      '- コードブロック1つだけに入れて、1行1フレーズで出してください。コードブロックの中には、番号・箇条書き記号・見出し・説明文を入れないでください。',
      '- 1行の形式：日本語｜タイ語｜カタカナ｜カテゴリー｜単語分解',
      '- 区切りは全角の縦線「｜」です。',
      '- カタカナは、語の間を半角スペースで区切ってください。',
      '- 単語分解は、フレーズを先頭から順に「タイ語＝和訳＝発音記号＝カタカナ」を全角の「；」でつないでください。発音記号はIPAで、声調記号は付けないでください（長音「ː」と無開放「̚」は付けてよい）。',
      '',
      '例：',
      sp.ex,
      '',
      '【内容の条件】',
      '- 旅行者がそのまま使える、短く自然な表現にしてください。',
      '- 下の「登録済み」のフレーズと、同じ内容のものは作らないでください。',
      '- 「覚えたフレーズ」は、今の難しさの目安です。同じくらい、または少しだけ難しい表現にしてください。',
      '- 声調・綴り・和訳に自信がないものは、コードブロックの外に、どのフレーズか書いてください。自信があるふりをしないでください。',
      ...refs('【登録済み：覚えたフレーズ（新しい順）】', known),
      ...refs('【登録済み：まだ覚えていないフレーズ】', rest),
    ].join('\n');
  }
  function vBulk() {
    const s = state.settings;
    return `
      <h1>まとめて追加</h1>
      <h2>① AIに作ってもらう</h2>
      <p class="sub">場面を入れて、AIに送る文章をコピーします。ChatGPTやClaudeなど、お使いのAIのチャットに貼り付けてください。</p>
      <label class="field">どんな場面のフレーズ？<input id="ai-scene" value="${esc(aiScene)}" placeholder="例：美容院、歯医者、タクシー、友だちとの会話" autocomplete="off"></label>
      <div class="setting"><span>件数</span><div class="seg" role="group">${[10, 20, 30].map((v) =>
        `<button data-action="aiCount" data-v="${v}" aria-pressed="${aiCount === v}">${v}個</button>`).join('')}</div></div>
      <div class="setting"><span>話し手</span>${segHTML('set', 'speaker', ['male', 'female'], s.speaker || 'male', (v) => ({ male: '男性（ครับ）', female: '女性（ค่ะ）' }[v]))}</div>
      <div class="stack" style="margin-top:12px">
        <button class="btn primary" data-action="copyPrompt">AIに送る文章をコピー</button>
        ${aiPrompt ? `<label class="field" style="margin:0">コピーできなかったときは、全選択してコピーしてください<textarea id="ai-prompt" readonly style="min-height:160px">${esc(aiPrompt)}</textarea></label>` : ''}
      </div>

      <h2>② AIの答えを貼り付ける</h2>
      <p class="sub">AIが出したコードブロックの中身を、そのまま貼り付けてください。番号や「-」、コードブロックの線が付いていても読み取ります。すでに登録済みのフレーズは追加されません。</p>
      <label class="field">フレーズ<textarea id="bulk-text" style="min-height:220px" placeholder="ここに貼り付け">${esc(bulkText)}</textarea></label>
      <label class="field">カテゴリー未指定の行に使う名前<input id="bulk-cat" value="その他" autocomplete="off"></label>
      <div class="row">
        <button class="btn" data-action="nav" data-view="list">戻る</button>
        <button class="btn primary" data-action="bulkAdd">追加する</button>
      </div>
      ${bulkResult ? `<div class="note" style="margin-top:12px">${bulkResult}</div>` : ''}

      <details style="margin-top:20px">
        <summary>書式の詳細（手で書くとき）</summary>
        <p class="sub">1行に1フレーズ。<b>日本語｜タイ語｜カタカナ｜カテゴリー｜単語分解</b> の順に、縦線（｜ または |）かタブで区切ります。カタカナ以降は省略できます。単語分解は「タイ語＝和訳＝発音記号＝カタカナ」を ； でつなぎます（発音記号とカタカナは省略可）。</p>
        <div class="note" lang="th"><span lang="ja">例：</span><br>${esc(SPEAKER.male.ex)}<br>おいしい｜อร่อยครับ</div>
      </details>`;
  }
  // AIの出力に混ざりやすい飾り（コードブロックの線・番号・箇条書き・表の枠線）を取り除く。空文字なら読み飛ばす行
  function cleanBulkLine(line) {
    let t = line.trim();
    if (!t || /^```/.test(t) || /^\|?\s*:?-{2,}/.test(t)) return '';
    t = t.replace(/^(?:[-*・•]\s+|\d+[.)．、]\s*)/, '').replace(/^[|｜]\s*/, '').replace(/\s*[|｜]$/, '');
    return t;
  }
  function bulkAdd() {
    const text = document.getElementById('bulk-text').value;
    const defCat = document.getElementById('bulk-cat').value.trim() || 'その他';
    const existing = new Set(state.phrases.map((p) => p.th.replace(/\s+/g, '')));
    let added = 0;
    const skipped = [];
    const retry = []; // 書式の誤りで追加できなかった行だけ残す
    text.split(/\r?\n/).forEach((raw, i) => {
      const line = cleanBulkLine(raw);
      if (!line) return;
      const [ja = '', th = '', kana = '', cat = '', wd = ''] = line.split(/\t|\s*[|｜]\s*/).map((x) => x.trim());
      const n = i + 1;
      if (ja === '日本語' && /タイ語/.test(th)) return; // 表の見出し行
      if (!ja || !th) { retry.push(line); return skipped.push(`${n}行目：日本語かタイ語が空です`); }
      if (!THAI_RE.test(th)) { retry.push(line); return skipped.push(`${n}行目：タイ語の欄にタイ文字がありません`); }
      const key = th.replace(/\s+/g, '');
      if (existing.has(key)) return skipped.push(`${n}行目：すでに登録済みです`);
      existing.add(key);
      state.phrases.push({ id: uid(), ja, th, kana, cat: cat || defCat, words: parseWords(wd), learned: false });
      added++;
    });
    if (added) save();
    // 追加できなかった行だけ残して、直してやり直せるようにする
    bulkResult = `<b>${added}件を追加しました。</b>` + (skipped.length ? `<br>追加しなかった行（${skipped.length}件）：<br>${skipped.map(esc).join('<br>')}` : '');
    bulkText = retry.join('\n');
    render();
    toast(added ? `${added}件を追加しました` : '追加できる行がありませんでした');
  }

  /* --- AI用の学習状況レポート --- */
  let reportText = '';
  function buildReport() {
    const ps = state.phrases;
    const n = (p) => p.seen || 0, m = (p) => p.miss || 0;
    const md = (d) => (d ? d.slice(5).replace('-', '/') : '');
    const known = ps.filter((p) => p.learned);
    const weak = ps.filter((p) => !p.learned && n(p) > 0).sort((a, b) => m(b) - m(a) || n(b) - n(a));
    const fresh = ps.filter((p) => !p.learned && n(p) === 0);
    const L = [];
    L.push(`【タイ語学習状況】${localDate()} 時点`);
    L.push(`登録 ${ps.length}件 / 覚えた ${known.length}件 / まだ ${ps.length - known.length}件（うち未学習 ${fresh.length}件）`);
    L.push('');
    L.push('■ カテゴリー別（覚えた/全体）');
    categories().forEach((c) => {
      const all = ps.filter((p) => p.cat === c);
      if (all.length) L.push(`- ${c}: ${all.filter((p) => p.learned).length}/${all.length}`);
    });
    L.push('');
    L.push('■ 苦手（見たが、まだ覚えていない。まだを押した回数順）');
    L.push(weak.length ? weak.map((p) => `- ${p.ja}｜${p.th}（${p.cat}）見た${n(p)}回・まだ${m(p)}回・最終${md(p.last)}`).join('\n') : '- なし');
    L.push('');
    L.push('■ 覚えた');
    L.push(known.length ? known.map((p) => `- ${p.ja}｜${p.th}（${p.cat}）${p.learnedAt ? '覚えた日' + md(p.learnedAt) : ''}・見た${n(p)}回・まだ${m(p)}回`).join('\n') : '- なし');
    L.push('');
    L.push('■ 未学習（一度も見ていない）');
    L.push(fresh.length ? fresh.map((p) => `- ${p.ja}｜${p.th}（${p.cat}）`).join('\n') : '- なし');
    L.push('');
    L.push('【依頼】上の状況をもとに、次に学ぶべきフレーズを10個提案してください。');
    L.push('- 苦手なフレーズは、覚え方のコツも添えてください。');
    L.push('- 新しいフレーズは「日本語｜タイ語｜カタカナ｜カテゴリー｜単語分解」の形式で、1行1フレーズで出してください（アプリの「まとめて追加」に貼るため）。単語分解は「タイ語＝和訳＝発音記号」を ； でつないでください（例：ขอ＝〜をください＝kʰɔː；น้ำเปล่า＝水＝naːm.plaw；ครับ＝丁寧な語尾＝kʰrap̚）。発音記号はIPAで、声調記号は付けないでください。');
    L.push('- ' + speakerOf().ask);
    L.push('- 声調や自然さに自信がないものは、そう書いてください。');
    return L.join('\n');
  }

  /* --- settings --- */
  function vSettings() {
    const s = state.settings;
    const seg = (name, vals, cur, fmt) => segHTML('set', name, vals, cur, fmt);
    const voiceSel = thVoices.length > 1
      ? `<label class="field">タイ語の音声<select data-setting="voiceURI">${thVoices.map((v) =>
        `<option value="${esc(v.voiceURI)}" ${pickVoice() === v ? 'selected' : ''}>${esc(v.name)}（${esc(v.lang)}）</option>`).join('')}</select></label>`
      : '';
    const status = thVoices.length
      ? `<div class="note">使用する音声：<b>${esc(pickVoice().name)}</b>（${esc(pickVoice().lang)}）</div>`
      : `<div class="banner">この端末ではタイ語の音声が見つかりません。</div>`;
    return `
      <h1>設定</h1>
      <h2>音声</h2>
      ${status}
      <div class="setting"><span>再生速度</span>${seg('rate', [0.5, 0.7, 1], s.rate, (v) => v + '倍')}</div>
      <div class="setting"><span>繰り返し</span>${seg('repeat', [1, 3], s.repeat, (v) => v + '回')}</div>
      <div class="setting"><span>話し手（AIへの依頼文・初期フレーズ）</span>${seg('speaker', ['male', 'female'], s.speaker || 'male', (v) => ({ male: '男性（ครับ）', female: '女性（ค่ะ）' }[v]))}</div>
      <div class="setting"><span>単語の発音表示</span>${seg('pronMode', ['ipa', 'kana', 'both'], s.pronMode, (v) => ({ ipa: '発音記号', kana: 'カタカナ', both: '両方' }[v]))}</div>
      <label class="check"><input type="checkbox" data-setting="autoplay" ${s.autoplay ? 'checked' : ''}>カードをめくったとき自動で再生</label>
      ${voiceSel}
      <div class="row" style="align-items:center">
        <span class="th" lang="th" style="font-size:22px">สวัสดีครับ</span>
        ${spk('test')}
      </div>

      <h2>音声が出ないとき</h2>
      <div class="note"><ol>
        <li>iPhoneのマナーモード（消音スイッチ）をオフにして、音量を上げる。</li>
        <li>設定 → アクセシビリティ → 読み上げコンテンツ → 声 → タイ語 で音声（Kanya など）をダウンロードする。</li>
        <li>Safariのタブを閉じて開き直し、この画面でテスト再生を押す。</li>
        <li>上に「見つかりません」と出続ける場合は、タイ語の音声が未導入です。</li>
      </ol></div>

      <h2>AIに学習状況を渡す</h2>
      <p class="sub">覚えた・まだの記録をまとめた文章をコピーします。Claudeのチャットに貼ると、次に学ぶフレーズを提案してもらえます。</p>
      <div class="stack">
        <button class="btn primary" data-action="copyReport">学習状況をコピー</button>
        ${reportText ? `<label class="field" style="margin:0">コピーできなかったときは、全選択してコピーしてください<textarea id="report-text" readonly style="min-height:160px">${esc(reportText)}</textarea></label>` : ''}
      </div>

      <h2>バックアップ</h2>
      <p class="sub">ブラウザのデータを消すと学習記録も消えます。ときどき書き出してください。</p>
      <div class="stack">
        <button class="btn" data-action="export">JSONファイルとして書き出す</button>
        <button class="btn" data-action="copyExport">JSONをクリップボードにコピー</button>
        <label class="btn" style="cursor:pointer">ファイルから復元<input id="import-file" type="file" accept="application/json,.json" hidden></label>
        <label class="field" style="margin:0">貼り付けて復元<textarea id="import-text" placeholder="コピーしたJSONをここに貼り付け"></textarea></label>
        <button class="btn" data-action="importText">貼り付けた内容で復元</button>
        <button class="btn danger" data-action="reset">初期の15フレーズに戻す</button>
      </div>
      <p class="sub" style="margin-top:20px">アプリのバージョン：<span id="app-ver">${esc(appVer || '確認中…')}</span></p>`;
  }

  /* ---------------- backup ---------------- */
  const exportJSON = () => JSON.stringify({ app: 'thai-my-phrases', version: 1, exportedAt: new Date().toISOString(), phrases: state.phrases, settings: state.settings }, null, 2);
  function importJSON(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { return toast('JSONとして読み込めませんでした'); }
    if (!data || !Array.isArray(data.phrases)) return toast('このアプリのバックアップではありません');
    const next = normalize({ phrases: data.phrases, settings: data.settings, today: state.today });
    if (!next.phrases.length) return toast('フレーズが1件も含まれていません');
    if (!confirm(`現在のデータを、バックアップの ${next.phrases.length} 件で置き換えます。よろしいですか？`)) return;
    state = next;
    save();
    toast('復元しました');
    go('list');
  }

  /* ---------------- events ---------------- */
  const ACTIONS = {
    nav: (el) => go(el.dataset.view),
    startFlash: (el) => startFlash(el.dataset.mode),
    flip: () => {
      if (!flash.queue.length || flash.i >= flash.queue.length) return;
      flash.shown = !flash.shown;
      render();
      if (flash.shown && state.settings.autoplay) { const p = byId(flash.queue[flash.i]); if (p) speak(p.th, p.id); }
    },
    prev: () => flashStep(-1),
    next: () => flashStep(1),
    shuffle: () => {
      const a = flash.queue;
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      flash.i = 0; flash.shown = false; stop(); render();
    },
    mark: (el) => {
      const p = byId(flash.queue[flash.i]);
      if (!p) return;
      const yes = el.dataset.v === 'yes';
      p.learned = yes;
      p.seen = (p.seen || 0) + 1;
      if (yes) { p.hit = (p.hit || 0) + 1; if (!p.learnedAt) p.learnedAt = localDate(); } else { p.miss = (p.miss || 0) + 1; }
      p.last = localDate();
      today().reviewed++;
      save();
      flashStep(1);
    },
    speak: (el) => {
      const id = el.dataset.id;
      if (id === 'test') return speak('สวัสดีครับ', 'test');
      const p = byId(id);
      if (p) speak(p.th, p.id);
    },
    // 単語の枠をタップ：その単語だけ読み上げる（読み上げは speak() を通す）
    speakWord: (el) => {
      const [pid, i] = el.dataset.id.split('#');
      const p = byId(pid);
      const w = p && p.words && p.words[Number(i)];
      if (w) speak(w.th, el.dataset.id);
    },
    cat: (el) => { listUI.cat = el.dataset.cat; render(); },
    toggleLearned: (el) => { const p = byId(el.dataset.id); if (p) { p.learned = !p.learned; if (p.learned && !p.learnedAt) p.learnedAt = localDate(); save(); document.getElementById('items').innerHTML = itemsHTML(); updatePlayingUI(); } },
    add: () => { editingId = null; go('form'); },
    edit: (el) => { editingId = el.dataset.id; go('form'); },
    del: (el) => {
      const p = byId(el.dataset.id);
      if (p && confirm(`「${p.ja}」を削除しますか？`)) { stop(); state.phrases = state.phrases.filter((x) => x.id !== p.id); save(); render(); }
    },
    saveForm,
    bulkAdd,
    set: (el) => {
      const v = el.dataset.v;
      state.settings[el.dataset.k] = Number.isNaN(Number(v)) ? v : Number(v);
      save(); render();
    },
    export: () => {
      const blob = new Blob([exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `thai-phrases-${localDate()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('書き出しました（ダウンロードに保存されない場合は「コピー」を使ってください）');
    },
    copyExport: async () => {
      try { await navigator.clipboard.writeText(exportJSON()); toast('コピーしました。メモアプリなどに貼り付けて保管してください'); }
      catch (e) { toast('コピーに失敗しました'); }
    },
    copyReport: async () => {
      const text = buildReport();
      try { await navigator.clipboard.writeText(text); reportText = ''; toast('コピーしました。Claudeのチャットに貼り付けてください'); }
      catch (e) {
        reportText = text; render();
        const ta = document.getElementById('report-text');
        if (ta) { ta.focus(); ta.select(); }
        toast('自動コピーに失敗しました。下の欄から手動でコピーしてください');
      }
    },
    setup: (el) => { state = seedState(el.dataset.v); firstRun = false; save(); render(); },
    aiCount: (el) => { aiCount = Number(el.dataset.v); render(); },
    copyPrompt: async () => {
      const scene = aiScene.trim();
      if (!scene) { toast('どんな場面か、先に入力してください'); const i = document.getElementById('ai-scene'); if (i) i.focus(); return; }
      const text = buildPhrasePrompt(scene, aiCount);
      try { await navigator.clipboard.writeText(text); aiPrompt = ''; toast('コピーしました。AIのチャットに貼り付けてください'); }
      catch (e) {
        aiPrompt = text; render();
        const ta = document.getElementById('ai-prompt');
        if (ta) { ta.focus(); ta.select(); }
        toast('自動コピーに失敗しました。下の欄から手動でコピーしてください');
      }
    },
    importText: () => importJSON(document.getElementById('import-text').value),
    reset: () => {
      if (confirm('登録したフレーズと学習記録をすべて消して、初期の15フレーズに戻します。よろしいですか？')) {
        stop(); state = seedState(state.settings.speaker); save(); toast('初期状態に戻しました'); render();
      }
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = ACTIONS[el.dataset.action];
    if (fn) fn(el, e);
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card[data-action]')) { e.preventDefault(); ACTIONS.flip(); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'bulk-text') bulkText = e.target.value;
    else if (e.target.id === 'ai-scene') aiScene = e.target.value;
    if (e.target.id === 'q') {
      listUI.q = e.target.value;
      document.getElementById('items').innerHTML = itemsHTML();
      updatePlayingUI();
    }
  });
  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'import-file' && t.files && t.files[0]) {
      const r = new FileReader();
      r.onload = () => importJSON(String(r.result));
      r.readAsText(t.files[0]);
      t.value = '';
    } else if (t.dataset && t.dataset.setting) {
      state.settings[t.dataset.setting] = t.type === 'checkbox' ? t.checked : t.value;
      save();
    }
  });
  window.addEventListener('pagehide', stop);

  /* ---------------- boot ---------------- */
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    // 新しい版に切り替わったら、一度だけ読み込み直して新しい画面にする（学習記録は localStorage にあるので消えない）
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js').then((reg) => reg.update()).catch(() => { /* オフライン対応が使えなくても本体は動く */ });
    // 設定画面に出すバージョン（= 端末に入っているキャッシュ名）
    if (window.caches) {
      caches.keys().then((ks) => {
        appVer = ks.filter((k) => k.startsWith('thai-phrases-')).sort().pop() || '不明';
        const el = document.getElementById('app-ver');
        if (el) el.textContent = appVer;
      }).catch(() => {});
    }
  }
})();
