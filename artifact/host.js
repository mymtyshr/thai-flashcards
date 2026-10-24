/* タイ語マイフレーズ：Claude Artifact 用の差し替え部分（ふつうのブラウザ版では使わない）
   app.js より先に実行し、window.thaiHost を用意する。app.js は、これがあれば
   ・保存先を localStorage ではなく、Claude の db（この人だけが読める領域）にする
   ・AI への質問を、Claude の sample 機能（利用者自身の Claude 利用枠）で行う
   ・ファイルの書き出しを、downloads 機能で行う
   ・確認画面を、confirm() ではなくページ内に出す（Artifact では confirm() が常に「いいえ」になるため） */
(function () {
  'use strict';
  const KEY = 'thai-my-phrases.v1';
  const CHUNK = 40000;   // 1文書あたりの文字数。日本語・タイ語は1文字3バイト前後なので、上限（256KiB）に収まる
  const DEBOUNCE = 700;  // 変更から、保存を始めるまでの待ち（ミリ秒）
  const mem = new Map();
  let db = null, uid = null, lastN = 0, written = [], timer = 0, running = Promise.resolve(), dirty = false;

  const claude = () => window.claude;
  const local = {
    get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* 使えなくてもよい */ } },
  };
  const fail = (message) => window.dispatchEvent(new CustomEvent('thai-save-error', { detail: { message } }));
  const ref = (name) => db.doc('data/users/' + uid + '/' + name);

  // ---- 読み込み：meta → 各チャンクを連結。壊れていたら、この端末に残したコピーを使う
  async function loadFromDb() {
    const meta = await ref('thai-meta').get();
    if (!meta.exists) return null;
    const { n, len } = meta.data();
    const parts = await Promise.all(Array.from({ length: n }, (_, i) => ref('thai-' + i).get()));
    const text = parts.map((p) => (p.exists ? String(p.data().t || '') : '')).join('');
    if (text.length !== len) throw new Error('chunk mismatch');
    JSON.parse(text);
    lastN = n;
    written = parts.map((p) => String(p.data().t || ''));
    return text;
  }

  async function init() {
    try {
      const c = claude();
      if (c) {
        const user = await c.use('user');
        db = await c.use('db');
        uid = user ? await user.id() : null;
        if (!(await c.use('sample'))) window.thaiHost.ask = null; // AIを使えない画面では、自動追加を出さない
      }
    } catch (e) { db = null; }
    let text = null;
    if (db && uid) {
      try { text = await loadFromDb(); }
      catch (e) {
        const copy = local.get(KEY);
        try { if (copy) { JSON.parse(copy); text = copy; dirty = true; schedule(); } } catch (e2) { text = null; }
      }
    } else {
      text = local.get(KEY); // db が使えない（ログインしていない等）ときは、このブラウザにだけ保存する
    }
    if (text != null) mem.set(KEY, text);
  }

  // ---- 保存：変わったチャンクだけ書く → 最後に meta。1回ずつ順番に
  async function flush() {
    if (!dirty) return;
    dirty = false;
    const text = mem.get(KEY) || '';
    local.set(KEY, text); // この端末のコピー（db が読めなかったときの保険）
    if (!(db && uid)) return;
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK) chunks.push(text.slice(i, i + CHUNK));
    try {
      for (let i = 0; i < chunks.length; i++) if (written[i] !== chunks[i]) { await ref('thai-' + i).set({ t: chunks[i] }); written[i] = chunks[i]; }
      await ref('thai-meta').set({ n: chunks.length, len: text.length, savedAt: new Date().toISOString() });
      for (let i = chunks.length; i < lastN; i++) await ref('thai-' + i).delete();
      lastN = chunks.length; written.length = chunks.length;
    } catch (e) {
      dirty = true;
      fail(e && e.code === 'quota_exceeded' ? 'Claude側の保存の上限に達しました。使わないフレーズを減らしてください' : '保存に失敗しました。通信を確認して、もう一度操作してください');
    }
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { running = running.then(flush).catch(() => {}); }, DEBOUNCE);
  }
  const flushNow = () => { clearTimeout(timer); running = running.then(flush).catch(() => {}); return running; };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); });
  window.addEventListener('pagehide', flushNow);

  const storage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => {
      mem.set(k, String(v));
      if (k === KEY) { dirty = true; schedule(); } // 保存するのは学習記録だけ（クラウド連携の設定などは、この版では使わない）
    },
  };

  // ---- AI（sample）
  const askErrors = {
    not_granted: 'AIの利用が許可されませんでした。ページを開き直して、許可してください',
    rate_limited: '利用回数の上限です。しばらくしてから、もう一度試してください',
    session_expired: 'ログインが切れました。ページを開き直してください',
    sampling_disabled: 'このアカウントでは、Claudeを呼び出せません',
    prompt_too_large: '依頼文が長すぎます。登録フレーズが多すぎる可能性があります',
    refused: 'AIがこの依頼を断りました。場面を変えて試してください',
    empty_completion: 'AIの答えが空でした。もう一度試してください',
  };
  async function ask(prompt) {
    const sample = claude() ? await claude().use('sample') : null;
    if (!sample) throw new Error('この画面では、AIを使えません');
    try {
      const r = await sample(prompt, { modelTier: 'default', cache: false });
      return r.text;
    } catch (e) {
      throw new Error(askErrors[e && e.code] || 'AIとの通信に失敗しました。もう一度試してください');
    }
  }

  // ---- ファイルの書き出し（downloads）
  async function download(filename, text) {
    const d = claude() ? await claude().use('downloads') : null;
    if (!d) throw new Error('この画面では、ファイルを保存できません');
    await d.save({ filename, data: text });
  }

  window.thaiHost = { storage, ask: claude() ? ask : null, download, version: 'Claude Artifact版', ready: init() };
})();
