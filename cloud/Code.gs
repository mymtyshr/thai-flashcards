// タイ語マイフレーズ：Googleスプレッドシートへのバックアップ用スクリプト
// 使い方は README.md の「クラウドにバックアップする」を見てください。
//
// 作られるシート
//   backup      … アプリの学習記録（JSON）。復元に使う。消さないこと
//   backup_prev … 前の日までのバックアップ（1世代だけ）。うっかり上書きしたときの保険
//   進捗        … フレーズごとの覚えた・見た回数など。見るだけ（ここを直してもアプリには反映されない）

// ★ ここを、自分だけの合言葉に書き換える（アプリの設定画面にも同じものを入れる）
const SECRET = 'ここを自分だけの合言葉に変える';

const CHUNK = 40000; // 1つのセルに入れられる文字数（5万）の手前で区切る
const SHEET_MAIN = 'backup';
const SHEET_PREV = 'backup_prev';
const SHEET_PROGRESS = '進捗';

function doGet() {
  return out_({ ok: true, message: 'thai-phrases cloud' });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (SECRET === 'ここを自分だけの合言葉に変える') return out_({ ok: false, error: 'スクリプトの SECRET（合言葉）を書き換えてください' });
    if (!req || req.key !== SECRET) return out_({ ok: false, error: '合言葉が違います' });
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      if (req.action === 'ping') return out_(ping_());
      if (req.action === 'save') return out_(save_(req));
      if (req.action === 'load') return out_(load_());
    } finally {
      lock.releaseLock();
    }
    return out_({ ok: false, error: '不明な操作です' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

// 先頭行：['updatedAt', 保存日時, フレーズ数]、2行目以降：JSONを区切ったもの（先頭に 'j' を付ける。数式や数値と誤解されないため）
function readMeta_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_MAIN);
  if (!sh || sh.getLastRow() < 2) return null;
  const head = sh.getRange(1, 1, 1, 3).getValues()[0];
  return { updatedAt: String(head[1] || ''), count: Number(head[2]) || 0 };
}

function ping_() {
  const meta = readMeta_();
  return { ok: true, updatedAt: meta ? meta.updatedAt : '', count: meta ? meta.count : 0 };
}

function save_(req) {
  const data = req.data;
  if (!data || !Array.isArray(data.phrases) || !data.phrases.length) {
    return { ok: false, error: 'フレーズが空のデータは保存しません' };
  }
  const json = JSON.stringify(data);
  const savedAt = String(req.savedAt || new Date().toISOString());
  const main = sheet_(SHEET_MAIN);

  // 日付が変わって最初の保存のときだけ、いまのバックアップを1世代前に退避する
  const before = readMeta_();
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const day = (iso) => (iso ? Utilities.formatDate(new Date(iso), tz, 'yyyy-MM-dd') : '');
  if (before && day(before.updatedAt) && day(before.updatedAt) !== day(savedAt)) {
    const values = main.getDataRange().getValues();
    const prev = sheet_(SHEET_PREV);
    prev.clear();
    prev.getRange(1, 1, values.length, 3).setValues(values.map((r) => [r[0], r[1], r[2]]));
  }

  const rows = [['updatedAt', savedAt, data.phrases.length]];
  for (let i = 0; i < json.length; i += CHUNK) rows.push(['j' + json.slice(i, i + CHUNK), '', '']);
  main.clear();
  main.getRange(1, 1, rows.length, 3).setValues(rows);

  writeProgress_(data, savedAt);
  return { ok: true, updatedAt: savedAt, count: data.phrases.length };
}

function load_() {
  const meta = readMeta_();
  if (!meta) return { ok: true, empty: true };
  const sh = sheet_(SHEET_MAIN);
  const cells = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  const json = cells.map((r) => String(r[0]).slice(1)).join('');
  return { ok: true, updatedAt: meta.updatedAt, count: meta.count, data: JSON.parse(json) };
}

function writeProgress_(data, savedAt) {
  const sh = sheet_(SHEET_PROGRESS);
  const ps = data.phrases;
  const learned = ps.filter((p) => p.learned).length;
  sh.clear();
  sh.getRange(1, 1, 1, 6).setValues([['更新', savedAt, '登録', ps.length, '覚えた', learned]]);
  const head = ['日本語', 'タイ語', 'カテゴリー', '覚えた', '見た回数', '正解', 'まだ', '最終日', '覚えた日'];
  const rows = ps.map((p) => [
    p.ja, p.th, p.cat, p.learned ? '○' : '', Number(p.seen) || 0, Number(p.hit) || 0, Number(p.miss) || 0, p.last || '', p.learnedAt || '',
  ]);
  sh.getRange(3, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  if (rows.length) sh.getRange(4, 1, rows.length, head.length).setValues(rows);
  sh.setFrozenRows(3);
}
